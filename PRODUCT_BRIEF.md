AI Social Engineering Defense Trainer — simulates phishing/scams, trains employees 

 

1) Product Description & Presentation 

One-liner 

“Ethical attack simulations + instant coaching that turn your org into a phishing-resistant, scam-aware team.” 

What it produces 

Realistic but safe simulations: email (phishing/QR), SMS (smishing), voice (vishing), chat (Slack/Teams), and web landing pages with controlled telemetry. 

Just-in-time coaching: when a user clicks/answers, a friendly explainer pops up with what went wrong and how to spot it next time. 

Analytics: risk heatmaps by org/unit/role, campaign performance, time-to-report, trending lures. 

Learning packs: micro-courses, quizzes, scenario walkthroughs, policy reminders. 

Exports: PDF exec report, CSV event logs, SCORM/xAPI packages, JSON bundle (campaigns, templates, outcomes). 

Scope/Safety 

Defense training only: simulations restricted to verified corporate domains, devices, and comms (no external targets). 

Content guardrails: no harassment, PII harvest, credential theft or malware; never exfiltrate real data; landing pages are sandboxed look-alikes. 

Consent & notice options: overt (“training in progress”) or covert with policy approval and opt-out lists. 

 

2) Target User 

Security awareness & GRC teams needing measurable, ongoing training. 

CISOs/IT leaders tracking risk posture and compliance (ISO 27001, SOC 2). 

People & Ops aligning onboarding and quarterly refreshers. 

MSSPs running multi-tenant training programs. 

 

3) Features & Functionalities (Extensive) 

Simulation Channels 

Phishing (Email): O365/Gmail connectors; HTML/brand skins; reply-to traps; QRishing (QR codes). 

Smishing (SMS): Twilio/MSG91; “delivery problem”, MFA reset, gift card angles. 

Vishing (Voice): TTS + call scripts, optional voice-clone for internal leaders with explicit written consent; caller ID masking within legal bounds. 

Chat (Slack/Teams): app bots & webhook messages; link-preview traps; OAuth consent lures. 

Web Pages: templated “fake” portals with red banners (“Training site”) and no credential capture—only telemetry. 

Content Intelligence 

Template library with difficulty tiers (beginner→advanced) and lure families (payroll, MFA, parcel, SaaS, travel). 

AI generator (guardrailed) that adapts tone/brand to internal context (tools used, current season) while stripping sensitive claims; auto-localization. 

Rotation logic to avoid repeat fatigue and ensure fair exposure across lures. 

Targeting & Scheduling 

Smart cohorts: department, role risk (finance, IT admins), new-joiners, geos. 

Calendar windows (avoid on-call hours); throttling to prevent blast storms. 

Adaptive campaigns: escalate difficulty for resilient users; slow down for high-risk cohorts. 

Telemetry & Coaching 

Events: delivered/opened/clicked/replied/attachment-opened/QR scanned/credential attempt (blocked)/reported. 

On-click coach: modal or page overlay explaining 3–5 detectable tells (SPF/DKIM mismatch, URL homograph, sense of urgency). 

Report-phish plugins**:** Outlook add-in, Gmail add-on, Slack “Report” button; reward positive reports. 

Learning & Policy 

Micro-lessons mapped to NIST 800-53 AT, ISO A.6.3; quizzes & scenario drills; auto-assign on failure. 

LMS integrations (SCORM 1.2/2004, xAPI/LRS); completions back-sync. 

Analytics & Governance 

Risk scoring per user/group (click propensity, report rate, dwell time). 

Heatmaps & trendlines; funnel (delivered→opened→clicked→reported). 

Quarterly Board pack; audit trail for every simulation. 

Waivers/exclusions list (legal, exec assistants, high-risk roles) with expiry. 

 

4) Backend Architecture (Extremely Detailed & Deployment-Ready) 

4.1 Topology 

Frontend/BFF: Next.js 14 (App Router) on Vercel; Server Actions for signed exports, secure template rendering; SSR dashboards. 

API Gateway: NestJS (Node 20) — REST /v1, OpenAPI 3.1, Zod validation, Problem+JSON, Casbin RBAC, Row-Level Security (org_id), Idempotency-Key, Request-ID (ULID). 

