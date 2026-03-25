-- Backfill existing auth users created before signup trigger was available.
-- This migration is idempotent and only fills missing data.

DO $$
DECLARE
  u RECORD;
  new_tenant_id UUID;
  company_name TEXT;
  user_name TEXT;
  tenant_slug TEXT;
BEGIN
  FOR u IN
    SELECT id, email, raw_user_meta_data
    FROM auth.users
    WHERE id NOT IN (SELECT user_id FROM public.profiles)
  LOOP
    company_name := COALESCE(u.raw_user_meta_data->>'company_name', 'My Company');
    user_name := COALESCE(u.raw_user_meta_data->>'full_name', split_part(COALESCE(u.email, 'user@example.com'), '@', 1));
    tenant_slug := LOWER(REGEXP_REPLACE(company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || SUBSTRING(u.id::text, 1, 8);

    INSERT INTO public.tenants (name, slug)
    VALUES (company_name, tenant_slug)
    RETURNING id INTO new_tenant_id;

    INSERT INTO public.profiles (user_id, tenant_id, full_name)
    VALUES (u.id, new_tenant_id, user_name);

    INSERT INTO public.user_roles (user_id, tenant_id, role)
    VALUES (u.id, new_tenant_id, 'admin');
  END LOOP;

  -- If a profile exists but a role row is missing, create a conservative default role.
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  SELECT p.user_id, p.tenant_id, 'member'
  FROM public.profiles p
  LEFT JOIN public.user_roles ur
    ON ur.user_id = p.user_id
   AND ur.tenant_id = p.tenant_id
  WHERE ur.id IS NULL;
END $$;
