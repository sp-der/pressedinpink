
export type WrapCategoryConfig = {
  slug: string;
  displayName: string;
  heading: string;
  itemLabel: string;
  filenamePrefix: string;
  imageFolder: string;
  totalImages: number;
  displayOrientation?: "upright" | "landscape";
  backHref: string;
  backLabel: string;
  footerHref: string;
  footerLabel: string;
  baseThumbnailsAlreadyRotated?: boolean;
  baseImagesAlreadyRotated?: boolean;
};
