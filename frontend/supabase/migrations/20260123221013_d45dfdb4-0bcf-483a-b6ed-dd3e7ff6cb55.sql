-- Create store_products table for external checkout store
CREATE TABLE public.store_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('apparel', 'accessories', 'equipment')),
  price_display TEXT NOT NULL,
  description TEXT,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  checkout_url TEXT NOT NULL,
  supported_regions JSONB DEFAULT '[]'::jsonb,
  is_featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (products are publicly readable)
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Public read access for all products
CREATE POLICY "Store products are publicly readable"
ON public.store_products
FOR SELECT
USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_store_products_updated_at
BEFORE UPDATE ON public.store_products
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert sample products
INSERT INTO public.store_products (name, category, price_display, description, image_urls, checkout_url, supported_regions, is_featured, sort_order) VALUES
('BisaFit Training Tee', 'apparel', 'From $25', 'Lightweight, moisture-wicking training tee with the BisaFit logo. Perfect for your workouts.', '["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800", "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800"]', 'https://example.com/checkout/training-tee', '["US", "UG", "EU", "UK", "KE", "NG"]', true, 1),
('Performance Shorts', 'apparel', 'From $35', 'Breathable athletic shorts with hidden pocket. Available in multiple colors.', '["https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800", "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800"]', 'https://example.com/checkout/performance-shorts', '["US", "UG", "EU", "UK", "KE", "NG"]', true, 2),
('Resistance Band Set', 'equipment', 'From $20', 'Complete set of 5 resistance bands with varying tensions. Perfect for home workouts.', '["https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=800"]', 'https://example.com/checkout/resistance-bands', '["US", "UG", "EU", "UK", "KE", "NG"]', true, 3),
('BisaFit Water Bottle', 'accessories', 'From $15', '750ml insulated stainless steel water bottle. Keeps drinks cold for 24 hours.', '["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800"]', 'https://example.com/checkout/water-bottle', '["US", "UG", "EU", "UK", "KE", "NG"]', false, 4),
('Training Cap', 'accessories', 'From $18', 'Lightweight breathable cap with adjustable strap. One size fits most.', '["https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800"]', 'https://example.com/checkout/training-cap', '["US", "UG", "EU", "UK", "KE", "NG"]', false, 5),
('Gym Bag', 'accessories', 'From $45', 'Durable gym bag with shoe compartment and multiple pockets.', '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"]', 'https://example.com/checkout/gym-bag', '["US", "UG", "EU", "UK", "KE", "NG"]', true, 6),
('Compression Leggings', 'apparel', 'From $40', 'High-waisted compression leggings with side pocket. Squat-proof fabric.', '["https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800", "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=800"]', 'https://example.com/checkout/compression-leggings', '["US", "UG", "EU", "UK", "KE", "NG"]', false, 7),
('Foam Roller', 'equipment', 'From $28', 'High-density foam roller for muscle recovery and mobility work.', '["https://images.unsplash.com/photo-1599058917212-d750089bc07e?w=800"]', 'https://example.com/checkout/foam-roller', '["US", "UG", "EU", "UK", "KE", "NG"]', false, 8);