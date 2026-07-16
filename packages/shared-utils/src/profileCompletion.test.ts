import { describe, expect, it } from 'vitest';
import {
  computeProfileCompletion,
  type ProfileCompletionCounts,
  type ProfileCompletionInput,
} from './profileCompletion';

const fullProfile: ProfileCompletionInput = {
  first_name: 'Alejandro',
  last_name: 'García',
  birth_date: '2008-03-14',
  phone_number: '+529981000001',
  parent_or_guardian_name: 'Carmen García',
  parent_or_guardian_phone: '+529987654321',
  consent_info_use: true,
  country_id: 'uuid-mx',
  highest_education_level_id: 'uuid-level',
  average_grade: 91.5,
  desired_intake_term: 'fall',
  desired_intake_year: 2027,
  cefr_level: 'C1',
  photo_url: 'https://example.com/a.jpg',
  personal_notes: 'Me interesan las ciudades grandes.',
};

/** Child-table rows the `english` and `extras` sections also require. */
const fullCounts: ProfileCompletionCounts = { languageExamCount: 1, referenceCount: 2 };

describe('computeProfileCompletion', () => {
  it('scores a fully filled profile 6/6 = 100%', () => {
    const result = computeProfileCompletion(fullProfile, fullCounts);
    expect(result).toMatchObject({ completed: 6, total: 6, percent: 100 });
    expect(result.sections.every((s) => s.complete)).toBe(true);
  });

  it('scores a null/absent profile 0/6', () => {
    expect(computeProfileCompletion(null)).toMatchObject({ completed: 0, total: 6, percent: 0 });
    expect(computeProfileCompletion(undefined).completed).toBe(0);
  });

  it('a section is incomplete when any of its fields is missing or blank', () => {
    const result = computeProfileCompletion(
      {
        ...fullProfile,
        birth_date: null, // knocks out 'personal'
        parent_or_guardian_phone: '   ', // blank string knocks out 'guardian'
      },
      fullCounts,
    );
    expect(result.completed).toBe(4);
    expect(result.percent).toBe(67);
    expect(result.sections.find((s) => s.key === 'personal')?.complete).toBe(false);
    expect(result.sections.find((s) => s.key === 'guardian')?.complete).toBe(false);
    expect(result.sections.find((s) => s.key === 'academic')?.complete).toBe(true);
  });

  it('treats an unchecked consent (false) as unfilled, not as an answer', () => {
    const result = computeProfileCompletion({ ...fullProfile, consent_info_use: false }, fullCounts);
    expect(result.sections.find((s) => s.key === 'consent')?.complete).toBe(false);
    expect(result.completed).toBe(5);
  });

  it('treats numeric 0 as filled (a zero grade is still an answer)', () => {
    const result = computeProfileCompletion({ ...fullProfile, average_grade: 0 }, fullCounts);
    expect(result.sections.find((s) => s.key === 'academic')?.complete).toBe(true);
  });

  it('english needs a recorded exam on top of the CEFR band', () => {
    const result = computeProfileCompletion(fullProfile, { ...fullCounts, languageExamCount: 0 });
    expect(result.sections.find((s) => s.key === 'english')?.complete).toBe(false);
    expect(result.completed).toBe(5);
  });

  it('extras needs at least one reference on top of photo + notes', () => {
    const result = computeProfileCompletion(fullProfile, { ...fullCounts, referenceCount: 0 });
    expect(result.sections.find((s) => s.key === 'extras')?.complete).toBe(false);
  });

  it('defaults the child-table counts to 0 so an unaware caller never inflates the score', () => {
    const result = computeProfileCompletion(fullProfile);
    expect(result.sections.find((s) => s.key === 'english')?.complete).toBe(false);
    expect(result.sections.find((s) => s.key === 'extras')?.complete).toBe(false);
    expect(result.completed).toBe(4);
  });

  it('a freshly onboarded student has the required sections complete and the new ones pending', () => {
    // Onboarding collects personal + academic but never the guardian phone,
    // consent, exam score, photo, notes, or references.
    const justOnboarded: ProfileCompletionInput = {
      ...fullProfile,
      parent_or_guardian_phone: null,
      consent_info_use: false,
      photo_url: null,
      personal_notes: null,
    };
    const result = computeProfileCompletion(justOnboarded);
    expect(result.sections.find((s) => s.key === 'personal')?.complete).toBe(true);
    expect(result.sections.find((s) => s.key === 'academic')?.complete).toBe(true);
    expect(result.completed).toBe(2);
    expect(result.percent).toBe(33);
  });
});
