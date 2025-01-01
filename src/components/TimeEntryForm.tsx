import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const TimeEntryForm = () => {
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [project, setProject] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would be connected to an API
    console.log({ date, hours, project, description });
    toast.success("Time entry saved successfully!");
    setDate("");
    setHours("");
    setProject("");
    setDescription("");
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
        <Label htmlFor="project">Project</Label>
        <Input
          type="text"
          id="project"
          value={project}
          onChange={(e) => setProject(e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <Button type="submit" className="w-full">Submit Time Entry</Button>
    </form>
  );
};

export default TimeEntryForm;