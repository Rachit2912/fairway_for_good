-- Migration: Foreign Keys to Profiles, Draw Table Security, and Atomic Payout Procedure

-- 1. ADD FOREIGN KEYS TO PROFILES AND AWARDS
-- Enables PostgREST nested query joins on profiles(id) and draw_awards(id)
ALTER TABLE public.subscriptions
  DROP CONSTRAINT IF EXISTS fk_subscriptions_profile,
  ADD CONSTRAINT fk_subscriptions_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles
  DROP CONSTRAINT IF EXISTS fk_user_roles_profile,
  ADD CONSTRAINT fk_user_roles_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.draw_awards
  DROP CONSTRAINT IF EXISTS fk_draw_awards_profile,
  ADD CONSTRAINT fk_draw_awards_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.scores
  DROP CONSTRAINT IF EXISTS fk_scores_profile,
  ADD CONSTRAINT fk_scores_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.winner_submissions
  DROP CONSTRAINT IF EXISTS fk_winner_submissions_profile,
  ADD CONSTRAINT fk_winner_submissions_profile
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  DROP CONSTRAINT IF EXISTS fk_winner_submissions_award,
  ADD CONSTRAINT fk_winner_submissions_award
  FOREIGN KEY (award_id) REFERENCES public.draw_awards(id) ON DELETE CASCADE;

ALTER TABLE public.payouts
  DROP CONSTRAINT IF EXISTS fk_payouts_award,
  ADD CONSTRAINT fk_payouts_award
  FOREIGN KEY (award_id) REFERENCES public.draw_awards(id) ON DELETE CASCADE;

-- 2. HARDEN DRAWS TABLE SECURITY
-- Prevent direct table UPDATE / DELETE from bypassing transition rules. All mutations must go through RPCs.
REVOKE UPDATE, DELETE ON public.draws FROM authenticated;

-- 3. ATOMIC IDEMPOTENT PAYOUT PROCEDURE
CREATE OR REPLACE FUNCTION public.process_award_payout(
  p_award_id UUID,
  p_reference_note TEXT DEFAULT 'Payout completed by admin'
)
RETURNS public.payouts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_sub RECORD;
  v_existing_payout public.payouts;
  v_payout public.payouts;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required to process payout';
  END IF;

  -- Lock winner submission record and verify proof approval
  SELECT review_status INTO v_sub
  FROM public.winner_submissions
  WHERE award_id = p_award_id FOR UPDATE;

  IF v_sub IS NULL OR v_sub.review_status != 'approved' THEN
    RAISE EXCEPTION 'Cannot process payout before proof scorecard is approved';
  END IF;

  -- Check existing payout for idempotency
  SELECT * INTO v_existing_payout
  FROM public.payouts
  WHERE award_id = p_award_id FOR UPDATE;

  IF v_existing_payout.id IS NOT NULL THEN
    -- Return original payout record without overwriting original timestamp, actor, or reference note
    RETURN v_existing_payout;
  END IF;

  -- Record new payout
  INSERT INTO public.payouts (
    award_id,
    status,
    reference_note,
    processed_by,
    processed_at
  ) VALUES (
    p_award_id,
    'paid',
    p_reference_note,
    v_admin_id,
    NOW()
  ) RETURNING * INTO v_payout;

  RETURN v_payout;
END;
$$;

-- Revoke direct table writes on payouts table; enforce process_award_payout usage
REVOKE INSERT, UPDATE, DELETE ON public.payouts FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_award_payout(UUID, TEXT) TO authenticated;
