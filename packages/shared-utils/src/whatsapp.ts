import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';

/**
 * Build a WhatsApp chat deep link (`https://wa.me/{digits}`) from a stored
 * phone number. wa.me requires digits-only E.164 (no `+`, spaces, or dashes).
 *
 * `counselors.phone` is free text, so the number is validated with
 * libphonenumber first; numbers stored without a `+` country code are parsed
 * against `defaultCountry` (MX — the product's home market). Returns null when
 * the number can't be parsed as valid, so callers hide the CTA instead of
 * opening a dead chat.
 */
export function waChatUrl(
  phone: string | null | undefined,
  defaultCountry: CountryCode = 'MX',
): string | null {
  if (!phone || phone.trim() === '') return null;
  const parsed = parsePhoneNumberFromString(phone.trim(), { defaultCountry });
  if (!parsed || !parsed.isValid()) return null;
  return `https://wa.me/${parsed.number.replace('+', '')}`;
}
