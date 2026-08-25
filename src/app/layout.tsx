import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactQueryProvider } from '@/components/providers/react-query-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
import { ProjectsProvider } from '@/components/providers/projects-provider';
import { AuthStateProvider } from '@/components/providers/auth-state-provider';
import { GlobalFetchInterceptor } from '@/components/providers/global-fetch-interceptor';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Turing Biosciences',
  description: 'Secure file upload and management platform',
  icons: {
    icon: '/turing-icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <GlobalFetchInterceptor />
        <ToastProvider>
          <AuthProvider>
            <AuthStateProvider>
              <ProjectsProvider>
                <ReactQueryProvider>{children}</ReactQueryProvider>
              </ProjectsProvider>
            </AuthStateProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
