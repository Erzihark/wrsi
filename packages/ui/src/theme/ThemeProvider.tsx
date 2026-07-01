import { createContext, useContext, type ReactNode } from 'react';
import { tokens as defaultTokens, type Tokens } from './tokens';

const ThemeContext = createContext<Tokens>(defaultTokens);

export function ThemeProvider({
  theme = defaultTokens,
  children,
}: {
  theme?: Tokens;
  children: ReactNode;
}) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** Read the active design tokens inside any wrapped component. */
export function useTheme(): Tokens {
  return useContext(ThemeContext);
}
