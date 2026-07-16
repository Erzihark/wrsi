import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';
import { ChevronRightIcon } from './icons';

export interface SectionHeaderProps {
  title: string;
  /** Optional trailing action (e.g. "Ver todos"); shows a chevron when pressable. */
  actionLabel?: string;
  onActionPress?: () => void;
  actionTestID?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * A section title with an optional right-aligned "Ver todos ›" action — the
 * repeated dashboard section header (próximo evento, recurso destacado, …).
 */
export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
  actionTestID,
  style,
}: SectionHeaderProps) {
  const t = useTheme();
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        style,
      ]}
    >
      <Text variant="title">{title}</Text>
      {actionLabel ? (
        <Pressable
          accessibilityRole="button"
          testID={actionTestID}
          onPress={onActionPress}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 2,
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: t.color.primaryDark, fontWeight: t.fontWeight.semibold }}>
            {actionLabel}
          </Text>
          <ChevronRightIcon size={16} color={t.color.primaryDark} />
        </Pressable>
      ) : null}
    </View>
  );
}
