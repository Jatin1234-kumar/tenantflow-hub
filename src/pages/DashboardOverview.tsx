import { useAuth } from "@/contexts/AuthContext";
import { Users, FolderKanban, Activity, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const chartData = [
  { name: "Mon", activity: 24 }, { name: "Tue", activity: 38 },
  { name: "Wed", activity: 45 }, { name: "Thu", activity: 32 },
  { name: "Fri", activity: 52 }, { name: "Sat", activity: 18 },
  { name: "Sun", activity: 12 },
];

const growthData = [
  { month: "Jan", users: 5 }, { month: "Feb", users: 8 },
  { month: "Mar", users: 12 }, { month: "Apr", users: 15 },
  { month: "May", users: 22 }, { month: "Jun", users: 28 },
];

export default function DashboardOverview() {
  const { tenant } = useAuth();

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

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!tenant,
  });

  const stats = [
    { title: "Team Members", value: teamCount ?? 0, icon: Users, change: "+2 this month", color: "text-primary" },
    { title: "Projects", value: projectCount ?? 0, icon: FolderKanban, change: "Active", color: "text-accent" },
    { title: "Active Sessions", value: 3, icon: Activity, change: "Real-time", color: "text-success" },
    { title: "Storage Used", value: "128MB", icon: HardDrive, change: "of 5GB", color: "text-warning" },
  ];

  const formatAction = (action: string) => {
    const map: Record<string, string> = {
      created_project: "Created new project",
      sent_invitation: "Invited team member",
      updated_settings: "Updated settings",
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
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
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
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                <YAxis tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '8px' }} />
                <Bar dataKey="activity" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="font-display text-base">User Growth</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                <YAxis tick={{ fill: 'hsl(220, 9%, 46%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="users" stroke="hsl(262, 83%, 58%)" strokeWidth={2} dot={{ fill: 'hsl(262, 83%, 58%)' }} />
              </LineChart>
            </ResponsiveContainer>
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
                      {(item.metadata as any)?.name || (item.metadata as any)?.email || ""} · {timeAgo(item.created_at)}
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
