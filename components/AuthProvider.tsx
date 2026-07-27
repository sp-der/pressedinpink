
"use client";

import type {
  Session,
  User,
} from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/auth";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAnonymous: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextValue | null>(
    null,
  );

async function fetchProfile(
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, role, created_at, updated_at",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "Could not load profile.",
      error,
    );
    return null;
  }

  return data as Profile | null;
}

export function AuthProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [session, setSession] =
    useState<Session | null>(null);
  const [user, setUser] =
    useState<User | null>(null);
  const [profile, setProfile] =
    useState<Profile | null>(null);
  const [loading, setLoading] =
    useState(true);

  const applySession = useCallback(
    async (
      nextSession: Session | null,
    ) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const nextProfile =
        await fetchProfile(
          nextSession.user.id,
        );

      setProfile(nextProfile);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    let active = true;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          console.error(
            "Could not load auth session.",
            error,
          );
        }

        return applySession(
          data.session ?? null,
        );
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) {
          return;
        }

        setLoading(true);

        window.setTimeout(() => {
          if (active) {
            void applySession(
              nextSession,
            );
          }
        }, 0);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const refreshProfile =
    useCallback(async () => {
      if (!user) {
        setProfile(null);
        return;
      }

      const nextProfile =
        await fetchProfile(user.id);

      setProfile(nextProfile);
    }, [user]);

  const signOut =
    useCallback(async () => {
      setLoading(true);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        setLoading(false);
        throw error;
      }

      setSession(null);
      setUser(null);
      setProfile(null);
      setLoading(false);
    }, []);

  const value =
    useMemo<AuthContextValue>(
      () => ({
        session,
        user,
        profile,
        loading,
        isAnonymous:
          user?.is_anonymous === true,
        isAdmin:
          profile?.role === "admin",
        refreshProfile,
        signOut,
      }),
      [
        session,
        user,
        profile,
        loading,
        refreshProfile,
        signOut,
      ],
    );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider.",
    );
  }

  return context;
}
