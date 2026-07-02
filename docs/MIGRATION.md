# Monday.com Migration — Analysis & Strategy

> Status: **planning only.** Based on two *incomplete, uncleaned* sample exports the client
> shared on 2026-07-02. No importer is built yet — the client is still cleaning the data.
> This doc captures the structure so the importer can be designed correctly when data is ready.

Samples analyzed:
- `LEADS_Activos … - leads activos.csv` — student leads (~1,242 physical lines; far fewer
  actual students — see parsing quirks).
- `High_School_MX … - high school mx.csv` — partner high schools (prepas) (~509 lines).

---

## 1. Monday export format — parsing quirks (apply to every file)

These break a naïve line-by-line or column-count parse. The importer must handle them:

1. **Banner rows.** Line 1 is a Monday banner (`… This spreadsheet was created using
   monday.com`); there are also `Try it free →` rows. Skip them.
2. **Group headers as bare rows.** Items are grouped; the group name appears as its own row
   with no data (e.g. leads group `Enero 2027 Sara` = target intake **Enero 2027** + counselor
   **Sara**; high-school group `Active High School`). The group is **not** repeated on each
   item row — the parser must **track the current group as state** and attach it to
   following items. Leads groups encode *assigned counselor + desired intake cohort* → use them.
3. **Subitems are inline sub-tables.** When an item has subitems, Monday dumps a repeated
   header row `Subitems,Name,…` immediately after the parent, then the child rows, then
   resumes parent rows. The parser needs a **state machine**: track the current parent, and
   when a `Subitems` header appears, parse following rows as that parent's children until the
   next parent item.
   - **Leads subitems = university applications** (columns: `Name, Fecha de app,
     Universities & Colleges, Programa, Status app, Oferta, Beca Otorgada, Beca, Deposito,
     Fecha de inicio, Año, Deposito, Currency, Usuario, Password, Notas, Text`).
   - **High-school subitems = WRSI service/plan lines** per prepa (`Intercambios, SC,
     V. Especial, Plan Sara, HSA`) with `Status, Date, Universities & Colleges, Item ID`.
4. **Multi-line quoted cells.** Long answers (motivations, university notes, the consent
   clause, the HS "offer" memo) contain newlines inside quoted fields → **physical line
   count ≠ record count**. Use a proper RFC-4180 CSV parser, not `split('\n')`.
5. **Encoding mojibake.** UTF-8 was mis-decoded somewhere: `BermÃºdez`, `OrduÃ±a`,
   `MarÃ­a`, `RodrÃ­guez`. Re-decode/normalize on import (fix Latin-1↔UTF-8) or the DB fills
   with garbage.
6. **`Item ID (auto generated)`** is Monday's stable key (present in the HS file; request it
   for leads too). **Critical** — store it as an external key for idempotent re-import,
   subitem→parent linkage, and cross-board relations.
7. **Duplicate/placeholder columns.** e.g. two `Deposito` columns; university values like
   `GeeBee (Place holder)`, `Kaplan (Place Holder)` → filter/flag placeholders.

---

## 2. Students (leads) → schema mapping

Parent item = a student. Current target tables: `users`/`students` (+ interest/passport/exam
child tables from migrations `0003`/`0004`). Key mappings:

