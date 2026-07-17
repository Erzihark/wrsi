import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDeleteReference, useMyReferences, useSaveReference } from '@wrsi/api';
import { Button, Card, CloseIcon, Input, Text, useTheme, useToast } from '@wrsi/ui';

/**
 * "Personas extra (Referencias / Recomendaciones)" — a 0..N list living in its
 * own table, so it saves immediately rather than participating in the profile
 * form's submit. Bare-bones pending a design.
 */
export function ReferencesEditor({ studentId }: { studentId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const references = useMyReferences();
  const save = useSaveReference();
  const remove = useDeleteReference();

  const [fullName, setFullName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [contact, setContact] = useState('');

  async function add() {
    if (!fullName.trim()) return;
    try {
      await save.mutateAsync({
        studentId,
        fullName,
        relationship,
        // One contact box for now: route an "@" to email, anything else to phone.
        email: contact.includes('@') ? contact : null,
        phone: contact.includes('@') ? null : contact,
      });
      setFullName('');
      setRelationship('');
      setContact('');
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  return (
    <View style={{ gap: theme.spacing.md }}>
      <Text variant="label">{t('profile.fields.references')}</Text>

      {(references.data ?? []).map((r) => (
        <Card key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text>{r.full_name}</Text>
            <Text variant="muted">
              {[r.relationship, r.email ?? r.phone].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Button
            testID={`reference-delete-${r.id}`}
            variant="ghost"
            title=""
            icon={(c) => <CloseIcon size={16} color={c} />}
            // Scope the spinner to the row being deleted, not every row.
            loading={remove.isPending && remove.variables === r.id}
            onPress={() => remove.mutate(r.id)}
          />
        </Card>
      ))}

      {references.data?.length === 0 ? (
        <Text variant="muted">{t('profile.noReferences')}</Text>
      ) : null}

      <Card style={{ gap: theme.spacing.md }}>
        <Input
          testID="reference-name"
          label={t('profile.referenceName')}
          value={fullName}
          onChangeText={setFullName}
        />
        <Input
          label={t('profile.referenceRelationship')}
          value={relationship}
          onChangeText={setRelationship}
        />
        <Input
          label={t('profile.referenceContact')}
          value={contact}
          onChangeText={setContact}
          autoCapitalize="none"
        />
        <Button
          testID="reference-add"
          variant="secondary"
          title={t('profile.addReference')}
          loading={save.isPending}
          disabled={!fullName.trim()}
          onPress={() => void add()}
        />
      </Card>
    </View>
  );
}
