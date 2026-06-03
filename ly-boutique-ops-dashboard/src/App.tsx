import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './routes/Dashboard';
import { DailyScan } from './routes/DailyScan';
import { WeeklyDiagnosis } from './routes/WeeklyDiagnosis';
import { MonthlyGrading } from './routes/MonthlyGrading';
import { AsinDetail } from './routes/AsinDetail';
import { AdAttributionAudit } from './routes/AdAttributionAudit';
import { TaskCenter } from './routes/TaskCenter';
import { AgentHub } from './routes/AgentHub';
import { DataUpload } from './routes/DataUpload';
import { ModelConfig } from './routes/ModelConfig';
import { PermissionManagement } from './routes/PermissionManagement';
import { Settings } from './routes/Settings';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/daily" element={<DailyScan />} />
          <Route path="/weekly" element={<WeeklyDiagnosis />} />
          <Route path="/monthly" element={<MonthlyGrading />} />
          <Route path="/asin" element={<AsinDetail />} />
          <Route path="/attribution" element={<AdAttributionAudit />} />
          <Route path="/tasks" element={<TaskCenter />} />
          <Route path="/agents" element={<AgentHub />} />
          <Route path="/upload" element={<DataUpload />} />
          <Route path="/models" element={<ModelConfig />} />
          <Route path="/permissions" element={<PermissionManagement />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
