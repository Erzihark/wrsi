# Form validation standard

Every form in the app validates the same way. This is the contract — follow it
for new forms and when touching existing ones.

## The rules

1. **One engine: react-hook-form + zod.** Define a zod schema per form; wire it
   with `zodResolver`. No bespoke `validate()` functions.
2. **Real-time.** Forms run in `mode: 'onTouched'` (or `'onChange'`) so errors
   appear per-field as the user goes, not only on submit.
3. **Submit is gated.** The submit button is `disabled` while
   `!formState.isValid` (and while the mutation is pending). An invalid form
   cannot be submitted.
4. **Errors are i18n keys.** A schema's message is a translation key (e.g.
   `validation.emailInvalid`); the field wrapper resolves it with `t()` at
   render. Add new keys to both `packages/i18n/src/locales/{en,es}.ts`.
5. **Build fields with the bound wrappers.** Use
   `apps/mobile/src/components/form` (`FormInput`, `FormSelect`,
   `FormPhoneField`, …) — they own the `Controller` binding + error translation.

## Shared building blocks (`@wrsi/shared-utils`)

Compose schemas from these instead of re-writing regexes:

| Builder / helper | Use for |
| --- | --- |
| `requiredString()` | required, trimmed text |
| `emailField()` | email addresses |
| `webUrlField(required?)` | web links (`https://…`) |
| `imageUrlField(required?)` | image URLs — must end in `.png/.jpg/.webp/…` |
| `phoneField()` / `phoneFieldOptional()` | phone numbers (see below) |
| `isEmail` / `isWebUrl` / `isImageUrl` | raw predicates (unit-tested) |

## Phone numbers

Phone is a first-class field, not a text box.

- **UI:** `<FormPhoneField>` → `PhoneField` renders a dial-code dropdown (the
  country "extension") plus a number input that formats **as you type** for the
  selected country.
- **Validity:** the number is checked against the country's real numbering rules
  via `libphonenumber-js` — not a digit-count heuristic.
- **State shape:** the field holds a `PhoneValue`
  (`{ countryId, national, e164, isValid }`). `makePhoneValue()` derives
  `e164`/`isValid`; `parsePhone()` rebuilds a `PhoneValue` from a stored E.164
  string in edit mode. Schemas gate on it with `phoneField()` /
  `phoneFieldOptional()`.
- **Persist `e164`** (the composed E.164 string), never the raw national digits.

## Checklist for a new form

- [ ] zod schema composed from the shared builders
- [ ] `useForm({ resolver: zodResolver(schema), mode: 'onTouched' })`
- [ ] fields rendered with the `components/form` wrappers
- [ ] submit `disabled={!formState.isValid || mutation.isPending}`
- [ ] new messages added to `en.ts` **and** `es.ts`
- [ ] new pure helpers unit-tested in `@wrsi/shared-utils`
