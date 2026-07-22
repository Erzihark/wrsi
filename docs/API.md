# API Reference (`@wrsi/api` hooks layer)

There is **no hand-written REST server**. Data access is:

1. **PostgREST + Row Level Security** through the typed TanStack Query hooks in
   `packages/api/src/` — the surface this file indexes.
2. **Two Edge Functions** (`create-entity`, `delete-entity`) and **three client-called
   RPCs** (`complete_student_onboarding`, `update_student_profile`, `is_admin`) — specified in
   [`docs/openapi.yaml`](openapi.yaml); browse with `yarn docs:api` →
   http://localhost:3000/api-reference.html.

**Source-of-truth rules** (see the "API changes" section of `CLAUDE.md`):

- Behavior prose lives in each hook's JSDoc in `packages/api/src/*.ts`; this file is
  the **contract index** — one row per exported hook so an agent can plan a change
  without opening every file.
- Every exported `use*` hook MUST have a row here — enforced by
  `packages/api/src/docs-coverage.test.ts` (part of `yarn test`).
- Cache keys come only from `packages/api/src/queryKeys.ts` — never inline.

## Conventions

- **Query keys**: the `queryKeys` factory centralizes every cache key. Some domains
  deliberately *share* a key base so writes refresh reads elsewhere (e.g. admin
  counselor CRUD shares `lookup('counselors')` with the counselor dropdown; high
  schools share `highSchools()`).
- **Invalidation**: every mutation invalidates the affected keys in `onSuccess` —
  the "invalidates" column below is the contract. Note: admin list *screens* also
  need `useRefetchOnFocus` because native-stack `goBack` doesn't remount.
- **Auth & RLS notation**: "all authed" = any signed-in user; "self" = RLS restricts
  to the caller's own rows (no client-side filter needed); "admin" = RLS/policy or
  server-side guard rejects non-admins. Column-level rules are enforced by `guard_*`
  triggers (e.g. `students_guard_restricted_columns`).
- **Errors**: PostgREST/RPC calls throw `PostgrestError`. Edge Function errors are
  `{ error: string }` bodies unwrapped by `functionErrorMessage()`
  (`packages/api/src/entities.ts`).
- **Search inputs** are sanitized (`sanitizeSearchTerm` / local `sanitize`) to strip
  PostgREST filter metacharacters — keep this for any new `ilike`/`or` filter.

## Universities & student self-serve — `packages/api/src/hooks.ts`

Student-facing reads (university directory, own profile, notifications) + saving
universities of interest.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useUniversities(search?)` | SELECT `universities` (name ilike) | `universities({search})` | all authed |
| `useUniversityPrograms(id)` | SELECT `university_programs` + level/field names | `universityPrograms(id)` | all authed |
| `useMyUniversityInterests()` | SELECT `student_university_interest` → `Set<university_id>` | `universityInterests` | self (RLS-filtered) |
| `useToggleUniversityInterest()` | INSERT/DELETE `student_university_interest` (insert fires admin-notification trigger) | invalidates `universityInterests` | self |
| `useMyStudentProfile()` | SELECT `students` (maybeSingle) | `myStudent` | self |
| `useNotifications()` | SELECT `notifications`, newest first | `notifications` | self |
| `useUnreadNotificationsCount()` | COUNT `notifications` where unread (`head: true`, serves the header bell badge) | `notificationsUnread` | self |
| `useMarkNotificationRead()` | UPDATE one `notifications` row → read | invalidates `notifications` (prefix covers `notificationsUnread`) | self (owner update) |
| `useMarkAllNotificationsRead()` | UPDATE all unread `notifications` → read | invalidates `notifications` (prefix covers `notificationsUnread`) | self (owner update) |
| `useMyCounselor()` | SELECT `students` → embedded `counselors(id, names, phone, photo_url)`, null when unassigned | `myCounselor` | self (student row) / counselors readable by all authed |

## Applications — `packages/api/src/applications.ts`

Student-facing read of `student_applications` (the "My Apps" screen). Applications
are created/advanced by staff — no student-side writes.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useMyApplications()` | SELECT `student_applications` + embedded status (name/color) + university (name/logo), newest first | `myApplications` | self via `can_access_student` (staff sessions would see their scope) |

