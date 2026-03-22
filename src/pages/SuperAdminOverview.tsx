import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FolderKanban, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function SuperAdminOverview() {
  const [stats, setStats] = useState({ tenants: 0, users: 0, projects: 0, logs: 0 });
  const [recentTenants, setRecentTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [tenantsRes, profilesRes, projectsRes, logsRes, recentRes] = await Promise.all([
        supabase.from("tenants").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("projects").select("id", { count: "exact", head: true }),
        supabase.from("activity_logs").select("id", { count: "exact", head: true }),
        supabase.from("tenants").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      setStats({
        tenants: tenantsRes.count || 0,
        users: profilesRes.count || 0,
        projects: projectsRes.count || 0,
        logs: logsRes.count || 0,
      });
      setRecentTenants(recentRes.data || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: "Total Tenants", value: stats.tenants, icon: Building2, color: "text-blue-500" },
    { label: "Total Users", value: stats.users, icon: Users, color: "text-green-500" },
    { label: "Total Projects", value: stats.projects, icon: FolderKanban, color: "text-purple-500" },
    { label: "Activity Logs", value: stats.logs, icon: Activity, color: "text-orange-500" },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor your entire SaaS platform from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTenants.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.slug}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${t.status === "active" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {t.status}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{t.plan}</span>
                </div>
              </div>
            ))}
            {recentTenants.length === 0 && <p className="text-muted-foreground text-sm">No tenants yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
