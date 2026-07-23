# Design & UI Implementation Guide

> **Read this before building or changing any screen.** It is the standing contract for turning
> a designer comp into a shipped screen, and the verification workflow that has to pass before
> you hand a branch off. Written after a welcome-screen build was rejected on device for two
> avoidable faults — the primary button sat ~2.9 screens below the fold, and Spanish labels were
> crushed into 30%-wide columns at 12px. Both were findable in 30 seconds with the workflow in
> §4. Neither was found, because nobody looked.
>
> Companion docs: [`TESTING.md`](TESTING.md) (test layers), [`API.md`](API.md) (data contract),
> [`PROGRESS.md`](PROGRESS.md) (current status).

---

## 1. The non-negotiables

### 1.1 The primary action must be reachable without scrolling

Every screen has one action it exists for — log in, submit, continue, pay. That control must be
inside the viewport on the **smallest supported device (360×640)** with no scrolling, always.

A comp drawn on a tall canvas will happily place the CTA after four marketing sections. On a
phone that is a bug, not a faithful implementation. When content genuinely needs to scroll past
one screen, pin the action in a **sticky bar outside the ScrollView**:

```tsx
<Screen style={{ padding: 0, gap: 0 }}>   {/* Screen's own padding/gap would fight the layout */}
  <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
    …
  </ScrollView>
  <View style={{ borderTopWidth: 1, borderTopColor: t.color.border,
                 backgroundColor: t.color.surface, paddingHorizontal: 16, paddingTop: 12,
                 paddingBottom: Math.max(insets.bottom, 12) }}>
    <Button title={t('…')} onPress={…} />
  </View>
</Screen>
```

`<Screen scroll>` cannot host a sticky footer — it *is* the ScrollView. Use the pattern above.

Budget: a two-button sticky bar costs ~127px (~157px at 130% font scale). That is a fifth of a
640px screen and it is worth it. If it feels too heavy, cut a button — not the pinning.

### 1.2 Type floors

The scale lives in `packages/ui/src/theme/tokens.ts`: `xs:12 · sm:14 · md:16 · lg:20 · xl:28`.

| Role | Minimum | Notes |
| --- | --- | --- |
| Body copy, descriptions, any full sentence | **16** (`md`) | The default `<Text>` size. Don't go below it for prose. |
| Labels, secondary/supporting copy, list metadata | **14** (`sm`) | |
| Legal, footers, timestamps, badge text | **12** (`xs`) | The floor. Nothing meaningful may live here. |

**12px is not a layout escape hatch.** If text only fits at 12px, the *layout* is wrong — the
column is too narrow. Fix the layout (§1.4), don't shrink the type.

### 1.3 Never truncate meaningful text

Do not put `numberOfLines` on anything a user needs to read: nav labels, section headings, card
titles, descriptions. It clips silently, and it clips *hardest* for users who have scaled their
system font up — exactly the people who can least afford it.

Text must **reflow**, not clip. `numberOfLines` is acceptable only where overflow is genuinely
unbounded and the full value is reachable elsewhere (e.g. a 2-line preview of a free-text note
that opens in full on tap). Everything must survive 130% font scale with no horizontal overflow —
§4 measures this.

### 1.4 Spanish is ~20–25% longer than English

Spanish is the **default locale**. Design to the Spanish string, always — check `es.ts`, not
`en.ts`. `"Personalized follow-up"` (22 chars) is `"Seguimiento personalizado"` (25); a UI that
fits English and not Spanish is broken for essentially every user.

Practical consequence: **full sentences need full width.** A row of 3–5 icon-and-label columns
gives each label ~30% of 328px ≈ 98px, which fits about one short word. Standard fixes:

| Comp shows | Build instead |
| --- | --- |
| 4+ items across with labels | 2×N grid, or full-width rows |
| 3–5 step "process" strip | Vertical list of full-width rows (icon chip + label) |
| Multi-column contact/link cards | Stacked full-width rows |
| Short numeric stats (`300+`) with 1–2 word labels | 2×2 grid is fine |

### 1.5 Colors come from semantic tokens only

Never write a hex in a screen. Read `useTheme()` and use the semantic token that describes the
*role* (`color.primary` for CTAs, `color.brand` for chrome, `color.textMuted` for de-emphasis).
`tokens.test.ts` pins every foreground/background pairing at WCAG AA 4.5:1, so the palette can be
re-skinned from one file and contrast regressions fail `yarn test`.

Two traps: the raw orange (`#FF924D`, 2.4:1 on white) and amber (`#FFBD59`, 1.7:1) are **fill
colors only**. For colored text or icons use `primaryDark` / `accentDark`.

### 1.6 iOS + Android parity

Full rules in [`CLAUDE.md`](../CLAUDE.md). The ones that bite in UI work:

- **Glyphs with a Unicode emoji variant** (flags, ♥ U+2665, ℹ U+2139) render as color emoji on
  Android and ignore your `color`. Use the SVG icons in `packages/ui/src/components/icons.tsx`.
  Text-presentation-only symbols (✓ ✕ ▾) are safe.
- **Shadows**: pair iOS `shadow*` with Android `elevation`, or use a `borderTopWidth`/
  `borderColor` hairline instead — a border behaves identically on both and is usually enough.
