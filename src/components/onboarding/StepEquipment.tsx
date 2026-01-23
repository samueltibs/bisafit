import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function StepEquipment({ equipment, onEquipmentChange }: StepEquipmentProps) {
  const [customInput, setCustomInput] = useState('');

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

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-medium">What equipment do you have access to?</Label>
        <p className="text-sm text-muted-foreground">Select all that apply</p>
        
        <div className="grid grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
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
    </div>
  );
}
