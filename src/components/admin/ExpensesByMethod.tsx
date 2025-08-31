import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getMonthDateRange } from "@/utils/dateUtils";

interface ExpensesByMethodProps {
  refreshTrigger: number;
  selectedMonth: string;
  expenseType: "studio" | "personal";
}

interface ExpenseData {
  id: string;
  amount: number;
  merchant: string;
  method: string;
  date: string;
  details?: string;
}

const paymentMethods = [
  "Credit Card (Master)",
  "Credit Card (Visa)",
  "Payme",
  "Octopus", 
  "Bank Transfer (Riano)",
  "Bank Transfer (Personal)"
];

const ExpensesByMethod = ({ refreshTrigger, selectedMonth, expenseType }: ExpensesByMethodProps) => {
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getMonthDateRange(selectedMonth);
      const tableName = expenseType === "studio" ? "studio_expenses" : "personal_expenses";
      
      const { data, error } = await supabase
        .from(tableName)
        .select("id, amount, merchant, method, date, details")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger, selectedMonth, expenseType]);

  const getExpensesByMethod = (method: string) => {
    return expenses.filter(expense => expense.method === method);
  };

  const getTotalByMethod = (method: string) => {
    const methodExpenses = getExpensesByMethod(method);
    return methodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={paymentMethods[0]} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          {paymentMethods.map((method) => {
            const total = getTotalByMethod(method);
            const count = getExpensesByMethod(method).length;
            return (
              <TabsTrigger 
                key={method} 
                value={method}
                className="flex flex-col gap-1 h-auto py-2 px-2 text-xs"
              >
                <span className="truncate">{method.replace("Credit Card ", "CC ").replace("Bank Transfer ", "BT ")}</span>
                <Badge variant="secondary" className="text-xs">
                  {count > 0 ? formatCurrency(total) : "$0.00"}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {paymentMethods.map((method) => {
          const methodExpenses = getExpensesByMethod(method);
          const total = getTotalByMethod(method);

          return (
            <TabsContent key={method} value={method}>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">{method}</CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(total)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {methodExpenses.length} transaction{methodExpenses.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {methodExpenses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No expenses found for {method} in {selectedMonth}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {methodExpenses.map((expense) => (
                        <div 
                          key={expense.id} 
                          className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{expense.merchant}</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(expense.date)}
                              {expense.details && ` • ${expense.details}`}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {formatCurrency(expense.amount)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ExpensesByMethod;