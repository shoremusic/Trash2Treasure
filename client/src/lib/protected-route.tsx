import { ReactNode, useEffect, useState } from "react";
import { useAuth } from "@/lib/authProvider";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    // If still loading after 2 seconds, force redirect to auth page
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  // If loading timed out or user is definitely not authenticated, redirect to auth
  if (loadingTimeout || (!isLoading && !user)) {
    return <Redirect to="/auth" />;
  }
  
  // If we're still loading and haven't timed out yet, show the loading spinner
  if (isLoading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // If we have a user, show the protected content
  return <>{children}</>;
};