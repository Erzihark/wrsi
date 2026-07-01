export type { Database, Json } from './database.types';
import type { Database } from './database.types';

type PublicSchema = Database['public'];

/** Row shape of a public table, e.g. `Tables<'students'>`. */
export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row'];

/** Insert shape of a public table, e.g. `TablesInsert<'students'>`. */
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert'];

/** Update shape of a public table, e.g. `TablesUpdate<'students'>`. */
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update'];

/** A public enum, e.g. `Enums<'intake_term'>`. */
export type Enums<T extends keyof PublicSchema['Enums']> =
  PublicSchema['Enums'][T];

/** Application role names (mirrors the seeded `roles` table). */
export type AppRole =
  | 'super_admin'
  | 'admin'
  | 'counselor'
  | 'student'
  | 'university'
  | 'high_school';
