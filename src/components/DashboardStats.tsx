import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

export function DashboardStats() {
  const [monthlyStats, setMonthlyStats] = useState({
    totalHours: 0,
    totalExpenses: 0,
    pendingApprovals: 0,
    expectedSalary: 0,
    vendorBillsTotal: 0,
  });
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const fetchStats = async () => {
      const startDate = `${currentMonth}-01`;
      const endDate = `${currentMonth}-31`;

      // Fetch vendor bills total
      const { data: vendorBills, error: vendorError } = await supabase
        .from("vendor_bills")
        .select("amount")
        .gte('due_date', startDate)
        .lte('due_date', endDate);

      if (!vendorError) {
        const vendorTotal = (vendorBills || []).reduce((sum, bill) => sum + bill.amount, 0);
        setMonthlyStats(prev => ({ ...prev, vendorBillsTotal: vendorTotal }));
      }

      // Fetch timesheet entries total
      const { data: timesheetData, error: timesheetError } = await supabase
        .from("timesheet_entries")
        .select("hours, total_salary")
        .gte("date", startDate)
        .lte("date", endDate);

      if (!timesheetError && timesheetData) {
        const totalHours = timesheetData.reduce((sum, entry) => sum + (entry.hours || 0), 0);
        const totalSalary = timesheetData.reduce((sum, entry) => sum + entry.total_salary, 0);
        setMonthlyStats(prev => ({
          ...prev,
          totalHours,
          expectedSalary: totalSalary,
        }));
      }

      // Fetch pending approvals count
      const { data: approvals, error: approvalsError } = await supabase
        .from("monthly_approvals")
        .select("id")
        .eq("month", currentMonth);

      if (!approvalsError) {
        setMonthlyStats(prev => ({
          ...prev,
          pendingApprovals: approvals ? approvals.length : 0,
        }));
      }
    };

    fetchStats();
  }, [currentMonth]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Hours This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthlyStats.totalHours.toFixed(1)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Vendor Bills Total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${monthlyStats.vendorBillsTotal.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            For {currentMonth}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{monthlyStats.pendingApprovals}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Expected Salary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${monthlyStats.expectedSalary.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Based on current hours
          </p>
        </CardContent>
      </Card>
    </div>
  );
}