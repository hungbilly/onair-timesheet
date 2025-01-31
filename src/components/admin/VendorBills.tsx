import { useState } from "react";
import { Card } from "@/components/ui/card";
import VendorBillsList from "./VendorBillsList";
import CreateVendorBillDialog from "./CreateVendorBillDialog";

const VendorBills = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleBillCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vendor Bills</h2>
        <CreateVendorBillDialog onBillCreated={handleBillCreated} />
      </div>

      <Card>
        <VendorBillsList refreshTrigger={refreshTrigger} />
      </Card>
    </div>
  );
};

export default VendorBills;