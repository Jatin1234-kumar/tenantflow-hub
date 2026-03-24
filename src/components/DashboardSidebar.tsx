import {
  LayoutDashboard, FolderKanban, Users, BarChart3, Bell, CreditCard, Settings, LogOut, Zap, CheckSquare, Activity, Shield, Lock,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, profile, tenant, role } = useAuth();
  const permissions = usePermissions();
  const isActive = (path: string) => location.pathname === path;

  const mainItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, visible: true },
    { title: "Projects", url: "/dashboard/projects", icon: FolderKanban, visible: true },
    { title: "Tasks", url: "/dashboard/tasks", icon: CheckSquare, visible: true },
    { title: "Team", url: "/dashboard/team", icon: Users, visible: true },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, visible: permissions.canViewAnalytics },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell, visible: true },
    { title: "Activity Log", url: "/dashboard/activity", icon: Activity, visible: permissions.canViewActivityLog },
  ];

  const settingsItems = [
    { title: "Billing", url: "/dashboard/billing", icon: CreditCard, visible: permissions.canManageBilling },
    { title: "Settings", url: "/dashboard/settings", icon: Settings, visible: permissions.canManageSettings },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-hero flex items-center justify-center">
            <Zap className="h-4 w-4 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-display font-bold text-sidebar-foreground truncate">{tenant?.name || "TenantFlow"}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{tenant?.plan || "free"} plan</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.filter((i) => i.visible).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {settingsItems.some((i) => i.visible) && (
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsItems.filter((i) => i.visible).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {role?.role === "super_admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin" className="hover:bg-sidebar-accent/50 text-destructive" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                      <Shield className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Super Admin</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && profile && (
          <div className="px-3 py-2 border-t border-sidebar-border">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{profile.full_name}</p>
            <p className="text-xs text-sidebar-foreground/50 truncate capitalize">{role?.role || "member"}</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
