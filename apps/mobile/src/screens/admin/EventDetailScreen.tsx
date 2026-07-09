import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getMonthNames } from '@wrsi/i18n';
import {
  useAddEventUniversity,
  useCountries,
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
import { Button, Card, DateField, Input, Screen, SearchSelect, Select, Text, TimeField, useTheme } from '@wrsi/ui';
import type { AdminEventsStackParamList } from '../../navigation/types';

const EVENT_TYPES = ['fair', 'open_fair_day', 'other'];

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type SlotFormErrors = Partial<Record<'title' | 'date' | 'startTime' | 'endTime', string>>;

/**
 * Validate the shared date + start/end time inputs used by workshops and 1:1
 * slots. `DateField`/`TimeField` only ever emit a well-formed value or '', so
 * this only needs to check presence + ordering + the event's own date range —
 * malformed input is unrepresentable by construction.
 */
function validateSlot(
  t: (key: string, opts?: Record<string, unknown>) => string,
  date: string,
  start: string,
  end: string,
  eventStartDate: string | null,
  eventEndDate: string | null,
): SlotFormErrors {
  const errors: SlotFormErrors = {};
  if (!date) errors.date = t('validation.invalidDate');
  else if ((eventStartDate && date < eventStartDate) || (eventEndDate && date > eventEndDate)) {
    errors.date = t('validation.dateOutsideEvent');
  }
  if (!start) errors.startTime = t('validation.invalidTime');
  if (!end) errors.endTime = t('validation.invalidTime');
  if (start && end && end <= start) errors.endTime = t('validation.endTimeBeforeStart');
  return errors;
}

type FormState = {
  title: string;
  description: string;
  event_type: string | null;
  start_date: string;
  end_date: string;
  country_id: string | null;
  state_province_id: string | null;
};

type FormErrors = Partial<Record<'title' | 'start_date' | 'end_date', string>>;

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  event_type: null,
  start_date: '',
  end_date: '',
  country_id: null,
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

function EventWorkshopsSection({
  eventId,
  eventStartDate,
  eventEndDate,
}: {
  eventId: string;
  eventStartDate: string | null;
  eventEndDate: string | null;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nowY = new Date().getFullYear();
  const workshops = useEventWorkshops(eventId);
  const universities = useUniversitiesList();
  const create = useCreateWorkshop();
  const remove = useDeleteWorkshop();

  const [title, setTitle] = useState('');
  const [universityId, setUniversityId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [errors, setErrors] = useState<SlotFormErrors>({});

  const universityOptions = (universities.data ?? []).map((u) => ({ label: u.name, value: u.id }));

  async function add() {
    const slotErrors = validateSlot(t, date, startTime, endTime, eventStartDate, eventEndDate);
    if (!title.trim()) slotErrors.title = t('validation.required');
    setErrors(slotErrors);
    if (Object.keys(slotErrors).length > 0) return;
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
      setDate('');
      setStartTime('');
      setEndTime('');
      setErrors({});
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
        <Input
          label={t('events.workshopTitle')}
          value={title}
          onChangeText={setTitle}
          error={errors.title}
        />
        <Select
          label={t('admin.university')}
          options={universityOptions}
          value={universityId}
          onChange={setUniversityId}
        />
        <DateField
          label={t('events.date')}
          value={date}
          onChange={setDate}
          error={errors.date}
          minYear={nowY - 1}
          maxYear={nowY + 6}
          monthLabels={getMonthNames(i18n.language)}
          dayPlaceholder={t('picker.day')}
          monthPlaceholder={t('picker.month')}
          yearPlaceholder={t('picker.year')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <TimeField
          label={t('events.startTime')}
          value={startTime}
          onChange={setStartTime}
          error={errors.startTime}
          hourPlaceholder={t('picker.hour')}
          minutePlaceholder={t('picker.minute')}
          periodPlaceholder={t('picker.period')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <TimeField
          label={t('events.endTime')}
          value={endTime}
          onChange={setEndTime}
          error={errors.endTime}
          hourPlaceholder={t('picker.hour')}
          minutePlaceholder={t('picker.minute')}
          periodPlaceholder={t('picker.period')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <Button variant="secondary" title={t('events.addWorkshop')} loading={create.isPending} onPress={add} />
      </Card>
    </View>
  );
}

function EventOneToOnesSection({
  eventId,
  eventStartDate,
  eventEndDate,
}: {
  eventId: string;
  eventStartDate: string | null;
  eventEndDate: string | null;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nowY = new Date().getFullYear();
  const slots = useOneToOnes(eventId);
  const universities = useUniversitiesList();
  const create = useCreateOneToOneSlot();
  const remove = useDeleteOneToOneSlot();

  const [universityId, setUniversityId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [errors, setErrors] = useState<SlotFormErrors>({});

  const universityOptions = (universities.data ?? []).map((u) => ({ label: u.name, value: u.id }));

  async function add() {
    const slotErrors = validateSlot(t, date, startTime, endTime, eventStartDate, eventEndDate);
    setErrors(slotErrors);
    if (Object.keys(slotErrors).length > 0) return;
    try {
      await create.mutateAsync({
        event_id: eventId,
        university_id: universityId,
        start_time: `${date}T${startTime}:00`,
        end_time: `${date}T${endTime}:00`,
      });
      setUniversityId(null);
      setDate('');
      setStartTime('');
      setEndTime('');
      setErrors({});
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
        <DateField
          label={t('events.date')}
          value={date}
          onChange={setDate}
          error={errors.date}
          minYear={nowY - 1}
          maxYear={nowY + 6}
          monthLabels={getMonthNames(i18n.language)}
          dayPlaceholder={t('picker.day')}
          monthPlaceholder={t('picker.month')}
          yearPlaceholder={t('picker.year')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <TimeField
          label={t('events.startTime')}
          value={startTime}
          onChange={setStartTime}
          error={errors.startTime}
          hourPlaceholder={t('picker.hour')}
          minutePlaceholder={t('picker.minute')}
          periodPlaceholder={t('picker.period')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
        <TimeField
          label={t('events.endTime')}
          value={endTime}
          onChange={setEndTime}
          error={errors.endTime}
          hourPlaceholder={t('picker.hour')}
          minutePlaceholder={t('picker.minute')}
          periodPlaceholder={t('picker.period')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
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
  const spanish = i18n.language.startsWith('es');
  const nowY = new Date().getFullYear();

  const record = useEvent(id);
  const countries = useCountries();
  const states = useStatesProvinces();
  const create = useCreateEvent();
  const update = useUpdateEvent(id ?? '');
  const remove = useDeleteEvent();

  const [form, setForm] = useState<FormState | null>(mode === 'create' ? EMPTY_FORM : null);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (mode === 'edit' && record.data && !form) {
      setForm({
        title: record.data.title,
        description: record.data.description ?? '',
        event_type: record.data.event_type,
        start_date: record.data.start_date ?? '',
        end_date: record.data.end_date ?? '',
        country_id: record.data.country_id,
        state_province_id: record.data.state_province_id,
      });
    }
  }, [mode, record.data, form]);

  const countryOptions = useMemo(
    () =>
      (countries.data ?? [])
        .map((c) => ({ label: spanish ? c.name_es ?? c.name : c.name, value: c.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries.data, spanish],
  );

  // State/province options are scoped to the chosen country (cascading select).
  const stateOptions = useMemo(
    () =>
      (states.data ?? [])
        .filter((s) => form?.country_id && s.country_id === form.country_id)
        .map((s) => ({ label: s.name, value: s.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [states.data, form?.country_id],
  );

  const typeOptions = EVENT_TYPES.map((v) => ({ label: v, value: v }));

  const ready = Boolean(countries.data && states.data) && form;
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

  // Changing the country invalidates any state picked under the previous one.
  function setCountry(countryId: string) {
    setForm((f) => (f ? { ...f, country_id: countryId, state_province_id: null } : f));
  }

  function validate(f: FormState): FormErrors {
    const next: FormErrors = {};
    if (!f.title.trim()) next.title = t('validation.required');
    if (!f.start_date) next.start_date = t('validation.startDateRequired');
    if (f.start_date && f.end_date && f.end_date < f.start_date) {
      next.end_date = t('validation.endBeforeStart');
    }
    return next;
  }

  function toPayload(f: FormState): EventInsert {
    return {
      title: f.title.trim(),
      description: f.description.trim() || null,
      event_type: f.event_type,
      start_date: f.start_date || null,
      end_date: f.end_date || null,
      country_id: f.country_id,
      state_province_id: f.state_province_id,
    };
  }

  async function save() {
    if (!form) return;
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    try {
      if (mode === 'create') {
        const created = await create.mutateAsync(toPayload(form));
        Alert.alert(t('admin.created'));
        // Switch into edit mode so the child sections (universities/workshops/1:1) open.
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

      <Input
        label={t('admin.eventTitle')}
        value={form.title}
        onChangeText={(v) => set('title', v)}
        error={errors.title}
      />
      <Input
        label={t('admin.description')}
        multiline
        value={form.description}
        onChangeText={(v) => set('description', v)}
      />
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
        error={errors.start_date}
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
        error={errors.end_date}
        minYear={nowY - 1}
        maxYear={nowY + 6}
        monthLabels={getMonthNames(i18n.language)}
        dayPlaceholder={t('picker.day')}
        monthPlaceholder={t('picker.month')}
        yearPlaceholder={t('picker.year')}
        searchPlaceholder={t('picker.search')}
        noResultsText={t('picker.noResults')}
      />
      {/* Geography is a cascading Country -> State/Province pair (no free-text location). */}
      <SearchSelect
        label={t('admin.country')}
        options={countryOptions}
        value={form.country_id}
        onChange={setCountry}
        placeholder={t('picker.select')}
        searchPlaceholder={t('picker.search')}
        noResultsText={t('picker.noResults')}
      />
      {form.country_id && stateOptions.length > 0 ? (
        <SearchSelect
          label={t('admin.state')}
          options={stateOptions}
          value={form.state_province_id}
          onChange={(v) => set('state_province_id', v)}
          placeholder={t('picker.select')}
          searchPlaceholder={t('picker.search')}
          noResultsText={t('picker.noResults')}
        />
      ) : null}

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
          <EventWorkshopsSection eventId={id} eventStartDate={form.start_date || null} eventEndDate={form.end_date || null} />
          <EventOneToOnesSection eventId={id} eventStartDate={form.start_date || null} eventEndDate={form.end_date || null} />
        </>
      ) : null}
    </Screen>
  );
}
