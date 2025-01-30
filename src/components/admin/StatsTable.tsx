import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmployeeStats {
  id: string;
  full_name: string;
  email: string;
  total_salary: number;
  total_expenses: number;
}

interface StatsTableProps {
  stats: EmployeeStats[];
}

const StatsTable = ({ stats }: StatsTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Info</TableHead>
          <TableHead>Total Salary</TableHead>
          <TableHead>Total Expenses</TableHead>
          <TableHead>Total Payment</TableHead>
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
            <TableCell>${stat.total_salary.toFixed(2)}</TableCell>
            <TableCell>${stat.total_expenses.toFixed(2)}</TableCell>
            <TableCell>${(stat.total_salary + stat.total_expenses).toFixed(2)}</TableCell>
          </TableRow>
        ))}
        {stats.length > 0 && (
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            <TableCell className="font-bold">
              ${stats.reduce((sum, stat) => sum + stat.total_salary, 0).toFixed(2)}
            </TableCell>
            <TableCell className="font-bold">
              ${stats.reduce((sum, stat) => sum + stat.total_expenses, 0).toFixed(2)}
            </TableCell>
            <TableCell className="font-bold">
              ${stats.reduce((sum, stat) => sum + (stat.total_salary + stat.total_expenses), 0).toFixed(2)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default StatsTable;