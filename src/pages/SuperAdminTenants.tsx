import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Building2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Tenant = Tables<"tenants">;

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    const { data } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });
    setTenants(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTenants(); }, []);

  const updateTenantStatus = async (id: string, status: "active" | "suspended" | "cancelled") => {
    const { error } = await supabase.from("tenants").update({ status }).eq("id", id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Tenant ${status}`);
    fetchTenants();
  };

  const updateTenantPlan = async (id: string, plan: "free" | "pro" | "enterprise") => {
    const maxUsers = plan === "free" ? 5 : plan === "pro" ? 50 : 9999;
    const { error } = await supabase.from("tenants").update({ plan, max_users: maxUsers }).eq("id", id);
    if (error) { toast.error("Failed to update plan"); return; }
    toast.success(`Plan updated to ${plan}`);
    fetchTenants();
  };

  const filtered = tenants.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Tenant Management</h1>
          <p className="text-muted-foreground">View and manage all tenants on the platform.</p>
        </div>
        <Badge variant="outline" className="text-sm"><Building2 className="h-3 w-3 mr-1" />{tenants.length} tenants</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search tenants..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Max Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell className="text-muted-foreground">{t.slug}</TableCell>
                  <TableCell>
                    <Select value={t.plan} onValueChange={(v) => updateTenantPlan(t.id, v as any)}>
                      <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{t.max_users}</TableCell>
                  <TableCell>
                    <Badge variant={t.status === "active" ? "default" : "destructive"}>
                      {t.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {t.status === "active" ? (
                        <Button size="sm" variant="destructive" onClick={() => updateTenantStatus(t.id, "suspended")}>
                          Suspend
                        </Button>
                      ) : (
                        <Button size="sm" variant="default" onClick={() => updateTenantStatus(t.id, "active")}>
                          Activate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No tenants found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
