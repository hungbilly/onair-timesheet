import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeEntryForm from "@/components/TimeEntryForm";
import ExpenseForm from "@/components/ExpenseForm";
import { DashboardStats } from "@/components/DashboardStats";

const Index = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Employee Dashboard</h1>
      
      <DashboardStats />
      
      <div className="mt-8">
        <Tabs defaultValue="timesheet" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timesheet">Timesheet</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <TabsContent value="timesheet" className="mt-6">
            <div className="max-w-md mx-auto">
              <TimeEntryForm />
            </div>
          </TabsContent>
          <TabsContent value="expenses" className="mt-6">
            <div className="max-w-md mx-auto">
              <ExpenseForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;