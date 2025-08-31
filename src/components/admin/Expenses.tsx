import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import StudioExpenses from "./StudioExpenses";
import PersonalExpenses from "./PersonalExpenses";
import CreateExpenseDialog from "./CreateExpenseDialog";

interface ExpensesProps {
  userRole: "admin" | "manager";
}

const Expenses = ({ userRole }: ExpensesProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleExpenseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Expenses
        </h2>
        <CreateExpenseDialog onExpenseCreated={handleExpenseCreated} />
      </div>

      <Tabs defaultValue="studio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="studio">Studio Expenses</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="personal">Personal Expenses</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="studio">
          <StudioExpenses key={`studio-${refreshTrigger}`} />
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="personal">
            <PersonalExpenses key={`personal-${refreshTrigger}`} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Expenses;