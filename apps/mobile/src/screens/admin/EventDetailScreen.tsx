import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { imageUrlField, requiredString } from '@wrsi/shared-utils';
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
import {
  Button,
  Card,
  DateField,
  Input,
  Screen,
  SearchSelect,
  Select,
  Text,
  TimeField,
  useConfirm,
  useTheme,
  useToast,
} from '@wrsi/ui';
import type { AdminEventsStackParamList } from '../../navigation/types';
import {
  FormDateField,
  FormInput,
  FormSearchSelect,
  FormSelect,
  FormTimeField,
} from '../../components/form';
import { CountrySelect } from '../../components/CountrySelect';

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
  t: TFunction,
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

const eventSchema = z
  .object({
    title: requiredString(),
    description: z.string(),
    event_type: z.string().nullable(),
    start_date: z.string().min(1, 'validation.startDateRequired'),
    end_date: z.string(),
    country_id: z.string().nullable(),
    state_province_id: z.string().nullable(),
    location: z.string(),
    image_url: imageUrlField(),
    start_time: z.string(),
    end_time: z.string(),
  })
  .superRefine((f, ctx) => {
    if (f.start_date && f.end_date && f.end_date < f.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_date'],
        message: 'validation.endBeforeStart',
      });
    }
    if (f.start_time && f.end_time && f.end_time <= f.start_time) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['end_time'],
        message: 'validation.endTimeBeforeStart',
      });
    }
  });
type FormState = z.infer<typeof eventSchema>;

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  event_type: null,
  start_date: '',
  end_date: '',
  country_id: null,
  state_province_id: null,
  location: '',
  image_url: '',
  start_time: '',
  end_time: '',
};

