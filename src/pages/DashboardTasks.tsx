import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { usePagination } from "@/hooks/usePagination";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, CheckSquare, MoreVertical, Trash2, Pencil, Circle, CheckCircle, Clock, AlertCircle, CalendarDays, User, Download } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { EmptyState } from "@/components/EmptyState";
import { PaginationControls } from "@/components/PaginationControls";
import { exportToCsv } from "@/lib/exportCsv";

const statusConfig: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  todo: { icon: Circle, color: "text-muted-foreground", label: "To Do" },
  in_progress: { icon: Clock, color: "text-warning", label: "In Progress" },
  done: { icon: CheckCircle, color: "text-success", label: "Done" },
  blocked: { icon: AlertCircle, color: "text-destructive", label: "Blocked" },
};

const priorityVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  high: "destructive", medium: "default", low: "secondary",
};

export default function DashboardTasks() {
  const UNASSIGNED = "__unassigned__";
  const { tenant, user } = useAuth();
  const queryClient = useQueryClient();
  const permissions = usePermissions();
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [projectId, setProjectId] = useState("");
  const [assignedTo, setAssignedTo] = useState(UNASSIGNED);
  const [dueDate, setDueDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: projects } = useQuery({
    queryKey: ["projects", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase.from("projects").select("id, name").eq("tenant_id", tenant.id);
      return data || [];
    },
    enabled: !!tenant,
  });

  const { data: members } = useQuery({
    queryKey: ["team-members-list", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").eq("tenant_id", tenant.id);
      return data || [];
    },
    enabled: !!tenant,
  });

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase.from("tasks").select("*, projects(name)").eq("tenant_id", tenant.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenant,
  });

  const createTask = useMutation({
    mutationFn: async () => {
      if (!tenant || !user) throw new Error("Not authenticated");
      const { error } = await supabase.from("tasks").insert({
        title, description: desc || null, status, priority,
        project_id: projectId, tenant_id: tenant.id, created_by: user.id,
        assigned_to: assignedTo === UNASSIGNED ? null : assignedTo,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); resetForm(); toast.success("Task created!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const updateTask = useMutation({
    mutationFn: async () => {
      if (!editTask) return;
      const { error } = await supabase.from("tasks").update({
        title, description: desc || null, status, priority, project_id: projectId,
        assigned_to: assignedTo === UNASSIGNED ? null : assignedTo,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      }).eq("id", editTask.id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); resetForm(); toast.success("Task updated!"); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("tasks").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task deleted"); },
    onError: (err: any) => toast.error(err.message),
  });

  const quickStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", id); if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const resetForm = () => { setOpen(false); setEditTask(null); setTitle(""); setDesc(""); setStatus("todo"); setPriority("medium"); setProjectId(""); setAssignedTo(UNASSIGNED); setDueDate(""); };

  const openEdit = (task: any) => {
    setEditTask(task); setTitle(task.title); setDesc(task.description || ""); setStatus(task.status);
    setPriority(task.priority); setProjectId(task.project_id); setAssignedTo(task.assigned_to || UNASSIGNED);
    setDueDate(task.due_date ? task.due_date.split("T")[0] : ""); setOpen(true);
  };

  const getAssigneeName = (userId: string | null) => !userId ? null : members?.find((m) => m.user_id === userId)?.full_name || "Unknown";
  const isOverdue = (dueDate: string | null, status: string) => dueDate && status !== "done" && new Date(dueDate) < new Date();
  const filtered = filterStatus === "all" ? tasks : tasks.filter((t) => t.status === filterStatus);
  const pagination = usePagination(filtered, { pageSize: 15 });

  const handleExport = () => {
    exportToCsv("tasks", tasks, [
      { key: "title", label: "Title" }, { key: "status", label: "Status" }, { key: "priority", label: "Priority" },
      { key: "due_date", label: "Due Date" }, { key: "created_at", label: "Created At" },
    ]);
    toast.success("Tasks exported!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">{tasks.filter((t) => t.status === "done").length} / {tasks.length} completed</p>
        </div>
        <div className="flex gap-2">
          {permissions.canExportData && tasks.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export</Button>
          )}
          {permissions.canCreateTasks && (
            <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
              <DialogTrigger asChild>
                <Button variant="hero" size="sm" disabled={!projects?.length}><Plus className="h-4 w-4 mr-1" /> New Task</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-display">{editTask ? "Edit Task" : "Create Task"}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); editTask ? updateTask.mutate() : createTask.mutate(); }} className="space-y-4">
                  <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required className="mt-1.5" /></div>
                  <div><Label>Description</Label><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details..." className="mt-1.5" rows={3} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Project</Label><Select value={projectId} onValueChange={setProjectId}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select project" /></SelectTrigger><SelectContent>{projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Assign To</Label><Select value={assignedTo} onValueChange={setAssignedTo}><SelectTrigger className="mt-1.5"><SelectValue placeholder="Unassigned" /></SelectTrigger><SelectContent><SelectItem value={UNASSIGNED}>Unassigned</SelectItem>{members?.map((m) => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Due Date</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5" /></div>
                  </div>
                  <div><Label>Status</Label><Select value={status} onValueChange={setStatus}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todo">To Do</SelectItem><SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="done">Done</SelectItem><SelectItem value="blocked">Blocked</SelectItem></SelectContent></Select></div>
                  <Button variant="hero" className="w-full" disabled={createTask.isPending || updateTask.isPending || !projectId}>{editTask ? "Save Changes" : "Create Task"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "todo", "in_progress", "done", "blocked"].map((s) => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="capitalize">
            {s === "all" ? "All" : statusConfig[s]?.label || s}
          </Button>
        ))}
      </div>

      {!projects?.length ? (
        <EmptyState icon={CheckSquare} title="Create a project first" description="Tasks belong to projects. Create a project to start adding tasks." />
      ) : isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
      ) : !filtered.length ? (
        <EmptyState icon={CheckSquare} title="No tasks found" description={filterStatus !== "all" ? "No tasks with this status. Try another filter." : "Create your first task to get organized."} />
      ) : (
        <>
          <div className="space-y-2">
            {pagination.items.map((task) => {
              const sc = statusConfig[task.status] || statusConfig.todo;
              const StatusIcon = sc.icon;
              const assignee = getAssigneeName(task.assigned_to);
              const overdue = isOverdue(task.due_date, task.status);
              return (
                <Card key={task.id} className={`hover:shadow-sm transition-shadow ${overdue ? "border-destructive/30" : ""}`}>
                  <CardContent className="p-4 flex items-center gap-3">
                    {permissions.canEditTasks ? (
                      <button
                        onClick={() => quickStatus.mutate({ id: task.id, newStatus: task.status === "done" ? "todo" : "done" })}
                        className={`shrink-0 ${sc.color} hover:opacity-70 transition-opacity`}
                        title={task.status === "done" ? "Mark as To Do" : "Mark as Done"}
                        aria-label={task.status === "done" ? "Mark as To Do" : "Mark as Done"}
                      >
                        <StatusIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <StatusIcon className={`h-5 w-5 shrink-0 ${sc.color}`} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium text-foreground ${task.status === "done" ? "line-through opacity-60" : ""}`}>{task.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-muted-foreground">{(task as any).projects?.name}</span>
                        <Badge variant={priorityVariant[task.priority] || "outline"} className="text-[10px] h-4 px-1.5 capitalize">{task.priority}</Badge>
                        {assignee && <span className="flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" /> {assignee}</span>}
                        {task.due_date && (
                          <span className={`flex items-center gap-1 text-xs ${overdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                            <CalendarDays className="h-3 w-3" /> {format(new Date(task.due_date), "MMM d")}{overdue && " (overdue)"}
                          </span>
                        )}
                      </div>
                    </div>
                    {permissions.canEditTasks && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(task)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteTask.mutate(task.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <PaginationControls {...pagination} />
        </>
      )}
    </div>
  );
}
