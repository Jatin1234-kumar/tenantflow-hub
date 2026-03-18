import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from "recharts";
import { Activity, CheckSquare, FolderKanban, Users, TrendingUp, TrendingDown } from "lucide-react";

const COLORS = [
  "hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)",
  "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)",
];

export default function DashboardAnalytics() {
  const { tenant } = useAuth();

  const { data: tasksByStatus } = useQuery({
    queryKey: ["analytics-tasks-status", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase
        .from("tasks")
        .select("status")
        .eq("tenant_id", tenant.id);
      const counts: Record<string, number> = {};
      data?.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name: name.replace("_", " "), value }));
    },
    enabled: !!tenant,
  });

  const { data: tasksByPriority } = useQuery({
    queryKey: ["analytics-tasks-priority", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase
        .from("tasks")
        .select("priority")
        .eq("tenant_id", tenant.id);
      const counts: Record<string, number> = {};
      data?.forEach((t) => { counts[t.priority] = (counts[t.priority] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    enabled: !!tenant,
  });

  const { data: activityByDay } = useQuery({
    queryKey: ["analytics-activity-daily", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data } = await supabase
        .from("activity_logs")
        .select("created_at")
        .eq("tenant_id", tenant.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        counts[days[d.getDay()]] = 0;
      }
      data?.forEach((a) => {
        const day = days[new Date(a.created_at).getDay()];
        counts[day] = (counts[day] || 0) + 1;
      });
      return Object.entries(counts).map(([day, count]) => ({ day, count }));
    },
    enabled: !!tenant,
  });

  const { data: projectsByStatus } = useQuery({
    queryKey: ["analytics-projects-status", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase
        .from("projects")
        .select("status")
        .eq("tenant_id", tenant.id);
      const counts: Record<string, number> = {};
      data?.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
    enabled: !!tenant,
  });

  const { data: stats } = useQuery({
    queryKey: ["analytics-stats", tenant?.id],
    queryFn: async () => {
      if (!tenant) return null;
      const [tasks, projects, members, logs] = await Promise.all([
        supabase.from("tasks").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id),
      ]);
      const doneTasks = await supabase.from("tasks").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("status", "done");
      const totalTasks = tasks.count || 0;
      const completionRate = totalTasks > 0 ? Math.round(((doneTasks.count || 0) / totalTasks) * 100) : 0;
      return {
        totalTasks: totalTasks,
        totalProjects: projects.count || 0,
        totalMembers: members.count || 0,
        totalActivity: logs.count || 0,
        completionRate,
      };
    },
    enabled: !!tenant,
  });

  const statCards = [
    { title: "Total Tasks", value: stats?.totalTasks ?? 0, icon: CheckSquare, color: "text-primary" },
    { title: "Projects", value: stats?.totalProjects ?? 0, icon: FolderKanban, color: "text-accent" },
    { title: "Team Members", value: stats?.totalMembers ?? 0, icon: Users, color: "text-success" },
    { title: "Completion Rate", value: `${stats?.completionRate ?? 0}%`, icon: stats?.completionRate && stats.completionRate >= 50 ? TrendingUp : TrendingDown, color: stats?.completionRate && stats.completionRate >= 50 ? "text-success" : "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time insights into your workspace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Daily Activity (Last 7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityByDay || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Tasks by Status</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {tasksByStatus?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {tasksByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12">No task data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Tasks by Priority</CardTitle></CardHeader>
          <CardContent>
            {tasksByPriority?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tasksByPriority} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} width={60} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="value" fill="hsl(262, 83%, 58%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No task data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Projects by Status</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {projectsByStatus?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={projectsByStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {projectsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12">No project data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
