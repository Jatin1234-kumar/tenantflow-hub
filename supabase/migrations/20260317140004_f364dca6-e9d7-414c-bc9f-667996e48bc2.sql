
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view notifications in their tenant"
  ON public.notifications FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Function to auto-create welcome notification on signup
CREATE OR REPLACE FUNCTION public.create_welcome_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (tenant_id, user_id, title, description, type)
  VALUES (NEW.tenant_id, NEW.user_id, 'Welcome to TenantFlow!', 'Your workspace is ready. Start by creating a project or inviting team members.', 'success');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_welcome_notification();

-- Function to log activity and create notification on project creation
CREATE OR REPLACE FUNCTION public.log_project_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log activity
  INSERT INTO public.activity_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (NEW.tenant_id, NEW.created_by, 'created_project', 'project', NEW.id, jsonb_build_object('name', NEW.name));
  
  -- Create notification
  INSERT INTO public.notifications (tenant_id, user_id, title, description, type)
  VALUES (NEW.tenant_id, NEW.created_by, 'Project created', 'Project "' || NEW.name || '" has been created.', 'success');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created_log
  AFTER INSERT ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_activity();

-- Function to log invitation activity
CREATE OR REPLACE FUNCTION public.log_invitation_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.activity_logs (tenant_id, user_id, action, resource_type, resource_id, metadata)
  VALUES (NEW.tenant_id, NEW.invited_by, 'sent_invitation', 'invitation', NEW.id, jsonb_build_object('email', NEW.email, 'role', NEW.role::text));
  
  INSERT INTO public.notifications (tenant_id, user_id, title, description, type)
  VALUES (NEW.tenant_id, NEW.invited_by, 'Invitation sent', 'Invitation sent to ' || NEW.email, 'info');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_invitation_created_log
  AFTER INSERT ON public.invitations
  FOR EACH ROW
  EXECUTE FUNCTION log_invitation_activity();
