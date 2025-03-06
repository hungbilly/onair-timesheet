
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CreateVendorBillDialogProps {
  onBillCreated: () => void;
}

const CreateVendorBillDialog = ({ onBillCreated }: CreateVendorBillDialogProps) => {
  const [open, setOpen] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string; }[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: "",
    amount: "",
    description: "",
    dueDate: new Date().toISOString().slice(0, 7), // Default to current month
    method: "",
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      let invoicePath = null;
      if (file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        invoicePath = fileName;
      }

      // Set the due date to the first day of the selected month
      const dueDate = `${formData.dueDate}-01`;

      const { error } = await supabase.from("vendor_bills").insert({
        vendor_id: formData.vendorId,
        amount: Number(formData.amount),
        description: formData.description,
        invoice_path: invoicePath,
        created_by: user.id,
        due_date: dueDate,
        method: formData.method || null,
      });

      if (error) throw error;

      toast.success("Vendor bill created successfully");
      setOpen(false);
      onBillCreated();
      setFormData({
        vendorId: "",
        amount: "",
        description: "",
        dueDate: new Date().toISOString().slice(0, 7),
        method: "",
      });
      setFile(null);
    } catch (error) {
      console.error("Error creating vendor bill:", error);
      toast.error("Failed to create vendor bill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) fetchVendors();
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Vendor Bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Select
              value={formData.vendorId}
              onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Input
              id="month"
              type="month"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Payment Method</Label>
            <Select
              value={formData.method}
              onValueChange={(value) => setFormData({ ...formData, method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank Transfer (Riano)">Bank Transfer (Riano)</SelectItem>
                <SelectItem value="Bank Transfer (Personal)">Bank Transfer (Personal)</SelectItem>
                <SelectItem value="PayMe">PayMe</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Remarks</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice">Invoice (Optional)</Label>
            <Input
              id="invoice"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Bill"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVendorBillDialog;
