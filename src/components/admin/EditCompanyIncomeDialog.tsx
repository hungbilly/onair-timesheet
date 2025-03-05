
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CompanyIncome } from "@/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

const formSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  client: z.string().optional(),
  deposit: z.enum(["full", "partial", "balance"], {
    required_error: "Please select a payment type",
  }),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.date({
    required_error: "Date is required",
  }),
  job_status: z.enum(["in_progress", "completed"], {
    required_error: "Job status is required",
  }),
  job_completion_date: z.date().optional().nullable(),
  payment_method: z.string().min(1, "Payment method is required"),
  source: z.string().min(1, "Source is required"),
  type: z.string().min(1, "Type is required"),
  job_type: z.enum(["shooting", "upgrade", "product"]).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditCompanyIncomeDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  income: CompanyIncome;
  onSuccess: () => void;
}

const EditCompanyIncomeDialog = ({ open, setOpen, income, onSuccess }: EditCompanyIncomeDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPaymentSlip, setCurrentPaymentSlip] = useState<string | null>(income.payment_slip_path);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: income.company_name,
      client: income.client || "",
      deposit: income.deposit as "full" | "partial" | "balance",
      amount: income.amount,
      date: new Date(income.date),
      job_status: income.job_status as "in_progress" | "completed",
      job_completion_date: income.job_completion_date ? new Date(income.job_completion_date) : null,
      payment_method: income.payment_method,
      source: income.source,
      type: income.type,
      job_type: income.job_type as "shooting" | "upgrade" | "product" | null,
    },
  });

  // Update form when income prop changes
  useEffect(() => {
    form.reset({
      company_name: income.company_name,
      client: income.client || "",
      deposit: income.deposit as "full" | "partial" | "balance",
      amount: income.amount,
      date: new Date(income.date),
      job_status: income.job_status as "in_progress" | "completed",
      job_completion_date: income.job_completion_date ? new Date(income.job_completion_date) : null,
      payment_method: income.payment_method,
      source: income.source,
      type: income.type,
      job_type: income.job_type as "shooting" | "upgrade" | "product" | null,
    });
    setCurrentPaymentSlip(income.payment_slip_path);
  }, [income, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Upload payment slip if provided
      let payment_slip_path = currentPaymentSlip;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('company-income')
          .upload(fileName, file);

        if (uploadError) {
          throw new Error("Failed to upload payment slip: " + uploadError.message);
        }

        payment_slip_path = fileName;
      }

      // Format dates for update
      const formattedDate = format(values.date, 'yyyy-MM-dd');
      const formattedCompletionDate = values.job_completion_date 
        ? format(values.job_completion_date, 'yyyy-MM-dd') 
        : null;

      // Update record
      const { error } = await supabase
        .from('company_income')
        .update({
          company_name: values.company_name,
          client: values.client || null,
          deposit: values.deposit,
          amount: values.amount,
          date: formattedDate,
          job_status: values.job_status,
          job_completion_date: formattedCompletionDate,
          payment_method: values.payment_method,
          payment_slip_path,
          source: values.source,
          type: values.type,
          job_type: values.job_type,
        })
        .eq('id', income.id);

      if (error) {
        throw new Error("Failed to update income: " + error.message);
      }

      toast.success("Income updated successfully");
      onSuccess();
      setOpen(false);
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
      console.error("Error updating income:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const downloadCurrentSlip = async () => {
    if (!currentPaymentSlip) {
      toast.error("No payment slip available");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("company-income")
        .download(currentPaymentSlip);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-slip-${income.id}.${currentPaymentSlip.split(".").pop()}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download payment slip");
      console.error("Error downloading payment slip:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Company Income</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Brand</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Billy ONAIR">Billy ONAIR</SelectItem>
                        <SelectItem value="ONAIR Studio">ONAIR Studio</SelectItem>
                        <SelectItem value="Sonnet Moment">Sonnet Moment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <Input placeholder="Client name" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="full">Full Payment</SelectItem>
                        <SelectItem value="partial">Deposit</SelectItem>
                        <SelectItem value="balance">Balance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (HKD)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" placeholder="Amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="job_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="job_completion_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Job Completion Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
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
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="payme">PayMe</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="Income source" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Income type" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="job_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="shooting">Shooting</SelectItem>
                      <SelectItem value="upgrade">Upgrade</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Payment Slip</FormLabel>
              {currentPaymentSlip && (
                <div className="flex items-center mb-2">
                  <span className="text-sm">Current file: {currentPaymentSlip.split('/').pop()}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={downloadCurrentSlip}
                    className="ml-2"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  id="payment-slip"
                  type="file"
                  onChange={handleFileChange}
                  className="w-full"
                  accept="image/*,.pdf"
                />
                {file && (
                  <div className="text-sm text-green-600 flex items-center gap-1">
                    <span>Selected: {file.name}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCompanyIncomeDialog;
