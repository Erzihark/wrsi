import { z } from 'zod';
import {
  AsYouType,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

/**
 * Shared validation primitives + zod field builders. These are the single source
 * of truth for how the app validates URLs, image URLs, emails, and phone numbers,
 * so every form (onboarding, admin CRUD, auth) enforces the same rules.
 *
 * Error messages are i18n KEYS — resolve them with `t(message)` at render time
 * (mirrors the onboarding schema convention).
 */

// ---------------------------------------------------------------------------
// i18n message keys
// ---------------------------------------------------------------------------
export const VALIDATION_MSG = {
  required: 'validation.required',
  email: 'validation.emailInvalid',
  url: 'validation.urlInvalid',
  imageUrl: 'validation.imageUrlInvalid',
  phone: 'validation.phoneInvalid',
} as const;

// ---------------------------------------------------------------------------
// Predicates (pure — unit tested)
// ---------------------------------------------------------------------------

// Pragmatic email shape check: something@something.tld, no spaces. Deliverability
// is confirmed by the auth provider, not here — this only catches typos.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

// Require an http(s) URL with a dotted host. We intentionally accept only web
// URLs (no ftp:, mailto:, etc.) since every URL field in the app is a web link.
const WEB_URL_RE = /^https?:\/\/[^\s/$.?#][^\s]*\.[^\s]+$/i;

export function isWebUrl(value: string): boolean {
  return WEB_URL_RE.test(value.trim());
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|avif|heic|heif)$/i;

/**
 * An image URL must be a valid web URL whose path ends in a known image
 * extension (query string / fragment allowed after it, e.g. `?v=2`).
 */
export function isImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!isWebUrl(trimmed)) return false;
  // Strip query + fragment before checking the extension.
  const path = trimmed.split('#')[0]?.split('?')[0] ?? '';
  return IMAGE_EXT_RE.test(path);
}

// ---------------------------------------------------------------------------
// Phone (libphonenumber-js) — country-aware validity + as-you-type formatting
// ---------------------------------------------------------------------------

/**
 * A phone number as held in form state. `countryId` is the FK into
 * `countries` (drives the dial-code dropdown); `national` is the raw digits the
 * user typed; `e164`/`isValid` are derived by {@link makePhoneValue}.
 */
export interface PhoneValue {
  countryId: string | null;
  national: string;
  e164: string | null;
  isValid: boolean;
}

export function emptyPhone(): PhoneValue {
  return { countryId: null, national: '', e164: null, isValid: false };
}

/** True when the user has entered nothing (used to allow optional phones). */
export function isPhoneEmpty(value: PhoneValue): boolean {
  return value.national.replace(/\D/g, '').length === 0;
}

/**
 * Derive `{ e164, isValid }` for a national number entered under `iso2`
 * (ISO 3166-1 alpha-2, e.g. 'MX'). Keeps the raw `national`/`countryId` for the
 * inputs; produces the E.164 string to persist.
 */
export function makePhoneValue(
  countryId: string | null,
  national: string,
  iso2: string | null,
): PhoneValue {
  const base: PhoneValue = { countryId, national, e164: null, isValid: false };
  const digits = national.replace(/\D/g, '');
  if (!iso2 || digits.length === 0) return base;
  const parsed = parsePhoneNumberFromString(national, iso2 as CountryCode);
  if (!parsed) return base;
  return { ...base, e164: parsed.number, isValid: parsed.isValid() };
}

/**
 * Rebuild a {@link PhoneValue} from a stored E.164 string (edit mode). Maps the
 * detected country back to a `countryId` via the caller's iso→id lookup.
 */
export function parsePhone(
  e164: string | null | undefined,
  isoToCountryId: (iso2: string) => string | null,
): PhoneValue {
  if (!e164) return emptyPhone();
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed || !parsed.country) {
    return { countryId: null, national: e164, e164, isValid: false };
  }
  return {
    countryId: isoToCountryId(parsed.country),
    national: parsed.nationalNumber,
    e164: parsed.number,
    isValid: parsed.isValid(),
  };
}

/** Progressive ("as you type") national formatting for display in the input. */
export function formatPhoneAsYouType(national: string, iso2: string | null): string {
  if (!iso2) return national;
  return new AsYouType(iso2 as CountryCode).input(national);
}

// ---------------------------------------------------------------------------
// Reusable zod field builders (compose these in form schemas)
// ---------------------------------------------------------------------------

/** Required, trimmed, non-empty string. */
export function requiredString(message: string = VALIDATION_MSG.required) {
  return z.string().trim().min(1, message);
}

/** Required email. */
export function emailField() {
  return z
    .string()
    .trim()
    .min(1, VALIDATION_MSG.required)
    .refine(isEmail, VALIDATION_MSG.email);
}

/** Web URL. `required = false` treats an empty string as valid (optional field). */
export function webUrlField(required = false) {
  return z
    .string()
    .trim()
    .refine((v) => (v.length === 0 ? !required : isWebUrl(v)), VALIDATION_MSG.url);
}

/** Image URL (must end in an image extension). `required` as in {@link webUrlField}. */
export function imageUrlField(required = false) {
  return z
    .string()
    .trim()
    .refine((v) => (v.length === 0 ? !required : isImageUrl(v)), VALIDATION_MSG.imageUrl);
}

/** Required phone: a country must be picked and the number valid for it. */
export function phoneField() {
  return z.custom<PhoneValue>().superRefine((val, ctx) => {
    if (!val || val.countryId == null || isPhoneEmpty(val)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: VALIDATION_MSG.required });
      return;
    }
    if (!val.isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: VALIDATION_MSG.phone });
    }
  });
}

/** Optional phone: empty is allowed, but a typed number must be valid. */
export function phoneFieldOptional() {
  return z.custom<PhoneValue>().superRefine((val, ctx) => {
    if (!val || isPhoneEmpty(val)) return;
    if (val.countryId == null || !val.isValid) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: VALIDATION_MSG.phone });
    }
  });
}
