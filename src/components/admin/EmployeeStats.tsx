import { useState } from "react";
import { Button } from "@/components/ui/button";
import EmployeeFilters from "./EmployeeFilters";
import StatsTable from "./StatsTable";
import EmployeeDetailedEntries from "./EmployeeDetailedEntries";
import ExportDataDialog from "./ExportDataDialog";
import { useEmployeeData } from "@/hooks/useEmployeeData";
import { generateDetailedCsv } from "@/utils/csvExport";
import { getMonthDateRange } from "@/utils/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

const EmployeeStats = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  
  const { employees, stats, timesheetEntries, expenses, refetch } = useEmployeeData(
    selectedMonth,
    selectedEmployee
  );

  const fetchEmployeeData = async (months: string[], employeeIds: string[]) => {
    const employeesToFetch = employeeIds.length > 0 
      ? employees.filter(emp => employeeIds.includes(emp.id))
      : employees;

    return await Promise.all(
      employeesToFetch.map(async (employee) => {
        const allTimesheetData = [];
        const allExpensesData = [];

        for (const month of months) {
          const { startDate, endDate } = getMonthDateRange(month);
          
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

          if (timesheetData) allTimesheetData.push(...timesheetData);
          if (expensesData) allExpensesData.push(...expensesData);
        }

        const totalSalary = allTimesheetData.reduce(
          (sum, entry) => sum + entry.total_salary,
          0
        );
        const totalExpenses = allExpensesData.reduce(
          (sum, entry) => sum + entry.amount,
          0
        );

        return {
          email: employee.email,
          full_name: employee.full_name || "",
          timesheet_entries: allTimesheetData,
          expenses: allExpensesData,
          total_salary: totalSalary,
          total_expenses: totalExpenses,
        };
      })
    );
  };

  const handleExportCsv = async (selectedMonths: string[], selectedEmployees: string[]) => {
    const employeeData = await fetchEmployeeData(selectedMonths, selectedEmployees);
    const csvContent = generateDetailedCsv(employeeData);
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-report-${selectedMonths.join("-")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportXlsx = async (selectedMonths: string[], selectedEmployees: string[]) => {
    const employeeData = await fetchEmployeeData(selectedMonths, selectedEmployees);
    const workbook = XLSX.utils.book_new();
    
    // Create summary worksheet
    const summaryData = employeeData.map(employee => ({
      'Employee': employee.full_name || employee.email,
      'Total Salary': employee.total_salary,
      'Total Expenses': employee.total_expenses,
      'Total Payment': employee.total_salary + employee.total_expenses
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
        'Amount': entry.total_salary
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
        'Amount': expense.amount
      }))
    );
    const expensesWs = XLSX.utils.json_to_sheet(expensesData);
    XLSX.utils.book_append_sheet(workbook, expensesWs, 'Expenses');

    // Export the workbook
    XLSX.writeFile(workbook, `employee-report-${selectedMonths.join("-")}.xlsx`);
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
        <ExportDataDialog
          employees={employees}
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
        />
      </div>

      {selectedEmployee !== "all" && (
        <EmployeeDetailedEntries
          timesheetEntries={timesheetEntries}
          expenses={expenses}
          onUpdate={refetch}
          userId={selectedEmployee}
        />
      )}

      <StatsTable stats={stats} selectedMonth={selectedMonth} />
    </div>
  );
};

export default EmployeeStats;