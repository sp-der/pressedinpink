
"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const {
    user,
    isAnonymous,
    loading,
  } = useAuth();

  const [fullName, setFullName] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [password, setPassword] =
    useState("");
  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");
  const [nextPath, setNextPath] =
    useState("/account");
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [successMessage, setSuccessMessage] =
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
  }, []);

  const submitSignup =
    async (
      event: React.FormEvent,
    ) => {
      event.preventDefault();
      setErrorMessage("");
      setSuccessMessage("");

      if (
        fullName.trim().length < 2
      ) {
        setErrorMessage(
          "Please enter your full name.",
        );
        return;
      }

      if (password.length < 8) {
        setErrorMessage(
          "Use a password with at least 8 characters.",
        );
        return;
      }

      if (
        password !== confirmPassword
      ) {
        setErrorMessage(
          "The passwords do not match.",
        );
        return;
      }

      setSubmitting(true);

      try {
        if (isAnonymous) {
          const approved =
            window.confirm(
              "Creating an account will replace this guest session. Continue?",
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

        const { data, error } =
          await supabase.auth.signUp({
            email:
              email.trim(),
            password,
            options: {
              data: {
                full_name:
                  fullName.trim(),
              },
            },
          });

        if (error) {
          throw error;
        }

        if (data.session) {
          window.location.assign(
            nextPath,
          );
          return;
        }

        setSuccessMessage(
          "Account created. Check your email for the confirmation link, then return to sign in.",
        );
        setSubmitting(false);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Account creation failed.",
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
        title="Account Ready"
        description={`You are already signed in as ${user.email ?? "a customer"}.`}
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
      title="Create Account"
      description="Save order history and view updates from any device."
    >
      <form
        onSubmit={submitSignup}
        className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl backdrop-blur-md sm:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-sm font-bold">
              Full name
            </span>

            <input
              required
              value={fullName}
              onChange={(event) =>
                setFullName(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500"
            />
          </label>


          <label className="sm:col-span-2">
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

          <label>
            <span className="text-sm font-bold">
              Password
            </span>

            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500"
            />
          </label>

          <label>
            <span className="text-sm font-bold">
              Confirm password
            </span>

            <input
              required
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500"
            />
          </label>
        </div>

        {errorMessage && (
          <div className="mt-5 rounded-2xl border border-red-500 bg-red-500/15 p-4 text-sm font-bold text-red-100">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-5 rounded-2xl border border-green-500 bg-green-500/15 p-4 text-sm font-bold text-green-100">
            {successMessage}

            <a
              href={`/login?next=${encodeURIComponent(
                nextPath,
              )}`}
              className="mt-4 block underline underline-offset-4"
            >
              Go to sign in
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            Boolean(successMessage)
          }
          className="mt-6 w-full rounded-full bg-red-600 px-6 py-3 font-black text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {submitting
            ? "Creating Account…"
            : "Create Account"}
        </button>

        <p className="mt-5 text-center text-sm text-white/70">
          Already registered?{" "}
          <a
            href={`/login?next=${encodeURIComponent(
              nextPath,
            )}`}
            className="font-black text-red-500 underline underline-offset-4"
          >
            Sign in
          </a>
        </p>
      </form>
    </AuthPageShell>
  );
}
