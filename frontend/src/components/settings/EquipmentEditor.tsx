import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, X, Camera, Loader2, Check, AlertCircle, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Shared equipment options
export const equipmentOptions = [
  { id: 'bodyweight', label: 'Bodyweight Only', icon: '🏃' },
  { id: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
  { id: 'barbell', label: 'Barbell', icon: '🏋️' },
  { id: 'squat_rack', label: 'Squat Rack', icon: '🔲' },
  { id: 'bench', label: 'Bench', icon: '🪑' },
  { id: 'resistance_bands', label: 'Resistance Bands', icon: '➰' },
  { id: 'pull_up_bar', label: 'Pull-up Bar', icon: '🔳' },
  { id: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
  { id: 'cable_machine', label: 'Cable Machine', icon: '⚙️' },
  { id: 'treadmill', label: 'Treadmill', icon: '🏃' },
  { id: 'bike', label: 'Stationary Bike', icon: '🚴' },
  { id: 'rower', label: 'Rowing Machine', icon: '🚣' },
  { id: 'jump_rope', label: 'Jump Rope', icon: '🪢' },
  { id: 'ab_wheel', label: 'Ab Wheel', icon: '⭕' },
  { id: 'plyo_box', label: 'Plyo Box', icon: '📦' },
];

/**
 * Normalize equipment name for consistent storage
 */
export function normalizeEquipmentName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
}

/**
 * Format equipment name for display
 */
export function formatEquipmentName(id: string): string {
  const known = equipmentOptions.find((e) => e.id === id);
  if (known) return known.label;
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface DetectedEquipment {
  id: string;
  label: string;
  selected: boolean;
}

interface EquipmentEditorProps {
  equipment: string[];
  onEquipmentChange: (equipment: string[]) => void;
  showTitle?: boolean;
  compact?: boolean;
}

export function EquipmentEditor({
  equipment,
  onEquipmentChange,
  showTitle = true,
  compact = false,
}: EquipmentEditorProps) {
  const [customInput, setCustomInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedEquipment[]>([]);
  const [scanNotes, setScanNotes] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleEquipment = (id: string) => {
    if (equipment.includes(id)) {
      onEquipmentChange(equipment.filter((e) => e !== id));
    } else {
      onEquipmentChange([...equipment, id]);
    }
  };

  const addCustomEquipment = () => {
    const normalized = normalizeEquipmentName(customInput);
    if (normalized && !equipment.includes(normalized)) {
      onEquipmentChange([...equipment, normalized]);
      setCustomInput('');
    }
  };

  const removeEquipment = (id: string) => {
    onEquipmentChange(equipment.filter((e) => e !== id));
  };

  const standardIds = equipmentOptions.map((e) => e.id);
  const customEquipment = equipment.filter((e) => !standardIds.includes(e));

  const handleScanClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files).slice(0, 2);

    setIsScanning(true);
    setScanError(null);

    try {
      const imagePromises = selectedFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(imagePromises);

      const { data, error } = await supabase.functions.invoke('detect-equipment', {
        body: { images },
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze images');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const detected: string[] = data.detected_equipment || [];

      if (detected.length === 0) {
        setScanError('No equipment detected. Try with a clearer photo or use manual selection.');
        setIsScanning(false);
        return;
      }

      const detectedList: DetectedEquipment[] = detected.map((id) => ({
        id,
        label: formatEquipmentName(id),
        selected: true,
      }));

      setDetectedItems(detectedList);
      setScanNotes(data.notes || '');
      setShowConfirmDialog(true);
    } catch (err) {
      console.error('Equipment scan error:', err);
      const message = err instanceof Error ? err.message : 'Failed to scan equipment';
      setScanError(message);
      toast.error(message);
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleDetectedItem = (id: string) => {
    setDetectedItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const confirmDetectedEquipment = () => {
    const selectedIds = detectedItems.filter((item) => item.selected).map((item) => item.id);
    const merged = [...new Set([...equipment, ...selectedIds])];
    onEquipmentChange(merged);
    setShowConfirmDialog(false);
    setDetectedItems([]);
    toast.success(`Added ${selectedIds.length} equipment items`);
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-muted-foreground" />
          <Label className="text-base font-medium">My Equipment</Label>
        </div>
      )}

      {/* Current Equipment as Chips */}
      {equipment.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Current equipment</Label>
          <div className="flex flex-wrap gap-2">
            {equipment.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-medium"
              >
                {formatEquipmentName(item)}
                <button
                  type="button"
                  onClick={() => removeEquipment(item)}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/30 transition-colors"
                  aria-label={`Remove ${formatEquipmentName(item)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {equipment.length === 0 && (
        <p className="text-sm text-muted-foreground">No equipment added yet</p>
      )}

      {/* Camera Scan Button */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={handleScanClick}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing photos...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Scan equipment with camera
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Upload 1-2 photos of your gym. AI will detect equipment.
        </p>
        {scanError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {scanError}
          </div>
        )}
      </div>

      {/* Equipment Checklist */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Add from list</Label>
        <div className={cn(
          "grid grid-cols-2 gap-2 overflow-y-auto pr-1",
          compact ? "max-h-[25vh]" : "max-h-[30vh]"
        )}>
          {equipmentOptions.map((item) => {
            const isSelected = equipment.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleEquipment(item.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 transition-all",
                  isSelected
                    ? "border-foreground/30 bg-secondary"
                    : "border-border hover:border-foreground/20"
                )}
              >
                <Checkbox
                  id={`eq-${item.id}`}
                  checked={isSelected}
                  onCheckedChange={() => toggleEquipment(item.id)}
                />
                <span className="text-base">{item.icon}</span>
                <Label htmlFor={`eq-${item.id}`} className="cursor-pointer text-xs leading-tight">
                  {item.label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Equipment Input */}
      <div className="space-y-2">
        <Label htmlFor="custom-eq">Add custom equipment</Label>
        <div className="flex gap-2">
          <Input
            id="custom-eq"
            placeholder="e.g., TRX, Medicine Ball"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomEquipment();
              }
            }}
          />
          <Button type="button" size="icon" variant="outline" onClick={addCustomEquipment}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Custom Items Display */}
      {customEquipment.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Custom items</Label>
          <div className="flex flex-wrap gap-2">
            {customEquipment.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
              >
                {formatEquipmentName(item)}
                <button
                  type="button"
                  onClick={() => removeEquipment(item)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Detected Equipment</DialogTitle>
            <DialogDescription>
              {scanNotes || 'Review the equipment detected in your photos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto py-4">
            {detectedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleDetectedItem(item.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 transition-all",
                  item.selected
                    ? "border-primary bg-primary/10"
                    : "border-border opacity-60"
                )}
              >
                <Checkbox
                  checked={item.selected}
                  onCheckedChange={() => toggleDetectedItem(item.id)}
                />
                {item.selected && <Check className="h-4 w-4 text-primary" />}
                <span className="font-medium">{item.label}</span>
                {equipment.includes(item.id) && (
                  <span className="ml-auto text-xs text-muted-foreground">Already added</span>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDetectedEquipment}>
              Add {detectedItems.filter((i) => i.selected).length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
