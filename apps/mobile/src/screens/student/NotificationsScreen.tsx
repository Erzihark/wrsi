import { ActivityIndicator, FlatList, Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@wrsi/api';
import { Screen, Text, useTheme } from '@wrsi/ui';

/**
 * The bell's destination: the student's notification feed. Tapping an unread
 * row marks it read (which refreshes the header badge via cache invalidation).
 * Deep-linking from `notifications.data` is a later phase — see PROGRESS.
 */
export function NotificationsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = notifications.data ?? [];
  const hasUnread = items.some((n) => !n.is_read);

  return (
    <Screen testID="student-notifications-screen">
      {/* Title comes from the stack header; this row only carries the action,
          so it's omitted entirely when there's nothing to mark. */}
      {hasUnread ? (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            testID="student-notifications-mark-all"
            hitSlop={8}
            disabled={markAll.isPending}
            onPress={() => markAll.mutate()}
            style={({ pressed }) => ({ opacity: pressed || markAll.isPending ? 0.6 : 1 })}
          >
            <Text style={{ color: theme.color.primaryDark, fontWeight: theme.fontWeight.semibold }}>
              {t('notifications.markAll')}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {notifications.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{t('notifications.empty')}</Text>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              disabled={item.is_read}
              onPress={() => markRead.mutate(item.id)}
              style={({ pressed }) => ({
                gap: 2,
                padding: theme.spacing.md,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: theme.color.border,
                backgroundColor: item.is_read ? theme.color.background : theme.color.primarySoft,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
                {!item.is_read ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: theme.radius.pill,
                      backgroundColor: theme.color.primary,
                    }}
                  />
                ) : null}
                <Text style={{ flex: 1, fontWeight: item.is_read ? theme.fontWeight.regular : theme.fontWeight.semibold }}>
                  {item.title}
                </Text>
              </View>
              {item.body ? <Text variant="muted">{item.body}</Text> : null}
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
