import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { StoreProduct, ProductCategory } from '@/types/store';

interface UseStoreProductsResult {
  products: StoreProduct[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  filterByCategory: (category: ProductCategory | 'all') => StoreProduct[];
}

export function useStoreProducts(): UseStoreProductsResult {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('store_products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform the data to match our type
      const typedProducts: StoreProduct[] = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        category: p.category as ProductCategory,
        price_display: p.price_display,
        description: p.description,
        image_urls: Array.isArray(p.image_urls) ? (p.image_urls as string[]) : [],
        checkout_url: p.checkout_url,
        supported_regions: Array.isArray(p.supported_regions) ? (p.supported_regions as string[]) : [],
        is_featured: p.is_featured ?? false,
        sort_order: p.sort_order ?? 0,
        is_active: p.is_active ?? true,
        created_at: p.created_at ?? '',
        updated_at: p.updated_at ?? '',
      }));

      setProducts(typedProducts);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch products'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filterByCategory = useCallback(
    (category: ProductCategory | 'all'): StoreProduct[] => {
      if (category === 'all') return products;
      return products.filter(p => p.category === category);
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    filterByCategory,
  };
}
