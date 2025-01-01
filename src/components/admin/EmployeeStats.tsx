import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import EmployeeFilters from "./EmployeeFilters";
import StatsTable from "./StatsTable";
import EmployeeDetailedEntries from "./EmployeeDetailedEntries";

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
  const [timesheetEntries, setTimesheetEntries] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

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

  const fetchDetailedEntries = async () => {
    if (selectedEmployee === "all") {
      setTimesheetEntries([]);
      setExpenses([]);
      return;
    }

    const startDate = `${selectedMonth}-01`;
    const endDate = `${selectedMonth}-31`;

    // Fetch timesheet entries
    const { data: timesheetData, error: timesheetError } = await supabase
      .from("timesheet_entries")
      .select("*")
      .eq("user_id", selectedEmployee)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (timesheetError) {
      console.error("Error fetching timesheet entries:", timesheetError);
    } else {
      setTimesheetEntries(timesheetData || []);
    }

    // Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", selectedEmployee)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (expensesError) {
      console.error("Error fetching expenses:", expensesError);
    } else {
      setExpenses(expensesData || []);
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

    const aggregatedData = employees.reduce((acc, employee) => {
      const employeeTimesheets = timesheetData?.filter(t => t.user_id === employee.id) || [];
      const employeeExpenses = expensesData?.filter(e => e.user_id === employee.id) || [];

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
      fetchDetailedEntries();
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
      <div className="flex justify-between items-start">
        <EmployeeFilters
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedEmployee={selectedEmployee}
          setSelectedEmployee={setSelectedEmployee}
          employees={employees}
        />
        <Button onClick={exportToCsv} className="mt-6">
          Export CSV
        </Button>
      </div>

      <StatsTable stats={stats} />

      {selectedEmployee !== "all" && (
        <EmployeeDetailedEntries
          timesheetEntries={timesheetEntries}
          expenses={expenses}
        />
      )}
    </div>
  );
};

export default EmployeeStats;