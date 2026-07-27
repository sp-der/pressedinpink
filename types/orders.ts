
export const ORDER_STATUSES = [
  "submitted",
  "under_review",
  "awaiting_customer_approval",
  "approved",
  "changes_requested",
  "invoice_sent",
  "paid",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export const CONTACT_METHODS = [
  "email",
  "phone",
  "instagram",
  "tiktok",
] as const;

export type OrderStatus =
  (typeof ORDER_STATUSES)[number];

export type ContactMethod =
  (typeof CONTACT_METHODS)[number];

export type CustomerApprovalStatus =
  | "not_required"
  | "pending"
  | "approved"
  | "changes_requested";

export type CheckoutType =
  | "guest"
  | "account";

export type OrderItemRecord = {
  id: string;
  order_id: string;
  product_id: string;
  display_name: string;
  category_slug: string;
  category_name: string;
  image_number: number;
  source_filename: string;
  thumbnail_url: string;
  full_image_url: string;
  requested_quantity: number;
  approved_quantity: number;
  is_available: boolean;
  admin_note: string;
  created_at: string;
  updated_at: string;
};

export type OrderRecord = {
  id: string;
  order_number: string;
  customer_id: string;
  checkout_type: CheckoutType;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  contact_method: ContactMethod;
  contact_value: string;
  customer_notes: string;
  status: OrderStatus;
  customer_approval_status:
    CustomerApprovalStatus;
  revision_message: string;
  admin_notes: string;
  submitted_at: string;
  updated_at: string;
  order_items: OrderItemRecord[];
};

export const CONTACT_METHOD_LABELS:
  Record<ContactMethod, string> = {
    email: "Email",
    phone: "Phone",
    instagram: "Instagram",
    tiktok: "TikTok",
  };

export const ORDER_STATUS_LABELS:
  Record<OrderStatus, string> = {
    submitted: "Submitted",
    under_review: "Under Review",
    awaiting_customer_approval:
      "Awaiting Your Approval",
    approved: "Approved",
    changes_requested: "Changes Requested",
    invoice_sent: "Invoice Sent",
    paid: "Paid",
    preparing: "Preparing Order",
    ready: "Ready",
    completed: "Completed",
    cancelled: "Cancelled",
  };

export function getOrderStatusLabel(
  status: string,
): string {
  return (
    ORDER_STATUS_LABELS[
      status as OrderStatus
    ] ?? status.replaceAll("_", " ")
  );
}

export function getContactMethodLabel(
  method: string,
): string {
  return (
    CONTACT_METHOD_LABELS[
      method as ContactMethod
    ] ?? method
  );
}

export function getContactHref(
  method: string,
  value: string,
): string | null {
  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return null;
  }

  switch (method) {
    case "email":
      return `mailto:${cleanedValue}`;

    case "phone":
      return `tel:${cleanedValue.replace(
        /[^\d+]/g,
        "",
      )}`;

    case "instagram": {
      const username =
        cleanedValue
          .replace(
            /^https?:\/\/(www\.)?instagram\.com\//i,
            "",
          )
          .replace(/^@/, "")
          .replace(/\/.*$/, "");

      return username
        ? `https://instagram.com/${username}`
        : null;
    }

    case "tiktok": {
      const username =
        cleanedValue
          .replace(
            /^https?:\/\/(www\.)?tiktok\.com\/@?/i,
            "",
          )
          .replace(/^@/, "")
          .replace(/\/.*$/, "");

      return username
        ? `https://tiktok.com/@${username}`
        : null;
    }

    default:
      return null;
  }
}

export function getOrderStatusClasses(
  status: string,
): string {
  switch (status) {
    case "submitted":
      return "border-blue-500/60 bg-blue-500/15 text-blue-100";
    case "under_review":
      return "border-yellow-500/60 bg-yellow-500/15 text-yellow-100";
    case "awaiting_customer_approval":
      return "border-orange-500/60 bg-orange-500/15 text-orange-100";
    case "approved":
      return "border-green-500/60 bg-green-500/15 text-green-100";
    case "changes_requested":
      return "border-purple-500/60 bg-purple-500/15 text-purple-100";
    case "invoice_sent":
      return "border-cyan-500/60 bg-cyan-500/15 text-cyan-100";
    case "paid":
      return "border-emerald-500/60 bg-emerald-500/15 text-emerald-100";
    case "preparing":
      return "border-pink-500/60 bg-pink-500/15 text-pink-100";
    case "ready":
      return "border-lime-500/60 bg-lime-500/15 text-lime-100";
    case "completed":
      return "border-white/40 bg-white/10 text-white";
    case "cancelled":
      return "border-red-500/60 bg-red-500/15 text-red-100";
    default:
      return "border-white/30 bg-white/10 text-white";
  }
}
