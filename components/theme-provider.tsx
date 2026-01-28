"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const changeTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  }
  return (
    <SidebarMenuItem>
      <SidebarMenuButton className="cursor-pointer" onClick={changeTheme}>Theme</SidebarMenuButton>
      <SidebarMenuBadge className="capitalize px-2">{theme}</SidebarMenuBadge>
    </SidebarMenuItem>
  );
}
