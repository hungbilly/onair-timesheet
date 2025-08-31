import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { getMonthDateRange } from "@/utils/dateUtils";
import { TrendingUp } from "lucide-react";

interface MonthlyData {
  month: string;
  totalIncome: number;
  totalExpenses: number;
  personalExpenses: number;
  netProfit: number;
  netProfitAfterPersonal: number;
}

const ProfitLossTrends = () => {
  const [trendsData, setTrendsData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendsData = async () => {
      setIsLoading(true);
      const data: MonthlyData[] = [];
      
      // Get past 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = date.toISOString().slice(0, 7);
        const { startDate, endDate } = getMonthDateRange(monthYear);
        
        try {
          // Fetch all financial data for this month
          const [
            incomeResult,
            salaryResult,
            expenseResult,
            studioExpenseResult,
            personalExpenseResult,
            vendorBillsResult
          ] = await Promise.all([
            supabase
              .from("company_income")
              .select("amount")
              .gte("date", startDate)
              .lte("date", endDate),
            
            supabase
              .from("timesheet_entries")
              .select("total_salary")
              .gte("date", startDate)
              .lte("date", endDate),
            
            supabase
              .from("expenses")
              .select("amount")
              .gte("date", startDate)
              .lte("date", endDate),
            
            supabase
              .from("studio_expenses")
              .select("amount")
              .gte("date", startDate)
              .lte("date", endDate),
            
            supabase
              .from("personal_expenses")
              .select("amount")
              .gte("date", startDate)
              .lte("date", endDate),
            
            supabase
              .from("vendor_bills")
              .select("amount")
              .gte("due_date", startDate)
              .lte("due_date", endDate)
          ]);

          // Calculate totals for this month
          const totalIncome = incomeResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          const totalSalaries = salaryResult.data?.reduce((sum, item) => sum + Number(item.total_salary), 0) || 0;
          const totalEmployeeExpenses = expenseResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          const totalStudioExpenses = studioExpenseResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          const totalPersonalExpenses = personalExpenseResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          const totalVendorBills = vendorBillsResult.data?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
          
          const totalExpenses = totalSalaries + totalEmployeeExpenses + totalStudioExpenses + totalVendorBills;
          const netProfit = totalIncome - totalExpenses;
          const netProfitAfterPersonal = netProfit - totalPersonalExpenses;

          data.push({
            month: monthYear,
            totalIncome,
            totalExpenses,
            personalExpenses: totalPersonalExpenses,
            netProfit,
            netProfitAfterPersonal
          });
        } catch (error) {
          console.error(`Error fetching data for ${monthYear}:`, error);
          // Add empty data for this month to maintain chart continuity
          data.push({
            month: monthYear,
            totalIncome: 0,
            totalExpenses: 0,
            personalExpenses: 0,
            netProfit: 0,
            netProfitAfterPersonal: 0
          });
        }
      }
      
      setTrendsData(data);
      setIsLoading(false);
    };

    fetchTrendsData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{formatMonth(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            12-Month Financial Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            Loading trends data...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          12-Month Financial Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonth}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="totalIncome" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                name="Total Income"
              />
              <Line 
                type="monotone" 
                dataKey="totalExpenses" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                name="Total Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="personalExpenses" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                name="Personal Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="netProfit" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                name="Net Profit/Loss"
              />
              <Line 
                type="monotone" 
                dataKey="netProfitAfterPersonal" 
                stroke="hsl(var(--chart-5))" 
                strokeWidth={2}
                name="Net Profit/Loss After Personal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitLossTrends;