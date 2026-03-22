import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role?.role !== "super_admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
