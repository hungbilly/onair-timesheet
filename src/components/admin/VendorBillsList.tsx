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
import { Download, Trash, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getMonthDateRange } from "@/utils/dateUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type VendorBill = Database["public"]["Tables"]["vendor_bills"]["Row"] & {
  vendors: { name: string } | null;
};

interface VendorBillsListProps {
  refreshTrigger: number;
  selectedMonth: string;
}

const VendorBillsList = ({ refreshTrigger, selectedMonth }: VendorBillsListProps) => {
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [editingBill, setEditingBill] = useState<VendorBill | null>(null);
  const [editFormData, setEditFormData] = useState({
    amount: "",
    description: "",
  });

  const fetchBills = async () => {
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);

      const { data, error } = await supabase
        .from("vendor_bills")
        .select(`
          *,
          vendors:vendor_id(name)
        `)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order("due_date", { ascending: false });

      if (error) throw error;
      setBills(data || []);
      
      // Calculate total amount
      const total = (data || []).reduce((sum, bill) => sum + bill.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast.error("Failed to load vendor bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [refreshTrigger, selectedMonth]);

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

  const handleDelete = async (billId: string) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;

    try {
      const { error } = await supabase
        .from("vendor_bills")
        .delete()
        .eq("id", billId);

      if (error) throw error;
      toast.success("Bill deleted successfully");
      fetchBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast.error("Failed to delete bill");
    }
  };

  const handleEdit = (bill: VendorBill) => {
    setEditingBill(bill);
    setEditFormData({
      amount: bill.amount.toString(),
      description: bill.description || "",
    });
  };

  const handleUpdate = async () => {
    if (!editingBill) return;

    try {
      const { error } = await supabase
        .from("vendor_bills")
        .update({
          amount: Number(editFormData.amount),
          description: editFormData.description,
        })
        .eq("id", editingBill.id);

      if (error) throw error;
      toast.success("Bill updated successfully");
      setEditingBill(null);
      fetchBills();
    } catch (error) {
      console.error("Error updating bill:", error);
      toast.error("Failed to update bill");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-lg font-semibold">
          Total Amount for {selectedMonth}: ${totalAmount.toFixed(2)}
        </p>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Actions</TableHead>
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
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(bill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(bill.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingBill} onOpenChange={(open) => !open && setEditingBill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Remarks</Label>
              <Textarea
                id="description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              />
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Update Bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorBillsList;