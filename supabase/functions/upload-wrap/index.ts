/// <reference lib="deno.ns" />

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "npm:@aws-sdk/client-s3@3.1095.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type CategoryRecord = {
  id: string;
  slug: string;
  display_name: string;
  heading: string;
  item_label: string;
  filename_prefix: string;
  image_folder: string;
  description: string;
  keywords: string;
  card_image_url: string;
  image_scale: string;
  base_image_count: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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

function cleanSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanFolder(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function cleanPrefix(value: string): string {
  return value
    .trim()
    .replace(/[\\/]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed." },
      405,
    );
  }

  const authHeader = request.headers.get(
    "Authorization",
  );

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
  const accessKeyId = Deno.env.get(
    "R2_ACCESS_KEY_ID",
  );
  const secretAccessKey = Deno.env.get(
    "R2_SECRET_ACCESS_KEY",
  );
  const bucketName = Deno.env.get("R2_BUCKET_NAME");
  const publicBaseUrl = (
    Deno.env.get("R2_PUBLIC_BASE_URL") ??
    "https://images.pressedinpink.com"
  ).replace(/\/$/, "");

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
      {
        error:
          "The upload function environment is incomplete.",
      },
      500,
    );
  }

  const userClient = createClient(
    supabaseUrl,
    anonKey,
    {
      global: {
        headers: {
          Authorization: authHeader,
        },
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

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonResponse(
      { error: "The upload form could not be read." },
      400,
    );
  }

  const file = formData.get("file");
  const thumbnail = formData.get("thumbnail");
  const requestedSlug = cleanSlug(
    String(formData.get("categorySlug") ?? ""),
  );

  if (
    !(file instanceof File) ||
    !(thumbnail instanceof File) ||
    file.type !== "image/webp" ||
    thumbnail.type !== "image/webp"
  ) {
    return jsonResponse(
      {
        error:
          "Both the full image and thumbnail must be WebP files.",
      },
      400,
    );
  }

  if (file.size > 18 * 1024 * 1024) {
    return jsonResponse(
      { error: "The converted wrap is larger than 18 MB." },
      400,
    );
  }

  if (thumbnail.size > 3 * 1024 * 1024) {
    return jsonResponse(
      { error: "The thumbnail is larger than 3 MB." },
      400,
    );
  }

  if (!requestedSlug) {
    return jsonResponse(
      { error: "Choose or create a category." },
      400,
    );
  }

  let { data: category, error: categoryError } =
    await adminClient
      .from("catalog_categories")
      .select("*")
      .eq("slug", requestedSlug)
      .maybeSingle();

  if (categoryError) {
    return jsonResponse(
      { error: categoryError.message },
      500,
    );
  }

  if (!category) {
    const displayName = String(
      formData.get("displayName") ?? "",
    ).trim();
    const itemLabel = String(
      formData.get("itemLabel") ?? displayName,
    ).trim();
    const filenamePrefix = cleanPrefix(
      String(
        formData.get("filenamePrefix") ?? requestedSlug,
      ),
    );
    const imageFolder = cleanFolder(
      String(
        formData.get("imageFolder") ?? requestedSlug,
      ),
    );
    const description = String(
      formData.get("description") ?? "",
    )
      .trim()
      .slice(0, 500);
    const keywords = String(
      formData.get("keywords") ?? "",
    )
      .trim()
      .slice(0, 500);

    if (
      displayName.length < 2 ||
      itemLabel.length < 1 ||
      !filenamePrefix ||
      !imageFolder
    ) {
      return jsonResponse(
        {
          error:
            "New categories need a name, item label, filename prefix, and folder.",
        },
        400,
      );
    }

    const { data: insertedCategory, error: insertError } =
      await adminClient
        .from("catalog_categories")
        .insert({
          slug: requestedSlug,
          display_name: displayName.slice(0, 120),
          heading: `${displayName.slice(0, 110)} Wraps`,
          item_label: itemLabel.slice(0, 100),
          filename_prefix: filenamePrefix,
          image_folder: imageFolder,
          description,
          keywords,
          base_image_count: 0,
          display_order: 1000,
          is_active: true,
        })
        .select("*")
        .single();

    if (insertError || !insertedCategory) {
      return jsonResponse(
        {
          error:
            insertError?.message ??
            "The category could not be created.",
        },
        500,
      );
    }

    category = insertedCategory;
  }

  const typedCategory = category as CategoryRecord;

  const { data: latestWrap, error: latestWrapError } =
    await adminClient
      .from("catalog_wraps")
      .select("image_number")
      .eq("category_id", typedCategory.id)
      .order("image_number", { ascending: false })
      .limit(1)
      .maybeSingle();

  if (latestWrapError) {
    return jsonResponse(
      { error: latestWrapError.message },
      500,
    );
  }

  const imageNumber =
    Math.max(
      typedCategory.base_image_count,
      latestWrap?.image_number ?? 0,
    ) + 1;
  const filenameWithoutExtension =
    `${typedCategory.filename_prefix} (${imageNumber})`;
  const sourceFilename = `${filenameWithoutExtension}.webp`;
  const originalKey =
    `wraps/${typedCategory.image_folder}/originals/${sourceFilename}`;
  const thumbnailKey =
    `wraps/${typedCategory.image_folder}/thumbnails/${sourceFilename}`;
  const fullImageUrl = `${publicBaseUrl}/${originalKey}`;
  const thumbnailUrl = `${publicBaseUrl}/${thumbnailKey}`;

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: originalKey,
        Body: new Uint8Array(await file.arrayBuffer()),
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: thumbnailKey,
        Body: new Uint8Array(
          await thumbnail.arrayBuffer(),
        ),
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  } catch (uploadError) {
    console.error("R2 upload error:", uploadError);

    return jsonResponse(
      { error: "The WebP files could not be uploaded to R2." },
      502,
    );
  }

  const { data: wrap, error: wrapError } =
    await adminClient
      .from("catalog_wraps")
      .insert({
        category_id: typedCategory.id,
        image_number: imageNumber,
        display_name:
          `${typedCategory.item_label} ${imageNumber}`,
        source_filename: sourceFilename,
        thumbnail_url: thumbnailUrl,
        full_image_url: fullImageUrl,
        r2_original_key: originalKey,
        r2_thumbnail_key: thumbnailKey,
        is_active: true,
      })
      .select("*")
      .single();

  if (wrapError || !wrap) {
    await Promise.allSettled([
      r2.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: originalKey,
        }),
      ),
      r2.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: thumbnailKey,
        }),
      ),
    ]);

    return jsonResponse(
      {
        error:
          wrapError?.message ??
          "The catalog record could not be created.",
      },
      500,
    );
  }

  let updatedCategory = typedCategory;

  if (
    !typedCategory.card_image_url &&
    typedCategory.base_image_count === 0
  ) {
    const { data: categoryWithCard } = await adminClient
      .from("catalog_categories")
      .update({ card_image_url: thumbnailUrl })
      .eq("id", typedCategory.id)
      .select("*")
      .single();

    if (categoryWithCard) {
      updatedCategory = categoryWithCard as CategoryRecord;
    }
  }

  return jsonResponse({
    uploaded: true,
    category: updatedCategory,
    wrap,
  });
});
