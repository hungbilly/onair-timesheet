
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

type PersonalExpense = {
  id: string;
  merchant: string;
  details: string | null;
  amount: number;
  method: string;
  date: string;
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
  const { toast } = useToast();

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
                      onClick={() => handleDelete(expense.id)}
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
    </div>
  );
};

export default PersonalExpensesList;
