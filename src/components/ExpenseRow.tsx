import { useState } from "react";
import { format } from "date-fns";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { ExpenseEntry } from "@/types";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";

interface ExpenseRowProps {
  expense: ExpenseEntry;
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

export const ExpenseRow = ({ expense, onDelete, onUpdate }: ExpenseRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedExpense, setEditedExpense] = useState(expense);
  const [file, setFile] = useState<File | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSave = async () => {
    try {
      let receiptPath = editedExpense.receipt_path;
      if (file) {
        // Delete old receipt if it exists
        if (editedExpense.receipt_path) {
          await supabase.storage
            .from('receipts')
            .remove([editedExpense.receipt_path]);
        }

        // Upload new file
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
        .update({
          date: editedExpense.date,
          description: editedExpense.description,
          amount: Number(editedExpense.amount),
          receipt_path: receiptPath,
        })
        .eq("id", expense.id);

      if (error) throw error;

      toast.success("Expense updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const handleDeleteConfirm = () => {
    onDelete(expense.id);
    setDeleteDialogOpen(false);
  };

  if (isEditing) {
    return (
      <TableRow>
        <TableCell>
          <Input
            type="date"
            value={editedExpense.date}
            onChange={(e) =>
              setEditedExpense({ ...editedExpense, date: e.target.value })
            }
          />
        </TableCell>
        <TableCell>
          <Input
            value={editedExpense.description}
            onChange={(e) =>
              setEditedExpense({ ...editedExpense, description: e.target.value })
            }
          />
        </TableCell>
        <TableCell>
          <Input
            type="number"
            value={editedExpense.amount}
            onChange={(e) =>
              setEditedExpense({ ...editedExpense, amount: Number(e.target.value) })
            }
            min="0"
            step="0.01"
          />
        </TableCell>
        <TableCell>
          {expense.receipt_path && (
            <a
              href={`${supabase.storage.from('receipts').getPublicUrl(expense.receipt_path).data.publicUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mr-2"
            >
              Current Receipt
            </a>
          )}
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
              title="Save changes"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setEditedExpense(expense);
                setIsEditing(false);
              }}
              title="Cancel editing"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow>
        <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
        <TableCell>{expense.description}</TableCell>
        <TableCell>${expense.amount.toFixed(2)}</TableCell>
        <TableCell>
          {expense.receipt_path && (
            <a
              href={`${supabase.storage.from('receipts').getPublicUrl(expense.receipt_path).data.publicUrl}`}
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
              onClick={() => setIsEditing(true)}
              title="Edit expense"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
              title="Delete expense"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
      />
    </>
  );
};
