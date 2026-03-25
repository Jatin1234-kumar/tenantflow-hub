-- Enforce RBAC for project operations at database level.
-- manager/admin/super_admin: create/update
-- admin/super_admin: delete

DROP POLICY IF EXISTS "Users can create projects in their tenant" ON public.projects;
DROP POLICY IF EXISTS "Members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Managers can create projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND created_by = auth.uid()
  AND (
    public.has_role(auth.uid(), tenant_id, 'manager')
    OR public.has_role(auth.uid(), tenant_id, 'admin')
    OR public.has_role(auth.uid(), tenant_id, 'super_admin')
  )
);

CREATE POLICY "Managers can update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), tenant_id, 'manager')
    OR public.has_role(auth.uid(), tenant_id, 'admin')
    OR public.has_role(auth.uid(), tenant_id, 'super_admin')
  )
);

CREATE POLICY "Admins can delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND (
    public.has_role(auth.uid(), tenant_id, 'admin')
    OR public.has_role(auth.uid(), tenant_id, 'super_admin')
  )
);
