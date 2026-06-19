'use client';

import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CopilotProvider } from '@/components/providers/CopilotProvider';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 focus:outline-none" tabIndex={-1}>
          <ProtectedRoute>
            <CopilotProvider>
              {children}
            </CopilotProvider>
          </ProtectedRoute>
        </main>
      </div>
    </div>
  );
}
