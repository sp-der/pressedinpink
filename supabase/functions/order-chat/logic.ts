export const SITE_URL = "https://pressedinpink.com";
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function messageBody(value: unknown): string {
  if (typeof value !== "string") throw new Error("Enter a message.");
  const body = value.replace(/\r\n?/g, "\n").trim();
  if (!body || body.length > 4000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(body)) {
    throw new Error("Messages must contain 1–4,000 characters of text.");
  }
  return body;
}

export function customerOwnsOrder(user: { id: string; is_anonymous?: boolean } | null,
  order: { customer_id: string; checkout_type: string }): boolean {
  return Boolean(user && !user.is_anonymous && order.checkout_type === "account" && user.id === order.customer_id);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!);
}

export function portalUrl(orderId: string, checkoutType: string, token: string): string {
  const url = new URL("/order-status/", SITE_URL);
  url.searchParams.set("order", orderId);
  if (checkoutType === "guest") {
    if (!token) throw new Error("Private order token is missing.");
    url.searchParams.set("token", token);
  }
  return url.href;
}
