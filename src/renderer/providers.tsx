import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "~/renderer/components/theme-provider.js";
import { Toaster } from "~/renderer/components/ui/sonner.js";

export const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
