import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeEntryForm from "@/components/TimeEntryForm";
import TimeEntryHistory from "@/components/TimeEntryHistory";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseHistory from "@/components/ExpenseHistory";

const Index = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Employee Dashboard</h1>
      
      <div className="mt-8">
        <Tabs defaultValue="time-entry" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="time-entry">New Time Entry</TabsTrigger>
            <TabsTrigger value="time-history">Time History</TabsTrigger>
            <TabsTrigger value="expense-entry">New Expense</TabsTrigger>
            <TabsTrigger value="expense-history">Expense History</TabsTrigger>
          </TabsList>
          <TabsContent value="time-entry" className="mt-6">
            <div className="max-w-md mx-auto">
              <TimeEntryForm />
            </div>
          </TabsContent>
          <TabsContent value="time-history" className="mt-6">
            <TimeEntryHistory />
          </TabsContent>
          <TabsContent value="expense-entry" className="mt-6">
            <div className="max-w-md mx-auto">
              <ExpenseForm />
            </div>
          </TabsContent>
          <TabsContent value="expense-history" className="mt-6">
            <ExpenseHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;