import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { getMonthDateRange } from "@/utils/dateUtils";
import { TrendingUp } from "lucide-react";

interface MonthlyData {
  month: string;
  displayMonth: string;
  totalIncome: number;
  totalExpenses: number;
  personalExpenses: number;
  vendorBills: number;
  totalSalary: number;
  netProfit: number;
  netProfitAfterPersonal: number;
}

const ProfitLossTrends = () => {
  const [trendsData, setTrendsData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    totalIncome: true,
    totalExpenses: true,
    personalExpenses: true,
    vendorBills: true,
    totalSalary: true,
    netProfit: true,
    netProfitAfterPersonal: true
  });

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    const fetchTrendsData = async () => {
      setIsLoading(true);
      const data: MonthlyData[] = [];
      
      // Get past 12 months plus current month (13 total)
      const monthsArray: string[] = [];
      const currentDate = new Date();
      
      for (let i = 12; i >= 0; i--) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthYear = targetDate.toISOString().slice(0, 7);
        monthsArray.push(monthYear);
      }
      
      console.log("Generated months:", monthsArray);
      
      // Process each unique month
      for (const monthYear of monthsArray) {
        console.log(`Processing month: ${monthYear}`);
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
            displayMonth: formatMonth(monthYear),
            totalIncome,
            totalExpenses,
            personalExpenses: totalPersonalExpenses,
            vendorBills: totalVendorBills,
            totalSalary: totalSalaries,
            netProfit,
            netProfitAfterPersonal
          });
        } catch (error) {
          console.error(`Error fetching data for ${monthYear}:`, error);
          // Add empty data for this month to maintain chart continuity
          data.push({
            month: monthYear,
            displayMonth: formatMonth(monthYear),
            totalIncome: 0,
            totalExpenses: 0,
            personalExpenses: 0,
            vendorBills: 0,
            totalSalary: 0,
            netProfit: 0,
            netProfitAfterPersonal: 0
          });
        }
      }
      
      console.log("Trends data loaded:", data);
      setTrendsData(data);
      setIsLoading(false);
    };

    fetchTrendsData();
  }, []);

  const toggleLineVisibility = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({
      ...prev,
      [lineKey]: !prev[lineKey]
    }));
  };

  const lineConfigs = [
    { key: 'totalIncome' as const, name: 'Total Income', color: '#22c55e' },
    { key: 'totalExpenses' as const, name: 'Total Expenses', color: '#ef4444' },
    { key: 'personalExpenses' as const, name: 'Personal Expenses', color: '#f97316' },
    { key: 'vendorBills' as const, name: 'Vendor Bills', color: '#ec4899' },
    { key: 'totalSalary' as const, name: 'Total Salary', color: '#06b6d4' },
    { key: 'netProfit' as const, name: 'Net Profit/Loss', color: '#3b82f6' },
    { key: 'netProfitAfterPersonal' as const, name: 'Net Profit/Loss After Personal', color: '#8b5cf6' }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0]?.payload?.displayMonth}</p>
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
          13-Month Financial Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {trendsData.length === 0 ? (
          <div className="flex justify-center py-8 text-muted-foreground">
            No financial data available for the past 13 months
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-3">
                Showing data for {trendsData.length} months
              </div>
              
              {/* Line visibility controls */}
              <div className="flex flex-wrap gap-2 mb-4">
                {lineConfigs.map(({ key, name, color }) => (
                  <label 
                    key={key}
                    className="flex items-center gap-2 cursor-pointer bg-muted/30 hover:bg-muted/50 px-3 py-1 rounded-full transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={visibleLines[key]}
                      onChange={() => toggleLineVisibility(key)}
                      className="w-4 h-4"
                    />
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium">{name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayMonth"
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {visibleLines.totalIncome && (
                    <Line 
                      type="monotone" 
                      dataKey="totalIncome" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Total Income"
                      dot={{ r: 4 }}
                    />
                  )}
                  {visibleLines.totalExpenses && (
                    <Line 
                      type="monotone" 
                      dataKey="totalExpenses" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Total Expenses"
                      dot={{ r: 4 }}
                    />
                  )}
                  {visibleLines.personalExpenses && (
                    <Line 
                      type="monotone" 
                      dataKey="personalExpenses" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="Personal Expenses"
                      dot={{ r: 4 }}
                    />
                  )}
                  {visibleLines.vendorBills && (
                    <Line 
                      type="monotone" 
                      dataKey="vendorBills" 
                      stroke="#ec4899" 
                      strokeWidth={2}
                      name="Vendor Bills"
                      dot={{ r: 4 }}
                    />
                  )}
                  {visibleLines.totalSalary && (
                    <Line 
                      type="monotone" 
                      dataKey="totalSalary" 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      name="Total Salary"
                      dot={{ r: 4 }}
                    />
                  )}
                  {visibleLines.netProfit && (
                    <Line 
                      type="monotone" 
                      dataKey="netProfit" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Net Profit/Loss"
                      dot={{ r: 4 }}
                    />
                  )}
                  {visibleLines.netProfitAfterPersonal && (
                    <Line 
                      type="monotone" 
                      dataKey="netProfitAfterPersonal" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Net Profit/Loss After Personal"
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfitLossTrends;