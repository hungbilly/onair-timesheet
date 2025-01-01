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

const ExpenseHistory = () => {
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

    setExpenses(data || []);

    const summary = (data || []).reduce(
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
  }, [selectedMonth]);

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

      <ExpenseSummaryCards {...monthlySummary} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <ExpenseCreateRow onSave={fetchExpenses} />
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
  );
};

export default ExpenseHistory;