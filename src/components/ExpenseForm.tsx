import { useState } from "react";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit expenses");
        return;
      }

      let receiptPath = null;
      if (file) {
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

      const { error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          date,
          description,
          amount: Number(amount),
          receipt_path: receiptPath,
        });

      if (error) throw error;

      toast.success("Expense saved successfully!");
      setDate("");
      setAmount("");
      setDescription("");
      setFile(null);
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