## Avatars (public Storage) — `packages/api/src/avatars.ts`

Bucket `avatars` (public read), paths `{owner_user_id}/avatar-{ts}.{ext}`; the
resolved public URL is persisted on `students.photo_url` / `counselors.photo_url`.
Storage writes: own folder or admin.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useUploadMyAvatar()` | Storage upload + UPDATE `students.photo_url` (removes object if the update fails) | invalidates `myStudent` | student self (Storage: own folder; row: self-update) |
| `useUploadCounselorPhoto()` | Storage upload into counselor's folder + UPDATE `counselors.photo_url` | invalidates `lookup('counselors')` base + `myCounselor` | admin |

## Student profile (self-serve) — `packages/api/src/profile.ts`

Post-onboarding profile editing. Uses the `update_student_profile` RPC — same
validation as onboarding, but **no** lifecycle-status or `onboarding_completed_at`
side effects.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useUpdateMyStudentProfile()` | RPC `update_student_profile` (atomic profile UPDATE + interest-table replace; server-side validation) — see [openapi.yaml](openapi.yaml) | invalidates `myStudent` + `myInterestSelections` | student (runs as caller; errors if no profile row) |
| `useMyStudentInterestSelections(studentId)` | SELECT the 4 interest join tables → id arrays (edit-form prefill) | `myInterestSelections` | self (RLS-filtered) |
| `useMyProfileCompletion()` | Derived — composes `useMyStudentProfile` + `useMyLanguageExams` + `useMyReferences` through `computeProfileCompletion` | no key of its own (reads `myStudent`, `myLanguageExams`, `myReferences`) | self (RLS-filtered) |

`useMyProfileCompletion` is the only supported way to read the metric: two of the
six sections (`english`, `extras`) depend on child-table rows, so calling
`computeProfileCompletion` with the `students` row alone under-reports.

## References — `packages/api/src/references.ts`

The profile screen's "Personas extra (Referencias / Recomendaciones)" — 0..N
contacts per student. Written directly against the table rather than through the
profile RPC: each row has its own fields, so the uuid[]-replace pattern the
interest tables use doesn't fit.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useMyReferences()` | SELECT `student_references` ordered by `created_at` | `myReferences` | self + assigned counselor + admin (`can_access_student`) |
| `useSaveReference()` | INSERT (no `id`) or UPDATE (with `id`) one reference | invalidates `myReferences` | same |
| `useDeleteReference()` | DELETE by id | invalidates `myReferences` | same |

## Language exams — `packages/api/src/languageExams.ts`

The profile screen's "Nivel de inglés" row (`Avanzado (C1) – IELTS 7.0`): the
CEFR band is `students.cefr_level`; the exam + score live in the pre-existing
`student_language_exams`, keyed by `(student_id, language_exam_id)`.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useLanguageExams()` | SELECT the `language_exams` catalog + language name | `lookup('language_exams')`, 1h `staleTime` | all authenticated (reference data) |
| `useMyLanguageExams()` | SELECT the student's exam results + embedded catalog row | `myLanguageExams` | self + assigned counselor + admin (`can_access_student`) |
| `useSaveMyLanguageExam()` | UPSERT on `(student_id, language_exam_id)` — re-saving an exam updates its score | invalidates `myLanguageExams` | same |
| `useDeleteMyLanguageExam()` | DELETE by `(student_id, language_exam_id)` | invalidates `myLanguageExams` | same |

## Lookups — `packages/api/src/lookups.ts`

Reference catalogs for dropdowns; all 1-hour `staleTime` reads, `all authed`.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useCountries()` | SELECT `countries` | `lookup('countries')` | all authed |
| `useFieldsOfStudy()` | SELECT `fields_of_study` | `lookup('fields_of_study')` | all authed |
| `useStatesProvinces()` | SELECT `states_provinces` | `lookup('states_provinces')` | all authed |
| `useEducationModels()` | SELECT `education_models` | `lookup('education_models')` | all authed |
| `useEducationLevels()` | SELECT `education_levels` | `lookup('education_levels')` | all authed |
| `useFinancialPlans()` | SELECT `financial_plans` | `lookup('financial_plans')` | all authed |
| `useCurrencies()` | SELECT `currencies` | `lookup('currencies')` | all authed |
| `useCounselors()` | SELECT `counselors` (id + names) | `lookup('counselors')` — shared with directory.ts CRUD | all authed |
| `useHighSchools()` | SELECT `high_schools` (id + name) | `highSchools()` — shared with directory.ts/entities.ts writes | all authed |
| `useStatuses(entityType)` | SELECT `statuses` for one entity type, by sort_order | `lookup('statuses-<type>')` | all authed |
| `useStudentStatuses()` | `useStatuses('student')` | `lookup('statuses-student')` | all authed |

