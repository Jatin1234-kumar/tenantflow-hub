-- Harden role assignment RBAC to prevent privilege escalation.

CREATE OR REPLACE FUNCTION public.role_level(_role app_role)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE _role
    WHEN 'super_admin' THEN 5
    WHEN 'admin' THEN 4
    WHEN 'manager' THEN 3
    WHEN 'member' THEN 2
    WHEN 'viewer' THEN 1
    ELSE 0
  END
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_in_tenant(_user_id uuid, _tenant_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id AND tenant_id = _tenant_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_assign_role(
  _actor_user_id uuid,
  _tenant_id uuid,
  _target_user_id uuid,
  _target_role app_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role app_role;
BEGIN
  actor_role := public.get_user_role_in_tenant(_actor_user_id, _tenant_id);

  IF actor_role IS NULL THEN
    RETURN false;
  END IF;

  IF _actor_user_id = _target_user_id THEN
    RETURN false;
  END IF;

  IF actor_role = 'super_admin' THEN
    RETURN true;
  ELSIF actor_role = 'admin' THEN
    RETURN _target_role IN ('manager', 'member', 'viewer');
  ELSIF actor_role = 'manager' THEN
    RETURN _target_role IN ('member', 'viewer');
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_remove_member(
  _actor_user_id uuid,
  _tenant_id uuid,
  _target_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role app_role;
  target_role app_role;
BEGIN
  actor_role := public.get_user_role_in_tenant(_actor_user_id, _tenant_id);
  target_role := public.get_user_role_in_tenant(_target_user_id, _tenant_id);

  IF actor_role IS NULL OR target_role IS NULL THEN
    RETURN false;
  END IF;

  IF _actor_user_id = _target_user_id THEN
    RETURN false;
  END IF;

  IF actor_role = 'super_admin' THEN
    RETURN true;
  ELSIF actor_role = 'admin' THEN
    RETURN target_role IN ('manager', 'member', 'viewer');
  ELSIF actor_role = 'manager' THEN
    RETURN target_role IN ('member', 'viewer');
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_invite_role(
  _actor_user_id uuid,
  _tenant_id uuid,
  _invite_role app_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role app_role;
BEGIN
  actor_role := public.get_user_role_in_tenant(_actor_user_id, _tenant_id);

  IF actor_role IS NULL THEN
    RETURN false;
  END IF;

  IF actor_role = 'super_admin' THEN
    RETURN true;
  ELSIF actor_role = 'admin' THEN
    RETURN _invite_role IN ('manager', 'member', 'viewer');
  ELSIF actor_role = 'manager' THEN
    RETURN _invite_role IN ('member', 'viewer');
  END IF;

  RETURN false;
END;
$$;

-- Replace broad role management policy with strict policies.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Role managers can insert roles safely"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_assign_role(auth.uid(), tenant_id, user_id, role)
);

CREATE POLICY "Role managers can update roles safely"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.can_assign_role(auth.uid(), tenant_id, user_id, role)
)
WITH CHECK (
  public.can_assign_role(auth.uid(), tenant_id, user_id, role)
);

CREATE POLICY "Role managers can delete roles safely"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.can_remove_member(auth.uid(), tenant_id, user_id)
);

-- Replace broad invitation management with scoped policies.
DROP POLICY IF EXISTS "Admins can manage invitations" ON public.invitations;

CREATE POLICY "Managers can create invitations with allowed roles"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
  invited_by = auth.uid()
  AND public.can_invite_role(auth.uid(), tenant_id, role)
);

CREATE POLICY "Managers can view invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
);

CREATE POLICY "Managers can delete invitations"
ON public.invitations
FOR DELETE
TO authenticated
USING (
  public.can_invite_role(auth.uid(), tenant_id, role)
);

-- Invite accept flow: invited user can mark their own invitation as accepted.
CREATE POLICY "Invited user can accept own invitation"
ON public.invitations
FOR UPDATE
TO authenticated
USING (
  email = auth.email()
  AND status = 'pending'
)
WITH CHECK (
  email = auth.email()
  AND status = 'accepted'
);
