import { describe, expect, it } from 'vitest';
import { queryKeys } from './queryKeys';

describe('queryKeys', () => {
  it('exposes stable static keys', () => {
    expect(queryKeys.session).toEqual(['session']);
    expect(queryKeys.myProfile).toEqual(['me', 'profile']);
    expect(queryKeys.myStudent).toEqual(['me', 'student']);
    expect(queryKeys.universityInterests).toEqual(['university_interests']);
    expect(queryKeys.events).toEqual(['events']);
    expect(queryKeys.notifications).toEqual(['notifications']);
  });

  it('defaults the universities filter to an empty object', () => {
    expect(queryKeys.universities()).toEqual(['universities', {}]);
    expect(queryKeys.universities({ search: 'lorem' })).toEqual([
      'universities',
      { search: 'lorem' },
    ]);
  });

  it('embeds ids in parameterized keys', () => {
    expect(queryKeys.university('u1')).toEqual(['universities', 'u1']);
    expect(queryKeys.universityPrograms('u1')).toEqual([
      'universities',
      'u1',
      'programs',
    ]);
    expect(queryKeys.student('s1')).toEqual(['students', 's1']);
    expect(queryKeys.studentStatus('s1')).toEqual(['students', 's1', 'status']);
    expect(queryKeys.studentTasks('s1')).toEqual(['students', 's1', 'tasks']);
    expect(queryKeys.studentDocuments('user1')).toEqual(['documents', 'user1']);
    expect(queryKeys.lookup('students-directory')).toEqual([
      'lookups',
      'students-directory',
    ]);
  });
});
