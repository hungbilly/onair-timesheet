import { useState } from "react";
import { Button } from "@/components/ui/button";
import EmployeeFilters from "./EmployeeFilters";
import StatsTable from "./StatsTable";
import EmployeeDetailedEntries from "./EmployeeDetailedEntries";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { generateDetailedCsv } from "@/utils/csvExport";
import { getMonthDateRange } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";

const EmployeeStats = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  
  const { employees, stats, timesheetEntries, expenses } = useEmployeeData(
    selectedMonth,
    selectedEmployee
  );

  const exportToCsv = async () => {
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    
    // Fetch all employee data for the selected month
    const employeeData = await Promise.all(
      employees.map(async (employee) => {
        // Fetch timesheet entries
        const { data: timesheetData } = await supabase
          .from("timesheet_entries")
          .select("*")
          .eq("user_id", employee.id)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });

        // Fetch expenses
        const { data: expensesData } = await supabase
          .from("expenses")
          .select("*")
          .eq("user_id", employee.id)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });

        const totalSalary = (timesheetData || []).reduce(
          (sum, entry) => sum + entry.total_salary,
          0
        );
        const totalExpenses = (expensesData || []).reduce(
          (sum, entry) => sum + entry.amount,
          0
        );

        return {
          email: employee.email,
          full_name: employee.full_name || "",
          timesheet_entries: timesheetData || [],
          expenses: expensesData || [],
          total_salary: totalSalary,
          total_expenses: totalExpenses,
        };
      })
    );

    const csvContent = generateDetailedCsv(employeeData);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-report-${selectedMonth}.csv`;
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