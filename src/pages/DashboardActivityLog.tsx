import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { usePagination } from "@/hooks/usePagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Activity, FolderKanban, UserPlus, CheckSquare, Settings, Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";
import { exportToCsv } from "@/lib/exportCsv";

const actionConfig: Record<string, { icon: typeof Activity; label: string; color: string }> = {
  created_project: { icon: FolderKanban, label: "Created project", color: "bg-primary/10 text-primary" },
  sent_invitation: { icon: UserPlus, label: "Sent invitation", color: "bg-accent/10 text-accent" },
  created_task: { icon: CheckSquare, label: "Created task", color: "bg-success/10 text-success" },
  updated_settings: { icon: Settings, label: "Updated settings", color: "bg-warning/10 text-warning" },
  removed_member: { icon: UserPlus, label: "Removed member", color: "bg-destructive/10 text-destructive" },
};

export default function DashboardActivityLog() {
  const { tenant } = useAuth();
  const permissions = usePermissions();
  const [filterAction, setFilterAction] = useState("all");
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["activity-logs", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase.from("activity_logs").select("*").eq("tenant_id", tenant.id).order("created_at", { ascending: false }).limit(500);
      return data || [];
    },
    enabled: !!tenant,
  });

  const { data: members } = useQuery({
    queryKey: ["activity-members", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").eq("tenant_id", tenant.id);
      return data || [];
    },
    enabled: !!tenant,
  });

  const getMemberName = (userId: string | null) => !userId ? "System" : members?.find((m) => m.user_id === userId)?.full_name || "Unknown";

  const filtered = logs.filter((log) => {
    if (filterAction !== "all" && log.action !== filterAction) return false;
    if (search) {
      const meta = JSON.stringify(log.metadata || {}).toLowerCase();
      const name = getMemberName(log.user_id).toLowerCase();
      if (!meta.includes(search.toLowerCase()) && !name.includes(search.toLowerCase()) && !log.action.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const pagination = usePagination(filtered, { pageSize: 20 });
  const actionTypes = [...new Set(logs.map((l) => l.action))];

  const handleExport = () => {
    exportToCsv("activity-logs", filtered.map((l) => ({
      user: getMemberName(l.user_id),
      action: l.action,
      resource_type: l.resource_type || "",
      created_at: l.created_at,
      metadata: JSON.stringify(l.metadata),
    })), [
      { key: "user", label: "User" }, { key: "action", label: "Action" },
      { key: "resource_type", label: "Resource" }, { key: "created_at", label: "Date" },
    ]);
    toast.success("Activity logs exported!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete audit trail of workspace events</p>
        </div>
        {permissions.canExportData && filtered.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export</Button>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((a) => <SelectItem key={String(a)} value={String(a)} className="capitalize">{String(a).replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Events ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : !filtered.length ? (
            <EmptyState icon={Activity} title="No activity logs found" description="Activity will appear here as your team uses the workspace." />
          ) : (
            <>
              <div className="space-y-1">
                {pagination.items.map((log) => {
                  const config = actionConfig[log.action] || { icon: Activity, label: String(log.action).replace(/_/g, " "), color: "bg-muted text-muted-foreground" };
                  const Icon = config.icon;
                  const meta = log.metadata as any;
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${config.color.split(" ")[0]}`}>
                        <Icon className={`h-4 w-4 ${config.color.split(" ")[1]}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{getMemberName(log.user_id)}</span>
                          {" "}{config.label.toLowerCase()}
                          {meta?.name && <span className="text-muted-foreground"> — {meta.name}</span>}
                          {meta?.email && <span className="text-muted-foreground"> — {meta.email}</span>}
                          {meta?.title && <span className="text-muted-foreground"> — {meta.title}</span>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(log.created_at), "MMM d, yyyy · h:mm a")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{log.resource_type || "system"}</Badge>
                    </div>
                  );
                })}
              </div>
              <PaginationControls {...pagination} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
