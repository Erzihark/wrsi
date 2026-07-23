export interface KeyboardOverlapArgs {
  /** Bottom edge of the scroll viewport, in window coordinates. */
  viewBottom: number;
  /** Full screen height (`Dimensions.get('screen').height`). */
  screenHeight: number;
  /**
   * Keyboard height as Android reports it. `ReactRootView` computes this as
   * `imeInsets.bottom - barInsets.bottom`, i.e. it already excludes the slice
   * of the IME sitting behind the navigation bar.
   */
  keyboardHeight: number;
  /** Bottom safe-area inset — the navigation bar the reported height omits. */
  bottomInset: number;
}

/**
 * How much of a view the software keyboard covers.
 *
 * Split out of `Screen` so the arithmetic can be unit-tested: it can only be
 * exercised for real on an Android device with an IME open.
 *
 * The result is clamped to the space the keyboard actually occupies, so that a
 * device reporting window and screen coordinates differently than expected
 * makes us under-correct rather than yank the layout up past the keyboard.
 */
export function keyboardOverlap({
  viewBottom,
  screenHeight,
  keyboardHeight,
  bottomInset,
}: KeyboardOverlapArgs): number {
  if (keyboardHeight <= 0) return 0;
  const covered = keyboardHeight + bottomInset;
  const keyboardTop = screenHeight - covered;
  return Math.min(Math.max(0, viewBottom - keyboardTop), covered);
}
