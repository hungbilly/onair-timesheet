import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmployeeStats {
  id: string;
  full_name: string;
  email: string;
  total_salary: number;
  total_expenses: number;
}

interface StatsTableProps {
  stats: EmployeeStats[];
  selectedMonth: string;
}

const StatsTable = ({ stats, selectedMonth }: StatsTableProps) => {
  const { toast } = useToast();

  const handleApprove = async (employeeId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user?.id) throw new Error("No user found");

      const { error } = await supabase
        .from("monthly_approvals")
        .upsert(
          {
            user_id: employeeId,
            month: selectedMonth,
            approved_by: currentUser.user.id,
            approved_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,month',
            ignoreDuplicates: false,
          }
        );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Monthly entries approved successfully",
      });
    } catch (error) {
      console.error("Error approving entries:", error);
      toast({
        title: "Error",
        description: "Failed to approve monthly entries",
        variant: "destructive",
      });
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Info</TableHead>
          <TableHead>Payment Details</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stats.map((stat) => (
          <TableRow key={stat.id}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span>{stat.email}</span>
                <span className="text-sm text-muted-foreground">
                  {stat.full_name || "No display name"}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div>Salary: <span className="font-medium">${stat.total_salary.toFixed(2)}</span></div>
                <div>Expenses: <span className="font-medium">${stat.total_expenses.toFixed(2)}</span></div>
                <div>Total: <span className="font-medium">${(stat.total_salary + stat.total_expenses).toFixed(2)}</span></div>
              </div>
            </TableCell>
            <TableCell>
              <Button 
                onClick={() => handleApprove(stat.id)}
                size="sm"
              >
                Approve Month
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {stats.length > 0 && (
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div>Salary: <span className="font-bold">${stats.reduce((sum, stat) => sum + stat.total_salary, 0).toFixed(2)}</span></div>
                <div>Expenses: <span className="font-bold">${stats.reduce((sum, stat) => sum + stat.total_expenses, 0).toFixed(2)}</span></div>
                <div>Total: <span className="font-bold">${stats.reduce((sum, stat) => sum + (stat.total_salary + stat.total_expenses), 0).toFixed(2)}</span></div>
              </div>
            </TableCell>
            <TableCell />
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default StatsTable;