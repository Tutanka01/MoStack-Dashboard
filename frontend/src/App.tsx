import { useEffect, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { useApi } from './api/useApi';
import OverviewPage from './pages/OverviewPage';
import ComputePage from './pages/ComputePage';
import NetworkPage from './pages/NetworkPage';
import StoragePage from './pages/StoragePage';
import ImagesPage from './pages/ImagesPage';
import IdentityPage from './pages/IdentityPage';
import TopologyPage from './pages/TopologyPage';
import LearningPage from './pages/LearningPage';

type Health = {
  status: string;
  region: string;
  read_only: boolean;
};

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [writeMode, setWriteMode] = useState(false);
  const health = useApi<Health>('/health', refreshKey);
  const canWrite = health.data?.read_only === false;
  const operatorProps = {
    writeMode,
    canWrite,
    onMutated: () => setRefreshKey((value) => value + 1)
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => setRefreshKey((value) => value + 1), 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  return (
    <AppShell
      globalStatus={health.data?.status}
      region={health.data?.region}
      autoRefresh={autoRefresh}
      writeMode={writeMode}
      canWrite={canWrite}
      onAutoRefreshChange={setAutoRefresh}
      onWriteModeChange={setWriteMode}
      onRefresh={() => setRefreshKey((value) => value + 1)}
    >
      <Routes>
        <Route path="/" element={<OverviewPage refreshKey={refreshKey} />} />
        <Route path="/compute" element={<ComputePage refreshKey={refreshKey} {...operatorProps} />} />
        <Route path="/network" element={<NetworkPage refreshKey={refreshKey} {...operatorProps} />} />
        <Route path="/storage" element={<StoragePage refreshKey={refreshKey} {...operatorProps} />} />
        <Route path="/images" element={<ImagesPage refreshKey={refreshKey} {...operatorProps} />} />
        <Route path="/identity" element={<IdentityPage refreshKey={refreshKey} />} />
        <Route path="/topology" element={<TopologyPage refreshKey={refreshKey} />} />
        <Route path="/learning" element={<LearningPage refreshKey={refreshKey} />} />
      </Routes>
    </AppShell>
  );
}
