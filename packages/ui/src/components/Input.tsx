import { forwardRef } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/**
 * Forwards its ref to the underlying `TextInput` so callers can drive focus —
 * the profile edit form focuses the field the student tapped on their profile.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, style, ...rest },
  ref,
) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? <Text variant="label">{label}</Text> : null}
      <TextInput
        ref={ref}
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
});
