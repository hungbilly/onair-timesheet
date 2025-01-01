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
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth]);

  const handleDelete = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    
    // Delete the receipt from storage if it exists
    if (expense?.receipt_path) {
      const { error: storageError } = await supabase.storage
        .from("receipts")
        .remove([expense.receipt_path]);
      
      if (storageError) {
        toast.error("Failed to delete receipt");
        return;
      }
    }

    // Delete the expense record
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

  const handleEdit = (expense: ExpenseWithUrl) => {
    try {
      localStorage.setItem("editExpense", JSON.stringify(expense));
      // Find the tabs container
      const tabsList = document.querySelector('[role="tablist"]');
      if (!tabsList) {
        console.error("Tabs list not found");
        return;
      }
      
      // Find and click the expense entry tab
      const expenseTab = Array.from(tabsList.children)
        .find(child => child.textContent?.includes("New Expense")) as HTMLButtonElement;
      
      if (expenseTab) {
        expenseTab.click();
        toast.success("Please update the expense in the form above");
      } else {
        toast.error("Could not find the expense tab");
      }
    } catch (error) {
      console.error("Error setting up edit:", error);
      toast.error("Failed to set up expense editing");
    }
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
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(expense)}
                    title="Edit expense"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(expense.id)}
                    title="Delete expense"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpenseHistory;