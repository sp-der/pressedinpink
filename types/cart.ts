
export type WrapProduct = {
  id: string;
  displayName: string;
  categorySlug: string;
  categoryName: string;
  imageNumber: number;
  sourceFilename: string;
  thumbnailUrl: string;
  fullImageUrl: string;
};

export type CartItem = WrapProduct & {
  quantity: number;
};
