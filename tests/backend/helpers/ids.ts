// Deterministic identifiers seeded by supabase/seeds/dev.sql (applied on
// `yarn supabase db reset`). Keep in sync with that file.

export const PASSWORD = 'password123';

export const EMAILS = {
  admin: 'admin@wrsi.dev',
  counselor: 'counselor@wrsi.dev',
  student1: 'student1@wrsi.dev',
  student2: 'student2@wrsi.dev',
  student3: 'student3@wrsi.dev',
  student4: 'student4@wrsi.dev',
  university1: 'university1@wrsi.dev',
  university2: 'university2@wrsi.dev',
  highschool1: 'highschool1@wrsi.dev',
  highschool2: 'highschool2@wrsi.dev',
} as const;

export const IDS = {
  users: {
    admin: 'aaaa0000-0000-4000-8000-000000000001',
    counselor: 'aaaa0000-0000-4000-8000-000000000002',
    s1: 'aaaa0000-0000-4000-8000-000000000011',
    s2: 'aaaa0000-0000-4000-8000-000000000012',
    s3: 'aaaa0000-0000-4000-8000-000000000013',
    s4: 'aaaa0000-0000-4000-8000-000000000014',
    un1: 'aaaa0000-0000-4000-8000-000000000031',
  },
  counselor: 'bbbb0000-0000-4000-8000-000000000001',
  highSchools: {
    hs1: 'cccc0000-0000-4000-8000-000000000001',
    hs2: 'cccc0000-0000-4000-8000-000000000002',
  },
  universities: {
    un1: 'dddd0000-0000-4000-8000-000000000001',
    un2: 'dddd0000-0000-4000-8000-000000000002',
  },
  students: {
    s1: 'eeee0000-0000-4000-8000-000000000001',
    s2: 'eeee0000-0000-4000-8000-000000000002',
    s3: 'eeee0000-0000-4000-8000-000000000003',
  },
  event: 'ffff0000-0000-4000-8000-000000000001',
  workshops: {
    w1: 'ffff0000-0000-4000-8000-000000000011',
    w2: 'ffff0000-0000-4000-8000-000000000012',
  },
} as const;
