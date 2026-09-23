-- Migration: Atomic Admin Score Management Procedure with Top-5 Retention Rules

CREATE OR REPLACE FUNCTION public.admin_save_user_score(
  p_target_user_id UUID,
  p_round_date DATE,
  p_value INTEGER
)
RETURNS public.scores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_count INTEGER;
  v_oldest_date DATE;
  v_existing_score public.scores;
  v_result public.scores;
BEGIN
  -- 1. Check admin caller authorization
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required to manage scores for another user';
  END IF;

  -- 2. Validate score value range
  IF p_value < 1 OR p_value > 45 THEN
    RAISE EXCEPTION 'Score value must be an integer between 1 and 45';
  END IF;

  -- 3. Validate round date is not in the future
  IF p_round_date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Round date cannot be in the future';
  END IF;

  -- 4. Acquire per-user advisory lock to serialize score mutations and prevent race conditions
  PERFORM pg_advisory_xact_lock(hashtext(p_target_user_id::text));

  -- 5. Check current score count and oldest round date
  SELECT COUNT(*), MIN(round_date)
  INTO v_count, v_oldest_date
  FROM public.scores
  WHERE user_id = p_target_user_id;

  -- 6. Check if score already exists for this round_date
  SELECT * INTO v_existing_score
  FROM public.scores
  WHERE user_id = p_target_user_id AND round_date = p_round_date;

  IF v_existing_score.id IS NOT NULL THEN
    UPDATE public.scores
    SET value = p_value, updated_at = NOW()
    WHERE id = v_existing_score.id
    RETURNING * INTO v_result;
    RETURN v_result;
  END IF;

  -- 7. Reject backdated score if user already has 5 scores and new date is older than oldest
  IF v_count >= 5 THEN
    IF p_round_date < v_oldest_date THEN
      RAISE EXCEPTION 'Cannot add backdated score older than current oldest round date (%)', v_oldest_date;
    END IF;
  END IF;

  -- 8. Insert new score
  INSERT INTO public.scores (user_id, round_date, value)
  VALUES (p_target_user_id, p_round_date, p_value)
  RETURNING * INTO v_result;

  -- 9. Prune scores to retain only the 5 greatest round dates
  DELETE FROM public.scores
  WHERE user_id = p_target_user_id
    AND id NOT IN (
      SELECT id FROM public.scores
      WHERE user_id = p_target_user_id
      ORDER BY round_date DESC
      LIMIT 5
    );

  RETURN v_result;
END;
$$;

-- Grant execution permissions
REVOKE EXECUTE ON FUNCTION public.admin_save_user_score(UUID, DATE, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_save_user_score(UUID, DATE, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_save_user_score(UUID, DATE, INTEGER) TO authenticated;
