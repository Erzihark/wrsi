import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';
import { File as FsFile } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import {
  useCreateDocumentSignedUrl,
  useDeleteDocument,
  useDocuments,
  useDocumentTypes,
  useUploadDocument,
} from '@wrsi/api';
import { Badge, Button, Card, Screen, Select, Text, useTheme } from '@wrsi/ui';
import { useAuth } from '../../auth/AuthContext';

function humanSize(bytes?: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const userId = useAuth().session?.user.id;

  const docs = useDocuments(userId);
  const types = useDocumentTypes();
  const upload = useUploadDocument(userId ?? '');
  const remove = useDeleteDocument(userId ?? '');
  const signedUrl = useCreateDocumentSignedUrl();

  const [typeId, setTypeId] = useState<string | null>(null);

  const typeOptions = (types.data ?? []).map((dt) => ({ label: dt.name, value: dt.id }));

  async function pickAndUpload() {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      if (!asset) return;
      const base64 = await new FsFile(asset.uri).base64();
      await upload.mutateAsync({
        data: decode(base64),
        fileName: asset.name,
        mimeType: asset.mimeType ?? null,
        size: asset.size ?? null,
        typeId,
      });
      Alert.alert(t('documents.uploaded'));
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  async function open(storagePath: string) {
    try {
      const url = await signedUrl.mutateAsync(storagePath);
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  function confirmDelete(id: string, storagePath: string) {
    Alert.alert(t('documents.deleteConfirmTitle'), t('documents.deleteConfirmMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('documents.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync({ id, storagePath });
          } catch (e) {
            Alert.alert(t('common.error'), (e as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <Text variant="heading">{t('documents.title')}</Text>

      <View style={{ gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
        <Select
          label={t('documents.selectType')}
          options={typeOptions}
          value={typeId}
          onChange={setTypeId}
        />
        <Button
          title={upload.isPending ? t('documents.uploading') : t('documents.add')}
          loading={upload.isPending}
          onPress={pickAndUpload}
        />
      </View>

      {docs.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : (
        <FlatList
          data={docs.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          ListEmptyComponent={<Text variant="muted">{t('documents.empty')}</Text>}
          renderItem={({ item }) => (
            <Card style={{ marginBottom: theme.spacing.sm, gap: theme.spacing.xs }}>
              <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}
              >
                <Text variant="title" style={{ flexShrink: 1 }}>
                  {item.original_filename ?? item.storage_path}
                </Text>
                {item.document_types?.name ? (
                  <Badge label={item.document_types.name} color={theme.color.primary} />
                ) : null}
              </View>
              <Text variant="muted">{humanSize(item.size_bytes)}</Text>
              <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="secondary"
                    title={t('documents.open')}
                    onPress={() => open(item.storage_path)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Button
                    variant="danger"
                    title={t('documents.delete')}
                    onPress={() => confirmDelete(item.id, item.storage_path)}
                  />
                </View>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}
