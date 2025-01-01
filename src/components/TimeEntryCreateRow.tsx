import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type WorkType = Database["public"]["Enums"]["work_type"];

interface TimeEntryCreateRowProps {
  onSave: () => void;
}

// Helper function to round time to nearest 15 minutes
const roundToNearest15Min = (time: string) => {
  if (!time) return "";
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  const roundedMinutes = Math.round(totalMinutes / 15) * 15;
  const newHours = Math.floor(roundedMinutes / 60);
  const newMinutes = roundedMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
};

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

  const handleTimeChange = (field: 'start_time' | 'end_time', value: string) => {
    const roundedTime = roundToNearest15Min(value);
    setEntry({ ...entry, [field]: roundedTime });
  };

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
      
      // Reset form
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
        <TableCell colSpan={7} className="text-center">
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
    <TableRow>
      <TableCell>
        <Input
          type="date"
          value={entry.date}
          onChange={(e) => setEntry({ ...entry, date: e.target.value })}
        />
      </TableCell>
      <TableCell>
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
      </TableCell>
      <TableCell>
        <Input
          value={entry.job_description}
          onChange={(e) => setEntry({ ...entry, job_description: e.target.value })}
          placeholder="Description"
        />
      </TableCell>
      <TableCell className="space-x-2">
        <Input
          type="time"
          value={entry.start_time}
          onChange={(e) => handleTimeChange('start_time', e.target.value)}
          className="w-24 inline-block"
          step="900"
          list="time-list"
        />
        <Input
          type="time"
          value={entry.end_time}
          onChange={(e) => handleTimeChange('end_time', e.target.value)}
          className="w-24 inline-block"
          step="900"
          list="time-list"
        />
        <datalist id="time-list">
          {Array.from({ length: 96 }, (_, i) => {
            const hours = Math.floor(i / 4);
            const minutes = (i % 4) * 15;
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          }).map((time) => (
            <option key={time} value={time} />
          ))}
        </datalist>
      </TableCell>
      <TableCell>
        {entry.work_type === "hourly" ? (
          <div className="space-x-2">
            <Input
              type="number"
              value={entry.hours}
              onChange={(e) => setEntry({ ...entry, hours: e.target.value })}
              className="w-20 inline-block"
              placeholder="Hours"
            />
            <span>hrs @</span>
            <Input
              type="number"
              value={entry.hourly_rate}
              onChange={(e) => setEntry({ ...entry, hourly_rate: e.target.value })}
              className="w-20 inline-block"
              placeholder="Rate"
            />
            <span>/hr</span>
          </div>
        ) : (
          <div className="space-x-2">
            <Input
              type="number"
              value={entry.job_count}
              onChange={(e) => setEntry({ ...entry, job_count: e.target.value })}
              className="w-20 inline-block"
              placeholder="Jobs"
            />
            <span>jobs @</span>
            <Input
              type="number"
              value={entry.job_rate}
              onChange={(e) => setEntry({ ...entry, job_rate: e.target.value })}
              className="w-20 inline-block"
              placeholder="Rate"
            />
            <span>/job</span>
          </div>
        )}
      </TableCell>
      <TableCell>
        $
        {(
          (entry.work_type === "hourly"
            ? Number(entry.hours) * Number(entry.hourly_rate)
            : Number(entry.job_count) * Number(entry.job_rate)) || 0
        ).toFixed(2)}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
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