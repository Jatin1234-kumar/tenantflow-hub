import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, UserPlus, CreditCard, AlertTriangle, CheckCircle } from "lucide-react";

const notifications = [
  { icon: CheckCircle, title: "Account created successfully", desc: "Your workspace is ready to use", time: "Just now", type: "success" },
  { icon: UserPlus, title: "Team invitation sent", desc: "Invitation email sent to team@company.com", time: "2 min ago", type: "info" },
  { icon: CreditCard, title: "Payment received", desc: "Pro plan subscription activated", time: "1 hour ago", type: "success" },
  { icon: AlertTriangle, title: "Storage limit approaching", desc: "You've used 80% of your storage quota", time: "3 hours ago", type: "warning" },
];

export default function DashboardNotifications() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Stay updated on workspace activity</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <Bell className="h-4 w-4" /> Recent Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {notifications.map((n, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                  n.type === "success" ? "bg-success/10" : n.type === "warning" ? "bg-warning/10" : "bg-primary/10"
                }`}>
                  <n.icon className={`h-4 w-4 ${
                    n.type === "success" ? "text-success" : n.type === "warning" ? "text-warning" : "text-primary"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
