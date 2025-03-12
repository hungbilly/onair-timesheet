
import { useEffect } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "admin" || profile?.role === "manager") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    };

    checkAuthAndRedirect();

    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkAuthAndRedirect();
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Please sign in to continue
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg shadow-lg border">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'rgb(147 51 234)',
                    brandAccent: 'rgb(126 34 206)'
                  }
                }
              }
            }}
            providers={[]}
            view="sign_in"
            showLinks={false}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
