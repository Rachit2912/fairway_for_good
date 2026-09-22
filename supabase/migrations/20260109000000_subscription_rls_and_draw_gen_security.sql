-- Migration: Subscription RLS Policies and Hardened Draw Generation Procedure

-- 1. ADD ADMIN UPDATE POLICY FOR SUBSCRIPTIONS
CREATE POLICY "Admin write subscriptions" ON public.subscriptions
  FOR ALL USING (public.is_admin(auth.uid()));

-- 2. HARDEN DRAW GENERATION PROCEDURE
-- Restricts generate_monthly_draw to service_role / trusted server actions to prevent clients from supplying arbitrary numbers via RPC
REVOKE EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.generate_monthly_draw(UUID, INTEGER[]) TO service_role;
