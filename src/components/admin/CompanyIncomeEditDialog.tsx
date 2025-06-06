import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CompanyIncomeRecord } from "@/types";

const BRAND_OPTIONS = ["Billy ONAIR", "ONAIR Studio", "Sonnet Moment"];
const PAYMENT_TYPE_OPTIONS = ["Deposit", "Balance", "Full Payment"];
const PAYMENT_METHOD_OPTIONS = ["Bank Transfer (Riano)", "Bank Transfer (Personal)", "Payme", "Cash"];
const JOB_TYPE_OPTIONS = ["Shooting", "Upgrade", "Products", "Petty Cash"];

interface CompanyIncomeEditDialogProps {
  record: CompanyIncomeRecord;
}

const CompanyIncomeEditDialog = ({ record }: CompanyIncomeEditDialogProps) => {
  const [open, setOpen] = useState(false);
  const [client, setClient] = useState(record.client);
  const [amount, setAmount] = useState(record.amount.toString());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    record.date ? new Date(record.date) : undefined
  );
  const [brand, setBrand] = useState(record.brand);
  const [paymentType, setPaymentType] = useState(record.payment_type);
  const [paymentMethod, setPaymentMethod] = useState(record.payment_method);
  const [completionDate, setCompletionDate] = useState<Date | undefined>(
    record.completion_date ? new Date(record.completion_date) : undefined
  );
  const [jobType, setJobType] = useState(record.job_type || JOB_TYPE_OPTIONS[0].toLowerCase());
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setClient(record.client);
      setAmount(record.amount.toString());
      setSelectedDate(record.date ? new Date(record.date) : undefined);
      setBrand(record.brand);
      setPaymentType(record.payment_type);
      setPaymentMethod(record.payment_method);
      setCompletionDate(record.completion_date ? new Date(record.completion_date) : undefined);
      setJobType(record.job_type || JOB_TYPE_OPTIONS[0].toLowerCase());
    }
  }, [record, open]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!client.trim() || !amount.trim() || !selectedDate) {
        toast.error("Please fill in all required fields");
        return;
      }

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const { error } = await supabase
        .from("company_income")
        .update({
          client: client.trim(),
          amount: numericAmount,
          date: format(selectedDate, "yyyy-MM-dd"),
          brand,
          payment_type: paymentType,
          payment_method: paymentMethod,
          completion_date: completionDate ? format(completionDate, "yyyy-MM-dd") : null,
          job_type: jobType.toLowerCase(),
        })
        .eq("id", record.id);

      if (error) {
        toast.error("Failed to update income record");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyIncome"] });
      setOpen(false);
      toast.success("Income record updated successfully");
    },
    onError: () => {
      toast.error("Failed to update income record");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8"
      >
        <Pencil className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Edit Income Record</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client</Label>
                <Input
                  id="client"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {BRAND_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Select 
                  value={jobType.charAt(0).toUpperCase() + jobType.slice(1)} 
                  onValueChange={(value) => setJobType(value.toLowerCase())}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type</Label>
                <Select value={paymentType} onValueChange={setPaymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Completion Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !completionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {completionDate ? (
                        format(completionDate, "PPP")
                      ) : (
                        <span>Pick a date (optional)</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={completionDate}
                      onSelect={setCompletionDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CompanyIncomeEditDialog;
