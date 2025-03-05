
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import CompanyIncomeList from "@/components/admin/CompanyIncomeList";
import AddCompanyIncomeDialog from "@/components/admin/AddCompanyIncomeDialog";

const CompanyIncome = () => {
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
        <h1 className="text-3xl font-bold">Company Income</h1>
        <div className="flex items-center gap-4">
          <Link to="/admin">
            <Button variant="outline">Back to Admin Dashboard</Button>
          </Link>
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
      
      <div className="flex justify-end mb-4">
        <AddCompanyIncomeDialog />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Income</TabsTrigger>
          <TabsTrigger value="billy">Billy ONAIR</TabsTrigger>
          <TabsTrigger value="onair">ONAIR Studio</TabsTrigger>
          <TabsTrigger value="sonnet">Sonnet Moment</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <CompanyIncomeList filter="all" />
        </TabsContent>
        <TabsContent value="billy">
          <CompanyIncomeList filter="Billy ONAIR" />
        </TabsContent>
        <TabsContent value="onair">
          <CompanyIncomeList filter="ONAIR Studio" />
        </TabsContent>
        <TabsContent value="sonnet">
          <CompanyIncomeList filter="Sonnet Moment" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyIncome;
