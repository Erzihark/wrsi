import { describe, expect, it } from 'vitest';
import { waChatUrl } from './whatsapp';

describe('waChatUrl', () => {
  it('builds a digits-only wa.me link from an E.164 number', () => {
    expect(waChatUrl('+52 55 1111 1111')).toBe('https://wa.me/525511111111');
  });

  it('parses national numbers against the MX default country', () => {
    expect(waChatUrl('998 100 0001')).toBe('https://wa.me/529981000001');
  });

  it('honors an explicit default country', () => {
    expect(waChatUrl('212 555 0123', 'US')).toBe('https://wa.me/12125550123');
  });

  it('returns null for missing, blank, or invalid numbers', () => {
    expect(waChatUrl(null)).toBeNull();
    expect(waChatUrl(undefined)).toBeNull();
    expect(waChatUrl('   ')).toBeNull();
    expect(waChatUrl('not a phone')).toBeNull();
    expect(waChatUrl('123')).toBeNull();
  });
});
