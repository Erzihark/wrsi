import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { useSupabase } from '@wrsi/api';
import type { AppRole } from '@wrsi/shared-types';

type Experience = 'admin' | 'counselor' | 'student';

const ADMIN_ROLES: AppRole[] = ['super_admin', 'admin'];

interface AuthState {
  session: Session | null;
  roles: AppRole[];
  experience: Experience | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Track the auth session.
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setRoles([]);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  // Resolve the signed-in user's roles (RLS lets a user read their own).
  useEffect(() => {
    if (!session) return;
    let active = true;
    void (async () => {
      const { data } = await supabase.from('user_roles').select('roles(name)');
      if (!active) return;
      const names = (data ?? [])
        .map((row) => (row as { roles: { name: string } | null }).roles?.name)
        .filter((name): name is AppRole => Boolean(name));
      setRoles(names);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [session, supabase]);

  const value = useMemo<AuthState>(() => {
    const experience: Experience | null = session
      ? roles.some((role) => ADMIN_ROLES.includes(role))
        ? 'admin'
        : roles.includes('counselor')
          ? 'counselor'
          : 'student'
      : null;
    return {
      session,
      roles,
      experience,
      loading,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    };
  }, [session, roles, loading, supabase]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an <AuthProvider>');
  return ctx;
}
