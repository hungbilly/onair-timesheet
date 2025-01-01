import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ExpenseForm = () => {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentReceiptPath, setCurrentReceiptPath] = useState<string | null>(null);

  useEffect(() => {
    // Check for editing data in localStorage
    const editData = localStorage.getItem("editExpense");
    if (editData) {
      try {
        const expense = JSON.parse(editData);
        setDate(expense.date);
        setAmount(expense.amount.toString());
        setDescription(expense.description);
        setEditingId(expense.id);
        setCurrentReceiptPath(expense.receipt_path);
        // Clear the localStorage after loading
        localStorage.removeItem("editExpense");
      } catch (error) {
        console.error("Error parsing edit data:", error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit expenses");
        return;
      }

      let receiptPath = currentReceiptPath;
      if (file) {
        // If editing and there's an existing receipt, delete it
        if (currentReceiptPath) {
          await supabase.storage
            .from('receipts')
            .remove([currentReceiptPath]);
        }

        // Upload new file
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }
        receiptPath = fileName;
      }

      const expenseData = {
        user_id: user.id,
        date,
        description,
        amount: Number(amount),
        receipt_path: receiptPath,
      };

      let error;
      if (editingId) {
        // Update existing expense
        ({ error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingId));
      } else {
        // Insert new expense
        ({ error } = await supabase
          .from('expenses')
          .insert(expenseData));
      }

      if (error) throw error;

      toast.success(editingId ? "Expense updated successfully!" : "Expense saved successfully!");
      setDate("");
      setAmount("");
      setDescription("");
      setFile(null);
      setEditingId(null);
      setCurrentReceiptPath(null);

      // Switch to history tab
      const tabsList = document.querySelector('[role="tablist"]');
      const historyTab = Array.from(tabsList?.children || [])
        .find(child => child.textContent?.includes("Expense History")) as HTMLButtonElement;
      if (historyTab) {
        historyTab.click();
      }
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error("Failed to save expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid w-full gap-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          type="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor="amount">Amount</Label>
        <Input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="grid w-full gap-1.5">
        <Label htmlFor="receipt">Receipt (optional)</Label>
        <Input
          type="file"
          id="receipt"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Submit Expense"}
      </Button>
    </form>
  );
};

export default ExpenseForm;