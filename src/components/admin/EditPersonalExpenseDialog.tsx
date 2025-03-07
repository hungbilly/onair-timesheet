
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

type FormValues = {
  merchant: string;
  details: string;
  amount: string;
  method: string;
  date: string;
  paid_by: string;
};

interface EditPersonalExpenseDialogProps {
  expense: PersonalExpense;
  onClose: () => void;
  onExpenseUpdated: (expense: PersonalExpense) => void;
}

const paymentMethods = [
  "Credit Card (Master)",
  "Credit Card (Visa)",
  "Bank Transfer (Riano)",
  "Bank Transfer (Personal)",
  "PayMe",
  "Octopus"
];

const paidByOptions = ["Billy", "Jasmine"];

const EditPersonalExpenseDialog = ({
  expense,
  onClose,
  onExpenseUpdated,
}: EditPersonalExpenseDialogProps) => {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    defaultValues: {
      merchant: expense.merchant,
      details: expense.details || "",
      amount: expense.amount.toString(),
      method: expense.method,
      date: expense.date,
      paid_by: expense.paid_by || "Billy",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: updatedData, error } = await supabase
        .from("personal_expenses")
        .update({
          merchant: data.merchant,
          details: data.details || null,
          amount: parseFloat(data.amount),
          method: data.method,
          date: data.date,
          paid_by: data.paid_by,
        })
        .eq("id", expense.id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Personal expense updated successfully",
      });

      onExpenseUpdated(updatedData as PersonalExpense);
    } catch (error) {
      console.error("Error updating personal expense:", error);
      toast({
        title: "Error",
        description: "Failed to update personal expense",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Personal Expense</DialogTitle>
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <FormField
                control={form.control}
                name="paid_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paid By*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Billy" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paidByOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

export default EditPersonalExpenseDialog;
