CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assigned_to UUID,
  created_by UUID NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their tenant"
  ON public.tasks FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create tasks in their tenant"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Users can update tasks in their tenant"
  ON public.tasks FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tasks in their tenant"
  ON public.tasks FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION public.log_task_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.activity_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (NEW.tenant_id, NEW.created_by, 'created_task', 'task', NEW.id, jsonb_build_object('title', NEW.title));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_task_created_log
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_activity();