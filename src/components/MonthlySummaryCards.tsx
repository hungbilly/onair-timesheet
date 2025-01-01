import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MonthlySummaryProps {
  totalHours: number;
  totalJobs: number;
  totalSalary: number;
}

export const MonthlySummaryCards = ({
  totalHours,
  totalJobs,
  totalSalary,
}: MonthlySummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalHours.toFixed(1)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalJobs}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Salary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalSalary.toFixed(2)}</div>
        </CardContent>
      </Card>
    </div>
  );
};