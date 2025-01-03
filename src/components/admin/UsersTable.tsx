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
  role: "admin" | "staff";
  full_name: string | null;
}

interface UsersTableProps {
  users: User[];
  onUpdateRole: (userId: string, newRole: "admin" | "staff") => void;
  onDeleteUser: (userId: string) => void;
  onUserUpdated: () => void;
}

const UsersTable = ({ users, onUpdateRole, onDeleteUser, onUserUpdated }: UsersTableProps) => {
  return (
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