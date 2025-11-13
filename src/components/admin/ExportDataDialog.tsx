import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExportDataDialogProps {
  employees: { id: string; full_name: string; email: string }[];
  onExportCsv: (selectedMonths: string[], selectedEmployees: string[], includeReceipts: boolean) => void;
  onExportXlsx: (selectedMonths: string[], selectedEmployees: string[], includeReceipts: boolean) => void;
}

const ExportDataDialog = ({
  employees,
  onExportCsv,
  onExportXlsx,
}: ExportDataDialogProps) => {
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [includeReceipts, setIncludeReceipts] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Generate array of last 12 months
  const getLastTwelveMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      months.push(monthStr);
    }
    return months;
  };

  const months = getLastTwelveMonths();

  const handleMonthToggle = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month]
    );
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAllMonths = () => {
    setSelectedMonths(selectedMonths.length === months.length ? [] : months);
  };

  const handleSelectAllEmployees = () => {
    const allEmployeeIds = employees.map((emp) => emp.id);
    setSelectedEmployees(
      selectedEmployees.length === employees.length ? [] : allEmployeeIds
    );
  };

  const handleExport = (type: "csv" | "xlsx") => {
    const monthsToExport = selectedMonths.length > 0 ? selectedMonths : months;
    const employeesToExport =
      selectedEmployees.length > 0
        ? selectedEmployees
        : employees.map((emp) => emp.id);

    if (type === "csv") {
      onExportCsv(monthsToExport, employeesToExport, includeReceipts);
    } else {
      onExportXlsx(monthsToExport, employeesToExport, includeReceipts);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Export</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Months</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllMonths}
              >
                {selectedMonths.length === months.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {months.map((month) => (
                <div
                  key={month}
                  className="flex items-center space-x-2 py-1"
                >
                  <Checkbox
                    id={`month-${month}`}
                    checked={selectedMonths.includes(month)}
                    onCheckedChange={() => handleMonthToggle(month)}
                  />
                  <Label htmlFor={`month-${month}`}>
                    {new Date(month).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                    })}
                  </Label>
                </div>
              ))}
            </ScrollArea>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Employees</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllEmployees}
              >
                {selectedEmployees.length === employees.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
            <ScrollArea className="h-[200px] border rounded-md p-2">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center space-x-2 py-1"
                >
                  <Checkbox
                    id={`employee-${employee.id}`}
                    checked={selectedEmployees.includes(employee.id)}
                    onCheckedChange={() => handleEmployeeToggle(employee.id)}
                  />
                  <Label htmlFor={`employee-${employee.id}`}>
                    {employee.full_name || employee.email}
                  </Label>
                </div>
              ))}
            </ScrollArea>
          </div>
        </div>
        <div className="flex items-center space-x-2 mt-4 mb-2">
          <Checkbox
            id="include-receipts"
            checked={includeReceipts}
            onCheckedChange={(checked) => setIncludeReceipts(checked as boolean)}
          />
          <Label htmlFor="include-receipts" className="cursor-pointer">
            Include receipt files (will download as ZIP)
          </Label>
        </div>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => handleExport("csv")}>
            Export as CSV
          </Button>
          <Button onClick={() => handleExport("xlsx")}>
            Export as Spreadsheet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataDialog;