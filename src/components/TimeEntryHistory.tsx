
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TimeEntry } from "@/types";
import { MonthlySummaryCards } from "./MonthlySummaryCards";
import { TimeEntryRow } from "./TimeEntryRow";
import { TimeEntryCreateRow } from "./TimeEntryCreateRow";
import { getMonthDateRange } from "@/utils/dateUtils";

const TimeEntryHistory = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [monthlySummary, setMonthlySummary] = useState({
    totalHours: 0,
    totalJobs: 0,
    totalSalary: 0,
  });

  const fetchEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { startDate, endDate } = getMonthDateRange(selectedMonth);

    const { data, error } = await supabase
      .from("timesheet_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching entries:", error);
      return;
    }

    setEntries(data || []);

    const summary = (data || []).reduce(
      (acc, entry) => ({
        totalHours: acc.totalHours + (entry.hours || 0),
        totalJobs: acc.totalJobs + (entry.job_count || 0),
        totalSalary: acc.totalSalary + entry.total_salary,
      }),
      { totalHours: 0, totalJobs: 0, totalSalary: 0 }
    );

    setMonthlySummary(summary);
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedMonth]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("timesheet_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete entry");
      return;
    }

    toast.success("Entry deleted successfully");
    fetchEntries();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <label htmlFor="month" className="font-medium">
          Select Month:
        </label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1 w-full sm:w-auto"
        />
      </div>

      <MonthlySummaryCards {...monthlySummary} />

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap border-r">Date & Time</TableHead>
                  <TableHead className="whitespace-nowrap">Type & Details</TableHead>
                  <TableHead className="whitespace-nowrap">Total</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TimeEntryCreateRow onSave={fetchEntries} />
                {entries.map((entry) => (
                  <TimeEntryRow
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                    onUpdate={fetchEntries}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeEntryHistory;
