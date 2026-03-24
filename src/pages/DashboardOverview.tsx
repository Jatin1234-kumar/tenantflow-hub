import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Users, FolderKanban, CheckSquare, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { OnboardingWizard } from "@/components/OnboardingWizard";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export default function DashboardOverview() {
  const { tenant } = useAuth();
  const permissions = usePermissions();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("onboarding_completed");
  });

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_completed", "true");
    setShowOnboarding(false);
  };

  const { data: teamCount } = useQuery({
    queryKey: ["team-count", tenant?.id],
    queryFn: async () => {
      if (!tenant) return 0;
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id);
      return count || 0;
    },
    enabled: !!tenant,
  });

  const { data: projectCount } = useQuery({
    queryKey: ["project-count", tenant?.id],
    queryFn: async () => {
      if (!tenant) return 0;
      const { count } = await supabase.from("projects").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id);
      return count || 0;
    },
    enabled: !!tenant,
  });

  const { data: taskStats } = useQuery({
    queryKey: ["task-stats", tenant?.id],
    queryFn: async () => {
      if (!tenant) return { total: 0, done: 0, byStatus: [] as { name: string; value: number }[] };
      const { data } = await supabase.from("tasks").select("status").eq("tenant_id", tenant.id);
      const counts: Record<string, number> = {};
      data?.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
      const total = data?.length || 0;
      const done = counts["done"] || 0;
      return {
        total, done,
        byStatus: Object.entries(counts).map(([name, value]) => ({ name: name.replace("_", " "), value })),
      };
    },
    enabled: !!tenant,
  });

  const { data: unreadNotifs } = useQuery({
    queryKey: ["unread-notifs", tenant?.id],
    queryFn: async () => {
      if (!tenant) return 0;
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("tenant_id", tenant.id).eq("read", false);
      return count || 0;
    },
    enabled: !!tenant,
  });

  const { data: activityByDay } = useQuery({
    queryKey: ["overview-activity-daily", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const { data } = await supabase.from("activity_logs").select("created_at").eq("tenant_id", tenant.id).gte("created_at", sevenDaysAgo.toISOString());
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const counts: Record<string, number> = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        counts[days[d.getDay()]] = 0;
      }
      data?.forEach((a) => { const day = days[new Date(a.created_at).getDay()]; counts[day] = (counts[day] || 0) + 1; });
      return Object.entries(counts).map(([day, activity]) => ({ day, activity }));
    },
    enabled: !!tenant,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase.from("activity_logs").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!tenant,
  });

  const stats = [
    { title: "Team Members", value: teamCount ?? 0, icon: Users, sub: `of ${tenant?.max_users || 5} max`, color: "text-primary" },
    { title: "Projects", value: projectCount ?? 0, icon: FolderKanban, sub: "Active", color: "text-accent" },
    { title: "Tasks", value: `${taskStats?.done ?? 0}/${taskStats?.total ?? 0}`, icon: CheckSquare, sub: "Completed", color: "text-success" },
    { title: "Notifications", value: unreadNotifs ?? 0, icon: Bell, sub: "Unread", color: "text-warning" },
  ];

  const formatAction = (action: string) => {
    const map: Record<string, string> = {
      created_project: "Created project", sent_invitation: "Invited member", created_task: "Created task",
      updated_settings: "Updated settings", removed_member: "Removed member",
    };
    return map[action] || action.replace(/_/g, " ");
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (showOnboarding && projectCount === 0 && (teamCount ?? 0) <= 1) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Welcome to your workspace</p>
        </div>
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your workspace activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
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
          <CardHeader><CardTitle className="font-display text-base">Weekly Activity</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityByDay || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                <YAxis tick={{ fill: 'hsl(220, 9%, 46%)' }} allowDecimals={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Bar dataKey="activity" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Task Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {taskStats?.byStatus?.length ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={taskStats.byStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {taskStats.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-12">No tasks yet. Create a task to see distribution.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="font-display text-base">Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{formatAction(item.action)}</p>
                    <p className="text-xs text-muted-foreground">
                      {(item.metadata as any)?.name || (item.metadata as any)?.email || (item.metadata as any)?.title || ""} · {timeAgo(item.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No activity yet. Create a project to get started!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
