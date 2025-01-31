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

interface VendorBillEntry {
  due_date: string;
  vendor_name: string;
  description: string | null;
  amount: number;
  status: string;
}

interface EmployeeData {
  email: string;
  full_name: string;
  timesheet_entries: TimeEntry[];
  expenses: ExpenseEntry[];
  vendor_bills?: VendorBillEntry[];
  total_salary: number;
  total_expenses: number;
  total_vendor_bills?: number;
}

export const generateDetailedCsv = (employeeData: EmployeeData[]) => {
  const csvRows: string[] = [];

  // Add header row
  csvRows.push("Employee,Entry Type,Date,Description,Hours,Amount,Status");

  // Add data rows
  employeeData.forEach((employee) => {
    // Add timesheet entries
    employee.timesheet_entries.forEach((entry) => {
      csvRows.push(
        `${employee.full_name || employee.email},Timesheet,${entry.date},"${
          entry.job_description
        }",${entry.hours || ""},${entry.total_salary.toFixed(2)},`
      );
    });

    // Add expense entries
    employee.expenses.forEach((expense) => {
      csvRows.push(
        `${employee.full_name || employee.email},Expense,${expense.date},"${
          expense.description
        }",,${expense.amount.toFixed(2)},`
      );
    });

    // Add vendor bill entries if they exist
    if (employee.vendor_bills) {
      employee.vendor_bills.forEach((bill) => {
        csvRows.push(
          `${employee.full_name || employee.email},Vendor Bill,${bill.due_date},"${
            bill.vendor_name
          } - ${bill.description || ''}",,${bill.amount.toFixed(2)},${bill.status}`
        );
      });
    }

    // Add summary row with total payments
    const totalVendorBills = employee.total_vendor_bills || 0;
    const totalPayment = employee.total_salary + employee.total_expenses + totalVendorBills;
    csvRows.push(
      `${
        employee.full_name || employee.email
      },Summary,,Total Salary: ${employee.total_salary.toFixed(
        2
      )},Total Expenses: ${employee.total_expenses.toFixed(
        2
      )},Total Vendor Bills: ${totalVendorBills.toFixed(
        2
      )},Total Payment: ${totalPayment.toFixed(2)}`
    );
    csvRows.push(""); // Empty row for separation
  });

  return csvRows.join("\n");
};