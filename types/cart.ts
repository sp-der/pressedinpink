export type ProductMediaType =
  | "image"
  | "video";

export type ProductType =
  | "wrap"
  | "cup";

export type WrapProduct = {
  id: string;
  displayName: string;
  categorySlug: string;
  categoryName: string;
  imageNumber: number;
  sourceFilename: string;
  thumbnailUrl: string;
  fullImageUrl: string;
  productType?: ProductType;
  mediaType?: ProductMediaType;
  isOneOfOne?: boolean;
  detailHref?: string;
};

export type CartItem = WrapProduct & {
  quantity: number;
};
