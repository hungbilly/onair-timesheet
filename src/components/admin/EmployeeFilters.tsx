import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmployeeFiltersProps {
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedEmployee: string;
  setSelectedEmployee: (employeeId: string) => void;
  employees: { id: string; full_name: string; email: string }[];
}

const EmployeeFilters = ({
  selectedMonth,
  setSelectedMonth,
  selectedEmployee,
  setSelectedEmployee,
  employees,
}: EmployeeFiltersProps) => {
  return (
    <div className="flex gap-4 items-center">
      <div>
        <label className="block text-sm font-medium mb-1">Month</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Employee</label>
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.full_name || employee.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default EmployeeFilters;