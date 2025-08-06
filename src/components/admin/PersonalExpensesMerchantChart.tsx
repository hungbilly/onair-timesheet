import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PersonalExpense = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
};

interface PersonalExpensesMerchantChartProps {
  expenses: PersonalExpense[];
}



const PersonalExpensesMerchantChart = ({ expenses }: PersonalExpensesMerchantChartProps) => {
  // Aggregate expenses by merchant
  const merchantData = expenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.merchant === expense.merchant);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({
        merchant: expense.merchant,
        amount: expense.amount,
      });
    }
    return acc;
  }, [] as { merchant: string; amount: number }[]);

  // Sort by amount descending
  merchantData.sort((a, b) => b.amount - a.amount);

  // Take top 10 and group the rest as "Others"
  const displayData = merchantData.length > 10 
    ? [
        ...merchantData.slice(0, 10),
        {
          merchant: "Others",
          amount: merchantData.slice(10).reduce((sum, item) => sum + item.amount, 0)
        }
      ]
    : merchantData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.merchant}</p>
          <p className="text-primary">{formatCurrency(data.amount)}</p>
        </div>
      );
    }
    return null;
  };

  if (merchantData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Merchant Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No expense data available for chart
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merchant Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="merchant" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalExpensesMerchantChart;