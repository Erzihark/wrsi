import { ActivityIndicator, FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Screen, Text, useTheme } from '@wrsi/ui';

export interface EntityListScreenProps<Item> {
  /** "＋ Add" button label. */
  addLabel: string;
  /** testID for the "＋ Add" button (for Maestro E2E). */
  addTestID?: string;
  /** testID for the name-search input (for Maestro E2E). */
  searchTestID?: string;
  /** testID for each row's "Edit" button (for Maestro E2E). Filter the list to
   *  one row via search first, since all rows share this id. */
  editTestID?: string;
  searchPlaceholder: string;
  emptyText: string;
  items: Item[] | undefined;
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  keyFor: (item: Item) => string;
  titleFor: (item: Item) => string;
  subtitleFor?: (item: Item) => string | null;
  onAdd: () => void;
  onPressItem: (item: Item) => void;
}

/**
 * Shared list scaffold for the admin directory tabs (high schools, universities):
 * a name search, a "＋ Add" button that opens the create form, and a tappable card
 * per row. The students list keeps its own richer filter UI.
 */
export function EntityListScreen<Item>({
  addLabel,
  addTestID,
  searchTestID,
  editTestID,
  searchPlaceholder,
  emptyText,
  items,
  isLoading,
  search,
  onSearchChange,
  keyFor,
  titleFor,
  subtitleFor,
  onAdd,
  onPressItem,
}: EntityListScreenProps<Item>) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Screen>
      <View style={{ gap: theme.spacing.sm, paddingBottom: theme.spacing.sm }}>
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChangeText={onSearchChange}
          autoCapitalize="none"
          testID={searchTestID}
        />
        <Button title={addLabel} onPress={onAdd} testID={addTestID} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={items ?? []}
          keyExtractor={keyFor}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{emptyText}</Text>}
          renderItem={({ item }) => {
            const subtitle = subtitleFor?.(item);
            return (
              <Card style={{ marginBottom: theme.spacing.sm }}>
                <Text variant="title">{titleFor(item)}</Text>
                {subtitle ? <Text variant="muted">{subtitle}</Text> : null}
                <Button
                  variant="secondary"
                  title={t('admin.edit')}
                  onPress={() => onPressItem(item)}
                  testID={editTestID}
                />
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}
