
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import {
  getContactHref,
  getContactMethodLabel,
  getOrderStatusClasses,
  getOrderStatusLabel,
  ORDER_STATUSES,
} from "@/types/orders";
import type {
  OrderRecord,
} from "@/types/orders";

export default function AdminOrdersPage() {
  const {
    user,
    loading,
    isAdmin,
    signOut,
  } = useAuth();

  const [orders, setOrders] =
    useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [search, setSearch] =
    useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const loadOrders =
    useCallback(async () => {
      if (!isAdmin) {
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
    }, [isAdmin]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !isAdmin) {
      window.location.replace(
        "/admin/login",
      );
      return;
    }

    void loadOrders();
  }, [
    loading,
    user,
    isAdmin,
    loadOrders,
  ]);

  const filteredOrders =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return orders.filter((order) => {
        const matchesStatus =
          statusFilter === "all" ||
          order.status === statusFilter;

        const searchable =
          [
            order.order_number,
            order.customer_name,
            order.customer_email,
            order.customer_phone,
            order.contact_method,
            order.contact_value,
          ]
            .join(" ")
            .toLowerCase();

        return (
          matchesStatus &&
          (!query ||
            searchable.includes(query))
        );
      });
    }, [
      orders,
      search,
      statusFilter,
    ]);

  const submittedCount =
    orders.filter(
      (order) =>
        order.status === "submitted",
    ).length;

  const approvalCount =
    orders.filter(
      (order) =>
        order.status ===
        "awaiting_customer_approval",
    ).length;

  if (loading || !isAdmin) {
    return (
      <AuthPageShell
        eyebrow="Pressed In Pink Admin"
        title="Checking Access"
        description="Verifying the administrator account."
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          Loading…
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Pressed In Pink Admin"
      title="Orders Dashboard"
      description="Review guest and customer orders, quantities, revisions, and status."
      backHref="/"
      backLabel="Back to Website"
      maxWidthClass="max-w-7xl"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-red-900 bg-black/90 p-5">
          <p className="text-sm text-white/65">
            All Orders
          </p>
          <p className="mt-2 text-3xl font-black">
            {orders.length}
          </p>
        </div>

        <div className="rounded-2xl border border-red-900 bg-black/90 p-5">
          <p className="text-sm text-white/65">
            New Submissions
          </p>
          <p className="mt-2 text-3xl font-black">
            {submittedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-red-900 bg-black/90 p-5">
          <p className="text-sm text-white/65">
            Awaiting Customer
          </p>
          <p className="mt-2 text-3xl font-black">
            {approvalCount}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-red-900 bg-black/90 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_240px]">
          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search order, customer, email, or phone"
            className="rounded-full border border-red-900 bg-black px-5 py-3 text-white outline-none focus:border-red-500"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            className="rounded-full border border-red-900 bg-black px-5 py-3 text-white outline-none focus:border-red-500"
          >
            <option value="all">
              All statuses
            </option>

            {ORDER_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {getOrderStatusLabel(
                    status,
                  )}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              void loadOrders();
            }}
            className="rounded-full border border-red-600 px-5 py-3 text-sm font-black transition hover:bg-red-600"
          >
            Refresh
          </button>

          <button
            type="button"
            onClick={() => {
              void signOut().then(
                () => {
                  window.location.assign(
                    "/admin/login",
                  );
                },
              );
            }}
            className="rounded-full border border-white/30 px-5 py-3 text-sm font-black transition hover:border-red-600 hover:bg-red-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-5 rounded-2xl border border-red-500 bg-red-500/15 p-4 font-bold text-red-100">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {loadingOrders ? (
          <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
            Loading orders…
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
            No matching orders.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const totalQuantity =
              order.order_items.reduce(
                (total, item) =>
                  total +
                  item.requested_quantity,
                0,
              );

            return (
              <article
                key={order.id}
                className="rounded-3xl border border-red-900 bg-black/90 p-5 shadow-xl backdrop-blur-md sm:p-6"
              >
                <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
                      {
                        order.checkout_type
                      }{" "}
                      order
                    </p>

                    <h2 className="mt-1 text-2xl font-black">
                      {
                        order.order_number
                      }
                    </h2>

                    <p className="mt-2 text-sm text-white/65">
                      {new Date(
                        order.submitted_at,
                      ).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <p className="font-black">
                      {
                        order.customer_name
                      }
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {
                        order.customer_email
                      }
                    </p>

                    <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-red-400">
                      Preferred contact
                    </p>

                    {getContactHref(
                      order.contact_method,
                      order.contact_value,
                    ) ? (
                      <a
                        href={
                          getContactHref(
                            order.contact_method,
                            order.contact_value,
                          ) ?? undefined
                        }
                        target={
                          order.contact_method ===
                            "instagram" ||
                          order.contact_method ===
                            "tiktok"
                            ? "_blank"
                            : undefined
                        }
                        rel={
                          order.contact_method ===
                            "instagram" ||
                          order.contact_method ===
                            "tiktok"
                            ? "noreferrer"
                            : undefined
                        }
                        className="mt-1 block break-all text-sm font-bold text-white underline decoration-red-600 underline-offset-4"
                      >
                        {getContactMethodLabel(
                          order.contact_method,
                        )}
                        {": "}
                        {order.contact_value ||
                          order.customer_email}
                      </a>
                    ) : (
                      <p className="mt-1 break-all text-sm text-white/70">
                        {getContactMethodLabel(
                          order.contact_method ||
                            "email",
                        )}
                        {": "}
                        {order.contact_value ||
                          order.customer_email}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-3 lg:items-end">
                    <span
                      className={`rounded-full border px-4 py-2 text-sm font-black ${getOrderStatusClasses(
                        order.status,
                      )}`}
                    >
                      {getOrderStatusLabel(
                        order.status,
                      )}
                    </span>

                    <p className="text-sm text-white/65">
                      {
                        order.order_items
                          .length
                      }{" "}
                      designs •{" "}
                      {totalQuantity} wraps
                    </p>

                    <a
                      href={`/admin/order?order=${encodeURIComponent(
                        order.id,
                      )}`}
                      className="rounded-full bg-red-600 px-5 py-2 text-sm font-black transition hover:bg-red-500"
                    >
                      Open Order
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </AuthPageShell>
  );
}
