
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CompanyIncome } from "@/types";
import { Eye, FileEdit, Trash2, Download } from "lucide-react";
import ViewCompanyIncomeDialog from "./ViewCompanyIncomeDialog";
import EditCompanyIncomeDialog from "./EditCompanyIncomeDialog";

interface CompanyIncomeListProps {
  filter: string;
}

const CompanyIncomeList = ({ filter }: CompanyIncomeListProps) => {
  const [selectedIncome, setSelectedIncome] = useState<CompanyIncome | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchCompanyIncome = async () => {
    let query = supabase
      .from("company_income")
      .select("*")
      .order("date", { ascending: false });

    if (filter !== "all") {
      query = query.eq("company_name", filter);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }
    return data as CompanyIncome[];
  };

  const { data: incomeData, isLoading, error, refetch } = useQuery({
    queryKey: ["companyIncome", filter],
    queryFn: fetchCompanyIncome,
  });

  useEffect(() => {
    if (error) {
      toast.error("Failed to load company income data");
      console.error("Error fetching company income:", error);
    }
  }, [error]);

  const handleView = (income: CompanyIncome) => {
    setSelectedIncome(income);
    setViewDialogOpen(true);
  };

  const handleEdit = (income: CompanyIncome) => {
    setSelectedIncome(income);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this income record?");
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("company_income")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      toast.success("Income record deleted successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to delete income record");
      console.error("Error deleting company income:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const downloadPaymentSlip = async (incomeRecord: CompanyIncome) => {
    if (!incomeRecord.payment_slip_path) {
      toast.error("No payment slip available");
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from("company-income")
        .download(incomeRecord.payment_slip_path);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment-slip-${incomeRecord.id}.${incomeRecord.payment_slip_path.split(".").pop()}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download payment slip");
      console.error("Error downloading payment slip:", error);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">Loading...</div>
        ) : incomeData && incomeData.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Job Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeData.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
                  <TableCell>{income.company_name}</TableCell>
                  <TableCell>{income.client || "N/A"}</TableCell>
                  <TableCell>{formatCurrency(income.amount)}</TableCell>
                  <TableCell className="capitalize">{income.deposit}</TableCell>
                  <TableCell className="capitalize">{income.job_status.replace("_", " ")}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleView(income)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(income)}
                        title="Edit"
                      >
                        <FileEdit className="h-4 w-4" />
                      </Button>
                      {income.payment_slip_path && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => downloadPaymentSlip(income)}
                          title="Download payment slip"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(income.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">No income records found</div>
        )}
      </CardContent>

      {selectedIncome && (
        <>
          <ViewCompanyIncomeDialog
            open={viewDialogOpen}
            setOpen={setViewDialogOpen}
            income={selectedIncome}
          />
          <EditCompanyIncomeDialog
            open={editDialogOpen}
            setOpen={setEditDialogOpen}
            income={selectedIncome}
            onSuccess={() => refetch()}
          />
        </>
      )}
    </Card>
  );
};

export default CompanyIncomeList;