Workers (Python 3.11 + FastAPI control) 

content-worker: prompt-safe template generation, brand theming, localization. 

deliver-worker: channel sends (SMTP/API, SMS, voice, Slack/Teams) with retry/backoff. 

telemetry-worker: webhook/event collectors, deduplication, anti-bot filtering. 

coach-worker: JIT coaching payloads, language selection, quiz assignment. 

risk-worker: scoring & cohorting; trend models. 

export-worker: PDF/CSV/JSON, SCORM/xAPI packages. 

Event bus: NATS (campaign.schedule, content.make, deliver.send, event.ingest, coach.send, risk.update, export.make) + Redis Streams for progress. 

Datastores 

Postgres 16 + pgvector (orgs, users, templates, campaigns, deliveries, events, scores, lessons). 

ClickHouse (high-volume events; retention & rollups). 

S3/R2 (assets, exports). 

Redis (rate limits, dedupe keys, OTP for previews). 

Observability: OpenTelemetry (traces), Prometheus/Grafana, Sentry. 

Secrets: KMS; per-tenant signing keys, SMTP/API tokens; envelope encryption. 

4.2 Data Model (Postgres + pgvector) 

CREATE TABLE orgs (id UUID PRIMARY KEY, name TEXT, plan TEXT DEFAULT 'pro', region TEXT, created_at TIMESTAMPTZ DEFAULT now()); 
CREATE TABLE users ( 
  id UUID PRIMARY KEY, org_id UUID, email CITEXT UNIQUE, name TEXT, dept TEXT, role TEXT, locale TEXT, 
  risk_score NUMERIC DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now() 
); 
 
CREATE TABLE templates ( 
  id UUID PRIMARY KEY, org_id UUID, channel TEXT, difficulty TEXT, title TEXT, body_md TEXT, 
  variables JSONB, guardrails JSONB, embedding VECTOR(768), created_at TIMESTAMPTZ DEFAULT now() 
); 
CREATE INDEX ON templates USING hnsw (embedding vector_cosine_ops); 
 
CREATE TABLE campaigns ( 
  id UUID PRIMARY KEY, org_id UUID, name TEXT, channel TEXT[], start_at TIMESTAMPTZ, end_at TIMESTAMPTZ, 
  cohort JSONB, rotation JSONB, status TEXT, created_by UUID, created_at TIMESTAMPTZ DEFAULT now() 
); 
 
CREATE TABLE deliveries ( 
  id UUID PRIMARY KEY, campaign_id UUID, user_id UUID, channel TEXT, template_id UUID, 
  send_at TIMESTAMPTZ, status TEXT, provider_msg_id TEXT, meta JSONB 
); 
 
CREATE TABLE events ( 
  id UUID PRIMARY KEY, org_id UUID, delivery_id UUID, user_id UUID, kind TEXT, 
  ts TIMESTAMPTZ, ip INET, ua TEXT, ref TEXT, meta JSONB 
); 
 
CREATE TABLE lessons ( 
  id UUID PRIMARY KEY, org_id UUID, title TEXT, scorm_key TEXT, xapi_activity JSONB, duration_min INT 
); 
 
CREATE TABLE assignments ( 
  id UUID PRIMARY KEY, user_id UUID, lesson_id UUID, assigned_at TIMESTAMPTZ, due_at TIMESTAMPTZ, status TEXT 
); 
 
CREATE TABLE reports (id UUID PRIMARY KEY, org_id UUID, period_daterange DATERANGE, s3_key TEXT, created_at TIMESTAMPTZ DEFAULT now()); 
 
CREATE TABLE audit_log (id BIGSERIAL PRIMARY KEY, org_id UUID, user_id UUID, action TEXT, target TEXT, meta JSONB, created_at TIMESTAMPTZ DEFAULT now()); 
  

Invariants 

RLS on all tables by org_id. 

deliveries only to emails/domains verified in orgs; SMS/voice restricted to allowlisted ranges. 

Landing pages never store credentials; only “attempted” telemetry. 

4.3 API Surface (REST /v1) 

Org & Identity 

POST /orgs {name, region} 

POST /users/bulk CSV {email, dept, role, locale} 

Templates & Content 

