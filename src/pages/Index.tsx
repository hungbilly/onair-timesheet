import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimeEntryForm from "@/components/TimeEntryForm";
import TimeEntryHistory from "@/components/TimeEntryHistory";

const Index = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Employee Timesheet Dashboard</h1>
      
      <div className="mt-8">
        <Tabs defaultValue="new-entry" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new-entry">New Entry</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="new-entry" className="mt-6">
            <div className="max-w-md mx-auto">
              <TimeEntryForm />
            </div>
          </TabsContent>
          <TabsContent value="history" className="mt-6">
            <TimeEntryHistory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;