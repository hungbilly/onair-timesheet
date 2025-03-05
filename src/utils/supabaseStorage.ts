
import { supabase } from "@/integrations/supabase/client";

/**
 * Creates the necessary storage buckets if they don't exist
 */
export const ensureStorageBuckets = async () => {
  try {
    // Check if the company-income bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return;
    }
    
    // Create the company-income bucket if it doesn't exist
    const companyIncomeBucket = buckets?.find(bucket => bucket.name === 'company-income');
    
    if (!companyIncomeBucket) {
      // Creating bucket requires admin privileges - we'll skip this if the user doesn't have them
      // The bucket should be created by an administrator in the Supabase dashboard
      console.log("The 'company-income' bucket doesn't exist. Please create it in the Supabase dashboard.");
    }
  } catch (error) {
    console.error("Unexpected error ensuring storage buckets:", error);
  }
};
