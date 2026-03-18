import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Users, Mail, Clock, Trash2, UserMinus, AlertTriangle } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Enums } from "@/integrations/supabase/types";

export default function DashboardTeam() {
  const { tenant, user } = useAuth();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Enums<"app_role">>("member");
  const [removeConfirm, setRemoveConfirm] = useState<{ userId: string; name: string } | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["team-members", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data: profiles } = await supabase.from("profiles").select("*").eq("tenant_id", tenant.id);
      if (!profiles) return [];
      const memberData = await Promise.all(
        profiles.map(async (p) => {
          const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", p.user_id).eq("tenant_id", tenant.id).single();
          return { ...p, role: roleData?.role || "member" };
        })
      );
      return memberData;
    },
    enabled: !!tenant,
  });

  const { data: invitations } = useQuery({
    queryKey: ["invitations", tenant?.id],
    queryFn: async () => {
      if (!tenant) return [];
      const { data } = await supabase.from("invitations").select("*").eq("tenant_id", tenant.id).eq("status", "pending").order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!tenant,
  });

  const sendInvite = useMutation({
    mutationFn: async () => {
      if (!tenant || !user) throw new Error("Not authenticated");
      const { error } = await supabase.from("invitations").insert({
        tenant_id: tenant.id, email: inviteEmail, role: inviteRole, invited_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      setInviteOpen(false); setInviteEmail(""); setInviteRole("member");
      toast.success("Invitation sent!");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const cancelInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!tenant) throw new Error("No tenant");
      // Remove role first, then profile
      const { error: roleErr } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("tenant_id", tenant.id);
      if (roleErr) throw roleErr;
      const { error: profileErr } = await supabase.from("profiles").delete().eq("user_id", userId).eq("tenant_id", tenant.id);
      if (profileErr) throw profileErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      queryClient.invalidateQueries({ queryKey: ["team-count"] });
      setRemoveConfirm(null);
      toast.success("Member removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const changeRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: Enums<"app_role"> }) => {
      if (!tenant) throw new Error("No tenant");
      const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId).eq("tenant_id", tenant.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Role updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": case "super_admin": return "default" as const;
      case "manager": return "secondary" as const;
      default: return "outline" as const;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your workspace members</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button variant="hero" size="sm"><UserPlus className="h-4 w-4 mr-1" /> Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Invite Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); sendInvite.mutate(); }} className="space-y-4">
              <div>
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input id="inviteEmail" type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="teammate@company.com" required className="mt-1.5" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Enums<"app_role">)}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="hero" className="w-full" disabled={sendInvite.isPending}>
                {sendInvite.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Remove member confirmation */}
      <Dialog open={!!removeConfirm} onOpenChange={() => setRemoveConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Remove Member
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{removeConfirm?.name}</strong> from this workspace? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => removeConfirm && removeMember.mutate(removeConfirm.userId)} disabled={removeMember.isPending}>
              {removeMember.isPending ? "Removing..." : "Remove"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Members ({members?.length || 0} / {tenant?.max_users || 5})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}
            </div>
          ) : members?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No team members yet</p>
          ) : (
            <div className="space-y-3">
              {members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {member.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {member.full_name}
                        {member.user_id === user?.id && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">Joined {new Date(member.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {member.user_id === user?.id ? (
                      <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                    ) : (
                      <>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2">
                              <Badge variant={getRoleBadgeVariant(member.role)} className="cursor-pointer">{member.role}</Badge>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(["admin", "manager", "member", "viewer"] as Enums<"app_role">[]).map((r) => (
                              <DropdownMenuItem key={r} onClick={() => changeRole.mutate({ userId: member.user_id, newRole: r })} className="capitalize">
                                {r}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setRemoveConfirm({ userId: member.user_id, name: member.full_name })}>
                          <UserMinus className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invitations && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Mail className="h-4 w-4" /> Pending Invitations ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-warning/10 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">Expires {new Date(inv.expires_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{inv.role}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => cancelInvite.mutate(inv.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
