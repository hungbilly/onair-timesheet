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
    <div className="space-y-4 p-4 border rounded-lg relative">
      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={() => onRemove(index)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="grid w-full gap-1.5">
        <Label htmlFor={`date-${index}`}>Date</Label>
        <Input
          type="date"
          id={`date-${index}`}
          value={entry.date}
          onChange={(e) => handleChange("date", e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label>Work Type</Label>
        <RadioGroup
          value={entry.workType}
          onValueChange={(value: WorkType) => handleChange("workType", value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hourly" id={`hourly-${index}`} />
            <Label htmlFor={`hourly-${index}`}>By Hour</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="job" id={`job-${index}`} />
            <Label htmlFor={`job-${index}`}>By Job</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor={`jobDescription-${index}`}>Job Description</Label>
        <Textarea
          id={`jobDescription-${index}`}
          value={entry.jobDescription}
          onChange={(e) => handleChange("jobDescription", e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor={`startTime-${index}`}>Start Time</Label>
        <Input
          type="time"
          id={`startTime-${index}`}
          value={entry.startTime}
          onChange={(e) => handleChange("startTime", e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor={`endTime-${index}`}>End Time</Label>
        <Input
          type="time"
          id={`endTime-${index}`}
          value={entry.endTime}
          onChange={(e) => handleChange("endTime", e.target.value)}
          required
        />
      </div>

      {entry.workType === "hourly" ? (
        <>
          <div className="grid w-full gap-1.5">
            <Label htmlFor={`hours-${index}`}>Hours</Label>
            <Input
              type="number"
              id={`hours-${index}`}
              value={entry.hours}
              onChange={(e) => handleChange("hours", e.target.value)}
              min="0"
              step="0.5"
              required
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor={`hourlyRate-${index}`}>Hourly Rate</Label>
            <Input
              type="number"
              id={`hourlyRate-${index}`}
              value={entry.hourlyRate}
              onChange={(e) => handleChange("hourlyRate", e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid w-full gap-1.5">
            <Label htmlFor={`jobCount-${index}`}>Number of Jobs</Label>
            <Input
              type="number"
              id={`jobCount-${index}`}
              value={entry.jobCount}
              onChange={(e) => handleChange("jobCount", e.target.value)}
              min="1"
              step="1"
              required
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor={`jobRate-${index}`}>Rate per Job</Label>
            <Input
              type="number"
              id={`jobRate-${index}`}
              value={entry.jobRate}
              onChange={(e) => handleChange("jobRate", e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
        </>
      )}
    </div>
  );
};

export default TimeEntryItem;