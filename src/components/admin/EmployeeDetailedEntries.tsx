import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TimePickerInput } from "../TimePickerInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeEntry {
  id: string;
  date: string;
  work_type: "hourly" | "job";
  job_description: string;
  hours: number | null;
  total_salary: number;
  hourly_rate: number | null;
  start_time: string | null;
  end_time: string | null;
  job_count: number | null;
  job_rate: number | null;
}

interface ExpenseEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  receipt_path: string | null;
}

interface EmployeeDetailedEntriesProps {
  timesheetEntries: TimeEntry[];
  expenses: ExpenseEntry[];
  onUpdate: () => void;
  userId: string;
}

const EmployeeDetailedEntries = ({
  timesheetEntries,
  expenses,
  onUpdate,
  userId,
}: EmployeeDetailedEntriesProps) => {
  const [editingTimeEntry, setEditingTimeEntry] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editedTimeEntry, setEditedTimeEntry] = useState<TimeEntry | null>(null);
  const [editedExpense, setEditedExpense] = useState<ExpenseEntry | null>(null);

  const handleDeleteTimeEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from("timesheet_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Time entry deleted successfully");
      onUpdate();
    } catch (error) {
      console.error("Error deleting time entry:", error);
      toast.error("Failed to delete time entry");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Expense deleted successfully");
      onUpdate();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast.error("Failed to delete expense");
    }
  };

  const handleSaveTimeEntry = async () => {
    if (!editedTimeEntry) return;

    try {
      const { error } = await supabase
        .from("timesheet_entries")
        .update({
          date: editedTimeEntry.date,
          work_type: editedTimeEntry.work_type,
          job_description: editedTimeEntry.job_description,
          hours: editedTimeEntry.hours,
          hourly_rate: editedTimeEntry.hourly_rate,
          start_time: editedTimeEntry.start_time,
          end_time: editedTimeEntry.end_time,
          job_count: editedTimeEntry.job_count,
          job_rate: editedTimeEntry.job_rate,
          total_salary: editedTimeEntry.work_type === "hourly"
            ? (editedTimeEntry.hours || 0) * (editedTimeEntry.hourly_rate || 0)
            : (editedTimeEntry.job_count || 0) * (editedTimeEntry.job_rate || 0),
        })
        .eq("id", editedTimeEntry.id);

      if (error) throw error;
      toast.success("Time entry updated successfully");
      setEditingTimeEntry(null);
      onUpdate();
    } catch (error) {
      console.error("Error updating time entry:", error);
      toast.error("Failed to update time entry");
    }
  };

  const handleSaveExpense = async () => {
    if (!editedExpense) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .update({
          date: editedExpense.date,
          description: editedExpense.description,
          amount: editedExpense.amount,
        })
        .eq("id", editedExpense.id);

      if (error) throw error;
      toast.success("Expense updated successfully");
      setEditingExpense(null);
      onUpdate();
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense");
    }
  };

  const handleCreateTimeEntry = async () => {
    const newEntry = {
      user_id: userId,
      date: new Date().toISOString().slice(0, 10),
      work_type: "hourly" as const,
      job_description: "",
      hours: 0,
      hourly_rate: 0,
      total_salary: 0,
    };

    try {
      const { error } = await supabase
        .from("timesheet_entries")
        .insert(newEntry);

      if (error) throw error;
      toast.success("Time entry created successfully");
      onUpdate();
    } catch (error) {
      console.error("Error creating time entry:", error);
      toast.error("Failed to create time entry");
    }
  };

  const handleCreateExpense = async () => {
    const newExpense = {
      user_id: userId,
      date: new Date().toISOString().slice(0, 10),
      description: "",
      amount: 0,
    };

    try {
      const { error } = await supabase
        .from("expenses")
        .insert(newExpense);

      if (error) throw error;
      toast.success("Expense created successfully");
      onUpdate();
    } catch (error) {
      console.error("Error creating expense:", error);
      toast.error("Failed to create expense");
    }
  };

  return (
    <div className="space-y-8 mt-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Timesheet Entries</h3>
          <Button onClick={handleCreateTimeEntry}>Add Time Entry</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheetEntries.map((entry) => (
              <TableRow key={entry.id}>
                {editingTimeEntry === entry.id ? (
                  <>
                    <TableCell>
                      <Input
                        type="date"
                        value={editedTimeEntry?.date}
                        onChange={(e) =>
                          setEditedTimeEntry(prev => prev ? { ...prev, date: e.target.value } : null)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={editedTimeEntry?.work_type}
                        onValueChange={(value: "hourly" | "job") =>
                          setEditedTimeEntry(prev => prev ? { ...prev, work_type: value } : null)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="job">Job</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editedTimeEntry?.job_description}
                        onChange={(e) =>
                          setEditedTimeEntry(prev => prev ? { ...prev, job_description: e.target.value } : null)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {editedTimeEntry?.work_type === "hourly" ? (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            value={editedTimeEntry.hours || ""}
                            onChange={(e) =>
                              setEditedTimeEntry(prev => prev ? { ...prev, hours: Number(e.target.value) } : null)
                            }
                            placeholder="Hours"
                          />
                          <Input
                            type="number"
                            value={editedTimeEntry.hourly_rate || ""}
                            onChange={(e) =>
                              setEditedTimeEntry(prev => prev ? { ...prev, hourly_rate: Number(e.target.value) } : null)
                            }
                            placeholder="Rate/hr"
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            type="number"
                            value={editedTimeEntry?.job_count || ""}
                            onChange={(e) =>
                              setEditedTimeEntry(prev => prev ? { ...prev, job_count: Number(e.target.value) } : null)
                            }
                            placeholder="Job count"
                          />
                          <Input
                            type="number"
                            value={editedTimeEntry?.job_rate || ""}
                            onChange={(e) =>
                              setEditedTimeEntry(prev => prev ? { ...prev, job_rate: Number(e.target.value) } : null)
                            }
                            placeholder="Rate/job"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      ${((editedTimeEntry?.work_type === "hourly"
                        ? (editedTimeEntry.hours || 0) * (editedTimeEntry.hourly_rate || 0)
                        : (editedTimeEntry?.job_count || 0) * (editedTimeEntry?.job_rate || 0)
                      )).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleSaveTimeEntry}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingTimeEntry(null);
                            setEditedTimeEntry(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="capitalize">{entry.work_type}</TableCell>
                    <TableCell>{entry.job_description}</TableCell>
                    <TableCell>
                      {entry.work_type === "hourly" ? (
                        <div>
                          {entry.hours} hrs @ ${entry.hourly_rate}/hr
                        </div>
                      ) : (
                        <div>
                          {entry.job_count} jobs @ ${entry.job_rate}/job
                        </div>
                      )}
                    </TableCell>
                    <TableCell>${entry.total_salary.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingTimeEntry(entry.id);
                            setEditedTimeEntry(entry);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteTimeEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Expenses</h3>
          <Button onClick={handleCreateExpense}>Add Expense</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                {editingExpense === expense.id ? (
                  <>
                    <TableCell>
                      <Input
                        type="date"
                        value={editedExpense?.date}
                        onChange={(e) =>
                          setEditedExpense(prev => prev ? { ...prev, date: e.target.value } : null)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editedExpense?.description}
                        onChange={(e) =>
                          setEditedExpense(prev => prev ? { ...prev, description: e.target.value } : null)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={editedExpense?.amount}
                        onChange={(e) =>
                          setEditedExpense(prev => prev ? { ...prev, amount: Number(e.target.value) } : null)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {expense.receipt_path && (
                        <a
                          href={`${supabase.storage.from('receipts').getPublicUrl(expense.receipt_path).data.publicUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Receipt
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleSaveExpense}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingExpense(null);
                            setEditedExpense(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>${expense.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {expense.receipt_path && (
                        <a
                          href={`${supabase.storage.from('receipts').getPublicUrl(expense.receipt_path).data.publicUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Receipt
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setEditingExpense(expense.id);
                            setEditedExpense(expense);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EmployeeDetailedEntries;