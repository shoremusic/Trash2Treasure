import { Route, Switch } from "wouter";
import Discover from "@/pages/discover";
import Search from "@/pages/search";
import Profile from "@/pages/profile";
import Notifications from "@/pages/notifications";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/lib/authProvider";
import { MapProvider } from "@/lib/mapProvider";
import { Toaster } from "@/components/ui/toaster";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/">
        <ProtectedRoute>
          <Discover />
        </ProtectedRoute>
      </Route>
      <Route path="/search">
        <ProtectedRoute>
          <Search />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <Router />
        <Toaster />
      </MapProvider>
    </AuthProvider>
  );
}

export default App;
