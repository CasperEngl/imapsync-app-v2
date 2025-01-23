import { ThemeProvider } from "~/renderer/components/theme-provider.js";
import { Toaster } from "~/renderer/components/ui/sonner.js";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster />
    </ThemeProvider>
  );
}
