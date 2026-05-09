import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import { CssBaseline } from "@mui/material";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Campus Hub | Live Feed",
  description: "Real-time student notifications and priority tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={inter.className} 
        style={{ 
          margin: 0, 
          backgroundColor: "#0a0a0a",
          minHeight: "100vh",
          color: "#e5e5e5"
        }}
      >
        <CssBaseline />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
