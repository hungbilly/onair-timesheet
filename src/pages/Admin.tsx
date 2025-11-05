
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, DollarSign } from "lucide-react";
import { toast } from "sonner";
import UserManagement from "@/components/admin/UserManagement";
import EmployeeStats from "@/components/admin/EmployeeStats";
import EmployeeDetails from "@/components/admin/EmployeeDetails";
import VendorBills from "@/components/admin/VendorBills";
import VendorManagement from "@/components/admin/VendorManagement";
import CompanyIncome from "@/components/admin/CompanyIncome";
import Expenses from "@/components/admin/Expenses";
import ProfitLoss from "@/components/admin/ProfitLoss";
import ChangePasswordDialog from "@/components/admin/ChangePasswordDialog";
import { supabase } from "@/integrations/supabase/client";

const Admin = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<"admin" | "manager" | "staff" | null>(null);
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

      if (!profile || (profile.role !== "admin" && profile.role !== "manager")) {
        navigate("/");
        return;
      }

      setUserRole(profile.role);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">
          {userRole === "admin" ? "Admin" : "Manager"} Dashboard
        </h1>
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
      
      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="flex flex-wrap gap-1 h-auto">
          {userRole === "admin" && (
            <TabsTrigger value="users" className="mb-1">User Management</TabsTrigger>
          )}
          <TabsTrigger value="stats" className="mb-1">Employee Stats</TabsTrigger>
          <TabsTrigger value="employee-details" className="mb-1">Employee Details</TabsTrigger>
          <TabsTrigger value="bills" className="mb-1">Vendor Bills</TabsTrigger>
          <TabsTrigger value="vendors" className="mb-1">Vendors</TabsTrigger>
          <TabsTrigger value="income" className="mb-1">Company Income</TabsTrigger>
          <TabsTrigger value="expenses" className="mb-1">Expenses</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="profitloss" className="mb-1">Profit/Loss</TabsTrigger>
          )}
        </TabsList>

        {userRole === "admin" && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}

        <TabsContent value="stats">
          <EmployeeStats />
        </TabsContent>

        <TabsContent value="employee-details">
          <EmployeeDetails />
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

        <TabsContent value="expenses">
          <Expenses userRole={userRole as "admin" | "manager"} />
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="profitloss">
            <ProfitLoss />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Admin;
