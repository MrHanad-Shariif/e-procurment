import { createContext, useContext, type Dispatch, type SetStateAction } from "react";

interface SidebarState {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: Dispatch<SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
}
