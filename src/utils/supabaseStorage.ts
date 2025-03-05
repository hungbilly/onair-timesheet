
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Creates the necessary storage buckets if they don't exist
 */
export const ensureStorageBuckets = async () => {
  try {
    console.log("Checking for storage buckets...");
    // Check if the company-income bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return;
    }
    
    console.log("Available buckets:", buckets);
    
    // Create the company-income bucket if it doesn't exist
    const companyIncomeBucket = buckets?.find(bucket => bucket.name === 'company-income');
    
    if (!companyIncomeBucket) {
      // Creating bucket requires admin privileges - we'll skip this if the user doesn't have them
      // The bucket should be created by an administrator in the Supabase dashboard
      console.log("The 'company-income' bucket doesn't exist. Please create it in the Supabase dashboard.");
      toast.warning("Storage bucket 'company-income' not found. Please create it in the Supabase dashboard.");
    } else {
      console.log("Found company-income bucket:", companyIncomeBucket);
    }
  } catch (error) {
    console.error("Unexpected error ensuring storage buckets:", error);
  }
};

// Helper function to check the current user's RLS permissions
export const checkDatabasePermissions = async () => {
  try {
    console.log("Checking user permissions...");
    
    // Try to read from the company_income table to check read permissions
    const { data: readData, error: readError } = await supabase
      .from("company_income")
      .select("id")
      .limit(1);
    
    if (readError) {
      console.error("Read permission error:", readError);
      toast.error(`Database read permission error: ${readError.message}`);
    } else {
      console.log("Read permission check passed:", readData);
    }
    
    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error("No authenticated user found");
      toast.error("You need to be logged in to perform database operations");
      return;
    }
    
    // Get user role from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      toast.error(`Could not verify user role: ${profileError.message}`);
      return;
    }
    
    console.log("User role:", profile?.role);
    
    if (profile?.role !== "admin") {
      console.error("User does not have admin role");
      toast.error("You need admin privileges to perform this operation");
      return;
    }
    
    // Test insert with minimal data to check write permissions
    const testData = {
      company_name: "TEST PERMISSION CHECK - DELETE ME",
      amount: 0.01,
      date: new Date().toISOString().split('T')[0],
      company_id: "00000000-0000-0000-0000-000000000000", // This will fail, but will show permission errors
      created_by: user.id,
      deposit: "full",
      job_status: "completed",
      source: "test",
      type: "test"
    };
    
    const { error: insertError } = await supabase
      .from("company_income")
      .insert(testData);
    
    if (insertError) {
      console.error("Insert permission test failed:", insertError);
      toast.error(`Database insert permission error: ${insertError.message}`);
      
      if (insertError.code === "42501") {
        console.error("Permission denied. RLS policy may be blocking inserts.");
        toast.error("You don't have permission to insert data. Please check RLS policies in the Supabase dashboard.");
      } else if (insertError.code === "23503") {
        console.log("Foreign key constraint failed as expected, but insert permission seems to exist");
      } else if (insertError.code === "23514") {
        console.error("Check constraint violation:", insertError.message);
        toast.error(`Data validation error: ${insertError.message}`);
      } else {
        console.error("Other insert error:", insertError);
      }
    } else {
      console.log("Insert permission test passed");
      toast.success("Database permissions verified successfully");
    }
  } catch (error) {
    console.error("Error checking permissions:", error);
    toast.error(`Unexpected error checking permissions: ${error}`);
  }
};
