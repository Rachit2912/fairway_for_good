-- Migration: Security, Schema, RLS, and Draw Lifecycle Functions Fix

-- 1. FIX HANDLE_NEW_USER TRIGGER (Never derive role from user metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, charity_percentage)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'charity_percentage')::INTEGER, 10)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

  -- Always assign 'member' role by default. Admin roles must be assigned directly in database.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. SECURE SAVE_USER_SCORE FUNCTION
-- Restricts score updates to auth.uid(), checks entitlement, acquires row lock, and enforces retention rules.
CREATE OR REPLACE FUNCTION public.save_user_score(
  p_round_date DATE,
  p_value INTEGER
)
RETURNS public.scores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_has_active_sub BOOLEAN;
  v_count INTEGER;
  v_oldest_date DATE;
  v_existing_score public.scores;
  v_result public.scores;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to save scores';
  END IF;

  -- Verify active subscription entitlement
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = v_user_id
      AND status IN ('active', 'trialing')
      AND (current_period_end IS NULL OR current_period_end >= NOW())
  ) INTO v_has_active_sub;

  IF NOT v_has_active_sub THEN
    RAISE EXCEPTION 'Active paid subscription required to add or edit scores';
  END IF;

  -- Validate score value range
  IF p_value < 1 OR p_value > 45 THEN
    RAISE EXCEPTION 'Score value must be an integer between 1 and 45';
  END IF;

  -- Validate round date is not in the future
  IF p_round_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Round date cannot be in the future';
  END IF;

  -- Acquire per-user lock to serialize score mutations and prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(v_user_id::text));

  -- Check current score count and oldest round date
  SELECT COUNT(*), MIN(round_date)
  INTO v_count, v_oldest_date
  FROM public.scores
  WHERE user_id = v_user_id;

  -- Check if score already exists for this round_date
  SELECT * INTO v_existing_score
  FROM public.scores
  WHERE user_id = v_user_id AND round_date = p_round_date;

  IF v_existing_score.id IS NOT NULL THEN
    UPDATE public.scores
    SET value = p_value, updated_at = NOW()
    WHERE id = v_existing_score.id
    RETURNING * INTO v_result;
    RETURN v_result;
  END IF;

  -- Reject backdated score if user already has 5 scores and new date is older than oldest
  IF v_count >= 5 THEN
    IF p_round_date < v_oldest_date THEN
      RAISE EXCEPTION 'Cannot add backdated score older than current oldest round date (%)', v_oldest_date;
    END IF;
  END IF;

  -- Insert new score
  INSERT INTO public.scores (user_id, round_date, value)
  VALUES (v_user_id, p_round_date, p_value)
  RETURNING * INTO v_result;

  -- Retain only the 5 greatest round dates
  DELETE FROM public.scores
  WHERE user_id = v_user_id
    AND id NOT IN (
      SELECT id FROM public.scores
      WHERE user_id = v_user_id
      ORDER BY round_date DESC
      LIMIT 5
    );

  RETURN v_result;
END;
$$;

-- Revoke direct INSERT/UPDATE on scores table for standard authenticated users to force save_user_score usage
REVOKE INSERT, UPDATE ON public.scores FROM authenticated;
GRANT EXECUTE ON FUNCTION public.save_user_score(DATE, INTEGER) TO authenticated;

-- 3. SEPARATE WINNER SUBMISSIONS & PAYOUT RLS POLICIES
DROP POLICY IF EXISTS "Users manage own winner submission; admin manage all" ON public.winner_submissions;

CREATE POLICY "Users view own winner submission" ON public.winner_submissions
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Winners insert proof path for own award" ON public.winner_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND review_status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.draw_awards a
      WHERE a.id = award_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "Winners update proof path when rejected or pending" ON public.winner_submissions
  FOR UPDATE USING (
    auth.uid() = user_id AND review_status IN ('pending', 'rejected')
  ) WITH CHECK (
    auth.uid() = user_id AND review_status = 'pending'
  );

CREATE POLICY "Admins full management on winner submissions" ON public.winner_submissions
  FOR ALL USING (public.is_admin(auth.uid()));

