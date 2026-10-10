"use client";

import { useState } from "react";

import { categoryUsesDisplayReadyUploads } from "@/lib/wrapOrientation";
import type { OrderItemRecord } from "@/types/orders";

type Props = {
  item: OrderItemRecord;
  alt: string;
};

export default function OrderItemImage({ item, alt }: Props) {
  const staysUpright = item.category_slug.startsWith("custom-cup-") ||
    item.category_slug === "sanitizer-wraps";
  const [needsRotation, setNeedsRotation] = useState(
    !staysUpright && !categoryUsesDisplayReadyUploads([
      item.category_slug,
      item.category_name,
    ]),
  );

  return (
    <img
      src={item.thumbnail_url}
      alt={alt}
      onLoad={(event) => {
        const image = event.currentTarget;
        // Legacy regular wraps are stored portrait; newer uploads and some
        // thumbnails are already landscape. Recheck when the full image loads.
        setNeedsRotation(!staysUpright && image.naturalHeight > image.naturalWidth);
      }}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.getAttribute("src") !== item.full_image_url) {
          image.src = item.full_image_url;
        }
      }}
      className={needsRotation
        ? "absolute left-1/2 top-1/2 h-[200%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 rotate-90 object-contain"
        : "absolute inset-0 h-full w-full object-contain"}
    />
  );
}
