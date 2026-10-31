import type { ReactNode } from "react";
import { useDirection } from "@/shared/hooks/useDirection";

export function RootLayout({ children }: { children: ReactNode }) {
  useDirection();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
