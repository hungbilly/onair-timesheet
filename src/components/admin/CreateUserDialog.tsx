import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No session found");
      }

      const response = await fetch(
        `${supabase.supabaseUrl}/functions/v1/admin-user-ops`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            operation: 'createUser',
            email,
            password,
            userData: {
              email,
              full_name: fullName,
              role,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create user');
      }

      toast.success("User created successfully");
      setIsOpen(false);
      onUserCreated();
      
      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      setRole("staff");
    } catch (error) {
      console.error("Error in handleCreateUser:", error);
      toast.error(error.message || "Error creating user");
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
          <DialogDescription>
            Create a new user account with their details and initial password.
          </DialogDescription>
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
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
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