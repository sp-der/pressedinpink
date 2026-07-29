/// <reference lib="deno.ns" />

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  orderId?: string;
  accessToken?: string;
  siteOrigin?: string;
};

type ResendResult = {
  ok: boolean;
  id: string | null;
  error: string | null;
};

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function resolveSiteOrigin(
  requestedOrigin: string | undefined,
): string {
  const fallback =
    Deno.env.get("SITE_URL") ?? "https://pressedinpink.com";

  if (!requestedOrigin) {
    return fallback.replace(/\/$/, "");
  }

  try {
    const parsed = new URL(requestedOrigin);
    const hostname = parsed.hostname.toLowerCase();
    const allowed =
      hostname === "pressedinpink.com" ||
      hostname === "www.pressedinpink.com" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".app.github.dev") ||
      hostname.endsWith(".pages.dev");

    return allowed
      ? parsed.origin
      : fallback.replace(/\/$/, "");
  } catch {
    return fallback.replace(/\/$/, "");
  }
}

async function sendEmail(
  apiKey: string,
  payload: Record<string, unknown>,
  idempotencyKey: string,
): Promise<ResendResult> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      console.error("Resend response:", result);
      return {
        ok: false,
        id: null,
        error:
          result?.message ?? result?.error ?? "Email could not be sent.",
      };
    }

    return {
      ok: true,
      id: result?.id ?? null,
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      id: null,
      error:
        error instanceof Error ? error.message : "Email request failed.",
    };
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Authentication is required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) {
    return jsonResponse(
      { error: "The email function environment is incomplete." },
      500,
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const orderId = body.orderId?.trim() ?? "";
  const accessToken = body.accessToken?.trim() ?? "";

  if (!orderId || accessToken.length < 32) {
    return jsonResponse(
      { error: "Order portal information is missing." },
      400,
    );
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse({ error: "The checkout session is invalid." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .select(
      `
        id,
        order_number,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        contact_method,
        contact_value,
        customer_notes,
        status,
        portal_token_hash
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return jsonResponse({ error: "Order not found." }, 404);
  }

  if (order.customer_id !== user.id) {
    return jsonResponse(
      { error: "You cannot send email for this order." },
      403,
    );
  }

  const submittedHash = await sha256Hex(accessToken);
  if (submittedHash !== order.portal_token_hash) {
    return jsonResponse(
      { error: "The private order token is invalid." },
      403,
    );
  }

  const { count: designCount } = await adminClient
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("order_id", order.id);

  const siteOrigin = resolveSiteOrigin(body.siteOrigin);
  const portalUrl = `${siteOrigin}/order-status/?order=${encodeURIComponent(
    order.id,
  )}&token=${encodeURIComponent(accessToken)}`;
  const adminUrl = `${siteOrigin}/admin/order/?order=${encodeURIComponent(
    order.id,
  )}`;
  const safeName = escapeHtml(order.customer_name || "there");
  const safeOrderNumber = escapeHtml(order.order_number);
  const safePortalUrl = escapeHtml(portalUrl);
  const safeAdminUrl = escapeHtml(adminUrl);
  const fromEmail =
    Deno.env.get("FROM_EMAIL") ??
    "Pressed In Pink <support@pressedinpink.com>";
  const supportEmail =
    Deno.env.get("SUPPORT_EMAIL") ?? "support@pressedinpink.com";
  const notificationEmail =
    Deno.env.get("PNP_NOTIFICATION_EMAIL") ?? supportEmail;

  const customerHtml = `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
          <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border:1px solid #7f1d1d;border-radius:28px;background:#070707;overflow:hidden;">
              <tr><td align="center" style="padding:34px 28px;border-bottom:1px solid #450a0a;">
                <img src="https://pressedinpink.com/logo.png" alt="Pressed In Pink" width="150" style="display:block;width:150px;height:auto;" />
                <p style="margin:20px 0 0;color:#ef4444;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">Order received</p>
                <h1 style="margin:12px 0 0;font-size:30px;line-height:1.25;">Your order portal is ready</h1>
                <p style="margin:18px auto 0;max-width:470px;color:#e4e4e7;font-size:16px;line-height:1.7;">Hi ${safeName}! Pressed In Pink received order <strong>${safeOrderNumber}</strong>. Use your private page to follow quantity changes, approvals, and updates.</p>
              </td></tr>
              <tr><td align="center" style="padding:30px 28px 34px;">
                <a href="${safePortalUrl}" style="display:inline-block;padding:15px 32px;border-radius:999px;background:#e5242a;color:#fff;font-weight:900;text-decoration:none;">View My Order</a>
                <p style="margin:25px 0 0;color:#71717a;font-size:11px;line-height:1.7;word-break:break-all;">Keep this private link: ${safePortalUrl}</p>
              </td></tr>
              <tr><td align="center" style="padding:20px;border-top:1px solid #450a0a;color:#ef4444;font-size:13px;font-weight:900;">Pressed In Pink</td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;

  const preferredContact = escapeHtml(
    `${order.contact_method || "email"}: ${
      order.contact_value || order.customer_email
    }`,
  );
  const adminHtml = `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
          <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;border:1px solid #7f1d1d;border-radius:24px;background:#090909;overflow:hidden;">
              <tr><td style="padding:30px;">
                <p style="margin:0;color:#ef4444;font-size:12px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">New website order</p>
                <h1 style="margin:10px 0 0;font-size:28px;">${safeOrderNumber}</h1>
                <p style="margin:18px 0 0;color:#e4e4e7;line-height:1.7;"><strong>Buyer:</strong> ${escapeHtml(order.customer_name)}</p>
                <p style="margin:7px 0 0;color:#e4e4e7;"><strong>Email:</strong> ${escapeHtml(order.customer_email)}</p>
                <p style="margin:7px 0 0;color:#e4e4e7;"><strong>Preferred contact:</strong> ${preferredContact}</p>
                <p style="margin:7px 0 0;color:#e4e4e7;"><strong>Different designs:</strong> ${designCount ?? 0}</p>
                ${
                  order.customer_notes
                    ? `<div style="margin-top:18px;padding:14px;border:1px solid #3f3f46;border-radius:14px;color:#d4d4d8;"><strong>Notes:</strong><br />${escapeHtml(order.customer_notes)}</div>`
                    : ""
                }
                <p style="margin:25px 0 0;"><a href="${safeAdminUrl}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#e5242a;color:#fff;font-weight:900;text-decoration:none;">Review Order in Admin</a></p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;

  const [customerResult, adminResult] = await Promise.all([
    sendEmail(
      resendApiKey,
      {
        from: fromEmail,
        to: [order.customer_email],
        reply_to: supportEmail,
        subject: `Your Pressed In Pink order ${order.order_number}`,
        html: customerHtml,
      },
      `pnp-order-link-${order.id}`,
    ),
    sendEmail(
      resendApiKey,
      {
        from: fromEmail,
        to: [notificationEmail],
        reply_to: order.customer_email,
        subject: `New PNP order ${order.order_number} from ${order.customer_name}`,
        html: adminHtml,
      },
      `pnp-admin-new-order-${order.id}`,
    ),
  ]);

  return jsonResponse({
    sent: customerResult.ok,
    customerSent: customerResult.ok,
    adminNotified: adminResult.ok,
    customerEmailId: customerResult.id,
    adminEmailId: adminResult.id,
    customerError: customerResult.error,
    adminError: adminResult.error,
    portalUrl,
    adminUrl,
  });
});