POST /templates/generate {channel, tone, difficulty, constraints} 

GET /templates?channel=email&difficulty=adv 

POST /landing/preview {template_id} → signed URL (time-boxed) 

Campaigns 

POST /campaigns {name, channel, start_at, cohort, rotation} 

POST /campaigns/:id/launch / POST /campaigns/:id/pause 

GET /campaigns/:id/overview (funnel, heatmaps) 

Telemetry & Coaching 

POST /events/ingest (signed webhook from landing/chat/voice handlers) 

POST /coach/assign {delivery_id, lesson_id} 

LMS & Reporting 

POST /assignments {user_id, lesson_id, due_at} 

POST /exports/report {period:"Q3-2025", format:"pdf|csv|json"} 

Conventions: Idempotency-Key; cursor pagination; SSE /campaigns/:id/stream for live stats. 

4.4 Pipelines 

Content → safe prompt → template & landing page → internal brand skin → localization → QA. 

Schedule → cohort resolve → send batches → anti-spam throttles → DKIM/DMARC align. 

Telemetry → clicks/replies/QR scans → on-click coach → auto-assign lesson based on failure reason. 

Risk → update user/group scores → trend models → recommend next campaign mix. 

Report → board pack & CSV → LMS completions sync. 

4.5 Security & Compliance 

SSO (SAML/OIDC), SCIM provisioning; MFA; least-privileged roles (admin, author, operator, analyst). 

Strict no real credential or card capture; red “Training Environment” badges; WORM storage for audit. 

GDPR/CCPA: DSR endpoints; retention windows; per-tenant data residency. 

 

5) Frontend Architecture (React 18 + Next.js 14 — Looks Matter) 

5.1 Design Language 

shadcn/ui + Tailwind; glass panels with soft neon highlights; dark mode default. 

Framer Motion micro-interactions (funnel bars grow, risk dots pulse, confetti on “report-phish”). 

Data-dense but friendly: color-blind safe palettes; monospace for headers/URLs. 

5.2 App Structure 

/app 
  /(auth)/sign-in/page.tsx 
  /(app)/dashboard/page.tsx 
  /(app)/campaigns/page.tsx 
  /(app)/campaigns/[id]/page.tsx 
  /(app)/templates/page.tsx 
  /(app)/audience/page.tsx 
  /(app)/learning/page.tsx 
  /(app)/reports/page.tsx 
  /(app)/settings/page.tsx 
