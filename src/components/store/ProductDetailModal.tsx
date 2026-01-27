import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ExternalLink, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { StoreProduct } from '@/types/store';
import { cn } from '@/lib/utils';

interface ProductDetailModalProps {
  product: StoreProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLORS = [
  { name: 'Black', value: 'black', className: 'bg-gray-900' },
  { name: 'White', value: 'white', className: 'bg-white border border-gray-300' },
  { name: 'Navy', value: 'navy', className: 'bg-blue-900' },
  { name: 'Gray', value: 'gray', className: 'bg-gray-500' },
];

export function ProductDetailModal({ product, open, onOpenChange }: ProductDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  if (!product) return null;

  const images = product.image_urls.length > 0 ? product.image_urls : ['/placeholder.svg'];
  const isApparel = product.category === 'apparel';

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleBuyNow = () => {
    // Open checkout URL in new tab
    window.open(product.checkout_url, '_blank', 'noopener,noreferrer');
    
    // Show success toast when user returns
    toast({
      title: "Thanks for supporting BisaFit 💪",
      description: "Complete your purchase in the checkout window.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {product.name}
            {product.is_featured && (
              <Badge className="gap-1 bg-primary">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Image Carousel */}
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <img
              src={images[currentImageIndex]}
              alt={`${product.name} - Image ${currentImageIndex + 1}`}
              className="h-full w-full object-cover"
            />
            
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                
                {/* Image indicators */}
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        idx === currentImageIndex ? "bg-primary" : "bg-background/60"
                      )}
                      onClick={() => setCurrentImageIndex(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-2xl font-bold text-primary">{product.price_display}</p>
              <p className="mt-2 text-sm text-muted-foreground">{product.description}</p>
            </div>

            {/* Size Selector (Apparel only) */}
            {isApparel && (
              <div>
                <label className="text-sm font-medium">Size</label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Color Selector */}
            <div>
              <label className="text-sm font-medium">Color</label>
              <div className="mt-2 flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      color.className,
                      selectedColor === color.value
                        ? "ring-2 ring-primary ring-offset-2"
                        : "hover:ring-1 hover:ring-muted-foreground"
                    )}
                    title={color.name}
                    onClick={() => setSelectedColor(color.value)}
                  />
                ))}
              </div>
            </div>

            {/* Buy Now CTA */}
            <div className="mt-auto space-y-2">
              <Button 
                size="lg" 
                className="w-full gap-2"
                onClick={handleBuyNow}
              >
                Buy Now
                <ExternalLink className="h-4 w-4" />
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Checkout supports cards and local payment methods where available.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
