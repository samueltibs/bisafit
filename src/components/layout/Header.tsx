import { Dumbbell } from 'lucide-react';

interface HeaderProps {
  title?: string;
}

export function Header({ title = 'BisaFit' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-14 items-center gap-2 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Dumbbell className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">{title}</span>
        </div>
      </div>
    </header>
  );
}
