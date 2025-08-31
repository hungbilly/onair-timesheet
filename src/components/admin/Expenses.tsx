import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import CreateExpenseDialog from "./CreateExpenseDialog";
import ExpensesByMethod from "./ExpensesByMethod";
import MonthSelector from "./MonthSelector";
import { supabase } from "@/integrations/supabase/client";
import { getMonthDateRange } from "@/utils/dateUtils";

// Dynamic imports to avoid potential circular dependencies
import { lazy, Suspense } from "react";
const StudioExpenses = lazy(() => import("./StudioExpenses"));
const PersonalExpenses = lazy(() => import("./PersonalExpenses"));

interface ExpensesProps {
  userRole: "admin" | "manager";
}

const Expenses = ({ userRole }: ExpensesProps) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [studioTotal, setStudioTotal] = useState(0);
  const [personalTotal, setPersonalTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchTotals = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);

      // Fetch studio expenses total
      const { data: studioData, error: studioError } = await supabase
        .from("studio_expenses")
        .select("amount")
        .gte("date", startDate)
        .lte("date", endDate);

      if (studioError) throw studioError;
      
      const studioSum = (studioData || []).reduce((sum, expense) => sum + expense.amount, 0);
      setStudioTotal(studioSum);

      // Fetch personal expenses total (only if admin)
      if (userRole === "admin") {
        const { data: personalData, error: personalError } = await supabase
          .from("personal_expenses")
          .select("amount")
          .gte("date", startDate)
          .lte("date", endDate);

        if (personalError) throw personalError;
        
        const personalSum = (personalData || []).reduce((sum, expense) => sum + expense.amount, 0);
        setPersonalTotal(personalSum);
      } else {
        setPersonalTotal(0);
      }
    } catch (error) {
      console.error("Error fetching expense totals:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotals();
  }, [selectedMonth, refreshTrigger, userRole]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleExpenseCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const totalExpenses = studioTotal + personalTotal;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expenses
          </h2>
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
        <CreateExpenseDialog onExpenseCreated={handleExpenseCreated} />
      </div>

      <Tabs defaultValue="studio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="studio">Studio Expenses</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="personal">Personal Expenses</TabsTrigger>
          )}
          <TabsTrigger value="studio-methods">Studio by Method</TabsTrigger>
          {userRole === "admin" && (
            <TabsTrigger value="personal-methods">Personal by Method</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="studio">
          <Suspense fallback={<div>Loading...</div>}>
            <StudioExpenses key={`studio-${refreshTrigger}`} refreshTrigger={refreshTrigger} />
          </Suspense>
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="personal">
            <Suspense fallback={<div>Loading...</div>}>
              <PersonalExpenses key={`personal-${refreshTrigger}`} refreshTrigger={refreshTrigger} />
            </Suspense>
          </TabsContent>
        )}

        <TabsContent value="studio-methods">
          <ExpensesByMethod 
            refreshTrigger={refreshTrigger} 
            selectedMonth={selectedMonth}
            expenseType="studio"
          />
        </TabsContent>

        {userRole === "admin" && (
          <TabsContent value="personal-methods">
            <ExpensesByMethod 
              refreshTrigger={refreshTrigger} 
              selectedMonth={selectedMonth}
              expenseType="personal"
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Expense Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Studio Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? "..." : formatCurrency(studioTotal)}
            </div>
          </CardContent>
        </Card>
        
        {userRole === "admin" && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Personal Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? "..." : formatCurrency(personalTotal)}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? "..." : formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Expenses;