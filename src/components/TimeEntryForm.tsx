import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { TimeEntry } from "@/types";

type WorkType = Database["public"]["Enums"]["work_type"];

const TimeEntryForm = () => {
  const [date, setDate] = useState("");
  const [workType, setWorkType] = useState<WorkType>("hourly");
  const [jobDescription, setJobDescription] = useState("");
  const [hours, setHours] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [jobCount, setJobCount] = useState("");
  const [jobRate, setJobRate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Check for editing data in localStorage
    const editData = localStorage.getItem("editTimeEntry");
    if (editData) {
      try {
        const entry: TimeEntry = JSON.parse(editData);
        setDate(entry.date);
        setWorkType(entry.work_type);
        setJobDescription(entry.job_description);
        setHours(entry.hours?.toString() || "");
        setHourlyRate(entry.hourly_rate?.toString() || "");
        setStartTime(entry.start_time || "");
        setEndTime(entry.end_time || "");
        setJobCount(entry.job_count?.toString() || "");
        setJobRate(entry.job_rate?.toString() || "");
        setEditingId(entry.id);
        // Clear the localStorage after loading
        localStorage.removeItem("editTimeEntry");
      } catch (error) {
        console.error("Error parsing edit data:", error);
      }
    }
  }, []);

  const calculateSalary = () => {
    if (workType === "hourly") {
      return Number(hours) * Number(hourlyRate);
    } else {
      return Number(jobCount) * Number(jobRate);
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
      const entryData = {
        user_id: user.id,
        date,
        work_type: workType,
        job_description: jobDescription,
        hours: workType === "hourly" ? Number(hours) : null,
        hourly_rate: workType === "hourly" ? Number(hourlyRate) : null,
        start_time: startTime || null,
        end_time: endTime || null,
        job_count: workType === "job" ? Number(jobCount) : null,
        job_rate: workType === "job" ? Number(jobRate) : null,
        total_salary: calculateSalary(),
      };

      let error;
      if (editingId) {
        // Update existing entry
        ({ error } = await supabase
          .from("timesheet_entries")
          .update(entryData)
          .eq("id", editingId));
      } else {
        // Insert new entry
        ({ error } = await supabase
          .from("timesheet_entries")
          .insert(entryData));
      }

      if (error) throw error;

      toast.success(editingId ? "Time entry updated successfully!" : "Time entry saved successfully!");
      // Reset form
      setDate("");
      setJobDescription("");
      setHours("");
      setHourlyRate("");
      setStartTime("");
      setEndTime("");
      setJobCount("");
      setJobRate("");
      setEditingId(null);

      // Switch to history tab
      const tabsList = document.querySelector('[role="tablist"]');
      const historyTab = Array.from(tabsList?.children || [])
        .find(child => child.textContent?.includes("Time History")) as HTMLButtonElement;
      if (historyTab) {
        historyTab.click();
      }
    } catch (error) {
      console.error("Error saving time entry:", error);
      toast.error("Failed to save time entry");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid w-full gap-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label>Work Type</Label>
        <RadioGroup
          value={workType}
          onValueChange={(value: "hourly" | "job") => setWorkType(value)}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hourly" id="hourly" />
            <Label htmlFor="hourly">By Hour</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="job" id="job" />
            <Label htmlFor="job">By Job</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor="jobDescription">Job Description</Label>
        <Textarea
          id="jobDescription"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor="startTime">Start Time</Label>
        <Input
          type="time"
          id="startTime"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
          step="900"
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor="endTime">End Time</Label>
        <Input
          type="time"
          id="endTime"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
          step="900"
        />
      </div>

      {workType === "hourly" ? (
        <>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="hours">Hours</Label>
            <Input
              type="number"
              id="hours"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0"
              step="0.5"
              required
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="hourlyRate">Hourly Rate</Label>
            <Input
              type="number"
              id="hourlyRate"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="jobCount">Number of Jobs</Label>
            <Input
              type="number"
              id="jobCount"
              value={jobCount}
              onChange={(e) => setJobCount(e.target.value)}
              min="1"
              step="1"
              required
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="jobRate">Rate per Job</Label>
            <Input
              type="number"
              id="jobRate"
              value={jobRate}
              onChange={(e) => setJobRate(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
        </>
      )}

      <Button type="submit" className="w-full">Submit Time Entry</Button>
    </form>
  );
};

export default TimeEntryForm;
