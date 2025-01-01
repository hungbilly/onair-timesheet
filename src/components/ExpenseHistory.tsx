import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  receipt_path: string | null;
}

interface ExpenseWithUrl extends Expense {
  receiptUrl?: string;
}

const ExpenseHistory = () => {
  const [expenses, setExpenses] = useState<ExpenseWithUrl[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), "yyyy-MM")
  );

  useEffect(() => {
    const fetchExpenses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching expenses:", error);
        return;
      }

      // Get receipt URLs for all expenses with receipts
      const expensesWithUrls = await Promise.all(
        (data || []).map(async (expense) => {
          if (expense.receipt_path) {
            const { data: urlData } = await supabase.storage
              .from("receipts")
              .getPublicUrl(expense.receipt_path);
            return { ...expense, receiptUrl: urlData.publicUrl };
          }
          return expense;
        })
      );

      setExpenses(expensesWithUrls);
    };

    fetchExpenses();
  }, [selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="month" className="font-medium">
          Select Month:
        </label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

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
              <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
              <TableCell>{expense.description}</TableCell>
              <TableCell>${expense.amount.toFixed(2)}</TableCell>
              <TableCell>
                {expense.receiptUrl && (
                  <a
                    href={expense.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Receipt
                  </a>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpenseHistory;