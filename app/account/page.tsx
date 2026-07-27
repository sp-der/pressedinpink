
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

export default function AccountPage() {
  const {
    user,
    profile,
    loading,
    isAnonymous,
    isAdmin,
    signOut,
  } = useAuth();

  const [orders, setOrders] =
    useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [actionMessage, setActionMessage] =
    useState("");

  const loadOrders =
    useCallback(async () => {
      if (!user) {
        setOrders([]);
        return;
      }

      setLoadingOrders(true);
      setErrorMessage("");

      const { data, error } =
        await supabase
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
          .eq(
            "customer_id",
            user.id,
          )
          .order(
            "submitted_at",
            {
              ascending: false,
            },
          );

      if (error) {
        setErrorMessage(
          error.message,
        );
        setLoadingOrders(false);
        return;
      }

      setOrders(
        (data ??
          []) as unknown as OrderRecord[],
      );
      setLoadingOrders(false);
    }, [user]);

  useEffect(() => {
    if (!loading && user) {
      void loadOrders();
    }
  }, [
    loading,
    user,
    loadOrders,
  ]);

  const respondToRevision =
    async (
      orderId: string,
      response:
        | "approved"
        | "changes_requested",
    ) => {
      setActionMessage("");
      setErrorMessage("");

      let message = "";

      if (
        response ===
        "changes_requested"
      ) {
        message =
          window.prompt(
            "Describe the changes you need:",
          )?.trim() ?? "";

        if (!message) {
          return;
        }
      }

      const { error } =
        await supabase.rpc(
          "respond_to_order_revision",
          {
            p_order_id:
              orderId,
            p_response:
              response,
            p_message:
              message,
          },
        );

      if (error) {
        setErrorMessage(
          error.message,
        );
        return;
      }

      setActionMessage(
        response === "approved"
          ? "Order revision approved."
          : "Your requested changes were sent.",
      );

      await loadOrders();
    };

  if (loading) {
    return (
      <AuthPageShell
        eyebrow="Customer Orders"
        title="Loading Account"
        description="Checking your saved session."
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading…
        </div>
      </AuthPageShell>
    );
  }

  if (!user) {
    return (
      <AuthPageShell
        eyebrow="Customer Orders"
        title="Sign In"
        description="Sign in to see saved orders, or submit an order through guest checkout."
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="/login"
              className="rounded-full bg-red-600 px-7 py-3 font-black text-white transition hover:bg-red-500"
            >
              Sign In
            </a>

            <a
              href="/signup"
              className="rounded-full border border-red-600 px-7 py-3 font-black text-white transition hover:bg-red-600"
            >
              Create Account
            </a>
          </div>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow={
        isAnonymous
          ? "Guest Order Status"
          : "Customer Account"
      }
      title={
        isAnonymous
          ? "Your Guest Orders"
          : "My Orders"
      }
      description={
        isAnonymous
          ? "Guest orders remain available only while this browser session is preserved."
          : `Signed in as ${profile?.email || user.email || "customer"}.`
      }
      backHref="/wraps"
      backLabel="Browse Wraps"
      maxWidthClass="max-w-6xl"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-900 bg-black/90 p-4">
        <div>
          <p className="font-black">
            {profile?.full_name ||
              (isAnonymous
                ? "Guest customer"
                : "Customer")}
          </p>

          {isAnonymous && (
            <p className="mt-1 text-xs text-yellow-100/80">
              Signing out or clearing
              browser storage can remove
              access to this guest session.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <a
              href="/admin/orders"
              className="rounded-full border border-red-600 px-5 py-2 text-sm font-black transition hover:bg-red-600"
            >
              Admin Dashboard
            </a>
          )}

          <button
            type="button"
            onClick={() => {
              void signOut().then(
                () => {
                  window.location.assign(
                    "/",
                  );
                },
              );
            }}
            className="rounded-full border border-white/30 px-5 py-2 text-sm font-black transition hover:border-red-600 hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="mb-5 rounded-2xl border border-green-500 bg-green-500/15 p-4 font-bold text-green-100">
          {actionMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-500 bg-red-500/15 p-4 font-bold text-red-100">
          {errorMessage}
        </div>
      )}

      {loadingOrders ? (
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading orders…
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-red-900 bg-black/90 p-10 text-center">
          <h2 className="text-2xl font-black">
            No submitted orders yet
          </h2>

          <a
            href="/wraps"
            className="mt-6 inline-block rounded-full bg-red-600 px-7 py-3 font-black transition hover:bg-red-500"
          >
            Browse Wraps
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const requestedTotal =
              order.order_items.reduce(
                (total, item) =>
                  total +
                  item.requested_quantity,
                0,
              );

            return (
              <article
                key={order.id}
                className="rounded-3xl border border-red-900 bg-black/90 p-5 shadow-xl backdrop-blur-md sm:p-7"
              >
                <div className="flex flex-col gap-4 border-b border-red-950 pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
                      Order
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      {order.order_number}
                    </h2>

                    <p className="mt-2 text-sm text-white/65">
                      Submitted{" "}
                      {new Date(
                        order.submitted_at,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-4 py-2 text-sm font-black ${getOrderStatusClasses(
                      order.status,
                    )}`}
                  >
                    {getOrderStatusLabel(
                      order.status,
                    )}
                  </span>
                </div>

                {order.revision_message && (
                  <div className="mt-5 rounded-2xl border border-orange-500/60 bg-orange-500/10 p-4">
                    <p className="text-sm font-black text-orange-100">
                      Message from Pressed
                      In Pink
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/80">
                      {
                        order.revision_message
                      }
                    </p>
                  </div>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {order.order_items.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                      >
                        <div className="relative aspect-[2/1] overflow-hidden bg-black">
                          <img
                            src={
                              item.thumbnail_url
                            }
                            alt={
                              item.display_name
                            }
                            className="absolute left-1/2 top-1/2 h-[204%] w-[52%] max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-cover"
                          />
                        </div>

                        <div className="p-4">
                          <p className="font-black">
                            {
                              item.display_name
                            }
                          </p>

                          <p className="mt-2 text-sm text-white/70">
                            Requested:{" "}
                            <strong className="text-white">
                              {
                                item.requested_quantity
                              }
                            </strong>
                          </p>

                          {item.approved_quantity !==
                            item.requested_quantity ||
                          !item.is_available ? (
                            <p className="mt-1 text-sm text-yellow-100">
                              Approved:{" "}
                              <strong>
                                {item.is_available
                                  ? item.approved_quantity
                                  : 0}
                              </strong>
                            </p>
                          ) : null}

                          {item.admin_note && (
                            <p className="mt-2 text-xs leading-5 text-white/60">
                              {
                                item.admin_note
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-red-950 pt-5">
                  <p className="text-sm text-white/70">
                    {
                      order.order_items
                        .length
                    }{" "}
                    designs •{" "}
                    {requestedTotal} total
                    wraps
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`/order-status?order=${encodeURIComponent(
                        order.id,
                      )}`}
                      className="rounded-full border border-red-600 px-5 py-2 text-sm font-black transition hover:bg-red-600"
                    >
                      View Order Page
                    </a>

                    {order.status ===
                      "awaiting_customer_approval" &&
                      order.customer_approval_status ===
                        "pending" && (
                        <>
                        <button
                          type="button"
                          onClick={() => {
                            void respondToRevision(
                              order.id,
                              "changes_requested",
                            );
                          }}
                          className="rounded-full border border-red-600 px-5 py-2 text-sm font-black transition hover:bg-red-600"
                        >
                          Request Changes
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void respondToRevision(
                              order.id,
                              "approved",
                            );
                          }}
                          className="rounded-full bg-red-600 px-5 py-2 text-sm font-black transition hover:bg-red-500"
                        >
                          Approve Revision
                        </button>
                        </>
                      )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AuthPageShell>
  );
}
