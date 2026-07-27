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

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

function escapeHtml(
  value: string,
): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sha256Hex(
  value: string,
): Promise<string> {
  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(value),
    );

  return Array.from(
    new Uint8Array(digest),
  )
    .map((byte) =>
      byte
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
}

function resolveSiteOrigin(
  requestedOrigin: string | undefined,
): string {
  const fallback =
    Deno.env.get("SITE_URL") ??
    "https://pressedinpink.com";

  if (!requestedOrigin) {
    return fallback.replace(/\/$/, "");
  }

  try {
    const parsed =
      new URL(requestedOrigin);

    const hostname =
      parsed.hostname.toLowerCase();

    const allowed =
      hostname ===
        "pressedinpink.com" ||
      hostname ===
        "www.pressedinpink.com" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(
        ".app.github.dev",
      ) ||
      hostname.endsWith(
        ".pages.dev",
      );

    return allowed
      ? parsed.origin
      : fallback.replace(/\/$/, "");
  } catch {
    return fallback.replace(/\/$/, "");
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      },
    );
  }

  if (request.method !== "POST") {
    return jsonResponse(
      {
        error:
          "Method not allowed.",
      },
      405,
    );
  }

  const authHeader =
    request.headers.get(
      "Authorization",
    );

  if (!authHeader) {
    return jsonResponse(
      {
        error:
          "Authentication is required.",
      },
      401,
    );
  }

  const supabaseUrl =
    Deno.env.get("SUPABASE_URL");
  const anonKey =
    Deno.env.get(
      "SUPABASE_ANON_KEY",
    );
  const serviceRoleKey =
    Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY",
    );
  const resendApiKey =
    Deno.env.get("RESEND_API_KEY");

  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey
  ) {
    return jsonResponse(
      {
        error:
          "Supabase function environment is incomplete.",
      },
      500,
    );
  }

  if (!resendApiKey) {
    return jsonResponse(
      {
        error:
          "RESEND_API_KEY is not configured.",
      },
      500,
    );
  }

  let body: RequestBody;

  try {
    body =
      (await request.json()) as RequestBody;
  } catch {
    return jsonResponse(
      {
        error:
          "Invalid request body.",
      },
      400,
    );
  }

  const orderId =
    body.orderId?.trim() ?? "";
  const accessToken =
    body.accessToken?.trim() ?? "";

  if (
    !orderId ||
    accessToken.length < 32
  ) {
    return jsonResponse(
      {
        error:
          "Order portal information is missing.",
      },
      400,
    );
  }

  const userClient =
    createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization:
              authHeader,
          },
        },
      },
    );

  const {
    data: {
      user,
    },
    error: userError,
  } =
    await userClient.auth.getUser();

  if (
    userError ||
    !user
  ) {
    return jsonResponse(
      {
        error:
          "The checkout session is invalid.",
      },
      401,
    );
  }

  const adminClient =
    createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

  const {
    data: order,
    error: orderError,
  } = await adminClient
    .from("orders")
    .select(
      `
        id,
        order_number,
        customer_id,
        customer_name,
        customer_email,
        status,
        portal_token_hash
      `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (
    orderError ||
    !order
  ) {
    return jsonResponse(
      {
        error:
          "Order not found.",
      },
      404,
    );
  }

  if (
    order.customer_id !==
      user.id
  ) {
    return jsonResponse(
      {
        error:
          "You cannot send email for this order.",
      },
      403,
    );
  }

  const submittedHash =
    await sha256Hex(
      accessToken,
    );

  if (
    submittedHash !==
      order.portal_token_hash
  ) {
    return jsonResponse(
      {
        error:
          "The private order token is invalid.",
      },
      403,
    );
  }

  const siteOrigin =
    resolveSiteOrigin(
      body.siteOrigin,
    );

  const portalUrl =
    `${siteOrigin}/order-status/?order=${encodeURIComponent(
      order.id,
    )}&token=${encodeURIComponent(
      accessToken,
    )}`;

  const safeName =
    escapeHtml(
      order.customer_name ||
        "there",
    );
  const safeOrderNumber =
    escapeHtml(
      order.order_number,
    );
  const safePortalUrl =
    escapeHtml(portalUrl);

  const emailHtml = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Pressed In Pink Order Update</title>
      </head>

      <body style="margin:0;padding:0;background-color:#000000;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background-color:#000000;margin:0;padding:0;">
          <tr>
            <td align="center" style="padding:32px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border:1px solid #7f1d1d;border-radius:28px;background-color:#050505;overflow:hidden;box-shadow:0 18px 42px rgba(0,0,0,.55);">
                <tr>
                  <td align="center" style="padding:34px 28px 18px;background-color:#050505;border-bottom:1px solid #450a0a;">
                    <img
                      src="https://pressedinpink.com/logo.png"
                      alt="Pressed In Pink"
                      width="150"
                      style="display:block;width:150px;max-width:100%;height:auto;margin:0 auto;border:0;"
                    />

                    <p style="margin:20px 0 0;color:#ef4444;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">
                      Order received
                    </p>

                    <h1 style="margin:12px 0 0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:31px;line-height:1.25;font-weight:900;text-shadow:0 2px 4px rgba(0,0,0,1),0 0 12px rgba(0,0,0,.95);">
                      Your order portal is ready 💕
                    </h1>

                    <p style="margin:18px auto 0;max-width:470px;color:#f3f4f6;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.75;">
                      Hi ${safeName}! Pressed In Pink received order
                      <strong style="color:#ffffff;">${safeOrderNumber}</strong>.
                      Your private page keeps every status update, quantity change,
                      unavailable design, and message in one place.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:30px 28px 34px;background-color:#0a0a0a;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" bgcolor="#e5242a" style="border-radius:999px;">
                          <a
                            href="${safePortalUrl}"
                            style="display:inline-block;padding:15px 32px;border-radius:999px;background-color:#e5242a;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:900;text-decoration:none;box-shadow:0 8px 24px rgba(229,36,42,.35);"
                          >
                            View My Order 💌
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:28px auto 0;max-width:470px;padding:18px;border:1px solid #3f3f46;border-radius:18px;background-color:#111111;">
                      <p style="margin:0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:800;">
                        Keep this link private
                      </p>

                      <p style="margin:8px 0 0;color:#a1a1aa;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.65;">
                        Anyone with the complete private link may be able to view this order.
                      </p>
                    </div>

                    <p style="margin:24px 0 0;color:#71717a;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;word-break:break-all;">
                      Button not working? Copy and paste this link:<br />
                      <span style="color:#d4d4d8;">${safePortalUrl}</span>
                    </p>
                  </td>
                </tr>

                <tr>
                  <td align="center" style="padding:20px 28px;background-color:#050505;border-top:1px solid #450a0a;">
                    <p style="margin:0;color:#ef4444;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:900;">
                      Pressed In Pink ♡
                    </p>

                    <p style="margin:7px 0 0;color:#71717a;font-family:Arial,Helvetica,sans-serif;font-size:11px;">
                      Custom creations made to stand out.
                    </p>

                    <p style="margin:7px 0 0;color:#52525b;font-family:Arial,Helvetica,sans-serif;font-size:10px;">
                      Order ${safeOrderNumber}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const resendResponse =
    await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${resendApiKey}`,
          "Content-Type":
            "application/json",
          "Idempotency-Key":
            `pnp-order-link-${order.id}`,
        },
        body: JSON.stringify({
          from:
            "Pressed In Pink <support@pressedinpink.com>",
          to: [
            order.customer_email,
          ],
          reply_to:
            "support@pressedinpink.com",
          subject:
            `Your Pressed In Pink order ${order.order_number} 💕`,
          html:
            emailHtml,
        }),
      },
    );

  const resendResult =
    await resendResponse.json();

  if (!resendResponse.ok) {
    console.error(
      "Resend response:",
      resendResult,
    );

    return jsonResponse(
      {
        error:
          "The order was saved, but its email could not be sent.",
      },
      502,
    );
  }

  return jsonResponse({
    sent: true,
    emailId:
      resendResult.id ?? null,
    portalUrl,
  });
});
