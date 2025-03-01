
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseEntry } from "@/types";
import { ExpenseRow } from "./ExpenseRow";
import { ExpenseCreateRow } from "./ExpenseCreateRow";
import { ExpenseSummaryCards } from "./ExpenseSummaryCards";
import { getMonthDateRange } from "@/utils/dateUtils";

interface ExpenseHistoryProps {
  expenseType?: 'work' | 'personal';
}

const ExpenseHistory = ({ expenseType = 'work' }: ExpenseHistoryProps) => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [monthlySummary, setMonthlySummary] = useState({
    totalExpenses: 0,
    totalReceipts: 0,
  });

  const fetchExpenses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { startDate, endDate } = getMonthDateRange(selectedMonth);

    const query = supabase
      .from("expenses")
      .select("*")
      .eq("user_id", user.id)
      .eq("expense_type", expenseType)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      return;
    }

    // Transform the data to ensure expense_type is properly set
    const transformedData = (data || []).map(expense => ({
      ...expense,
      expense_type: expense.expense_type || expenseType // Use the provided type as fallback
    })) as ExpenseEntry[];

    setExpenses(transformedData);

    const summary = transformedData.reduce(
      (acc, expense) => ({
        totalExpenses: acc.totalExpenses + Number(expense.amount),
        totalReceipts: acc.totalReceipts + (expense.receipt_path ? 1 : 0),
      }),
      { totalExpenses: 0, totalReceipts: 0 }
    );

    setMonthlySummary(summary);
  };

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, expenseType]);

  const handleDelete = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    
    if (expense?.receipt_path) {
      const { error: storageError } = await supabase.storage
        .from("receipts")
        .remove([expense.receipt_path]);
      
      if (storageError) {
        toast.error("Failed to delete receipt");
        return;
      }
    }

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete expense");
      return;
    }

    toast.success("Expense deleted successfully");
    fetchExpenses();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
        <label htmlFor="month" className="font-medium">
          Select Month:
        </label>
        <input
          type="month"
          id="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1 w-full sm:w-auto"
        />
      </div>

      <ExpenseSummaryCards {...monthlySummary} />

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Date</TableHead>
                  <TableHead className="whitespace-nowrap">Description</TableHead>
                  <TableHead className="whitespace-nowrap">Amount</TableHead>
                  <TableHead className="whitespace-nowrap">Receipt</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <ExpenseCreateRow onSave={fetchExpenses} expenseType={expenseType} />
                {expenses.map((expense) => (
                  <ExpenseRow
                    key={expense.id}
                    expense={expense}
                    onDelete={handleDelete}
                    onUpdate={fetchExpenses}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseHistory;
