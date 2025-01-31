import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "~/renderer/auth-provider.js";
import { ThemeProvider } from "~/renderer/components/theme-provider.js";
import { Toaster } from "~/renderer/components/ui/sonner.js";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
