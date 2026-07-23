import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import { type RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  useCancelMeetingRequest,
  useEventUniversities,
  useMyMeetingRequests,
  useMyStudentProfile,
  type MyMeetingRequest,
} from '@wrsi/api';
import { countByStatus, formatTimestampRange, type RequestStatus } from '@wrsi/shared-utils';
import {
  Button,
  Card,
  ClockIcon,
  MapPinIcon,
  Screen,
  SegmentedTabs,
  Text,
  UsersIcon,
  useConfirm,
  useTheme,
  useToast,
} from '@wrsi/ui';
import type { StudentEventsStackParamList } from '../../../navigation/types';
import { EmptyState, RequestStatusBadge } from './components';
import { UniversityLogo } from './EventUniversitiesScreen';

type Nav = NativeStackNavigationProp<StudentEventsStackParamList, 'EventMeetings'>;

/**
 * "Meetings 1 a 1" — the student's requests split by decision, with the time
 * and room staff assigned once approved.
 *
 * Requesting happens on the university's own screen, not here: a meeting is
 * always *with someone*, and the comp's own flow is "Solicitar meeting 1 a 1"
 * from the university sheet. This screen's CTA therefore routes to the
 * participating-universities list rather than opening a picker.
 */
export function EventMeetingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const confirm = useConfirm();
  const nav = useNavigation<Nav>();
  const { eventId } = useRoute<RouteProp<StudentEventsStackParamList, 'EventMeetings'>>().params;

  const requests = useMyMeetingRequests(eventId);
  const universities = useEventUniversities(eventId);
  const profile = useMyStudentProfile();
  const cancel = useCancelMeetingRequest();

  const [tab, setTab] = useState<RequestStatus>('pending');
  const studentId = profile.data?.id;

  const counts = useMemo(
    () => countByStatus((requests.data ?? []).map((r) => ({ status: r.status as RequestStatus }))),
    [requests.data],
  );
  const visible = useMemo(
    () => (requests.data ?? []).filter((r) => r.status === tab),
    [requests.data, tab],
  );

  async function onCancel(id: string) {
    const ok = await confirm.confirm({
      title: t('eventDetail.meetings.cancelConfirmTitle'),
      message: t('eventDetail.meetings.cancelConfirmMessage'),
      confirmText: t('common.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancel.mutateAsync({ id, eventId });
      toast.show({ type: 'success', message: t('eventDetail.meetings.cancelledToast') });
    } catch (err) {
      toast.show({ type: 'error', message: (err as Error).message });
    }
  }

  if (requests.isLoading) {
    return (
      <Screen testID="event-meetings-screen">
        <ActivityIndicator color={theme.color.primary} />
      </Screen>
    );
  }

  const canRequestMore = (universities.data?.length ?? 0) > (requests.data?.length ?? 0);

  return (
    <Screen testID="event-meetings-screen" style={{ padding: 0, gap: 0 }}>
      <View style={{ padding: theme.spacing.lg, gap: theme.spacing.sm }}>
        <SegmentedTabs
          testID="event-meetings-tabs"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'pending', label: t('eventDetail.meetings.requested'), count: counts.pending },
            { value: 'approved', label: t('eventDetail.meetings.approved'), count: counts.approved },
            { value: 'rejected', label: t('eventDetail.meetings.rejected'), count: counts.rejected },
          ]}
        />
        <Text variant="muted">{t('eventDetail.meetings.hint')}</Text>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.sm,
        }}
        ListEmptyComponent={
          <EmptyState
            title={t(
              tab === 'pending'
                ? 'eventDetail.meetings.emptyRequested'
                : tab === 'approved'
                  ? 'eventDetail.meetings.emptyApproved'
                  : 'eventDetail.meetings.emptyRejected',
            )}
          />
        }
        renderItem={({ item }) => (
          <MeetingCard
            request={item}
            onCancel={item.status === 'rejected' ? null : () => void onCancel(item.id)}
            cancelling={cancel.isPending}
          />
        )}
      />

      {/* Requesting starts from a university, so the CTA sends the student there
          instead of duplicating a picker on this screen. */}
      {canRequestMore && studentId ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: theme.color.border,
            backgroundColor: theme.color.surface,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}
        >
          <Button
            testID="event-meetings-request"
            title={t('eventDetail.meetings.request')}
            icon={(c) => <UsersIcon size={16} color={c} />}
            onPress={() => nav.navigate('EventUniversities', { eventId })}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function MeetingCard({
  request,
  onCancel,
  cancelling,
}: {
  request: MyMeetingRequest;
  onCancel: (() => void) | null;
  cancelling: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const when = formatTimestampRange(request.start_time, request.end_time);

  return (
    <Card style={{ gap: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md }}>
        <UniversityLogo url={request.universities?.logo_url ?? null} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="label" style={{ fontSize: theme.fontSize.md }}>
            {request.universities?.name ?? '—'}
          </Text>
          {request.student_note ? <Text variant="muted">{request.student_note}</Text> : null}
        </View>
        <RequestStatusBadge status={request.status as RequestStatus} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <ClockIcon size={14} color={theme.color.textMuted} />
          <Text variant="muted">{when ?? t('eventDetail.meetings.pendingSchedule')}</Text>
        </View>
        {request.room ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MapPinIcon size={14} color={theme.color.textMuted} />
            <Text variant="muted">{request.room}</Text>
          </View>
        ) : null}
      </View>

      {onCancel ? (
        <Button
          testID={`event-meeting-cancel-${request.id}`}
          variant="secondary"
          title={t('eventDetail.meetings.cancel')}
          loading={cancelling}
          onPress={onCancel}
        />
      ) : null}
    </Card>
  );
}
