// Publish only owner-approved images with documented permission. Do not include
// customer names, portraits or testimonials. Empty means the section is hidden.
// See docs/storefront-redesign.md for the publishing checklist.
export type CustomerCreation = {
  image: string;
  alt: string;
  caption: string;
  permissionReference: string;
};
export const customerCreations: CustomerCreation[] = [];
