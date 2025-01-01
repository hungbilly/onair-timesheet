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

interface CreateUserDialogProps {
  onUserCreated: () => void;
}

const CreateUserDialog = ({ onUserCreated }: CreateUserDialogProps) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateUser = async () => {
    try {
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password: "temporary123", // You might want to generate this randomly
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("No user returned from signUp");

      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ role, full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      toast.success("User created successfully");
      setIsOpen(false);
      onUserCreated();
      
      // Reset form
      setEmail("");
      setFullName("");
      setRole("staff");
    } catch (error) {
      toast.error("Error creating user");
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <Button onClick={handleCreateUser}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;