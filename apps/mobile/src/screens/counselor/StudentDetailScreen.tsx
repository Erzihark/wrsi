import { ActivityIndicator, Linking, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useCountries,
  useCreateDocumentSignedUrl,
  useCurrencies,
  useDocuments,
  useHighSchools,
  useStudent,
  useStudentCurrentStatus,
  useStudentTasks,
} from '@wrsi/api';
import { fullName } from '@wrsi/shared-utils';
import { Badge, Button, Card, Screen, Text, useTheme } from '@wrsi/ui';
import type { CounselorStudentsStackParamList } from '../../navigation/types';

/** One label/value line in the profile summary. */
function Field({ label, value }: { label: string; value?: string | null }) {
  const theme = useTheme();
  if (!value) return null;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
      <Text variant="muted">{label}</Text>
      <Text style={{ flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

export function StudentDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { studentId } =
    useRoute<RouteProp<CounselorStudentsStackParamList, 'StudentDetail'>>().params;

  const student = useStudent(studentId);
  const status = useStudentCurrentStatus(studentId);
  const tasks = useStudentTasks(studentId);
  const documents = useDocuments(student.data?.user_id);
  const highSchools = useHighSchools();
  const countries = useCountries();
  const currencies = useCurrencies();
  const signedUrl = useCreateDocumentSignedUrl();

  if (!student.data) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const s = student.data;
  const isEs = i18n.language.startsWith('es');
  const hsName = highSchools.data?.find((h) => h.id === s.high_school_id)?.name ?? null;
  const country = countries.data?.find((c) => c.id === s.country_id);
  const countryName = country ? ((isEs ? country.name_es : null) ?? country.name) : null;
  const currencyCode = currencies.data?.find((c) => c.id === s.budget_currency_id)?.code ?? '';
  const budget = s.budget != null ? `${s.budget} ${currencyCode}`.trim() : null;
  const intake =
    s.desired_intake_term && s.desired_intake_year
      ? `${s.desired_intake_term} ${s.desired_intake_year}`
      : null;

  async function openDocument(storagePath: string) {
    try {
      const url = await signedUrl.mutateAsync(storagePath);
      await Linking.openURL(url);
    } catch {
      // surfaced by the button's disabled/loading state; nothing else to do
    }
  }

  return (
    <Screen scroll>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: theme.spacing.sm,
        }}
      >
        <Text variant="heading" style={{ flexShrink: 1 }}>
          {fullName(s.first_name, s.last_name)}
        </Text>
        {status.data?.status ? (
          <Badge
            label={status.data.status.name}
            color={status.data.status.color ?? undefined}
          />
        ) : null}
      </View>

      <Card style={{ gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        <Field label={t('counselor.highSchool')} value={hsName} />
        <Field label={t('counselor.phone')} value={s.phone_number} />
        <Field label={t('counselor.guardian')} value={s.parent_or_guardian_name} />
        <Field label={t('counselor.nationality')} value={countryName} />
        <Field
          label={t('counselor.grade')}
          value={s.average_grade != null ? String(s.average_grade) : null}
        />
        <Field label={t('counselor.english')} value={s.cefr_level} />
        <Field label={t('counselor.budget')} value={budget} />
        <Field label={t('counselor.intake')} value={intake} />
        <Field
          label={t('counselor.graduation')}
          value={s.expected_graduation_year != null ? String(s.expected_graduation_year) : null}
        />
      </Card>

      <Text variant="label" style={{ marginTop: theme.spacing.md }}>
        {t('counselor.documents')}
      </Text>
      {documents.isLoading ? (
        <ActivityIndicator color={theme.color.primary} />
      ) : documents.data && documents.data.length > 0 ? (
        documents.data.map((d) => (
          <Card key={d.id} style={{ gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
            <Text variant="title">{d.original_filename ?? d.storage_path}</Text>
            {d.document_types?.name ? <Text variant="muted">{d.document_types.name}</Text> : null}
            <Button
              variant="secondary"
              title={t('counselor.openDocument')}
              loading={signedUrl.isPending}
              onPress={() => void openDocument(d.storage_path)}
            />
          </Card>
        ))
      ) : (
        <Text variant="muted">{t('counselor.noDocuments')}</Text>
      )}

      <Text variant="label" style={{ marginTop: theme.spacing.md }}>
        {t('counselor.tasks')}
      </Text>
      {tasks.data && tasks.data.length > 0 ? (
        tasks.data.map((task) => (
          <Card key={task.id} style={{ gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
            <Text variant="title">{task.title}</Text>
            {task.description ? <Text variant="muted">{task.description}</Text> : null}
            <Text variant="muted">
              {[task.status, task.due_date].filter(Boolean).join(' · ')}
            </Text>
          </Card>
        ))
      ) : (
        <Text variant="muted">{t('counselor.noTasks')}</Text>
      )}
    </Screen>
  );
}
