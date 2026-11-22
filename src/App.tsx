/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { BoardViewModal } from './components/BoardViewModal';
import { ChecksAssumptionsView } from './components/ChecksAssumptionsView';
import { ExposureWhatIfView } from './components/ExposureWhatIfView';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { PlantDetailView } from './components/PlantDetailView';
import { NIMBUS_PLANTS } from './data/nimbusPlants';
import { fetchLiveOpenMeteoPhysical } from './services/openMeteo';
import {
  LiveOpenMeteoCheck,
  NavTab,
  SimulatedStateMode,
  TimeWindow,
  ViewRole,
} from './types/climate';
import {
  buildExposureCsv,
  computePhysicalViews,
} from './utils/physicalMetrics';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('2040');
  const [role, setRole] = useState<ViewRole>('sustainability');
  const [stateMode, setStateMode] = useState<SimulatedStateMode>('normal');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('P01');
  const [boardViewOpen, setBoardViewOpen] = useState<boolean>(false);
  const [liveCache, setLiveCache] = useState<Record<string, LiveOpenMeteoCheck>>({});

  const views = useMemo(
    () => computePhysicalViews(NIMBUS_PLANTS, timeWindow),
    [timeWindow]
  );

  const handleInspectPlant = (plantId: string) => {
    setSelectedPlantId(plantId);
    setActiveTab('plants');
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    globalThis.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFetchLive = async (plantId: string) => {
    const plant = NIMBUS_PLANTS.find((p) => p.plantId === plantId);
    if (!plant) return;

    setLiveCache((prev) => ({
      ...prev,
      [plantId]: { ...prev[plantId], status: 'loading' },
    }));

    const result = await fetchLiveOpenMeteoPhysical(plant);
    setLiveCache((prev) => ({
      ...prev,
      [plantId]: result,
    }));
  };

  const handleDownloadCsv = () => {
    const csv = buildExposureCsv(views, timeWindow);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nimbus_physical_exposure_${timeWindow}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#202124]">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenBoardView={() => setBoardViewOpen(true)}
      />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        {activeTab === 'overview' && (
          <OverviewView
            views={views}
            window={timeWindow}
            onChangeWindow={setTimeWindow}
            role={role}
            onChangeRole={setRole}
            stateMode={stateMode}
            onResetStateMode={() => setStateMode('normal')}
            selectedPlantId={selectedPlantId}
            onSelectPlant={setSelectedPlantId}
            onInspectPlant={handleInspectPlant}
            onOpenChecks={() => handleSelectTab('checks')}
            onOpenExposure={() => handleSelectTab('exposure')}
          />
        )}

        {activeTab === 'exposure' && (
          <ExposureWhatIfView
            views={views}
            window={timeWindow}
            onInspectPlant={handleInspectPlant}
          />
        )}

        {activeTab === 'plants' && (
          <PlantDetailView
            views={views}
            selectedPlantId={selectedPlantId}
            onSelectPlant={setSelectedPlantId}
            window={timeWindow}
            onChangeWindow={setTimeWindow}
            liveCache={liveCache}
            onFetchLive={handleFetchLive}
          />
        )}

        {activeTab === 'checks' && (
          <ChecksAssumptionsView
            stateMode={stateMode}
            onChangeStateMode={setStateMode}
            onInspectPlant={handleInspectPlant}
            onDownloadCsv={handleDownloadCsv}
          />
        )}
      </main>

      <footer className="no-print border-t border-[#DADCE0] bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#5F6368]">
          <span>
            Nimbus Climate · Physical Risk v1 · FY 2025–26 Plant Register, Open-Meteo CMIP6 & WRI Aqueduct 4.0
          </span>
          <span>
            Exposure only (not ₹ loss) · Approximate locations · Illustrative items explicitly labelled.
          </span>
        </div>
      </footer>

      <BoardViewModal
        isOpen={boardViewOpen}
        onClose={() => setBoardViewOpen(false)}
        views={views}
        window={timeWindow}
        onDownloadCsv={handleDownloadCsv}
      />
    </div>
  );
}
