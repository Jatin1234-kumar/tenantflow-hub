import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Building2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function DashboardProfile() {
  const { profile, role, tenant, user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) setFullName(profile.full_name);
  }, [profile]);

  const initials = fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display font-bold">{initials}</AvatarFallback>
            </Avatar>
            <h3 className="font-display font-semibold text-foreground">{profile?.full_name || "User"}</h3>
            <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
            <Badge variant="default" className="mt-3 capitalize">{role?.role || "member"}</Badge>
            <div className="w-full mt-6 space-y-3 text-left">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" /> {tenant?.name || "No workspace"}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" /> {tenant?.plan || "free"} plan
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" /> Joined {profile?.created_at ? format(new Date(profile.created_at), "MMM d, yyyy") : "—"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="profileName">Full Name</Label>
              <Input id="profileName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="mt-1.5" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div>
              <Label>User ID</Label>
              <Input value={user?.id || ""} disabled className="mt-1.5 font-mono text-xs" />
            </div>
            <Button variant="hero" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
