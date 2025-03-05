
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
    
    // Try to read from the company_income table to check read permissions
    const { data: readData, error: readError } = await supabase
      .from("company_income")
      .select("id")
      .limit(1);
    
    if (readError) {
      console.error("Read permission error:", readError);
      toast.error(`Database read permission error: ${readError.message}`);
      return;
    }
    
    console.log("Read permission check passed:", readData);
    
    // Test insert with minimal data to check write permissions
    // Making sure to use a valid value for deposit: "full", "partial", or "balance"
    const testData = {
      company_name: "TEST PERMISSION CHECK - DELETE ME",
      amount: 0.01,
      date: new Date().toISOString().split('T')[0],
      created_by: user.id,
      deposit: "full", // Using a valid value that should pass the check constraint
      job_status: "completed",
      source: "test",
      type: "test",
      job_type: "shooting"
    };
    
    const { error: insertError } = await supabase
      .from("company_income")
      .insert(testData);
    
    if (insertError) {
      console.error("Insert permission test failed:", insertError);
      
      if (insertError.code === "42501") {
        console.error("Permission denied. RLS policy may be blocking inserts.");
        toast.error("You don't have permission to insert data. Please check RLS policies in the Supabase dashboard.");
      } else if (insertError.code === "23503") {
        // Foreign key constraint error is no longer applicable since company_id is removed
        console.error("Other constraint error:", insertError);
        toast.error(`Database constraint error: ${insertError.message}`);
      } else if (insertError.code === "23514") {
        console.error("Check constraint violation:", insertError.message);
        toast.error(`Data validation error: ${insertError.message}`);
      } else {
        console.error("Other insert error:", insertError);
        toast.error(`Insert error: ${insertError.message}`);
      }
    } else {
      console.log("Insert permission test passed");
      toast.success("Database permissions verified successfully");
      
      // Clean up the test data
      try {
        await supabase
          .from("company_income")
          .delete()
          .eq("company_name", "TEST PERMISSION CHECK - DELETE ME")
          .eq("created_by", user.id);
      } catch (cleanupError) {
        console.error("Failed to clean up test data:", cleanupError);
      }
    }
  } catch (error) {
    console.error("Error checking permissions:", error);
    toast.error(`Unexpected error checking permissions: ${error}`);
  }
};
