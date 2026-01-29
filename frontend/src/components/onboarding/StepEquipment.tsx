import { EquipmentEditor } from '@/components/settings/EquipmentEditor';

interface StepEquipmentProps {
  equipment: string[];
  onEquipmentChange: (equipment: string[]) => void;
}

export function StepEquipment({ equipment, onEquipmentChange }: StepEquipmentProps) {
  return (
    <EquipmentEditor
      equipment={equipment}
      onEquipmentChange={onEquipmentChange}
      showTitle={false}
    />
  );
}
