/**
 * Pure list logic behind the searchable option pickers (`OptionPickerModal` and
 * everything built on it). Kept out of the component so the filtering and the
 * pinned/"quick selection" grouping are unit-testable without a renderer.
 */

/** The picker option shape these helpers operate on. */
export interface PickerOption<T extends string | number = string> {
  label: string;
  value: T;
  /** Extra terms the option matches on beyond its visible label. */
  keywords?: string[];
}

/** Accent- and case-insensitive form used on both sides of a search match. */
export function normalizeSearchText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Options whose label or keywords contain `query`. An empty/blank query returns
 * the list unchanged (same reference), so the common "not searching" path does
 * no work.
 */
export function filterOptions<T extends string | number, O extends PickerOption<T>>(
  options: O[],
  query: string,
): O[] {
  const q = normalizeSearchText(query.trim());
  if (!q) return options;
  return options.filter((o) =>
    [o.label, ...(o.keywords ?? [])].some((term) => normalizeSearchText(term).includes(q)),
  );
}

/**
 * Split options into the pinned "quick selection" group and the rest. Pinned
 * options follow the order of `pinnedValues` (that's the curated order, e.g.
 * Mexico before the US), while the rest keep the caller's ordering. Values not
 * present in `options` are ignored, so a stale pin can't create a phantom row.
 */
export function partitionPinned<T extends string | number, O extends PickerOption<T>>(
  options: O[],
  // `NoInfer` so T comes from the option list — a literal like `['mx', 'us']`
  // must not narrow T and reject the wider options array.
  pinnedValues: readonly NoInfer<T>[] = [],
): { pinned: O[]; rest: O[] } {
  if (pinnedValues.length === 0) return { pinned: [], rest: options };

  const wanted = new Set<T>(pinnedValues);
  const byValue = new Map<T, O>();
  const rest: O[] = [];
  for (const option of options) {
    if (wanted.has(option.value)) byValue.set(option.value, option);
    else rest.push(option);
  }

  const pinned = pinnedValues
    .map((value) => byValue.get(value))
    .filter((o): o is O => o != null);
  return { pinned, rest };
}

/** One row of a rendered picker list: a group heading or a selectable option. */
export type PickerRow<T extends string | number, O extends PickerOption<T>> =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'option'; key: string; option: O; divider: boolean };

/**
 * Flatten options into the rows a list renderer draws: the pinned "quick
 * selection" group under `pinnedLabel`, then the rest under `allLabel`.
 *
 * Headings are emitted only when *both* groups have rows — a heading over the
 * only group on screen is noise, which matters while searching, where a query
 * often narrows the list to one group. `divider` marks rows that need a rule
 * above them (every row but the first of its group), so the separator never
 * lands between a heading and its first row.
 */
export function buildPickerRows<T extends string | number, O extends PickerOption<T>>(
  options: O[],
  {
    pinnedValues,
    pinnedLabel,
    allLabel,
  }: { pinnedValues?: readonly NoInfer<T>[]; pinnedLabel: string; allLabel: string },
): PickerRow<T, O>[] {
  const { pinned, rest } = partitionPinned(options, pinnedValues);

  const group = (list: O[]): PickerRow<T, O>[] =>
    list.map((option, i) => ({
      kind: 'option' as const,
      key: String(option.value),
      option,
      divider: i > 0,
    }));

  if (pinned.length === 0 || rest.length === 0) {
    return group([...pinned, ...rest]);
  }

  return [
    { kind: 'header', key: '__pinned', label: pinnedLabel },
    ...group(pinned),
    { kind: 'header', key: '__all', label: allLabel },
    ...group(rest),
  ];
}
