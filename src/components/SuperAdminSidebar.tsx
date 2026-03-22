import {
  Shield, Building2, Users, BarChart3, Activity, Settings, LogOut, ArrowLeft,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Overview", url: "/admin", icon: BarChart3 },
  { title: "Tenants", url: "/admin/tenants", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Activity", url: "/admin/activity", icon: Activity },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function SuperAdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-destructive flex items-center justify-center">
            <Shield className="h-4 w-4 text-destructive-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-sm font-display font-bold text-sidebar-foreground truncate">Super Admin</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">Platform Management</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
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

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" className="hover:bg-sidebar-accent/50 text-sidebar-foreground/60">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Back to Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
            <p className="text-xs text-destructive truncate">Super Admin</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
