import { useEffect, useRef, useState, type RefObject } from 'react';
import {
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  View,
  type KeyboardEvent,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { keyboardOverlap } from './keyboardOverlap';

export interface ScreenProps extends ViewProps {
  scroll?: boolean;
  /**
   * Pad the bottom by the safe-area inset, so content clears the Android
   * navigation bar / gesture pill and the iOS home indicator.
   *
   * Opt-in rather than automatic: screens inside the student bottom-tab
   * navigator sit above a tab bar that already consumes that inset, and would
   * end up double-padded. Turn it on for screens that own the bottom of the
   * window themselves — onboarding, and anything else outside the tabs whose
   * last element is interactive.
   */
  safeBottom?: boolean;
}

/**
 * How much of `ref`'s box the software keyboard covers, on Android only.
 *
 * The app runs edge-to-edge (`edgeToEdgeEnabled=true` in gradle.properties),
 * which makes the window span the whole screen — so the manifest's
 * `android:windowSoftInputMode="adjustResize"` no longer shrinks it when the
 * IME opens, and fields near the bottom of a long form sit behind the keyboard.
 * RN's own `KeyboardAvoidingView` doesn't rescue this: it derives the overlap
 * from the event's `screenY`, which under edge-to-edge is always the bottom of
 * the screen, so it computes an offset of zero.
 *
 * `endCoordinates.height` *is* accurate — `ReactRootView` reads it straight
 * from `WindowInsets.Type.ime()` — so we measure where the scroll view actually
 * ends and shrink it by however much the keyboard covers. Shrinking (rather
 * than padding the content) is deliberate: it restores what adjustResize used
 * to do, because Android's `ScrollView.onSizeChanged` scrolls the focused child
 * back into view when the viewport gets shorter.
 *
 * iOS needs none of this — `automaticallyAdjustKeyboardInsets` hands the
 * problem to UIKit, which insets the scroll view *and* scrolls the first
 * responder into view.
 */
function useAndroidKeyboardOverlap(ref: RefObject<View | null>, bottomInset: number): number {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onShow = (event: KeyboardEvent) => {
      const node = ref.current;
      if (!node) return;
      const screenHeight = Dimensions.get('screen').height;
      const keyboardHeight = event.endCoordinates.height;
      node.measureInWindow((_x, y, _width, height) => {
        setOverlap(
          keyboardOverlap({ viewBottom: y + height, screenHeight, keyboardHeight, bottomInset }),
        );
      });
    };

    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', onShow),
      Keyboard.addListener('keyboardDidHide', () => setOverlap(0)),
    ];
    return () => subscriptions.forEach((s) => s.remove());
  }, [ref, bottomInset]);

  return overlap;
}

/** Full-bleed screen container with themed background + padding. */
export function Screen({
  scroll = false,
  safeBottom = false,
  style,
  children,
  ...rest
}: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // The outer box is never resized, so measuring it stays stable while the
  // keyboard is up and the scroll view inside it is shrunk.
  const outerRef = useRef<View | null>(null);
  // Always the real inset, `safeBottom` or not: the navigation bar sits under
  // the keyboard either way, and the reported keyboard height excludes it.
  const keyboardShift = useAndroidKeyboardOverlap(outerRef, insets.bottom);

  const padding = {
    padding: t.spacing.lg,
    gap: t.spacing.md,
    // `Math.max` keeps the normal padding on devices with no bottom inset.
    ...(safeBottom ? { paddingBottom: Math.max(insets.bottom, t.spacing.lg) } : null),
  };

  if (scroll) {
    return (
      <View
        ref={outerRef}
        // Android collapses ref-less-looking wrapper views; keep it measurable.
        collapsable={false}
        style={{ flex: 1, backgroundColor: t.color.background }}
      >
        <ScrollView
          style={{ flex: 1, marginBottom: keyboardShift }}
          contentContainerStyle={[padding, style]}
          keyboardShouldPersistTaps="handled"
          // iOS needs explicit keyboard insets so focused fields on long forms
          // stay visible; Android is handled by the shrink above.
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          {...rest}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[{ flex: 1, backgroundColor: t.color.background }, padding, style]} {...rest}>
      {children}
    </View>
  );
}
