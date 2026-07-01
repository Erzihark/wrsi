import { ScrollView, View, type ViewProps } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
}

/** Full-bleed screen container with themed background + padding. */
export function Screen({ scroll = false, style, children, ...rest }: ScreenProps) {
  const t = useTheme();
  const padding = { padding: t.spacing.lg, gap: t.spacing.md };

  if (scroll) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: t.color.background }}
        contentContainerStyle={[padding, style]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: t.color.background }, padding, style]} {...rest}>
      {children}
    </View>
  );
}
