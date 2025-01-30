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
import { useEffect, useState } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        setFullName(profile?.full_name || null);
      }
    };

    fetchUserProfile();
  }, []);

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
    <div className="container mx-auto py-6 px-4 sm:py-10 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Employee Dashboard</h1>
          {fullName && (
            <p className="text-muted-foreground mt-1">Welcome, {fullName}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
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