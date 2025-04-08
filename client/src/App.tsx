import { Route, Switch } from "wouter";
import Discover from "@/pages/discover";
import Search from "@/pages/search";
import Profile from "@/pages/profile";
import Notifications from "@/pages/notifications";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/lib/authProvider";
import { useEffect, useState } from "react";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  // Add a timeout to avoid infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    // If still loading after 3 seconds, force proceed to Auth page
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  // While checking auth status, return a loading screen, but only for a limited time
  if (isLoading && !loadingTimeout) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated or loading timed out, show auth page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Auth} />
        <Route path="/login" component={Auth} />
        <Route path="/register" component={Auth} />
        <Route component={Auth} />
      </Switch>
    );
  }

  // Authenticated user routes
  return (
    <Switch>
      <Route path="/" component={Discover} />
      <Route path="/search" component={Search} />
      <Route path="/profile" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return <Router />;
}

export default App;
