# Golden Pass — UAE Golden Visa & Property Valuation Platform

A real, working Next.js 14 application (App Router + TypeScript + Tailwind + Prisma) implementing the
full flow we prototyped: investor & dependent Golden Visa applications with OCR-driven eligibility,
property valuations, manual payment-link processing, per-person work orders with document review,
government stage tracking (DLD / GDRFA / Medical / Biometrics / Emirates ID), an agent-onboarding
commission system, and a full admin console.

This is a genuine full-stack app — real database, real server-side logic, real sessions — not a
client-side simulation. A few pieces are intentionally stubbed because they need credentials only you
can provide (see **What's stubbed** below); everything else is fully wired.

## Stack

- **Next.js 14** (App Router, Server Actions — no separate REST layer needed)
- **TypeScript** + **Tailwind CSS**
- **Prisma** + **PostgreSQL** (Supabase, Neon, or Vercel Postgres all work)
- Zero extra auth/UI dependencies — sessions are signed HMAC cookies (Node's built-in `crypto`),
  "contact number as password" is hashed with `scrypt`

## Project structure

```
prisma/schema.prisma       Database schema (User, Application, JobOrder, Document, Agent, Notification, LedgerEntry)
prisma/seed.ts              Seeds two sample agents (AG-1001, AG-1002)
src/lib/shared.ts           Pricing, document checklists, OCR simulation — safe for client & server
src/lib/utils.ts            Server-only: Prisma client, sessions, password hashing
src/actions/actions.ts      Every mutation in the app (Server Actions) — auth, applications, admin, agents
src/components/ui.tsx       Logo, 3D tilt card, testimonial marquee, trust badges, bottom nav, top bar
src/components/StageTracker.tsx   Government stage tracker, document badges, update-history timeline
src/app/...                 One folder per route; multi-step wizards are client components, data
                             fetching stays in server components
```

## Local setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up your database.** Get a free Postgres instance from [Supabase](https://supabase.com) or
   [Neon](https://neon.tech), or use Vercel Postgres. Copy `.env.example` to `.env` and fill in
   `DATABASE_URL`.

   ```bash
   cp .env.example .env
   ```

   Also set `SESSION_SECRET` (generate one with `openssl rand -hex 32`) and `ADMIN_EMAIL` /
   `ADMIN_PASSWORD` (the single staff login for this prototype).

3. **Push the schema and seed sample agents**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Run it**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000`.

## Deploying to Vercel

1. Push this project to a GitHub/GitLab repo.
2. In Vercel: **New Project** → import the repo. Framework preset auto-detects Next.js.
3. Add the same environment variables from `.env` in the Vercel project settings
   (**Settings → Environment Variables**): `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`,
   `ADMIN_PASSWORD` at minimum.
4. Deploy. `vercel.json` already points the build command at `prisma generate && next build`.
5. After the first deploy, run `npx prisma db push` and `npm run db:seed` once against your production
   `DATABASE_URL` (from your machine, or via a one-off Vercel CLI command) to create tables and seed
   agents.

## How the core flow maps to code

- **Apply → OCR → eligibility**: `src/app/apply/investor/Wizard.tsx` calls the `ocrCheck()` server
  action, which currently runs `runOcrOnDeed()` in `src/lib/shared.ts` — a randomized but realistic
  simulation. Ownership type is read *from* the OCR result, never asked manually.
- **Invoice → payment**: `submitInvoice()` records billing details and an optional agent code, then an
  admin pastes a payment link (`sendPaymentLink`) and confirms receipt (`confirmPayment`), which is the
  moment `createJobOrdersForApplication()` fires — one work order per person, or one for a valuation.
- **Document upload**: `uploadDocument()` marks a file "OCR confirmed" before it's visible to admin;
  `submitDocuments()` moves the work order into the review queue.
- **Government stages**: `advanceStage()` cycles DLD/GDRFA/Emirates ID through
  pending → applied/printing → approved/courier; `scheduleAppointment()` /
  `completeAppointment()` handle Medical & Biometrics (with a real date shown to the applicant);
  `completeTask()` is the "press complete" button once Emirates ID reaches courier.
- **Agents**: `onboardAgent()` auto-generates the agent number — agents never pick their own code.
  `markCommissionPaid()` is the only point a commission actually hits the ledger, so the ledger never
  double-counts an owed-vs-paid commission.

## What's stubbed (and exactly how to turn each on)

These need accounts/credentials that only you can provide, so they're built as real integration
points with working code paths, just inactive until configured:

| Feature | File | To activate |
|---|---|---|
| Real OCR (title deed extraction) | `src/lib/shared.ts` → `runOcrOnDeed()` | Replace the body with an AWS Textract `AnalyzeDocument` call (Forms+Queries) once `AWS_TEXTRACT_REGION` / AWS keys are set. Budget for a human-review fallback in the admin panel regardless — Textract won't hit 100% on semi-structured deeds. |
| Card payments | `src/app/api/webhooks/stripe/route.ts` | Install `stripe`, set `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`, create a Checkout Session on the payment page keyed to `invoiceNo`, and point Stripe's webhook here. The confirmation logic to call is identical to `confirmPayment()` in `actions.ts`. Telr (the UAE-first recommendation) works the same way with their webhook format. |
| Email notifications | `src/lib/email.ts` | **Wired, just needs a key.** Every `notify()` call (payment link ready, payment confirmed, document rejected, stage updates, task complete, welcome email on signup) already routes through `sendEmail()`. Set `RESEND_API_KEY` and `EMAIL_FROM` and it starts sending — no code changes needed. Uses Resend's REST API directly (no SDK dependency). |
| File storage at scale | `prisma/schema.prisma` → `Document.fileData` | **Real uploads work today** — files are read client-side and stored as base64 directly on the `Document` row, capped at 4MB, so nothing here is fake. That's fine through a few hundred documents; past that, swap to an S3-compatible bucket (AWS S3 or Cloudflare R2): generate a signed upload URL, store the returned key in `fileData` instead of the base64 blob, and the rest of the review flow (View file, image preview) keeps working unchanged. |
| SMS/OTP | — | Not built. The original spec recommends this as the fix for "contact number as password" — use the contact number only as an initial password and force an OTP-verified reset on first login (Twilio or similar). |
| Government portal logins (DLD / GDRFA / ICP / MOHRE) | `src/components/ui.tsx` → `TrustBadges` | **This is currently decorative** — a trust/status strip, not a real login. Real integration requires a formal API partnership with each UAE government entity; there's no generic public API to wire up here. The `advanceStage()` action is exactly where a real webhook or polling call to each entity's API would replace the manual admin button once you have that partnership. |

## Known simplifications worth hardening before a real launch

- **Auth**: "contact number as password" is low-entropy by design (per the original spec). It's
  scrypt-hashed here, but the original security recommendation stands: use the contact number only as
  an initial password and force an OTP-verified reset on first login (Twilio or similar).
- **Single admin account**: fine for a prototype; move to a real `Staff` table with roles before adding
  a second admin.
- **No rate limiting** on login attempts — add before launch.
