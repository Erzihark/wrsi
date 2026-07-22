import { describe, expect, it } from 'vitest';
import { brandPalette, tokens } from './tokens';

/** WCAG 2.1 relative luminance of a 6-digit hex color. */
function luminance(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** WCAG contrast ratio between two 6-digit hex colors (1..21). */
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light! + 0.05) / (dark! + 0.05);
}

const { color } = tokens;

describe('brand palette', () => {
  it('carries the designer-supplied colors unchanged', () => {
    // The five values the designer signed off on. If one of these has to
    // change, it changes here first and everything downstream follows.
    expect(brandPalette).toEqual({
      navy: '#08385B',
      orange: '#FF924D',
      amber: '#FFBD59',
      gray: '#545454',
      white: '#FFFFFF',
    });
  });

  it('maps each brand color to its semantic token', () => {
    expect(color.brand).toBe(brandPalette.navy);
    expect(color.textStrong).toBe(brandPalette.navy);
    expect(color.primary).toBe(brandPalette.orange);
    expect(color.accent).toBe(brandPalette.amber);
    expect(color.warning).toBe(brandPalette.amber);
    expect(color.text).toBe(brandPalette.gray);
    expect(color.surface).toBe(brandPalette.white);
  });
});

describe('token contrast', () => {
  // The pairings every screen relies on. These guard the derived shades: the
  // raw orange and amber are far too light for text, so `primaryDark` and
  // `accentDark` exist purely to clear this bar — and must keep clearing it.
  const bodyText: [string, string, string][] = [
    ['text on page', color.text, color.background],
    ['text on card', color.text, color.surface],
    ['text on alt surface', color.text, color.surfaceAlt],
    ['muted text on card', color.textMuted, color.surface],
    ['muted text on page', color.textMuted, color.background],
    ['muted text on alt surface', color.textMuted, color.surfaceAlt],
    ['headings on card', color.textStrong, color.surface],
    ['headings on page', color.textStrong, color.background],
    ['orange text on card', color.primaryDark, color.surface],
    ['orange text on page', color.primaryDark, color.background],
    ['orange text on its tint', color.primaryDark, color.primarySoft],
    ['amber text on card', color.accentDark, color.surface],
    ['amber text on its tint', color.accentDark, color.warningSoft],
    ['success text on its tint', color.success, color.successSoft],
    ['danger text on its tint', color.danger, color.dangerSoft],
    ['white on navy', color.brandText, color.brand],
    ['navy on its tint', color.brand, color.brandSoft],
  ];

  it.each(bodyText)('%s meets WCAG AA for body text (4.5:1)', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  // The one documented exception. White on the orange CTA fill is ~2.2:1 —
  // below AA even for large text. It is the designer's specified button
  // treatment and only ever carries large semibold labels, so we ship it, but
  // this test pins the shortfall so nobody reuses the pairing for small text
  // believing it's safe. If it ever drops further, that's a real regression.
  it('documents that white-on-orange is a knowing sub-AA exception', () => {
    const ratio = contrast(color.primaryText, color.primary);
    expect(ratio).toBeLessThan(3);
    expect(ratio).toBeGreaterThanOrEqual(2);
  });
});
