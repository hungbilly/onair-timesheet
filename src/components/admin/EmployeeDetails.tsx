import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

interface EmployeeDetail {
  id: string;
  user_id: string;
  full_name: string;
  address: string | null;
  mobile: string | null;
  salary_details: string | null;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
}

const EmployeeDetails = () => {
  const [employeeDetails, setEmployeeDetails] = useState<EmployeeDetail[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDetail | null>(null);
  const [formData, setFormData] = useState({
    user_id: "",
    full_name: "",
    address: "",
    mobile: "",
    salary_details: "",
  });

  const fetchEmployeeDetails = async () => {
    const { data, error } = await supabase
      .from("employee_details")
      .select("*")
      .order("full_name", { ascending: true });

    if (error) {
      toast.error("Error fetching employee details");
      console.error(error);
      return;
    }

    setEmployeeDetails(data || []);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });

    if (error) {
      toast.error("Error fetching profiles");
      console.error(error);
      return;
    }

    setProfiles(data || []);
  };

  useEffect(() => {
    fetchEmployeeDetails();
    fetchProfiles();
  }, []);

  const resetForm = () => {
    setFormData({
      user_id: "",
      full_name: "",
      address: "",
      mobile: "",
      salary_details: "",
    });
    setEditingEmployee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id || !formData.full_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingEmployee) {
        const { error } = await supabase
          .from("employee_details")
          .update({
            full_name: formData.full_name,
            address: formData.address,
            mobile: formData.mobile,
            salary_details: formData.salary_details,
          })
          .eq("id", editingEmployee.id);

        if (error) throw error;
        toast.success("Employee details updated successfully");
      } else {
        const { error } = await supabase
          .from("employee_details")
          .insert([formData]);

        if (error) throw error;
        toast.success("Employee details created successfully");
      }

      fetchEmployeeDetails();
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Error saving employee details");
      console.error(error);
    }
  };

  const handleEdit = (employee: EmployeeDetail) => {
    setEditingEmployee(employee);
    setFormData({
      user_id: employee.user_id,
      full_name: employee.full_name,
      address: employee.address || "",
      mobile: employee.mobile || "",
      salary_details: employee.salary_details || "",
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this employee detail?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("employee_details")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Employee details deleted successfully");
      fetchEmployeeDetails();
    } catch (error: any) {
      toast.error(error.message || "Error deleting employee details");
      console.error(error);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Details</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Employee Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Employee Details" : "Add Employee Details"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">Employee *</Label>
                <select
                  id="user_id"
                  value={formData.user_id}
                  onChange={(e) =>
                    setFormData({ ...formData, user_id: e.target.value })
                  }
                  disabled={!!editingEmployee}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="">Select an employee</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.full_name || profile.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_details">Salary Details</Label>
                <Textarea
                  id="salary_details"
                  value={formData.salary_details}
                  onChange={(e) =>
                    setFormData({ ...formData, salary_details: e.target.value })
                  }
                  rows={4}
                  placeholder="Enter salary details in text format"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleDialogOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEmployee ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Salary Details</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employeeDetails.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No employee details found. Add one to get started.
                </TableCell>
              </TableRow>
            ) : (
              employeeDetails.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.full_name}
                  </TableCell>
                  <TableCell>{employee.address || "-"}</TableCell>
                  <TableCell>{employee.mobile || "-"}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {employee.salary_details || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(employee)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeDetails;
