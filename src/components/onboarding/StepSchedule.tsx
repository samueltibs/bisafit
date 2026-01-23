import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface StepScheduleProps {
  daysPerWeek: number;
  sessionMinutes: number;
  restDay: string;
  onDaysChange: (value: number) => void;
  onSessionChange: (value: number) => void;
  onRestDayChange: (value: string) => void;
}

export function StepSchedule({
  daysPerWeek,
  sessionMinutes,
  restDay,
  onDaysChange,
  onSessionChange,
  onRestDayChange,
}: StepScheduleProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Days per week</Label>
          <span className="text-2xl font-bold text-primary">{daysPerWeek}</span>
        </div>
        <Slider
          value={[daysPerWeek]}
          onValueChange={([v]) => onDaysChange(v)}
          min={2}
          max={6}
          step={1}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>2 days</span>
          <span>6 days</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Session duration</Label>
          <span className="text-2xl font-bold text-primary">{sessionMinutes} min</span>
        </div>
        <Slider
          value={[sessionMinutes]}
          onValueChange={([v]) => onSessionChange(v)}
          min={15}
          max={90}
          step={5}
          className="py-4"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15 min</span>
          <span>90 min</span>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Preferred rest day</Label>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => onRestDayChange(day)}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg p-2 text-xs transition-all",
                restDay === day
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <span className="font-medium">{day.slice(0, 3)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
