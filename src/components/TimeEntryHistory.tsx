import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimeEntry } from "@/types";
import { TimeEntryCreateRow } from "./TimeEntryCreateRow";
import { TimeEntryRow } from "./TimeEntryRow";
import { format } from "date-fns";
import { toast } from "sonner";

const TimeEntryHistory = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  const { data: entries, refetch } = useQuery({
    queryKey: ["timeEntries", selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const { data, error } = await supabase
        .from("timesheet_entries")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) {
        toast.error("Failed to fetch time entries");
        throw error;
      }

      return data as TimeEntry[];
    },
  });

  const handleEntryCreated = () => {
    refetch();
  };

  const handleEntryDeleted = () => {
    refetch();
  };

  const handleEntryUpdated = () => {
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {profile?.full_name || profile?.email || "Employee"}'s Time History
        </h2>
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <TimeEntryCreateRow onSave={handleEntryCreated} />
        
        <div className="space-y-2">
          {entries?.map((entry) => (
            <TimeEntryRow
              key={entry.id}
              entry={entry}
              onDelete={handleEntryDeleted}
              onUpdate={handleEntryUpdated}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeEntryHistory;