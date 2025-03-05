
import { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CompanyIncome } from "@/types";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ViewCompanyIncomeDialogProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  income: CompanyIncome;
}

const ViewCompanyIncomeDialog = ({ open, setOpen, income }: ViewCompanyIncomeDialogProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const downloadPaymentSlip = async () => {
    if (!income.payment_slip_path) {
      toast.error("No payment slip available");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("company-income")
        .download(income.payment_slip_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-slip-${income.id}.${income.payment_slip_path.split(".").pop()}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download payment slip");
      console.error("Error downloading payment slip:", error);
    }
  };

  const viewPaymentSlip = async () => {
    if (!income.payment_slip_path) {
      toast.error("No payment slip available");
      return;
    }

    try {
      const { data } = await supabase.storage
        .from("company-income")
        .getPublicUrl(income.payment_slip_path);

      if (data.publicUrl) {
        window.open(data.publicUrl, "_blank");
      }
    } catch (error) {
      toast.error("Failed to view payment slip");
      console.error("Error viewing payment slip:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Income Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Company:</div>
            <div>{income.company_name}</div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Client:</div>
            <div>{income.client || "N/A"}</div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Payment Type:</div>
            <div className="capitalize">{income.deposit}</div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Amount:</div>
            <div>{formatCurrency(income.amount)}</div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Date:</div>
            <div>{new Date(income.date).toLocaleDateString()}</div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Job Status:</div>
            <div className="capitalize">{income.job_status.replace("_", " ")}</div>
          </div>

          {income.job_completion_date && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="font-medium">Job Completion Date:</div>
              <div>{new Date(income.job_completion_date).toLocaleDateString()}</div>
            </div>
          )}

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Payment Method:</div>
            <div className="capitalize">{income.payment_method.replace("_", " ")}</div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Source:</div>
            <div>{income.source}</div>
          </div>

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Type:</div>
            <div>{income.type}</div>
          </div>

          {income.job_type && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="font-medium">Job Type:</div>
              <div className="capitalize">{income.job_type}</div>
            </div>
          )}

          {income.payment_slip_path && (
            <div className="grid grid-cols-2 items-center gap-4">
              <div className="font-medium">Payment Slip:</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewPaymentSlip}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" /> View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadPaymentSlip}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 items-center gap-4">
            <div className="font-medium">Created At:</div>
            <div>{new Date(income.created_at).toLocaleString()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCompanyIncomeDialog;
