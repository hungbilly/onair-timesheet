import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import EmployeeDetailedEntries from "./EmployeeDetailedEntries";

interface EmployeeStats {
  id: string;
  full_name: string;
  email: string;
  total_salary: number;
  total_expenses: number;
}

interface StatsTableProps {
  stats: EmployeeStats[];
  timesheetEntries: Record<string, any[]>;
  expenses: Record<string, any[]>;
}

const StatsTable = ({ stats, timesheetEntries, expenses }: StatsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead></TableHead>
          <TableHead>Employee Info</TableHead>
          <TableHead>Payment Details</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stats.map((stat) => (
          <Collapsible key={stat.id}>
            <TableRow className="hover:bg-muted/50 transition-colors">
              <TableCell className="w-4">
                <CollapsibleTrigger className="h-4 w-4">
                  {open => (
                    <div className="h-4 w-4">
                      {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  )}
                </CollapsibleTrigger>
              </TableCell>
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
            </TableRow>
            <CollapsibleContent>
              <TableRow>
                <TableCell colSpan={3} className="p-0">
                  <div className="px-4 py-2 bg-muted/30">
                    <EmployeeDetailedEntries
                      timesheetEntries={timesheetEntries[stat.id] || []}
                      expenses={expenses[stat.id] || []}
                    />
                  </div>
                </TableCell>
              </TableRow>
            </CollapsibleContent>
          </Collapsible>
        ))}
        {stats.length > 0 && (
          <TableRow>
            <TableCell></TableCell>
            <TableCell className="font-bold">Total</TableCell>
            <TableCell>
              <div className="flex flex-col gap-1">
                <div>Salary: <span className="font-bold">${stats.reduce((sum, stat) => sum + stat.total_salary, 0).toFixed(2)}</span></div>
                <div>Expenses: <span className="font-bold">${stats.reduce((sum, stat) => sum + stat.total_expenses, 0).toFixed(2)}</span></div>
                <div>Total: <span className="font-bold">${stats.reduce((sum, stat) => sum + (stat.total_salary + stat.total_expenses), 0).toFixed(2)}</span></div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default StatsTable;