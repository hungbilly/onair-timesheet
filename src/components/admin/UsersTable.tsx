
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
import EditUserDialog from "./EditUserDialog";

interface User {
  id: string;
  email: string;
  role: "admin" | "manager" | "staff";
  full_name: string | null;
}

interface UsersTableProps {
  users: User[];
  onUpdateRole: (userId: string, newRole: "admin" | "manager" | "staff") => void;
  onDeleteUser: (userId: string) => void;
  onUserUpdated: () => void;
}

const UsersTable = ({ users, onUpdateRole, onDeleteUser, onUserUpdated }: UsersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User Info</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span>{user.email}</span>
                <span className="text-sm text-muted-foreground">
                  {user.full_name || "No display name"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Select
                value={user.role}
                onValueChange={(value: "admin" | "manager" | "staff") =>
                  onUpdateRole(user.id, value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="space-x-2">
              <EditUserDialog user={user} onUserUpdated={onUserUpdated} />
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
  );
};

export default UsersTable;
