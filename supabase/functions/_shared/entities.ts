// One config map shared by create-entity + delete-entity so the three admin-managed
// entities (students, high schools, universities) flow through identical code.
export type EntityType = 'student' | 'high_school' | 'university';

interface EntityConfig {
  table: 'students' | 'high_schools' | 'universities';
  role: EntityType; // role name to grant the provisioned auth user
  columns: string[]; // profile columns the client is allowed to set
}

export const ENTITY_CONFIG: Record<EntityType, EntityConfig> = {
  student: {
    table: 'students',
    role: 'student',
    columns: [
      'first_name', 'last_name', 'birth_date', 'phone_number',
      'parent_or_guardian_name', 'country_id', 'counselor_id', 'high_school_id',
      'highest_education_level_id', 'financial_plan_id', 'budget_currency_id',
      'average_grade', 'cefr_level', 'budget', 'desired_intake_term',
      'desired_intake_year', 'expected_graduation_year',
    ],
  },
  high_school: {
    table: 'high_schools',
    role: 'high_school',
    columns: [
      'name', 'contact_first_name', 'contact_last_name', 'phone_number',
      'monthly_cost', 'monthly_cost_currency_id', 'education_model_id',
      'state_province_id', 'status_id',
    ],
  },
  university: {
    table: 'universities',
    role: 'university',
    columns: [
      'name', 'description', 'requirements', 'logo_url', 'website',
      'currency_id', 'state_province_id', 'status_id',
    ],
  },
};

/** Whitelist a client-supplied profile object to the entity's allowed columns. */
export function pickColumns(
  profile: Record<string, unknown>,
  columns: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of columns) {
    if (profile[key] !== undefined) out[key] = profile[key];
  }
  return out;
}
