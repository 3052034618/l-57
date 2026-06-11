import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RoleSelect from "@/pages/RoleSelect";
import Dashboard from "@/pages/Dashboard";
import ReportForm from "@/pages/ReportForm";
import AuditPage from "@/pages/AuditPage";
import SummaryPage from "@/pages/SummaryPage";
import Notifications from "@/pages/Notifications";
import Layout from "@/components/layout/Layout";
import ToastContainer from "@/components/common/ToastContainer";
import { useUserStore } from "@/store/useUserStore";

function ProtectedLayout() {
  const { currentUser } = useUserStore();
  if (currentUser === null) {
    return <Navigate to="/" replace />;
  }
  return <Layout />;
}

export default function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/report/:taskId" element={<ReportForm />} />
          <Route path="/audit/:taskId" element={<AuditPage />} />
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
