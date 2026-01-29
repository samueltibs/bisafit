import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';

interface OptionalAdditionsListProps {
  additions: string[];
}

export function OptionalAdditionsList({ additions }: OptionalAdditionsListProps) {
  if (!additions || additions.length === 0) return null;

  return (
    <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
          <ShoppingBag className="h-4 w-4" />
          Optional add-ons (not required)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {additions.map((item, i) => (
            <Badge key={i} variant="outline" className="text-xs bg-background">
              {item}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          These common items can enhance your meals but aren't necessary.
        </p>
      </CardContent>
    </Card>
  );
}
