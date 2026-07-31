/// <reference lib="deno.ns" />

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  orderId?: unknown;
  accessToken?: unknown;
  siteOrigin?: unknown;
};

type ResendResult = {
  ok: boolean;
  id: string | null;
  error: string | null;
};

type OrderRecord = {
  id: unknown;
  order_number: unknown;
  customer_id: unknown;
  customer_name: unknown;
  customer_email: unknown;
  customer_phone: unknown;
  contact_method: unknown;
  contact_value: unknown;
  customer_notes: unknown;
  status: unknown;
  portal_token_hash: unknown;
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

function toText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
}

function escapeHtml(value: unknown): string {
  return toText(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return toText(error, "Unknown function error.");
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

function resolveSiteOrigin(requestedOrigin: unknown): string {
  const fallback =
    Deno.env.get("SITE_URL") ?? "https://pressedinpink.com";
  const requested = toText(requestedOrigin).trim();

  if (!requested) {
    return fallback.replace(/\/$/, "");
  }

  try {
    const parsed = new URL(requested);
    const hostname = parsed.hostname.toLowerCase();
    const allowed =
      hostname === "pressedinpink.com" ||
      hostname === "www.pressedinpink.com" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".app.github.dev") ||
      hostname.endsWith(".pages.dev");

    return allowed ? parsed.origin : fallback.replace(/\/$/, "");
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

    const responseText = await response.text();
    let result: Record<string, unknown> = {};

    if (responseText) {
      try {
        result = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        result = { message: responseText };
      }
    }

    if (!response.ok) {
      console.error("Resend rejected email:", {
        status: response.status,
        idempotencyKey,
        result,
      });

      return {
        ok: false,
        id: null,
        error: toText(
          result.message ?? result.error,
          `Resend returned HTTP ${response.status}.`,
        ),
      };
    }

    return {
      ok: true,
      id: toText(result.id) || null,
      error: null,
    };
  } catch (error) {
    console.error("Resend request failed:", {
      idempotencyKey,
      message: errorMessage(error),
    });

    return {
      ok: false,
      id: null,
      error: errorMessage(error),
    };
  }
}

Deno.serve(async (request) => {
  const diagnosticId = crypto.randomUUID();
  let stage = "request-start";

  try {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }

    stage = "authorization-header";
    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Authentication is required." }, 401);
    }

    stage = "environment-check";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const missingEnvironment = [
      ["SUPABASE_URL", supabaseUrl],
      ["SUPABASE_ANON_KEY", anonKey],
      ["SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey],
      ["RESEND_API_KEY", resendApiKey],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey ||
      !resendApiKey
    ) {
      console.error("Missing Edge Function environment values:", {
        diagnosticId,
        missingEnvironment,
      });

      return jsonResponse(
        {
          error: "The email function environment is incomplete.",
          missing: missingEnvironment,
          diagnosticId,
        },
        500,
      );
    }

    stage = "request-body";
    let body: RequestBody;

    try {
      body = (await request.json()) as RequestBody;
    } catch {
      return jsonResponse({ error: "Invalid request body." }, 400);
    }

    const orderId = toText(body.orderId).trim();
    const accessToken = toText(body.accessToken).trim();

    if (!orderId || accessToken.length < 32) {
      return jsonResponse(
        { error: "Order portal information is missing." },
        400,
      );
    }

    stage = "customer-authentication";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("Checkout user validation failed:", {
        diagnosticId,
        message: userError?.message ?? "No user was returned.",
      });

      return jsonResponse({ error: "The checkout session is invalid." }, 401);
    }

    stage = "order-query";
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: rawOrder, error: orderError } = await adminClient
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

    if (orderError || !rawOrder) {
      console.error("Order query failed:", {
        diagnosticId,
        orderId,
        message: orderError?.message ?? "No order was returned.",
        code: orderError?.code ?? null,
      });

      return jsonResponse({ error: "Order not found." }, 404);
    }

    const order = rawOrder as OrderRecord;
    const orderRecordId = toText(order.id);
    const orderCustomerId = toText(order.customer_id);
    const orderNumber = toText(order.order_number, "Order");
    const customerName = toText(order.customer_name, "Customer").trim();
    const customerEmail = toText(order.customer_email).trim();
    const portalTokenHash = toText(order.portal_token_hash).trim();

    if (!orderRecordId || !customerEmail || !portalTokenHash) {
      console.error("Order is missing required email fields:", {
        diagnosticId,
        orderId,
        hasOrderId: Boolean(orderRecordId),
        hasCustomerEmail: Boolean(customerEmail),
        hasPortalTokenHash: Boolean(portalTokenHash),
      });

      return jsonResponse(
        {
          error: "This order is missing information required for email.",
          diagnosticId,
        },
        422,
      );
    }

    if (orderCustomerId !== user.id) {
      return jsonResponse(
        { error: "You cannot send email for this order." },
        403,
      );
    }

    stage = "portal-token-validation";
    const submittedHash = await sha256Hex(accessToken);

    if (submittedHash !== portalTokenHash) {
      return jsonResponse(
        { error: "The private order token is invalid." },
        403,
      );
    }

    stage = "order-item-count";
    const { count: designCount, error: countError } = await adminClient
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderRecordId);

    if (countError) {
      console.warn("Could not count order designs:", {
        diagnosticId,
        orderId: orderRecordId,
        message: countError.message,
      });
    }

    stage = "email-content";
    const siteOrigin = resolveSiteOrigin(body.siteOrigin);
    const portalUrl = `${siteOrigin}/order-status/?order=${encodeURIComponent(
      orderRecordId,
    )}&token=${encodeURIComponent(accessToken)}`;
    const adminUrl = `${siteOrigin}/admin/order/?order=${encodeURIComponent(
      orderRecordId,
    )}`;

    const safeName = escapeHtml(customerName || "there");
    const safeOrderNumber = escapeHtml(orderNumber);
    const safePortalUrl = escapeHtml(portalUrl);
    const safeAdminUrl = escapeHtml(adminUrl);
    const safeCustomerEmail = escapeHtml(customerEmail);

    const fromEmail =
      Deno.env.get("FROM_EMAIL") ??
      "Pressed In Pink <support@pressedinpink.com>";
    const supportEmail =
      Deno.env.get("SUPPORT_EMAIL") ?? "support@pressedinpink.com";
    const notificationEmail =
      Deno.env.get("PNP_NOTIFICATION_EMAIL") ?? supportEmail;

    const preferredContact = escapeHtml(
      `${toText(order.contact_method, "email")}: ${toText(
        order.contact_value,
        customerEmail,
      )}`,
    );

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

    const safeNotes = toText(order.customer_notes).trim();
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
                  <p style="margin:18px 0 0;color:#e4e4e7;line-height:1.7;"><strong>Buyer:</strong> ${escapeHtml(customerName)}</p>
                  <p style="margin:7px 0 0;color:#e4e4e7;"><strong>Email:</strong> ${safeCustomerEmail}</p>
                  <p style="margin:7px 0 0;color:#e4e4e7;"><strong>Preferred contact:</strong> ${preferredContact}</p>
                  <p style="margin:7px 0 0;color:#e4e4e7;"><strong>Different designs:</strong> ${designCount ?? 0}</p>
                  ${
                    safeNotes
                      ? `<div style="margin-top:18px;padding:14px;border:1px solid #3f3f46;border-radius:14px;color:#d4d4d8;"><strong>Notes:</strong><br />${escapeHtml(safeNotes)}</div>`
                      : ""
                  }
                  <p style="margin:25px 0 0;"><a href="${safeAdminUrl}" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#e5242a;color:#fff;font-weight:900;text-decoration:none;">Review Order in Admin</a></p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>`;

    stage = "resend-delivery";
    const [customerResult, adminResult] = await Promise.all([
      sendEmail(
        resendApiKey,
        {
          from: fromEmail,
          to: [customerEmail],
          reply_to: supportEmail,
          subject: `Your Pressed In Pink order ${orderNumber}`,
          html: customerHtml,
        },
        `pnp-order-link-${orderRecordId}`,
      ),
      sendEmail(
        resendApiKey,
        {
          from: fromEmail,
          to: [notificationEmail],
          reply_to: customerEmail,
          subject: `New PNP order ${orderNumber} from ${customerName}`,
          html: adminHtml,
        },
        `pnp-admin-new-order-${orderRecordId}`,
      ),
    ]);

    console.log("Order email attempt completed:", {
      diagnosticId,
      orderId: orderRecordId,
      customerSent: customerResult.ok,
      adminNotified: adminResult.ok,
    });

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
      diagnosticId,
    });
  } catch (error) {
    const message = errorMessage(error);

    console.error("Unhandled send-order-link error:", {
      diagnosticId,
      stage,
      message,
      stack: error instanceof Error ? error.stack : null,
    });

    return jsonResponse(
      {
        error: "The order email function encountered an internal error.",
        stage,
        detail: message,
        diagnosticId,
      },
      500,
    );
  }
});
