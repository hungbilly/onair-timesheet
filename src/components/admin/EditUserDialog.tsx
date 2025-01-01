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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditUserDialogProps {
  user: {
    id: string;
    email: string;
    role: "admin" | "staff";
    full_name: string | null;
  };
  onUserUpdated: () => void;
}

const EditUserDialog = ({ user, onUserUpdated }: EditUserDialogProps) => {
  const [fullName, setFullName] = useState(user.full_name || "");
  const [role, setRole] = useState<"admin" | "staff">(user.role);
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdateUser = async () => {
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          role: role,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      toast.success("User updated successfully");
      setIsOpen(false);
      onUserUpdated();
    } catch (error) {
      console.error("Error in handleUpdateUser:", error);
      toast.error("Error updating user");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={user.email}
              disabled
              className="bg-gray-100"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={(value: "admin" | "staff") => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleUpdateUser}>Update</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;