-- Ensure each tenant has an admin.
-- Promotes the earliest profile in each tenant to admin if needed.

WITH first_member AS (
  SELECT DISTINCT ON (p.tenant_id)
    p.tenant_id,
    p.user_id
  FROM public.profiles p
  ORDER BY p.tenant_id, p.created_at ASC
)
INSERT INTO public.user_roles (user_id, tenant_id, role)
SELECT fm.user_id, fm.tenant_id, 'admin'::public.app_role
FROM first_member fm
ON CONFLICT (user_id, tenant_id)
DO UPDATE SET role = 'admin'::public.app_role;
