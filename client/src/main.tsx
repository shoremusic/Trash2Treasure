import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/authProvider";
import { MapProvider } from "./lib/mapProvider";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <MapProvider>
        <App />
        <Toaster />
      </MapProvider>
    </AuthProvider>
  </QueryClientProvider>
);
