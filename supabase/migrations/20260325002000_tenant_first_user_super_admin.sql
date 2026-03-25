-- Tenant-scoped ownership model:
-- 1) First user of each tenant is super_admin for that tenant.
-- 2) Remove dangerous global super_admin policies.
-- 3) Keep behavior deterministic for future signups and bootstrap recovery.

-- Drop global super-admin policies that grant cross-tenant visibility.
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can update all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Super admins can view all activity logs" ON public.activity_logs;

-- Replace helper with tenant-scoped check.
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = 'super_admin'
  )
$$;

-- Ensure every tenant has exactly at least one super_admin by promoting earliest profile when missing.
WITH tenant_first_user AS (
  SELECT DISTINCT ON (p.tenant_id)
    p.tenant_id,
    p.user_id
  FROM public.profiles p
  ORDER BY p.tenant_id, p.created_at ASC
),
tenants_without_sa AS (
  SELECT t.id AS tenant_id
  FROM public.tenants t
  LEFT JOIN public.user_roles ur
    ON ur.tenant_id = t.id
   AND ur.role = 'super_admin'
  WHERE ur.id IS NULL
)
INSERT INTO public.user_roles (user_id, tenant_id, role)
SELECT tfu.user_id, tfu.tenant_id, 'super_admin'::public.app_role
FROM tenant_first_user tfu
JOIN tenants_without_sa tws ON tws.tenant_id = tfu.tenant_id
ON CONFLICT (user_id, tenant_id)
DO UPDATE SET role = 'super_admin'::public.app_role;

-- New tenant signup: creator becomes tenant super_admin.
CREATE OR REPLACE FUNCTION public.handle_new_tenant_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  company_name TEXT;
  user_name TEXT;
BEGIN
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);

  INSERT INTO public.tenants (name, slug)
  VALUES (company_name, LOWER(REPLACE(company_name, ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8))
  RETURNING id INTO new_tenant_id;

  INSERT INTO public.profiles (user_id, tenant_id, full_name)
  VALUES (NEW.id, new_tenant_id, user_name);

  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, new_tenant_id, 'super_admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Bootstrap current user context: creator role should be super_admin when tenant is created by bootstrap.
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
    VALUES (_uid, _tenant_id, 'super_admin')
    ON CONFLICT (user_id, tenant_id) DO UPDATE SET role = EXCLUDED.role;

    RETURN jsonb_build_object('status', 'created', 'tenant_id', _tenant_id, 'role', 'super_admin');
  END IF;

  -- Ensure role row exists for existing profile.
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (_uid, _tenant_id, 'member')
  ON CONFLICT (user_id, tenant_id) DO NOTHING;

  -- If tenant has no super_admin, promote earliest profile user.
  WITH first_profile AS (
    SELECT p.user_id
    FROM public.profiles p
    WHERE p.tenant_id = _tenant_id
    ORDER BY p.created_at ASC
    LIMIT 1
  )
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  SELECT fp.user_id, _tenant_id, 'super_admin'::public.app_role
  FROM first_profile fp
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.tenant_id = _tenant_id AND ur.role = 'super_admin'
  )
  ON CONFLICT (user_id, tenant_id)
  DO UPDATE SET role = 'super_admin'::public.app_role;

  RETURN jsonb_build_object('status', 'exists', 'tenant_id', _tenant_id);
END;
$$;
