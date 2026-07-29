
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import { useCart } from "@/components/CartProvider";
import { supabase } from "@/lib/supabase";
import {
  CONTACT_METHOD_LABELS,
} from "@/types/orders";
import type {
  ContactMethod,
} from "@/types/orders";

type CheckoutMode =
  | "guest"
  | "account";

type SubmittedOrderResult = {
  order_id: string;
  order_number: string;
  access_token: string;
};

const contactPlaceholders:
  Record<ContactMethod, string> = {
    email: "name@example.com",
    phone: "(555) 555-1234",
    instagram: "@username",
    tiktok: "@username",
  };

export default function CheckoutPage() {
  const {
    user,
    profile,
    loading: authLoading,
    isAnonymous,
    refreshProfile,
  } = useAuth();

  const {
    items,
    isReady: cartReady,
    totalDesigns,
    totalQuantity,
    clearCart,
  } = useCart();

  const [mode, setMode] =
    useState<CheckoutMode>("guest");
  const [fullName, setFullName] =
    useState("");
  const [email, setEmail] =
    useState("");
  const [
    contactMethod,
    setContactMethod,
  ] = useState<ContactMethod>("email");
  const [
    contactValue,
    setContactValue,
  ] = useState("");
  const [notes, setNotes] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  const registeredUser =
    Boolean(user && !isAnonymous);

  useEffect(() => {
    if (registeredUser) {
      setMode("account");
    }
  }, [registeredUser]);

  useEffect(() => {
    setFullName((current) =>
      current ||
      profile?.full_name ||
      "",
    );

    setEmail((current) =>
      current ||
      profile?.email ||
      user?.email ||
      "",
    );
  }, [profile, user]);

  useEffect(() => {
    if (contactMethod === "email") {
      setContactValue(email);
    }
  }, [contactMethod, email]);

  const cartPayload = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        displayName:
          item.displayName,
        categorySlug:
          item.categorySlug,
        categoryName:
          item.categoryName,
        imageNumber:
          item.imageNumber,
        sourceFilename:
          item.sourceFilename,
        thumbnailUrl:
          item.thumbnailUrl,
        fullImageUrl:
          item.fullImageUrl,
        quantity:
          item.quantity,
      })),
    [items],
  );

  const validateContact = (): string | null => {
    const value = contactValue.trim();

    if (!value) {
      return `Please enter your ${CONTACT_METHOD_LABELS[
        contactMethod
      ].toLowerCase()} contact.`;
    }

    if (
      contactMethod === "email" &&
      !value.includes("@")
    ) {
      return "Please enter a valid contact email.";
    }

    if (
      contactMethod === "phone" &&
      value.replace(/\D/g, "").length < 7
    ) {
      return "Please enter a valid contact phone number.";
    }

    if (
      (contactMethod === "instagram" ||
        contactMethod === "tiktok") &&
      value.replace(/^@/, "").trim().length < 2
    ) {
      return `Please enter a valid ${CONTACT_METHOD_LABELS[
        contactMethod
      ]} username.`;
    }

    return null;
  };

  const submitOrder =
    async (
      event: React.FormEvent,
    ) => {
      event.preventDefault();
      setErrorMessage("");

      if (items.length === 0) {
        setErrorMessage(
          "Your cart is empty.",
        );
        return;
      }

      if (
        fullName.trim().length < 2
      ) {
        setErrorMessage(
          "Please enter your full name.",
        );
        return;
      }

      if (!email.includes("@")) {
        setErrorMessage(
          "Please enter a valid email address. This email receives the private order link.",
        );
        return;
      }

      const contactError =
        validateContact();

      if (contactError) {
        setErrorMessage(
          contactError,
        );
        return;
      }

      if (
        mode === "account" &&
        !registeredUser
      ) {
        setErrorMessage(
          "Please sign in or create an account before using account checkout.",
        );
        return;
      }

      setSubmitting(true);

      try {
        let checkoutUser = user;

        if (
          mode === "guest" &&
          !checkoutUser
        ) {
          const { data, error } =
            await supabase.auth
              .signInAnonymously();

          if (error) {
            throw error;
          }

          checkoutUser =
            data.user ?? null;
        }

        if (!checkoutUser) {
          throw new Error(
            "A checkout session could not be created.",
          );
        }

        const { data, error } =
          await supabase.rpc(
            "submit_order",
            {
              p_checkout_type:
                mode,
              p_customer_name:
                fullName.trim(),
              p_customer_email:
                email.trim(),
              p_customer_notes:
                notes.trim(),
              p_contact_method:
                contactMethod,
              p_contact_value:
                contactValue.trim(),
              p_items:
                cartPayload,
            },
          );

        if (error) {
          throw error;
        }

        const result =
          Array.isArray(data)
            ? data[0]
            : data;

        const submitted =
          result as
            | SubmittedOrderResult
            | undefined;

        if (
          !submitted?.order_id ||
          !submitted.order_number ||
          !submitted.access_token
        ) {
          throw new Error(
            "The order was submitted, but its private portal information was not returned.",
          );
        }

        if (mode === "account") {
          await supabase
            .from("profiles")
            .update({
              full_name:
                fullName.trim(),
              email:
                email.trim(),
            })
            .eq(
              "id",
              checkoutUser.id,
            );

          await refreshProfile();
        }

        let emailSent = false;

        try {
          const {
            data: emailResult,
            error: emailError,
          } = await supabase.functions.invoke(
            "send-order-link",
            {
              body: {
                orderId: submitted.order_id,
                accessToken: submitted.access_token,
                siteOrigin: window.location.origin,
              },
            },
          );

          if (emailError) {
            console.error(
              "Order email failed.",
              emailError,
            );
          } else {
            emailSent =
              emailResult?.customerSent === true;

            if (
              emailResult?.adminNotified !== true
            ) {
              console.error(
                "PNP order notification email failed.",
                emailResult?.adminError,
              );
            }
          }
        } catch (emailError) {
          console.error(
            "Order email failed.",
            emailError,
          );
        }

        clearCart();

        window.location.assign(
          `/order-confirmation?order=${encodeURIComponent(
            submitted.order_id,
          )}&number=${encodeURIComponent(
            submitted.order_number,
          )}&token=${encodeURIComponent(
            submitted.access_token,
          )}&email=${emailSent ? "sent" : "failed"}`,
        );
      } catch (error) {
        const possibleError =
          error as {
            message?: string;
          };

        setErrorMessage(
          possibleError?.message ||
            "The order could not be submitted.",
        );
        setSubmitting(false);
      }
    };

  if (
    cartReady &&
    items.length === 0
  ) {
    return (
      <AuthPageShell
        eyebrow="Order Request"
        title="Your Cart Is Empty"
        description="Add wrap designs before starting checkout."
        backHref="/wraps"
        backLabel="Browse Wraps"
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          <a
            href="/wraps"
            className="inline-block rounded-full bg-red-600 px-7 py-3 font-black text-white transition hover:bg-red-500"
          >
            Browse Wraps
          </a>
        </div>
      </AuthPageShell>
    );
  }

  if (
    !cartReady ||
    authLoading
  ) {
    return (
      <AuthPageShell
        eyebrow="Order Request"
        title="Preparing Checkout"
        description="Loading your cart and customer session."
        backHref="/cart"
        backLabel="Back to Cart"
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading…
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Order Request"
      title="Checkout"
      description="Submit your wrap request as a guest or save it to a customer account."
      backHref="/cart"
      backLabel="Back to Cart"
      maxWidthClass="max-w-5xl"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          onSubmit={submitOrder}
          className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl backdrop-blur-md sm:p-8"
        >
          {registeredUser ? (
            <div className="rounded-2xl border border-green-700/60 bg-green-700/10 p-4">
              <p className="font-black text-green-100">
                Account Checkout
              </p>

              <p className="mt-1 text-sm text-white/70">
                Signed in as{" "}
                {user?.email}.
                This order will appear in
                your saved history.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setMode("guest")
                }
                className={
                  mode === "guest"
                    ? "rounded-2xl border border-red-600 bg-red-600 px-4 py-4 font-black text-white"
                    : "rounded-2xl border border-white/25 bg-black px-4 py-4 font-black text-white transition hover:border-red-600"
                }
              >
                Guest Checkout
              </button>

              <button
                type="button"
                onClick={() =>
                  setMode("account")
                }
                className={
                  mode === "account"
                    ? "rounded-2xl border border-red-600 bg-red-600 px-4 py-4 font-black text-white"
                    : "rounded-2xl border border-white/25 bg-black px-4 py-4 font-black text-white transition hover:border-red-600"
                }
              >
                Account Checkout
              </button>
            </div>
          )}

          {mode === "account" &&
          !registeredUser ? (
            <div className="mt-6 rounded-2xl border border-red-900 bg-black p-6 text-center">
              <h2 className="text-2xl font-black">
                Sign in or create an account
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/70">
                An account saves orders
                so they can be viewed on
                another device.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a
                  href="/login?next=/checkout"
                  className="rounded-full bg-red-600 px-6 py-3 font-black text-white transition hover:bg-red-500"
                >
                  Sign In
                </a>

                <a
                  href="/signup?next=/checkout"
                  className="rounded-full border border-red-600 px-6 py-3 font-black text-white transition hover:bg-red-600"
                >
                  Create Account
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
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
                    placeholder="Customer name"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold">
                    Email for order link
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
                    placeholder="name@example.com"
                  />

                  <span className="mt-2 block text-xs leading-5 text-white/55">
                    Your private order-status link
                    will be sent here, even when
                    another contact method is
                    preferred.
                  </span>
                </label>

                <label>
                  <span className="text-sm font-bold">
                    Preferred contact
                  </span>

                  <select
                    required
                    value={contactMethod}
                    onChange={(event) => {
                      const nextMethod =
                        event.target
                          .value as ContactMethod;

                      setContactMethod(
                        nextMethod,
                      );

                      if (
                        nextMethod !== "email"
                      ) {
                        setContactValue("");
                      }
                    }}
                    className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500"
                  >
                    <option value="email">
                      Email
                    </option>
                    <option value="phone">
                      Phone
                    </option>
                    <option value="instagram">
                      Instagram
                    </option>
                    <option value="tiktok">
                      TikTok
                    </option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-bold">
                    {CONTACT_METHOD_LABELS[
                      contactMethod
                    ]} contact
                  </span>

                  <input
                    required
                    type={
                      contactMethod === "email"
                        ? "email"
                        : contactMethod === "phone"
                          ? "tel"
                          : "text"
                    }
                    readOnly={
                      contactMethod === "email"
                    }
                    value={contactValue}
                    onChange={(event) =>
                      setContactValue(
                        event.target.value,
                      )
                    }
                    className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500 read-only:bg-white/10 read-only:text-white/70"
                    placeholder={
                      contactPlaceholders[
                        contactMethod
                      ]
                    }
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold">
                    Order notes
                  </span>

                  <textarea
                    value={notes}
                    onChange={(event) =>
                      setNotes(
                        event.target.value,
                      )
                    }
                    rows={5}
                    maxLength={1500}
                    className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none transition focus:border-red-500"
                    placeholder="Optional notes or questions"
                  />
                </label>
              </div>

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
                className="mt-6 w-full rounded-full bg-red-600 px-6 py-4 text-lg font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Submitting Order…"
                  : "Submit Order Request"}
              </button>

              <p className="mt-3 text-center text-xs leading-5 text-white/60">
                This submits a request for
                review. It does not collect
                payment.
              </p>
            </>
          )}
        </form>

        <aside className="h-fit rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl backdrop-blur-md lg:sticky lg:top-6">
          <h2 className="text-2xl font-black">
            Cart Summary
          </h2>

          <div className="mt-5 space-y-3 border-y border-red-950 py-5">
            <div className="flex justify-between gap-4">
              <span className="text-white/70">
                Designs
              </span>
              <strong>
                {totalDesigns}
              </strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-white/70">
                Total wraps
              </span>
              <strong>
                {totalQuantity}
              </strong>
            </div>
          </div>

          <div className="mt-5 max-h-72 space-y-3 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3"
              >
                <span className="text-sm font-bold">
                  {item.displayName}
                </span>

                <span className="rounded-full bg-red-600 px-2 py-1 text-xs font-black">
                  ×{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </AuthPageShell>
  );
}
