/**
 * The field anchors shared by the two profile screens.
 *
 * The profile view lists rows; tapping one opens the edit form scrolled to (and,
 * for text inputs, focused on) the matching field. Both screens key off this
 * union, so a row can't point at a field the form doesn't render.
 */
export type ProfileFieldKey =
  | 'name'
  | 'phone'
  | 'guardian'
  | 'consent'
  | 'birth_date'
  | 'nationality'
  | 'study_level'
  | 'field_of_study'
  | 'intake'
  | 'grade'
  | 'english'
  | 'notes'
  | 'references';

/**
 * Field keys whose control is a text input we can actually call `.focus()` on.
 * Everything else (pickers, selects, the consent switch, the references list)
 * is only scrolled into view — there's nothing to put a caret in.
 */
export const FOCUSABLE_FIELDS: ProfileFieldKey[] = [
  'name',
  'phone',
  'guardian',
  'grade',
  'notes',
];

export function isFocusable(key: ProfileFieldKey): boolean {
  return FOCUSABLE_FIELDS.includes(key);
}
