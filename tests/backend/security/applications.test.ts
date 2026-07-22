import { describe, expect, it } from 'vitest';
import { serviceClient, signInAs } from '../helpers/clients';
import { EMAILS, IDS } from '../helpers/ids';

/**
 * Backend coverage for the "Mis aplicaciones" screen:
 * - the exact `useMyApplications()` select resolves (nested embeds through
 *   states_provinces → countries and application_status_history → statuses are
 *   the part most likely to break on a schema change)
 * - status history is scoped to the owning student the same way the application is
 * - `student_applications.program_id` cannot point at another university's program
 *
 * The rows here come from `supabase/seeds/dev.sql`, which gives student1 one
 * application per timeline stage.
 */

/** Kept byte-identical to the select in `packages/api/src/applications.ts`. */
const HOOK_SELECT = `id, intake_year, intake_term, created_at, updated_at,
   status:statuses(id, name, color, sort_order, is_terminal),
   university:universities(
     id, name, logo_url,
     state_province:states_provinces(name, country:countries(name, name_es))
   ),
   program:university_programs(id, name),
   history:application_status_history(
     changed_at, status:statuses(name, is_terminal)
   )`;

describe('useMyApplications select', () => {
  it('resolves every embed for the owning student', async () => {
    const c = await signInAs(EMAILS.student1);
    const { data, error } = await c
      .from('student_applications')
      .select(HOOK_SELECT)
      .order('created_at', { ascending: false });

    expect(error).toBeNull();
    const rows = data ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(4);

    // Newest first — the order the screen renders in.
    const created = rows.map((r) => r.created_at);
    expect([...created].sort().reverse()).toEqual(created);

    const accepted = rows.find((r) => r.status?.name === 'Accepted');
    expect(accepted).toBeDefined();
    expect(accepted!.university?.state_province?.country?.name).toBe('United States');
    expect(accepted!.program?.name).toBe('Lorem Business');
    // Submitted → Under Review → Accepted, which is what dates the tracker.
    expect(accepted!.history.map((h) => h.status?.name).sort()).toEqual([
      'Accepted',
      'Submitted',
      'Under Review',
    ]);

    // The draft is the no-program-yet case the card falls back on.
    const draft = rows.find((r) => r.status?.name === 'Draft');
    expect(draft?.program).toBeNull();
    expect(draft?.history).toEqual([]);
  });

  it('returns nothing for a student with no applications', async () => {
    const c = await signInAs(EMAILS.student2);
    const { data, error } = await c.from('student_applications').select(HOOK_SELECT);
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });
});

describe('RLS: application_status_history', () => {
  it("another student cannot read someone else's status history", async () => {
    const c = await signInAs(EMAILS.student2);
    const { data, error } = await c.from('application_status_history').select('id');
    expect(error).toBeNull();
    expect(data ?? []).toEqual([]);
  });

  it('a student cannot forge history on their own application', async () => {
    const c = await signInAs(EMAILS.student1);
    const own = await c.from('student_applications').select('id').limit(1).single();
    expect(own.error).toBeNull();

    const svc = serviceClient();
    const status = await svc
      .from('statuses')
      .select('id')
      .eq('entity_type', 'application')
      .eq('name', 'Accepted')
      .single();

    const { error } = await c.from('application_status_history').insert({
      application_id: own.data!.id,
      status_id: status.data!.id,
    });
    // Advancing an application is staff-only — a student self-accepting is the
    // exact thing this policy exists to stop.
    expect(error).not.toBeNull();
  });
});

describe('student_applications.program_id integrity', () => {
  it("rejects a program belonging to a different university", async () => {
    const svc = serviceClient();
    // A program of un1, attached to an application aimed at un2.
    const program = await svc
      .from('university_programs')
      .select('id')
      .eq('university_id', IDS.universities.un1)
      .limit(1)
      .single();
    expect(program.error).toBeNull();

    const { error } = await svc.from('student_applications').insert({
      student_id: IDS.students.s2,
      university_id: IDS.universities.un2,
      program_id: program.data!.id,
    });
    expect(error).not.toBeNull();
    expect(error!.message).toContain('student_applications_program_fkey');
  });

  it('accepts a program of the same university, and null', async () => {
    const svc = serviceClient();
    const program = await svc
      .from('university_programs')
      .select('id')
      .eq('university_id', IDS.universities.un2)
      .limit(1)
      .single();

    const ins = await svc
      .from('student_applications')
      .insert([
        {
          student_id: IDS.students.s2,
          university_id: IDS.universities.un2,
          program_id: program.data!.id,
        },
        { student_id: IDS.students.s2, university_id: IDS.universities.un2, program_id: null },
      ])
      .select('id');
    expect(ins.error).toBeNull();

    await svc
      .from('student_applications')
      .delete()
      .in(
        'id',
        (ins.data ?? []).map((r) => r.id),
      );
  });
});
