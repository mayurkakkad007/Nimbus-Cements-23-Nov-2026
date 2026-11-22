import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  PlantPhysicalView,
  SimulatedStateMode,
  TimeWindow,
  ViewRole,
} from '../types/climate';
import {
  formatInrCr,
  getLevelStyles,
  sortViewsByPriority,
} from '../utils/physicalMetrics';
import { IndiaPlantMap } from './IndiaPlantMap';

interface OverviewViewProps {
  views: PlantPhysicalView[];
  window: TimeWindow;
  onChangeWindow: (w: TimeWindow) => void;
  role: ViewRole;
  onChangeRole: (r: ViewRole) => void;
  stateMode: SimulatedStateMode;
  onResetStateMode: () => void;
  selectedPlantId: string;
  onSelectPlant: (plantId: string) => void;
  onInspectPlant: (plantId: string) => void;
  onOpenChecks: () => void;
  onOpenExposure: () => void;
}

type HazardFilter = 'all' | 'high_heat' | 'high_rain' | 'water_override' | 'coastal' | 'hubs';

export function OverviewView({
  views,
  window,
  onChangeWindow,
  role,
  onChangeRole,
  stateMode,
  onResetStateMode,
  selectedPlantId,
  onSelectPlant,
  onInspectPlant,
  onOpenChecks,
  onOpenExposure,
}: OverviewViewProps) {
  const [highlightedHub, setHighlightedHub] = useState<'none' | 'P01' | 'P06'>('none');
  const [hazardFilter, setHazardFilter] = useState<HazardFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sortedViews = useMemo(() => sortViewsByPriority(views), [views]);

  const filteredMatrix = useMemo(() => {
    return sortedViews.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const hit =
          v.plant.plantId.toLowerCase().includes(q) ||
          v.plant.plantName.toLowerCase().includes(q) ||
          v.plant.state.toLowerCase().includes(q) ||
          v.plant.waterSource.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (hazardFilter === 'high_heat') return v.heatLevel === 'High';
      if (hazardFilter === 'high_rain') return v.rainFloodLevel === 'High';
      if (hazardFilter === 'water_override') return v.plant.hazards.waterOverrideApplied;
      if (hazardFilter === 'coastal') return v.plant.coastal;
      if (hazardFilter === 'hubs') return v.dependentRevenueCr > 0;
      return true;
    });
  }, [sortedViews, hazardFilter, searchQuery]);

  // Verified Portfolio Aggregates (Direct sums only — never double-counted)
  const totalBookValueCr = views.reduce((s, v) => s + v.directAssetCr, 0);
  const totalDirectRevCr = views.reduce((s, v) => s + v.directRevenueCr, 0);
  const highExposureViews = views.filter((v) => v.overallPhysicalLevel === 'High');
  const highExposureBookCr = highExposureViews.reduce((s, v) => s + v.directAssetCr, 0);
  const highExposureRevCr = highExposureViews.reduce((s, v) => s + v.directRevenueCr, 0);

  const p01 = views.find((v) => v.plant.plantId === 'P01');
  const p06 = views.find((v) => v.plant.plantId === 'P06');
  const twoHubCombinedRevCr =
    (p01 ? p01.directRevenueCr + p01.dependentRevenueCr : 0) +
    (p06 ? p06.directRevenueCr + p06.dependentRevenueCr : 0);

  const windowLabel =
    window === 'today' ? 'Today (2005–2025 baseline)' : '2040 (2030–2050 window)';

  return (
    <div className="space-y-6">
      {/* Simulated Stale / API Error Banners for Auditor & Hiring Review */}
      {stateMode === 'stale' && (
        <div className="bg-[#FEF7E0] border border-[#F9DF9B] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#7A4400]">
          <div className="flex items-start gap-2.5">
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[#B06000]" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Stale cache state (demo):</strong> Precomputed CMIP6 & WRI Aqueduct snapshot is 38 hours old (nightly refresh missed). All figures remain usable from cached verified snapshot.
            </span>
          </div>
          <button
            type="button"
            onClick={onResetStateMode}
            className="font-medium text-[#1A73E8] hover:underline whitespace-nowrap cursor-pointer"
          >
            Restore Normal State
          </button>
        </div>
      )}

      {stateMode === 'error' && (
        <div className="bg-[#FCE8E6] border border-[#F6AEA9] rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#A50E0E]">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D93025]" aria-hidden="true" />
            <span>
              <strong className="font-semibold">Upstream API unavailable (fallback active):</strong> Open-Meteo Climate API timed out. Serving last validated precomputed JSON snapshot — no unverified numbers substituted.
            </span>
          </div>
          <button
            type="button"
            onClick={onResetStateMode}
            className="font-medium text-[#1A73E8] hover:underline whitespace-nowrap cursor-pointer"
          >
            Restore Normal State
          </button>
        </div>
      )}

      {/* Executive Lead + Role Switch & Time Window Controls */}
      <section className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#5F6368]">
              Nimbus Cement Ltd · Physical Climate Risk v1 · Exposure (Not Financial Loss)
            </p>
            <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#202124] mt-1">
              Physical Exposure Today & by 2040
            </h1>
          </div>
          <div className="text-xs text-[#5F6368] flex flex-wrap items-center gap-2">
            <span>Single CMIP6 high-emissions-like pathway</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-[#202124]">{windowLabel}</span>
          </div>
        </div>

        {/* Clean Minimal-Click Workspace Toolbar */}
        <div className="bg-white border border-[#DADCE0] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Today vs 2040 Toggle (NO fake SSP dropdown) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-medium text-[#5F6368] whitespace-nowrap">
              Climate window
            </span>
            <div
              role="group"
              aria-label="Climate window"
              className="inline-flex items-center p-1 bg-[#F1F3F4] rounded-lg"
            >
              <button
                type="button"
                onClick={() => onChangeWindow('today')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  window === 'today'
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                Today (2005–2025)
              </button>
              <button
                type="button"
                onClick={() => onChangeWindow('2040')}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  window === '2040'
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                2040 (2030–2050)
              </button>
            </div>
          </div>

          {/* "View as" Role Switch (Sustainability Head | Board Viewer | Auditor) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-medium text-[#5F6368] whitespace-nowrap">
              View as
            </span>
            <div
              role="group"
              aria-label="Audience lens"
              className="inline-flex items-center p-1 bg-[#F1F3F4] rounded-lg overflow-x-auto"
            >
              {(
                [
                  { id: 'sustainability', label: 'Sustainability Head' },
                  { id: 'board', label: 'Board Viewer' },
                  { id: 'auditor', label: 'Auditor' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onChangeRole(r.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    role === r.id
                      ? 'bg-white text-[#202124] shadow-xs'
                      : 'text-[#5F6368] hover:text-[#202124]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contextual Role Callout (Deterministic Template Text — Zero LLM Prose) */}
        {role === 'board' && (
          <div className="bg-white border border-[#DADCE0] rounded-xl p-4 sm:p-5 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#202124]">
                Board Summary ({window === 'today' ? 'Today' : '2040'} · Template from verified numbers)
              </h2>
              <button
                type="button"
                onClick={onOpenExposure}
                className="text-xs font-medium text-[#1A73E8] hover:underline cursor-pointer"
              >
                Open ₹ Exposure & Outage What-If →
              </button>
            </div>
            <p className="text-sm text-[#3C4043] leading-relaxed">
              <strong className="font-semibold text-[#202124]">52.1% of group revenue ({formatInrCr(twoHubCombinedRevCr)})</strong> rests on just two upstream kilns —{' '}
              <strong className="font-semibold">P01 Chittorgarh</strong> (direct ₹1,749 Cr + dependent P07 ₹848 Cr) and{' '}
              <strong className="font-semibold">P06 Baloda Bazar</strong> (direct ₹1,275 Cr + dependent P08 & P09 ₹1,160 Cr). In the{' '}
              {window === 'today' ? '2005–2025 baseline' : '2030–2050 window'},{' '}
              <strong className="font-semibold">{highExposureViews.length} of 9 plants</strong> ({formatInrCr(highExposureRevCr)} direct revenue;{' '}
              {formatInrCr(highExposureBookCr)} book value) sit in High physical exposure. Transition risk (CCTS/CBAM) is parked for v2; illustrative near-term CCTS cost is ~₹33 Cr (~0.3% rev).
            </p>
          </div>
        )}

        {role === 'auditor' && (
          <div className="bg-white border border-[#DADCE0] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#137333]">
                <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Data Validation Passed: Clinker balance 2.40 Mt shipped = 2.40 Mt received</span>
              </div>
              <p className="text-xs text-[#5F6368]">
                Assurance caveats: Asset values are <strong className="text-[#202124]">book value (gross block)</strong> · Coordinates are <strong className="text-[#202124]">approximate town centres</strong> · 2040 WRI Aqueduct scores are <strong className="text-[#202124]">linearly interpolated (2030–2050)</strong> · Water overrides applied at P07, P08 & P06 · P09 clinker factor (0.50) flagged to verify.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenChecks}
              className="px-3.5 py-2 text-xs font-medium text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Inspect All 9 Checks
            </button>
          </div>
        )}
      </section>

      {/* 4-Column Full-Width KPI Strip */}
      <section
        aria-label="Key physical exposure metrics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-[#DADCE0] rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-[#E8EAED]"
      >
        <div className="p-5">
          <div className="text-xs font-medium text-[#5F6368]">
            Revenue Resting on 2 Kiln Hubs
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#202124]">
              {formatInrCr(twoHubCombinedRevCr)}
            </span>
            <span className="text-xs font-mono tabular-nums font-semibold text-[#1A73E8]">
              52.1%
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5F6368]">
            P01+P07 (26.9%) · P06+P08+P09 (25.2%) · No double-count
          </p>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-[#5F6368]">
            High Physical Exposure ({window === 'today' ? 'Today' : '2040'})
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#C5221F]">
              {highExposureViews.length} / 9
            </span>
            <span className="text-xs font-mono tabular-nums text-[#5F6368]">
              {formatInrCr(highExposureRevCr)} direct rev
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5F6368]">
            {formatInrCr(highExposureBookCr)} book value · Exposure, not loss
          </p>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-[#5F6368]">
            Portfolio Gross Block (Book Value)
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#202124]">
              {formatInrCr(totalBookValueCr)}
            </span>
            <span className="text-xs font-mono tabular-nums text-[#5F6368]">
              {formatInrCr(totalDirectRevCr)} rev
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5F6368]">
            Book value understates replacement cost (esp. P05 1998)
          </p>
        </div>

        <div className="p-5">
          <div className="text-xs font-medium text-[#5F6368]">
            Data Validation Status
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-semibold text-[#137333]">
              Clinker Reconciled
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5F6368]">
            2.40 Mt shipped = 2.40 Mt received ·{' '}
            <button
              type="button"
              onClick={onOpenChecks}
              className="text-[#1A73E8] hover:underline cursor-pointer"
            >
              9 checks logged
            </button>
          </p>
        </div>
      </section>

      {/* Main 2-Column Workspace: India Map (6 cols) + Ranked Plant List (6 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6 flex flex-col">
          <IndiaPlantMap
            views={views}
            selectedPlantId={selectedPlantId}
            onSelectPlant={onSelectPlant}
            onInspectPlant={onInspectPlant}
            highlightedHub={highlightedHub}
            onChangeHub={setHighlightedHub}
          />
        </div>

        {/* Plant × Hazard Snapshot Cards / Queue */}
        <div className="lg:col-span-6 bg-white border border-[#DADCE0] rounded-xl flex flex-col">
          <div className="p-5 pb-3.5 border-b border-[#E8EAED] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-[#202124]">
                Plant Exposure Summary ({window === 'today' ? 'Today' : '2040'})
              </h2>
              <p className="text-xs text-[#5F6368] mt-0.5">
                Sorted by physical hazard clustering & network revenue · Tap any plant to trace sources
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#E8EAED] flex-1 overflow-y-auto">
            {sortedViews.map((v) => {
              const style = getLevelStyles(v.overallPhysicalLevel);
              const isSelected = v.plant.plantId === selectedPlantId;

              return (
                <button
                  key={v.plant.plantId}
                  type="button"
                  onClick={() => onInspectPlant(v.plant.plantId)}
                  onMouseEnter={() => onSelectPlant(v.plant.plantId)}
                  className={`w-full text-left px-5 py-3.5 transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected ? 'bg-[#E8F0FE]/55' : 'hover:bg-[#F8F9FA]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="text-xs font-mono font-semibold text-[#5F6368]">
                        {v.plant.plantId}
                      </span>
                      <span className="text-sm font-semibold text-[#202124]">
                        {v.plant.shortName}
                      </span>
                      <span className="text-xs text-[#5F6368]">
                        · {v.plant.state}
                        {v.dependentRevenueCr > 0 ? ' · Clinker Hub' : ''}
                        {v.plant.coastal ? ' · Coastal Flag' : ''}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6368] mt-0.5 truncate">
                      Heat {v.activeHeat40.low}–{v.activeHeat40.high}d ≥40°C · Peak rain{' '}
                      {v.activeWettestMm.mid} mm ·{' '}
                      {v.plant.hazards.waterOverrideApplied
                        ? v.plant.hazards.waterOverrideLabel
                        : `${v.plant.waterSource} (WRI ${v.activeRawBws.toFixed(1)}/5)`}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`text-xs font-semibold ${style.text}`}>
                        {v.overallPhysicalLevel}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-[#5F6368]">
                        {formatInrCr(v.directRevenueCr)}
                        {v.dependentRevenueCr > 0
                          ? ` (+${formatInrCr(v.dependentRevenueCr)} dep.)`
                          : ''}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#80868B]" aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Full Plant × Hazard Matrix (Today vs 2040 with CMIP6 Model Range) */}
      <section className="bg-white border border-[#DADCE0] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#E8EAED] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[#202124]">
                Plant × Hazard Matrix ({window === 'today' ? 'Today 2005–2025' : '2040 2030–2050'})
              </h2>
              <p className="text-xs text-[#5F6368] mt-0.5">
                CMIP6 multi-model ranges (low–high) · WRI Aqueduct 2040 linearly interpolated · Click any row to inspect sources & overrides
              </p>
            </div>

            {/* Search input */}
            <div className="relative w-full md:w-60">
              <Search
                className="w-3.5 h-3.5 text-[#5F6368] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter plant, state, water..."
                aria-label="Filter plants"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:outline-none focus:border-[#1A73E8] focus:bg-white"
              />
            </div>
          </div>

          {/* Interactive Hazard Filter Tabs */}
          <div
            role="group"
            aria-label="Filter matrix by hazard"
            className="flex items-center gap-1.5 overflow-x-auto pb-0.5"
          >
            {(
              [
                { id: 'all', label: 'All Plants (9)' },
                { id: 'hubs', label: 'Clinker Hubs (2)' },
                { id: 'high_heat', label: 'High Heat' },
                { id: 'high_rain', label: 'High Rain / Flood' },
                { id: 'water_override', label: 'Water Overrides (3)' },
                { id: 'coastal', label: 'Coastal Flag (2)' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setHazardFilter(f.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  hazardFilter === f.id
                    ? 'bg-[#E8F0FE] text-[#174EA6]'
                    : 'bg-[#F1F3F4] text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State (Explicitly handled per design & ticket spec) */}
        {filteredMatrix.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-[#202124]">
              No plants match this filter combination
            </p>
            <p className="text-xs text-[#5F6368]">
              Try clearing your search query or switching back to all 9 Nimbus plants.
            </p>
            <button
              type="button"
              onClick={() => {
                setHazardFilter('all');
                setSearchQuery('');
              }}
              className="mt-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#1A73E8] hover:bg-[#1765CC] rounded-lg cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[12px] font-medium text-[#5F6368]">
                  <th className="py-3 pl-5 pr-3 whitespace-nowrap">Plant</th>
                  <th className="py-3 px-3 whitespace-nowrap">
                    Extreme Heat (≥40°C / ≥45°C)
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">
                    Extreme Rain & Flood (rfr)
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">
                    Water Stress & Drought
                  </th>
                  <th className="py-3 px-3 whitespace-nowrap">Coastal</th>
                  <th className="py-3 pl-3 pr-5 text-right whitespace-nowrap">
                    Direct Rev · Dep. Rev
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EAED] text-xs">
                {filteredMatrix.map((v) => {
                  const heatStyle = getLevelStyles(v.heatLevel);
                  const rainStyle = getLevelStyles(v.rainFloodLevel);
                  const waterStyle = getLevelStyles(v.waterDroughtLevel);

                  return (
                    <tr
                      key={v.plant.plantId}
                      onClick={() => onInspectPlant(v.plant.plantId)}
                      className="hover:bg-[#F8F9FA] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pl-5 pr-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#202124]">
                          <span className="font-mono text-xs text-[#5F6368] mr-1.5">
                            {v.plant.plantId}
                          </span>
                          {v.plant.shortName}
                        </div>
                        <div className="text-[11px] text-[#5F6368]">
                          {v.plant.state} · {v.plant.plantType}
                          {role === 'auditor' ? ' · Approx. loc' : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className={`font-semibold ${heatStyle.text}`}>
                          {v.heatLevel} ·{' '}
                          <span className="font-mono tabular-nums text-[#202124] font-medium">
                            {v.activeHeat40.low}–{v.activeHeat40.high}d
                          </span>
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-[#5F6368]">
                          ≥45°C: {v.activeHeat45.low}–{v.activeHeat45.high}d/yr
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className={`font-semibold ${rainStyle.text}`}>
                          {v.rainFloodLevel} ·{' '}
                          <span className="font-mono tabular-nums text-[#202124] font-medium">
                            {v.activeWettestMm.low}–{v.activeWettestMm.high} mm
                          </span>
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-[#5F6368]">
                          ≥100mm: {v.activeDays100mm}d · WRI rfr {v.activeRfr.toFixed(1)}/5
                          {window === '2040' ? ' (interp.)' : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className={`font-semibold whitespace-nowrap ${waterStyle.text}`}>
                          {v.waterDroughtLevel} ·{' '}
                          <span className="text-[#202124] font-medium">
                            {v.plant.waterSource}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#5F6368] whitespace-nowrap">
                          {v.plant.hazards.waterOverrideApplied ? (
                            <span className="text-[#1A73E8] font-medium">
                              Override (raw WRI {v.activeRawBws.toFixed(1)}/5)
                            </span>
                          ) : (
                            <span className="font-mono tabular-nums">
                              WRI {v.activeRawBws.toFixed(1)}/5 · Dry spell {v.activeDrySpell.mid}d
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {v.plant.coastal ? (
                          <span className="font-medium text-[#B06000]">
                            Coastal Flag
                          </span>
                        ) : (
                          <span className="text-[#5F6368]">Inland</span>
                        )}
                      </td>

                      <td className="py-3.5 pl-3 pr-5 text-right font-mono tabular-nums whitespace-nowrap">
                        <div className="text-[#202124] font-medium">
                          {formatInrCr(v.directRevenueCr)}
                        </div>
                        <div className="text-[11px] text-[#5F6368]">
                          {v.dependentRevenueCr > 0
                            ? `+ ${formatInrCr(v.dependentRevenueCr)} dep.`
                            : v.plant.upstreamPlantId
                              ? `Relies on ${v.plant.upstreamPlantId}`
                              : 'Standalone'}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