-- 4. TRANSACTIONAL DRAW LIFECYCLE DATABASE FUNCTIONS

-- Lock Draw Function
CREATE OR REPLACE FUNCTION public.lock_monthly_draw(
  p_draw_id UUID
)
RETURNS public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw public.draws;
  v_entry_count INTEGER := 0;
  v_rec RECORD;
  v_scores_arr INTEGER[];
  v_dates_arr DATE[];
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required to lock draw';
  END IF;

  SELECT * INTO v_draw FROM public.draws WHERE id = p_draw_id FOR UPDATE;
  IF v_draw.id IS NULL THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

  IF v_draw.status != 'draft' THEN
    RAISE EXCEPTION 'Draw must be in draft status to lock';
  END IF;

  -- Create entries snapshot for all active subscribers with exactly 5 scores
  FOR v_rec IN
    SELECT s.user_id, fa.id AS funding_id
    FROM public.subscriptions sub
    JOIN public.funding_allocations fa ON fa.user_id = sub.user_id
      AND fa.coverage_year = v_draw.year
      AND fa.coverage_month = v_draw.month
    JOIN public.scores s ON s.user_id = sub.user_id
    WHERE sub.status IN ('active', 'trialing')
    GROUP BY s.user_id, fa.id
    HAVING COUNT(s.id) = 5
  LOOP
    SELECT ARRAY_AGG(value ORDER BY round_date DESC), ARRAY_AGG(round_date ORDER BY round_date DESC)
    INTO v_scores_arr, v_dates_arr
    FROM public.scores
    WHERE user_id = v_rec.user_id;

    INSERT INTO public.draw_entries (draw_id, user_id, score_values, score_dates, funding_allocation_id)
    VALUES (p_draw_id, v_rec.user_id, v_scores_arr, v_dates_arr, v_rec.funding_id)
    ON CONFLICT (draw_id, user_id) DO NOTHING;

    -- Link funding allocation to this draw
    UPDATE public.funding_allocations
    SET draw_id = p_draw_id
    WHERE id = v_rec.funding_id;

    v_entry_count := v_entry_count + 1;
  END LOOP;

  UPDATE public.draws
  SET status = 'locked',
      locked_at = NOW(),
      updated_at = NOW()
  WHERE id = p_draw_id
  RETURNING * INTO v_draw;

  RETURN v_draw;
END;
$$;

-- Generate Draw Numbers Function
CREATE OR REPLACE FUNCTION public.generate_monthly_draw(
  p_draw_id UUID,
  p_winning_numbers INTEGER[]
)
RETURNS public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw public.draws;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required to generate draw';
  END IF;

  SELECT * INTO v_draw FROM public.draws WHERE id = p_draw_id FOR UPDATE;
  IF v_draw.status != 'locked' THEN
    RAISE EXCEPTION 'Draw must be locked before generating numbers';
  END IF;

  IF v_draw.official_numbers IS NOT NULL THEN
    RAISE EXCEPTION 'Official numbers already generated; rerolls are prohibited';
  END IF;

  IF array_length(p_winning_numbers, 1) != 5 THEN
    RAISE EXCEPTION 'Draw requires exactly 5 winning numbers';
  END IF;

  UPDATE public.draws
  SET status = 'generated',
      official_numbers = p_winning_numbers,
      generated_at = NOW(),
      updated_at = NOW()
  WHERE id = p_draw_id
  RETURNING * INTO v_draw;

  RETURN v_draw;
END;
$$;

-- Publish Draw Function
CREATE OR REPLACE FUNCTION public.publish_monthly_draw(
  p_draw_id UUID,
  p_financials JSONB
)
RETURNS public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw public.draws;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required to publish draw';
  END IF;

  SELECT * INTO v_draw FROM public.draws WHERE id = p_draw_id FOR UPDATE;
  IF v_draw.status != 'generated' THEN
    RAISE EXCEPTION 'Draw must be generated before publishing';
  END IF;

  UPDATE public.draws
  SET status = 'published',
      financial_summary_snapshot = p_financials,
      published_at = NOW(),
      updated_at = NOW()
  WHERE id = p_draw_id
  RETURNING * INTO v_draw;

  RETURN v_draw;
END;
$$;
