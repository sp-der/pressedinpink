
"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import {
  getRememberLogin,
  setRememberLogin,
} from "@/lib/authStorage";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const {
    isAdmin,
    isAnonymous,
  } = useAuth();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [rememberMe, setRememberMe] =
    useState(true);
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    setRememberMe(
      getRememberLogin(),
    );
  }, []);

  const submitLogin =
    async (
      event: React.FormEvent,
    ) => {
      event.preventDefault();
      setSubmitting(true);
      setErrorMessage("");

      try {
        setRememberLogin(
          rememberMe,
        );

        if (isAnonymous) {
          const {
            error: signOutError,
          } =
            await supabase.auth
              .signOut();

          if (signOutError) {
            throw signOutError;
          }
        }

        const {
          data,
          error,
        } =
          await supabase.auth
            .signInWithPassword({
              email:
                email.trim(),
              password,
            });

        if (error) {
          throw error;
        }

        if (!data.user) {
          throw new Error(
            "Admin user was not returned.",
          );
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq(
            "id",
            data.user.id,
          )
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        if (
          profile?.role !== "admin"
        ) {
          await supabase.auth
            .signOut();

          throw new Error(
            "This account does not have administrator access.",
          );
        }

        window.location.assign(
          "/admin/orders",
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Admin sign in failed.",
        );
        setSubmitting(false);
      }
    };

  if (isAdmin) {
    return (
      <AuthPageShell
        eyebrow="Pressed In Pink Admin"
        title="Admin Session Active"
        description="You are already signed in as an administrator."
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          <a
            href="/admin/orders"
            className="inline-block rounded-full bg-red-600 px-7 py-3 font-black transition hover:bg-red-500"
          >
            Open Orders Dashboard
          </a>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Pressed In Pink Admin"
      title="Admin Login"
      description="Only accounts marked as administrators can open the order dashboard."
    >
      <form
        onSubmit={submitLogin}
        className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        <label className="block">
          <span className="text-sm font-bold">
            Admin email
          </span>

          <input
            required
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500"
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-bold">
            Password
          </span>

          <input
            required
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value,
              )
            }
            className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500"
          />
        </label>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) =>
              setRememberMe(
                event.target.checked,
              )
            }
            className="h-4 w-4 accent-red-600"
          />

          <span className="text-sm font-bold text-white/85">
            Keep me signed in on this device
          </span>
        </label>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-500 bg-red-500/15 p-4 text-sm font-bold text-red-100">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-full bg-red-600 px-6 py-3 font-black text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {submitting
            ? "Signing In…"
            : "Open Admin Dashboard"}
        </button>
      </form>
    </AuthPageShell>
  );
}
