import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { GlobalAuthProvider } from "@/components/providers/global-auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Turing Biosciences",
  description: "Secure file upload and management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReactQueryProvider>
          <AuthProvider>
            <GlobalAuthProvider>{children}</GlobalAuthProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
