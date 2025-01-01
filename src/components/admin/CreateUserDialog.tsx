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
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "staff">("staff");
  const [isOpen, setIsOpen] = useState(false);

  const handleCreateUser = async () => {
    try {
      // First, create the user in auth.users
      const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("No user returned from signUp");

      // Now create/update the profile with full name and role
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: email,
          full_name: fullName,
          role: role,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("Profile update error:", profileError);
        throw profileError;
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
      toast.error("Error creating user");
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