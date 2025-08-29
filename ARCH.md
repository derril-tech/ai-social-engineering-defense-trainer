# ARCH.md

## System Architecture — AI Social Engineering Defense Trainer

### High-Level Diagram
```
Frontend (Next.js 14 + React 18)
   | REST / SSE
   v
API Gateway (NestJS)
   | gRPC / NATS
   v
Python Workers (content, deliver, telemetry, coach, risk, export)
   |
   +-- Postgres (pgvector for orgs/users/templates/campaigns)
   +-- ClickHouse (event telemetry)
   +-- Redis (rate limits, dedupe)
   +-- NATS (event bus)
   +-- S3/R2 (assets, exports)
```

### Frontend (Next.js + React)
- **Dashboards**: campaigns, templates, audience, risk, reports.  
- **Components**: RiskHeatmap, FunnelChart, TemplateStudio, LandingBuilder, CohortPicker, LiveFeed, CoachConfig, ReportWizard.  
- **Design**: Tailwind + shadcn/ui, Framer Motion micro-animations.  
- **Accessibility**: high-contrast, keyboard-first, localization support.  

### Backend (NestJS)
- REST API with OpenAPI 3.1.  
- RBAC (Casbin), RLS by org_id.  
- Idempotency-Key, Request-ID headers.  
- SSE for live campaign stats.  
- Validation: Zod schemas, Problem+JSON errors.  

### Workers (Python + FastAPI)
- **content-worker**: safe template generation, guardrails, localization.  
- **deliver-worker**: send via email/SMS/voice/chat APIs with retry/backoff.  
- **telemetry-worker**: event ingestion, dedupe, anti-bot filters.  
- **coach-worker**: on-click explainers, micro-lesson assignment.  
- **risk-worker**: scoring, cohort risk updates, trend models.  
- **export-worker**: PDF/CSV/JSON reports, SCORM/xAPI packages.  

### Eventing
- **NATS Topics**: `campaign.schedule`, `content.make`, `deliver.send`, `event.ingest`, `coach.send`, `risk.update`, `export.make`.  
- **Redis Streams**: progress tracking, deduplication.  

### Data Layer
- **Postgres 16 + pgvector**: orgs, users, templates, campaigns, deliveries, events, scores, lessons.  
- **ClickHouse**: high-volume telemetry (opens, clicks, reports).  
- **Redis**: caching, rate limits, OTP previews.  
- **S3/R2**: asset storage, exports.  
- **Encryption**: Cloud KMS, per-tenant envelopes.  

### Observability & Security
- **Tracing**: OpenTelemetry.  
- **Metrics**: Prometheus + Grafana.  
- **Errors**: Sentry.  
- **Security**: MFA, no credential capture, watermark enforcement, immutable audits.  
- **Compliance**: GDPR/CCPA, consent/opt-out enforcement, per-tenant residency.  

### DevOps & Deployment
- **Frontend**: Vercel.  
- **Backend**: GKE/Fly/Render, autoscaling worker pools.  
- **CI/CD**: GitHub Actions (lint, typecheck, integration, deploy).  
- **Storage/CDN**: S3/R2 + CDN for assets and landings.  
