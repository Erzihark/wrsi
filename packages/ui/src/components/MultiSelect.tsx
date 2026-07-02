import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { Chip } from './Chip';
import type { Option } from './Select';

export interface MultiSelectProps<T extends string | number> {
  label?: string;
  options: Option<T>[];
  values: T[];
  onChange: (values: T[]) => void;
  error?: string;
}

/** Multi-choice selector rendered as toggleable chips. */
export function MultiSelect<T extends string | number>({
  label,
  options,
  values,
  onChange,
  error,
}: MultiSelectProps<T>) {
  const t = useTheme();

  function toggle(value: T) {
    onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
  }

  return (
    <View style={{ gap: t.spacing.sm }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
        {options.map((opt) => (
          <Chip
            key={String(opt.value)}
            label={opt.label}
            selected={values.includes(opt.value)}
            onPress={() => toggle(opt.value)}
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
