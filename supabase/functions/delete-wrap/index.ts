/// <reference lib="deno.ns" />

import {
  DeleteObjectCommand,
  S3Client,
} from "npm:@aws-sdk/client-s3@3.1095.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      405,
    );
  }

  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    return jsonResponse(
      { error: "Admin authentication is required." },
      401,
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY",
  );
  const accountId = Deno.env.get("R2_ACCOUNT_ID");
  const accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
  const secretAccessKey = Deno.env.get(
    "R2_SECRET_ACCESS_KEY",
  );
  const bucketName = Deno.env.get("R2_BUCKET_NAME");

  if (
    !supabaseUrl ||
    !anonKey ||
    !serviceRoleKey ||
    !accountId ||
    !accessKeyId ||
    !secretAccessKey ||
    !bucketName
  ) {
    return jsonResponse(
      { error: "The delete function environment is incomplete." },
      500,
    );
  }

  const userClient = createClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return jsonResponse(
      { error: "The admin session is invalid." },
      401,
    );
  }

  const adminClient = createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return jsonResponse(
      { error: "Administrator access is required." },
      403,
    );
  }

  let body: { wrapId?: string };

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { error: "The delete request could not be read." },
      400,
    );
  }

  const wrapId = String(body.wrapId ?? "").trim();

  if (!wrapId) {
    return jsonResponse(
      { error: "Choose a wrap to delete." },
      400,
    );
  }

  const {
    data: wrap,
    error: wrapError,
  } = await adminClient
    .from("catalog_wraps")
    .select(
      "id, display_name, r2_original_key, r2_thumbnail_key",
    )
    .eq("id", wrapId)
    .maybeSingle();

  if (wrapError) {
    return jsonResponse(
      { error: wrapError.message },
      500,
    );
  }

  if (!wrap) {
    return jsonResponse(
      { error: "That wrap no longer exists." },
      404,
    );
  }

  const { error: deleteRecordError } =
    await adminClient
      .from("catalog_wraps")
      .delete()
      .eq("id", wrap.id);

  if (deleteRecordError) {
    return jsonResponse(
      { error: deleteRecordError.message },
      500,
    );
  }

  const r2 = new S3Client({
    region: "auto",
    endpoint:
      `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  const cleanup = await Promise.allSettled([
    r2.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: wrap.r2_original_key,
      }),
    ),
    r2.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: wrap.r2_thumbnail_key,
      }),
    ),
  ]);

  const r2CleanupWarning = cleanup.some(
    (result) => result.status === "rejected",
  );

  if (r2CleanupWarning) {
    console.error(
      "Wrap removed from catalog but R2 cleanup reported a warning.",
      cleanup,
    );
  }

  return jsonResponse({
    deleted: true,
    wrapId: wrap.id,
    displayName: wrap.display_name,
    r2CleanupWarning,
  });
});
