import { useState } from "react";
import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TimeEntry } from "@/types";

interface TimeEntryRowProps {
  entry: TimeEntry;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export const TimeEntryRow = ({ entry, onDelete, onUpdate }: TimeEntryRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState(entry);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("timesheet_entries")
        .update({
          job_description: editedEntry.job_description,
          start_time: editedEntry.start_time,
          end_time: editedEntry.end_time,
          hours: editedEntry.hours,
          hourly_rate: editedEntry.hourly_rate,
          job_count: editedEntry.job_count,
          job_rate: editedEntry.job_rate,
          total_salary: 
            editedEntry.work_type === "hourly" 
              ? Number(editedEntry.hours) * Number(editedEntry.hourly_rate)
              : Number(editedEntry.job_count) * Number(editedEntry.job_rate),
        })
        .eq("id", entry.id);

      if (error) throw error;

      toast.success("Entry updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Failed to update entry");
    }
  };

  const handleCancel = () => {
    setEditedEntry(entry);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <TableRow className="md:h-16">
        <TableCell className="p-2 md:p-4">
          {format(new Date(entry.date), "MMM dd, yyyy")}
        </TableCell>
        <TableCell className="capitalize p-2 md:p-4">{entry.work_type}</TableCell>
        <TableCell className="p-2 md:p-4">
          <Input
            value={editedEntry.job_description}
            onChange={(e) =>
              setEditedEntry({ ...editedEntry, job_description: e.target.value })
            }
          />
        </TableCell>
        <TableCell className="p-2 md:p-4">
          <div className="flex gap-2">
            <Input
              type="time"
              value={editedEntry.start_time}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, start_time: e.target.value })
              }
              className="w-24"
            />
            <Input
              type="time"
              value={editedEntry.end_time}
              onChange={(e) =>
                setEditedEntry({ ...editedEntry, end_time: e.target.value })
              }
              className="w-24"
            />
          </div>
        </TableCell>
        <TableCell className="p-2 md:p-4">
          {entry.work_type === "hourly" ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editedEntry.hours}
                onChange={(e) =>
                  setEditedEntry({ ...editedEntry, hours: Number(e.target.value) })
                }
                className="w-20"
              />
              <span>hrs @</span>
              <Input
                type="number"
                value={editedEntry.hourly_rate}
                onChange={(e) =>
                  setEditedEntry({
                    ...editedEntry,
                    hourly_rate: Number(e.target.value),
                  })
                }
                className="w-20"
              />
              <span>/hr</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editedEntry.job_count}
                onChange={(e) =>
                  setEditedEntry({
                    ...editedEntry,
                    job_count: Number(e.target.value),
                  })
                }
                className="w-20"
              />
              <span>jobs @</span>
              <Input
                type="number"
                value={editedEntry.job_rate}
                onChange={(e) =>
                  setEditedEntry({
                    ...editedEntry,
                    job_rate: Number(e.target.value),
                  })
                }
                className="w-20"
              />
              <span>/job</span>
            </div>
          )}
        </TableCell>
        <TableCell className="p-2 md:p-4">
          ${(
            (entry.work_type === "hourly"
              ? Number(editedEntry.hours) * Number(editedEntry.hourly_rate)
              : Number(editedEntry.job_count) * Number(editedEntry.job_rate)) || 0
          ).toFixed(2)}
        </TableCell>
        <TableCell className="p-2 md:p-4">
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              title="Save changes"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCancel}
              title="Cancel editing"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow className="md:h-16">
      <TableCell className="p-2 md:p-4">
        {format(new Date(entry.date), "MMM dd, yyyy")}
      </TableCell>
      <TableCell className="capitalize p-2 md:p-4">{entry.work_type}</TableCell>
      <TableCell className="p-2 md:p-4">{entry.job_description}</TableCell>
      <TableCell className="p-2 md:p-4">
        {entry.start_time} - {entry.end_time}
      </TableCell>
      <TableCell className="p-2 md:p-4">
        {entry.work_type === "hourly"
          ? `${entry.hours} hrs @ $${entry.hourly_rate}/hr`
          : `${entry.job_count} jobs @ $${entry.job_rate}/job`}
      </TableCell>
      <TableCell className="p-2 md:p-4">${entry.total_salary.toFixed(2)}</TableCell>
      <TableCell className="p-2 md:p-4">
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditing(true)}
            title="Edit entry"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(entry.id)}
            title="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};