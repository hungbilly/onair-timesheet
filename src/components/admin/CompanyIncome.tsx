
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus, Trash } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type CompanyIncomeRecord = {
  id: string;
  client: string;
  amount: number;
  date: string;
  created_at: string;
};

const CompanyIncome = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch company income records
  const { data: incomeRecords, isLoading } = useQuery({
    queryKey: ["companyIncome"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_income")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        toast.error("Failed to load income records");
        throw error;
      }

      return data as CompanyIncomeRecord[];
    },
  });

  // Add new income record
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!client.trim() || !amount.trim() || !selectedDate) {
        toast.error("Please fill in all fields");
        return;
      }

      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const { data, error } = await supabase.from("company_income").insert({
        client: client.trim(),
        amount: numericAmount,
        date: format(selectedDate, "yyyy-MM-dd"),
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) {
        toast.error("Failed to add income record");
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyIncome"] });
      setClient("");
      setAmount("");
      setSelectedDate(new Date());
      setIsCreating(false);
      toast.success("Income record added successfully");
    },
    onError: () => {
      toast.error("Failed to add income record");
    },
  });

  // Delete income record
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_income").delete().eq("id", id);

      if (error) {
        toast.error("Failed to delete income record");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyIncome"] });
      toast.success("Income record deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete income record");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const totalIncome = incomeRecords
    ? incomeRecords.reduce((sum, record) => sum + Number(record.amount), 0)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Company Income</h2>
        <Button
          variant="outline"
          onClick={() => setIsCreating(!isCreating)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {isCreating ? "Cancel" : "Add Income"}
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Income</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="client" className="text-sm font-medium">
                    Client
                  </label>
                  <Input
                    id="client"
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Client name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount
                  </label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Income Record"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Income Records</CardTitle>
          <div className="text-lg font-semibold">
            Total: ${totalIncome.toFixed(2)}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading income records...</div>
          ) : incomeRecords && incomeRecords.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{record.client}</TableCell>
                      <TableCell className="text-right">
                        ${Number(record.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(record.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No income records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyIncome;
