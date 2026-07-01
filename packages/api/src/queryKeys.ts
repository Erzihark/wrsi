/** Centralized TanStack Query keys so caches invalidate consistently. */
export const queryKeys = {
  session: ['session'] as const,
  myProfile: ['me', 'profile'] as const,
  myStudent: ['me', 'student'] as const,
  universities: (filters?: Record<string, unknown>) =>
    ['universities', filters ?? {}] as const,
  university: (id: string) => ['universities', id] as const,
  student: (id: string) => ['students', id] as const,
  studentDocuments: (userId: string) => ['documents', userId] as const,
  events: ['events'] as const,
  notifications: ['notifications'] as const,
};
