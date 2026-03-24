import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

type InviteState = "loading" | "valid" | "expired" | "already_used" | "error" | "needs_signup" | "success";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = searchParams.get("token");

  const [state, setState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<any>(null);
  const [tenantName, setTenantName] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setState("error"); return; }
    validateToken();
  }, [token]);

  const validateToken = async () => {
    const { data, error } = await supabase
      .from("invitations")
      .select("*, tenants(name)")
      .eq("token", token!)
      .single();

    if (error || !data) { setState("error"); return; }
    if (data.status === "accepted") { setState("already_used"); return; }
    if (new Date(data.expires_at) < new Date()) { setState("expired"); return; }

    setInvite(data);
    setTenantName((data as any).tenants?.name || "Workspace");

    if (user) {
      await acceptInvitation(data, user.id);
    } else {
      setState("needs_signup");
    }
  };

  const acceptInvitation = async (inv: any, userId: string) => {
    try {
      // Create profile in tenant
      await supabase.from("profiles").insert({
        user_id: userId,
        tenant_id: inv.tenant_id,
        full_name: fullName || user?.user_metadata?.full_name || user?.email || "User",
      });

      // Assign role
      await supabase.from("user_roles").insert({
        user_id: userId,
        tenant_id: inv.tenant_id,
        role: inv.role,
      });

      // Mark invitation as accepted
      await supabase.from("invitations").update({ status: "accepted" }).eq("id", inv.id);

      setState("success");
      toast.success("You've joined the workspace!");
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch {
      setState("error");
    }
  };

  const handleSignupAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite) return;
    setSubmitting(true);
    try {
      const { data: signupData, error } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/accept-invite?token=${token}`,
        },
      });
      if (error) throw error;
      if (signupData.user) {
        await acceptInvitation(invite, signupData.user.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="flex items-center gap-2 mb-6 justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">TenantFlow</span>
          </div>

          {state === "loading" && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Validating invitation...</p>
            </div>
          )}

          {state === "success" && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
              <h2 className="font-display font-bold text-foreground text-lg">Welcome to {tenantName}!</h2>
              <p className="text-sm text-muted-foreground mt-2">Redirecting to dashboard...</p>
            </div>
          )}

          {state === "expired" && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="font-display font-bold text-foreground text-lg">Invitation Expired</h2>
              <p className="text-sm text-muted-foreground mt-2">This invitation has expired. Please ask for a new one.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          )}

          {state === "already_used" && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-display font-bold text-foreground text-lg">Already Accepted</h2>
              <p className="text-sm text-muted-foreground mt-2">This invitation was already used.</p>
              <Button variant="hero" className="mt-4" onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
            </div>
          )}

          {state === "error" && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <h2 className="font-display font-bold text-foreground text-lg">Invalid Invitation</h2>
              <p className="text-sm text-muted-foreground mt-2">This invitation link is invalid or no longer available.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          )}

          {state === "needs_signup" && (
            <div>
              <h2 className="font-display font-bold text-foreground text-lg text-center">
                Join {tenantName}
              </h2>
              <p className="text-sm text-muted-foreground text-center mt-1 mb-6">
                You've been invited as <span className="font-medium capitalize">{invite?.role}</span>
              </p>
              <form onSubmit={handleSignupAndAccept} className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={invite?.email || ""} disabled className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required minLength={6} className="mt-1.5" />
                </div>
                <Button variant="hero" className="w-full" disabled={submitting}>
                  {submitting ? "Creating account..." : "Create Account & Join"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Already have an account? <a href="/login" className="text-primary hover:underline">Sign in</a> first, then use this link again.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