function EventUniversitiesSection({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const participating = useEventUniversities(eventId);
  const all = useUniversitiesList();
  const add = useAddEventUniversity();
  const remove = useRemoveEventUniversity();
  const [selected, setSelected] = useState<string | null>(null);

  const participatingIds = new Set((participating.data ?? []).map((u) => u.id));
  const options = (all.data ?? [])
    .filter((u) => !participatingIds.has(u.id))
    .map((u) => ({ label: u.name, value: u.id }));

  async function onRemove(universityId: string) {
    const ok = await confirm.confirm({
      title: t('events.remove'),
      message: t('events.removeUniversityConfirmMessage'),
      confirmText: t('events.remove'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync({ eventId, universityId });
      toast.show({ type: 'success', message: t('events.universityRemovedToast') });
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  async function onAdd() {
    if (!selected) return;
    try {
      await add.mutateAsync({ eventId, universityId: selected });
      setSelected(null);
      toast.show({ type: 'success', message: t('events.universityAddedToast') });
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

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
            onPress={() => onRemove(u.id)}
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
        onPress={onAdd}
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
  const toast = useToast();
  const confirm = useConfirm();
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

  // Live validity → gate the Add button (errors are still shown on press).
  const canAdd =
    title.trim().length > 0 &&
    Object.keys(validateSlot(t, date, startTime, endTime, eventStartDate, eventEndDate)).length === 0;

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
      toast.show({ type: 'success', message: t('events.workshopAddedToast') });
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  async function onRemove(workshopId: string) {
    const ok = await confirm.confirm({
      title: t('events.remove'),
      message: t('events.removeWorkshopConfirmMessage'),
      confirmText: t('events.remove'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync({ id: workshopId, eventId });
      toast.show({ type: 'success', message: t('events.workshopRemovedToast') });
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
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
            onPress={() => onRemove(w.id)}
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
        <Button
          variant="secondary"
          title={t('events.addWorkshop')}
          loading={create.isPending}
          disabled={!canAdd || create.isPending}
          onPress={add}
        />
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
  const toast = useToast();
  const confirm = useConfirm();
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

  // Live validity → gate the Add button (errors are still shown on press).
  const canAdd =
    Object.keys(validateSlot(t, date, startTime, endTime, eventStartDate, eventEndDate)).length === 0;

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
      toast.show({ type: 'success', message: t('events.slotAddedToast') });
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  async function onRemove(slotId: string) {
    const ok = await confirm.confirm({
      title: t('events.remove'),
      message: t('events.removeSlotConfirmMessage'),
      confirmText: t('events.remove'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync({ id: slotId, eventId });
      toast.show({ type: 'success', message: t('events.slotRemovedToast') });
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
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
            onPress={() => onRemove(slot.id)}
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
        <Button
          variant="secondary"
          title={t('events.addSlot')}
          loading={create.isPending}
          disabled={!canAdd || create.isPending}
          onPress={add}
        />
      </Card>
    </View>
  );
}

export function EventDetailScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const nav = useNavigation();
  const toast = useToast();
  const confirm = useConfirm();
  const { id } = useRoute<RouteProp<AdminEventsStackParamList, 'Detail'>>().params;
  const mode = id ? 'edit' : 'create';
  const nowY = new Date().getFullYear();

  const record = useEvent(id);
  const countries = useCountries();
  const states = useStatesProvinces();
  const create = useCreateEvent();
  const update = useUpdateEvent(id ?? '');
  const remove = useDeleteEvent();

  const form = useForm<FormState>({
    resolver: zodResolver(eventSchema),
    defaultValues: EMPTY_FORM,
    mode: 'onTouched',
  });

  // Seed once when the record loads. Guarded by a ref so a later refetch (e.g.
  // refetch-on-focus giving a new data reference) can't reset the form and wipe
  // edits in progress.
  const seeded = useRef(false);
  const loaded = mode === 'edit' ? record.data : null;
  useEffect(() => {
    if (loaded && !seeded.current) {
      seeded.current = true;
      form.reset({
        title: loaded.title,
        description: loaded.description ?? '',
        event_type: loaded.event_type,
        start_date: loaded.start_date ?? '',
        end_date: loaded.end_date ?? '',
        country_id: loaded.country_id,
        state_province_id: loaded.state_province_id,
        location: loaded.location ?? '',
        image_url: loaded.image_url ?? '',
        // Postgres `time` comes back as 'HH:MM:SS'; TimeField holds 'HH:MM'.
        start_time: loaded.start_time?.slice(0, 5) ?? '',
        end_time: loaded.end_time?.slice(0, 5) ?? '',
      });
      void form.trigger();
    }
  }, [loaded, form]);

  const countryId = form.watch('country_id');
  const startDate = form.watch('start_date');
  const endDate = form.watch('end_date');

  // State/province options are scoped to the chosen country (cascading select).
  const stateOptions = useMemo(
    () =>
      (states.data ?? [])
        .filter((s) => countryId && s.country_id === countryId)
        .map((s) => ({ label: s.name, value: s.id }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [states.data, countryId],
  );

  const typeOptions = EVENT_TYPES.map((v) => ({ label: v, value: v }));

  const ready = Boolean(countries.data && states.data) && (mode === 'create' || record.data);
  if (!ready) {
    return (
      <Screen>
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  // Changing the country invalidates any state picked under the previous one.
  function setCountry(next: string) {
    form.setValue('country_id', next, { shouldValidate: true, shouldTouch: true });
    form.setValue('state_province_id', null, { shouldValidate: true });
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
      location: f.location.trim() || null,
      image_url: f.image_url.trim() || null,
      start_time: f.start_time || null,
      end_time: f.end_time || null,
    };
  }

  const onSubmit = async (values: FormState) => {
    try {
      if (mode === 'create') {
        const created = await create.mutateAsync(toPayload(values));
        toast.show({ type: 'success', message: t('admin.created') });
        // Switch into edit mode so the child sections (universities/workshops/1:1) open.
        nav.setParams({ id: created.id } as never);
      } else {
        await update.mutateAsync(toPayload(values));
        toast.show({ type: 'success', message: t('admin.saved') });
      }
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  };

  async function confirmRemove() {
    if (!id) return;
    const ok = await confirm.confirm({
      title: t('admin.deleteTitle'),
      message: t('admin.confirmDelete'),
      confirmText: t('admin.delete'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await remove.mutateAsync(id);
      toast.show({ type: 'success', message: t('admin.deleted') });
      nav.goBack();
    } catch (e) {
      toast.show({ type: 'error', message: (e as Error).message });
    }
  }

  const submitting = create.isPending || update.isPending;
  const control: Control<FormState> = form.control;
  const dateProps = {
    minYear: nowY - 1,
    maxYear: nowY + 6,
    monthLabels: getMonthNames(i18n.language),
    dayPlaceholder: t('picker.day'),
    monthPlaceholder: t('picker.month'),
    yearPlaceholder: t('picker.year'),
    searchPlaceholder: t('picker.search'),
    noResultsText: t('picker.noResults'),
  };
  const timeProps = {
    hourPlaceholder: t('picker.hour'),
    minutePlaceholder: t('picker.minute'),
    periodPlaceholder: t('picker.period'),
    searchPlaceholder: t('picker.search'),
    noResultsText: t('picker.noResults'),
  };

  return (
    <Screen scroll>
      <Text variant="heading">{mode === 'create' ? t('admin.addEvent') : t('admin.editEvent')}</Text>

      <FormInput control={control} name="title" label={t('admin.eventTitle')} />
      <FormInput control={control} name="description" label={t('admin.description')} multiline />
      <FormSelect control={control} name="event_type" label={t('admin.eventType')} options={typeOptions} />
      <FormDateField control={control} name="start_date" label={t('admin.startDate')} {...dateProps} />
      <FormDateField control={control} name="end_date" label={t('admin.endDate')} {...dateProps} />
      {/* Day schedule shown on the student dashboard's event card (optional). */}
      <FormTimeField control={control} name="start_time" label={t('events.startTime')} {...timeProps} />
      <FormTimeField control={control} name="end_time" label={t('events.endTime')} {...timeProps} />
      <FormInput control={control} name="location" label={t('admin.eventVenue')} />
      <FormInput
        control={control}
        name="image_url"
        label={t('admin.eventImageUrl')}
        autoCapitalize="none"
        keyboardType="url"
      />
      {/* Geography is a cascading Country -> State/Province pair (no free-text location).
          Country is set manually so it can clear the dependent state selection. */}
      <CountrySelect
        label={t('admin.country')}
        countries={countries.data ?? []}
        value={countryId}
        onChange={setCountry}
      />
      {countryId && stateOptions.length > 0 ? (
        <FormSearchSelect
          control={control}
          name="state_province_id"
          label={t('admin.state')}
          options={stateOptions}
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
        disabled={!form.formState.isValid || submitting}
        onPress={form.handleSubmit(onSubmit)}
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
          <EventWorkshopsSection eventId={id} eventStartDate={startDate || null} eventEndDate={endDate || null} />
          <EventOneToOnesSection eventId={id} eventStartDate={startDate || null} eventEndDate={endDate || null} />
        </>
      ) : null}
    </Screen>
  );
}