## Students (admin/counselor CRM) — `packages/api/src/students.ts`

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useStudentsList(filters)` | infinite SELECT `student_directory` view (security_invoker → inherits `students` RLS), search + 7 filters, 20/page | `[...lookup('students-directory'), filters]` | admin/counselor see their scope; students self |
| `useStudent(id)` | SELECT `students` single row | `student(id)` | self / assigned counselor / admin |
| `useUpdateStudent(id)` | UPDATE `students` (partial); `students_guard_restricted_columns` trigger limits columns per role | invalidates `student(id)` + `lookup('students-directory')` | per RLS + trigger (e.g. counselor_id reassign = admin-only) |

Other exports: `StudentFilters`, `StudentDirectoryRow`, `StudentUpdate` types.

## Admin directory CRUD — `packages/api/src/directory.ts`

Read/update for high schools, universities, counselors (create/delete are Edge
Functions — see entities.ts). Updates are admin-only via RLS.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useHighSchoolsList(search?)` | SELECT `high_schools` (name ilike) | `[...highSchools(), 'list', term]` | admin |
| `useHighSchool(id)` | SELECT `high_schools` single | `highSchool(id)` | admin |
| `useUpdateHighSchool(id)` | UPDATE `high_schools` | invalidates `highSchool(id)` + `highSchools()` | admin |
| `useUniversitiesList(search?)` | SELECT `universities` (name ilike) | `[...universities(), term]` | all authed (read) |
| `useUniversity(id)` | SELECT `universities` single | `university(id)` | all authed (read) |
| `useUpdateUniversity(id)` | UPDATE `universities` | invalidates `university(id)` + `universities()` | admin |
| `useCounselorsList(search?)` | SELECT `counselors` (name or-ilike) | `[...lookup('counselors'), 'list', term]` | admin |
| `useCounselor(id)` | SELECT `counselors` single | `[...lookup('counselors'), id]` | admin |
| `useUpdateCounselor(id)` | UPDATE `counselors` | invalidates `lookup('counselors')` base | admin |

Other exports: `HighSchoolRow/Update`, `UniversityRow/Update`, `CounselorRow/Update` types.

## Entity provisioning (Edge Functions) — `packages/api/src/entities.ts`

Create/delete of login-backed entities goes through the Edge Functions (service
role needed for auth-user management). Full request/response contracts:
[`docs/openapi.yaml`](openapi.yaml).

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useCreateEntity(entityType)` | POST `/functions/v1/create-entity` — auth user + role + profile row; returns `{id, email, password}` | invalidates `listKey(entityType)` | admin (server-side `is_admin()`) |
| `useDeleteEntity(entityType)` | POST `/functions/v1/delete-entity` — deletes auth user; row goes via ON DELETE CASCADE | invalidates `listKey(entityType)` | admin (server-side `is_admin()`) |

Other exports: `listKey(entityType)` (maps entity type → list cache to refresh),
`functionErrorMessage()` (unwraps Edge Function `{error}` bodies), `EntityType`,
`CreateEntityArgs`, `CreateEntityResult`.

## Documents (private Storage) — `packages/api/src/documents.ts`

Bucket `documents`, paths `{userId}/…`; metadata in the `documents` table.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useDocumentTypes()` | SELECT `document_types` | `lookup('document_types')` | all authed |
| `useDocuments(userId)` | SELECT `documents` + type name, newest first | `studentDocuments(userId)` | owner / assigned counselor / admin |
| `useUploadDocument(userId)` | Storage upload + INSERT `documents` (removes object if insert fails) | invalidates `studentDocuments(userId)` | owner / counselor / admin (Storage + RLS) |
| `useDeleteDocument(userId)` | Storage remove + DELETE `documents` | invalidates `studentDocuments(userId)` | owner / counselor / admin |
| `useCreateDocumentSignedUrl()` | Storage createSignedUrl (60s TTL) | — (mutation, no cache) | per Storage policy |

