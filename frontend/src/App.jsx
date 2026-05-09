import { Navigate, Route, Routes } from "react-router-dom";

import Shell from "./components/Shell.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AlertsPage from "./pages/AlertsPage.jsx";
import AssetsPage from "./pages/AssetsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DutyPage from "./pages/DutyPage.jsx";
import FaultsPage from "./pages/FaultsPage.jsx";
import InspectionsPage from "./pages/InspectionsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import LogsPage from "./pages/LogsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="h-screen w-full bg-slate-50 flex items-center justify-center text-slate-600">正在恢复登录状态...</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="assets" element={<AssetsPage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="faults" element={<FaultsPage />} />
        <Route path="duty" element={<DutyPage />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
