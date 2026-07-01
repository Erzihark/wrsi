import { TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: InputProps) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.color.textMuted}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? t.color.danger : t.color.border,
            borderRadius: t.radius.md,
            paddingHorizontal: t.spacing.md,
            paddingVertical: t.spacing.md,
            fontSize: t.fontSize.md,
            color: t.color.text,
            backgroundColor: t.color.background,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="muted" style={{ color: t.color.danger }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
