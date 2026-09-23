-- Migration: Controlled Admin Role Management RPC and Audit Logging

CREATE OR REPLACE FUNCTION public.update_user_role(
  p_target_user_id UUID,
  p_new_role TEXT
)
RETURNS public.user_roles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_count INTEGER;
  v_current_role TEXT;
  v_updated_role public.user_roles;
BEGIN
  -- 1. Check admin caller authorization
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL OR NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Admin privileges required to update user role';
  END IF;

  -- 2. Validate role
  IF p_new_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'Invalid role. Role must be member or admin';
  END IF;

  -- 3. Get target user's current role
  SELECT role INTO v_current_role
  FROM public.user_roles
  WHERE user_id = p_target_user_id;

  -- 4. Prevent removing the last admin
  IF v_current_role = 'admin' AND p_new_role = 'member' THEN
    SELECT COUNT(*) INTO v_admin_count
    FROM public.user_roles
    WHERE role = 'admin';

    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Cannot revoke admin role from the sole remaining administrator';
    END IF;
  END IF;

  -- 5. Upsert role
  INSERT INTO public.user_roles (user_id, role, created_at)
  VALUES (p_target_user_id, p_new_role, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET role = EXCLUDED.role
  RETURNING * INTO v_updated_role;

  -- 6. Record audit log
  INSERT INTO public.audit_logs (
    actor_id,
    action,
    target_type,
    target_id,
    details
  ) VALUES (
    v_admin_id,
    'update_user_role',
    'user_roles',
    p_target_user_id::TEXT,
    jsonb_build_object(
      'old_role', COALESCE(v_current_role, 'none'),
      'new_role', p_new_role
    )
  );

  RETURN v_updated_role;
END;
$$;

-- Grant execution permissions
REVOKE EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;
