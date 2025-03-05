import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon, Plus, Trash, Filter, X, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyIncomeRecord } from "@/types";
import CompanyIncomeEditDialog from "./CompanyIncomeEditDialog";
import { DateRange, getCurrentMonthRange, formatDateForSupabase, formatDateForDisplay, groupByBrand } from "@/utils/dateRangeUtils";
import { generateIncomeRecordsCsv } from "@/utils/csvExport";
const BRAND_OPTIONS = ["Billy ONAIR", "ONAIR Studio", "Sonnet Moment"];
const PAYMENT_TYPE_OPTIONS = ["Deposit", "Balance", "Full Payment"];
const PAYMENT_METHOD_OPTIONS = ["Bank Transfer (Riano)", "Bank Transfer (Personal)", "Payme", "Cash"];
const JOB_TYPE_OPTIONS = ["Shooting", "Upgrade", "Products", "Petty Cash"];
const ALL_OPTION = "All";
const CompanyIncome = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [client, setClient] = useState("");
  const [amount, setAmount] = useState("");
  const [brand, setBrand] = useState(BRAND_OPTIONS[0]);
  const [paymentType, setPaymentType] = useState(PAYMENT_TYPE_OPTIONS[2]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD_OPTIONS[0]);
  const [completionDate, setCompletionDate] = useState<Date | undefined>(undefined);
  const [jobType, setJobType] = useState(JOB_TYPE_OPTIONS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>(getCurrentMonthRange());

  // Filter states
  const [filterBrand, setFilterBrand] = useState<string>(ALL_OPTION);
  const [filterJobType, setFilterJobType] = useState<string>(ALL_OPTION);
  const [filterPaymentType, setFilterPaymentType] = useState<string>(ALL_OPTION);
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>(ALL_OPTION);

  // Fetch company income records
  const {
    data: incomeRecords,
    isLoading
  } = useQuery({
    queryKey: ["companyIncome"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("company_income").select("*").order("date", {
        ascending: false
      });
      if (error) {
        toast.error("Failed to load income records");
        throw error;
      }
      return data as CompanyIncomeRecord[];
    }
  });

  // Add new income record
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!client.trim() || !amount.trim() || !selectedDate) {
        toast.error("Please fill in all required fields");
        return;
      }
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      const {
        data,
        error
      } = await supabase.from("company_income").insert({
        client: client.trim(),
        amount: numericAmount,
        date: format(selectedDate, "yyyy-MM-dd"),
        brand,
        payment_type: paymentType,
        payment_method: paymentMethod,
        completion_date: completionDate ? format(completionDate, "yyyy-MM-dd") : null,
        job_type: jobType.toLowerCase(),
        created_by: (await supabase.auth.getUser()).data.user?.id
      });
      if (error) {
        toast.error("Failed to add income record");
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyIncome"]
      });
      setClient("");
      setAmount("");
      setSelectedDate(new Date());
      setBrand(BRAND_OPTIONS[0]);
      setPaymentType(PAYMENT_TYPE_OPTIONS[2]);
      setPaymentMethod(PAYMENT_METHOD_OPTIONS[0]);
      setCompletionDate(undefined);
      setJobType(JOB_TYPE_OPTIONS[0]);
      setIsCreating(false);
      toast.success("Income record added successfully");
    },
    onError: () => {
      toast.error("Failed to add income record");
    }
  });

  // Delete income record
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from("company_income").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete income record");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["companyIncome"]
      });
      toast.success("Income record deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete income record");
    }
  });
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterBrand(ALL_OPTION);
    setFilterJobType(ALL_OPTION);
    setFilterPaymentType(ALL_OPTION);
    setFilterPaymentMethod(ALL_OPTION);
  };

  // Check if any filters are active
  const hasActiveFilters = filterBrand !== ALL_OPTION || filterJobType !== ALL_OPTION || filterPaymentType !== ALL_OPTION || filterPaymentMethod !== ALL_OPTION;

  // Filter records based on date range and other filters
  const filteredRecords = useMemo(() => {
    if (!incomeRecords) return [];
    return incomeRecords.filter(record => {
      const recordDate = new Date(record.date);

      // Date range filter
      const dateInRange = recordDate >= dateRange.startDate && recordDate <= dateRange.endDate;
      if (!dateInRange) return false;

      // Brand filter
      if (filterBrand !== ALL_OPTION && record.brand !== filterBrand) return false;

      // Job type filter
      if (filterJobType !== ALL_OPTION) {
        const recordJobType = record.job_type ? record.job_type.charAt(0).toUpperCase() + record.job_type.slice(1) : "";
        if (recordJobType !== filterJobType) return false;
      }

      // Payment type filter
      if (filterPaymentType !== ALL_OPTION && record.payment_type !== filterPaymentType) return false;

      // Payment method filter
      if (filterPaymentMethod !== ALL_OPTION && record.payment_method !== filterPaymentMethod) return false;
      return true;
    }).sort((a, b) => {
      // Sort by date in descending order (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [incomeRecords, dateRange, filterBrand, filterJobType, filterPaymentType, filterPaymentMethod]);

  // Calculate totals by brand
  const brandTotals = useMemo(() => {
    if (!filteredRecords.length) return {} as Record<string, number>;
    const totals: Record<string, number> = {};
    filteredRecords.forEach(record => {
      if (!totals[record.brand]) {
        totals[record.brand] = 0;
      }
      totals[record.brand] += Number(record.amount);
    });
    return totals;
  }, [filteredRecords]);
  const totalIncome = filteredRecords.reduce((sum, record) => sum + Number(record.amount), 0);
  const handleDateRangeChange = (type: 'start' | 'end', date?: Date) => {
    if (!date) return;
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: date
    }));
  };

  // Download CSV function
  const handleDownloadCsv = () => {
    if (!filteredRecords || filteredRecords.length === 0) {
      toast.error("No data to export");
      return;
    }
    const csv = generateIncomeRecordsCsv(filteredRecords, dateRange);
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);

    // Create filename with date range
    const startFormatted = format(dateRange.startDate, "yyyy-MM-dd");
    const endFormatted = format(dateRange.endDate, "yyyy-MM-dd");
    link.setAttribute("download", `company-income_${startFormatted}_to_${endFormatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file downloaded successfully");
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Company Income</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>
          <Button variant="outline" onClick={() => setIsCreating(!isCreating)} className="gap-2">
            <Plus className="h-4 w-4" />
            {isCreating ? "Cancel" : "Add Income"}
          </Button>
        </div>
      </div>

      {showFilters && <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Filters</span>
              {hasActiveFilters && <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                  <X className="h-4 w-4" />
                  Reset Filters
                </Button>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateForDisplay(dateRange.startDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateRange.startDate} onSelect={date => handleDateRangeChange('start', date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formatDateForDisplay(dateRange.endDate)}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={dateRange.endDate} onSelect={date => handleDateRangeChange('end', date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Select value={filterBrand} onValueChange={setFilterBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>{ALL_OPTION}</SelectItem>
                    {BRAND_OPTIONS.map(option => <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Type</label>
                <Select value={filterJobType} onValueChange={setFilterJobType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>{ALL_OPTION}</SelectItem>
                    {JOB_TYPE_OPTIONS.map(option => <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Type</label>
                <Select value={filterPaymentType} onValueChange={setFilterPaymentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>{ALL_OPTION}</SelectItem>
                    {PAYMENT_TYPE_OPTIONS.map(option => <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Method</label>
                <Select value={filterPaymentMethod} onValueChange={setFilterPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_OPTION}>{ALL_OPTION}</SelectItem>
                    {PAYMENT_METHOD_OPTIONS.map(option => <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>}

      {isCreating && <Card>
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
                  <Input id="client" value={client} onChange={e => setClient(e.target.value)} placeholder="Client name" required />
                </div>
                <div className="space-y-2">
                  <label htmlFor="amount" className="text-sm font-medium">
                    Amount
                  </label>
                  <Input id="amount" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" type="number" step="0.01" min="0.01" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label htmlFor="brand" className="text-sm font-medium">
                    Brand
                  </label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {BRAND_OPTIONS.map(option => <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="paymentType" className="text-sm font-medium">
                    Payment Type
                  </label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_TYPE_OPTIONS.map(option => <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="paymentMethod" className="text-sm font-medium">
                    Payment Method
                  </label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map(option => <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="jobType" className="text-sm font-medium">
                    Job Type
                  </label>
                  <Select value={jobType} onValueChange={setJobType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      {JOB_TYPE_OPTIONS.map(option => <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Completion Date (optional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !completionDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {completionDate ? format(completionDate, "PPP") : <span>Pick a date (optional)</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={completionDate} onSelect={setCompletionDate} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Income Record"}
              </Button>
            </form>
          </CardContent>
        </Card>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Income Summary ({formatDateForDisplay(dateRange.startDate)} - {formatDateForDisplay(dateRange.endDate)})
            {hasActiveFilters && <span className="ml-2 text-sm font-normal text-muted-foreground">
                (Filtered)
              </span>}
          </CardTitle>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleDownloadCsv} disabled={!filteredRecords || filteredRecords.length === 0}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <div className="text-lg font-semibold">
              Total: ${totalIncome.toFixed(2)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Totals by Brand</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(brandTotals).map(([brandName, total]) => <Card key={brandName}>
                  <CardContent className="pt-6 bg-cyan-950">
                    <div className="text-center space-y-2">
                      <div className="text-lg font-medium bg-red-300">{brandName}</div>
                      <div className="text-2xl font-bold bg-zinc-200">${total.toFixed(2)}</div>
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>

          {isLoading ? <div className="text-center py-4">Loading income records...</div> : filteredRecords.length > 0 ? <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Payment Type</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map(record => <TableRow key={record.id}>
                      <TableCell>
                        {format(new Date(record.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>{record.client}</TableCell>
                      <TableCell>{record.brand}</TableCell>
                      <TableCell>{record.job_type ? record.job_type.charAt(0).toUpperCase() + record.job_type.slice(1) : "-"}</TableCell>
                      <TableCell>{record.payment_type}</TableCell>
                      <TableCell>{record.payment_method}</TableCell>
                      <TableCell>
                        {record.completion_date ? format(new Date(record.completion_date), "MMM d, yyyy") : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        ${Number(record.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="flex items-center space-x-1">
                        <CompanyIncomeEditDialog record={record} />
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(record.id)} disabled={deleteMutation.isPending} className="h-8 w-8">
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div> : <div className="text-center py-4 text-muted-foreground">
              No income records found for the selected criteria
            </div>}
        </CardContent>
      </Card>
    </div>;
};
export default CompanyIncome;