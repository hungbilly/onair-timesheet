
import { useToast as useToastHook, toast as toastHook } from "@/hooks/use-toast";

// Create the base toast function
const toast = toastHook;

// Add convenience methods for common toast types
const enhancedToast = Object.assign(toast, {
  error: (message: string) => toast({ 
    title: "Error", 
    description: message, 
    variant: "destructive" 
  }),
  success: (message: string) => toast({ 
    title: "Success", 
    description: message 
  }),
  warning: (message: string) => toast({ 
    title: "Warning", 
    description: message 
  }),
  info: (message: string) => toast({ 
    title: "Info", 
    description: message 
  })
});

// Re-export the hooks/toast with our enhanced version
export { useToastHook as useToast, enhancedToast as toast };
