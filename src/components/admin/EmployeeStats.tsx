import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmployeeFilters from "./EmployeeFilters";
import StatsTable from "./StatsTable";
import EmployeeDetailedEntries from "./EmployeeDetailedEntries";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { generateDetailedCsv } from "@/utils/csvExport";
import { getMonthDateRange } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

const EmployeeStats = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  
  const { employees, stats, timesheetEntries, expenses } = useEmployeeData(
    selectedMonth,
    selectedEmployee
  );

  const fetchEmployeeData = async () => {
    const { startDate, endDate } = getMonthDateRange(selectedMonth);
    
    return await Promise.all(
      employees.map(async (employee) => {
        const { data: timesheetData } = await supabase
          .from("timesheet_entries")
          .select("*")
          .eq("user_id", employee.id)
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: true });

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
  };

  const exportToCsv = async () => {
    const employeeData = await fetchEmployeeData();
    const csvContent = generateDetailedCsv(employeeData);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-report-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToXlsx = async () => {
    const employeeData = await fetchEmployeeData();
    const workbook = XLSX.utils.book_new();
    
    // Create summary worksheet
    const summaryData = employeeData.map(employee => ({
      'Employee': employee.full_name || employee.email,
      'Total Salary': employee.total_salary.toFixed(2),
      'Total Expenses': employee.total_expenses.toFixed(2),
      'Total Payment': (employee.total_salary + employee.total_expenses).toFixed(2)
    }));
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWs, 'Summary');

    // Create timesheet entries worksheet
    const timesheetData = employeeData.flatMap(employee =>
      employee.timesheet_entries.map(entry => ({
        'Employee': employee.full_name || employee.email,
        'Date': entry.date,
        'Type': entry.work_type,
        'Description': entry.job_description,
        'Hours': entry.hours || '',
        'Amount': entry.total_salary.toFixed(2)
      }))
    );
    const timesheetWs = XLSX.utils.json_to_sheet(timesheetData);
    XLSX.utils.book_append_sheet(workbook, timesheetWs, 'Timesheet Entries');

    // Create expenses worksheet
    const expensesData = employeeData.flatMap(employee =>
      employee.expenses.map(expense => ({
        'Employee': employee.full_name || employee.email,
        'Date': expense.date,
        'Description': expense.description,
        'Amount': expense.amount.toFixed(2)
      }))
    );
    const expensesWs = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesWs, 'Expenses');

    // Export the workbook
    XLSX.writeFile(workbook, `employee-report-${selectedMonth}.xlsx`);
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="mt-6">Export</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportToCsv}>
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToXlsx}>
              Export as Spreadsheet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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