import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, XCircle, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type VendorBill = Database["public"]["Tables"]["vendor_bills"]["Row"] & {
  vendors: { name: string } | null;
  profiles_created_by: { full_name: string } | null;
  profiles_paid_by: { full_name: string } | null;
};

interface VendorBillsListProps {
  filter: "all" | "pending" | "paid";
  refreshTrigger: number;
}

const VendorBillsList = ({ filter, refreshTrigger }: VendorBillsListProps) => {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    try {
      let query = supabase
        .from("vendor_bills")
        .select(`
          *,
          vendors:vendor_id(name),
          profiles_created_by:profiles!vendor_bills_created_by_fkey(full_name),
          profiles_paid_by:profiles!vendor_bills_paid_by_fkey(full_name)
        `)
        .order("due_date", { ascending: true });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      setBills(data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to load vendor bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [filter, refreshTrigger]);

  const handleMarkAsPaid = async (billId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("vendor_bills")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          paid_by: user.id,
        })
        .eq("id", billId);

      if (error) throw error;

      toast.success("Bill marked as paid");
      fetchBills();
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      toast.error("Failed to mark bill as paid");
    }
  };

  const handleDownloadInvoice = async (invoicePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("receipts")
        .download(invoicePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = invoicePath.split("/").pop() || "invoice";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Failed to download invoice");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{bill.vendors?.name}</TableCell>
              <TableCell>${bill.amount.toFixed(2)}</TableCell>
              <TableCell>{new Date(bill.due_date).toLocaleDateString()}</TableCell>
              <TableCell>
                {bill.status === "paid" ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Paid</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>Pending</span>
                  </div>
                )}
              </TableCell>
              <TableCell>{bill.description}</TableCell>
              <TableCell>{bill.profiles_created_by?.full_name}</TableCell>
              <TableCell>
                {bill.invoice_path && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownloadInvoice(bill.invoice_path!)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell>
                {bill.status === "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsPaid(bill.id)}
                  >
                    Mark as Paid
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VendorBillsList;