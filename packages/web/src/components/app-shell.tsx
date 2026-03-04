"use client";

import { usePathname } from "next/navigation";
import { BottomTabBar } from "@/components/bottom-tab-bar";

interface AppShellProps {
  isAdmin: boolean;
  children: React.ReactNode;
}

export function AppShell({ isAdmin, children }: AppShellProps) {
  const pathname = usePathname();
  const isChatView = pathname.startsWith("/chat/");
  const showTabBar = !isChatView;

  return (
    <div className={showTabBar ? "pb-14 md:pb-0" : undefined}>
      {children}
      {showTabBar && <BottomTabBar currentPath={pathname} isAdmin={isAdmin} />}
    </div>
  );
}
