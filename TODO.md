# TODO.md

## Development Roadmap

### Phase 1: Foundations & Infrastructure ✅ COMPLETED
- [x] Initialize monorepo (frontend, backend, workers).  
- [x] Set up Next.js 14 frontend with Tailwind + shadcn/ui.  
- [x] Initialize NestJS API Gateway with REST /v1, Zod validation, Casbin RBAC, RLS.  
- [x] Configure Postgres + pgvector, Redis, NATS, ClickHouse, S3/R2 with Docker Compose.  
- [x] Authentication: SSO (SAML/OIDC), SCIM provisioning, MFA.  
- [x] CI/CD pipeline: GitHub Actions with lint, tests, content safety checks.  

### Phase 2: Simulation Channels & Content ✅ COMPLETED
- [x] Implement content-worker: safe prompt templates, guardrails, localization.  
- [x] Build Template Studio & Landing Builder (preview, watermark enforcement).  
- [x] Deliver-worker for email (O365/Gmail), SMS (Twilio/MSG91), voice (TTS scripts), chat (Slack/Teams).  
- [x] Sandbox landing pages with telemetry but no credential capture.  
- [x] Template library with difficulty tiers and lure families.  
- [x] AI generator for contextualized templates (guardrails enforced).  

### Phase 3: Campaigns, Telemetry & Coaching ✅ COMPLETED
- [x] Campaign creation: cohort picker, schedule, rotation logic.  
- [x] Deliveries with throttling, DKIM/DMARC checks.  
- [x] Telemetry-worker for event ingestion (clicks, opens, QR scans, reports).  
- [x] JIT coach-worker: explainers with tells, auto-assign micro-lessons.  
- [x] Plugins: Outlook/Gmail/Slack "Report Phish" integration.  
- [x] Cohort risk scoring & adaptive campaign escalation.  

### Phase 4: Learning, Analytics & Reporting ✅ COMPLETED
- [x] Micro-lessons mapped to standards (NIST/ISO).  
- [x] LMS integrations: SCORM/xAPI packaging, sync completions.  
- [x] Risk-worker: per-user/org scores, trend modeling.  
- [x] Analytics dashboards: risk heatmap, funnel charts, live feed.  
- [x] Export-worker: board packs, PDF/CSV/JSON, SCORM/xAPI.  
- [x] ReportWizard UI for exec-friendly packs.  

### Phase 5: Privacy, Testing & Deployment ✅ COMPLETED
- [x] Privacy: waiver/exclusions list, opt-out, data residency enforcement.  
- [x] Security: RLS enforcement, token scopes, immutable audit logs, guardrail tests.  
- [x] Unit tests: template guardrails, event deduplication, risk scoring.  
- [x] Integration tests: O365/Gmail/Slack/Twilio sends + webhook ingestion.  
- [x] Load/chaos: 100k deliveries/min, provider throttling, retry/backoff.  
- [x] Deploy frontend to Vercel, backend to GKE/Fly/Render.  
- [x] Monitoring: OpenTelemetry, Prometheus, Grafana, Sentry.  
