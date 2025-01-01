import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Database } from "@/integrations/supabase/types";
import { X } from "lucide-react";

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
    <div className="relative border rounded-lg p-4 bg-white">
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

      <div className="grid grid-cols-12 gap-4">
        {/* Date */}
        <div className="col-span-2">
          <Label htmlFor={`date-${index}`} className="text-xs">Date</Label>
          <Input
            type="date"
            id={`date-${index}`}
            value={entry.date}
            onChange={(e) => handleChange("date", e.target.value)}
            required
            className="h-8"
          />
        </div>

        {/* Work Type */}
        <div className="col-span-2">
          <Label className="text-xs">Work Type</Label>
          <RadioGroup
            value={entry.workType}
            onValueChange={(value: WorkType) => handleChange("workType", value)}
            className="flex gap-2"
          >
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="hourly" id={`hourly-${index}`} />
              <Label htmlFor={`hourly-${index}`} className="text-xs">Hour</Label>
            </div>
            <div className="flex items-center space-x-1">
              <RadioGroupItem value="job" id={`job-${index}`} />
              <Label htmlFor={`job-${index}`} className="text-xs">Job</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Job Description */}
        <div className="col-span-3">
          <Label htmlFor={`jobDescription-${index}`} className="text-xs">Description</Label>
          <Input
            id={`jobDescription-${index}`}
            value={entry.jobDescription}
            onChange={(e) => handleChange("jobDescription", e.target.value)}
            required
            className="h-8"
          />
        </div>

        {/* Time */}
        <div className="col-span-2">
          <div className="space-y-1">
            <Label className="text-xs">Time</Label>
            <div className="flex gap-1">
              <Input
                type="time"
                value={entry.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
                required
                className="h-8"
              />
              <Input
                type="time"
                value={entry.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
                required
                className="h-8"
              />
            </div>
          </div>
        </div>

        {entry.workType === "hourly" ? (
          <>
            <div className="col-span-1.5">
              <Label htmlFor={`hours-${index}`} className="text-xs">Hours</Label>
              <Input
                type="number"
                id={`hours-${index}`}
                value={entry.hours}
                onChange={(e) => handleChange("hours", e.target.value)}
                min="0"
                step="0.5"
                required
                className="h-8"
              />
            </div>

            <div className="col-span-1.5">
              <Label htmlFor={`hourlyRate-${index}`} className="text-xs">Rate/Hr</Label>
              <Input
                type="number"
                id={`hourlyRate-${index}`}
                value={entry.hourlyRate}
                onChange={(e) => handleChange("hourlyRate", e.target.value)}
                min="0"
                step="0.01"
                required
                className="h-8"
              />
            </div>
          </>
        ) : (
          <>
            <div className="col-span-1.5">
              <Label htmlFor={`jobCount-${index}`} className="text-xs">Jobs</Label>
              <Input
                type="number"
                id={`jobCount-${index}`}
                value={entry.jobCount}
                onChange={(e) => handleChange("jobCount", e.target.value)}
                min="1"
                step="1"
                required
                className="h-8"
              />
            </div>

            <div className="col-span-1.5">
              <Label htmlFor={`jobRate-${index}`} className="text-xs">Rate/Job</Label>
              <Input
                type="number"
                id={`jobRate-${index}`}
                value={entry.jobRate}
                onChange={(e) => handleChange("jobRate", e.target.value)}
                min="0"
                step="0.01"
                required
                className="h-8"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TimeEntryItem;