| Monday column | Target | Notes |
|---|---|---|
| Name | `students.first_name` / `last_name` | Single field → best-effort split; Spanish compound surnames make this lossy. Keep full name too. |
| Email de contacto | `users.email` (auth identity) | Often missing/dirty → can't be the sole dedup key. |
| Whatsapp | `students.phone_number` | Digits only; country-code cleanup. |
| Fecha de nacimiento | `students.birth_date` | `date`. |
| Año en el que terminas la prepa | `students.expected_graduation_year` | int. |
| Mes y año … comenzar estudios (`Enero 2027`, `Sept 2028`) | `desired_intake_term` + `desired_intake_year` | Map month→term (Enero→winter/spring, Sept→fall — **confirm mapping**). |
| ¿Otro pasaporte? + value (`Mexicano`, `Canadiense, Mexicano`) | `student_passports` + `students.country_id` | Nationality adjectives → countries; multi-valued; primary = `country_id`. |
| ¿Qué tipo de estudio? (`Licenciatura, Maestría, Curso de verano, Otro`) | `student_education_level_interest` (intended) | Map ES→`education_levels`; multi-valued. |
| ÁREA de interés (`Música`, `Moda, diseño…`) | `student_fields_of_study_interest` | Freeform → normalize to `fields_of_study`; multi-valued; messy. |
| PAÍS de interés (`Spain`, `España, Canada, Italia`, `Suecia`) | `student_countries_interest` | **Mixed ES/EN** names → normalization dictionary (España/Spain, Suecia/Sweden, Reino Unido/UK). |
| Planes para apoyar el costo | `students.financial_plan_id` | Map phrases → `financial_plans` (padres→Family Plan, becas→Scholarship). |
| Presupuesto colegiatura ANUAL (`10K - 15K USD`) | `students.budget` (+ currency) | **It's a range bucket, not a number** → see gap G3. |
| Nivel de Inglés (`Avanzado`, `Intermedio`) | `students.cefr_level` | **Descriptive ES, not CEFR/exam** → lossy map; see gap G4. |
| Nombre de padres/tutores | `students.parent_or_guardian_name` | |
| Status alumno (`New Lead`) | student lifecycle `statuses` | Map to seeded `entity_type='student'` statuses. |
| Etapa HE / Etapa SC | *pipeline/track* | Two separate pipelines (Higher-Ed vs Short-Course) → see gap G5. |
| High School (name) | `students.high_school_id` | Join by normalized name to the HS import. |
| last contact / Pendientes | `crm_last_touch` / `activities` | Drives the 7-day reminder. |
| Motivation / hobbies / challenge / "why abroad" / other options / consent clause | free text | Preserve — see gap G6 (raw JSONB or intake-responses table). |

**Subitems → `student_applications`:** `Universities & Colleges` → `university_id` (match or
create; filter placeholders); `Status app` → application `statuses`; `Programa` → program;
`Fecha de inicio`+`Año` → `intake_term`/`intake_year`. `Oferta`/`Beca`/`Deposito`/`Currency`
and `Usuario`/`Password` (university-portal creds) have **no home yet** — see gap G7.

---

## 3. High schools (prepas) → schema mapping

Parent item = a prepa. Target: `high_schools` (migration `0003`).

| Monday column | Target | Notes |
|---|---|---|
| Name | `high_schools.name` | |
| Location (`Cancún`, `PDC`, `Mérida`) | geo | **City-level**, but our geo is country→`states_provinces`. See gap G8. |
| IB (checkbox) | `education_model_id` | Map true → IB education model (seeded). |
| Status (`Active`) | `statuses` (`entity_type='high_school'`) | Seeded Active/Prospect/Inactive. |
| Costo Mensual (`11000`) | `high_schools.monthly_cost` (+ currency, MXN) | |
| Contact / Phone / Email | `contact_*` / `phone_number` / **email** | HS table has **no email column** → gap G9. |
| ALUMNOS APROX / # de Alumnos | estimated students | **No column** → gap G10. |
| Level (`L1`) / Convenio (`In review`) | partnership tier / agreement status | No columns → gaps G11. |
| `link to REGISTRO DE PREPAS` (×5) | student roster (comma-joined **names**) | HS→students link, but **by name** (fragile). Prefer linking via the leads `High School` column; use these as a cross-check. |
| 20+ workflow/checklist cols (Planning Año Escolar, Juntas de Inicio, 1v1 Alumnos, Pinta y Tinto, WA/DRIVE/Conv…) | operational CRM state | Don't model each → preserve as JSONB `monday_raw` (gap G6). |

