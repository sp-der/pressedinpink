
"use client";

import {
  useEffect,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";

export default function OrderConfirmationPage() {
  const [orderId, setOrderId] =
    useState("");
  const [orderNumber, setOrderNumber] =
    useState("");
  const [accessToken, setAccessToken] =
    useState("");
  const [emailStatus, setEmailStatus] =
    useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    setOrderId(
      params.get("order") ?? "",
    );
    setOrderNumber(
      params.get("number") ?? "",
    );
    setAccessToken(
      params.get("token") ?? "",
    );
    setEmailStatus(
      params.get("email") ?? "",
    );
  }, []);

  const portalHref =
    orderId && accessToken
      ? `/order-status?order=${encodeURIComponent(
          orderId,
        )}&token=${encodeURIComponent(
          accessToken,
        )}`
      : orderId
        ? `/order-status?order=${encodeURIComponent(
            orderId,
          )}`
        : "/account";

  return (
    <AuthPageShell
      eyebrow="Order Submitted"
      title="Request Received"
      description="Pressed In Pink can now review the requested designs and quantities."
      backHref="/wraps"
      backLabel="Browse More Wraps"
    >
      <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center shadow-xl backdrop-blur-md">
        <div
          className="text-6xl"
          aria-hidden="true"
        >
          ✓
        </div>

        <p className="mt-5 text-sm font-black uppercase tracking-[0.2em] text-red-500">
          Order Number
        </p>

        <h2 className="mt-2 break-all text-3xl font-black sm:text-4xl">
          {orderNumber ||
            "Confirmation pending"}
        </h2>

        <p className="mx-auto mt-5 max-w-xl leading-7 text-white/75">
          Your private order page shows
          status changes, revised
          quantities, unavailable items,
          and messages from Pressed In
          Pink.
        </p>

        {emailStatus === "sent" && (
          <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-green-500/60 bg-green-500/10 p-4 text-sm leading-6 text-green-100">
            Your private order link was
            emailed successfully.
          </div>
        )}

        {emailStatus === "failed" && (
          <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-yellow-500/60 bg-yellow-500/10 p-4 text-sm leading-6 text-yellow-100">
            Your order was saved, but the
            email could not be sent. Use
            the private order-page button
            below and keep the order
            number.
          </div>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href={portalHref}
            className="rounded-full bg-red-600 px-7 py-3 font-black text-white transition hover:bg-red-500"
          >
            View Private Order Page
          </a>

          <a
            href="/wraps"
            className="rounded-full border border-red-600 px-7 py-3 font-black text-white transition hover:bg-red-600"
          >
            Browse Wraps
          </a>
        </div>
      </div>
    </AuthPageShell>
  );
}
