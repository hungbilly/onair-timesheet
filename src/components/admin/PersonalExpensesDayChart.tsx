import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PersonalExpense = {
  id: string;
  merchant: string;
  amount: number;
  date: string;
};

interface PersonalExpensesDayChartProps {
  expenses: PersonalExpense[];
}

const PersonalExpensesDayChart = ({ expenses }: PersonalExpensesDayChartProps) => {
  // Group expenses by day of week and calculate averages
  const dayData = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = {
        total: 0,
        count: 0,
        dates: new Set()
      };
    }
    
    acc[dayOfWeek].total += expense.amount;
    acc[dayOfWeek].dates.add(expense.date);
    
    return acc;
  }, {} as Record<number, { total: number; count: number; dates: Set<string> }>);

  // Convert to display format with averages
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const displayData = dayNames.map((dayName, index) => {
    const dayInfo = dayData[index];
    const average = dayInfo ? dayInfo.total / dayInfo.dates.size : 0;
    
    return {
      day: dayName,
      average: average,
      shortDay: dayName.slice(0, 3)
    };
  });

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
          <p className="font-semibold">{data.day}</p>
          <p className="text-primary">Average: {formatCurrency(data.average)}</p>
        </div>
      );
    }
    return null;
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Average Spending</CardTitle>
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
        <CardTitle>Daily Average Spending</CardTitle>
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
                dataKey="shortDay"
              />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="average" fill="hsl(var(--chart-2))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalExpensesDayChart;