import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { toast } from "sonner";

export default function DashboardSettings() {
  const { tenant, profile } = useAuth();
  const [companyName, setCompanyName] = useState(tenant?.name || "");
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (tenant) {
        await supabase.from("tenants").update({ name: companyName }).eq("id", tenant.id);
      }
      if (profile) {
        await supabase.from("profiles").update({ full_name: fullName }).eq("id", profile.id);
      }
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your workspace</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Settings className="h-4 w-4" /> Workspace Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="fullName">Your Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Plan</Label>
            <Input value={tenant?.plan || "free"} disabled className="mt-1.5 capitalize" />
          </div>
          <div>
            <Label>Tenant ID</Label>
            <Input value={tenant?.id || ""} disabled className="mt-1.5 font-mono text-xs" />
          </div>
          <Button variant="hero" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
