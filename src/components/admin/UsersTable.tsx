import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import EditUserDialog from "./EditUserDialog";

interface User {
  id: string;
  email: string;
  role: "admin" | "staff";
  full_name: string | null;
}

interface UsersTableProps {
  users: User[];
  onUpdateRole: (userId: string, newRole: "admin" | "staff") => void;
  onDeleteUser: (userId: string) => void;
  onUserUpdated: () => void;
}

const ResetPasswordDialog = ({ userId, onClose }: { userId: string, onClose: () => void }) => {
  const [newPassword, setNewPassword] = useState("");

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: newPassword }
      );

      if (error) throw error;
      
      toast.success("Password updated successfully");
      onClose();
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Error updating password");
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reset Password</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">New Password</label>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
        </div>
        <Button onClick={handleResetPassword}>Update Password</Button>
      </div>
    </DialogContent>
  );
};

const UsersTable = ({ users, onUpdateRole, onDeleteUser, onUserUpdated }: UsersTableProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Full Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span className="text-muted-foreground">
                  {user.full_name || "No display name"}
                </span>
              </TableCell>
              <TableCell>
                <Select
                  value={user.role}
                  onValueChange={(value: "admin" | "staff") =>
                    onUpdateRole(user.id, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="space-x-2">
                <EditUserDialog user={user} onUserUpdated={onUserUpdated} />
                <Dialog open={selectedUserId === user.id} onOpenChange={(open) => !open && setSelectedUserId(null)}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      Reset Password
                    </Button>
                  </DialogTrigger>
                  {selectedUserId === user.id && (
                    <ResetPasswordDialog 
                      userId={user.id} 
                      onClose={() => setSelectedUserId(null)} 
                    />
                  )}
                </Dialog>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteUser(user.id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default UsersTable;