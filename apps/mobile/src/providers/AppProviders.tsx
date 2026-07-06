import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseProvider } from "@wrsi/api";
import { ThemeProvider } from "@wrsi/ui";
import { I18nextProvider } from "react-i18next";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getLocales } from "expo-localization";
import i18n, { initI18n } from "@wrsi/i18n";
import { supabase } from "../lib/supabase";
import { AuthProvider } from "../auth/AuthContext";

const queryClient = new QueryClient();
initI18n(getLocales()[0]?.languageCode ?? "es");

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <SupabaseProvider client={supabase}>
          <I18nextProvider i18n={i18n}>
            <ThemeProvider>
              <AuthProvider>{children}</AuthProvider>
            </ThemeProvider>
          </I18nextProvider>
        </SupabaseProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
