TenantFlow Hub
===============

One-line summary
-----------------
Production-minded multi-tenant admin dashboard and SaaS starter. React + TypeScript frontend, Supabase (Postgres + RLS) backend, and a set of SQL migrations and RPCs that enforce tenant-scoped RBAC and deterministic onboarding.

Why this repo exists
---------------------
- Demonstrates a secure multi-tenant architecture with DB-level enforcement (RLS + SECURITY DEFINER functions).
- Provides a full admin UI (tenant dashboard + super-admin views) and hardened signup/invite flows.

TL;DR
------
- Tech: React, Vite, TypeScript, Tailwind CSS, Supabase
- Pages: tenant dashboard, billing, analytics, projects, team management, super-admin panel
- DB: `tenants`, `profiles`, `user_roles`, `projects`, `tasks`, `activity_logs`, `invitations`
- Key protections: tenant-scoped `is_super_admin`, role-level helpers, RLS policies, idempotent upserts

Quickstart (local)
-------------------
1. Install:

```bash
npm install
```

2. Add a `.env` file at project root with these variables:

```env
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_URL=https://your.supabase.url
```

3. Start dev server:

```bash
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173` or `http://localhost:8080`).

High-level architecture
-----------------------
- Frontend: SPA with protected routes and role-aware UI components.
- Backend (Supabase): Postgres with Row-Level Security, SQL helper functions (e.g., `is_super_admin`), and migration scripts that harden invite/role flows.
- Principle: enforce authorization in two places — UI for UX and Postgres for security.

File map — where to look first
-----------------------------
- `src/contexts/AuthContext.tsx` — central auth, bootstrap and profile loading logic
- `src/pages/Signup.tsx` — create-tenant / signup flow
- `src/pages/AcceptInvite.tsx` — invite acceptance flow
- `src/components/ProtectedRoute.tsx` — tenant access guard
- `src/hooks/usePermissions.ts` — role hierarchy + permission helpers
- `src/integrations/supabase/client.ts` — Supabase client and env usage
- `supabase/migrations/` — SQL migrations and RPC functions (primary security logic)
- `docs/tenant-architecture.md` — design rationale and diagrams

Key workflows (implementation pointers)
-------------------------------------
Create tenant (self-serve):
- UI: `src/pages/Signup.tsx` submits auth create + RPC
- DB: `handle_new_tenant_signup()` inserts `tenants`, `profiles`, and `user_roles` and sets creator as `super_admin`.

Accept invite:
- UI: `src/pages/AcceptInvite.tsx` validates token and calls `accept_invitation()` RPC.
- DB: RPC validates token, email, expiry and inserts profile+role.

Ensuring tenant owners exist:
- Migrations provide `bootstrap_current_user_context()` and backfills that promote the earliest profile to admin/super_admin when needed.

Database & migrations
---------------------
- Apply migrations in `supabase/migrations/` to your Supabase project before production.
- Use Supabase CLI or CI pipeline:

```bash
supabase db push
```

Notable SQL artifacts:
- `is_super_admin(user_id, tenant_id)` — tenant-scoped super-admin check
- `handle_new_tenant_signup()` — tenant + profile + role creation RPC
- `bootstrap_current_user_context()` — deterministic bootstrap & recovery
- `harden_role_assignment_rbac.sql`, `enforce_project_rbac.sql` — RBAC protections

Environment variables
---------------------
- `VITE_SUPABASE_PROJECT_ID` — Supabase project id (optional in some setups)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/publishable key for client
- `VITE_SUPABASE_URL` — Supabase URL

Common commands
---------------
- `npm run dev` — start dev server
- `npm run build` — build production assets
- `npm run preview` — preview build
- `npm run test` — run Vitest
- `npm run lint` — lint code

Testing & CI
------------
- Unit/component tests: Vitest (config in `vitest.config.ts`).
- E2E: Playwright (config in `playwright.config.ts`).

Security notes (summary)
------------------------
- Removed dangerous global super-admin policies; use tenant-scoped checks.
- RLS policies plus SECURITY DEFINER functions enforce server-side authorization.
- Upserts (`ON CONFLICT`) are used to make role/profile flows idempotent.

Next recommended docs to add
--------------------------
- `.env.example` — list required variables
- Permission matrix — map roles → allowed actions
- Short deployment guide (Vercel/Netlify + migrations step)
- Mermaid or PNG architecture diagram in `docs/`

Contributing
------------
- Open an issue or PR; run `npm run lint && npm run test` locally before submitting.

Contact
-------
Open issues for questions or to request walkthroughs.
