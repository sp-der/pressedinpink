
"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const {
    user,
    isAnonymous,
    loading,
  } = useAuth();

  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [nextPath, setNextPath] =
    useState("/account");
  const [confirmed, setConfirmed] =
    useState(false);
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    const requestedNext =
      params.get("next");

    if (
      requestedNext?.startsWith("/") &&
      !requestedNext.startsWith("//")
    ) {
      setNextPath(requestedNext);
    }

    setConfirmed(
      params.get("confirmed") === "1",
    );
  }, []);

  const submitLogin =
    async (
      event: React.FormEvent,
    ) => {
      event.preventDefault();
      setErrorMessage("");
      setSubmitting(true);

      try {
        if (isAnonymous) {
          const approved =
            window.confirm(
              "Signing in will replace this guest session. Continue?",
            );

          if (!approved) {
            setSubmitting(false);
            return;
          }

          const {
            error: signOutError,
          } =
            await supabase.auth
              .signOut();

          if (signOutError) {
            throw signOutError;
          }
        }

        const { error } =
          await supabase.auth
            .signInWithPassword({
              email:
                email.trim(),
              password,
            });

        if (error) {
          throw error;
        }

        window.location.assign(
          nextPath,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Sign in failed.",
        );
        setSubmitting(false);
      }
    };

  if (
    !loading &&
    user &&
    !isAnonymous
  ) {
    return (
      <AuthPageShell
        eyebrow="Customer Account"
        title="Already Signed In"
        description={`You are signed in as ${user.email ?? "a customer"}.`}
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          <a
            href="/account"
            className="inline-block rounded-full bg-red-600 px-7 py-3 font-black text-white transition hover:bg-red-500"
          >
            View My Orders
          </a>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Customer Account"
      title="Sign In"
      description="Access saved orders and continue account checkout."
    >
      <form
        onSubmit={submitLogin}
        className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        {confirmed && (
          <div className="mb-5 rounded-2xl border border-green-600 bg-green-600/15 p-4 text-sm font-bold text-green-100">
            Email confirmed. You can sign
            in now.
          </div>
        )}

        <label className="block">
          <span className="text-sm font-bold">
            Email
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

        {errorMessage && (
          <div
            role="alert"
            className="mt-5 rounded-2xl border border-red-500 bg-red-500/15 p-4 text-sm font-bold text-red-100"
          >
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
            : "Sign In"}
        </button>

        <p className="mt-5 text-center text-sm text-white/70">
          Need an account?{" "}
          <a
            href={`/signup?next=${encodeURIComponent(
              nextPath,
            )}`}
            className="font-black text-red-500 underline underline-offset-4"
          >
            Create one
          </a>
        </p>

        <a
          href="/admin/login"
          className="mt-4 block text-center text-xs font-bold text-white/50 transition hover:text-white"
        >
          Admin login
        </a>
      </form>
    </AuthPageShell>
  );
}
