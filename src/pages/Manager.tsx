
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/components/DashboardStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import CompanyIncome from "@/components/admin/CompanyIncome";
import VendorBills from "@/components/admin/VendorBills";
import VendorManagement from "@/components/admin/VendorManagement";
import StudioExpenses from "@/components/admin/StudioExpenses";
import EmployeeStats from "@/components/admin/EmployeeStats";
import ChangePasswordDialog from "@/components/admin/ChangePasswordDialog";
import { supabase } from "@/integrations/supabase/client";

const Manager = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserAccess = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "manager") {
        navigate("/");
        return;
      }

      setIsLoading(false);
    };

    checkUserAccess();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
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
      
      <DashboardStats />
      
      <Tabs defaultValue="stats" className="space-y-4 mt-8">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="stats" className="mb-1">Employee Stats</TabsTrigger>
          <TabsTrigger value="bills" className="mb-1">Vendor Bills</TabsTrigger>
          <TabsTrigger value="vendors" className="mb-1">Vendors</TabsTrigger>
          <TabsTrigger value="income" className="mb-1">Company Income</TabsTrigger>
          <TabsTrigger value="studio" className="mb-1">Studio Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <EmployeeStats />
        </TabsContent>

        <TabsContent value="bills">
          <VendorBills />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorManagement />
        </TabsContent>

        <TabsContent value="income">
          <CompanyIncome />
        </TabsContent>

        <TabsContent value="studio">
          <StudioExpenses />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Manager;
