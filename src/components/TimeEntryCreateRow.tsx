import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TimePickerInput } from "./TimePickerInput";
import type { Database } from "@/integrations/supabase/types";

type WorkType = Database["public"]["Enums"]["work_type"];

interface TimeEntryCreateRowProps {
  onSave: () => void;
}

export const TimeEntryCreateRow = ({ onSave }: TimeEntryCreateRowProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [entry, setEntry] = useState({
    date: new Date().toISOString().slice(0, 10),
    work_type: "hourly" as WorkType,
    job_description: "",
    start_time: "",
    end_time: "",
    hours: "",
    hourly_rate: "",
    job_count: "",
    job_rate: "",
  });

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create entries");
        return;
      }

      const total_salary = entry.work_type === "hourly"
        ? Number(entry.hours) * Number(entry.hourly_rate)
        : Number(entry.job_count) * Number(entry.job_rate);

      const { error } = await supabase
        .from("timesheet_entries")
        .insert({
          user_id: user.id,
          date: entry.date,
          work_type: entry.work_type,
          job_description: entry.job_description,
          hours: entry.work_type === "hourly" ? Number(entry.hours) : null,
          hourly_rate: entry.work_type === "hourly" ? Number(entry.hourly_rate) : null,
          start_time: entry.start_time || null,
          end_time: entry.end_time || null,
          job_count: entry.work_type === "job" ? Number(entry.job_count) : null,
          job_rate: entry.work_type === "job" ? Number(entry.job_rate) : null,
          total_salary,
        });

      if (error) throw error;

      toast.success("Entry created successfully");
      setIsCreating(false);
      onSave();
      
      setEntry({
        date: new Date().toISOString().slice(0, 10),
        work_type: "hourly",
        job_description: "",
        start_time: "",
        end_time: "",
        hours: "",
        hourly_rate: "",
        job_count: "",
        job_rate: "",
      });
    } catch (error) {
      console.error("Error creating entry:", error);
      toast.error("Failed to create entry");
    }
  };

  if (!isCreating) {
    return (
      <TableRow>
        <TableCell colSpan={4} className="text-center p-2 md:p-4">
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
          >
            Add New Entry
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="md:h-32">
      <TableCell className="p-2 md:p-4 border-r">
        <div className="flex flex-col gap-2">
          <Input
            type="date"
            value={entry.date}
            onChange={(e) => setEntry({ ...entry, date: e.target.value })}
            className="w-full"
          />
          <div className="flex gap-2">
            <TimePickerInput
              label="Start Time"
              value={entry.start_time}
              onChange={(value) => setEntry({ ...entry, start_time: value })}
              className="w-24"
            />
            <TimePickerInput
              label="End Time"
              value={entry.end_time}
              onChange={(value) => setEntry({ ...entry, end_time: value })}
              className="w-24"
            />
          </div>
        </div>
      </TableCell>
      <TableCell className="p-2 md:p-4">
        <div className="flex flex-col gap-2">
          <Select
            value={entry.work_type}
            onValueChange={(value: WorkType) => setEntry({ ...entry, work_type: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hourly">Hourly</SelectItem>
              <SelectItem value="job">Job</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={entry.job_description}
            onChange={(e) => setEntry({ ...entry, job_description: e.target.value })}
            placeholder="Description"
            className="w-full"
          />
          {entry.work_type === "hourly" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={entry.hours}
                onChange={(e) => setEntry({ ...entry, hours: e.target.value })}
                className="w-20"
                placeholder="Hours"
              />
              <span>hrs @</span>
              <Input
                type="number"
                value={entry.hourly_rate}
                onChange={(e) => setEntry({ ...entry, hourly_rate: e.target.value })}
                className="w-20"
                placeholder="Rate/hr"
              />
              <span>/hr</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={entry.job_count}
                onChange={(e) => setEntry({ ...entry, job_count: e.target.value })}
                className="w-20"
                placeholder="Jobs"
              />
              <span>jobs @</span>
              <Input
                type="number"
                value={entry.job_rate}
                onChange={(e) => setEntry({ ...entry, job_rate: e.target.value })}
                className="w-20"
                placeholder="Rate/job"
              />
              <span>/job</span>
            </div>
          )}
        </div>
      </TableCell>
      <TableCell className="p-2 md:p-4">
        $
        {(
          (entry.work_type === "hourly"
            ? Number(entry.hours) * Number(entry.hourly_rate)
            : Number(entry.job_count) * Number(entry.job_rate)) || 0
        ).toFixed(2)}
      </TableCell>
      <TableCell className="p-2 md:p-4">
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSave}
            title="Save entry"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCreating(false)}
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
