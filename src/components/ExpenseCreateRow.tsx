
import { useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseCreateRowProps {
  onSave: () => void;
  expenseType?: 'work' | 'personal';
}

export const ExpenseCreateRow = ({ onSave, expenseType = 'work' }: ExpenseCreateRowProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [expense, setExpense] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to create expenses");
        return;
      }

      let receiptPath = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        receiptPath = fileName;
      }

      const { error } = await supabase
        .from("expenses")
        .insert({
          user_id: user.id,
          date: expense.date,
          description: expense.description,
          amount: Number(expense.amount),
          receipt_path: receiptPath,
          expense_type: expenseType,
        });

      if (error) throw error;

      toast.success("Expense created successfully");
      setIsCreating(false);
      onSave();
      
      // Reset form
      setExpense({
        date: new Date().toISOString().slice(0, 10),
        description: "",
        amount: "",
      });
      setFile(null);
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    }
  };

  if (!isCreating) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center">
          <Button
            variant="outline"
            onClick={() => setIsCreating(true)}
          >
            Add New Expense
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell>
        <Input
          type="date"
          value={expense.date}
          onChange={(e) => setExpense({ ...expense, date: e.target.value })}
        />
      </TableCell>
      <TableCell>
        <Input
          value={expense.description}
          onChange={(e) => setExpense({ ...expense, description: e.target.value })}
          placeholder="Description"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          value={expense.amount}
          onChange={(e) => setExpense({ ...expense, amount: e.target.value })}
          min="0"
          step="0.01"
          placeholder="Amount"
        />
      </TableCell>
      <TableCell>
        <Input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSave}
            title="Save expense"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCreating(false)}
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};
