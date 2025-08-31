import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import CreateExpenseDialog from "./CreateExpenseDialog";
import ExpensesByMethod from "./ExpensesByMethod";
import MonthSelector from "./MonthSelector";

// Dynamic imports to avoid potential circular dependencies
import { lazy, Suspense } from "react";
const StudioExpenses = lazy(() => import("./StudioExpenses"));
const PersonalExpenses = lazy(() => import("./PersonalExpenses"));

interface ExpensesProps {
  userRole: "admin" | "manager";
}

const Expenses = ({ userRole }: ExpensesProps) => {
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
            <DollarSign className="h-5 w-5" />
            Expenses
          </h2>
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
        <CreateExpenseDialog onExpenseCreated={handleExpenseCreated} />
      </div>

      <Tabs defaultValue="studio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="studio">Studio Expenses</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="personal">Personal Expenses</TabsTrigger>
          )}
          <TabsTrigger value="studio-methods">Studio by Method</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="personal-methods">Personal by Method</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="studio">
          <Suspense fallback={<div>Loading...</div>}>
            <StudioExpenses key={`studio-${refreshTrigger}`} refreshTrigger={refreshTrigger} />
          </Suspense>
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="personal">
            <Suspense fallback={<div>Loading...</div>}>
              <PersonalExpenses key={`personal-${refreshTrigger}`} refreshTrigger={refreshTrigger} />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="studio-methods">
          <ExpensesByMethod 
            refreshTrigger={refreshTrigger} 
            selectedMonth={selectedMonth}
            expenseType="studio"
          />
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="personal-methods">
            <ExpensesByMethod 
              refreshTrigger={refreshTrigger} 
              selectedMonth={selectedMonth}
              expenseType="personal"
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Expenses;