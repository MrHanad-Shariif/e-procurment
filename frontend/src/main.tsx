import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/shared/lib/i18n";
import "@/index.css";
import App from "@/app/App";
import { ThemeProvider } from "next-themes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="eprocure-theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense
            fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}
          >
            <App />
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
