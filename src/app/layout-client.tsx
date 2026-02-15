"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { FilterProvider } from "@/contexts/FilterContext";
import { CoinProvider } from "@/contexts/CoinContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { initSecurityHeaders } from "@/utils/security";

// Initialize security headers on client load
initSecurityHeaders();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <FilterProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner
                position="top-center"
                toastOptions={{
                  classNames: {
                    toast: "glass-card border-border",
                    title: "text-foreground",
                    description: "text-muted-foreground",
                  },
                }}
              />
              <CoinProvider>{children}</CoinProvider>
            </TooltipProvider>
          </FilterProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
