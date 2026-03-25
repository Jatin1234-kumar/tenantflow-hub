
-- Create tenant status enum
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'cancelled');

-- Create subscription plan enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'pro', 'enterprise');

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'manager', 'member', 'viewer');

-- Create invite status enum
CREATE TYPE public.invite_status AS ENUM ('pending', 'accepted', 'expired');

-- Tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  status tenant_status NOT NULL DEFAULT 'active',
  plan subscription_plan NOT NULL DEFAULT 'free',
  max_users INT NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  UNIQUE (user_id, tenant_id)
);

-- Team invitations
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  status invite_status NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL UNIQUE DEFAULT md5(gen_random_uuid()::text || clock_timestamp()::text),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Projects table (main feature)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _tenant_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND tenant_id = _tenant_id AND role = _role
  )
$$;

-- Function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

-- RLS Policies for tenants
CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (public.user_belongs_to_tenant(auth.uid(), id));

CREATE POLICY "Admins can update their tenant" ON public.tenants
  FOR UPDATE USING (public.has_role(auth.uid(), id, 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their tenant" ON public.profiles
  FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their tenant" ON public.user_roles
  FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), tenant_id, 'admin'));

-- RLS Policies for invitations
CREATE POLICY "Admins can manage invitations" ON public.invitations
  FOR ALL USING (public.has_role(auth.uid(), tenant_id, 'admin'));

CREATE POLICY "Users can view invitations for their tenant" ON public.invitations
  FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their tenant" ON public.projects
  FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can create projects in their tenant" ON public.projects
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Members can update projects" ON public.projects
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Admins can delete projects" ON public.projects
  FOR DELETE USING (public.has_role(auth.uid(), tenant_id, 'admin'));

-- RLS Policies for activity_logs
CREATE POLICY "Users can view logs in their tenant" ON public.activity_logs
  FOR SELECT USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "System can insert logs" ON public.activity_logs
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (creates tenant + profile + role)
CREATE OR REPLACE FUNCTION public.handle_new_tenant_signup()
RETURNS TRIGGER AS $$
DECLARE
  new_tenant_id UUID;
  company_name TEXT;
  user_name TEXT;
BEGIN
  company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Create tenant
  INSERT INTO public.tenants (name, slug)
  VALUES (company_name, LOWER(REPLACE(company_name, ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 8))
  RETURNING id INTO new_tenant_id;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, tenant_id, full_name)
  VALUES (NEW.id, new_tenant_id, user_name);
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, new_tenant_id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on auth.users to auto-create tenant on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant_signup();
