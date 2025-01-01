import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TimeEntryItem, { TimeEntryData } from "./TimeEntryItem";
import { Plus } from "lucide-react";

const initialEntryState: TimeEntryData = {
  date: "",
  workType: "hourly",
  jobDescription: "",
  hours: "",
  hourlyRate: "",
  startTime: "",
  endTime: "",
  jobCount: "",
  jobRate: "",
};

const TimeEntryForm = () => {
  const [entries, setEntries] = useState<TimeEntryData[]>([initialEntryState]);

  const calculateSalary = (entry: TimeEntryData) => {
    if (entry.workType === "hourly") {
      return Number(entry.hours) * Number(entry.hourlyRate);
    } else {
      return Number(entry.jobCount) * Number(entry.jobRate);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to submit time entries");
      return;
    }

    try {
      const { error } = await supabase
        .from("timesheet_entries")
        .insert(
          entries.map(entry => ({
            user_id: user.id,
            date: entry.date,
            work_type: entry.workType,
            job_description: entry.jobDescription,
            hours: entry.workType === "hourly" ? Number(entry.hours) : null,
            hourly_rate: entry.workType === "hourly" ? Number(entry.hourlyRate) : null,
            start_time: entry.startTime || null,
            end_time: entry.endTime || null,
            job_count: entry.workType === "job" ? Number(entry.jobCount) : null,
            job_rate: entry.workType === "job" ? Number(entry.jobRate) : null,
            total_salary: calculateSalary(entry),
          }))
        );

      if (error) throw error;

      toast.success("Time entries saved successfully!");
      // Reset form
      setEntries([initialEntryState]);
    } catch (error) {
      console.error("Error saving time entries:", error);
      toast.error("Failed to save time entries");
    }
  };

  const handleEntryChange = (index: number, updatedEntry: TimeEntryData) => {
    setEntries(entries.map((entry, i) => i === index ? updatedEntry : entry));
  };

  const handleAddEntry = () => {
    setEntries([...entries, { ...initialEntryState }]);
  };

  const handleRemoveEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {entries.map((entry, index) => (
        <TimeEntryItem
          key={index}
          entry={entry}
          index={index}
          onChange={handleEntryChange}
          onRemove={handleRemoveEntry}
          canRemove={entries.length > 1}
        />
      ))}
      
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddEntry}
          className="w-full mr-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Entry
        </Button>
        <Button type="submit" className="w-full ml-2">
          Submit All Entries
        </Button>
      </div>
    </form>
  );
};

export default TimeEntryForm;