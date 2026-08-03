export type CatalogCategoryRecord = {
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

export type CatalogWrapRecord = {
  id: string;
  category_id: string;
  image_number: number;
  display_name: string;
  source_filename: string;
  thumbnail_url: string;
  full_image_url: string;
  r2_original_key: string;
  r2_thumbnail_key: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogUploadResult = {
  category: CatalogCategoryRecord;
  wrap: CatalogWrapRecord;
};
