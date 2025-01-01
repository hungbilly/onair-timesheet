import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import TimeEntryHistory from "@/components/TimeEntryHistory";
import ExpenseHistory from "@/components/ExpenseHistory";
import ProfileEditDialog from "@/components/ProfileEditDialog";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Employee Dashboard</h1>
        <div className="flex items-center gap-4">
          <ProfileEditDialog />
          <ChangePasswordDialog />
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>
      
      <div className="mt-8">
        <Tabs defaultValue="time-history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger 
              value="time-history"
              className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
            >
              Time History
            </TabsTrigger>
            <TabsTrigger 
              value="expense-history"
              className="data-[state=active]:bg-blue-500 data-[state=active]:text-white"
            >
              Expense History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="time-history" className="mt-6">
            <TimeEntryHistory />
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