Other exports: `DocumentRow`, `UploadDocumentArgs` types.

## Events — `packages/api/src/events.ts`

Fairs / Open Fair Day: admin CRUD + student browse/register/notes. Event rows
embed `states_provinces(name)` + `countries(name, name_es)`. Display fields for
the student dashboard's event card: `location` (venue name), `image_url`, and
`start_time`/`end_time` (day schedule, Postgres `time`) — all optional,
admin-entered, and included in every event read (`'*'` selects).

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useEventsAdminList(search?)` | SELECT `events` (title ilike), newest first | `[...events, 'admin', term]` | admin |
| `useCreateEvent()` | INSERT `events` | invalidates `events` | admin |
| `useUpdateEvent(id)` | UPDATE `events` | invalidates `event(id)` + `events` | admin |
| `useDeleteEvent()` | DELETE `events` (cascades regs/workshops/1:1s/notes) | invalidates `events` | admin |
| `useAddEventUniversity()` | INSERT `event_universities` | invalidates `eventUniversities(eventId)` | admin |
| `useRemoveEventUniversity()` | DELETE `event_universities` | invalidates `eventUniversities(eventId)` | admin |
| `useCreateWorkshop()` | INSERT `workshops` | invalidates `eventWorkshops(event_id)` | admin |
| `useDeleteWorkshop()` | DELETE `workshops` (cascades registrations) | invalidates `eventWorkshops(eventId)` | admin |
| `useCreateOneToOneSlot()` | INSERT `one_to_ones` (unbooked slot) | invalidates `oneToOnes(event_id)` | admin |
| `useDeleteOneToOneSlot()` | DELETE `one_to_ones` | invalidates `oneToOnes(eventId)` | admin |
| `useEvents()` | SELECT `events`, soonest first | `events` | all authed |
| `useEvent(id)` | SELECT `events` single | `event(id)` | all authed |
| `useEventUniversities(eventId)` | SELECT `event_universities` → university cards | `eventUniversities(eventId)` | all authed |
| `useEventWorkshops(eventId)` | SELECT `workshops`, earliest first | `eventWorkshops(eventId)` | all authed |
| `useOneToOnes(eventId)` | SELECT `one_to_ones` (booked + free) | `oneToOnes(eventId)` | all authed |
| `useMyEventRegistrations()` | SELECT `event_registrations` → `Set<event_id>` | `myEventRegistrations` | self |
| `useToggleEventRegistration()` | INSERT/DELETE `event_registrations` | invalidates `myEventRegistrations` | self |
| `useMyWorkshopRegistrations(eventId)` | SELECT `workshop_registrations` (inner-join event) → `Set<workshop_id>` | `myWorkshopRegistrations(eventId)` | self |
| `useToggleWorkshopRegistration()` | INSERT/DELETE `workshop_registrations`; DB rejects time overlaps (`prevent_workshop_time_overlap` trigger) | invalidates `myWorkshopRegistrations(eventId)` | self |
| `useBookOneToOne()` | UPDATE `one_to_ones.student_id` = me | invalidates `oneToOnes(eventId)` | student (RLS: free slot) |
| `useCancelOneToOne()` | UPDATE `one_to_ones.student_id` = null | invalidates `oneToOnes(eventId)` | student (own booking) |
| `useEventNotes(eventId)` | SELECT `event_notes` (one per university) | `eventNotes(eventId)` | self |
| `useSaveEventNote()` | INSERT or UPDATE `event_notes` (note + ranking) | invalidates `eventNotes(eventId)` | self |

Other exports: `EventRow/Insert/Update`, `EventNoteRow`, `WorkshopRow/Insert`,
`OneToOneInsert` types.

## Sponsors & Allies — `packages/api/src/sponsors.ts`

Admin directory of sponsor/ally organizations. Full direct-table CRUD (not
login-backed — no `user_id`/auth account, unlike high schools/universities/
counselors — see the migration comment on `sponsors_and_allies`). `login_username`/
`login_password` are internal admin-only reference notes about the partner's own
external portal, not the WRSI auth mechanism. Table is admin-only via RLS
(`sponsors_admin_only` policy), so every hook below requires an admin session.

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useSponsorsList(search?)` | SELECT `sponsors_and_allies` (name ilike) + `industries(name)`/`statuses(name, color)` | `[...sponsors, 'list', term]` | admin |
| `useSponsor(id)` | SELECT `sponsors_and_allies` single | `sponsor(id)` | admin |
| `useCreateSponsor()` | INSERT `sponsors_and_allies` | invalidates `sponsors` | admin |
| `useUpdateSponsor(id)` | UPDATE `sponsors_and_allies` | invalidates `sponsor(id)` + `sponsors` | admin |
| `useDeleteSponsor()` | DELETE `sponsors_and_allies` | invalidates `sponsors` | admin |

