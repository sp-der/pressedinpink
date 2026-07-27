
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  getOrderStatusClasses,
  getOrderStatusLabel,
} from "@/types/orders";
import type {
  OrderRecord,
} from "@/types/orders";

export default function OrderStatusPage() {
  const {
    user,
    loading: authLoading,
  } = useAuth();

  const [orderId, setOrderId] =
    useState("");
  const [accessToken, setAccessToken] =
    useState("");
  const [order, setOrder] =
    useState<OrderRecord | null>(null);
  const [loadingOrder, setLoadingOrder] =
    useState(true);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search,
      );

    setOrderId(
      params.get("order") ?? "",
    );
    setAccessToken(
      params.get("token") ?? "",
    );
  }, []);

  const loadOrder =
    useCallback(async () => {
      if (!orderId) {
        setLoadingOrder(false);
        setErrorMessage(
          "This order link is missing its order number.",
        );
        return;
      }

      setLoadingOrder(true);
      setErrorMessage("");

      if (accessToken) {
        const {
          data,
          error,
        } = await supabase.rpc(
          "get_order_by_access_token",
          {
            p_order_id:
              orderId,
            p_access_token:
              accessToken,
          },
        );

        if (error) {
          setErrorMessage(
            error.message,
          );
          setLoadingOrder(false);
          return;
        }

        if (!data) {
          setErrorMessage(
            "This private order link is invalid or no longer available.",
          );
          setLoadingOrder(false);
          return;
        }

        setOrder(
          data as unknown as OrderRecord,
        );
        setLoadingOrder(false);
        return;
      }

      if (!user) {
        setErrorMessage(
          "Sign in to view this order, or use the complete private link from your order email.",
        );
        setLoadingOrder(false);
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("orders")
        .select(
          `
            id,
            order_number,
            customer_id,
            checkout_type,
            customer_name,
            customer_email,
            customer_phone,
            contact_method,
            contact_value,
            customer_notes,
            status,
            customer_approval_status,
            revision_message,
            admin_notes,
            submitted_at,
            updated_at,
            order_items (
              id,
              order_id,
              product_id,
              display_name,
              category_slug,
              category_name,
              image_number,
              source_filename,
              thumbnail_url,
              full_image_url,
              requested_quantity,
              approved_quantity,
              is_available,
              admin_note,
              created_at,
              updated_at
            )
          `,
        )
        .eq("id", orderId)
        .eq(
          "customer_id",
          user.id,
        )
        .maybeSingle();

      if (error) {
        setErrorMessage(
          error.message,
        );
        setLoadingOrder(false);
        return;
      }

      if (!data) {
        setErrorMessage(
          "This order was not found in your account.",
        );
        setLoadingOrder(false);
        return;
      }

      setOrder(
        data as unknown as OrderRecord,
      );
      setLoadingOrder(false);
    }, [
      orderId,
      accessToken,
      user,
    ]);

  useEffect(() => {
    if (
      !orderId ||
      authLoading
    ) {
      return;
    }

    void loadOrder();
  }, [
    orderId,
    authLoading,
    loadOrder,
  ]);

  if (
    authLoading ||
    loadingOrder
  ) {
    return (
      <AuthPageShell
        eyebrow="Private Order Portal"
        title="Loading Your Order"
        description="Retrieving the latest order status and approved quantities."
        backHref="/"
        backLabel="Back Home"
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading…
        </div>
      </AuthPageShell>
    );
  }

  if (!order) {
    return (
      <AuthPageShell
        eyebrow="Private Order Portal"
        title="Order Unavailable"
        description={
          errorMessage ||
          "This order could not be loaded."
        }
        backHref="/"
        backLabel="Back Home"
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          {!user && (
            <a
              href={`/login?next=${encodeURIComponent(
                `/order-status?order=${orderId}${
                  accessToken
                    ? `&token=${accessToken}`
                    : ""
                }`,
              )}`}
              className="inline-block rounded-full bg-red-600 px-7 py-3 font-black transition hover:bg-red-500"
            >
              Sign In
            </a>
          )}
        </div>
      </AuthPageShell>
    );
  }

  const requestedTotal =
    order.order_items.reduce(
      (total, item) =>
        total +
        item.requested_quantity,
      0,
    );

  const approvedTotal =
    order.order_items.reduce(
      (total, item) =>
        total +
        (item.is_available
          ? item.approved_quantity
          : 0),
      0,
    );

  return (
    <AuthPageShell
      eyebrow="Private Order Portal"
      title={order.order_number}
      description="See the latest status, quantity updates, and messages from Pressed In Pink."
      backHref="/wraps"
      backLabel="Browse Wraps"
      maxWidthClass="max-w-6xl"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-900 bg-black/90 p-5">
          <p className="text-sm text-white/60">
            Status
          </p>

          <span
            className={`mt-3 inline-block rounded-full border px-4 py-2 text-sm font-black ${getOrderStatusClasses(
              order.status,
            )}`}
          >
            {getOrderStatusLabel(
              order.status,
            )}
          </span>
        </div>

        <div className="rounded-2xl border border-red-900 bg-black/90 p-5">
          <p className="text-sm text-white/60">
            Requested wraps
          </p>

          <p className="mt-2 text-3xl font-black">
            {requestedTotal}
          </p>
        </div>

        <div className="rounded-2xl border border-red-900 bg-black/90 p-5">
          <p className="text-sm text-white/60">
            Currently approved
          </p>

          <p className="mt-2 text-3xl font-black">
            {approvedTotal}
          </p>
        </div>
      </div>

      {order.revision_message && (
        <div className="mt-6 rounded-3xl border border-orange-500/60 bg-orange-500/10 p-6">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-orange-100">
            Message from Pressed In Pink
          </p>

          <p className="mt-3 whitespace-pre-wrap leading-7 text-white/85">
            {order.revision_message}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-6">
        {order.order_items.map(
          (item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl"
            >
              <div className="relative aspect-[2/1] w-full overflow-hidden bg-black/80 p-4">
                <img
                  src={
                    item.thumbnail_url
                  }
                  alt={
                    item.display_name
                  }
                  onError={(event) => {
                    event.currentTarget.onerror =
                      null;
                    event.currentTarget.src =
                      item.full_image_url;
                  }}
                  className="absolute left-1/2 top-1/2 h-[200%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-contain"
                />
              </div>

              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-red-500">
                      {
                        item.category_name
                      }
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      {
                        item.display_name
                      }
                    </h2>
                  </div>

                  <a
                    href={
                      item.full_image_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-bold text-white/65 underline decoration-red-600 underline-offset-4 transition hover:text-red-500"
                  >
                    Open Full Image
                  </a>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/60">
                      Requested quantity
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {
                        item.requested_quantity
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/60">
                      Approved quantity
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {item.is_available
                        ? item.approved_quantity
                        : 0}
                    </p>
                  </div>
                </div>

                {!item.is_available && (
                  <div className="mt-4 rounded-2xl border border-red-500/60 bg-red-500/10 p-4 font-bold text-red-100">
                    This design is currently
                    unavailable.
                  </div>
                )}

                {item.admin_note && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-white/55">
                      Item Update
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/80">
                      {
                        item.admin_note
                      }
                    </p>
                  </div>
                )}
              </div>
            </article>
          ),
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            void loadOrder();
          }}
          className="rounded-full bg-red-600 px-7 py-3 font-black transition hover:bg-red-500"
        >
          Refresh Order
        </button>

        <a
          href="/wraps"
          className="rounded-full border border-red-600 px-7 py-3 font-black transition hover:bg-red-600"
        >
          Browse More Wraps
        </a>
      </div>
    </AuthPageShell>
  );
}
