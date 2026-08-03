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
  parent_slug: string | null;
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

const PUBLIC_IMAGE_ORIGIN =
  "https://images.pressedinpink.com";

function buildPublicObjectUrl(
  objectKey: string,
): string {
  const encodedKey = objectKey
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${PUBLIC_IMAGE_ORIGIN}/${encodedKey}`;
}

function objectKeyFromPublicUrl(
  value: string,
): string | null {
  try {
    const url = new URL(value);

    if (url.origin !== PUBLIC_IMAGE_ORIGIN) {
      return null;
    }

    return decodeURIComponent(
      url.pathname.replace(/^\/+/, ""),
    );
  } catch {
    return null;
  }
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

  const action = String(
    formData.get("action") ?? "upload-wrap",
  );
  const fileValue = formData.get("file");
  const thumbnailValue = formData.get("thumbnail");
  const categoryImageValue =
    formData.get("categoryImage");
  const wrapFile =
    fileValue instanceof File ? fileValue : null;
  const wrapThumbnail =
    thumbnailValue instanceof File
      ? thumbnailValue
      : null;
  const categoryImage =
    categoryImageValue instanceof File
      ? categoryImageValue
      : null;
  const categoryImageOnly =
    action === "category-image";
  const requestedSlug = cleanSlug(
    String(formData.get("categorySlug") ?? ""),
  );
  const hasParentSlugField = formData.has("parentSlug");
  const requestedParentSlug = cleanSlug(
    String(formData.get("parentSlug") ?? ""),
  );
  const parentSlug = requestedParentSlug || null;

  if (
    action !== "upload-wrap" &&
    action !== "category-image"
  ) {
    return jsonResponse(
      { error: "The requested upload action is invalid." },
      400,
    );
  }

  if (!requestedSlug) {
    return jsonResponse(
      { error: "Choose or create a category." },
      400,
    );
  }

  if (categoryImageOnly && !categoryImage) {
    return jsonResponse(
      { error: "Choose a category image." },
      400,
    );
  }

  if (categoryImage) {
    if (categoryImage.type !== "image/webp") {
      return jsonResponse(
        {
          error:
            "The category image must be converted to WebP.",
        },
        400,
      );
    }

    if (categoryImage.size > 8 * 1024 * 1024) {
      return jsonResponse(
        {
          error:
            "The converted category image is larger than 8 MB.",
        },
        400,
      );
    }
  }

  if (!categoryImageOnly) {
    if (
      !wrapFile ||
      !wrapThumbnail ||
      wrapFile.type !== "image/webp" ||
      wrapThumbnail.type !== "image/webp"
    ) {
      return jsonResponse(
        {
          error:
            "Both the full image and thumbnail must be WebP files.",
        },
        400,
      );
    }

    if (wrapFile.size > 18 * 1024 * 1024) {
      return jsonResponse(
        {
          error:
            "The converted wrap is larger than 18 MB.",
        },
        400,
      );
    }

    if (wrapThumbnail.size > 3 * 1024 * 1024) {
      return jsonResponse(
        { error: "The thumbnail is larger than 3 MB." },
        400,
      );
    }
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

  if (category && hasParentSlugField) {
    const {
      data: categoryWithParent,
      error: parentCategoryError,
    } = await adminClient
      .from("catalog_categories")
      .update({ parent_slug: parentSlug })
      .eq("id", category.id)
      .select("*")
      .single();

    if (parentCategoryError || !categoryWithParent) {
      return jsonResponse(
        {
          error:
            parentCategoryError?.message ??
            "The category location could not be saved.",
        },
        500,
      );
    }

    category = categoryWithParent;
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
          parent_slug: parentSlug,
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
  let updatedCategory = typedCategory;

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  if (categoryImage) {
    const categoryImageKey = [
      "category-cards",
      `${requestedSlug}-${Date.now()}-${crypto
        .randomUUID()
        .slice(0, 8)}.webp`,
    ].join("/");
    const categoryImageUrl =
      buildPublicObjectUrl(categoryImageKey);
    const previousCategoryImageKey =
      objectKeyFromPublicUrl(
        updatedCategory.card_image_url ?? "",
      );

    try {
      await r2.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: categoryImageKey,
          Body: new Uint8Array(
            await categoryImage.arrayBuffer(),
          ),
          ContentType: "image/webp",
          CacheControl:
            "public, max-age=31536000, immutable",
        }),
      );
    } catch (uploadError) {
      console.error(
        "R2 category image upload error:",
        uploadError,
      );

      return jsonResponse(
        {
          error:
            "The category image could not be uploaded to R2.",
        },
        502,
      );
    }

    const {
      data: categoryWithImage,
      error: categoryImageError,
    } = await adminClient
      .from("catalog_categories")
      .update({
        card_image_url: categoryImageUrl,
      })
      .eq("id", typedCategory.id)
      .select("*")
      .single();

    if (categoryImageError || !categoryWithImage) {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: categoryImageKey,
        }),
      ).catch(() => undefined);

      return jsonResponse(
        {
          error:
            categoryImageError?.message ??
            "The category image record could not be updated.",
        },
        500,
      );
    }

    updatedCategory =
      categoryWithImage as CategoryRecord;

    if (
      previousCategoryImageKey &&
      previousCategoryImageKey.startsWith(
        "category-cards/",
      ) &&
      previousCategoryImageKey !== categoryImageKey
    ) {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: previousCategoryImageKey,
        }),
      ).catch(() => undefined);
    }
  }

  if (categoryImageOnly) {
    return jsonResponse({
      uploaded: true,
      categoryImageUploaded: true,
      category: updatedCategory,
    });
  }

  if (!wrapFile || !wrapThumbnail) {
    return jsonResponse(
      { error: "Choose the wrap files to upload." },
      400,
    );
  }

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
  const fullImageUrl =
    buildPublicObjectUrl(originalKey);
  const thumbnailUrl =
    buildPublicObjectUrl(thumbnailKey);

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: originalKey,
        Body: new Uint8Array(await wrapFile.arrayBuffer()),
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: thumbnailKey,
        Body: new Uint8Array(
          await wrapThumbnail.arrayBuffer(),
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

  if (
    !updatedCategory.card_image_url &&
    updatedCategory.base_image_count === 0
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
