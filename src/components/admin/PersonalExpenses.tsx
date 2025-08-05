
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PersonalExpensesList from "./PersonalExpensesList";
import CreatePersonalExpenseDialog from "./CreatePersonalExpenseDialog";
import { Wallet, Download } from "lucide-react";
import MonthSelector from "./MonthSelector";
import { supabase } from "@/integrations/supabase/client";
import { generatePersonalExpensesCsv } from "@/utils/csvExport";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const PersonalExpenses = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleExpenseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const exportPersonalExpenses = async (format: "csv" | "xlsx") => {
    try {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const { data: expenses, error } = await supabase
        .from("personal_expenses")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;

      if (format === "csv") {
        const csvContent = generatePersonalExpensesCsv(expenses || [], selectedMonth);
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `personal-expenses-${selectedMonth}.csv`;
        link.click();
      } else {
        const worksheet = XLSX.utils.json_to_sheet(expenses || []);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Personal Expenses");
        XLSX.writeFile(workbook, `personal-expenses-${selectedMonth}.xlsx`);
      }

      toast.success(`Personal expenses exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting personal expenses:", error);
      toast.error("Failed to export personal expenses");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Personal Expenses
          </h2>
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportPersonalExpenses("csv")}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => exportPersonalExpenses("xlsx")}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export XLSX
          </Button>
          <CreatePersonalExpenseDialog onExpenseCreated={handleExpenseCreated} />
        </div>
      </div>

      <Card>
        <PersonalExpensesList refreshTrigger={refreshTrigger} selectedMonth={selectedMonth} />
      </Card>
    </div>
  );
};

export default PersonalExpenses;
