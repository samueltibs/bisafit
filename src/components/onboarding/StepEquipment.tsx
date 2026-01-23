import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, X, Camera, Loader2, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const equipmentOptions = [
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

interface StepEquipmentProps {
  equipment: string[];
  onEquipmentChange: (equipment: string[]) => void;
}

interface DetectedEquipment {
  id: string;
  label: string;
  selected: boolean;
}

export function StepEquipment({ equipment, onEquipmentChange }: StepEquipmentProps) {
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
    const trimmed = customInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed && !equipment.includes(trimmed)) {
      onEquipmentChange([...equipment, trimmed]);
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

    // Limit to 2 files
    const selectedFiles = Array.from(files).slice(0, 2);
    
    setIsScanning(true);
    setScanError(null);

    try {
      // Convert files to base64
      const imagePromises = selectedFiles.map((file) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(imagePromises);

      // Call the edge function
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
        setScanError('No equipment detected in the image(s). Try with a clearer photo or use manual selection.');
        setIsScanning(false);
        return;
      }

      // Map detected equipment to confirmation list
      const detectedList: DetectedEquipment[] = detected.map((id) => {
        const known = equipmentOptions.find((e) => e.id === id);
        return {
          id,
          label: known?.label || id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          selected: true, // Pre-select all detected items
        };
      });

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
      // Reset file input
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
    
    // Merge with existing equipment, avoiding duplicates
    const merged = [...new Set([...equipment, ...selectedIds])];
    onEquipmentChange(merged);
    
    setShowConfirmDialog(false);
    setDetectedItems([]);
    toast.success(`Added ${selectedIds.length} equipment items`);
  };

  return (
    <div className="space-y-6">
      {/* Photo Scan Button */}
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
          Upload 1-2 photos of your gym or equipment. AI will detect and suggest items.
        </p>
        {scanError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {scanError}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or select manually</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">What equipment do you have access to?</Label>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        
        <div className="grid grid-cols-2 gap-2 max-h-[35vh] overflow-y-auto pr-1">
          {equipmentOptions.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleEquipment(item.id)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all",
                equipment.includes(item.id)
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <Checkbox
                id={item.id}
                checked={equipment.includes(item.id)}
                onCheckedChange={() => toggleEquipment(item.id)}
              />
              <span className="text-lg">{item.icon}</span>
              <Label htmlFor={item.id} className="cursor-pointer text-sm">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {customEquipment.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Custom equipment</Label>
          <div className="flex flex-wrap gap-2">
            {customEquipment.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-primary/20 px-3 py-1 text-sm"
              >
                {item.replace(/_/g, ' ')}
                <button
                  type="button"
                  onClick={() => removeEquipment(item)}
                  className="ml-1 rounded-full p-0.5 hover:bg-primary/30"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="custom-equipment">Add custom equipment</Label>
        <div className="flex gap-2">
          <Input
            id="custom-equipment"
            placeholder="e.g., TRX, Medicine Ball"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEquipment())}
          />
          <Button type="button" size="icon" variant="outline" onClick={addCustomEquipment}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

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
