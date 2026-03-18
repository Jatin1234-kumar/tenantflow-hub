import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import DashboardOverview from "./pages/DashboardOverview";
import DashboardProjects from "./pages/DashboardProjects";
import DashboardTeam from "./pages/DashboardTeam";
import DashboardTasks from "./pages/DashboardTasks";
import DashboardAnalytics from "./pages/DashboardAnalytics";
import DashboardNotifications from "./pages/DashboardNotifications";
import DashboardBilling from "./pages/DashboardBilling";
import DashboardSettings from "./pages/DashboardSettings";
import DashboardActivityLog from "./pages/DashboardActivityLog";
import DashboardProfile from "./pages/DashboardProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
                <Route index element={<DashboardOverview />} />
                <Route path="projects" element={<DashboardProjects />} />
                <Route path="team" element={<DashboardTeam />} />
                <Route path="tasks" element={<DashboardTasks />} />
                <Route path="analytics" element={<DashboardAnalytics />} />
                <Route path="notifications" element={<DashboardNotifications />} />
                <Route path="billing" element={<DashboardBilling />} />
                <Route path="settings" element={<DashboardSettings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
