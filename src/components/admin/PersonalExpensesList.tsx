import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { getMonthDateRange } from "@/utils/dateUtils";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import EditPersonalExpenseDialog from "./EditPersonalExpenseDialog";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";

type PersonalExpense = {
  id: string;
  merchant: string;
  details: string | null;
  amount: number;
  method: string;
  date: string;
  paid_by: string;
  created_at: string;
  created_by: string;
};

interface PersonalExpensesListProps {
  refreshTrigger: number;
  selectedMonth: string;
}

const PersonalExpensesList = ({ refreshTrigger, selectedMonth }: PersonalExpensesListProps) => {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<PersonalExpense | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const { startDate, endDate } = getMonthDateRange(selectedMonth);
        
        const { data, error } = await supabase
          .from("personal_expenses")
          .select("*")
          .gte("date", startDate)
          .lte("date", endDate)
          .order("date", { ascending: false });

        if (error) throw error;
        setExpenses(data || []);
        
        const total = (data || []).reduce((sum, expense) => sum + expense.amount, 0);
        setTotalAmount(total);
      } catch (error) {
        console.error("Error fetching personal expenses:", error);
        toast({
          title: "Error",
          description: "Failed to load personal expenses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [selectedMonth, refreshTrigger, toast]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("personal_expenses").delete().eq("id", id);
      
      if (error) throw error;
      
      setExpenses(expenses.filter(expense => expense.id !== id));
      toast({
        title: "Success",
        description: "Personal expense deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (expenseToDelete) {
      handleDelete(expenseToDelete);
      setExpenseToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleExpenseUpdated = (updatedExpense: PersonalExpense) => {
    setExpenses(expenses.map(expense => 
      expense.id === updatedExpense.id ? updatedExpense : expense
    ));
    setEditingExpense(null);
  };

  return (
    <div>
      {editingExpense && (
        <EditPersonalExpenseDialog
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onExpenseUpdated={handleExpenseUpdated}
        />
      )}
      
      <div className="p-4 bg-muted rounded-lg mb-4">
        <p className="text-lg font-semibold">
          Total Amount for {selectedMonth}: {formatCurrency(totalAmount)}
        </p>
      </div>
      
      {loading ? (
        <div className="py-8 text-center">Loading expenses...</div>
      ) : expenses.length === 0 ? (
        <div className="py-8 text-center">No personal expenses found for this month</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Paid By</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.date}</TableCell>
                <TableCell>{expense.merchant}</TableCell>
                <TableCell>{expense.details || "-"}</TableCell>
                <TableCell>{expense.method}</TableCell>
                <TableCell>{expense.paid_by}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingExpense(expense)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(expense.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Personal Expense"
        description="Are you sure you want to delete this personal expense? This action cannot be undone."
      />
    </div>
  );
};

export default PersonalExpensesList;
