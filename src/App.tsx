
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Manager from "./pages/Manager";
import Login from "./pages/Login";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "manager" | "staff";
  allowMultipleRoles?: ("admin" | "manager" | "staff")[];
}

const ProtectedRoute = ({ children, requiredRole, allowMultipleRoles }: ProtectedRouteProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        setUserRole(profile?.role || null);
      }
      setIsAuthenticated(!!session);
    };

    checkAuth();

    supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (!session) {
        setUserRole(null);
      }
    });
  }, []);

  if (isAuthenticated === null || (isAuthenticated && userRole === null)) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if user has one of multiple allowed roles
  if (allowMultipleRoles && allowMultipleRoles.length > 0) {
    if (userRole && allowMultipleRoles.includes(userRole as any)) {
      return <>{children}</>;
    }
    return <Navigate to={userRole === 'admin' ? '/admin' : '/'} />;
  }

  // Check specific required role
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to={userRole === 'admin' || userRole === 'manager' ? '/admin' : '/'} />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AuthRedirect />} />
          <Route
            path="/staff"
            element={
              <ProtectedRoute requiredRole="staff">
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager"
            element={
              <ProtectedRoute>
                <Manager />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowMultipleRoles={["admin", "manager"]}>
                <Admin />
              </ProtectedRoute>
            }
          />
          {/* Catch all route to handle 404s */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// This component will redirect users based on their authentication status
const AuthRedirect = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        
        setUserRole(profile?.role || null);
      }
      setIsAuthenticated(!!session);
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (userRole === 'admin' || userRole === 'manager') {
    return <Navigate to="/admin" />;
  }
  
  return <Navigate to="/staff" />;
};

export default App;
