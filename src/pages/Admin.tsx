
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, DollarSign } from "lucide-react";
import { toast } from "sonner";
import UserManagement from "@/components/admin/UserManagement";
import EmployeeStats from "@/components/admin/EmployeeStats";
import VendorBills from "@/components/admin/VendorBills";
import VendorManagement from "@/components/admin/VendorManagement";
import CompanyIncome from "@/components/admin/CompanyIncome";
import StudioExpenses from "@/components/admin/StudioExpenses";
import PersonalExpenses from "@/components/admin/PersonalExpenses";
import ProfitLoss from "@/components/admin/ProfitLoss";
import ChangePasswordDialog from "@/components/admin/ChangePasswordDialog";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminStatus = async () => {
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

      if (!profile || profile.role !== "admin") {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    };

    checkAdminStatus();
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

  if (!isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="users" className="mb-1">User Management</TabsTrigger>
          <TabsTrigger value="stats" className="mb-1">Employee Stats</TabsTrigger>
          <TabsTrigger value="bills" className="mb-1">Vendor Bills</TabsTrigger>
          <TabsTrigger value="vendors" className="mb-1">Vendors</TabsTrigger>
          <TabsTrigger value="income" className="mb-1">Company Income</TabsTrigger>
          <TabsTrigger value="studio" className="mb-1">Studio Expenses</TabsTrigger>
          <TabsTrigger value="personal" className="mb-1">Personal Expenses</TabsTrigger>
          <TabsTrigger value="profitloss" className="mb-1">Profit/Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

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

        <TabsContent value="personal">
          <PersonalExpenses />
        </TabsContent>

        <TabsContent value="profitloss">
          <ProfitLoss />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
