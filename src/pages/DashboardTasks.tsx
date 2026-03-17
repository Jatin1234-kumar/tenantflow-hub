import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, CheckSquare, MoreVertical, Trash2, Pencil, Circle, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const statusConfig: Record<string, { icon: typeof Circle; color: string; label: string }> = {
  todo: { icon: Circle, color: "text-muted-foreground", label: "To Do" },
  in_progress: { icon: Clock, color: "text-warning", label: "In Progress" },
  done: { icon: CheckCircle, color: "text-success", label: "Done" },
  blocked: { icon: AlertCircle, color: "text-destructive", label: "Blocked" },
};

const priorityVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  high: "destructive",
  medium: "default",
  low: "secondary",
};

export default function DashboardTasks() {
  const { tenant, user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editTask, setEditTask] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [projectId, setProjectId] = useState("");
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

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase
        .from("tasks")
        .select("*, projects(name)")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: false });
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
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      resetForm();
      toast.success("Task created!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateTask = useMutation({
    mutationFn: async () => {
      if (!editTask) return;
      const { error } = await supabase.from("tasks").update({ title, description: desc || null, status, priority, project_id: projectId }).eq("id", editTask.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      resetForm();
      toast.success("Task updated!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const quickStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("tasks").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const resetForm = () => {
    setOpen(false); setEditTask(null);
    setTitle(""); setDesc(""); setStatus("todo"); setPriority("medium"); setProjectId("");
  };

  const openEdit = (task: any) => {
    setEditTask(task);
    setTitle(task.title); setDesc(task.description || "");
    setStatus(task.status); setPriority(task.priority); setProjectId(task.project_id);
    setOpen(true);
  };

  const filtered = filterStatus === "all" ? tasks : tasks?.filter((t) => t.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {tasks?.filter((t) => t.status === "done").length || 0} / {tasks?.length || 0} completed
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm" disabled={!projects?.length}>
              <Plus className="h-4 w-4 mr-1" /> New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">{editTask ? "Edit Task" : "Create Task"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); editTask ? updateTask.mutate() : createTask.mutate(); }} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required className="mt-1.5" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details..." className="mt-1.5" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects?.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="hero" className="w-full" disabled={createTask.isPending || updateTask.isPending || !projectId}>
                {editTask ? "Save Changes" : "Create Task"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "todo", "in_progress", "done", "blocked"].map((s) => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)} className="capitalize">
            {s === "all" ? "All" : statusConfig[s]?.label || s}
          </Button>
        ))}
      </div>

      {!projects?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display font-semibold text-foreground mb-2">Create a project first</h3>
            <p className="text-sm text-muted-foreground">Tasks belong to projects. Create a project to start adding tasks.</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}
        </div>
      ) : !filtered?.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h3 className="font-display font-semibold text-foreground mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground">Create your first task to get organized</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const sc = statusConfig[task.status] || statusConfig.todo;
            const StatusIcon = sc.icon;
            return (
              <Card key={task.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-3">
                  <button
                    onClick={() => quickStatus.mutate({ id: task.id, newStatus: task.status === "done" ? "todo" : "done" })}
                    className={`shrink-0 ${sc.color} hover:opacity-70 transition-opacity`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-foreground ${task.status === "done" ? "line-through opacity-60" : ""}`}>{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{(task as any).projects?.name}</span>
                      <Badge variant={priorityVariant[task.priority] || "outline"} className="text-[10px] h-4 px-1.5 capitalize">{task.priority}</Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(task)}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => deleteTask.mutate(task.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
