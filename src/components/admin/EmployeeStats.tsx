import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeStats {
  id: string;
  full_name: string;
  email: string;
  total_salary: number;
  total_expenses: number;
}

const EmployeeStats = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [stats, setStats] = useState<EmployeeStats[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [employees, setEmployees] = useState<{ id: string; full_name: string; email: string }[]>([]);

  const fetchEmployees = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "staff");

    if (error) {
      console.error("Error fetching employees:", error);
      return;
    }

    if (profiles) {
      setEmployees(profiles);
    }
  };

  const fetchStats = async () => {
    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-31`;

    let query = supabase
      .from("timesheet_entries")
      .select(`
        user_id,
        total_salary
      `)
      .gte("date", startDate)
      .lte("date", endDate);

    if (selectedEmployee !== "all") {
      query = query.eq("user_id", selectedEmployee);
    }

    const { data: timesheetData, error: timesheetError } = await query;

    if (timesheetError) {
      console.error("Error fetching timesheet data:", timesheetError);
      return;
    }

    // Fetch expenses
    let expensesQuery = supabase
      .from("expenses")
      .select("user_id, amount")
      .gte("date", startDate)
      .lte("date", endDate);

    if (selectedEmployee !== "all") {
      expensesQuery = expensesQuery.eq("user_id", selectedEmployee);
    }

    const { data: expensesData, error: expensesError } = await expensesQuery;

    if (expensesError) {
      console.error("Error fetching expenses data:", expensesError);
      return;
    }

    // Aggregate data by employee
    const aggregatedData = employees.reduce((acc, employee) => {
      const employeeTimesheets = timesheetData.filter(t => t.user_id === employee.id);
      const employeeExpenses = expensesData.filter(e => e.user_id === employee.id);

      const totalSalary = employeeTimesheets.reduce((sum, t) => sum + (t.total_salary || 0), 0);
      const totalExpenses = employeeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      acc.push({
        id: employee.id,
        full_name: employee.full_name || "Unknown",
        email: employee.email,
        total_salary: totalSalary,
        total_expenses: totalExpenses,
      });

      return acc;
    }, [] as EmployeeStats[]);

    setStats(aggregatedData);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchStats();
    }
  }, [selectedMonth, selectedEmployee, employees]);

  const exportToCsv = () => {
    const headers = ["Email", "Full Name", "Total Salary", "Total Expenses"];
    const csvData = stats.map(stat => [
      stat.email,
      stat.full_name,
      stat.total_salary.toFixed(2),
      stat.total_expenses.toFixed(2),
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `salary-report-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div>
          <label className="block text-sm font-medium mb-1">Month</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Employee</label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.full_name || employee.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportToCsv} className="mt-6">
          Export CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Total Salary</TableHead>
            <TableHead>Total Expenses</TableHead>
            <TableHead>Net Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((stat) => (
            <TableRow key={stat.id}>
              <TableCell>{stat.email}</TableCell>
              <TableCell>{stat.full_name}</TableCell>
              <TableCell>${stat.total_salary.toFixed(2)}</TableCell>
              <TableCell>${stat.total_expenses.toFixed(2)}</TableCell>
              <TableCell>${(stat.total_salary - stat.total_expenses).toFixed(2)}</TableCell>
            </TableRow>
          ))}
          {stats.length > 0 && (
            <TableRow>
              <TableCell colSpan={2} className="font-bold">Total</TableCell>
              <TableCell className="font-bold">
                ${stats.reduce((sum, stat) => sum + stat.total_salary, 0).toFixed(2)}
              </TableCell>
              <TableCell className="font-bold">
                ${stats.reduce((sum, stat) => sum + stat.total_expenses, 0).toFixed(2)}
              </TableCell>
              <TableCell className="font-bold">
                ${stats.reduce((sum, stat) => sum + (stat.total_salary - stat.total_expenses), 0).toFixed(2)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default EmployeeStats;
