/**
 * Central design tokens. Everything visual in the app derives from here, so the
 * whole palette can be re-skinned by editing this one file (or by passing a
 * custom theme to <ThemeProvider>) without touching a single screen.
 *
 * ## The brand palette (given by the designer)
 *
 * | Hex       | Role (designer's brief)                                        |
 * | --------- | -------------------------------------------------------------- |
 * | `#08385B` | Color principal — headers, navegación, botones principales, iconos |
 * | `#FF924D` | Botones de acción (CTA), estados importantes y destacados        |
 * | `#FFBD59` | Badges, progreso, logros, avisos positivos y elementos de atención |
 * | `#545454` | Texto principal y secundario                                     |
 * | `#FFFFFF` | Fondos y tarjetas                                                |
 *
 * `brandPalette` below holds those five values verbatim — they are the only
 * "raw" colors in the system. Everything a component reads is a *semantic*
 * token in `tokens.color`, so screens say what a color means ("this is a CTA",
 * "this is muted text") rather than which hex it happens to be today.
 *
 * ## Why there are more than five values
 *
 * The five brand colors can't cover every job on their own, so each one has a
 * small family derived from it, for exactly two reasons:
 *
 * - **Tints** (`*Soft`) — the brand color at ~8% over white, for badge/banner
 *   backgrounds and progress tracks. Using the full-strength color there would
 *   swamp the page.
 * - **Readable shades** (`*Dark` / `*Text`) — `#FF924D` on white is 2.4:1 and
 *   `#FFBD59` is 1.7:1, both far below the 4.5:1 WCAG AA floor for body text.
 *   The `*Dark` shades are the same hue darkened until they pass, and are what
 *   small colored text and colored icons must use. The full-strength color is
 *   for *fills* (button backgrounds, progress arcs, dots), not for small text.
 *   `tokens.test.ts` holds every pairing to 4.5:1, so changing a shade here
 *   fails the unit suite rather than quietly shipping unreadable text.
 *
 * The one knowing exception: white text on the `#FF924D` CTA fill is ~2.2:1.
 * That's the designer's specified button treatment and it only ever appears as
 * large/semibold button labels, so we keep it — but don't reuse that pairing
 * for small text.
 */

/** The designer's five brand colors, verbatim. Prefer the semantic tokens below. */
export const brandPalette = {
  /** Navy — the primary brand color. */
  navy: '#08385B',
  /** Orange — calls to action. */
  orange: '#FF924D',
  /** Amber — badges, progress, achievements, attention. */
  amber: '#FFBD59',
  /** Neutral gray — body copy. */
  gray: '#545454',
  white: '#FFFFFF',
} as const;

export const tokens = {
  color: {
    // ---- Surfaces -------------------------------------------------------
    /** Page background. A barely-there navy-tinted off-white so white cards read as cards. */
    background: '#F6F8FA',
    /** Cards, sheets, modals, headers — the designer's white. */
    surface: brandPalette.white,
    /** Subtly filled areas that sit *inside* a card: inputs, image placeholders, icon chips. */
    surfaceAlt: '#F1F4F7',
    /** Hairline dividers and card outlines. */
    border: '#E3E8ED',

    // ---- Brand navy: headers, navigation, icons, dark surfaces ----------
    brand: brandPalette.navy,
    /** Pressed/active states of navy surfaces. */
    brandDark: '#05283F',
    /** Navy at ~8% — selected nav rows, tinted navy banners. */
    brandSoft: '#E8EEF3',
    /** Foreground on a navy fill. */
    brandText: brandPalette.white,

    // ---- CTA orange: primary buttons, important/highlighted states ------
    primary: brandPalette.orange,
    /** AA-readable orange (5.4:1 on white) — small orange text, orange icons, pressed CTA. */
    primaryDark: '#B04C09',
    /** Orange at ~8% — nudge banners, progress tracks, quick-access tiles. */
    primarySoft: '#FFF1E7',
    /** Foreground on an orange fill (large button labels only — see the note above). */
    primaryText: brandPalette.white,

    // ---- Amber accent: badges, progress, achievements, attention --------
    accent: brandPalette.amber,
    /** AA-readable amber (6.3:1 on white) — amber text and icons. */
    accentDark: '#8A5300',
    /** Amber at ~8% — badge and callout backgrounds. */
    accentSoft: '#FFF6E6',

    // ---- Text -----------------------------------------------------------
    /** Body and secondary copy — the designer's gray (7.6:1 on white). */
    text: brandPalette.gray,
    /** Headings, titles, row labels — navy, per "headers" in the brief (12.3:1). */
    textStrong: brandPalette.navy,
    /** De-emphasized copy: a lighter tint of the same gray, still AA on every surface. */
    textMuted: '#6E6E6E',
    /** Text on navy/dark fills. */
    textOnDark: brandPalette.white,

    // ---- Status ---------------------------------------------------------
    /** All status colors are AA-readable as text; pair each with its `*Soft` as a background. */
    success: '#1A7342',
    successSoft: '#E7F4EC',
    danger: '#C62F2F',
    dangerSoft: '#FDECEC',
    /** Attention/pending. Amber is the fill; `accentDark` is its readable text shade. */
    warning: brandPalette.amber,
    warningSoft: '#FFF6E6',
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 6, md: 10, lg: 16, pill: 999 },
  fontSize: { xs: 12, sm: 14, md: 16, lg: 20, xl: 28 },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export type Tokens = typeof tokens;
