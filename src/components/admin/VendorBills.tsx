
import { useState } from "react";
import { Card } from "@/components/ui/card";
import VendorBillsList from "./VendorBillsList";
import CreateVendorBillDialog from "./CreateVendorBillDialog";
import MonthSelector from "@/components/admin/MonthSelector";

const VendorBills = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleBillCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Vendor Bills</h2>
          <MonthSelector 
            selectedMonth={selectedMonth} 
            onChange={setSelectedMonth} 
            label="Select Month:"
          />
        </div>
        <CreateVendorBillDialog onBillCreated={handleBillCreated} />
      </div>

      <Card>
        <VendorBillsList refreshTrigger={refreshTrigger} selectedMonth={selectedMonth} />
      </Card>
    </div>
  );
};

export default VendorBills;
