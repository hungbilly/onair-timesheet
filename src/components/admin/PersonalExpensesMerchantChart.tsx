import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted-foreground))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];

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
            <PieChart>
              <Pie
                data={merchantData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ merchant, percent }) => 
                  `${merchant} (${(percent * 100).toFixed(1)}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {merchantData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalExpensesMerchantChart;