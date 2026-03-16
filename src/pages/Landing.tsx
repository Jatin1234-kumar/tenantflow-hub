import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Users, Shield, BarChart3, Zap, Building2, Lock,
  Check, ChevronRight, Menu, X
} from "lucide-react";
import { useState } from "react";

const features = [
  { icon: Building2, title: "Multi-Tenant", desc: "Isolated data per organization with complete tenant separation" },
  { icon: Users, title: "Team Management", desc: "Invite members, assign roles, manage permissions effortlessly" },
  { icon: Shield, title: "Role-Based Access", desc: "Granular RBAC with admin, manager, member & viewer roles" },
  { icon: BarChart3, title: "Analytics", desc: "Real-time dashboards with usage stats and activity tracking" },
  { icon: Zap, title: "Instant Setup", desc: "Sign up, create your workspace, and start building in seconds" },
  { icon: Lock, title: "Enterprise Security", desc: "JWT auth, tenant isolation, audit logs, and rate limiting" },
];

const plans = [
  { 
    name: "Free", price: "$0", period: "/mo", 
    features: ["5 team members", "3 projects", "Basic analytics", "Email support"],
    popular: false
  },
  { 
    name: "Pro", price: "$29", period: "/mo", 
    features: ["50 team members", "Unlimited projects", "Advanced analytics", "Priority support", "Custom branding", "API access"],
    popular: true
  },
  { 
    name: "Enterprise", price: "Custom", period: "", 
    features: ["Unlimited members", "Unlimited everything", "Dedicated support", "SSO / SAML", "Custom integrations", "SLA guarantee"],
    popular: false
  },
];

const faqs = [
  { q: "What is multi-tenancy?", a: "Multi-tenancy means each organization (tenant) gets their own isolated workspace. Data is completely separated between tenants for security and privacy." },
  { q: "Can I invite my team?", a: "Yes! Admins can invite unlimited team members via email. Each member gets role-based access controls." },
  { q: "How secure is the platform?", a: "We use JWT authentication, row-level security, tenant data isolation, and audit logging. Your data is encrypted at rest and in transit." },
  { q: "Can I upgrade my plan later?", a: "Absolutely. You can upgrade or downgrade your plan at any time. Changes take effect immediately." },
];

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">TenantFlow</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
            <Link to="/signup"><Button variant="hero" size="sm">Get Started</Button></Link>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X /> : <Menu />}
          </button>
        </div>
        
        {mobileMenu && (
          <div className="md:hidden border-t bg-card p-4 space-y-3">
            <a href="#features" className="block text-sm text-muted-foreground">Features</a>
            <a href="#pricing" className="block text-sm text-muted-foreground">Pricing</a>
            <a href="#faq" className="block text-sm text-muted-foreground">FAQ</a>
            <div className="flex gap-2 pt-2">
              <Link to="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link to="/signup"><Button variant="hero" size="sm">Get Started</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground mb-8">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Multi-Tenant SaaS Platform
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight mb-6">
              Build your SaaS
              <br />
              <span className="text-gradient">in minutes</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Complete multi-tenant infrastructure with auth, team management, billing, and analytics. Focus on your product, not plumbing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button variant="hero" size="lg" className="text-base px-8">
                  Start Free <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="hero-outline" size="lg" className="text-base px-8">
                  See Features
                </Button>
              </a>
            </div>
          </motion.div>

          {/* Dashboard preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 rounded-xl border bg-card shadow-lg overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
              </div>
              <div className="flex-1 text-center text-xs text-muted-foreground">dashboard.tenantflow.app</div>
            </div>
            <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: "2,847", change: "+12%" },
                { label: "Projects", value: "156", change: "+8%" },
                { label: "Active Now", value: "342", change: "+24%" },
                { label: "Revenue", value: "$45.2k", change: "+18%" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-lg bg-muted/50 text-left">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-success mt-1">{stat.change}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Production-ready multi-tenant infrastructure so you can focus on what makes your product unique.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-xl border bg-card hover:shadow-lg hover:border-primary/20 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Simple pricing</h2>
            <p className="text-muted-foreground">Start free, scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-xl border bg-card ${
                  plan.popular ? "border-primary shadow-glow ring-1 ring-primary/20" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-hero text-xs font-medium text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display font-semibold text-lg text-foreground">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-display font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button
                    variant={plan.popular ? "hero" : "outline"}
                    className="w-full"
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-lg bg-card overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left font-medium text-foreground hover:bg-muted/50 transition-colors"
                >
                  {faq.q}
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${openFaq === i ? "rotate-90" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-hero flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-foreground">TenantFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 TenantFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
