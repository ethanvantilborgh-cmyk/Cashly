"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabase } from "../lib/supabase";
import { seedUserData } from "../lib/db";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta: { firstName: string; lastName: string; company: string }) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null, session: null, loading: true,
  signIn:  async () => ({ error: null }),
  signUp:  async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string, meta: { firstName: string; lastName: string; company: string }) {
    const { data, error } = await getSupabase().auth.signUp({
      email, password,
      options: {
        data: {
          first_name:   meta.firstName,
          last_name:    meta.lastName,
          company_name: meta.company,
        },
      },
    });
    if (error) return { error: error.message };

    // Seed demo data if user is immediately active (email confirmation disabled)
    if (data.user && data.session) {
      await seedUserData(data.user.id, meta.company);
    }

    // No session → Supabase requires email confirmation
    if (data.user && !data.session) {
      return { error: null, needsConfirmation: true };
    }

    return { error: null };
  }

  async function signOut() {
    await getSupabase().auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
