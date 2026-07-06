import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { SearchSelect } from './SearchSelect';
import type { Option } from './Select';

export interface DateFieldProps {
  label?: string;
  /** ISO date (YYYY-MM-DD) or '' while incomplete. */
  value: string;
  /** Called with a full ISO date, or '' whenever the selection is incomplete. */
  onChange: (value: string) => void;
  error?: string;
  minYear: number;
  maxYear: number;
  /** 12 localized month names, January first. */
  monthLabels: string[];
  dayPlaceholder?: string;
  monthPlaceholder?: string;
  yearPlaceholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
}

function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Date input as three select-only dropdowns (day / month / year) so users can
 * never type an invalid or malformed date. Day options adapt to the chosen
 * month + year (leap years included).
 */
export function DateField({
  label,
  value,
  onChange,
  error,
  minYear,
  maxYear,
  monthLabels,
  dayPlaceholder = 'Day',
  monthPlaceholder = 'Month',
  yearPlaceholder = 'Year',
  searchPlaceholder,
  noResultsText,
}: DateFieldProps) {
  const t = useTheme();

  const initial = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? { y: Number(value.slice(0, 4)), m: Number(value.slice(5, 7)), d: Number(value.slice(8, 10)) }
    : { y: null, m: null, d: null };
  const [year, setYear] = useState<number | null>(initial.y);
  const [month, setMonth] = useState<number | null>(initial.m);
  const [day, setDay] = useState<number | null>(initial.d);

  const yearOptions: Option<number>[] = useMemo(() => {
    const out: Option<number>[] = [];
    for (let y = maxYear; y >= minYear; y--) out.push({ label: String(y), value: y });
    return out;
  }, [minYear, maxYear]);

  const monthOptions: Option<number>[] = useMemo(
    () => monthLabels.map((name, i) => ({ label: name, value: i + 1 })),
    [monthLabels],
  );

  const maxDay = year != null && month != null ? daysInMonth(year, month) : 31;
  const dayOptions: Option<number>[] = useMemo(
    () => Array.from({ length: maxDay }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
    [maxDay],
  );

  // Recompose upward whenever parts change; clamp an out-of-range day
  // (e.g. Jan 31 -> Feb) by clearing it so the user re-picks.
  useEffect(() => {
    let d = day;
    if (d != null && d > maxDay) {
      d = null;
      setDay(null);
    }
    if (year != null && month != null && d != null) {
      onChange(`${year}-${pad2(month)}-${pad2(d)}`);
    } else {
      onChange('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, day, maxDay]);

  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SearchSelect
            placeholder={dayPlaceholder}
            options={dayOptions}
            value={day}
            onChange={setDay}
            searchPlaceholder={searchPlaceholder}
            noResultsText={noResultsText}
          />
        </View>
        <View style={{ flex: 2 }}>
          <SearchSelect
            placeholder={monthPlaceholder}
            options={monthOptions}
            value={month}
            onChange={setMonth}
            searchPlaceholder={searchPlaceholder}
            noResultsText={noResultsText}
          />
        </View>
        <View style={{ flex: 1.4 }}>
          <SearchSelect
            placeholder={yearPlaceholder}
            options={yearOptions}
            value={year}
            onChange={setYear}
            searchPlaceholder={searchPlaceholder}
            noResultsText={noResultsText}
          />
        </View>
      </View>
      {error ? (
        <Text variant="muted" style={{ color: t.color.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
