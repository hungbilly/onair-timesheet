
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
import { useEffect, useState } from "react";

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
  const [approvalStates, setApprovalStates] = useState<Record<string, boolean>>({});

  // Fetch initial approval states
  useEffect(() => {
    const fetchApprovalStates = async () => {
      const { data: approvals, error } = await supabase
        .from("monthly_approvals")
        .select("user_id")
        .eq("month", selectedMonth);

      if (error) {
        console.error("Error fetching approvals:", error);
        return;
      }

      const states: Record<string, boolean> = {};
      approvals?.forEach((approval) => {
        states[approval.user_id] = true;
      });
      setApprovalStates(states);
    };

    fetchApprovalStates();
  }, [selectedMonth]);

  const handleApprove = async (employeeId: string) => {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user?.id) throw new Error("No user found");

      if (approvalStates[employeeId]) {
        // Delete approval
        const { error: deleteError } = await supabase
          .from("monthly_approvals")
          .delete()
          .eq("user_id", employeeId)
          .eq("month", selectedMonth);

        if (deleteError) {
          console.error("Delete error:", deleteError);
          throw deleteError;
        }

        setApprovalStates(prev => ({ ...prev, [employeeId]: false }));
        toast({
          title: "Success",
          description: "Monthly approval removed successfully",
        });
      } else {
        // Add approval
        const { error: insertError } = await supabase
          .from("monthly_approvals")
          .insert({
            user_id: employeeId,
            month: selectedMonth,
            approved_by: currentUser.user.id,
          });

        if (insertError) throw insertError;

        setApprovalStates(prev => ({ ...prev, [employeeId]: true }));
        toast({
          title: "Success",
          description: "Monthly entries approved successfully",
        });
      }
    } catch (error) {
      console.error("Error managing approval:", error);
      toast({
        title: "Error",
        description: "Failed to manage monthly approval",
        variant: "destructive",
      });
    }
  };

  // Calculate totals
  const totalSalary = stats.reduce((sum, stat) => sum + stat.total_salary, 0);
  const totalExpenses = stats.reduce((sum, stat) => sum + stat.total_expenses, 0);
  const grandTotal = totalSalary + totalExpenses;

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
        {stats.length > 0 && (
          <TableRow className="bg-muted/30">
            <TableCell className="font-bold">Total</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div>Salary: <span className="font-bold">${totalSalary.toFixed(2)}</span></div>
                <div>Expenses: <span className="font-bold">${totalExpenses.toFixed(2)}</span></div>
                <div>Total: <span className="font-bold">${grandTotal.toFixed(2)}</span></div>
              </div>
            </TableCell>
            <TableCell />
          </TableRow>
        )}
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
                variant={approvalStates[stat.id] ? "default" : "destructive"}
              >
                {approvalStates[stat.id] ? "Approved" : "Not Approved"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default StatsTable;
