import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { SearchSelect } from './SearchSelect';
import type { Option } from './Select';

export interface TimeFieldProps {
  label?: string;
  /** 24-hour "HH:mm", or '' while incomplete. */
  value: string;
  /** Called with a full 24-hour "HH:mm", or '' whenever the selection is incomplete. */
  onChange: (value: string) => void;
  error?: string;
  hourPlaceholder?: string;
  minutePlaceholder?: string;
  periodPlaceholder?: string;
  searchPlaceholder?: string;
  noResultsText?: string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function parse24h(value: string): { h: number | null; m: number | null; p: 'AM' | 'PM' | null } {
  if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) return { h: null, m: null, p: null };
  const h24 = Number(value.slice(0, 2));
  const m = Number(value.slice(3, 5));
  const p: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h, m, p };
}

/**
 * Time input as three select-only dropdowns (hour / minute / AM-PM) so a time
 * can never be typed in an invalid or malformed shape — the same "select, don't
 * type" approach as `DateField`. Internally stores/emits a 24-hour "HH:mm"
 * string (what the DB and start<end comparisons use); the picker itself is
 * always 12-hour + AM/PM, matching how people actually read a clock.
 */
export function TimeField({
  label,
  value,
  onChange,
  error,
  hourPlaceholder = 'Hour',
  minutePlaceholder = 'Min',
  periodPlaceholder = 'AM/PM',
  searchPlaceholder,
  noResultsText,
}: TimeFieldProps) {
  const t = useTheme();

  const initial = parse24h(value);
  const [hour, setHour] = useState<number | null>(initial.h);
  const [minute, setMinute] = useState<number | null>(initial.m);
  const [period, setPeriod] = useState<'AM' | 'PM' | null>(initial.p);

  // Reset when a parent clears the field (e.g. after a successful submit) so
  // the picker doesn't keep showing a stale selection.
  useEffect(() => {
    if (value === '') {
      setHour(null);
      setMinute(null);
      setPeriod(null);
    }
  }, [value]);

  const hourOptions: Option<number>[] = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })),
    [],
  );
  const minuteOptions: Option<number>[] = useMemo(
    () => Array.from({ length: 60 }, (_, i) => ({ label: pad2(i), value: i })),
    [],
  );
  const periodOptions: Option<'AM' | 'PM'>[] = useMemo(
    () => [
      { label: 'AM', value: 'AM' },
      { label: 'PM', value: 'PM' },
    ],
    [],
  );

  useEffect(() => {
    if (hour != null && minute != null && period != null) {
      const h24 = period === 'AM' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
      onChange(`${pad2(h24)}:${pad2(minute)}`);
    } else {
      onChange('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, period]);

  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <SearchSelect
            placeholder={hourPlaceholder}
            options={hourOptions}
            value={hour}
            onChange={setHour}
            searchPlaceholder={searchPlaceholder}
            noResultsText={noResultsText}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SearchSelect
            placeholder={minutePlaceholder}
            options={minuteOptions}
            value={minute}
            onChange={setMinute}
            searchPlaceholder={searchPlaceholder}
            noResultsText={noResultsText}
          />
        </View>
        <View style={{ flex: 1 }}>
          <SearchSelect
            placeholder={periodPlaceholder}
            options={periodOptions}
            value={period}
            onChange={setPeriod}
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
