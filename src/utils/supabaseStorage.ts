
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
      const { error: createError } = await supabase.storage.createBucket('company-income', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.error("Error creating company-income bucket:", createError);
      } else {
        console.log("Created company-income bucket successfully");
        
        // Set the bucket policy to allow authenticated users to upload
        const { error: policyError } = await supabase.storage.from('company-income')
          .createSignedUploadUrl('dummy-test-file');
          
        if (policyError) {
          console.error("Error setting bucket policy:", policyError);
        }
      }
    }
  } catch (error) {
    console.error("Unexpected error ensuring storage buckets:", error);
  }
};