**Subitems (service lines):** `Intercambios / SC / V. Especial / Plan Sara / HSA` per prepa,
each with a status and associated `Universities & Colleges`. These are WRSI's **product/service
tracks** (same axis as the students' HE/SC pipelines, G5) → likely a future
`services`/`tracks` table, not MVP-critical. Preserve for now.

---

## 4. Schema additions to support the migration

Add when the importer is built (new migration, don't edit applied ones):

- **G1 — `monday_item_id text` (unique)** on `students`, `student_applications`,
  `high_schools`, `universities` → idempotent re-import + relationship reconstruction.
- **G2 — `monday_raw jsonb`** on the same tables → keep the full original row so no data is
  lost and re-mapping doesn't need a re-export. This absorbs all the un-modeled free-text and
  checklist columns.
- **G3 — budget as a range.** Add `budget_min` / `budget_max` (or a `budget_range` text) +
  keep currency; the source is buckets (`10K - 15K USD`), not point values. Also a
  **living-expenses budget** field (source has a separate manutención bucket) — currently unmodeled.
- **G4 — English level.** Source is descriptive ES (`Avanzado`/`Intermedio`/`Básico`), not
  CEFR or an exam score. Either store raw + a lossy CEFR guess, or add a `language_level_raw`
  field. Decide before mapping into `cefr_level`.
- **G5 — service tracks (HE vs SC, and Intercambios/V. Especial/Plan Sara/HSA).** WRSI runs
  students through multiple product pipelines. Consider a `service_tracks` lookup + a
  per-student/per-application track reference. Confirm the canonical list with the client.
- **G6 — free-text preservation.** Either `monday_raw jsonb` (G2) or a generic
  `student_intake_responses(student_id, question, answer)` table for the questionnaire answers.
- **G7 — application extras.** `student_applications` has no `offer`, `scholarship`,
  `deposit`/`deposit_currency`, or **portal credentials** (`Usuario`/`Password`). Credentials
  mirror the earlier admin-only `sponsors_and_allies` decision → store admin-only if kept.
- **G8 — city-level geo.** Locations are cities (Cancún, PDC, Mérida). Add a `city` text (or a
  cities lookup under `states_provinces`) so prepa/university location isn't lost.
- **G9 — `high_schools.email`.** Missing; present in source.
- **G10 — `high_schools.estimated_students int`.** For "ALUMNOS APROX / # de Alumnos".
- **G11 — partnership `level`/`tier` and `agreement_status`** on `high_schools` (`L1`,
  Convenio state) — or fold into `statuses`.

---

## 5. Data-quality / cleaning rules

- **Normalization dictionaries** (biggest effort): countries (ES/EN), fields of study,
  education levels (`Licenciatura`→Bachelor, `Maestría`→Master), financial plans, statuses.
  Unmatched values → land in a **review queue**, don't silently drop.
- **Dedup** (the brief's "flag or merge duplicates"): emails are missing/dirty, so match on a
  composite — normalized full name + phone + birth date (reuse
  `normalizeForDedup` in `packages/shared-utils`). Flag near-matches for human review rather
  than auto-merging.
- **Fix encoding** before insert (G-quirk 5).
- **Filter placeholders** (`(Place holder)`).

---

## 6. Recommended import architecture

1. **Ask the client for a cleaner pull.** A CSV of Monday board views loses relation columns
   (HS↔students is exported as name text). A **Monday API export** (or CSVs that include
   relation columns as **Item IDs**) would make linkage reliable. Request `Item ID` on the
   leads export too.
2. **Two-pass, dependency order:** high schools → students (FK to HS) → applications (subitems).
3. **Staging first:** land raw rows (with `monday_item_id` + full row as JSONB) into a
   `staging_*` table, then transform → normalized tables with the normalization/dedup step in
   between. Keeps the messy source separate from clean data and makes re-runs safe.
4. **Idempotent** on `monday_item_id` (upsert), so the import can run repeatedly as the client
   keeps cleaning — matches the plan's "idempotent, re-runnable" requirement.
5. Implement as a **Supabase Edge Function or a Node script** using the service role, with a
   custom subitem-aware CSV parser (§1).

## 7. To confirm with the client

- The canonical **service tracks** (HE / SC / Intercambios / V. Especial / Plan Sara / HSA) —
  what they mean and which matter for the product vs. internal ops.
- **Intake month→term** mapping (Enero, Sept, …) → fall/winter/spring_summer.
- Whether university-portal **credentials** in application subitems should be migrated (and
  kept admin-only) or dropped.
- Whether they can export via the **Monday API / with Item-ID relation columns** for reliable
  HS↔student and application↔university links.
