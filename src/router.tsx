import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { useAuthStore } from '@/stores/auth'
import { AppLayout } from '@/components/layout/app-layout'

// Lazy load pages
import { lazy, Suspense, type ReactNode } from 'react'

const LoginPage = lazy(() => import('@/pages/login'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const DevicesPage = lazy(() => import('@/pages/devices'))
const UsersPage = lazy(() => import('@/pages/users'))
const GroupsPage = lazy(() => import('@/pages/groups'))
const ConnectionLogsPage = lazy(() => import('@/pages/logs/connection'))
const FileLogsPage = lazy(() => import('@/pages/logs/file'))
const AddressBooksPage = lazy(() => import('@/pages/address-books'))
const StrategiesPage = lazy(() => import('@/pages/strategies'))
const CustomClientsPage = lazy(() => import('@/pages/custom-clients'))
const OAuthPage = lazy(() => import('@/pages/settings/oauth'))
const TokensPage = lazy(() => import('@/pages/settings/tokens'))
const LoginLogsPage = lazy(() => import('@/pages/settings/login-logs'))
const ShareRecordsPage = lazy(() => import('@/pages/settings/share-records'))
const CommandsPage = lazy(() => import('@/pages/settings/commands'))

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function SuspenseWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <SuspenseWrapper>
              <LoginPage />
            </SuspenseWrapper>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuspenseWrapper><DashboardPage /></SuspenseWrapper>} />
          <Route path="devices" element={<SuspenseWrapper><DevicesPage /></SuspenseWrapper>} />
          <Route path="users" element={<SuspenseWrapper><UsersPage /></SuspenseWrapper>} />
          <Route path="groups" element={<SuspenseWrapper><GroupsPage /></SuspenseWrapper>} />
          <Route path="logs/connection" element={<SuspenseWrapper><ConnectionLogsPage /></SuspenseWrapper>} />
          <Route path="logs/file" element={<SuspenseWrapper><FileLogsPage /></SuspenseWrapper>} />
          <Route path="address-books" element={<SuspenseWrapper><AddressBooksPage /></SuspenseWrapper>} />
          <Route path="strategies" element={<SuspenseWrapper><StrategiesPage /></SuspenseWrapper>} />
          <Route path="custom-clients" element={<SuspenseWrapper><CustomClientsPage /></SuspenseWrapper>} />
          <Route path="settings/oauth" element={<SuspenseWrapper><OAuthPage /></SuspenseWrapper>} />
          <Route path="settings/tokens" element={<SuspenseWrapper><TokensPage /></SuspenseWrapper>} />
          <Route path="settings/login-logs" element={<SuspenseWrapper><LoginLogsPage /></SuspenseWrapper>} />
          <Route path="settings/share-records" element={<SuspenseWrapper><ShareRecordsPage /></SuspenseWrapper>} />
          <Route path="settings/commands" element={<SuspenseWrapper><CommandsPage /></SuspenseWrapper>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
