-- Migration: Strict Chronological Publication, Paid-Through Verification, and Serialized Draw Rollover

-- 1. UPDATE LOCK_MONTHLY_DRAW PROCEDURE
-- Requires a non-null, unexpired paid-through period (current_period_end IS NOT NULL AND current_period_end >= NOW())
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

  -- Link funding allocations from ALL active subscribers with a non-null, unexpired paid-through period
  UPDATE public.funding_allocations fa
  SET draw_id = p_draw_id
  FROM public.subscriptions sub
  WHERE fa.user_id = sub.user_id
    AND fa.coverage_year = v_draw.year
    AND fa.coverage_month = v_draw.month
    AND fa.draw_id IS NULL
    AND sub.status IN ('active', 'trialing')
    AND sub.current_period_end IS NOT NULL
    AND sub.current_period_end >= NOW();

  -- Create draw entries for active paid-through subscribers who have EXACTLY 5 saved scores
  FOR v_rec IN
    SELECT s.user_id, fa.id AS funding_id
    FROM public.subscriptions sub
    JOIN public.funding_allocations fa ON fa.user_id = sub.user_id
      AND fa.coverage_year = v_draw.year
      AND fa.coverage_month = v_draw.month
    JOIN public.scores s ON s.user_id = sub.user_id
    WHERE sub.status IN ('active', 'trialing')
      AND sub.current_period_end IS NOT NULL
      AND sub.current_period_end >= NOW()
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