/components 
  RiskHeatmap/*            // org->dept->team drilldown 
  FunnelChart/*            // delivered->opened->clicked->reported 
  TemplateStudio/*         // WYSIWYG + guardrails + localization 
  LandingBuilder/*         // theme, preview, signed URL 
  CohortPicker/*           // dept/role/tenure filters 
  SchedulePanel/*          // throttle windows, send cadence 
  LiveFeed/*               // real-time events ticker 
  CoachConfig/*            // JIT coach content & quiz mapping 
  LMSBridge/*              // SCORM/xAPI config and sync 
  ReportWizard/*           // exec pack generator 
/store 
  useCampaignStore.ts 
  useTemplateStore.ts 
  useAudienceStore.ts 
  useRiskStore.ts 
  useLearningStore.ts 
  useReportStore.ts 
/lib 
  api-client.ts 
  sse-client.ts 
  zod-schemas.ts 
  rbac.ts 
  

5.3 Key UX Flows 

Template Studio: pick channel → generate draft (with guardrails) → insert variables → live preview in device frames (email/mobile/chat). 

Audience & Schedule: choose cohorts, blackout windows, throttles → launch wizard with deliverability checks (SPF/DKIM/DMARC status). 

Live Campaign: watch LiveFeed, funnel chart animates; click a user → see coaching moment & assigned lesson. 

Learning: map failures to micro-lessons; track completions; nudge overdue users. 

Reporting: RiskHeatmap → filter by role & region → export board pack. 

5.4 Validation & Errors 

Zod validation; Problem+JSON toasts; pre-launch checks: verified domains, allowlisted phone ranges, Slack app install. 

Landing pages force Training watermark; credential fields disabled. 

Rate-limit guards and bounce/complaint monitoring. 

5.5 A11y & i18n 

Large text & high-contrast modes; keyboard-first; screen-reader labels. 

Full localization support for UI, templates, and coach content. 

 

6) SDKs & Integration Contracts 

Create & launch a campaign 

POST /v1/campaigns 
{ 
  "name":"Q4 Smishing + MFA reset", 
  "channel":["sms","email"], 
  "start_at":"2025-10-01T08:00:00Z", 
  "cohort":{"dept":["Finance","HR"],"region":["SE","DE"]}, 
  "rotation":{"difficulty":"mixed","lures":["payroll","parcel","mfa"]} 
} 
POST /v1/campaigns/{id}/launch 
  

Generate a safe email template 

POST /v1/templates/generate 
{ 
  "channel":"email", 
  "tone":"corporate", 
  "difficulty":"advanced", 
  "constraints":{"no_credential_fields":true,"watermark":true,"domain_lock":true} 
} 
  

Ingest a click event (from training landing page) 

POST /v1/events/ingest 
{ 
  "delivery_id":"UUID", 
  "kind":"clicked", 
  "ts":"2025-08-28T09:23:12Z", 
  "ip":"203.0.113.42", 
  "ua":"Mozilla/5.0", 
  "meta":{"lp":"mfa_reset_v3"} 
} 
  

Assign a micro-lesson 

POST /v1/coach/assign 
{ "delivery_id":"UUID", "lesson_id":"UUID" } 
  

Export quarterly board report 

POST /v1/exports/report 
{ "period":"2025-Q3", "format":"pdf" } 
  

JSON bundle keys: templates[], campaigns[], deliveries[], events[], lessons[], assignments[], reports[]. 

 

7) DevOps & Deployment 

FE: Vercel (Next.js). 

APIs/Workers: GKE/Fly/Render; autoscale by queue depth; DLQ with jitter backoff. 

Data: Managed Postgres + pgvector; ClickHouse cluster for events. 

Cache/Bus: Redis + NATS. 

Storage: S3/R2 with signed URLs; CDN for static assets/landings. 

CI/CD: GitHub Actions (lint/typecheck/unit/integration, content safety tests, image scan, sign, deploy). 

SLOs 

Campaign launch commit → first sends < 60 s p95. 

Event ingest → dashboard reflect < 5 s p95. 

JIT coach render < 300 ms p95. 

Report export (quarter) < 20 s p95. 

 

8) Testing 

Unit: template guardrails, domain locks, event dedupe, risk scoring. 

Integration: O365/Gmail send, Slack/Teams bot post, Twilio SMS/voice; webhook ingestion. 

Content Safety: prohibited phrases, credential field blocks, watermark enforcement. 

Deliverability: SPF/DKIM/DMARC checks; bounce/complaint handling; rate limits. 

A/B: template difficulty vs click/report rates. 

Load/Chaos: 100k deliveries/min, provider throttling; backoff & replay. 

Security: RLS coverage; token scoping; audit immutability; opt-out honored. 

 

9) Success Criteria 

Product KPIs 

Click-through rate (fail) ↓ ≥ 50% in 90 days; report-rate ↑ ≥ 2×. 

Time-to-report median < 10 min by quarter 2. 

Lesson completion ≥ 90% within 7 days of assignment. 

Exec satisfaction (board pack clarity) ≥ 4.6/5. 

Engineering SLOs 

Delivery error rate < 0.5% excluding bounces. 

Telemetry loss < 0.3% p99. 

Guardrail bypass rate = 0 in production (credential fields, watermark). 

 

10) Visual/Logical Flows 

A) Plan 

 Security team picks channels, cohorts, and schedule → Template Studio finalizes content (guardrails pass) → Launch. 

B) Deliver 

 Batched sends (email/SMS/voice/chat) → DKIM/DMARC aligned → real-time LiveFeed. 

C) Interact 

 User opens/clicks/replies/scans → safe landing page shows JIT coach → optional micro-lesson assignment. 

D) Measure 

 Events roll into RiskHeatmap and funnel → cohorts re-scored → suggested next campaign mix generated. 

E) Report & Improve 

 Board pack exports + LMS completion sync → policy reminders triggered → rotate lures & difficulty for next cycle. 

 

 