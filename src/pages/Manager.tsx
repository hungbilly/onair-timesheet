import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/components/DashboardStats";

const Manager = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Manager Dashboard</h1>
      
      <DashboardStats />
      
      <div className="mt-8 grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Staff Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                <div>
                  <h3 className="font-semibold">John Doe</h3>
                  <p className="text-sm text-muted-foreground">Software Engineer</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">160.5 hrs</p>
                  <p className="text-sm text-muted-foreground">$4,825</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-secondary rounded-lg">
                <div>
                  <h3 className="font-semibold">Jane Smith</h3>
                  <p className="text-sm text-muted-foreground">UI Designer</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">152.0 hrs</p>
                  <p className="text-sm text-muted-foreground">$4,560</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Manager;