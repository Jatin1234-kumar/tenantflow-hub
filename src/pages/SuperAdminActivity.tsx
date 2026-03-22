import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Search, Activity } from "lucide-react";

export default function SuperAdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter((l) => l.action.toLowerCase().includes(search.toLowerCase()));

  const actionColor = (action: string) => {
    if (action.includes("created")) return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    if (action.includes("deleted") || action.includes("removed")) return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    if (action.includes("updated")) return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    return "bg-muted text-muted-foreground";
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Platform Activity</h1>
          <p className="text-muted-foreground">All activity logs across every tenant.</p>
        </div>
        <Badge variant="outline" className="text-sm"><Activity className="h-3 w-3 mr-1" />{logs.length} events</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search actions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            {filtered.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${actionColor(log.action)}`}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {log.resource_type && `${log.resource_type}`}
                    {log.metadata && typeof log.metadata === "object" && (log.metadata as any).title && `: ${(log.metadata as any).title}`}
                    {log.metadata && typeof log.metadata === "object" && (log.metadata as any).name && `: ${(log.metadata as any).name}`}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
            {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No activity logs found.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
