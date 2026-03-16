import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard } from "lucide-react";

const plans = [
  { name: "Free", price: "$0", features: ["5 members", "3 projects", "Basic analytics"] },
  { name: "Pro", price: "$29/mo", features: ["50 members", "Unlimited projects", "Advanced analytics", "Priority support"] },
  { name: "Enterprise", price: "Custom", features: ["Unlimited", "Dedicated support", "SSO", "SLA"] },
];

export default function DashboardBilling() {
  const { tenant } = useAuth();
  const currentPlan = tenant?.plan || "free";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and payments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Badge variant="default" className="capitalize">{currentPlan}</Badge>
            <span className="text-sm text-muted-foreground">
              {currentPlan === "free" ? "5 members · 3 projects" : currentPlan === "pro" ? "50 members · Unlimited projects" : "Unlimited"}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.name.toLowerCase() === currentPlan;
          return (
            <Card key={plan.name} className={isCurrent ? "border-primary ring-1 ring-primary/20" : ""}>
              <CardContent className="p-6">
                <h3 className="font-display font-semibold text-foreground">{plan.name}</h3>
                <p className="text-2xl font-display font-bold text-foreground mt-2">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-success" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={isCurrent ? "secondary" : "hero"}
                  className="w-full mt-6"
                  disabled={isCurrent}
                >
                  {isCurrent ? "Current Plan" : "Upgrade"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
