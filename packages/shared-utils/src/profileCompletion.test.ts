import { describe, expect, it } from 'vitest';
import { computeProfileCompletion, type ProfileCompletionInput } from './profileCompletion';

const fullProfile: ProfileCompletionInput = {
  first_name: 'Alejandro',
  last_name: 'García',
  birth_date: '2008-03-14',
  phone_number: '+529981000001',
  parent_or_guardian_name: 'Carmen García',
  average_grade: 91.5,
  cefr_level: 'B2',
  highest_education_level_id: 'uuid-level',
  desired_intake_term: 'fall',
  desired_intake_year: 2027,
  expected_graduation_year: 2026,
  budget: 15000,
  budget_currency_id: 'uuid-usd',
  financial_plan_id: 'uuid-plan',
  photo_url: 'https://example.com/a.jpg',
};

describe('computeProfileCompletion', () => {
  it('scores a fully filled profile 6/6 = 100%', () => {
    const result = computeProfileCompletion(fullProfile);
    expect(result).toMatchObject({ completed: 6, total: 6, percent: 100 });
    expect(result.sections.every((s) => s.complete)).toBe(true);
  });

  it('scores a null/absent profile 0/6', () => {
    expect(computeProfileCompletion(null)).toMatchObject({ completed: 0, total: 6, percent: 0 });
    expect(computeProfileCompletion(undefined).completed).toBe(0);
  });

  it('a section is incomplete when any of its fields is missing or blank', () => {
    const result = computeProfileCompletion({
      ...fullProfile,
      birth_date: null, // knocks out 'personal' (other personal fields still set)
      parent_or_guardian_name: '   ', // blank string knocks out 'guardian'
    });
    expect(result.completed).toBe(4);
    expect(result.percent).toBe(67);
    expect(result.sections.find((s) => s.key === 'personal')?.complete).toBe(false);
    expect(result.sections.find((s) => s.key === 'guardian')?.complete).toBe(false);
    expect(result.sections.find((s) => s.key === 'academic')?.complete).toBe(true);
  });

  it('treats numeric 0 as filled (a zero budget is still an answer)', () => {
    const result = computeProfileCompletion({ ...fullProfile, budget: 0 });
    expect(result.sections.find((s) => s.key === 'financial')?.complete).toBe(true);
  });

  it('photo section tracks photo_url alone', () => {
    const result = computeProfileCompletion({ ...fullProfile, photo_url: null });
    expect(result.completed).toBe(5);
    expect(result.sections.find((s) => s.key === 'photo')?.complete).toBe(false);
  });
});
