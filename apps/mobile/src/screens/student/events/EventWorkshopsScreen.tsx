import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  useCancelWorkshopRequest,
  useEventWorkshops,
  useMyStudentProfile,
  useMyWorkshopRequests,
  useRequestWorkshop,
} from '@wrsi/api';
import { countByStatus, formatTimestampRange, type RequestStatus } from '@wrsi/shared-utils';
import {
  Button,
  Card,
  ClipboardIcon,
  ClockIcon,
  MapPinIcon,
  Screen,
  SegmentedTabs,
  Text,
  useConfirm,
  useTheme,
  useToast,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EmptyState, RequestStatusBadge } from './components';

type Tab = 'available' | 'pending' | 'approved' | 'rejected';

/**
 * "Workshops" — request a spot, then track Pendiente / Aprobado / Rechazado.
 *
 * The comp shows three tabs (Disponibles / Solicitados / Aprobados). A fourth,
 * Rechazados, is added because the model can produce one: a rejected request
 * that appeared nowhere would leave the student wondering where it went. It is
 * hidden until there is something in it.
 */
export function EventWorkshopsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventWorkshops'>>().params;

  const workshops = useEventWorkshops(eventId);
  const requests = useMyWorkshopRequests(eventId);
  const profile = useMyStudentProfile();
  const request = useRequestWorkshop();
  const cancel = useCancelWorkshopRequest();

  const [tab, setTab] = useState<Tab>('available');
  const studentId = profile.data?.id;

  const byWorkshop = useMemo(
    () => new Map((requests.data ?? []).map((r) => [r.workshop_id, r])),
    [requests.data],
  );
  const counts = useMemo(
    () => countByStatus((requests.data ?? []).map((r) => ({ status: r.status as RequestStatus }))),
    [requests.data],
  );

  // "Disponibles" excludes anything already requested — the comp's own split.
  const available = useMemo(
    () => (workshops.data ?? []).filter((w) => !byWorkshop.has(w.id)),
    [workshops.data, byWorkshop],
  );

  const requested = useMemo(
    () => (requests.data ?? []).filter((r) => r.status === tab),
    [requests.data, tab],
  );

  async function onRequest(workshopId: string) {
    if (!studentId) return;
    try {
      await request.mutateAsync({ studentId, workshopId, eventId });
      toast.show({ type: 'success', message: t('eventDetail.workshops.requestedToast') });
    } catch (err) {
      toast.show({ type: 'error', message: (err as Error).message });
    }
  }

  async function onCancel(workshopId: string) {
    if (!studentId) return;
    const ok = await confirm.confirm({
      title: t('eventDetail.workshops.cancelConfirmTitle'),
      message: t('eventDetail.workshops.cancelConfirmMessage'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync({ studentId, workshopId, eventId });
      toast.show({ type: 'success', message: t('eventDetail.workshops.cancelledToast') });
    } catch (err) {
      toast.show({ type: 'error', message: (err as Error).message });
    }
  }

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'available', label: t('eventDetail.workshops.available'), count: available.length },
    { value: 'pending', label: t('eventDetail.workshops.requested'), count: counts.pending },
    { value: 'approved', label: t('eventDetail.workshops.approved'), count: counts.approved },
  ];
  if (counts.rejected > 0) {
    tabs.push({
      value: 'rejected',
      label: t('eventDetail.workshops.rejected'),
      count: counts.rejected,
    });
  }

  if (workshops.isLoading || requests.isLoading) {
    return (
      <Screen testID="event-workshops-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  return (
    <Screen testID="event-workshops-screen" style={{ padding: 0, gap: 0 }}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
        <SegmentedTabs testID="event-workshops-tabs" value={tab} onChange={setTab} options={tabs} />
        <Text variant="muted">{t('eventDetail.workshops.hint')}</Text>
      </View>

      {tab === 'available' ? (
        <FlatList
          data={available}
          keyExtractor={(item) => item.id}
          contentContainerStyle={listStyle(theme)}
          ListEmptyComponent={<EmptyState title={t('eventDetail.workshops.emptyAvailable')} />}
          renderItem={({ item }) => (
            <WorkshopCard
              title={item.title}
              universityName={item.universities?.name ?? null}
              startTime={item.start_time}
              endTime={item.end_time}
              action={
                <Button
                  testID={`event-workshop-request-${item.id}`}
                  variant="brand"
                  title={t('eventDetail.workshops.request')}
                  loading={request.isPending}
                  disabled={!studentId}
                  onPress={() => void onRequest(item.id)}
                />
              }
            />
          )}
        />
      ) : (
        <FlatList
          data={requested}
          keyExtractor={(item) => item.workshop_id}
          contentContainerStyle={listStyle(theme)}
          ListEmptyComponent={
            <EmptyState
              title={t(
                tab === 'pending'
                  ? 'eventDetail.workshops.emptyRequested'
                  : tab === 'approved'
                    ? 'eventDetail.workshops.emptyApproved'
                    : 'eventDetail.workshops.emptyRejected',
              )}
            />
          }
          renderItem={({ item }) => (
            <WorkshopCard
              title={item.workshops?.title ?? ''}
              universityName={item.workshops?.universities?.name ?? null}
              startTime={item.workshops?.start_time ?? null}
              endTime={item.workshops?.end_time ?? null}
              status={item.status as RequestStatus}
              room={item.room}
              action={
                item.status === 'rejected' ? null : (
                  <Button
                    testID={`event-workshop-cancel-${item.workshop_id}`}
                    variant="secondary"
                    title={t('eventDetail.workshops.cancel')}
                    loading={cancel.isPending}
                    onPress={() => void onCancel(item.workshop_id)}
                  />
                )
              }
            />
          )}
        />
      )}
    </Screen>
  );
}

const listStyle = (theme: ReturnType<typeof useTheme>) => ({
  paddingHorizontal: theme.spacing.lg,
  paddingBottom: theme.spacing.xxl,
  gap: theme.spacing.sm,
});

function WorkshopCard({
  title,
  universityName,
  startTime,
  endTime,
  status,
  room,
  action,
}: {
  title: string;
  universityName: string | null;
  startTime: string | null;
  endTime: string | null;
  status?: RequestStatus;
  room?: string | null;
  action: React.ReactNode;
}) {
  const theme = useTheme();
  const when = formatTimestampRange(startTime, endTime);

  return (
    <Card style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: theme.color.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ClipboardIcon size={20} color={theme.color.brand} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
            {title}
          </Text>
          {universityName ? <Text variant="muted">{universityName}</Text> : null}
        </View>
        {status ? <RequestStatusBadge status={status} /> : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        {when ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <ClockIcon size={14} color={theme.color.textMuted} />
            <Text variant="muted">{when}</Text>
          </View>
        ) : null}
        {room ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPinIcon size={14} color={theme.color.textMuted} />
            <Text variant="muted">{room}</Text>
          </View>
        ) : null}
      </View>

      {action}
    </Card>
  );
}
