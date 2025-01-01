import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimePickerInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const TimePickerInput = ({ label, value, onChange, className = "" }: TimePickerInputProps) => {
  const [hours, minutes] = value ? value.split(":").map(Number) : [0, 0];

  const handleHourChange = (newHour: string) => {
    const hour = Math.min(23, Math.max(0, Number(newHour) || 0));
    onChange(`${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    let minute = Math.min(59, Math.max(0, Number(newMinute) || 0));
    // Round to nearest 15 minutes
    minute = Math.round(minute / 15) * 15;
    onChange(`${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => handleHourChange(e.target.value)}
          className="w-20"
        />
        <span className="mx-1">:</span>
        <select
          value={minutes}
          onChange={(e) => handleMinuteChange(e.target.value)}
          className="w-20 h-10 rounded-md border border-input bg-background px-3 py-2"
        >
          <option value="0">00</option>
          <option value="15">15</option>
          <option value="30">30</option>
          <option value="45">45</option>
        </select>
      </div>
    </div>
  );
};