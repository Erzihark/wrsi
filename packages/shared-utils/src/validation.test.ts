import { describe, expect, it } from 'vitest';
import {
  formatPhoneAsYouType,
  isEmail,
  isImageUrl,
  isPhoneEmpty,
  isWebUrl,
  makePhoneValue,
  parsePhone,
} from './validation';

describe('isEmail', () => {
  it('accepts well-formed addresses', () => {
    expect(isEmail('a@b.com')).toBe(true);
    expect(isEmail('  first.last@sub.example.mx  ')).toBe(true);
  });
  it('rejects malformed addresses', () => {
    expect(isEmail('a@b')).toBe(false);
    expect(isEmail('a b@c.com')).toBe(false);
    expect(isEmail('nope')).toBe(false);
    expect(isEmail('')).toBe(false);
  });
});

describe('isWebUrl', () => {
  it('accepts http(s) URLs with a dotted host', () => {
    expect(isWebUrl('https://example.com')).toBe(true);
    expect(isWebUrl('http://sub.example.com/path?x=1')).toBe(true);
  });
  it('rejects non-web or malformed URLs', () => {
    expect(isWebUrl('example.com')).toBe(false);
    expect(isWebUrl('ftp://example.com')).toBe(false);
    expect(isWebUrl('https://nodot')).toBe(false);
    expect(isWebUrl('')).toBe(false);
  });
});

describe('isImageUrl', () => {
  it('requires an image extension', () => {
    expect(isImageUrl('https://cdn.example.com/logo.png')).toBe(true);
    expect(isImageUrl('https://cdn.example.com/a/b.JPG')).toBe(true);
    expect(isImageUrl('https://cdn.example.com/logo.webp?v=2')).toBe(true);
    expect(isImageUrl('https://cdn.example.com/logo.svg#icon')).toBe(true);
  });
  it('rejects non-image or non-URL values', () => {
    expect(isImageUrl('https://example.com/logo')).toBe(false);
    expect(isImageUrl('https://example.com/page.html')).toBe(false);
    expect(isImageUrl('logo.png')).toBe(false);
    expect(isImageUrl('')).toBe(false);
  });
});

describe('phone', () => {
  it('validates a real Mexican mobile number', () => {
    const v = makePhoneValue('mx-id', '5512345678', 'MX');
    expect(v.isValid).toBe(true);
    expect(v.e164).toBe('+525512345678');
  });
  it('flags an implausible number as invalid', () => {
    const v = makePhoneValue('mx-id', '123', 'MX');
    expect(v.isValid).toBe(false);
  });
  it('treats an empty number as empty, not invalid input', () => {
    expect(isPhoneEmpty(makePhoneValue('mx-id', '', 'MX'))).toBe(true);
  });
  it('round-trips through E.164 in parsePhone', () => {
    const parsed = parsePhone('+525512345678', (iso) => (iso === 'MX' ? 'mx-id' : null));
    expect(parsed.countryId).toBe('mx-id');
    expect(parsed.isValid).toBe(true);
    expect(parsed.national).toBe('5512345678');
  });
  it('formats as you type', () => {
    expect(formatPhoneAsYouType('5512345678', 'MX')).toContain('55');
    expect(formatPhoneAsYouType('202555', 'US')).toBe('(202) 555');
  });
});
