interface TimeEntry {
  date: string;
  work_type: string;
  job_description: string;
  hours: number | null;
  total_salary: number;
}

interface ExpenseEntry {
  date: string;
  description: string;
  amount: number;
}

interface EmployeeData {
  email: string;
  full_name: string;
  timesheet_entries: TimeEntry[];
  expenses: ExpenseEntry[];
  total_salary: number;
  total_expenses: number;
}

export const generateDetailedCsv = (employeeData: EmployeeData[]) => {
  const csvRows: string[] = [];

  // Add header row
  csvRows.push("Employee,Entry Type,Date,Description,Hours,Amount,Total Payment");

  // Add data rows
  employeeData.forEach((employee) => {
    // Add timesheet entries
    employee.timesheet_entries.forEach((entry) => {
      csvRows.push(
        `${employee.full_name || employee.email},Timesheet,${entry.date},"${
          entry.job_description
        }",${entry.hours || ""},${entry.total_salary.toFixed(2)},${(
          employee.total_salary + employee.total_expenses
        ).toFixed(2)}`
      );
    });

    // Add expense entries
    employee.expenses.forEach((expense) => {
      csvRows.push(
        `${employee.full_name || employee.email},Expense,${expense.date},"${
          expense.description
        }",,${expense.amount.toFixed(2)},${(
          employee.total_salary + employee.total_expenses
        ).toFixed(2)}`
      );
    });

    // Add summary row
    csvRows.push(
      `${
        employee.full_name || employee.email
      },Summary,,Total Salary: ${employee.total_salary.toFixed(
        2
      )},Total Expenses: ${employee.total_expenses.toFixed(
        2
      )},Total Payment: ${(employee.total_salary + employee.total_expenses).toFixed(2)}`
    );
    csvRows.push(""); // Empty row for separation
  });

  return csvRows.join("\n");
};