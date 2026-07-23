import { describe, expect, it } from 'vitest';
import { keyboardOverlap } from './keyboardOverlap';

// A 640pt screen with a 48pt navigation bar and a 260pt IME above it, which is
// how Android reports things once the window is edge-to-edge.
const screenHeight = 640;
const bottomInset = 48;
const keyboardHeight = 260;

describe('keyboardOverlap', () => {
  it('is zero while the keyboard is closed', () => {
    expect(
      keyboardOverlap({ viewBottom: 640, screenHeight, keyboardHeight: 0, bottomInset }),
    ).toBe(0);
  });

  it('covers the keyboard and the navigation bar under it for a full-height view', () => {
    // A screen that owns the bottom of the window (onboarding) must move up by
    // the whole IME inset, navigation bar included.
    expect(keyboardOverlap({ viewBottom: 640, screenHeight, keyboardHeight, bottomInset })).toBe(
      308,
    );
  });

  it('subtracts what a tab bar below the view already keeps clear', () => {
    // Scroll view ends 100pt above the screen bottom (bottom tab bar), so only
    // the remaining 208pt of the keyboard actually overlaps it.
    expect(keyboardOverlap({ viewBottom: 540, screenHeight, keyboardHeight, bottomInset })).toBe(
      208,
    );
  });

  it('is zero when the view ends above the keyboard', () => {
    expect(keyboardOverlap({ viewBottom: 300, screenHeight, keyboardHeight, bottomInset })).toBe(0);
  });

  it('never shifts further than the keyboard occupies', () => {
    // Defensive: a view measured as taller than the screen must not drag the
    // layout up past the top of the keyboard.
    expect(keyboardOverlap({ viewBottom: 2000, screenHeight, keyboardHeight, bottomInset })).toBe(
      308,
    );
  });
});
