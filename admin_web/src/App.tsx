import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import DataUpload from './pages/DataUpload'
import DataCatalog, { FieldMapping, MissingCheck, AsinOverview, TrafficTree } from './pages/DataCatalog'
import ActionPlan from './pages/ActionPlan'
import TodayTasks from './pages/TodayTasks'
import MonitorPlan from './pages/MonitorPlan'
import ExcelDownload from './pages/ExcelDownload'
import AdminAudit from './pages/AdminAudit'
import AdminDashboard from './pages/AdminDashboard'
import CategoryConfig from './pages/CategoryConfig'
import LLMSettings from './pages/LLMSettings'
import SystemLogs from './pages/SystemLogs'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthGuard><Layout /></AuthGuard>}>
          <Route path="/" element={<DataUpload />} />
          <Route path="/catalog" element={<DataCatalog />} />
          <Route path="/fields" element={<FieldMapping />} />
          <Route path="/missing" element={<MissingCheck />} />
          <Route path="/asin-overview" element={<AsinOverview />} />
          <Route path="/traffic-tree" element={<TrafficTree />} />
          <Route path="/action-plan" element={<ActionPlan />} />
          <Route path="/today-tasks" element={<TodayTasks />} />
          <Route path="/monitor" element={<MonitorPlan />} />
          <Route path="/download" element={<ExcelDownload />} />
          <Route path="/audit" element={<AdminAudit />} />
          <Route path="/bi" element={<AdminDashboard />} />
          <Route path="/category-config" element={<CategoryConfig />} />
          <Route path="/llm-settings" element={<LLMSettings />} />
          <Route path="/logs" element={<SystemLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
