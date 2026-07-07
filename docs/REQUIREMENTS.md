# Client Requirements & Business Context

> Purpose: preserve the client's **original ask**, verbatim in substance, separate from our
> engineering decisions/roadmap (which live in `docs/PROGRESS.md` and
> `~/.claude/plans/i-am-building-this-sunny-lynx.md`). Read this file first to understand
> *what the client wants*; read PROGRESS.md for *what we've built and decided*.

## The client

**WX Study** ("We are Study International" / **WRSI**) connects Mexican high-school students
with universities abroad. It's a **2–3 year relationship per student**, starting before
senior year. Primary contact: **Alejandro (Garza Alejandro)**.

## The situation (why this project exists)

The current operation runs on:
- **Squarespace** — marketing site, built in-house
- **Monday.com** — CRM, stretched thin past what it can handle
- **Google Drive** — documents, per-student and per-prepa (high school)
- **WhatsApp groups** — primary comms channel between counselor, student, and parents

Pain points: data lives in too many places; students register twice; events get
re-created from scratch every year with no history; counselors juggle all four systems
per student.

## What's needed (client's own words, lightly formatted)

One platform with role-based logins that replaces Monday and centralizes the student
lifecycle. **Three user types** (plus internal staff):
- **Students** — track application progress, upload documents, see events, consume content
  (videos/mini-courses) to stay engaged during long quiet stretches.
- **Prepas (high schools)** — see their students' progress, help push from the school side.
- **Universities** — update their own profile info (so WX's team doesn't maintain hundreds
  of university pages manually).

Behind the logins: a proper **CRM** where counselors see everything for a student in one
place — documents, application status, conversations, and event history.

## Core features, in the client's priority order

**1. Student login + profile experience — Must have**
- Login for students (alumnos)
- Personal dashboard: application progress, documents, next steps
- Upload documents directly (replaces Drive folder juggling)
- Import de alumnos existentes en Monday (import of existing students)
- Embedded mini-course / content library (videos, resources, onboarding)
- Progress tracking so students feel movement across the 2-year journey
- Event view: register for WX events from inside their login (kills duplicate registration)
- Event history: every event attended across multiple years
- Student history: full historial of everything the student has done with WRSI (camps, etc.)
- Complete list/directory of universities with full info
- Save/apply/like button on a university → notification to WX team
- Sections for seasonal events

**2. Counselor / admin CRM view — Must have**
- Single pane of glass per student: docs, app status, conversations, event history, prepa
  affiliation
- Counselor can update application status, student sees it reflected in their login
- Ideally: send WhatsApp messages from inside the CRM (bulk + 1:1) — via Zapier/Sapier
  automation, **not** direct WhatsApp Business API integration (to avoid blacklist risk)
- **Deduplication logic** — flag or merge duplicate student records automatically
- Notification/reminder if a student's CRM record isn't updated within **X time (1 week)**

**3. Prepa (high school) login — Should have**
- Prepa admin sees only their own students
- If a counselor flags a student as "alert," the prepa can see it and help follow up
- Access to the university directory
- View progress, help chase missing items — lightweight, not everything a counselor sees
- Editable sections for seasonal events

**4. University login — Should have**
- Universities update their own profile (logo, programs, description, requirements)
- Changes reflect immediately in what students see when browsing (database of universities)
- Lifts the manual-maintenance burden off WX's team
- Editable sections for seasonal events

**5. Event management — Must have**
- Annual event: ~30+ universities across ~12 prepas over 5 days + an "Open Fair Day"
- Digital registration tied to student login (no duplicates)
- Open Fair Day: workshop options + one-to-one appointment slots
- Digital capture of student notes / university ranking during the event (replaces paper)
- Multi-year event history per student

**6. Sponsor landing pages — Must have**
- Template-based landing page per sponsor: logo, description, media, WhatsApp CTA
- WhatsApp link pre-fills a message like *"Hola, vengo de WX Study, quiero saber más"*
- Dynamic — WX adds a sponsor to a list, the page generates itself

**7. Payment portal — Nice to have**
- Universities and event sponsors pay WX (students and prepas never pay)
- Currently a manual process, blocking revenue (one client stuck since November)
- Simple credit-card checkout link per invoice

**8. Website refresh — Must have, separate track**
- 3–4 page marketing site rebuild; doesn't need to be fancy (most of the product lives
  behind login)
- Recommend **Webflow over Squarespace** for flexibility, SEO headroom, ad-tracking
  integration (Google Ads planned late 2026 / early 2027)

## Recommended architecture (from the client's original brief)

