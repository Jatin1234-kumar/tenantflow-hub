import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Search, Users } from "lucide-react";

interface UserWithDetails {
  id: string;
  full_name: string;
  user_id: string;
  created_at: string;
  tenant_id: string;
  tenantName?: string;
  role?: string;
}

export default function SuperAdminUsers() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      const [profilesRes, rolesRes, tenantsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("tenants").select("id, name"),
      ]);

      const roles = rolesRes.data || [];
      const tenants = tenantsRes.data || [];
      const tenantMap = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

      const merged = (profilesRes.data || []).map((p) => ({
        ...p,
        tenantName: tenantMap[p.tenant_id] || "Unknown",
        role: roles.find((r) => r.user_id === p.user_id && r.tenant_id === p.tenant_id)?.role || "member",
      }));

      setUsers(merged);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (u.tenantName || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">All Users</h1>
          <p className="text-muted-foreground">View all users across every tenant.</p>
        </div>
        <Badge variant="outline" className="text-sm"><Users className="h-3 w-3 mr-1" />{users.length} users</Badge>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.tenantName}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" || u.role === "super_admin" ? "default" : "secondary"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
