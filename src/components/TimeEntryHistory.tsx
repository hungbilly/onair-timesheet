import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { TimeEntry } from "@/types";

const TimeEntryHistory = () => {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );
  const [monthlySummary, setMonthlySummary] = useState({
    totalHours: 0,
    totalJobs: 0,
    totalSalary: 0,
  });

  useEffect(() => {
    const fetchEntries = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

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

      // Calculate monthly summary
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

    fetchEntries();
  }, [selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="month" className="font-medium">
          Select Month:
        </label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlySummary.totalHours.toFixed(1)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlySummary.totalJobs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlySummary.totalSalary.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{format(new Date(entry.date), "MMM dd, yyyy")}</TableCell>
              <TableCell className="capitalize">{entry.work_type}</TableCell>
              <TableCell>{entry.job_description}</TableCell>
              <TableCell>
                {entry.start_time} - {entry.end_time}
              </TableCell>
              <TableCell>
                {entry.work_type === "hourly"
                  ? `${entry.hours} hrs @ $${entry.hourly_rate}/hr`
                  : `${entry.job_count} jobs @ $${entry.job_rate}/job`}
              </TableCell>
              <TableCell>${entry.total_salary.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TimeEntryHistory;