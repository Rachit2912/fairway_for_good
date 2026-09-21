-- Migration: Drop unsafe legacy 3-parameter save_user_score function

DROP FUNCTION IF EXISTS public.save_user_score(UUID, DATE, INTEGER);

-- Ensure only secure 2-parameter function (using auth.uid()) is active
COMMENT ON FUNCTION public.save_user_score(DATE, INTEGER) IS 'Secured score retention function enforcing auth.uid() identity and subscription entitlement';
