import { useState, useEffect } from "react";
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

  return {
    employees,
    stats,
    timesheetEntries,
    expenses,
  };
};