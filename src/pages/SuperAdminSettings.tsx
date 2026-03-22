import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Database, Server, Globe } from "lucide-react";

export default function SuperAdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground">System configuration and platform info.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Platform Info</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Version</span><Badge variant="outline">1.0.0</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Environment</span><Badge variant="outline">Production</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Region</span><Badge variant="outline">Auto</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Database</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Engine</span><Badge variant="outline">PostgreSQL</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">RLS</span><Badge>Enabled</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Realtime</span><Badge variant="outline">Available</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Auth</span><Badge>JWT + OAuth</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tenant Isolation</span><Badge>RLS Enforced</Badge></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Audit Logs</span><Badge>Active</Badge></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Plans</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between"><span className="text-muted-foreground">Free</span><span className="text-sm">5 users</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pro</span><span className="text-sm">50 users</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Enterprise</span><span className="text-sm">Unlimited</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
