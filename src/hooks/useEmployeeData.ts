
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMonthDateRange } from "@/utils/dateUtils";

export interface EmployeeStats {
  id: string;
  full_name: string;
  email: string;
  total_salary: number;
  total_expenses: number;
}

export const useEmployeeData = (selectedMonth: string, selectedEmployee: string) => {
  const [employees, setEmployees] = useState<{ id: string; full_name: string; email: string }[]>([]);
  const [stats, setStats] = useState<EmployeeStats[]>([]);
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

    const { startDate, endDate } = getMonthDateRange(selectedMonth);

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
    const { startDate, endDate } = getMonthDateRange(selectedMonth);

    // Fetch all timesheet entries for the selected month
    const { data: timesheetData, error: timesheetError } = await supabase
      .from("timesheet_entries")
      .select(`
        user_id,
        total_salary
      `)
      .gte("date", startDate)
      .lte("date", endDate);

    if (timesheetError) {
      console.error("Error fetching timesheet data:", timesheetError);
      return;
    }

    // Fetch all expenses for the selected month
    const { data: expensesData, error: expensesError } = await supabase
      .from("expenses")
      .select("user_id, amount")
      .gte("date", startDate)
      .lte("date", endDate);

    if (expensesError) {
      console.error("Error fetching expenses data:", expensesError);
      return;
    }

    // Calculate stats for all employees
    const aggregatedData = employees.map(employee => {
      const employeeTimesheets = timesheetData?.filter(t => t.user_id === employee.id) || [];
      const employeeExpenses = expensesData?.filter(e => e.user_id === employee.id) || [];

      const totalSalary = employeeTimesheets.reduce((sum, t) => sum + (t.total_salary || 0), 0);
      const totalExpenses = employeeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      return {
        id: employee.id,
        full_name: employee.full_name || "Unknown",
        email: employee.email,
        total_salary: totalSalary,
        total_expenses: totalExpenses,
      };
    });

    // If a specific employee is selected, only show that employee's stats
    if (selectedEmployee !== "all") {
      const filteredStats = aggregatedData.filter(stat => stat.id === selectedEmployee);
      setStats(filteredStats);
    } else {
      setStats(aggregatedData);
    }
  };

  const refetch = useCallback(() => {
    fetchStats();
    fetchDetailedEntries();
  }, [selectedMonth, selectedEmployee]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (employees.length > 0) {
      fetchStats();
      fetchDetailedEntries();
    }
  }, [selectedMonth, selectedEmployee, employees]);

  return {
    employees,
    stats,
    timesheetEntries,
    expenses,
    refetch,
  };
};
