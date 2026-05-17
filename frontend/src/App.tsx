import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TopologyPage } from '@/pages/TopologyPage';
import { useAuthStore } from '@/store/authStore';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:   30_000,
      retry:       1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route guard
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return (
    <div className="min-h-screen bg-axilog-gray dark:bg-dark-base flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-axilog-primary" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { fetchMe, isAuthenticated } = useAuthStore();

  // Attempt to restore session from cookie on mount
  useEffect(() => {
    if (!isAuthenticated) { void fetchMe(); }
  }, [fetchMe, isAuthenticated]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes inside AppShell */}
          <Route element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/topologies"  element={<TopologyPage />} />
            <Route path="/topologies/:id" element={<TopologyPage />} />
            {/* Placeholder routes — implement in later phases */}
            <Route path="/map"         element={<PlaceholderPage title="Geographic Map" />} />
            <Route path="/alarms"      element={<PlaceholderPage title="Alarms" />} />
            <Route path="/discovery"   element={<PlaceholderPage title="Discovery" />} />
            <Route path="/5g"          element={<PlaceholderPage title="5G Private Networks" />} />
            <Route path="/zabbix"      element={<PlaceholderPage title="Zabbix Sources" />} />
            <Route path="/catalogue/*" element={<PlaceholderPage title="Service Catalogue" />} />
            <Route path="/tickets"     element={<PlaceholderPage title="Tickets" />} />
            <Route path="/clusters"    element={<PlaceholderPage title="Clusters" />} />
            <Route path="/settings"    element={<PlaceholderPage title="Settings" />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-dark-muted">
      <p className="text-xl font-semibold text-axilog-primary dark:text-axilog-primary-light mb-2">{title}</p>
      <p className="text-sm">This module is coming in a future phase.</p>
    </div>
  );
}
