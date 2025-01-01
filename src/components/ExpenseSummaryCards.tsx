import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseSummaryProps {
  totalExpenses: number;
  totalReceipts: number;
}

export const ExpenseSummaryCards = ({
  totalExpenses,
  totalReceipts,
}: ExpenseSummaryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalReceipts}</div>
        </CardContent>
      </Card>
    </div>
  );
};