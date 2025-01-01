import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ExpenseEntry } from "@/types";
import ExpenseCreateRow from "./ExpenseCreateRow";
import ExpenseRow from "./ExpenseRow";
import { format } from "date-fns";
import { toast } from "sonner";

const ExpenseHistory = () => {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();
      
      return profile;
    },
  });

  const { data: expenses, refetch } = useQuery({
    queryKey: ["expenses", selectedMonth],
    queryFn: async () => {
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: false });

      if (error) {
        toast.error("Failed to fetch expenses");
        throw error;
      }

      return data as ExpenseEntry[];
    },
  });

  const handleExpenseCreated = () => {
    refetch();
  };

  const handleExpenseDeleted = () => {
    refetch();
  };

  const handleExpenseUpdated = () => {
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {profile?.full_name || profile?.email || "Employee"}'s Expense History
        </h2>
        <div>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      <div className="space-y-4">
        <ExpenseCreateRow onExpenseCreated={handleExpenseCreated} />
        
        <div className="space-y-2">
          {expenses?.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onExpenseDeleted={handleExpenseDeleted}
              onExpenseUpdated={handleExpenseUpdated}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpenseHistory;