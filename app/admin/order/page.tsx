"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import AuthPageShell from "@/components/AuthPageShell";
import { useAuth } from "@/components/AuthProvider";
import {
  downloadInvoicePdf,
  invoicePdfBase64,
} from "@/lib/invoicePdf";
import type { InvoicePdfData } from "@/lib/invoicePdf";
import { supabase } from "@/lib/supabase";
import {
  getContactHref,
  getContactMethodLabel,
  getOrderStatusLabel,
  ORDER_STATUSES,
} from "@/types/orders";
import type {
  InvoiceRecord,
  OrderItemRecord,
  OrderRecord,
  OrderStatus,
} from "@/types/orders";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});


const STANDARD_WRAP_PRICE = 2;
const BULK_WRAP_PRICE = 1.25;
const BULK_WRAP_MINIMUM = 50;

type GroupedInvoiceLine = {
  categorySlug: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

function moneyValue(value: string | number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export default function AdminOrderPage() {
  const { user, loading, isAdmin } = useAuth();
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [items, setItems] = useState<OrderItemRecord[]>([]);
  const [status, setStatus] =
    useState<OrderStatus>("submitted");
  const [adminNotes, setAdminNotes] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [invoice, setInvoice] =
    useState<InvoiceRecord | null>(null);
  const [shipping, setShipping] = useState("0.00");
  const [discount, setDiscount] = useState("0.00");
  const [tax, setTax] = useState("0.00");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get("order") ?? "");
  }, []);

  const loadInvoice = useCallback(
    async (selectedOrderId: string) => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("order_id", selectedOrderId)
        .maybeSingle();

      if (error) {
        if (error.code !== "42P01") {
          console.error("Could not load invoice.", error);
        }
        setInvoice(null);
        return;
      }

      if (!data) {
        setInvoice(null);
        setShipping("0.00");
        setDiscount("0.00");
        setTax("0.00");
        setInvoiceNotes("");
        return;
      }

      const loadedInvoice = data as InvoiceRecord;

      setInvoice({
        ...loadedInvoice,
        subtotal: Number(loadedInvoice.subtotal),
        shipping: Number(loadedInvoice.shipping),
        discount: Number(loadedInvoice.discount),
        tax: Number(loadedInvoice.tax),
        total: Number(loadedInvoice.total),
      });
      setShipping(Number(loadedInvoice.shipping).toFixed(2));
      setDiscount(Number(loadedInvoice.discount).toFixed(2));
      setTax(Number(loadedInvoice.tax).toFixed(2));
      setInvoiceNotes(loadedInvoice.notes ?? "");
    },
    [],
  );

  const loadOrder = useCallback(async () => {
    if (!orderId || !isAdmin) {
      return;
    }

    setLoadingOrder(true);
    setErrorMessage("");

    const { data, error } = await supabase
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

    if (error || !data) {
      setErrorMessage(error?.message ?? "Order not found.");
      setLoadingOrder(false);
      return;
    }

    const loaded = data as unknown as OrderRecord;
    const loadedItems = loaded.order_items ?? [];
    setOrder(loaded);
    setItems(loadedItems);
    setStatus(loaded.status);
    setAdminNotes(loaded.admin_notes ?? "");
    setRevisionMessage(loaded.revision_message ?? "");
    await loadInvoice(loaded.id);
    setLoadingOrder(false);
  }, [orderId, isAdmin, loadInvoice]);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user || !isAdmin) {
      window.location.replace("/admin/login");
      return;
    }

    if (orderId) {
      void loadOrder();
    }
  }, [loading, user, isAdmin, orderId, loadOrder]);

  const updateItem = (
    itemId: string,
    updates: Partial<OrderItemRecord>,
  ) => {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item,
      ),
    );
  };

  const approvedWrapQuantity = useMemo(
    () =>
      items.reduce((totalQuantity, item) => {
        if (!item.is_available) {
          return totalQuantity;
        }

        return (
          totalQuantity +
          Math.max(0, Math.round(item.approved_quantity))
        );
      }, 0),
    [items],
  );

  const automaticUnitPrice =
    approvedWrapQuantity >= BULK_WRAP_MINIMUM
      ? BULK_WRAP_PRICE
      : STANDARD_WRAP_PRICE;

  const pricingLabel =
    approvedWrapQuantity >= BULK_WRAP_MINIMUM
      ? `Bulk rate applied: ${BULK_WRAP_MINIMUM}+ wraps at ${currency.format(BULK_WRAP_PRICE)} each.`
      : `Standard rate: ${currency.format(STANDARD_WRAP_PRICE)} each. The bulk rate begins at ${BULK_WRAP_MINIMUM} wraps.`;

  const invoiceLines = useMemo<GroupedInvoiceLine[]>(() => {
    const grouped = new Map<string, GroupedInvoiceLine>();

    for (const item of items) {
      if (!item.is_available) {
        continue;
      }

      const quantity = Math.max(
        0,
        Math.round(item.approved_quantity),
      );

      if (quantity === 0) {
        continue;
      }

      const categorySlug = item.category_slug || "other";
      const current = grouped.get(categorySlug);

      if (current) {
        current.quantity += quantity;
        current.lineTotal = roundMoney(
          current.quantity * automaticUnitPrice,
        );
        continue;
      }

      grouped.set(categorySlug, {
        categorySlug,
        description: item.category_name || "Other Wraps",
        quantity,
        unitPrice: automaticUnitPrice,
        lineTotal: roundMoney(quantity * automaticUnitPrice),
      });
    }

    return Array.from(grouped.values()).sort((first, second) =>
      first.description.localeCompare(second.description),
    );
  }, [items, automaticUnitPrice]);

  const subtotal = useMemo(
    () =>
      roundMoney(
        invoiceLines.reduce(
          (totalAmount, line) => totalAmount + line.lineTotal,
          0,
        ),
      ),
    [invoiceLines],
  );
  const shippingAmount = moneyValue(shipping);
  const discountAmount = moneyValue(discount);
  const taxAmount = moneyValue(tax);
  const total = roundMoney(
    Math.max(
      0,
      subtotal + shippingAmount + taxAmount - discountAmount,
    ),
  );

  const saveOrder = async (
    showSuccess = true,
  ): Promise<boolean> => {
    if (!order || !user) {
      return false;
    }

    if (
      status === "awaiting_customer_approval" &&
      revisionMessage.trim().length === 0
    ) {
      setErrorMessage(
        "Add a revision message before sending the order for customer approval.",
      );
      return false;
    }

    setSavingOrder(true);
    setErrorMessage("");
    if (showSuccess) {
      setSuccessMessage("");
    }

    try {
      let approvalStatus = order.customer_approval_status;

      if (status === "awaiting_customer_approval") {
        approvalStatus = "pending";
      } else if (status === "approved") {
        approvalStatus = "approved";
      } else if (status === "changes_requested") {
        approvalStatus = "changes_requested";
      }

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status,
          admin_notes: adminNotes.trim(),
          revision_message: revisionMessage.trim(),
          customer_approval_status: approvalStatus,
        })
        .eq("id", order.id);

      if (orderError) {
        throw orderError;
      }

      const results = await Promise.all(
        items.map((item) =>
          supabase
            .from("order_items")
            .update({
              approved_quantity: item.is_available
                ? Math.max(0, Math.round(item.approved_quantity))
                : 0,
              is_available: item.is_available,
              admin_note: item.admin_note.trim(),
            })
            .eq("id", item.id),
        ),
      );

      const failedResult = results.find((result) => result.error);
      if (failedResult?.error) {
        throw failedResult.error;
      }

      const { error: eventError } = await supabase
        .from("order_events")
        .insert({
          order_id: order.id,
          event_type: "admin_update",
          message: `Order updated to ${getOrderStatusLabel(status)}.`,
          created_by: user.id,
        });

      if (eventError) {
        throw eventError;
      }

      setOrder({
        ...order,
        status,
        admin_notes: adminNotes.trim(),
        revision_message: revisionMessage.trim(),
        customer_approval_status: approvalStatus,
        order_items: items,
      });

      if (showSuccess) {
        setSuccessMessage("Order changes saved.");
      }

      return true;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Order changes could not be saved.",
      );
      return false;
    } finally {
      setSavingOrder(false);
    }
  };

  const saveInvoice = async (
    showSuccess = true,
  ): Promise<InvoiceRecord | null> => {
    if (!order || !user) {
      return null;
    }

    if (invoiceLines.length === 0) {
      setErrorMessage(
        "The invoice needs at least one available wrap with an approved quantity.",
      );
      return null;
    }

    setSavingInvoice(true);
    setErrorMessage("");
    if (showSuccess) {
      setSuccessMessage("");
    }

    try {
      const invoicePayload = {
        order_id: order.id,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        subtotal,
        shipping: shippingAmount,
        discount: discountAmount,
        tax: taxAmount,
        total,
        notes: invoiceNotes.trim(),
        created_by: user.id,
      };

      let savedInvoice: InvoiceRecord;

      if (invoice) {
        const { data, error } = await supabase
          .from("invoices")
          .update(invoicePayload)
          .eq("id", invoice.id)
          .select("*")
          .single();

        if (error || !data) {
          throw error ?? new Error("Invoice could not be updated.");
        }

        savedInvoice = data as InvoiceRecord;
      } else {
        const { data, error } = await supabase
          .from("invoices")
          .insert({
            ...invoicePayload,
            status: "draft",
          })
          .select("*")
          .single();

        if (error || !data) {
          throw error ?? new Error("Invoice could not be created.");
        }

        savedInvoice = data as InvoiceRecord;
      }

      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", savedInvoice.id);

      if (deleteError) {
        throw deleteError;
      }

      const { error: itemError } = await supabase
        .from("invoice_items")
        .insert(
          invoiceLines.map((line) => ({
            invoice_id: savedInvoice.id,
            order_item_id: null,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            line_total: line.lineTotal,
          })),
        );

      if (itemError) {
        throw itemError;
      }

      const normalized: InvoiceRecord = {
        ...savedInvoice,
        subtotal: Number(savedInvoice.subtotal),
        shipping: Number(savedInvoice.shipping),
        discount: Number(savedInvoice.discount),
        tax: Number(savedInvoice.tax),
        total: Number(savedInvoice.total),
      };
      setInvoice(normalized);

      if (showSuccess) {
        setSuccessMessage(
          `Invoice ${normalized.invoice_number} saved as a draft.`,
        );
      }

      return normalized;
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The invoice could not be saved.",
      );
      return null;
    } finally {
      setSavingInvoice(false);
    }
  };

  const buildPdfData = (
    savedInvoice: InvoiceRecord,
  ): InvoicePdfData => ({
    invoiceNumber: savedInvoice.invoice_number,
    orderNumber: order?.order_number ?? "",
    customerName: order?.customer_name ?? "",
    customerEmail: order?.customer_email ?? "",
    invoiceDate: new Date().toLocaleDateString("en-US"),
    totalWrapQuantity: approvedWrapQuantity,
    unitPrice: automaticUnitPrice,
    pricingLabel:
      approvedWrapQuantity >= BULK_WRAP_MINIMUM
        ? "Bulk pricing applied (50+ wraps)"
        : "Standard pricing applied (under 50 wraps)",
    lines: invoiceLines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    subtotal,
    shipping: shippingAmount,
    discount: discountAmount,
    tax: taxAmount,
    total,
    notes: invoiceNotes.trim(),
  });

  const downloadInvoice = async () => {
    const savedInvoice = await saveInvoice(false);
    if (!savedInvoice) {
      return;
    }

    downloadInvoicePdf(buildPdfData(savedInvoice));
    setSuccessMessage(
      `Invoice ${savedInvoice.invoice_number} downloaded.`,
    );
  };

  const emailInvoice = async () => {
    if (!order) {
      return;
    }

    setSendingInvoice(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const orderSaved = await saveOrder(false);
      if (!orderSaved) {
        return;
      }

      const savedInvoice = await saveInvoice(false);
      if (!savedInvoice) {
        return;
      }

      const pdfBase64 = invoicePdfBase64(
        buildPdfData(savedInvoice),
      );
      const { data, error } = await supabase.functions.invoke(
        "send-invoice",
        {
          body: {
            orderId: order.id,
            invoiceId: savedInvoice.id,
            pdfBase64,
            siteOrigin: window.location.origin,
          },
        },
      );

      if (error) {
        throw error;
      }

      const result = data as { sent?: boolean; error?: string };
      if (!result?.sent) {
        throw new Error(
          result?.error ?? "The invoice email was not sent.",
        );
      }

      setStatus("invoice_sent");
      setOrder({ ...order, status: "invoice_sent" });
      setInvoice({
        ...savedInvoice,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      setSuccessMessage(
        `Invoice ${savedInvoice.invoice_number} emailed to ${order.customer_email}.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The invoice email could not be sent.",
      );
    } finally {
      setSendingInvoice(false);
    }
  };

  if (loading || !isAdmin || loadingOrder) {
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
        description={errorMessage || "No valid order was selected."}
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

  const contactHref = getContactHref(
    order.contact_method,
    order.contact_value || order.customer_email,
  );

  return (
    <AuthPageShell
      eyebrow="Pressed In Pink Admin"
      title={order.order_number}
      description="Buyer information, order controls, and invoicing now stay above the wrap list."
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
            Buyer Information
          </p>
          <h2 className="mt-3 text-3xl font-black">
            {order.customer_name}
          </h2>
          <a
            href={`mailto:${order.customer_email}`}
            className="mt-3 block break-all text-sm font-bold text-white/80 underline decoration-red-600 underline-offset-4"
          >
            {order.customer_email}
          </a>

          <div className="mt-5 rounded-2xl border border-red-900/80 bg-red-950/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-red-400">
              Preferred Contact
            </p>
            {contactHref ? (
              <a
                href={contactHref}
                target={
                  order.contact_method === "instagram" ||
                  order.contact_method === "tiktok"
                    ? "_blank"
                    : undefined
                }
                rel={
                  order.contact_method === "instagram" ||
                  order.contact_method === "tiktok"
                    ? "noreferrer"
                    : undefined
                }
                className="mt-2 block break-all font-black underline decoration-red-600 underline-offset-4"
              >
                {getContactMethodLabel(order.contact_method)}: {order.contact_value || order.customer_email}
              </a>
            ) : (
              <p className="mt-2 break-all font-black">
                {getContactMethodLabel(order.contact_method || "email")}: {order.contact_value || order.customer_email}
              </p>
            )}
          </div>

          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/50">Checkout</p>
              <p className="mt-1 font-black capitalize">
                {order.checkout_type}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/50">Submitted</p>
              <p className="mt-1 font-black">
                {new Date(order.submitted_at).toLocaleString("en-US")}
              </p>
            </div>
          </div>

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
        </section>

        <section className="rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl sm:p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
            Order Review
          </p>

          <label className="mt-4 block">
            <span className="text-sm font-bold">Order status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as OrderStatus)
              }
              className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
            >
              {ORDER_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {getOrderStatusLabel(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold">
              Revision message for customer
            </span>
            <textarea
              value={revisionMessage}
              onChange={(event) =>
                setRevisionMessage(event.target.value)
              }
              rows={4}
              className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="Explain quantity changes or unavailable items"
            />
          </label>

          <label className="mt-4 block">
            <span className="text-sm font-bold">
              Private admin notes
            </span>
            <textarea
              value={adminNotes}
              onChange={(event) => setAdminNotes(event.target.value)}
              rows={4}
              className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
              placeholder="Internal notes not shown to the customer"
            />
          </label>

          <button
            type="button"
            onClick={() => void saveOrder()}
            disabled={savingOrder}
            className="mt-5 w-full rounded-full bg-red-600 px-6 py-4 font-black transition hover:bg-red-500 disabled:opacity-60"
          >
            {savingOrder ? "Saving Changes…" : "Save Order Changes"}
          </button>
        </section>
      </div>

      <section className="mt-6 rounded-3xl border border-red-900 bg-black/90 p-6 shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
              Invoice Builder
            </p>
            <h2 className="mt-2 text-2xl font-black">
              {invoice?.invoice_number ?? "New Invoice"}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              Pricing is automatic and the invoice groups wraps by category. Shipping, tax, and discounts stay editable.
            </p>
          </div>
          {invoice && (
            <span className="rounded-full border border-red-600 px-4 py-2 text-xs font-black uppercase tracking-wide">
              {invoice.status}
            </span>
          )}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-white/50">
              Approved Wraps
            </p>
            <p className="mt-2 text-2xl font-black">
              {approvedWrapQuantity}
            </p>
          </div>
          <div className="rounded-2xl border border-red-800 bg-red-950/25 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-red-300">
              Active Price
            </p>
            <p className="mt-2 text-2xl font-black">
              {currency.format(automaticUnitPrice)} each
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-1">
            <p className="text-xs font-bold uppercase tracking-wide text-white/50">
              Pricing Rule
            </p>
            <p className="mt-2 text-sm font-bold leading-6 text-white/80">
              {pricingLabel}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-red-950/40 text-xs uppercase tracking-wide text-white/70">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3">Automatic Rate</th>
                <th className="px-4 py-3 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceLines.map((line) => (
                <tr
                  key={line.categorySlug}
                  className="border-t border-white/10"
                >
                  <td className="px-4 py-3 font-bold">
                    {line.description}
                  </td>
                  <td className="px-4 py-3 text-center font-black">
                    {line.quantity}
                  </td>
                  <td className="px-4 py-3 font-black text-red-300">
                    {currency.format(line.unitPrice)} each
                  </td>
                  <td className="px-4 py-3 text-right font-black">
                    {currency.format(line.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <label>
            <span className="text-sm font-bold">Invoice notes</span>
            <textarea
              value={invoiceNotes}
              onChange={(event) => setInvoiceNotes(event.target.value)}
              rows={6}
              placeholder="Payment instructions, pickup details, or other notes"
              className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 text-white outline-none focus:border-red-500"
            />
          </label>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="text-xs font-bold text-white/60">Shipping</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shipping}
                  onChange={(event) => setShipping(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-red-900 bg-black px-3 py-2 outline-none focus:border-red-500"
                />
              </label>
              <label>
                <span className="text-xs font-bold text-white/60">Discount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(event) => setDiscount(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-red-900 bg-black px-3 py-2 outline-none focus:border-red-500"
                />
              </label>
              <label className="col-span-2">
                <span className="text-xs font-bold text-white/60">Tax amount</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tax}
                  onChange={(event) => setTax(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-red-900 bg-black px-3 py-2 outline-none focus:border-red-500"
                />
              </label>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Grouped wrap subtotal</span>
                <strong>{currency.format(subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Shipping</span>
                <strong>{currency.format(shippingAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Discount</span>
                <strong>-{currency.format(discountAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Tax</span>
                <strong>{currency.format(taxAmount)}</strong>
              </div>
              <div className="mt-3 flex justify-between border-t border-red-700 pt-3 text-xl">
                <span className="font-black">Total</span>
                <strong>{currency.format(total)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => void saveInvoice()}
            disabled={savingInvoice || sendingInvoice}
            className="rounded-full border border-red-600 px-5 py-3 font-black transition hover:bg-red-600 disabled:opacity-50"
          >
            {savingInvoice ? "Saving…" : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={() => void downloadInvoice()}
            disabled={savingInvoice || sendingInvoice}
            className="rounded-full border border-red-600 px-5 py-3 font-black transition hover:bg-red-600 disabled:opacity-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => void emailInvoice()}
            disabled={savingInvoice || sendingInvoice || savingOrder}
            className="rounded-full bg-red-600 px-5 py-3 font-black transition hover:bg-red-500 disabled:opacity-50"
          >
            {sendingInvoice ? "Sending Invoice…" : "Email Invoice to Customer"}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-red-400">
              Requested Designs
            </p>
            <h2 className="mt-2 text-3xl font-black">
              {items.length} Wrap{items.length === 1 ? "" : "s"}
            </h2>
          </div>
          <p className="text-sm text-white/60">
            Adjust quantities and availability, then save the order above.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                  src={item.thumbnail_url}
                  alt={item.display_name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = item.full_image_url;
                  }}
                  className="absolute left-1/2 top-1/2 h-[200%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-contain"
                />
              </a>

              <div className="p-5">
                <h3 className="text-xl font-black">
                  {item.display_name}
                </h3>
                <p className="mt-1 text-xs text-white/50">
                  Requested quantity: {item.requested_quantity}
                </p>

                <label className="mt-4 block">
                  <span className="text-sm font-bold">Approved quantity</span>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={item.approved_quantity}
                    disabled={!item.is_available}
                    onChange={(event) =>
                      updateItem(item.id, {
                        approved_quantity: Math.max(
                          0,
                          Number(event.target.value) || 0,
                        ),
                      })
                    }
                    className="mt-2 w-full rounded-2xl border border-red-900 bg-black px-4 py-3 outline-none focus:border-red-500 disabled:opacity-40"
                  />
                </label>

                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <input
                    type="checkbox"
                    checked={item.is_available}
                    onChange={(event) =>
                      updateItem(item.id, {
                        is_available: event.target.checked,
                        approved_quantity: event.target.checked
                          ? Math.max(1, item.approved_quantity || item.requested_quantity)
                          : 0,
                      })
                    }
                    className="h-4 w-4 accent-red-600"
                  />
                  <span className="text-sm font-black">
                    Design is available
                  </span>
                </label>

                <label className="mt-4 block">
                  <span className="text-sm font-bold">
                    Item note for customer
                  </span>
                  <textarea
                    value={item.admin_note}
                    onChange={(event) =>
                      updateItem(item.id, {
                        admin_note: event.target.value,
                      })
                    }
                    rows={3}
                    className="mt-2 w-full resize-y rounded-2xl border border-red-900 bg-black px-4 py-3 outline-none focus:border-red-500"
                    placeholder="Optional note about this wrap"
                  />
                </label>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AuthPageShell>
  );
}
