import { useAuth } from "@/contexts/AuthContext";
import type { Enums } from "@/integrations/supabase/types";

type AppRole = Enums<"app_role">;

const ROLE_HIERARCHY: Record<AppRole, number> = {
  super_admin: 5,
  admin: 4,
  manager: 3,
  member: 2,
  viewer: 1,
};

export function usePermissions() {
  const { role } = useAuth();
  const currentRole = (role?.role || "viewer") as AppRole;
  const level = ROLE_HIERARCHY[currentRole] || 0;

  return {
    currentRole,
    isSuperAdmin: currentRole === "super_admin",
    isAdmin: level >= ROLE_HIERARCHY.admin,
    isManager: level >= ROLE_HIERARCHY.manager,
    isMember: level >= ROLE_HIERARCHY.member,
    isViewer: level >= ROLE_HIERARCHY.viewer,

    // Specific permissions
    canManageTeam: level >= ROLE_HIERARCHY.admin,
    canInviteMembers: level >= ROLE_HIERARCHY.manager,
    canManageProjects: level >= ROLE_HIERARCHY.manager,
    canCreateProjects: level >= ROLE_HIERARCHY.manager,
    canCreateTasks: level >= ROLE_HIERARCHY.member,
    canEditTasks: level >= ROLE_HIERARCHY.member,
    canDeleteProjects: level >= ROLE_HIERARCHY.admin,
    canManageBilling: level >= ROLE_HIERARCHY.admin,
    canManageSettings: level >= ROLE_HIERARCHY.admin,
    canViewAnalytics: level >= ROLE_HIERARCHY.manager,
    canViewActivityLog: level >= ROLE_HIERARCHY.manager,
    canExportData: level >= ROLE_HIERARCHY.manager,
  };
}
