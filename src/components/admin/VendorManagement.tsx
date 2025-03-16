import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import DeleteConfirmationDialog from "@/components/DeleteConfirmationDialog";

const vendorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface Vendor {
  id: string;
  name: string;
  description: string | null;
}

const VendorManagement = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .order("name");

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSubmit = async (values: VendorFormValues) => {
    try {
      if (selectedVendor) {
        // Update existing vendor
        const { error } = await supabase
          .from("vendors")
          .update({
            name: values.name,
            description: values.description || null,
          })
          .eq("id", selectedVendor.id);

        if (error) throw error;
        toast.success("Vendor updated successfully");
      } else {
        // Create new vendor
        const { error } = await supabase.from("vendors").insert({
          name: values.name,
          description: values.description || null,
        });

        if (error) throw error;
        toast.success("Vendor created successfully");
      }

      setIsDialogOpen(false);
      form.reset();
      setSelectedVendor(null);
      fetchVendors();
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error("Failed to save vendor");
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    form.reset({
      name: vendor.name,
      description: vendor.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (vendorId: string) => {
    setVendorToDelete(vendorId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!vendorToDelete) return;
    
    try {
      const { error } = await supabase.from("vendors").delete().eq("id", vendorToDelete);

      if (error) throw error;
      toast.success("Vendor deleted successfully");
      fetchVendors();
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast.error("Failed to delete vendor");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vendors</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setSelectedVendor(null);
                form.reset();
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedVendor ? "Edit Vendor" : "Add New Vendor"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">
                  {selectedVendor ? "Update" : "Create"} Vendor
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="flex justify-between items-center p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-medium">{vendor.name}</h3>
                {vendor.description && (
                  <p className="text-sm text-gray-500">{vendor.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(vendor)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDeleteClick(vendor.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {vendors.length === 0 && (
            <p className="text-center text-gray-500">No vendors found</p>
          )}
        </div>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor? This action cannot be undone."
      />
    </div>
  );
};

export default VendorManagement;
