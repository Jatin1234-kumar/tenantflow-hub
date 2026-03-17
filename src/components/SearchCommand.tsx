import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { LayoutDashboard, FolderKanban, Users, BarChart3, Bell, CreditCard, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const pages = [
  { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", url: "/dashboard/projects", icon: FolderKanban },
  { name: "Team", url: "/dashboard/team", icon: Users },
  { name: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { name: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { name: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { name: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function SearchCommand() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

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
        <CommandInput placeholder="Search pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            {pages.map((page) => (
              <CommandItem
                key={page.url}
                onSelect={() => {
                  navigate(page.url);
                  setOpen(false);
                }}
                className="gap-2"
              >
                <page.icon className="h-4 w-4" />
                {page.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
