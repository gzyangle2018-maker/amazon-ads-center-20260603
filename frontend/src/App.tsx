import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import Upload from './pages/Upload'
import LLMConfig from './pages/LLMConfig'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/llm-config" element={<LLMConfig />} />
      </Route>
    </Routes>
  )
}
