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
      // First, create the user in auth.users
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password: "temporary123", // You might want to generate this randomly
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error("No user returned from signUp");

      // Wait for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify the profile exists and update it
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileCheckError) throw profileCheckError;
      if (!existingProfile) throw new Error("Profile not created by trigger");

      // Now update the profile with full name and role
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          role,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        throw updateError;
      }

      toast.success("User created successfully");
      setIsOpen(false);
      onUserCreated();
      
      // Reset form
      setEmail("");
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