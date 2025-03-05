import { useEffect, useState, ChangeEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, ArrowLeft, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyIncome } from "@/types";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import ChangePasswordDialog from "@/components/admin/ChangePasswordDialog";
import { ensureStorageBuckets, checkDatabasePermissions } from "@/utils/supabaseStorage";

// List of brand names
const BRAND_OPTIONS = ["Billy ONAIR", "ONAIR Studio", "Sonnet Moment"];
// List of job types
const JOB_TYPE_OPTIONS = ["shooting", "upgrade", "product"];
// List of deposit types to enforce consistent values
const DEPOSIT_OPTIONS = ["full", "partial", "balance"];
// List of payment methods
const PAYMENT_METHOD_OPTIONS = ["cash", "bank_transfer_riano", "bank_transfer_personal", "payme"];
// List of job statuses
const JOB_STATUS_OPTIONS = ["in_progress", "completed"];

const CompanyIncomePage = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [incomes, setIncomes] = useState<CompanyIncome[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUploading, setFileUploading] = useState(false);

  const form = useForm({
    defaultValues: {
      company_name: BRAND_OPTIONS[0],
      client: "",
      amount: 0,
      deposit: "full" as "full" | "partial" | "balance",
      payment_method: "cash" as "cash" | "bank_transfer_riano" | "bank_transfer_personal" | "payme",
      date: new Date().toISOString().split('T')[0],
      job_status: "completed" as "in_progress" | "completed",
      job_completion_date: "",
      job_type: "shooting" as "shooting" | "upgrade" | "product"
    },
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        toast.error("You don't have access to this page");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      ensureStorageBuckets(); // Ensure storage buckets exist
      checkDatabasePermissions(); // Check database permissions
      fetchCompanyIncomes();
    };

    checkAdminStatus();
  }, [navigate]);

  const fetchCompanyIncomes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("company_income")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        throw error;
      }

      setIncomes(data as CompanyIncome[]);
    } catch (error) {
      console.error("Error fetching company incomes:", error);
      toast.error("Failed to load company incomes");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadPaymentSlip = async (file: File) => {
    try {
      setFileUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `payment-slips/${fileName}`;

      // Check if bucket exists before uploading
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === 'company-income');
      
      if (!bucketExists) {
        throw new Error("The 'company-income' storage bucket doesn't exist. Please create it in the Supabase dashboard.");
      }

      const { error: uploadError, data } = await supabase.storage
        .from('company-income')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      return filePath;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    } finally {
      setFileUploading(false);
    }
  };

  const onSubmit = async (values: any) => {
    try {
      setLoading(true);
      console.log("Starting form submission with values:", values);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("You must be logged in");
        return;
      }
      
      console.log("Authenticated user ID:", user.id);

      let paymentSlipPath = null;
      if (selectedFile) {
        try {
          paymentSlipPath = await uploadPaymentSlip(selectedFile);
          console.log("Payment slip uploaded successfully:", paymentSlipPath);
        } catch (error: any) {
          toast.error(error.message || "Failed to upload payment slip");
          return;
        }
      }

      // Ensure deposit value is correctly formatted
      const depositValue = values.deposit;
      console.log("Original deposit value:", depositValue);
      
      if (!DEPOSIT_OPTIONS.includes(depositValue)) {
        toast.error(`Invalid deposit value. Must be one of: ${DEPOSIT_OPTIONS.join(', ')}`);
        return;
      }

      console.log("Submitting with deposit value:", depositValue);

      // Prepare the data for insertion
      const insertData = {
        company_name: values.company_name,
        client: values.client,
        amount: parseFloat(values.amount),
        deposit: depositValue,
        payment_method: values.payment_method,
        date: values.date,
        created_by: user.id,
        job_status: values.job_status,
        job_completion_date: values.job_status === "completed" ? values.job_completion_date || values.date : null,
        source: "direct",
        type: "service",
        job_type: values.job_type,
        payment_slip_path: paymentSlipPath
      };
      
      console.log("Attempting to insert data:", insertData);

      // Perform the insert with detailed error logging
      const { data, error } = await supabase
        .from("company_income")
        .insert(insertData)
        .select();

      if (error) {
        console.error("Database error details:", error);
        
        if (error.code === "42501") {
          toast.error("Permission denied. You don't have the necessary permissions to insert data.");
        } else if (error.code === "23514") {
          toast.error(`Constraint violation: ${error.message}. Please check your input values.`);
        } else {
          toast.error(`Failed to add company income: ${error.message}`);
        }
        return;
      }

      console.log("Insert successful, returned data:", data);
      toast.success("Company income added successfully");
      
      form.reset({
        company_name: BRAND_OPTIONS[0],
        client: "",
        amount: 0,
        deposit: "full",
        payment_method: "cash",
        date: new Date().toISOString().split('T')[0],
        job_status: "completed",
        job_completion_date: "",
        job_type: "shooting"
      });
      setSelectedFile(null);
      fetchCompanyIncomes();
    } catch (error: any) {
      console.error("Error adding company income:", error);
      toast.error(error.message || "Failed to add company income");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="outline" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Company Income</h1>
        </div>
        <div className="flex items-center gap-4">
          <ChangePasswordDialog />
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Add New Income</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select brand" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BRAND_OPTIONS.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter client name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="Enter amount" 
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="job_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JOB_TYPE_OPTIONS.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deposit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DEPOSIT_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>
                              {option === "full" ? "Full Payment" : 
                               option === "partial" ? "Deposit" : "Balance"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map(method => (
                            <SelectItem key={method} value={method}>
                              {method === "cash" ? "Cash" :
                               method === "bank_transfer_riano" ? "Bank Transfer (Riano)" :
                               method === "bank_transfer_personal" ? "Bank Transfer (Personal)" : "PayMe"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="job_status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {JOB_STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>
                              {status === "in_progress" ? "In Progress" : "Completed"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("job_status") === "completed" && (
                  <FormField
                    control={form.control}
                    name="job_completion_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completion Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-2">
                  <FormLabel>Payment Slip (Optional)</FormLabel>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="file" 
                      onChange={handleFileChange}
                      accept="image/*,.pdf"
                      className="flex-1"
                    />
                    {selectedFile && (
                      <div className="text-sm text-muted-foreground">
                        {selectedFile.name}
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" disabled={loading || fileUploading} className="w-full">
                  {loading ? "Adding..." : "Add Income"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Incomes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : incomes.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No income records found</div>
            ) : (
              <div className="space-y-4">
                {incomes.map((income) => (
                  <div key={income.id} className="border rounded-lg p-4">
                    <div className="flex justify-between">
                      <span className="font-medium">{income.company_name}</span>
                      <span className="text-green-600 font-medium">${income.amount.toFixed(2)}</span>
                    </div>
                    {income.client && (
                      <div className="text-sm mt-1">
                        <span className="text-muted-foreground">Client:</span> {income.client}
                      </div>
                    )}
                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                      <span>{new Date(income.date).toLocaleDateString()}</span>
                      <span className="capitalize">
                        {income.payment_method === "bank_transfer_riano" 
                          ? "Bank Transfer (Riano)" 
                          : income.payment_method === "bank_transfer_personal" 
                            ? "Bank Transfer (Personal)" 
                            : income.payment_method.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        income.deposit === "full" ? "bg-blue-100 text-blue-800" : 
                        income.deposit === "partial" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
                      }`}>
                        {income.deposit === "full" ? "Full Payment" : 
                        income.deposit === "partial" ? "Deposit" : "Balance"}
                      </span>

                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        income.job_status === "in_progress" ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"
                      }`}>
                        {income.job_status === "in_progress" ? "In Progress" : "Completed"}
                      </span>

                      {income.job_type && (
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800 capitalize">
                          {income.job_type}
                        </span>
                      )}

                      {income.payment_slip_path && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-5 text-xs flex items-center gap-1 px-2"
                          onClick={() => window.open(
                            `${supabase.storage.from('company-income').getPublicUrl(income.payment_slip_path as string).data.publicUrl}`,
                            '_blank'
                          )}
                        >
                          <Upload className="h-3 w-3" />
                          View Slip
                        </Button>
                      )}
                    </div>
                    
                    {income.job_completion_date && (
                      <div className="text-xs mt-1 text-muted-foreground">
                        Completed: {new Date(income.job_completion_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyIncomePage;
