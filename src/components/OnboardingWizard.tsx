import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, Users, CheckSquare, Rocket, ArrowRight, Sparkles } from "lucide-react";

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to TenantFlow!",
    description: "Your workspace is ready. Let's get you set up in a few quick steps.",
    action: null,
  },
  {
    icon: FolderKanban,
    title: "Create your first project",
    description: "Projects help you organize work. Start by creating one for your team.",
    action: { label: "Create Project", url: "/dashboard/projects" },
  },
  {
    icon: Users,
    title: "Invite your team",
    description: "Collaboration is key. Invite team members to your workspace.",
    action: { label: "Invite Members", url: "/dashboard/team" },
  },
  {
    icon: CheckSquare,
    title: "Add tasks",
    description: "Break work into tasks and assign them to your team.",
    action: { label: "Create Tasks", url: "/dashboard/tasks" },
  },
  {
    icon: Rocket,
    title: "You're all set!",
    description: "Your workspace is ready to go. Explore the dashboard and start building.",
    action: { label: "Go to Dashboard", url: "/dashboard" },
  },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  const handleAction = () => {
    if (step === steps.length - 1) {
      onComplete();
      if (current.action) navigate(current.action.url);
      return;
    }
    if (current.action) {
      onComplete();
      navigate(current.action.url);
      return;
    }
    setStep((s) => s + 1);
  };

  return (
    <Card className="max-w-lg mx-auto mt-8 overflow-hidden">
      <div className="h-1.5 bg-muted">
        <div className="h-full bg-gradient-hero transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <CardContent className="p-8 text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        {step === 0 && profile && (
          <p className="text-sm text-muted-foreground mb-2">
            Hi, <span className="font-medium text-foreground">{profile.full_name}</span>! 👋
          </p>
        )}
        <h2 className="font-display text-xl font-bold text-foreground">{current.title}</h2>
        <p className="text-sm text-muted-foreground mt-2 mb-8">{current.description}</p>
        <div className="flex gap-3 justify-center">
          {step > 0 && step < steps.length - 1 && (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>Back</Button>
          )}
          {step < steps.length - 1 && !current.action && (
            <Button variant="hero" size="sm" onClick={handleAction}>
              Get Started <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {current.action && (
            <Button variant="hero" size="sm" onClick={handleAction}>
              {current.action.label} <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
          {step > 0 && step < steps.length - 1 && (
            <Button variant="ghost" size="sm" onClick={() => { onComplete(); }}>
              Skip
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-6">Step {step + 1} of {steps.length}</p>
      </CardContent>
    </Card>
  );
}
