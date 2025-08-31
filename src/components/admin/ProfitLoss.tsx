
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MonthSelector from "./MonthSelector";
import ProfitLossTrends from "./ProfitLossTrends";
import { supabase } from "@/integrations/supabase/client";
import { getMonthDateRange } from "@/utils/dateUtils";
import { TrendingUp, ArrowDown, ArrowUp, DollarSign, Wallet } from "lucide-react";

interface MonthlyFinancials {
  companyIncome: number;
  employeeSalaries: number;
  employeeExpenses: number;
  studioExpenses: number;
  personalExpenses: number;
  vendorBills: number;
  netProfit: number;
  netProfitAfterPersonal: number;
}

const ProfitLoss = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [financials, setFinancials] = useState<MonthlyFinancials>({
    companyIncome: 0,
    employeeSalaries: 0,
    employeeExpenses: 0,
    studioExpenses: 0,
    personalExpenses: 0,
    vendorBills: 0,
    netProfit: 0,
    netProfitAfterPersonal: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { startDate, endDate } = getMonthDateRange(selectedMonth);
      
      try {
        // Fetch company income for the month
        const { data: incomeData, error: incomeError } = await supabase
          .from("company_income")
          .select("amount")
          .gte("date", startDate)
          .lte("date", endDate);
        
        if (incomeError) throw incomeError;
        
        // Fetch employee salaries for the month
        const { data: salaryData, error: salaryError } = await supabase
          .from("timesheet_entries")
          .select("total_salary")
          .gte("date", startDate)
          .lte("date", endDate);
        
        if (salaryError) throw salaryError;
        
        // Fetch employee expenses for the month
        const { data: expenseData, error: expenseError } = await supabase
          .from("expenses")
          .select("amount")
          .gte("date", startDate)
          .lte("date", endDate);
        
        if (expenseError) throw expenseError;
        
        // Fetch studio expenses for the month
        const { data: studioExpenseData, error: studioExpenseError } = await supabase
          .from("studio_expenses")
          .select("amount")
          .gte("date", startDate)
          .lte("date", endDate);
        
        if (studioExpenseError) throw studioExpenseError;
        
        // Fetch personal expenses for the month
        const { data: personalExpenseData, error: personalExpenseError } = await supabase
          .from("personal_expenses")
          .select("amount")
          .gte("date", startDate)
          .lte("date", endDate);
        
        if (personalExpenseError) throw personalExpenseError;
        
        // Fetch vendor bills for the month
        const { data: vendorBillsData, error: vendorBillsError } = await supabase
          .from("vendor_bills")
          .select("amount")
          .gte("due_date", startDate)
          .lte("due_date", endDate);
        
        if (vendorBillsError) throw vendorBillsError;
        
        // Calculate totals
        const totalIncome = incomeData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        const totalSalaries = salaryData?.reduce((sum, item) => sum + Number(item.total_salary), 0) || 0;
        const totalExpenses = expenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        const totalStudioExpenses = studioExpenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        const totalPersonalExpenses = personalExpenseData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        const totalVendorBills = vendorBillsData?.reduce((sum, item) => sum + Number(item.amount), 0) || 0;
        
        const netProfit = totalIncome - totalSalaries - totalExpenses - totalStudioExpenses - totalVendorBills;
        const netProfitAfterPersonal = netProfit - totalPersonalExpenses;
        
        setFinancials({
          companyIncome: totalIncome,
          employeeSalaries: totalSalaries,
          employeeExpenses: totalExpenses,
          studioExpenses: totalStudioExpenses,
          personalExpenses: totalPersonalExpenses,
          vendorBills: totalVendorBills,
          netProfit: netProfit,
          netProfitAfterPersonal: netProfitAfterPersonal
        });
      } catch (error) {
        console.error("Error fetching financial data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Profit/Loss Statement
          </h2>
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={setSelectedMonth}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="text-center">Loading financial data...</div>
        </div>
      ) : (
        <>
          {/* 12-Month Trends Chart */}
          <ProfitLossTrends />

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className={`${financials.netProfit >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Net Profit/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {financials.netProfit >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDown className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`text-2xl font-bold ${financials.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${Math.abs(financials.netProfit).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {financials.netProfit >= 0 ? 'Profit' : 'Loss'} for {selectedMonth}
                </p>
              </CardContent>
            </Card>

            <Card className={`${financials.netProfitAfterPersonal >= 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Net Profit/Loss After Personal Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {financials.netProfitAfterPersonal >= 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowDown className="h-5 w-5 text-red-500" />
                  )}
                  <span className={`text-2xl font-bold ${financials.netProfitAfterPersonal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${Math.abs(financials.netProfitAfterPersonal).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {financials.netProfitAfterPersonal >= 0 ? 'Profit' : 'Loss'} after personal expenses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Income</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">${financials.companyIncome.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-red-500" />
                  <span className="text-2xl font-bold">
                    ${(financials.employeeSalaries + financials.employeeExpenses + financials.studioExpenses + financials.personalExpenses + financials.vendorBills).toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed breakdown table */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Breakdown for {selectedMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Company Income</TableCell>
                    <TableCell className="text-right text-green-500">+${financials.companyIncome.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Employee Salaries</TableCell>
                    <TableCell className="text-right text-red-500">-${financials.employeeSalaries.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Employee Expenses</TableCell>
                    <TableCell className="text-right text-red-500">-${financials.employeeExpenses.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Studio Expenses</TableCell>
                    <TableCell className="text-right text-red-500">-${financials.studioExpenses.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Vendor Bills</TableCell>
                    <TableCell className="text-right text-red-500">-${financials.vendorBills.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold">
                    <TableCell>Net Profit/Loss</TableCell>
                    <TableCell className={`text-right ${financials.netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {financials.netProfit >= 0 ? '+' : '-'}${Math.abs(financials.netProfit).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="flex items-center gap-1">
                      <Wallet className="h-4 w-4" />
                      Personal Expenses
                    </TableCell>
                    <TableCell className="text-right text-red-500">-${financials.personalExpenses.toFixed(2)}</TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t">
                    <TableCell>Net Profit/Loss After Personal Expenses</TableCell>
                    <TableCell className={`text-right ${financials.netProfitAfterPersonal >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {financials.netProfitAfterPersonal >= 0 ? '+' : '-'}${Math.abs(financials.netProfitAfterPersonal).toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProfitLoss;
