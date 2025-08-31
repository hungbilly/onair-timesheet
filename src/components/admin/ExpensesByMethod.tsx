import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  details?: string | null;
  paid_by?: string;
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
        .select("*")
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
    return expenses.filter(expense => 
      expense.method && expense.method.toLowerCase() === method.toLowerCase()
    );
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
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{method}</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatCurrency(total)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {methodExpenses.length} transaction{methodExpenses.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>

                {methodExpenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expenses found for {method} in {selectedMonth}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Merchant</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Method</TableHead>
                        {expenseType === "personal" && <TableHead>Paid By</TableHead>}
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {methodExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>{expense.date}</TableCell>
                          <TableCell>{expense.merchant}</TableCell>
                          <TableCell>{expense.details || "-"}</TableCell>
                          <TableCell>{expense.method}</TableCell>
                          {expenseType === "personal" && (
                            <TableCell>{expense.paid_by || "-"}</TableCell>
                          )}
                          <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

export default ExpensesByMethod;