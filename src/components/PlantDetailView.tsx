import {
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import {
  LiveOpenMeteoCheck,
  PlantPhysicalView,
  TimeWindow,
} from '../types/climate';
import { formatInrCr, getLevelStyles } from '../utils/physicalMetrics';

interface PlantDetailViewProps {
  views: PlantPhysicalView[];
  selectedPlantId: string;
  onSelectPlant: (plantId: string) => void;
  window: TimeWindow;
  onChangeWindow: (w: TimeWindow) => void;
  liveCache: Record<string, LiveOpenMeteoCheck>;
  onFetchLive: (plantId: string) => void;
}

export function PlantDetailView({
  views,
  selectedPlantId,
  onSelectPlant,
  window,
  onChangeWindow,
  liveCache,
  onFetchLive,
}: PlantDetailViewProps) {
  const active = views.find((v) => v.plant.plantId === selectedPlantId) || views[0];
  const { plant } = active;
  const h = plant.hazards;
  const overallStyle = getLevelStyles(active.overallPhysicalLevel);
  const live = liveCache[plant.plantId] || { status: 'idle' };

  const byId = Object.fromEntries(views.map((v) => [v.plant.plantId, v]));
  const upstream = plant.upstreamPlantId ? byId[plant.upstreamPlantId] : undefined;
  const downstreams = plant.downstreamPlantIds.map((id) => byId[id]).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* One-Thumb Horizontal 9-Plant Switcher */}
      <section aria-label="Select plant">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {views.map((v) => {
            const isSelected = v.plant.plantId === plant.plantId;
            return (
              <button
                key={v.plant.plantId}
                type="button"
                onClick={() => onSelectPlant(v.plant.plantId)}
                className={`min-h-[42px] px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#E8F0FE] border-[#1A73E8] text-[#174EA6]'
                    : 'bg-white border-[#DADCE0] text-[#3C4043] hover:bg-[#F8F9FA]'
                }`}
              >
                <span className="font-mono mr-1.5">{v.plant.plantId}</span>
                <span>{v.plant.shortName}</span>
                <span className={`ml-1.5 text-[11px] ${getLevelStyles(v.overallPhysicalLevel).text}`}>
                  · {v.overallPhysicalLevel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Plant Header & Verified CSV Profile */}
      <section className="bg-white border border-[#DADCE0] rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-start justify-between gap-4 border-b border-[#E8EAED]">
          <div className="space-y-1.5">
            <div className="text-xs text-[#5F6368] flex flex-wrap items-center gap-2">
              <span className="font-mono font-semibold text-[#202124]">{plant.plantId}</span>
              <span aria-hidden="true">·</span>
              <span>{plant.plantType}</span>
              <span aria-hidden="true">·</span>
              <span>
                {plant.town}, {plant.state}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                <MapPin className="w-3 h-3 text-[#5F6368]" aria-hidden="true" />
                {plant.latitude.toFixed(4)}°N, {plant.longitude.toFixed(4)}°E (Approximate location)
              </span>
            </div>

            <h1 className="text-2xl font-semibold text-[#202124]">{plant.plantName}</h1>
            <p className="text-sm text-[#3C4043] max-w-3xl">{h.siteContext}</p>

            {/* Template Summary (Deterministic, Zero LLM Prose) */}
            <p className="text-xs text-[#5F6368] pt-1">
              <strong className="text-[#202124]">Board template takeaway:</strong>{' '}
              {active.templateSummary}
            </p>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between gap-3 shrink-0">
            <div className="sm:text-right">
              <div className="text-xs text-[#5F6368]">
                Physical Exposure ({window === 'today' ? 'Today' : '2040'})
              </div>
              <div className={`text-2xl font-semibold ${overallStyle.text}`}>
                {active.overallPhysicalLevel}
              </div>
              <div className="text-[11px] text-[#5F6368]">Exposure only (not loss)</div>
            </div>

            <div
              role="group"
              aria-label="Toggle Today vs 2040"
              className="inline-flex items-center p-1 bg-[#F1F3F4] rounded-lg"
            >
              <button
                type="button"
                onClick={() => onChangeWindow('today')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  window === 'today'
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368]'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => onChangeWindow('2040')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                  window === '2040'
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368]'
                }`}
              >
                2040
              </button>
            </div>
          </div>
        </div>

        {/* Verified Operational Bar (Explicitly labelling Book Value & Direct vs Dependent) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E8EAED] bg-[#F8F9FA]">
          <div className="p-4">
            <div className="text-[11px] text-[#5F6368]">Direct Revenue</div>
            <div className="text-sm font-mono font-semibold tabular-nums text-[#202124] mt-1">
              {formatInrCr(active.directRevenueCr)}
            </div>
            <div className="text-[11px] text-[#5F6368]">Booked at this plant</div>
          </div>

          <div className="p-4">
            <div className="text-[11px] text-[#5F6368]">Dependent Revenue</div>
            <div className="text-sm font-mono font-semibold tabular-nums text-[#1A73E8] mt-1">
              {active.dependentRevenueCr > 0
                ? formatInrCr(active.dependentRevenueCr)
                : '₹0 Cr'}
            </div>
            <div className="text-[11px] text-[#5F6368]">
              {active.dependentRevenueCr > 0
                ? `Downstream: ${plant.downstreamPlantIds.join(', ')}`
                : plant.upstreamPlantId
                  ? `Depends on ${plant.upstreamPlantId}`
                  : 'Standalone plant'}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] text-[#5F6368]">Asset Book Value</div>
            <div className="text-sm font-mono font-semibold tabular-nums text-[#202124] mt-1">
              {formatInrCr(active.directAssetCr)}
            </div>
            <div className="text-[11px] text-[#5F6368]">Gross block (book proxy)</div>
          </div>

          <div className="p-4">
            <div className="text-[11px] text-[#5F6368]">Output / Capacity</div>
            <div className="text-sm font-mono font-semibold tabular-nums text-[#202124] mt-1">
              {plant.cementOutputMt.toFixed(2)} / {plant.cementCapacityMtpa.toFixed(1)} Mt
            </div>
            <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
              {active.utilizationPct.toFixed(0)}% utilization
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] text-[#5F6368]">Clinker Factor</div>
            <div className="text-sm font-mono font-semibold tabular-nums text-[#202124] mt-1">
              {active.clinkerFactor.toFixed(2)}
            </div>
            <div className="text-[11px] text-[#5F6368]">
              {plant.plantId === 'P09'
                ? 'Verify: slag outlier'
                : `${active.clinkerConsumedMt.toFixed(2)} Mt on-site`}
            </div>
          </div>

          <div className="p-4">
            <div className="text-[11px] text-[#5F6368]">Water & Workforce</div>
            <div className="text-sm font-medium text-[#202124] mt-1 truncate">
              {plant.waterSource}
            </div>
            <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
              {plant.employees} staff
            </div>
          </div>
        </div>

        {/* Plant-Specific Auditor Caveats */}
        {plant.auditFlags.length > 0 && (
          <div className="px-5 sm:px-6 py-3 bg-[#FEF7E0]/60 border-t border-[#E8EAED] text-xs text-[#7A4400] space-y-1">
            {plant.auditFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#B06000]" aria-hidden="true" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Live Open-Meteo CMIP6 (2005-2025 vs 2030-2050) Verification Bar */}
      <section className="bg-white border border-[#DADCE0] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#202124]">
              Verify Live via Open-Meteo CMIP6 & GloFAS APIs
            </h2>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Fetches live daily CMIP6 model runs for <strong>2005–2025</strong> vs <strong>2030–2050</strong> (single high-emissions-like pathway, same models so bias cancels) + historical GloFAS peak discharge.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onFetchLive(plant.plantId)}
            disabled={live.status === 'loading'}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${live.status === 'loading' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>
              {live.status === 'loading'
                ? 'Querying Open-Meteo...'
                : live.status === 'success'
                  ? `Verified Live (${live.fetchedAt})`
                  : 'Run Live API Verification'}
            </span>
          </button>
        </div>

        {live.status === 'success' && (
          <div className="mt-4 pt-4 border-t border-[#E8EAED] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-[#5F6368]">Live CMIP6 Days ≥40°C (Today → 2040)</div>
              <div className="mt-1 text-sm font-mono font-semibold tabular-nums text-[#202124]">
                {live.todayDays40?.low}–{live.todayDays40?.high}d → {live.futureDays40?.low}–
                {live.futureDays40?.high}d
              </div>
              <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                ≥45°C: {live.todayDays45?.mid}d → {live.futureDays45?.mid}d/yr
              </div>
            </div>

            <div>
              <div className="text-[#5F6368]">Live Wettest Day & Dry Spell</div>
              <div className="mt-1 text-sm font-mono font-semibold tabular-nums text-[#202124]">
                {live.todayWettestMm} → {live.futureWettestMm} mm/day
              </div>
              <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                ≥100mm: {live.todayDays100mm} → {live.futureDays100mm}d · Dry: {live.todayDrySpell} → {live.futureDrySpell}d
              </div>
            </div>

            <div>
              <div className="text-[#5F6368]">Live GloFAS Historical Peak (No 2040)</div>
              <div className="mt-1 text-sm font-mono font-semibold tabular-nums text-[#202124]">
                {live.glofasMaxRecentM3s} m³/s
              </div>
              <div className="text-[11px] text-[#5F6368]">
                Historical context only (7-mo limit)
              </div>
            </div>

            <div className="flex flex-col justify-center gap-1.5">
              {live.climate2040Url && (
                <a
                  href={live.climate2040Url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#1A73E8] hover:underline"
                >
                  <span>Open CMIP6 2030–2050 JSON</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
              {live.floodUrl && (
                <a
                  href={live.floodUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[#1A73E8] hover:underline"
                >
                  <span>Open GloFAS Historical JSON</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </div>
        )}

        {live.status === 'error' && (
          <div className="mt-3 text-xs text-[#B06000]">
            {live.errorMessage}
          </div>
        )}
      </section>

      {/* 4 Physical Hazards Deep Breakdown (Source, Confidence & Assumptions for Every Number) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 1. Extreme Heat */}
        <div className="bg-white border border-[#DADCE0] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#E8EAED]">
              <div>
                <h3 className="text-base font-semibold text-[#202124]">1. Extreme Heat</h3>
                <p className="text-xs text-[#5F6368]">
                  Open-Meteo CMIP6 (7-model ensemble · ERA5 bias-corrected)
                </p>
              </div>
              <span className={`text-sm font-semibold ${getLevelStyles(active.heatLevel).text}`}>
                {active.heatLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#5F6368]">Days ≥40°C / yr (Today → 2040)</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-[#202124]">
                  {h.heat40Today.low}–{h.heat40Today.high}d → {h.heat40_2040.low}–
                  {h.heat40_2040.high}d
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                  Midpoint +{h.heat40_2040.mid - h.heat40Today.mid} days/yr
                </div>
              </div>
              <div>
                <div className="text-[#5F6368]">Days ≥45°C / yr (Today → 2040)</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-[#202124]">
                  {h.heat45Today.low}–{h.heat45Today.high}d → {h.heat45_2040.low}–
                  {h.heat45_2040.high}d
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                  Midpoint +{h.heat45_2040.mid - h.heat45Today.mid} days/yr
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8EAED] text-[11px] text-[#5F6368] flex flex-wrap justify-between gap-2">
            <span>Confidence: <strong className="text-[#202124]">High (direction) · Medium (local)</strong></span>
            <span>Tag: <strong className="text-[#202124]">CMIP6 Modelled · Illustrative thresholds</strong></span>
          </div>
        </div>

        {/* 2. Extreme Rain & Riverine Flood */}
        <div className="bg-white border border-[#DADCE0] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#E8EAED]">
              <div>
                <h3 className="text-base font-semibold text-[#202124]">
                  2. Extreme Rain & Flood
                </h3>
                <p className="text-xs text-[#5F6368]">
                  CMIP6 Rainfall + WRI Aqueduct 4.0 (rfr) + GloFAS Historical
                </p>
              </div>
              <span className={`text-sm font-semibold ${getLevelStyles(active.rainFloodLevel).text}`}>
                {active.rainFloodLevel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#5F6368]">Wettest Single Day (Today → 2040)</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-[#202124]">
                  {h.wettestDayMmToday.mid} → {h.wettestDayMm2040.mid} mm
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                  2040 range: {h.wettestDayMm2040.low}–{h.wettestDayMm2040.high} mm · ≥100mm:{' '}
                  {h.days100mmToday} → {h.days100mm2040}d
                </div>
              </div>
              <div>
                <div className="text-[#5F6368]">WRI Riverine Flood (rfr, 0–5)</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-[#202124]">
                  {h.aqueductRfrToday.toFixed(1)} → {active.aqueductRfr2040Interp.toFixed(1)}/5
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                  Interpolated (2030: {h.aqueductRfr2030} · 2050: {h.aqueductRfr2050})
                </div>
              </div>
            </div>

            <p className="text-xs text-[#5F6368]">
              GloFAS historical peak discharge (1984–present context only; no 2040 projection):{' '}
              <span className="font-mono font-medium text-[#202124]">
                ~{h.glofasHistoricalPeakM3s} m³/s
              </span>
              . Not a site flood-depth model.
            </p>
          </div>

          <div className="pt-3 border-t border-[#E8EAED] text-[11px] text-[#5F6368] flex flex-wrap justify-between gap-2">
            <span>Confidence: <strong className="text-[#202124]">Medium (prioritisation only)</strong></span>
            <span>Tag: <strong className="text-[#202124]">Interpolated 2040 · Historical Proxy</strong></span>
          </div>
        </div>

        {/* 3. Water Stress & Drought (with Water Source Override logic) */}
        <div className="bg-white border border-[#DADCE0] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#E8EAED]">
              <div>
                <h3 className="text-base font-semibold text-[#202124]">
                  3. Water Stress & Drought
                </h3>
                <p className="text-xs text-[#5F6368]">
                  WRI Aqueduct 4.0 (bws & drr) + Plant Water Source ({plant.waterSource})
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${getLevelStyles(active.waterDroughtLevel).text}`}
              >
                {active.waterDroughtLevel}
              </span>
            </div>

            {h.waterOverrideApplied && (
              <div className="p-3 rounded-lg bg-[#E8F0FE] border border-[#AECBFA] text-xs text-[#174EA6]">
                <strong className="font-semibold">{h.waterOverrideLabel}:</strong>{' '}
                {h.waterOverrideExplanation}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-[#5F6368]">WRI Raw Basin Stress (Today → 2040)</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-[#202124]">
                  {h.aqueductBwsToday.toFixed(1)} → {active.aqueductBws2040Interp.toFixed(1)}/5
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                  2030: {h.aqueductBws2030} · 2050: {h.aqueductBws2050} · drr {h.aqueductDrrToday}
                </div>
              </div>
              <div>
                <div className="text-[#5F6368]">Longest Dry Spell (Today → 2040)</div>
                <div className="mt-1 text-base font-mono font-semibold tabular-nums text-[#202124]">
                  {h.drySpellDaysToday.mid} → {h.drySpellDays2040.mid} days
                </div>
                <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                  2040 range: {h.drySpellDays2040.low}–{h.drySpellDays2040.high}d (&lt;1 mm/day)
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8EAED] text-[11px] text-[#5F6368] flex flex-wrap justify-between gap-2">
            <span>Basin: <strong className="text-[#202124]">{h.basinName}</strong></span>
            <span>
              Tag:{' '}
              <strong className="text-[#202124]">
                {h.waterOverrideApplied ? 'Water Override · Interpolated 2040' : 'WRI Aqueduct 4.0 · Interpolated 2040'}
              </strong>
            </span>
          </div>
        </div>

        {/* 4. Coastal Flag & Network Clinker Dependency */}
        <div className="bg-white border border-[#DADCE0] rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[#E8EAED]">
              <div>
                <h3 className="text-base font-semibold text-[#202124]">
                  4. Coastal Flag & Clinker Lineage
                </h3>
                <p className="text-xs text-[#5F6368]">
                  CSV coastal flag + verified network clinker flow (2.40 Mt balance)
                </p>
              </div>
              <span
                className={`text-sm font-semibold ${
                  plant.coastal ? 'text-[#B06000]' : 'text-[#5F6368]'
                }`}
              >
                {active.coastalFlagLabel}
              </span>
            </div>

            <p className="text-xs text-[#3C4043]">{h.aqueductCfrNote}</p>

            {/* Clinker Lineage */}
            <div className="pt-2">
              {upstream ? (
                <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E8EAED] flex flex-wrap items-center gap-2.5 text-xs">
                  <button
                    type="button"
                    onClick={() => onSelectPlant(upstream.plant.plantId)}
                    className="font-semibold text-[#1A73E8] hover:underline cursor-pointer"
                  >
                    {upstream.plant.plantId} {upstream.plant.shortName}
                  </button>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" aria-hidden="true" />
                  <span className="font-mono text-[#202124]">
                    {plant.clinkerReceivedMt.toFixed(2)} Mt/yr
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5F6368]" aria-hidden="true" />
                  <span className="font-semibold text-[#202124]">
                    {plant.plantId} {plant.shortName}
                  </span>
                </div>
              ) : downstreams.length > 0 ? (
                <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E8EAED] space-y-1.5 text-xs">
                  <div className="font-medium text-[#202124]">
                    Upstream Hub · Ships {plant.clinkerShippedMt.toFixed(2)} Mt/yr to:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {downstreams.map((d) => (
                      <button
                        key={d.plant.plantId}
                        type="button"
                        onClick={() => onSelectPlant(d.plant.plantId)}
                        className="px-2.5 py-1 bg-white border border-[#DADCE0] hover:border-[#1A73E8] rounded-md text-[#1A73E8] font-medium cursor-pointer"
                      >
                        {d.plant.plantId} {d.plant.shortName} ({d.plant.clinkerReceivedMt.toFixed(2)} Mt · {formatInrCr(d.directRevenueCr)})
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E8EAED] text-xs text-[#5F6368]">
                  Self-contained integrated kiln: consumes 100% of clinker on-site ({plant.clinkerProducedMt.toFixed(2)} Mt).
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E8EAED] text-[11px] text-[#5F6368] flex flex-wrap justify-between gap-2">
            <span>Confidence: <strong className="text-[#202124]">{plant.coastal ? 'Flag only (cyclone/SLR in v2)' : 'Verified CSV'}</strong></span>
            <span>Tag: <strong className="text-[#202124]">Verified CSV</strong></span>
          </div>
        </div>
      </section>
    </div>
  );
}
