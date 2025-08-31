import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateExpenseDialogProps {
  onExpenseCreated: () => void;
}

const CreateExpenseDialog = ({ onExpenseCreated }: CreateExpenseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<"studio" | "personal">("studio");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    merchant: "",
    method: "",
    details: "",
    date: new Date(),
    paidBy: "Billy"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.merchant || !formData.method) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const expenseData = {
        amount: parseFloat(formData.amount),
        merchant: formData.merchant,
        method: formData.method,
        details: formData.details || null,
        date: format(formData.date, "yyyy-MM-dd"),
        created_by: user.id,
        ...(expenseType === "personal" && { paid_by: formData.paidBy })
      };

      const tableName = expenseType === "studio" ? "studio_expenses" : "personal_expenses";
      const { error } = await supabase.from(tableName).insert([expenseData]);

      if (error) throw error;

      toast.success(`${expenseType === "studio" ? "Studio" : "Personal"} expense created successfully`);
      setOpen(false);
      setFormData({
        amount: "",
        merchant: "",
        method: "",
        details: "",
        date: new Date(),
        paidBy: "Billy"
      });
      setExpenseType("studio");
      onExpenseCreated();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Expense Type</Label>
            <RadioGroup
              value={expenseType}
              onValueChange={(value: "studio" | "personal") => setExpenseType(value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="studio" id="studio" />
                <Label htmlFor="studio">Studio Expense</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="personal" id="personal" />
                <Label htmlFor="personal">Personal Expense</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData({ ...formData, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant *</Label>
            <Input
              id="merchant"
              placeholder="Enter merchant name"
              value={formData.merchant}
              onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method *</Label>
            <Input
              id="method"
              placeholder="e.g., Credit Card, Cash, Bank Transfer"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              required
            />
          </div>

          {expenseType === "personal" && (
            <div className="space-y-2">
              <Label htmlFor="paidBy">Paid By</Label>
              <Input
                id="paidBy"
                placeholder="Who paid for this expense"
                value={formData.paidBy}
                onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              placeholder="Additional details (optional)"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Creating..." : "Create Expense"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExpenseDialog;