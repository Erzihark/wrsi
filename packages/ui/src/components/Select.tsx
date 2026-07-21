import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Chip } from './Chip';

export interface Option<T extends string | number = string> {
  label: string;
  value: T;
  /**
   * Extra terms the searchable pickers match on beyond the visible label — e.g.
   * a country's ISO code and dial code, or its name in the other language.
   * Ignored by the chip-based {@link Select}, which has no search.
   */
  keywords?: string[];
}

export interface SelectProps<T extends string | number> {
  label?: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
}

/** Single-choice selector rendered as a wrapping row of chips. */
export function Select<T extends string | number>({
  label,
  options,
  value,
  onChange,
  error,
}: SelectProps<T>) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.sm }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {options.map((opt) => (
          <Chip
            key={String(opt.value)}
            label={opt.label}
            selected={opt.value === value}
            onPress={() => onChange(opt.value)}
          />
        ))}
      </View>
      {error ? (
        <Text variant="muted" style={{ color: t.color.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
