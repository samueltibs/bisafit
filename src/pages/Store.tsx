import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, AlertCircle } from 'lucide-react';
import { ProductCard, ProductDetailModal } from '@/components/store';
import { useStoreProducts } from '@/hooks/useStoreProducts';
import type { StoreProduct, ProductCategory } from '@/types/store';
import { ALL_CATEGORIES, CATEGORY_LABELS } from '@/types/store';

type FilterCategory = ProductCategory | 'all';

export default function Store() {
  const { products, loading, error, filterByCategory } = useStoreProducts();
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const displayedProducts = filterByCategory(activeCategory);

  const handleViewDetails = (product: StoreProduct) => {
    setSelectedProduct(product);
    setDetailOpen(true);
  };

  return (
    <AppLayout>
      <div className="container space-y-6 px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Store</h1>
            <p className="text-sm text-muted-foreground">
              Official BisaFit gear & equipment
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs 
          value={activeCategory} 
          onValueChange={(v) => setActiveCategory(v as FilterCategory)}
          className="w-full"
        >
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {ALL_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Helper text */}
        <p className="text-xs text-muted-foreground">
          Shipping & payment options are calculated at checkout.
        </p>

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h3 className="mt-4 text-lg font-semibold">Failed to load products</h3>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && displayedProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No products found</h3>
            <p className="text-sm text-muted-foreground">
              {activeCategory !== 'all' 
                ? `No ${CATEGORY_LABELS[activeCategory].toLowerCase()} available yet.`
                : 'Check back soon for new products!'}
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && displayedProducts.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}

        {/* Product Detail Modal */}
        <ProductDetailModal
          product={selectedProduct}
          open={detailOpen}
          onOpenChange={setDetailOpen}
        />
      </div>
    </AppLayout>
  );
}
