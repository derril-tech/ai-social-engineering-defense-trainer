# PLAN.md

## Product: AI Social Engineering Defense Trainer

### Vision & Goals
Deliver **safe, realistic phishing/scam simulations** across multiple channels (email, SMS, voice, chat, web) with **instant just-in-time coaching** and actionable analytics. Strengthen organizational resilience while ensuring **compliance, consent, and safety guardrails**.

### Key Objectives
- Simulate phishing, smishing, vishing, chat scams, and web lures with telemetry.  
- Provide friendly just-in-time coaching on click/interaction.  
- Deliver micro-lessons, quizzes, and LMS-compatible training packs.  
- Analytics dashboards: risk heatmaps, funnel metrics, campaign reports.  
- Ensure strong guardrails: sandboxed landings, no credential capture, red badges.  

### Target Users
- Security awareness & GRC teams.  
- CISOs / IT leadership for compliance tracking.  
- HR/People Ops integrating onboarding & refreshers.  
- MSSPs delivering multi-tenant awareness programs.  

### High-Level Approach
1. **Frontend (Next.js 14 + React 18)**  
   - Campaign dashboards, template studio, risk analytics.  
   - Just-in-time coaching modals & lesson assignments.  
   - Tailwind + shadcn/ui design; Framer Motion animations.  

2. **Backend (NestJS + Python Workers)**  
   - REST API with RBAC, RLS, OpenAPI 3.1.  
   - Workers: content, deliver, telemetry, coach, risk, export.  
   - Event-driven architecture with NATS + Redis.  
   - Postgres + pgvector for orgs, users, templates, scores.  
   - ClickHouse for high-volume event telemetry.  

3. **DevOps & Deployment**  
   - Vercel (frontend), GKE/Fly/Render (backend).  
   - Managed Postgres, Redis, NATS, ClickHouse cluster.  
   - CI/CD via GitHub Actions (lint, typecheck, integration, deploy).  
   - Observability: OpenTelemetry, Prometheus, Grafana, Sentry.  

### Success Criteria
- **Product KPIs**:  
  - Phish click rate ↓ ≥50% in 90 days.  
  - Report rate ↑ ≥2× in 2 quarters.  
  - Lesson completion ≥90% within 7 days.  
  - Board report satisfaction ≥4.6/5.  

- **Engineering SLOs**:  
  - Campaign commit → first send < 60s p95.  
  - Event ingest → dashboard < 5s p95.  
  - JIT coach render < 300ms p95.  
  - Report export < 20s p95.  