-- 2. UPDATE PUBLISH_MONTHLY_DRAW PROCEDURE
-- Serializes publication, rejects out-of-order draws earlier than an already-published month,
-- and consumes rollover strictly from the immediately preceding calendar month.
CREATE OR REPLACE FUNCTION public.publish_monthly_draw(
  p_draw_id UUID
)
RETURNS public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draw public.draws;
  v_later_published_count INTEGER := 0;
  v_total_funded_minor INTEGER := 0;
  v_incoming_rollover_minor INTEGER := 0;
  v_base_pool_minor INTEGER := 0;
  v_entry RECORD;
  v_match_count INTEGER;
  v_val INTEGER;
  v_e_count INTEGER;
  v_d_count INTEGER;
  v_5_winners INTEGER := 0;
  v_4_winners INTEGER := 0;
  v_3_winners INTEGER := 0;
  v_t5_pool INTEGER;
  v_t4_pool INTEGER;
  v_t3_pool INTEGER;
  v_t5_payout INTEGER := 0;
  v_t4_payout INTEGER := 0;
  v_t3_payout INTEGER := 0;
  v_t5_rollover INTEGER := 0;
  v_t5_reserve INTEGER := 0;
  v_t4_reserve INTEGER := 0;
  v_t3_reserve INTEGER := 0;
  v_unawarded_reserve INTEGER := 0;
  v_rounding_reserve INTEGER := 0;
  v_award_amount INTEGER;
  v_prev_year INTEGER;
  v_prev_month INTEGER;
  v_prev_draw_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin privileges required to publish draw';
  END IF;

  -- Acquire transaction-level advisory lock to serialize concurrent publish calls and prevent rollover reuse
  PERFORM pg_advisory_xact_lock(hashtext('publish_monthly_draw'));

  SELECT * INTO v_draw FROM public.draws WHERE id = p_draw_id FOR UPDATE;
  IF v_draw.id IS NULL THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

  IF v_draw.status = 'published' THEN
    RAISE EXCEPTION 'Draw is already published';
  END IF;

  IF v_draw.status != 'generated' OR v_draw.official_numbers IS NULL THEN
    RAISE EXCEPTION 'Draw must be in generated status with official numbers before publication';
  END IF;

  -- A. Strict Chronological Guard: Reject publication if ANY later month is already published
  SELECT COUNT(*) INTO v_later_published_count
  FROM public.draws
  WHERE (year > v_draw.year OR (year = v_draw.year AND month > v_draw.month))
    AND status = 'published';

  IF v_later_published_count > 0 THEN
    RAISE EXCEPTION 'Chronological publication guard: Cannot publish Draw %/% because a later month is already published', v_draw.month, v_draw.year;
  END IF;

  -- B. Sum total prize share funding from funding_allocations linked to this draw
  SELECT COALESCE(SUM(prize_share_minor), 0)
  INTO v_total_funded_minor
  FROM public.funding_allocations
  WHERE draw_id = p_draw_id;

  -- C. Consume incoming 5-match jackpot rollover STRICTLY from the immediately preceding calendar month
  IF v_draw.month = 1 THEN
    v_prev_year := v_draw.year - 1;
    v_prev_month := 12;
  ELSE
    v_prev_year := v_draw.year;
    v_prev_month := v_draw.month - 1;
  END IF;

  SELECT id INTO v_prev_draw_id
  FROM public.draws
  WHERE year = v_prev_year AND month = v_prev_month AND status = 'published';

  IF v_prev_draw_id IS NOT NULL THEN
    SELECT COALESCE(five_match_rollover_minor, 0)
    INTO v_incoming_rollover_minor
    FROM public.draw_financials
    WHERE draw_id = v_prev_draw_id;
  END IF;

  v_base_pool_minor := v_total_funded_minor;
  v_t5_pool := FLOOR(v_base_pool_minor * 0.40) + v_incoming_rollover_minor;
  v_t4_pool := FLOOR(v_base_pool_minor * 0.35);
  v_t3_pool := v_base_pool_minor - FLOOR(v_base_pool_minor * 0.40) - FLOOR(v_base_pool_minor * 0.35);

  -- D. Count winners for 5, 4, 3 matches
  FOR v_entry IN SELECT * FROM public.draw_entries WHERE draw_id = p_draw_id LOOP
    v_match_count := 0;

    FOR v_val IN SELECT DISTINCT UNNEST(v_entry.score_values) LOOP
      SELECT COUNT(*) INTO v_e_count FROM UNNEST(v_entry.score_values) val WHERE val = v_val;
      SELECT COUNT(*) INTO v_d_count FROM UNNEST(v_draw.official_numbers) val WHERE val = v_val;
      v_match_count := v_match_count + LEAST(v_e_count, v_d_count);
    END LOOP;

    IF v_match_count = 5 THEN
      v_5_winners := v_5_winners + 1;
    ELSIF v_match_count = 4 THEN
      v_4_winners := v_4_winners + 1;
    ELSIF v_match_count = 3 THEN
      v_3_winners := v_3_winners + 1;
    END IF;
  END LOOP;

  -- E. Calculate payouts and reserves
  IF v_5_winners > 0 THEN
    v_t5_payout := FLOOR(v_t5_pool / v_5_winners);
    v_t5_reserve := v_t5_pool - (v_t5_payout * v_5_winners);
  ELSE
    v_t5_rollover := v_t5_pool;
  END IF;

  IF v_4_winners > 0 THEN
    v_t4_payout := FLOOR(v_t4_pool / v_4_winners);
    v_t4_reserve := v_t4_pool - (v_t4_payout * v_4_winners);
  ELSE
    v_unawarded_reserve := v_unawarded_reserve + v_t4_pool;
  END IF;

  IF v_3_winners > 0 THEN
    v_t3_payout := FLOOR(v_t3_pool / v_3_winners);
    v_t3_reserve := v_t3_pool - (v_t3_payout * v_3_winners);
  ELSE
    v_unawarded_reserve := v_unawarded_reserve + v_t3_pool;
  END IF;

  v_rounding_reserve := v_t5_reserve + v_t4_reserve + v_t3_reserve;

  -- F. Record draw financials
  INSERT INTO public.draw_financials (
    draw_id,
    total_funded_minor,
    incoming_jackpot_minor,
    five_match_pool_minor,
    four_match_pool_minor,
    three_match_pool_minor,
    five_match_winners_count,
    four_match_winners_count,
    three_match_winners_count,
    five_match_payout_per_winner_minor,
    four_match_payout_per_winner_minor,
    three_match_payout_per_winner_minor,
    five_match_rollover_minor,
    unawarded_reserve_minor,
    rounding_reserve_minor
  ) VALUES (
    p_draw_id,
    v_total_funded_minor,
    v_incoming_rollover_minor,
    v_t5_pool,
    v_t4_pool,
    v_t3_pool,
    v_5_winners,
    v_4_winners,
    v_3_winners,
    v_t5_payout,
    v_t4_payout,
    v_t3_payout,
    v_t5_rollover,
    v_unawarded_reserve,
    v_rounding_reserve
  ) ON CONFLICT (draw_id) DO UPDATE SET
    total_funded_minor = EXCLUDED.total_funded_minor,
    five_match_payout_per_winner_minor = EXCLUDED.five_match_payout_per_winner_minor;

  -- G. Create draw awards for winning entries
  FOR v_entry IN SELECT * FROM public.draw_entries WHERE draw_id = p_draw_id LOOP
    v_match_count := 0;

    FOR v_val IN SELECT DISTINCT UNNEST(v_entry.score_values) LOOP
      SELECT COUNT(*) INTO v_e_count FROM UNNEST(v_entry.score_values) val WHERE val = v_val;
      SELECT COUNT(*) INTO v_d_count FROM UNNEST(v_draw.official_numbers) val WHERE val = v_val;
      v_match_count := v_match_count + LEAST(v_e_count, v_d_count);
    END LOOP;

    v_award_amount := 0;
    IF v_match_count = 5 THEN
      v_award_amount := v_t5_payout;
    ELSIF v_match_count = 4 THEN
      v_award_amount := v_t4_payout;
    ELSIF v_match_count = 3 THEN
      v_award_amount := v_t3_payout;
    END IF;

    IF v_match_count >= 3 AND v_award_amount > 0 THEN
      INSERT INTO public.draw_awards (
        draw_id,
        user_id,
        tier,
        match_count,
        amount_minor
      ) VALUES (
        p_draw_id,
        v_entry.user_id,
        v_match_count,
        v_match_count,
        v_award_amount
      ) ON CONFLICT (draw_id, user_id) DO NOTHING;
    END IF;
  END LOOP;

  -- H. Update draw status to published
  UPDATE public.draws
  SET status = 'published',
      published_at = NOW(),
      updated_at = NOW()
  WHERE id = p_draw_id
  RETURNING * INTO v_draw;

  RETURN v_draw;
END;
$$;
