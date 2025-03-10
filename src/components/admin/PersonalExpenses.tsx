
import { useState } from "react";
import { Card } from "@/components/ui/card";
import PersonalExpensesList from "./PersonalExpensesList";
import CreatePersonalExpenseDialog from "./CreatePersonalExpenseDialog";
import { Wallet } from "lucide-react";
import MonthSelector from "./MonthSelector";

const PersonalExpenses = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleExpenseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
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
        <CreatePersonalExpenseDialog onExpenseCreated={handleExpenseCreated} />
      </div>

      <Card>
        <PersonalExpensesList refreshTrigger={refreshTrigger} selectedMonth={selectedMonth} />
      </Card>
    </div>
  );
};

export default PersonalExpenses;
