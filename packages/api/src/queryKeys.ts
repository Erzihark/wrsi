/** Centralized TanStack Query keys so caches invalidate consistently. */
export const queryKeys = {
  session: ['session'] as const,
  myProfile: ['me', 'profile'] as const,
  myStudent: ['me', 'student'] as const,
  lookup: (name: string) => ['lookups', name] as const,
  universities: (filters?: Record<string, unknown>) =>
    ['universities', filters ?? {}] as const,
  university: (id: string) => ['universities', id] as const,
  universityPrograms: (id: string) => ['universities', id, 'programs'] as const,
  universityInterests: ['university_interests'] as const,
  highSchools: () => ['high_schools'] as const,
  highSchool: (id: string) => ['high_schools', id] as const,
  student: (id: string) => ['students', id] as const,
  studentStatus: (id: string) => ['students', id, 'status'] as const,
  studentTasks: (id: string) => ['students', id, 'tasks'] as const,
  studentDocuments: (userId: string) => ['documents', userId] as const,
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  eventUniversities: (id: string) => ['events', id, 'universities'] as const,
  eventWorkshops: (id: string) => ['events', id, 'workshops'] as const,
  eventNotes: (id: string) => ['events', id, 'notes'] as const,
  // Staff-facing approval queues. Nested under the event so an event-level
  // invalidation refreshes them, and separate from the student's own `me` keys
  // below — the two read the same tables through different RLS scopes and must
  // not share a cache entry.
  eventWorkshopRequests: (id: string) => ['events', id, 'workshop_requests'] as const,
  eventMeetingRequests: (id: string) => ['events', id, 'meeting_requests'] as const,
  myEventRegistrations: ['me', 'event_registrations'] as const,
  myWorkshopRequests: (eventId: string) => ['me', 'workshop_requests', eventId] as const,
  myMeetingRequests: (eventId: string) => ['me', 'meeting_requests', eventId] as const,
  notifications: ['notifications'] as const,
  // `head: true` count query — separate leaf under the notifications base so
  // invalidating `notifications` refreshes both list and badge.
  notificationsUnread: ['notifications', 'unread'] as const,
  myCounselor: ['me', 'counselor'] as const,
  myApplications: ['me', 'applications'] as const,
  myInterestSelections: ['me', 'student', 'interests'] as const,
  myReferences: ['me', 'student', 'references'] as const,
  myLanguageExams: ['me', 'student', 'language_exams'] as const,
  sponsors: ['sponsors_and_allies'] as const,
  sponsor: (id: string) => ['sponsors_and_allies', id] as const,
};
