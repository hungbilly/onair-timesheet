
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StudioExpense = {
  id: string;
  merchant: string;
  details: string | null;
  amount: number;
  method: string;
  date: string;
  created_at: string;
  created_by: string;
};

type FormValues = {
  merchant: string;
  details: string;
  amount: string;
  method: string;
  date: string;
};

interface EditStudioExpenseDialogProps {
  expense: StudioExpense;
  onClose: () => void;
  onExpenseUpdated: (expense: StudioExpense) => void;
}

const paymentMethods = [
  "Credit Card (Master)",
  "Credit Card (Visa)",
  "Bank Transfer (Riano)",
  "Bank Transfer (Personal)",
  "PayMe",
  "Octopus"
];

const EditStudioExpenseDialog = ({
  expense,
  onClose,
  onExpenseUpdated,
}: EditStudioExpenseDialogProps) => {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    defaultValues: {
      merchant: expense.merchant,
      details: expense.details || "",
      amount: expense.amount.toString(),
      method: expense.method,
      date: expense.date,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: updatedData, error } = await supabase
        .from("studio_expenses")
        .update({
          merchant: data.merchant,
          details: data.details || null,
          amount: parseFloat(data.amount),
          method: data.method,
          date: data.date,
        })
        .eq("id", expense.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Studio expense updated successfully",
      });

      onExpenseUpdated(updatedData as StudioExpense);
    } catch (error) {
      console.error("Error updating studio expense:", error);
      toast({
        title: "Error",
        description: "Failed to update studio expense",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Studio Expense</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Merchant*</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter merchant name" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter expense details" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount*</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method} value={method}>
                            {method}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date*</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="mr-2">
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditStudioExpenseDialog;
