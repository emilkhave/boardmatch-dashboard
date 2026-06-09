# BoardMatch — Board Member Matching Dashboard

A polished first-version prototype for Emil's board-member matching practice. BoardMatch
connects **companies recruiting for board seats** with **candidates seeking board positions**,
and gives Emil an internal cockpit to run the whole matching workflow.

> Prototype only — high-quality mock data, no backend, no real auth. The data model is
> shaped like real database tables so it can move to a real API later.

## Two experiences

### 1. Emil — Admin workspace
- **Overview** — key metrics, pipeline-by-stage funnel, recent activity, strongest active
  matches and active searches.
- **Companies** — searchable directory + full company profiles (open seat, required
  competencies, contact) with that company's live candidate pipeline.
- **Candidates** — searchable directory of all board members with full profiles.
- **Pipeline** — every candidate↔company match in one filterable table, with stale-contact
  flags and fit scores.

### 2. Company workspace
- Companies see **only their own** dashboard.
- A **kanban candidate pipeline** split into stages: New → Interested → Contacted →
  Interview/dialogue → Shortlisted, plus a Decided (Accepted / Not selected) section.
- Clicking any candidate opens a detail panel: name, role, experience, board-relevant
  competencies, contact details, last contact date, notes/status and an activity timeline.

## Tech stack
React 18 · TypeScript · Vite · Tailwind CSS · React Router. No external data calls.

## Getting started
```bash
npm install      # already done if node_modules exists
npm run dev      # start the dev server → http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Logging in (mock)
On the login screen, choose a role — credentials are pre-filled:
- **Emil — Admin** → the full admin workspace.
- **Company** → pick a company from the dropdown to see that company's pipeline.

The selected session is remembered in `localStorage`; use the sign-out icon to switch roles.

## Project structure
```
src/
  data/            mockCompanies.ts · mockCandidates.ts · mockMatches.ts
  types.ts         Company · Candidate · Match · PipelineStage · Session
  lib/             auth (context) · format · pipeline (stage styles, scoring, activity)
  components/      ui · icons · StatCard · StageBadge · CandidateDetail · AdminLayout
  pages/
    Login.tsx
    CompanyDashboard.tsx
    admin/         AdminOverview · AdminCompanies · AdminCompanyDetail
                   AdminCandidates · AdminMatches
  App.tsx          routing + role guards
```

## Candidate intake & Zoho

- **Public landing page** at `/apply` (or `/apply/:companyId` for a specific board seat).
  A candidate reviews the opportunity and clicks **“I’m interested”** → they’re added to the
  **Interested** stage of that company’s pipeline and Emil’s admin pipeline. Details can be
  pre-filled via query params (`?name=…&title=…&email=…`) — this is how a Zoho email merge
  would pass data.
- **Admin → Intake & Zoho** lists shareable landing-page links per company, plus a Zoho
  integration panel (data center, module, Client/Org ID, inbound webhook URL) and a demo
  **“Sync candidates from Zoho”** button so the flow is testable today.
- **Webhook endpoint**: `api/zoho/webhook.ts` (Vercel serverless) — live at
  `/api/zoho/webhook`. Point a Zoho Workflow webhook at it to test delivery.

### Making Zoho sync real (production)
The current sync uses sample records and a stub webhook so the end-to-end flow works in the
browser. Real two-way sync needs a small backend (the `api/` functions + a database):
1. **Auth** — Zoho OAuth 2.0; store the refresh token server-side only.
2. **Read** — Zoho CRM REST API v2 (`/crm/v2/Leads|Contacts`) or Zoho Recruit Candidates.
3. **Realtime in** — Zoho Notifications/Webhook → `POST /api/zoho/webhook` → upsert into the DB.
4. **Write back** — on pipeline stage changes, `PUT` the record in Zoho.

The dashboards would then read candidates/matches from that shared DB instead of localStorage.

## Mock data
10 companies · 26 candidates · ~45 candidate–company matches across all pipeline stages,
with fit scores, last-contact dates, notes and per-match activity history. All dates are
relative to the prototype "today" (4 June 2026) so the demo always feels current.
