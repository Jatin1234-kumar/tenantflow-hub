-- Bootstrap missing tenant/profile/role for the currently authenticated user.
-- This prevents broken sessions where user is authenticated but app context is incomplete.

CREATE OR REPLACE FUNCTION public.bootstrap_current_user_context()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _uid UUID := auth.uid();
  _email TEXT;
  _full_name TEXT;
  _company_name TEXT;
  _tenant_id UUID;
  _slug TEXT;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    COALESCE(u.raw_user_meta_data->>'company_name', 'My Company')
  INTO _email, _full_name, _company_name
  FROM auth.users u
  WHERE u.id = _uid;

  SELECT p.tenant_id INTO _tenant_id
  FROM public.profiles p
  WHERE p.user_id = _uid
  LIMIT 1;

  IF _tenant_id IS NULL THEN
    _slug := LOWER(REGEXP_REPLACE(_company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(_uid::text, 1, 8);

    INSERT INTO public.tenants (name, slug)
    VALUES (_company_name, _slug)
    RETURNING id INTO _tenant_id;

    INSERT INTO public.profiles (user_id, tenant_id, full_name)
    VALUES (_uid, _tenant_id, _full_name);

    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (_uid, _tenant_id, 'admin')
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;

    RETURN jsonb_build_object('status', 'created', 'tenant_id', _tenant_id, 'role', 'admin');
  END IF;

  -- Ensure role row exists for existing profile.
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (_uid, _tenant_id, 'member')
  ON CONFLICT (user_id, tenant_id) DO NOTHING;

  RETURN jsonb_build_object('status', 'exists', 'tenant_id', _tenant_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.bootstrap_current_user_context() TO authenticated;
