import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="all">All Bills</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <VendorBillsList filter="all" refreshTrigger={refreshTrigger} />
          </TabsContent>
          <TabsContent value="pending">
            <VendorBillsList filter="pending" refreshTrigger={refreshTrigger} />
          </TabsContent>
          <TabsContent value="paid">
            <VendorBillsList filter="paid" refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default VendorBills;