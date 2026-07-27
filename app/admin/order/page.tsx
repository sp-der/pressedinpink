
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
  getContactHref,
  getContactMethodLabel,
  getOrderStatusLabel,
  ORDER_STATUSES,
} from "@/types/orders";
import type {
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
} from "@/types/orders";

export default function AdminOrderPage() {
  const {
    user,
    loading,
    isAdmin,
  } = useAuth();

  const [orderId, setOrderId] =
    useState("");
  const [order, setOrder] =
    useState<OrderRecord | null>(null);
  const [items, setItems] =
    useState<OrderItemRecord[]>([]);
  const [status, setStatus] =
    useState<OrderStatus>("submitted");
  const [adminNotes, setAdminNotes] =
    useState("");
  const [
    revisionMessage,
    setRevisionMessage,
  ] = useState("");
  const [loadingOrder, setLoadingOrder] =
    useState(false);
  const [saving, setSaving] =
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

    setOrderId(
      params.get("order") ?? "",
    );
  }, []);

  const loadOrder =
    useCallback(async () => {
      if (!orderId || !isAdmin) {
        return;
      }

      setLoadingOrder(true);
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
          .eq("id", orderId)
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
          "Order not found.",
        );
        setLoadingOrder(false);
        return;
      }

      const loaded =
        data as unknown as OrderRecord;

      setOrder(loaded);
      setItems(
        loaded.order_items ?? [],
      );
      setStatus(loaded.status);
      setAdminNotes(
        loaded.admin_notes ?? "",
      );
      setRevisionMessage(
        loaded.revision_message ??
          "",
      );
      setLoadingOrder(false);
    }, [orderId, isAdmin]);

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

    if (orderId) {
      void loadOrder();
    }
  }, [
    loading,
    user,
    isAdmin,
    orderId,
    loadOrder,
  ]);

  const updateItem = (
    itemId: string,
    updates:
      Partial<OrderItemRecord>,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    );
  };

  const saveOrder =
    async () => {
      if (!order || !user) {
        return;
      }

      if (
        status ===
          "awaiting_customer_approval" &&
        revisionMessage.trim().length ===
          0
      ) {
        setErrorMessage(
          "Add a revision message before sending the order for customer approval.",
        );
        return;
      }

      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        let approvalStatus =
          order.customer_approval_status;

        if (
          status ===
          "awaiting_customer_approval"
        ) {
          approvalStatus = "pending";
        } else if (
          status === "approved"
        ) {
          approvalStatus = "approved";
        } else if (
          status ===
          "changes_requested"
        ) {
          approvalStatus =
            "changes_requested";
        }

        const {
          error: orderError,
        } = await supabase
          .from("orders")
          .update({
            status,
            admin_notes:
              adminNotes.trim(),
            revision_message:
              revisionMessage.trim(),
            customer_approval_status:
              approvalStatus,
          })
          .eq("id", order.id);

        if (orderError) {
          throw orderError;
        }

        const results =
          await Promise.all(
            items.map((item) =>
              supabase
                .from("order_items")
                .update({
                  approved_quantity:
                    item.is_available
                      ? Math.max(
                          0,
                          Math.round(
                            item.approved_quantity,
                          ),
                        )
                      : 0,
                  is_available:
                    item.is_available,
                  admin_note:
                    item.admin_note.trim(),
                })
                .eq("id", item.id),
            ),
          );

        const failedResult =
          results.find(
            (result) =>
              Boolean(result.error),
          );

        if (failedResult?.error) {
          throw failedResult.error;
        }

        const {
          error: eventError,
        } = await supabase
          .from("order_events")
          .insert({
            order_id:
              order.id,
            event_type:
              "admin_update",
            message:
              `Order updated to ${getOrderStatusLabel(
                status,
              )}.`,
            created_by:
              user.id,
          });

        if (eventError) {
          throw eventError;
        }

        setSuccessMessage(
          "Order changes saved.",
        );

        await loadOrder();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Order changes could not be saved.",
        );
      } finally {
        setSaving(false);
      }
    };

  if (
    loading ||
    !isAdmin ||
    loadingOrder
  ) {
    return (
      <AuthPageShell
        eyebrow="Pressed In Pink Admin"
        title="Loading Order"
        description="Retrieving the customer request and item quantities."
        backHref="/admin/orders"
        backLabel="Back to Orders"
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
        eyebrow="Pressed In Pink Admin"
        title="Order Not Found"
        description={
          errorMessage ||
          "No valid order was selected."
        }
        backHref="/admin/orders"
        backLabel="Back to Orders"
      >
        <div className="rounded-3xl border border-red-900 bg-black/90 p-8 text-center">
          <a
            href="/admin/orders"
            className="inline-block rounded-full bg-red-600 px-7 py-3 font-black transition hover:bg-red-500"
          >
            Return to Dashboard
          </a>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Pressed In Pink Admin"
      title={order.order_number}
      description="Review the customer details, approve quantities, and move the order through its workflow."
      backHref="/admin/orders"
      backLabel="Back to Orders"
      maxWidthClass="max-w-7xl"
    >
      {successMessage && (
        <div className="mb-5 rounded-2xl border border-green-500 bg-green-500/15 p-4 font-bold text-green-100">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 rounded-2xl border border-red-500 bg-red-500/15 p-4 font-bold text-red-100">
          {errorMessage}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          {items.map((item) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl border border-red-900 bg-black/90 shadow-xl"
            >
              <a
                href={item.full_image_url}
                target="_blank"
                rel="noreferrer"
                className="relative block aspect-[2/1] w-full overflow-hidden bg-black/80 p-4"
              >
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
              </a>

              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
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
                    className="text-sm font-bold text-white/70 underline decoration-red-600 underline-offset-4 transition hover:text-red-500"
                  >
                    Open Image
                  </a>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/60">
                      Requested
                    </p>

                    <p className="mt-1 text-3xl font-black">
                      {
                        item.requested_quantity
                      }
                    </p>
                  </div>

                  <label>
                    <span className="text-xs font-bold text-white/70">
                      Approved quantity
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={999}
                      disabled={
                        !item.is_available
                      }
                      value={
                        item.approved_quantity
                      }
                      onChange={(event) =>
                        updateItem(
                          item.id,
                          {
                            approved_quantity:
                              Number(
                                event
                                  .target
                                  .value,
                              ),
                          },
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-xl font-black text-white outline-none focus:border-red-500 disabled:opacity-40"
                    />
                  </label>
                </div>

                <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    checked={
                      item.is_available
                    }
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        {
                          is_available:
                            event.target
                              .checked,
                          approved_quantity:
                            event.target
                              .checked
                              ? Math.max(
                                  1,
                                  item.requested_quantity,
                                )
                              : 0,
                        },
                      )
                    }
                    className="h-5 w-5 accent-red-600"
                  />

                  <span className="font-bold">
                    Item is available
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="text-xs font-bold text-white/70">
                    Item note for customer
                  </span>

                  <textarea
                    value={
                      item.admin_note
                    }
                    onChange={(event) =>
                      updateItem(
                        item.id,
                        {
                          admin_note:
                            event.target
                              .value,
                        },
                      )
                    }
                    rows={3}
                    className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
                    placeholder="Optional availability or quantity note"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl lg:sticky lg:top-6">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-500">
            Customer
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {order.customer_name}
          </h2>

          <p className="mt-3 break-all text-sm text-white/75">
            {order.customer_email}
          </p>

          <div className="mt-5 rounded-2xl border border-red-900/80 bg-red-950/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-red-400">
              Preferred Contact
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
                className="mt-2 block break-all font-black text-white underline decoration-red-600 underline-offset-4"
              >
                {getContactMethodLabel(
                  order.contact_method,
                )}
                {": "}
                {order.contact_value ||
                  order.customer_email}
              </a>
            ) : (
              <p className="mt-2 break-all font-black text-white">
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

          <p className="mt-4 text-xs uppercase tracking-[0.15em] text-white/45">
            {order.checkout_type} checkout
          </p>

          {order.customer_notes && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-white/60">
                Customer Notes
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/80">
                {order.customer_notes}
              </p>
            </div>
          )}

          <label className="mt-5 block">
            <span className="text-sm font-bold">
              Order status
            </span>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as OrderStatus,
                )
              }
              className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
            >
              {ORDER_STATUSES.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {getOrderStatusLabel(
                      option,
                    )}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-bold">
              Revision message for customer
            </span>

            <textarea
              value={revisionMessage}
              onChange={(event) =>
                setRevisionMessage(
                  event.target.value,
                )
              }
              rows={5}
              className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="Explain quantity changes or unavailable items"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-bold">
              Private admin notes
            </span>

            <textarea
              value={adminNotes}
              onChange={(event) =>
                setAdminNotes(
                  event.target.value,
                )
              }
              rows={5}
              className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="Internal notes not shown to the customer"
            />
          </label>

          <button
            type="button"
            onClick={() => {
              void saveOrder();
            }}
            disabled={saving}
            className="mt-6 w-full rounded-full bg-red-600 px-6 py-4 font-black text-white transition hover:bg-red-500 disabled:opacity-60"
          >
            {saving
              ? "Saving Changes…"
              : "Save Order Changes"}
          </button>

          <p className="mt-3 text-center text-xs leading-5 text-white/55">
            Choose “Awaiting Your
            Approval” when revised
            quantities are ready for the
            customer to approve.
          </p>
        </aside>
      </div>
    </AuthPageShell>
  );
}
