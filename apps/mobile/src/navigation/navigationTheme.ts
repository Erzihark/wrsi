import { DefaultTheme, type Theme } from '@react-navigation/native';
import { tokens } from '@wrsi/ui';

/**
 * React Navigation's own theme, derived from the design tokens.
 *
 * Without this, every chrome React Navigation draws itself — native-stack
 * header background and title, the iOS back-button tint (which defaults to the
 * system blue `#007AFF`), the screen background behind a transition — comes
 * from React Navigation's built-in palette and ignores the brand entirely.
 * Feeding it the tokens keeps headers and navigation inside the same single
 * source of truth as the rest of the app.
 */
export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    /** Tints the back button/chevron and other nav accents — "navegación" is navy. */
    primary: tokens.color.brand,
    background: tokens.color.background,
    /** Header + tab bar fill. */
    card: tokens.color.surface,
    /** Header titles. */
    text: tokens.color.textStrong,
    border: tokens.color.border,
    /** The tab-bar unread dot. */
    notification: tokens.color.primary,
  },
};
