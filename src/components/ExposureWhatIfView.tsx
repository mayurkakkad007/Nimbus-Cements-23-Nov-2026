import { ArrowRight, Info } from 'lucide-react';
import { useState } from 'react';
import { PlantPhysicalView, TimeWindow } from '../types/climate';
import { formatInrCr, getLevelStyles } from '../utils/physicalMetrics';

interface ExposureWhatIfViewProps {
  views: PlantPhysicalView[];
  window: TimeWindow;
  onInspectPlant: (plantId: string) => void;
}

type ExposureMode = 'direct' | 'network';
type OutageTarget = 'P01' | 'P06' | 'both';

export function ExposureWhatIfView({
  views,
  window,
  onInspectPlant,
}: ExposureWhatIfViewProps) {
  const [exposureMode, setExposureMode] = useState<ExposureMode>('network');
  const [outageTarget, setOutageTarget] = useState<OutageTarget>('P01');
  const [daysDown, setDaysDown] = useState<number>(20);
  const [bufferDays, setBufferDays] = useState<number>(15);

  const byId = Object.fromEntries(views.map((v) => [v.plant.plantId, v]));
  const totalDirectRevCr = views.reduce((s, v) => s + v.directRevenueCr, 0);
  const totalBookValueCr = views.reduce((s, v) => s + v.directAssetCr, 0);

  // Outage What-If calculation (explicitly labelled Illustrative)
  const hubIds = outageTarget === 'both' ? ['P01', 'P06'] : [outageTarget];
  const downstreamIds =
    outageTarget === 'P01'
      ? ['P07']
      : outageTarget === 'P06'
        ? ['P08', 'P09']
        : ['P07', 'P08', 'P09'];

  const hubDirectRevCr = hubIds.reduce(
    (s, id) => s + (byId[id]?.directRevenueCr || 0),
    0
  );
  const depRevCr = downstreamIds.reduce(
    (s, id) => s + (byId[id]?.directRevenueCr || 0),
    0
  );
  const clinkerShippedMtYr = hubIds.reduce(
    (s, id) => s + (byId[id]?.plant.clinkerShippedMt || 0),
    0
  );

  // Downstream grinding units draw down clinker buffer stock before halting
  const netDownstreamStopDays = Math.max(0, daysDown - bufferDays);
  const operatingDaysPerYear = 330;

  const directStoppageRevCr = (hubDirectRevCr / operatingDaysPerYear) * daysDown;
  const downstreamStoppageRevCr =
    (depRevCr / operatingDaysPerYear) * netDownstreamStopDays;
  const totalIllustrativeRevAffectedCr =
    directStoppageRevCr + downstreamStoppageRevCr;
  const clinkerShortfallKt = (clinkerShippedMtYr * 1000 * daysDown) / operatingDaysPerYear;

  const sortedForBars = [...views].sort((a, b) => {
    const valA =
      exposureMode === 'direct'
        ? a.directRevenueCr
        : a.directRevenueCr + a.dependentRevenueCr;
    const valB =
      exposureMode === 'direct'
        ? b.directRevenueCr
        : b.directRevenueCr + b.dependentRevenueCr;
    return valB - valA;
  });

  const maxBarRev = Math.max(
    ...sortedForBars.map((v) =>
      exposureMode === 'direct'
        ? v.directRevenueCr
        : v.directRevenueCr + v.dependentRevenueCr
    ),
    1
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-[#5F6368]">
          Financial Materiality · Exposure (Not Damage Loss) · Zero Double-Counting
        </p>
        <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#202124] mt-1">
          ₹ Exposure & Outage What-If
        </h1>
        <p className="text-sm text-[#5F6368] mt-1 max-w-3xl">
          Revenue sits at the plant that books it, while grinding units depend 100% on upstream kilns. Direct and dependent revenue are always shown separately and never double-counted into the ₹9,658 Cr group total.
        </p>
      </div>

      {/* Section 1: Direct vs. Network-Dependent ₹ Exposure */}
      <section className="bg-white border border-[#DADCE0] rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E8EAED] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-[#202124]">
              Revenue & Asset Exposure by Plant ({window === 'today' ? 'Today' : '2040'})
            </h2>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Gross Block is historical book value (understates replacement cost, especially P05 1998 kiln)
            </p>
          </div>

          <div
            role="group"
            aria-label="Direct versus Network-Dependent toggle"
            className="inline-flex items-center p-1 bg-[#F1F3F4] rounded-lg"
          >
            <button
              type="button"
              onClick={() => setExposureMode('direct')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                exposureMode === 'direct'
                  ? 'bg-white text-[#1A73E8] shadow-xs'
                  : 'text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Direct Only (₹9,658 Cr)
            </button>
            <button
              type="button"
              onClick={() => setExposureMode('network')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                exposureMode === 'network'
                  ? 'bg-white text-[#1A73E8] shadow-xs'
                  : 'text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              Direct + Dependent Hubs
            </button>
          </div>
        </div>

        {/* Non-double-counting rule banner */}
        <div className="px-5 sm:px-6 py-2.5 bg-[#F8F9FA] border-b border-[#E8EAED] flex items-center gap-2 text-xs text-[#5F6368]">
          <Info className="w-3.5 h-3.5 text-[#1A73E8] shrink-0" aria-hidden="true" />
          <span>
            <strong className="text-[#202124]">No double-counting rule:</strong> Group total revenue is strictly{' '}
            <span className="font-mono font-medium text-[#202124]">₹9,658 Cr</span> (sum of Direct column). Dependent bars show downstream grinding revenue linked to P01 (₹848 Cr) and P06 (₹1,160 Cr) for hub-priority triage only.
          </span>
        </div>

        {/* Clean Horizontal Comparison Bars */}
        <div className="p-5 sm:p-6 divide-y divide-[#E8EAED]">
          {sortedForBars.map((v) => {
            const directPct = (v.directRevenueCr / maxBarRev) * 100;
            const depPct =
              exposureMode === 'network'
                ? (v.dependentRevenueCr / maxBarRev) * 100
                : 0;
            const tierStyle = getLevelStyles(v.overallPhysicalLevel);

            return (
              <button
                key={v.plant.plantId}
                type="button"
                onClick={() => onInspectPlant(v.plant.plantId)}
                className="w-full text-left py-3.5 first:pt-0 last:pb-0 hover:bg-[#F8F9FA] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                  <div className="text-sm font-medium text-[#202124]">
                    <span className="font-mono text-xs text-[#5F6368] mr-1.5">
                      {v.plant.plantId}
                    </span>
                    {v.plant.shortName}
                    <span className="text-xs font-normal text-[#5F6368] ml-2">
                      · {v.plant.plantType} ·{' '}
                      <span className={`font-medium ${tierStyle.text}`}>
                        {v.overallPhysicalLevel}
                      </span>
                    </span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-[#202124]">
                    <span>Direct {formatInrCr(v.directRevenueCr)}</span>
                    {v.dependentRevenueCr > 0 && (
                      <span className="text-[#1A73E8] font-medium">
                        {' '}
                        · Dep. {formatInrCr(v.dependentRevenueCr)} (
                        {v.plant.downstreamPlantIds.join('+')})
                      </span>
                    )}
                    <span className="text-[#5F6368]">
                      {' '}
                      · Book {formatInrCr(v.directAssetCr)}
                    </span>
                  </div>
                </div>

                {/* Stacked Bar: Solid Slate/Blue Direct + Soft Blue Dependent */}
                <div className="h-2.5 w-full bg-[#F1F3F4] rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-[#3C4043]"
                    style={{ width: `${directPct}%` }}
                  />
                  {depPct > 0 && (
                    <div
                      className="h-full bg-[#1A73E8]/55 border-l border-white"
                      style={{ width: `${depPct}%` }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-5 sm:px-6 py-3 bg-[#F8F9FA] border-t border-[#E8EAED] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5F6368]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-xs bg-[#3C4043] inline-block" />
              Direct booked revenue
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-xs bg-[#1A73E8]/55 inline-block" />
              Downstream dependent revenue (not summed into group total)
            </span>
          </div>
          <span className="font-mono tabular-nums text-[#202124]">
            Group Direct Total: {formatInrCr(totalDirectRevCr)} · Book Value: {formatInrCr(totalBookValueCr)}
          </span>
        </div>
      </section>

      {/* Section 2: Simple Outage What-If Simulator (Days Down + Buffer Days) */}
      <section className="bg-white border border-[#DADCE0] rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E8EAED] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[#202124]">
                Hub Outage What-If Simulator
              </h2>
              <span className="text-xs font-medium text-[#B06000]">· Illustrative</span>
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5">
              Tests how a heat, water, or flood stoppage at P01 or P06 propagates after downstream clinker stock runs out
            </p>
          </div>

          <div
            role="group"
            aria-label="Select disrupted hub"
            className="inline-flex items-center p-1 bg-[#F1F3F4] rounded-lg"
          >
            {(
              [
                { id: 'P01', label: 'P01 Chittorgarh' },
                { id: 'P06', label: 'P06 Baloda Bazar' },
                { id: 'both', label: 'Both Hubs' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setOutageTarget(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  outageTarget === opt.id
                    ? 'bg-[#D93025] text-white shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Adjustable Controls: Days Down & Clinker Buffer Stock */}
        <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 border-b border-[#E8EAED]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="days-down-slider" className="font-medium text-[#202124]">
                Upstream hub outage duration (Days Down)
              </label>
              <span className="font-mono font-semibold tabular-nums text-[#D93025]">
                {daysDown} days
              </span>
            </div>
            <input
              id="days-down-slider"
              type="range"
              min={1}
              max={45}
              step={1}
              value={daysDown}
              onChange={(e) => setDaysDown(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-[11px] text-[#5F6368]">
              Example: monsoon flood washout on rail siding or prolonged groundwater / canal curtailment.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="buffer-days-slider" className="font-medium text-[#202124]">
                Downstream clinker stock buffer (Illustrative, default 15d)
              </label>
              <span className="font-mono font-semibold tabular-nums text-[#1A73E8]">
                {bufferDays} days
              </span>
            </div>
            <input
              id="buffer-days-slider"
              type="range"
              min={0}
              max={30}
              step={1}
              value={bufferDays}
              onChange={(e) => setBufferDays(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
            <p className="text-[11px] text-[#5F6368]">
              Invented assumption (silo storage not in CSV). Grinding units keep running until buffer reaches zero.
            </p>
          </div>
        </div>

        {/* Visual Propagation Flow + Output Metrics */}
        <div className="p-5 sm:p-6 bg-[#F8F9FA] space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="px-3.5 py-2.5 bg-white border border-[#F6AEA9] rounded-lg">
              <div className="font-mono text-[11px] text-[#C5221F]">
                Upstream Hub Stopped ({daysDown}d)
              </div>
              <div className="text-sm font-semibold text-[#202124]">
                {hubIds.map((id) => `${id} ${byId[id]?.plant.shortName}`).join(' + ')}
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[#5F6368]">
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
              <span>
                −{Math.round(clinkerShortfallKt)} kt clinker · {bufferDays}d buffer
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </div>

            <div
              className={`px-3.5 py-2.5 bg-white border rounded-lg ${
                netDownstreamStopDays > 0 ? 'border-[#F6AEA9]' : 'border-[#A8DAB5]'
              }`}
            >
              <div
                className={`font-mono text-[11px] ${
                  netDownstreamStopDays > 0 ? 'text-[#C5221F]' : 'text-[#137333]'
                }`}
              >
                {netDownstreamStopDays > 0
                  ? `Downstream Halts (${netDownstreamStopDays}d net)`
                  : 'Absorbed by Buffer (0d halt)'}
              </div>
              <div className="text-sm font-semibold text-[#202124]">
                {downstreamIds
                  .map((id) => `${id} ${byId[id]?.plant.shortName}`)
                  .join(', ')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-[#E8EAED]">
            <div>
              <div className="text-[11px] text-[#5F6368]">
                Direct Hub Revenue Exposed ({daysDown}d)
              </div>
              <div className="text-xl font-mono font-semibold tabular-nums text-[#202124] mt-1">
                {formatInrCr(directStoppageRevCr, 1)}
              </div>
              <div className="text-[11px] text-[#5F6368]">
                Illustrative · {formatInrCr(hubDirectRevCr)}/yr ÷ 330d
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[#5F6368]">
                Downstream Cascade Exposed ({netDownstreamStopDays}d)
              </div>
              <div
                className={`text-xl font-mono font-semibold tabular-nums mt-1 ${
                  netDownstreamStopDays > 0 ? 'text-[#C5221F]' : 'text-[#137333]'
                }`}
              >
                {formatInrCr(downstreamStoppageRevCr, 1)}
              </div>
              <div className="text-[11px] text-[#5F6368]">
                {netDownstreamStopDays > 0
                  ? `After ${bufferDays}d buffer exhausted`
                  : `${bufferDays}d stock covers ${daysDown}d outage`}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[#5F6368]">
                Combined Illustrative Exposure
              </div>
              <div className="text-xl font-mono font-semibold tabular-nums text-[#C5221F] mt-1">
                {formatInrCr(totalIllustrativeRevAffectedCr, 1)}
              </div>
              <div className="text-[11px] text-[#5F6368]">
                Illustrative only · Excludes insurance & spot clinker
              </div>
            </div>

            <div>
              <div className="text-[11px] text-[#5F6368]">
                Annual Hub Footprint (Direct + Dep.)
              </div>
              <div className="text-xl font-mono font-semibold tabular-nums text-[#202124] mt-1">
                {formatInrCr(hubDirectRevCr + depRevCr)}
              </div>
              <div className="text-[11px] text-[#5F6368] font-mono tabular-nums">
                {(((hubDirectRevCr + depRevCr) / totalDirectRevCr) * 100).toFixed(1)}% of Nimbus revenue
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
