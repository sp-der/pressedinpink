/// <reference lib="deno.ns" />

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  orderId?: string;
  invoiceId?: string;
  pdfBase64?: string;
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Admin authentication is required." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey) {
    return jsonResponse(
      { error: "The invoice function environment is incomplete." },
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
  const invoiceId = body.invoiceId?.trim() ?? "";
  const pdfBase64 = body.pdfBase64?.trim() ?? "";

  if (!orderId || !invoiceId || pdfBase64.length < 100) {
    return jsonResponse({ error: "Invoice information is missing." }, 400);
  }

  if (pdfBase64.length > 12_000_000 || !/^[A-Za-z0-9+/=]+$/.test(pdfBase64)) {
    return jsonResponse({ error: "The invoice PDF is invalid or too large." }, 400);
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
    return jsonResponse({ error: "The admin session is invalid." }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return jsonResponse({ error: "Administrator access is required." }, 403);
  }

  const { data: invoice, error: invoiceError } = await adminClient
    .from("invoices")
    .select(
      `
        id,
        invoice_number,
        order_id,
        customer_name,
        customer_email,
        total,
        status,
        updated_at
      `,
    )
    .eq("id", invoiceId)
    .eq("order_id", orderId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return jsonResponse({ error: "Invoice not found." }, 404);
  }

  const { data: order, error: orderError } = await adminClient
    .from("orders")
    .select("id, order_number, customer_name, customer_email")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return jsonResponse({ error: "Order not found." }, 404);
  }

  const fromEmail =
    Deno.env.get("FROM_EMAIL") ??
    "Pressed In Pink <support@pressedinpink.com>";
  const supportEmail =
    Deno.env.get("SUPPORT_EMAIL") ?? "support@pressedinpink.com";
  const safeName = escapeHtml(order.customer_name || "there");
  const safeInvoice = escapeHtml(invoice.invoice_number);
  const safeOrder = escapeHtml(order.order_number);
  const total = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(invoice.total));

  const html = `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;padding:0;background:#000;color:#fff;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000;padding:32px 16px;">
          <tr><td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border:1px solid #7f1d1d;border-radius:28px;background:#070707;overflow:hidden;">
              <tr><td align="center" style="padding:34px 28px;border-bottom:1px solid #450a0a;">
                <img src="https://pressedinpink.com/logo.png" alt="Pressed In Pink" width="150" style="display:block;width:150px;height:auto;" />
                <p style="margin:20px 0 0;color:#ef4444;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;">Invoice ready</p>
                <h1 style="margin:12px 0 0;font-size:30px;">${safeInvoice}</h1>
                <p style="margin:18px auto 0;max-width:470px;color:#e4e4e7;font-size:16px;line-height:1.7;">Hi ${safeName}, your invoice for order <strong>${safeOrder}</strong> is attached as a PDF.</p>
                <p style="margin:20px 0 0;color:#fff;font-size:22px;font-weight:900;">Total: ${escapeHtml(total)}</p>
              </td></tr>
              <tr><td align="center" style="padding:26px;color:#a1a1aa;font-size:13px;line-height:1.7;">Questions or changes? Reply to this email and Pressed In Pink will help.</td></tr>
            </table>
          </td></tr>
        </table>
      </body>
    </html>`;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `pnp-invoice-${invoice.id}-${invoice.updated_at}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [order.customer_email],
      reply_to: supportEmail,
      subject: `Pressed In Pink invoice ${invoice.invoice_number}`,
      html,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdfBase64,
        },
      ],
    }),
  });
  const resendResult = await resendResponse.json();

  if (!resendResponse.ok) {
    console.error("Resend response:", resendResult);
    return jsonResponse(
      { error: resendResult?.message ?? "The invoice email could not be sent." },
      502,
    );
  }

  const sentAt = new Date().toISOString();
  await adminClient
    .from("invoices")
    .update({ status: "sent", sent_at: sentAt })
    .eq("id", invoice.id);
  await adminClient
    .from("orders")
    .update({ status: "invoice_sent" })
    .eq("id", order.id);
  await adminClient.from("order_events").insert({
    order_id: order.id,
    event_type: "invoice_sent",
    message: `Invoice ${invoice.invoice_number} was emailed to the customer.`,
    created_by: user.id,
  });

  return jsonResponse({
    sent: true,
    emailId: resendResult?.id ?? null,
    sentAt,
  });
});
