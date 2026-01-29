// Store product types

export type ProductCategory = 'apparel' | 'accessories' | 'equipment';

export interface StoreProduct {
  id: string;
  name: string;
  category: ProductCategory;
  price_display: string;
  description: string | null;
  image_urls: string[];
  checkout_url: string;
  supported_regions: string[];
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  apparel: 'Apparel',
  accessories: 'Accessories',
  equipment: 'Equipment',
};

export const ALL_CATEGORIES: ProductCategory[] = ['apparel', 'accessories', 'equipment'];
