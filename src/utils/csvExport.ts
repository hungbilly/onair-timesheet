
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
  csvRows.push("Employee,Entry Type,Date,Description,Hours,Amount");

  // Add data rows
  employeeData.forEach((employee) => {
    // Add timesheet entries
    employee.timesheet_entries.forEach((entry) => {
      csvRows.push(
        `${employee.full_name || employee.email},Timesheet,${entry.date},"${
          entry.job_description
        }",${entry.hours || ""},${entry.total_salary.toFixed(2)}`
      );
    });

    // Add expense entries
    employee.expenses.forEach((expense) => {
      csvRows.push(
        `${employee.full_name || employee.email},Expense,${expense.date},"${
          expense.description
        }",,${expense.amount.toFixed(2)}`
      );
    });

    // Add summary row with total payment
    const totalPayment = employee.total_salary + employee.total_expenses;
    csvRows.push(
      `${
        employee.full_name || employee.email
      },Summary,,Total Salary: ${employee.total_salary.toFixed(
        2
      )},Total Expenses: ${employee.total_expenses.toFixed(
        2
      )},Total Payment: ${totalPayment.toFixed(2)}`
    );
    csvRows.push(""); // Empty row for separation
  });

  return csvRows.join("\n");
};

// New function for exporting company income records
export const generateIncomeRecordsCsv = (records: any[], dateRange: { startDate: Date, endDate: Date }) => {
  const csvRows: string[] = [];
  
  // Add header row
  csvRows.push("Date,Client,Brand,Job Type,Payment Type,Payment Method,Completion Date,Amount");
  
  // Add data rows
  records.forEach((record) => {
    const completionDate = record.completion_date 
      ? new Date(record.completion_date).toLocaleDateString() 
      : "-";
    
    csvRows.push(
      `${new Date(record.date).toLocaleDateString()},"${record.client}","${record.brand}","${
        record.job_type ? record.job_type.charAt(0).toUpperCase() + record.job_type.slice(1) : "-"
      }","${record.payment_type}","${record.payment_method}","${completionDate}",${Number(record.amount).toFixed(2)}`
    );
  });
  
  // Add summary rows
  csvRows.push("");
  
  // Group and sum by brand
  const brandTotals: Record<string, number> = {};
  records.forEach(record => {
    if (!brandTotals[record.brand]) {
      brandTotals[record.brand] = 0;
    }
    brandTotals[record.brand] += Number(record.amount);
  });
  
  // Add brand totals
  csvRows.push("Brand Totals:");
  Object.entries(brandTotals).forEach(([brand, total]) => {
    csvRows.push(`${brand},,,,,,,${total.toFixed(2)}`);
  });
  
  // Add grand total
  const totalIncome = records.reduce((sum, record) => sum + Number(record.amount), 0);
  csvRows.push("");
  csvRows.push(`Total Income (${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}),,,,,,,${totalIncome.toFixed(2)}`);
  
  return csvRows.join("\n");
};
