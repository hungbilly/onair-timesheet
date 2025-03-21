
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import CreateUserDialog from "./CreateUserDialog";
import UsersTable from "./UsersTable";

interface User {
  id: string;
  email: string;
  role: "admin" | "manager" | "staff";
  full_name: string | null;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);

  const fetchUsers = async () => {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select(`
        id,
        role,
        full_name,
        email
      `);

    if (error) {
      toast.error("Error fetching users");
      return;
    }

    if (profiles) {
      setUsers(profiles);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdateRole = async (userId: string, newRole: "admin" | "manager" | "staff") => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Error updating role");
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error("Error deleting user");
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateUserDialog onUserCreated={fetchUsers} />
      </div>

      <UsersTable
        users={users}
        onUpdateRole={handleUpdateRole}
        onDeleteUser={handleDeleteUser}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
};

export default UserManagement;
