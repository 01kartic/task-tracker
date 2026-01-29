import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Task Tracker - Daily Habit & Task Management",
  description:
    "Track your daily tasks, rate your performance, and analyze your progress. A beautiful desktop task tracker built with Electron and Next.js.",
  keywords: [
    "task tracker",
    "habit tracker",
    "daily tasks",
    "productivity",
    "task management",
  ],
  authors: [{ name: "Task Tracker" }],
  icons: {
    icon: "/icons/icon.png",
    apple: "/icons/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
