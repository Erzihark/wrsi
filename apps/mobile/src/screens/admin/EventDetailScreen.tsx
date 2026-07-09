import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getMonthNames } from '@wrsi/i18n';
import {
  useAddEventUniversity,
  useCreateEvent,
  useCreateOneToOneSlot,
  useCreateWorkshop,
  useDeleteEvent,
  useDeleteOneToOneSlot,
  useDeleteWorkshop,
  useEvent,
  useEventUniversities,
  useEventWorkshops,
  useOneToOnes,
  useRemoveEventUniversity,
  useStatesProvinces,
  useUniversitiesList,
  useUpdateEvent,
  type EventInsert,
} from '@wrsi/api';
import { Button, Card, DateField, Input, Screen, SearchSelect, Select, Text, useTheme } from '@wrsi/ui';
import type { AdminEventsStackParamList } from '../../navigation/types';

const EVENT_TYPES = ['fair', 'open_fair_day', 'other'];
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type FormState = {
  title: string;
  description: string;
  location: string;
  event_type: string | null;
  start_date: string;
  end_date: string;
  state_province_id: string | null;
};

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  location: '',
  event_type: null,
  start_date: '',
  end_date: '',
  state_province_id: null,
};

function EventUniversitiesSection({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const participating = useEventUniversities(eventId);
  const all = useUniversitiesList();
  const add = useAddEventUniversity();
  const remove = useRemoveEventUniversity();
  const [selected, setSelected] = useState<string | null>(null);

  const participatingIds = new Set((participating.data ?? []).map((u) => u.id));
  const options = (all.data ?? [])
    .filter((u) => !participatingIds.has(u.id))
    .map((u) => ({ label: u.name, value: u.id }));

  return (
    <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
      <Text variant="label">{t('events.universities')}</Text>
      {(participating.data ?? []).map((u) => (
        <Card
          key={u.id}
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text>{u.name}</Text>
          <Button
            variant="danger"
            title={t('events.remove')}
            loading={remove.isPending}
            onPress={() => remove.mutate({ eventId, universityId: u.id })}
          />
        </Card>
      ))}
      {participating.data && participating.data.length === 0 ? (
        <Text variant="muted">{t('events.noUniversities')}</Text>
      ) : null}
      <SearchSelect
        placeholder={t('events.addUniversity')}
        options={options}
        value={selected}
        onChange={setSelected}
        searchPlaceholder={t('picker.search')}
        noResultsText={t('picker.noResults')}
      />
      <Button
        variant="secondary"
        title={t('events.addUniversity')}
        loading={add.isPending}
        disabled={!selected}
        onPress={() => {
          if (!selected) return;
          add.mutate({ eventId, universityId: selected });
          setSelected(null);
        }}
      />
    </View>
  );
}

function EventWorkshopsSection({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const workshops = useEventWorkshops(eventId);
  const universities = useUniversitiesList();
  const create = useCreateWorkshop();
  const remove = useDeleteWorkshop();

  const [title, setTitle] = useState('');
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const universityOptions = (universities.data ?? []).map((u) => ({ label: u.name, value: u.id }));

  async function add() {
    if (!title.trim() || !date || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    try {
      await create.mutateAsync({
        event_id: eventId,
        title: title.trim(),
        university_id: universityId,
        start_time: `${date}T${startTime}:00`,
        end_time: `${date}T${endTime}:00`,
      });
      setTitle('');
      setUniversityId(null);
      setStartTime('');
      setEndTime('');
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  return (
    <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
      <Text variant="label">{t('events.workshops')}</Text>
      {(workshops.data ?? []).map((w) => (
        <Card key={w.id} style={{ gap: theme.spacing.xs }}>
          <Text variant="title">{w.title}</Text>
          <Text variant="muted">
            {[w.universities?.name, `${formatTime(w.start_time)} – ${formatTime(w.end_time)}`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Button
            variant="danger"
            title={t('events.remove')}
            loading={remove.isPending}
            onPress={() => remove.mutate({ id: w.id, eventId })}
          />
        </Card>
      ))}
      {workshops.data && workshops.data.length === 0 ? (
        <Text variant="muted">{t('events.noWorkshops')}</Text>
      ) : null}

      <Card style={{ gap: theme.spacing.sm }}>
        <Input label={t('events.workshopTitle')} value={title} onChangeText={setTitle} />
        <Select
          label={t('admin.university')}
          options={universityOptions}
          value={universityId}
          onChange={setUniversityId}
        />
        <Input label={t('events.date')} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
        <Input label={t('events.startTime')} placeholder="14:00" value={startTime} onChangeText={setStartTime} />
        <Input label={t('events.endTime')} placeholder="15:00" value={endTime} onChangeText={setEndTime} />
        <Button variant="secondary" title={t('events.addWorkshop')} loading={create.isPending} onPress={add} />
      </Card>
    </View>
  );
}

function EventOneToOnesSection({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const slots = useOneToOnes(eventId);
  const universities = useUniversitiesList();
  const create = useCreateOneToOneSlot();
  const remove = useDeleteOneToOneSlot();

  const [universityId, setUniversityId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const universityOptions = (universities.data ?? []).map((u) => ({ label: u.name, value: u.id }));

  async function add() {
    if (!date || !TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    try {
      await create.mutateAsync({
        event_id: eventId,
        university_id: universityId,
        start_time: `${date}T${startTime}:00`,
        end_time: `${date}T${endTime}:00`,
      });
      setUniversityId(null);
      setStartTime('');
      setEndTime('');
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  return (
    <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
      <Text variant="label">{t('events.oneToOnes')}</Text>
      {(slots.data ?? []).map((slot) => (
        <Card key={slot.id} style={{ gap: theme.spacing.xs }}>
          <Text variant="title">{slot.universities?.name ?? '—'}</Text>
          <Text variant="muted">{`${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`}</Text>
          {slot.student_id ? <Text variant="muted">{t('events.booked')}</Text> : null}
          <Button
            variant="danger"
            title={t('events.remove')}
            loading={remove.isPending}
            onPress={() => remove.mutate({ id: slot.id, eventId })}
          />
        </Card>
      ))}
      {slots.data && slots.data.length === 0 ? <Text variant="muted">{t('events.noOneToOnes')}</Text> : null}

      <Card style={{ gap: theme.spacing.sm }}>
        <Select
          label={t('admin.university')}
          options={universityOptions}
          value={universityId}
          onChange={setUniversityId}
        />
        <Input label={t('events.date')} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
        <Input label={t('events.startTime')} placeholder="09:00" value={startTime} onChangeText={setStartTime} />
        <Input label={t('events.endTime')} placeholder="09:20" value={endTime} onChangeText={setEndTime} />
        <Button variant="secondary" title={t('events.addSlot')} loading={create.isPending} onPress={add} />
      </Card>
    </View>
  );
}

export function EventDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation();
  const { id } = useRoute<RouteProp<AdminEventsStackParamList, 'Detail'>>().params;
  const mode = id ? 'edit' : 'create';
  const nowY = new Date().getFullYear();

  const record = useEvent(id);
  const states = useStatesProvinces();
  const create = useCreateEvent();
  const update = useUpdateEvent(id ?? '');
  const remove = useDeleteEvent();

  const [form, setForm] = useState<FormState | null>(mode === 'create' ? EMPTY_FORM : null);

  useEffect(() => {
    if (mode === 'edit' && record.data && !form) {
      setForm({
        title: record.data.title,
        description: record.data.description ?? '',
        location: record.data.location ?? '',
        event_type: record.data.event_type,
        start_date: record.data.start_date ?? '',
        end_date: record.data.end_date ?? '',
        state_province_id: record.data.state_province_id,
      });
    }
  }, [mode, record.data, form]);

  const stateOptions = (states.data ?? []).map((s) => ({ label: s.name, value: s.id }));
  const typeOptions = EVENT_TYPES.map((v) => ({ label: v, value: v }));

  const ready = Boolean(states.data) && form;
  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function toPayload(f: FormState): EventInsert {
    return {
      title: f.title.trim(),
      description: f.description.trim() || null,
      location: f.location.trim() || null,
      event_type: f.event_type,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      state_province_id: f.state_province_id,
    };
  }

  async function save() {
    if (!form) return;
    if (!form.title.trim()) {
      Alert.alert(t('common.error'), t('validation.required'));
      return;
    }
    try {
      if (mode === 'create') {
        const created = await create.mutateAsync(toPayload(form));
        Alert.alert(t('admin.created'));
        nav.setParams({ id: created.id } as never);
      } else {
        await update.mutateAsync(toPayload(form));
        Alert.alert(t('admin.saved'));
      }
    } catch (e) {
      Alert.alert(t('common.error'), (e as Error).message);
    }
  }

  function confirmRemove() {
    if (!id) return;
    Alert.alert(t('admin.deleteTitle'), t('admin.confirmDelete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove.mutateAsync(id);
            Alert.alert(t('admin.deleted'));
            nav.goBack();
          } catch (e) {
            Alert.alert(t('common.error'), (e as Error).message);
          }
        },
      },
    ]);
  }

  const submitting = create.isPending || update.isPending;

  return (
    <Screen scroll>
      <Text variant="heading">{mode === 'create' ? t('admin.addEvent') : t('admin.editEvent')}</Text>

      <Input label={t('admin.eventTitle')} value={form.title} onChangeText={(v) => set('title', v)} />
      <Input
        label={t('admin.description')}
        multiline
        value={form.description}
        onChangeText={(v) => set('description', v)}
      />
      <Input label={t('admin.location')} value={form.location} onChangeText={(v) => set('location', v)} />
      <Select
        label={t('admin.eventType')}
        options={typeOptions}
        value={form.event_type}
        onChange={(v) => set('event_type', v)}
      />
      <DateField
        label={t('admin.startDate')}
        value={form.start_date}
        onChange={(v) => set('start_date', v)}
        minYear={nowY - 1}
        maxYear={nowY + 6}
        monthLabels={getMonthNames(i18n.language)}
        dayPlaceholder={t('picker.day')}
        monthPlaceholder={t('picker.month')}
        yearPlaceholder={t('picker.year')}
        searchPlaceholder={t('picker.search')}
        noResultsText={t('picker.noResults')}
      />
      <DateField
        label={t('admin.endDate')}
        value={form.end_date}
        onChange={(v) => set('end_date', v)}
        minYear={nowY - 1}
        maxYear={nowY + 6}
        monthLabels={getMonthNames(i18n.language)}
        dayPlaceholder={t('picker.day')}
        monthPlaceholder={t('picker.month')}
        yearPlaceholder={t('picker.year')}
        searchPlaceholder={t('picker.search')}
        noResultsText={t('picker.noResults')}
      />
      <SearchSelect
        label={t('admin.state')}
        options={stateOptions}
        value={form.state_province_id}
        onChange={(v) => set('state_province_id', v)}
        placeholder={t('picker.select')}
        searchPlaceholder={t('picker.search')}
        noResultsText={t('picker.noResults')}
      />

      <Button
        title={
          submitting
            ? t('onboarding.submitting')
            : mode === 'create'
              ? t('admin.create')
              : t('admin.saveChanges')
        }
        loading={submitting}
        onPress={save}
      />

      {mode === 'edit' && id ? (
        <>
          <Button
            variant="danger"
            title={t('admin.delete')}
            loading={remove.isPending}
            onPress={confirmRemove}
            style={{ marginTop: theme.spacing.sm }}
          />
          <EventUniversitiesSection eventId={id} />
          <EventWorkshopsSection eventId={id} />
          <EventOneToOnesSection eventId={id} />
        </>
      ) : null}
    </Screen>
  );
}
