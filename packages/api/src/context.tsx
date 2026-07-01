import { createContext, useContext, type ReactNode } from 'react';
import type { WrsiClient } from './client';

const SupabaseContext = createContext<WrsiClient | null>(null);

export function SupabaseProvider({
  client,
  children,
}: {
  client: WrsiClient;
  children: ReactNode;
}) {
  return (
    <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>
  );
}

/** Access the app-wide Supabase client. Must be under a SupabaseProvider. */
export function useSupabase(): WrsiClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error('useSupabase must be used within a <SupabaseProvider>');
  }
  return client;
}
