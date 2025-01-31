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
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type VendorBill = Database["public"]["Tables"]["vendor_bills"]["Row"] & {
  vendors: { name: string } | null;
};

interface VendorBillsListProps {
  refreshTrigger: number;
}

const VendorBillsList = ({ refreshTrigger }: VendorBillsListProps) => {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from("vendor_bills")
        .select(`
          *,
          vendors:vendor_id(name)
        `)
        .order("created_at", { ascending: false });

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
  }, [refreshTrigger]);

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
            <TableHead>Remarks</TableHead>
            <TableHead>Invoice</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bills.map((bill) => (
            <TableRow key={bill.id}>
              <TableCell>{bill.vendors?.name}</TableCell>
              <TableCell>${bill.amount.toFixed(2)}</TableCell>
              <TableCell>{bill.description}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VendorBillsList;