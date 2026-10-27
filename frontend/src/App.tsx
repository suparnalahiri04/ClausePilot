import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/ToastContext';
import { AppShell } from './components/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage, SignupPage } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { ContractsPage } from './pages/ContractsPage';
import { ContractWorkspacePage } from './pages/ContractWorkspacePage';
import { RisksPage } from './pages/RisksPage';
import { ObligationsPage } from './pages/ObligationsPage';
import { ComparePage } from './pages/ComparePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing & Authentication Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Application Workspace Routes with Sticky Top Horizontal Navigation Header */}
          <Route
            path="/dashboard"
            element={
              <AppShell>
                <DashboardPage />
              </AppShell>
            }
          />
          <Route
            path="/analyze"
            element={
              <AppShell>
                <AnalyzePage />
              </AppShell>
            }
          />
          <Route
            path="/contracts"
            element={
              <AppShell>
                <ContractsPage />
              </AppShell>
            }
          />
          <Route
            path="/contracts/:id"
            element={
              <AppShell>
                <ContractWorkspacePage />
              </AppShell>
            }
          />
          <Route
            path="/risks"
            element={
              <AppShell>
                <RisksPage />
              </AppShell>
            }
          />
          <Route
            path="/obligations"
            element={
              <AppShell>
                <ObligationsPage />
              </AppShell>
            }
          />
          <Route
            path="/compare"
            element={
              <AppShell>
                <ComparePage />
              </AppShell>
            }
          />
          <Route
            path="/reports"
            element={
              <AppShell>
                <ReportsPage />
              </AppShell>
            }
          />
          <Route
            path="/settings"
            element={
              <AppShell>
                <SettingsPage />
              </AppShell>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
