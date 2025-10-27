import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ProjectsProvider } from "@/components/providers/projects-provider";
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
        <AuthProvider>
          <GlobalAuthProvider>
            <ProjectsProvider>
              <ReactQueryProvider>{children}</ReactQueryProvider>
            </ProjectsProvider>
          </GlobalAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
