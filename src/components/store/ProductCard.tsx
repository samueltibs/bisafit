import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import type { StoreProduct } from '@/types/store';

interface ProductCardProps {
  product: StoreProduct;
  onViewDetails: (product: StoreProduct) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const primaryImage = product.image_urls[0] || '/placeholder.svg';

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {product.is_featured && (
          <Badge className="absolute top-2 left-2 gap-1 bg-primary">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
        <p className="mt-1 text-sm font-medium text-primary">{product.price_display}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-3 w-full"
          onClick={() => onViewDetails(product)}
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
