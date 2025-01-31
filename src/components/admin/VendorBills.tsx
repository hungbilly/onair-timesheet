import { useState } from "react";
import { Card } from "@/components/ui/card";
import VendorBillsList from "./VendorBillsList";
import CreateVendorBillDialog from "./CreateVendorBillDialog";

const VendorBills = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const handleBillCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Vendor Bills</h2>
          <div className="flex items-center gap-2">
            <label htmlFor="month" className="font-medium">
              Select Month:
            </label>
            <input
              type="month"
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
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