Also uses `useIndustries()` (`packages/api/src/lookups.ts`) and `useStatuses('sponsor')`
for the industry/status dropdowns. Other exports: `SponsorRow/Insert/Update` types.

`email`/`links` format is validated both client-side (zod `optionalEmailField()`/
`webUrlField()`) and at the DB layer via CHECK constraints (migration
`20260722000001_sponsors_format_checks.sql`) — a direct/malformed write is rejected, not
just a form submission.

## Onboarding — `packages/api/src/onboarding.ts`

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useCompleteOnboarding()` | RPC `complete_student_onboarding` (atomic profile + interests upsert; server-side validation) — see [openapi.yaml](openapi.yaml) | invalidates `myStudent` | student (runs as caller) |

Other exports: `CompleteOnboardingArgs` type.

## Status & tasks — `packages/api/src/status.ts`

| Hook | Operation | Query key / invalidates | Auth & RLS |
|---|---|---|---|
| `useStudentCurrentStatus(studentId)` | SELECT latest `status_history` + status; subscribes to Realtime `postgres_changes` on `status_history` and invalidates on change | `studentStatus(studentId)` | self / counselor / admin |
| `useStudentTasks(studentId)` | SELECT `tasks` by due date | `studentTasks(studentId)` | self / counselor / admin |

## RPCs & Edge Functions summary

Full specs in [`docs/openapi.yaml`](openapi.yaml) (`yarn docs:api` to browse).

| Endpoint | Kind | Wrapped by | Notes |
|---|---|---|---|
| `POST /functions/v1/create-entity` | Edge Function | `useCreateEntity` | admin-only; provisions auth user + role + profile row; per-type column allow-list in `supabase/functions/_shared/entities.ts` |
| `POST /functions/v1/delete-entity` | Edge Function | `useDeleteEntity` | admin-only; deletes auth user, row via CASCADE |
| `POST /rest/v1/rpc/complete_student_onboarding` | RPC | `useCompleteOnboarding` | validation in `supabase/migrations/20260703000002_onboarding_validation.sql` |
| `POST /rest/v1/rpc/update_student_profile` | RPC | `useUpdateMyStudentProfile` | same validation as onboarding; UPDATE-only, no status/onboarding side effects. Introduced in `20260716000001_student_home.sql`, replaced in `20260716000003_student_profile_fields.sql` to carry the guardian phone, consent, and personal notes |
| `POST /rest/v1/rpc/is_admin` | RPC | (Edge Function guard only) | same predicate the RLS policies use |
