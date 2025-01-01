import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface TimeEntry {
  id: string;
  date: string;
  work_type: "hourly" | "job";
  job_description: string;
  hours: number | null;
  total_salary: number;
}

interface ExpenseEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  receipt_path: string | null;
}

interface EmployeeDetailedEntriesProps {
  timesheetEntries: TimeEntry[];
  expenses: ExpenseEntry[];
}

const EmployeeDetailedEntries = ({
  timesheetEntries,
  expenses,
}: EmployeeDetailedEntriesProps) => {
  return (
    <div className="space-y-8 mt-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Timesheet Entries</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Hours</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheetEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                <TableCell className="capitalize">{entry.work_type}</TableCell>
                <TableCell>{entry.job_description}</TableCell>
                <TableCell>{entry.hours || "-"}</TableCell>
                <TableCell>${entry.total_salary.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Expenses</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>${expense.amount.toFixed(2)}</TableCell>
                <TableCell>
                  {expense.receipt_path ? (
                    <a
                      href={`https://gnbxsemhjiatjtwisywz.supabase.co/storage/v1/object/public/receipts/${expense.receipt_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Receipt
                    </a>
                  ) : (
                    "No receipt"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeDetailedEntries;