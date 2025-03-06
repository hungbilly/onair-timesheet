
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import UserManagement from "@/components/admin/UserManagement";
import EmployeeStats from "@/components/admin/EmployeeStats";
import VendorBills from "@/components/admin/VendorBills";
import VendorManagement from "@/components/admin/VendorManagement";
import CompanyIncome from "@/components/admin/CompanyIncome";
import StudioExpenses from "@/components/admin/StudioExpenses";
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
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
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
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="stats">Employee Stats</TabsTrigger>
          <TabsTrigger value="bills">Vendor Bills</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="income">Company Income</TabsTrigger>
          <TabsTrigger value="expenses">Studio Expenses</TabsTrigger>
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

        <TabsContent value="expenses">
          <StudioExpenses />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
