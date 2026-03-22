import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SuperAdminSidebar } from "@/components/SuperAdminSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserProfileDropdown } from "@/components/UserProfileDropdown";
import { Shield } from "lucide-react";

export default function SuperAdminDashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <SuperAdminSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Shield className="h-4 w-4 text-destructive" />
                Super Admin Panel
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserProfileDropdown />
            </div>
          </header>
          <main className="flex-1 p-6 bg-background overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
