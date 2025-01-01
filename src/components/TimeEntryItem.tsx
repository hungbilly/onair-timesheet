import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type WorkType = Database["public"]["Enums"]["work_type"];

export type TimeEntryData = {
  date: string;
  workType: WorkType;
  jobDescription: string;
  hours: string;
  hourlyRate: string;
  startTime: string;
  endTime: string;
  jobCount: string;
  jobRate: string;
};

interface TimeEntryItemProps {
  entry: TimeEntryData;
  index: number;
  onChange: (index: number, data: TimeEntryData) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const TimeEntryItem = ({ entry, index, onChange, onRemove, canRemove }: TimeEntryItemProps) => {
  const handleChange = (field: keyof TimeEntryData, value: string) => {
    onChange(index, { ...entry, [field]: value });
  };

  return (
    <div className="relative border rounded-lg p-4 bg-white space-y-4">
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={() => onRemove(index)}
        >
          <X className="h-3 w-3" />
        </Button>
      )}

      {/* Row 1: Date and Work Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm mb-1 block">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full h-9 px-3 justify-start text-left font-normal ${!entry.date && "text-muted-foreground"}`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {entry.date ? format(new Date(entry.date), "MMM dd, yyyy") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={entry.date ? new Date(entry.date) : undefined}
                onSelect={(date) => handleChange("date", date ? format(date, "yyyy-MM-dd") : "")}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-sm mb-1 block">Work Type</Label>
          <RadioGroup
            value={entry.workType}
            onValueChange={(value: WorkType) => handleChange("workType", value)}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hourly" id={`hourly-${index}`} />
              <Label htmlFor={`hourly-${index}`} className="text-sm">Hour</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="job" id={`job-${index}`} />
              <Label htmlFor={`job-${index}`} className="text-sm">Job</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* Row 2: Description and Time */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm mb-1 block">Description</Label>
          <Input
            value={entry.jobDescription}
            onChange={(e) => handleChange("jobDescription", e.target.value)}
            required
            className="h-9 text-sm px-3"
            placeholder="Enter job description"
          />
        </div>

        <div>
          <Label className="text-sm mb-1 block">Time</Label>
          <div className="flex gap-2">
            <Input
              type="time"
              value={entry.startTime}
              onChange={(e) => handleChange("startTime", e.target.value)}
              required
              className="h-9 text-sm px-2 w-full"
            />
            <Input
              type="time"
              value={entry.endTime}
              onChange={(e) => handleChange("endTime", e.target.value)}
              required
              className="h-9 text-sm px-2 w-full"
            />
          </div>
        </div>
      </div>

      {/* Row 3: Hours/Jobs and Rate */}
      <div className="grid grid-cols-2 gap-4">
        {entry.workType === "hourly" ? (
          <>
            <div>
              <Label className="text-sm mb-1 block">Hours</Label>
              <Input
                type="number"
                value={entry.hours}
                onChange={(e) => handleChange("hours", e.target.value)}
                min="0"
                step="0.5"
                required
                className="h-9 text-sm px-3"
              />
            </div>

            <div>
              <Label className="text-sm mb-1 block">Rate/Hr</Label>
              <Input
                type="number"
                value={entry.hourlyRate}
                onChange={(e) => handleChange("hourlyRate", e.target.value)}
                min="0"
                step="0.01"
                required
                className="h-9 text-sm px-3"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <Label className="text-sm mb-1 block">Jobs</Label>
              <Input
                type="number"
                value={entry.jobCount}
                onChange={(e) => handleChange("jobCount", e.target.value)}
                min="1"
                step="1"
                required
                className="h-9 text-sm px-3"
              />
            </div>

            <div>
              <Label className="text-sm mb-1 block">Rate/Job</Label>
              <Input
                type="number"
                value={entry.jobRate}
                onChange={(e) => handleChange("jobRate", e.target.value)}
                min="0"
                step="0.01"
                required
                className="h-9 text-sm px-3"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TimeEntryItem;