import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { LayoutDashboard, FolderKanban, Users, BarChart3, Bell, CreditCard, Settings, Search, CheckSquare, Activity, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const pages = [
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", url: "/dashboard/projects", icon: FolderKanban },
  { name: "Tasks", url: "/dashboard/tasks", icon: CheckSquare },
  { name: "Team", url: "/dashboard/team", icon: Users },
  { name: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { name: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { name: "Activity Log", url: "/dashboard/activity", icon: Activity },
  { name: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", url: "/dashboard/settings", icon: Settings },
  { name: "Profile", url: "/dashboard/profile", icon: User },
];

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { tenant } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data: projects } = useQuery({
    queryKey: ["search-projects", tenant?.id, query],
    queryFn: async () => {
      if (!tenant || !query || query.length < 2) return [];
      const { data } = await supabase.from("projects").select("id, name").eq("tenant_id", tenant.id).ilike("name", `%${query}%`).limit(5);
      return data || [];
    },
    enabled: !!tenant && open && query.length >= 2,
  });

  const { data: tasks } = useQuery({
    queryKey: ["search-tasks", tenant?.id, query],
    queryFn: async () => {
      if (!tenant || !query || query.length < 2) return [];
      const { data } = await supabase.from("tasks").select("id, title").eq("tenant_id", tenant.id).ilike("title", `%${query}%`).limit(5);
      return data || [];
    },
    enabled: !!tenant && open && query.length >= 2,
  });

  const { data: members } = useQuery({
    queryKey: ["search-members", tenant?.id, query],
    queryFn: async () => {
      if (!tenant || !query || query.length < 2) return [];
      const { data } = await supabase.from("profiles").select("user_id, full_name").eq("tenant_id", tenant.id).ilike("full_name", `%${query}%`).limit(5);
      return data || [];
    },
    enabled: !!tenant && open && query.length >= 2,
  });

  return (
    <>
      <Button variant="outline" size="sm" className="gap-2 text-muted-foreground" onClick={() => setOpen(true)}>
        <Search className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex pointer-events-none h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search pages, projects, tasks, members..." value={query} onValueChange={setQuery} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem key={page.url} onSelect={() => { navigate(page.url); setOpen(false); setQuery(""); }} className="gap-2">
                <page.icon className="h-4 w-4" />
                {page.name}
              </CommandItem>
            ))}
          </CommandGroup>
          {projects && projects.length > 0 && (
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem key={p.id} onSelect={() => { navigate("/dashboard/projects"); setOpen(false); setQuery(""); }} className="gap-2">
                  <FolderKanban className="h-4 w-4" />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {tasks && tasks.length > 0 && (
            <CommandGroup heading="Tasks">
              {tasks.map((t) => (
                <CommandItem key={t.id} onSelect={() => { navigate("/dashboard/tasks"); setOpen(false); setQuery(""); }} className="gap-2">
                  <CheckSquare className="h-4 w-4" />
                  {t.title}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {members && members.length > 0 && (
            <CommandGroup heading="Members">
              {members.map((m) => (
                <CommandItem key={m.user_id} onSelect={() => { navigate("/dashboard/team"); setOpen(false); setQuery(""); }} className="gap-2">
                  <Users className="h-4 w-4" />
                  {m.full_name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