The client's brief itself suggested evaluating a **community-platform** approach (e.g.
BuddyBoss-style — ships with logins/roles/courses/events/discussions/gamification/payments,
open API, pattern validated with "School of Style" / UPROXX) **vs. a custom build**.

> **We decided custom build on Supabase instead** — see the "Decisions already made" section
> of the plan file for the full reasoning (control over the bespoke CRM/status workflow/dedup
> logic; matches the existing Turborepo/Expo scaffold). Not revisited since.

## The client's own phased roadmap (their document, not our sprint plan)

This is *their* phase breakdown from the original planning document — distinct from our
execution roadmap in the plan file, though we mapped closely to it for Phase 0/1:

- **Phase 0 — Discovery & Architecture** (1–2 weeks): DB design, roles, permission matrix,
  student lifecycle, application-status workflow, wireframes, technical architecture, Monday
  migration strategy; business-side: define all forms, application stages, university/HS info
  structure, required reports.
- **Phase 1 — MVP Launch** (8–12 weeks): user management (roles incl. Super Admin, Admin,
  Counselor, Student, University, High School), student CRM, student dashboard + onboarding,
  application status system, document management, search/filtering, initial event management,
  university database, high school database, localization (es/en), Monday data migration.
- **Phase 2 — Self-Service Portals & Operational Improvements** (4–6 weeks): university
  portal, high school portal, student history timeline, automated notifications, CRM activity
  monitoring (the 7-day-inactivity alert).
- **Phase 3 — Engagement & Growth Features** (4–8 weeks): content library, mini courses,
  university favorites, seasonal events.
- **Phase 4 — Advanced Operations** (4–8 weeks): WhatsApp automation (via automation
  providers), sponsor pages, payment portal, reporting & analytics.

**We are executing Phase 0 + Phase 1** for the September deadline (see plan file for the
detailed engineering breakdown and milestone order).

## Detailed onboarding data points the client specified

Countries of interest; desired start date (intake season: fall/winter/spring-summer + year,
up to 6 years out); highest education level achieved + average grade (grade 12/HS, post-sec
certificate, undergrad diploma, undergrad advanced diploma, 3-yr bachelor's, 4-yr bachelor's,
postgrad certificate/diploma, master's, doctoral/PhD/MD); fields of study of interest;
intended level of study (master's/postgrad, bachelor's, college diploma/certificate);
nationality; English level (CEFR-style reference **or** named exam — IELTS/TOEFL/PTE/
Cambridge/other).

## Explicit open questions from the client's own document

These were flagged by the client as needing answers before building the status system —
**still deferred** (see `docs/PROGRESS.md` "Open items"):
1. What statuses exist? (e.g., "etapa short course" was mentioned as one example track)
2. Who can change them — student indirectly via progress, counselor/admin directly?
3. When can they change, and how do you define going back to an old status?

The client's own note: *"notificar cuando no se ha actualizado el status de aplicación de
un alumno"* (notify when a student's application status hasn't been updated in X days) —
this is the same 7-day CRM-inactivity reminder from feature #2 above.

## Timeline & constraints

- **Target: full first release (Phase 0 + Phase 1) by end of September 2026.**
- Developer is **solo** — drives aggressive scope discipline (see plan file "Critical Path
  & Risks").
- Client is still cleaning their Monday.com data for migration (see `docs/MIGRATION.md`).
- Apple Developer + Google Play accounts were not yet created as of session start — flagged
  repeatedly as the critical-path risk for a Sept launch (Apple org accounts can take
  1–2+ weeks for D-U-N-S verification).
- Designer was still working on the visual design as of session start — the app was
  deliberately built behind a themeable wrapped-component layer (`packages/ui`) so the
  design system can drop in later without touching screen code.

## Adjacent business context (partnerships)

**Atlas** — a vocational-orientation platform Alejandro is in early talks with. Atlas
assesses a student's profile, shows matching *national* universities in their own product,
and wants an "international universities" hand-off into WX Study's directory. **Status:
early conversation only, nothing scheduled.** Full technical recommendation (one-off Data
API via a Supabase Edge Function, not a general partner SDK) is written up in the plan
file's "Future: Partner Integration (Atlas)" section, with 4 open questions for Alejandro
before any engineering starts.

## Where the rest lives

- **`~/.claude/plans/i-am-building-this-sunny-lynx.md`** — the full architecture plan,
  schema review, Phase 0/1 engineering breakdown, and the Atlas technical recommendation.
- **`docs/PROGRESS.md`** — handoff log: what's built, verified, and decided, session by
  session. **Read this to resume engineering work.**
- **`docs/MIGRATION.md`** — Monday.com export analysis and import strategy.
- **`CLAUDE.md`** — repo conventions, git workflow, commands.