- **Nested `<Text>`**: Android sizes the line box from the *parent*. A 16px parent wrapping 42px
  children clips on Android and looks fine on iOS. Give the parent the same `fontSize`/
  `lineHeight` as its largest child.

### 1.7 Safe areas are yours when the header is hidden

`headerShown: false` means you own `insets.top`. Sticky footers own `insets.bottom` (the home
indicator). Use `useSafeAreaInsets()` from `react-native-safe-area-context`:

```tsx
paddingTop: insets.top + t.spacing.lg
paddingBottom: Math.max(insets.bottom, t.spacing.md)   // falls back to normal padding on Android
```

---

## 2. Adapting a designer comp

The comps are drawn on a tall desktop-ish canvas. Reproducing one literally is usually wrong.
Adapt, then **write down every departure** in the PR body and `PROGRESS.md` so the designer can
accept or reject each one deliberately. The recurring transforms are in §1.4's table, plus:

- **Inline CTAs → sticky bar** (§1.1).
- **Hero photography** — if there's no asset in the repo, build the text lockup and say so;
  don't invent or scrape one, and leave the slot ready.
- **Dead links** — if a "Contact us" has no destination in config, render it as plain text and
  flag it as blocking. A link-styled element that does nothing is worse than no link.

---

## 3. Definition of done

A screen is not done until all of these are true:

- [ ] `yarn typecheck` and `yarn test` pass.
- [ ] The verification run in §4 passes at 360×640 (primary action visible, zero overflow at
      100% **and** 130% font scale).
- [ ] Every user-visible string comes from `t()`, with keys added to **both** `en.ts` and `es.ts`.
- [ ] Interactive elements have a `testID` (Maestro flows key off these, not i18n'd text).
- [ ] Every departure from the comp is written down in `PROGRESS.md` / the PR body.
- [ ] iOS **and** Android checked — or you state plainly which you couldn't run. §4.4 lists what
      the web preview does *not* catch.

---

## 4. How to verify a screen

### 4.1 Start the preview

```bash
yarn workspace @wrsi/mobile web --port 8083
```

Agents with the Browser pane: `preview_start` with `{"name": "mobile-web"}` — the config is
committed at `.claude/launch.json`. First load takes a minute or two while Metro bundles; it
returns HTTP 200 before the bundle is ready, so wait for the page to actually render.

This needs no Docker and no emulator. Screens behind auth still render — the auth stack shows
first, and the local Supabase stack (`yarn supabase start`) is only needed for real data.

### 4.2 Set a phone viewport

Verify at **360×640** first. It is the smallest realistic Android and it is where layouts break.
If it passes there it will pass on 375×667 (iPhone SE) and 390×844.

### 4.3 Measure — don't eyeball

The Browser pane's screenshots downscale unpredictably, so **do not judge sizes from a
screenshot**. `read_page` and `getBoundingClientRect()` are exact. `testID` is rendered as
`data-testid` on web, which is what makes this work.

**Is the primary action above the fold?**

```js
const b = document.querySelector('[data-testid="welcome-login"]').getBoundingClientRect();
JSON.stringify({
  y: Math.round(b.y),
  visibleWithoutScrolling: b.top >= 0 && b.bottom <= innerHeight,
  pageItselfScrolls: document.documentElement.scrollHeight > innerHeight + 2,
});
```

Required: `visibleWithoutScrolling: true` and `pageItselfScrolls: false` (a sticky bar that
scrolls away is not sticky).

**Does anything overflow or clip — including at 130% font scale?**

```js
(function () {
  const scan = () => {
    const bad = [];
    document.querySelectorAll('[data-testid="SCREEN_ID"] *').forEach((el) => {
      if (!el.children.length && el.textContent.trim()) {
        if (el.scrollWidth > el.clientWidth + 1) bad.push(el.textContent.trim().slice(0, 45));
        if (getComputedStyle(el).webkitLineClamp !== 'none')
          bad.push('CLAMPED: ' + el.textContent.trim().slice(0, 45));
      }
    });
    return bad;
  };
  const at100 = scan();
  document.querySelectorAll('[data-testid="SCREEN_ID"] *').forEach((el) => {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs) el.style.fontSize = fs * 1.3 + 'px';
  });
  const b = document.querySelector('[data-testid="PRIMARY_CTA"]').getBoundingClientRect();
  return JSON.stringify({
    at100,
    at130: scan(),
    ctaStillVisibleAt130: b.top >= 0 && b.bottom <= innerHeight,
  });
})();
```

Required: both arrays empty, `ctaStillVisibleAt130: true`. Reload to undo the font bump.

For reference, the welcome screen passes with: CTA at y=526 of 640, page doesn't scroll, no
overflow at either scale, CTA still visible at 130%.

### 4.4 What the web preview does *not* catch

Web is a fast structural check, not a device pass. It cannot tell you about native shadow vs
`elevation`, real safe-area insets (web reports 0), keyboard avoidance, haptics, the Android
emoji-glyph trap (§1.6), actual platform fonts, or performance. **Anything in those categories
still needs a real iOS and Android run** — and if you couldn't do one, say so explicitly rather
than implying the screen is verified.
