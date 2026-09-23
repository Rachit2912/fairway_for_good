-- Migration: Hardened Draw Lifecycle, Service-Role RPC Authorization, and Subscription Security

-- 1. DROP UNSAFE ADMIN SUBSCRIPTION WRITE POLICY
-- Subscription status mutations must originate exclusively from verified Stripe webhooks or service-role reconciliation
DROP POLICY IF EXISTS "Admin write subscriptions" ON public.subscriptions;

-- 2. REVOKE DIRECT INSERT ON DRAWS TABLE
-- Direct table INSERT from client/authenticated roles is revoked to prevent inserting non-draft or pre-generated draws
REVOKE INSERT ON public.draws FROM authenticated;

-- Create security-definer function for controlled draft draw creation
CREATE OR REPLACE FUNCTION public.create_draft_draw(
  p_year INTEGER,
  p_month INTEGER,
  p_mode TEXT DEFAULT 'random'
)
RETURNS public.draws
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_draw public.draws;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required to create draw';
  END IF;

  IF p_mode NOT IN ('random', 'weighted') THEN
    RAISE EXCEPTION 'Invalid draw mode. Must be random or weighted';
  END IF;

  INSERT INTO public.draws (
    year,
    month,
    mode,
    status,
    official_numbers
  ) VALUES (
    p_year,
    p_month,
    p_mode,
    'draft',
    NULL
  ) RETURNING * INTO v_draw;

  RETURN v_draw;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_draft_draw(INTEGER, INTEGER, TEXT) TO authenticated;

-- 3. HARDEN GENERATE_MONTHLY_DRAW PROCEDURE FOR TRUSTED SERVICE-ROLE CALLS
-- Service-role calls operate outside an authenticated user session context (auth.uid() IS NULL).
-- Service-role execution was granted in 20260109000000. Remove the is_admin(auth.uid()) check inside the procedure.
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
  SELECT * INTO v_draw FROM public.draws WHERE id = p_draw_id FOR UPDATE;
  IF v_draw.id IS NULL THEN
    RAISE EXCEPTION 'Draw not found';
  END IF;

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

-- Revoke execution from PUBLIC, anon, and authenticated; grant strictly to service_role
REVOKE EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) TO service_role;
