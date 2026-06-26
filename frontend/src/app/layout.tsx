import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { SocketProvider } from "@/context/SocketContext";
import { Toaster } from "@/components/ui/sonner";

// Use Inter for a clean, highly legible enterprise UI font
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Enterprise Chat",
  description: "Secure, real-time messaging platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is required by next-themes to prevent console errors
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} overflow-hidden`}>
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>{children}</SocketProvider>
          </AuthProvider>
        </ThemeProvider>

        {/* Global Toast notifications configured for dark mode */}
        <Toaster position="top-center" theme="dark" richColors />
      </body>
    </html>
  );
}
