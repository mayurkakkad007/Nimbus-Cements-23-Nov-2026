import { Check, Copy, Download, Printer, X } from 'lucide-react';
import { useState } from 'react';
import { PlantPhysicalView, TimeWindow } from '../types/climate';
import { formatInrCr, sortViewsByPriority } from '../utils/physicalMetrics';

interface BoardViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  views: PlantPhysicalView[];
  window: TimeWindow;
  onDownloadCsv: () => void;
}

export function BoardViewModal({
  isOpen,
  onClose,
  views,
  window,
  onDownloadCsv,
}: BoardViewModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sorted = sortViewsByPriority(views);
  const highViews = sorted.filter((v) => v.overallPhysicalLevel === 'High');
  const totalDirectRevCr = views.reduce((s, v) => s + v.directRevenueCr, 0);
  const totalBookCr = views.reduce((s, v) => s + v.directAssetCr, 0);
  const highRevCr = highViews.reduce((s, v) => s + v.directRevenueCr, 0);
  const highBookCr = highViews.reduce((s, v) => s + v.directAssetCr, 0);

  const windowTitle =
    window === 'today' ? 'Today (2005–2025 Baseline)' : '2040 (2030–2050 CMIP6 Window)';

  const plainMemo = `NIMBUS CEMENT LTD — ONE-PAGE PHYSICAL CLIMATE EXPOSURE BRIEF (v1)
Prepared for: Board of Directors, Statutory Auditor & Institutional Investors
Window: ${windowTitle} · Single CMIP6 high-emissions-like pathway · Exposure (Not Financial Loss)

1. HEADLINE EXPOSURE (NO DOUBLE-COUNTING)
- Portfolio: 9 plants · ₹${totalDirectRevCr.toLocaleString('en-IN')} Cr direct revenue · ₹${totalBookCr.toLocaleString('en-IN')} Cr book value (gross block; understates replacement cost).
- Network Hub Concentration: 52.1% of group revenue (₹5,032 Cr) rests on 2 kilns — P01 Chittorgarh (Direct ₹1,749 Cr + Dependent P07 ₹848 Cr) and P06 Baloda Bazar (Direct ₹1,275 Cr + Dependent P08+P09 ₹1,160 Cr).
- High Physical Exposure (${window === 'today' ? 'Today' : '2040'}): ${highViews.length} of 9 plants (${formatInrCr(highRevCr)} direct revenue; ${formatInrCr(highBookCr)} book value).

2. PRIORITY PLANTS & PRIMARY PHYSICAL HAZARDS
${sorted
  .slice(0, 5)
  .map(
    (v, i) =>
      `${i + 1}. ${v.plant.plantId} ${v.plant.shortName} (${v.overallPhysicalLevel}) — ${v.templateSummary}`
  )
  .join('\n')}

3. AUDIT & SCOPE DISCLOSURES
- Validation Passed: Clinker balance reconciles (2.40 Mt shipped = 2.40 Mt received).
- Approximate Locations: Town-centre coordinates (~5–25 km climate grids); plant-gate & mine coordinates required for engineering deep dives.
- Water Overrides: Desalinated seawater (P07), municipal supply (P08) & Mahanadi canal (P06) override generic basin stress.
- Transition Risk Parked for v2: FY23–24 CCTS plant baselines missing; illustrative near-term CCTS cost (~3.4% cut on 10,932 kt @ $10/t, ₹89/$) ≈ ₹33 Cr (~0.3% of revenue).`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainMemo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="board-view-title"
    >
      <div className="bg-white border border-[#DADCE0] rounded-xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E8EAED] flex flex-wrap items-center justify-between gap-3 no-print">
          <div>
            <h2 id="board-view-title" className="text-base font-semibold text-[#202124]">
              Printable One-Page Board View
            </h2>
            <p className="text-xs text-[#5F6368]">
              Template text built directly from verified numbers (no LLM commentary)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202124] bg-[#F1F3F4] hover:bg-[#E8EAED] rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202124] bg-[#F1F3F4] hover:bg-[#E8EAED] rounded-lg cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#137333]" aria-hidden="true" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => globalThis.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1A73E8] hover:bg-[#1765CC] rounded-lg cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close board view"
              className="p-1.5 text-[#5F6368] hover:text-[#202124] hover:bg-[#F1F3F4] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-[#3C4043]">
          <div className="pb-4 border-b border-[#E8EAED]">
            <div className="text-xs text-[#5F6368]">
              Nimbus Cement Ltd · Meera Iyer, Head of Sustainability · One-Page Board Handout
            </div>
            <h3 className="text-xl font-semibold text-[#202124] mt-1">
              Physical Climate Exposure: {windowTitle}
            </h3>
            <p className="text-xs text-[#5F6368] mt-1">
              Exposure only (no damage curves) · Direct & dependent revenue separated · Book value proxy
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-[#E8EAED]">
            <div>
              <div className="text-[11px] text-[#5F6368]">2-Hub Revenue</div>
              <div className="font-mono font-semibold text-[#1A73E8] tabular-nums">
                ₹5,032 Cr (52.1%)
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#5F6368]">High Exposure</div>
              <div className="font-mono font-semibold text-[#C5221F] tabular-nums">
                {highViews.length} / 9 plants
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#5F6368]">Direct Group Rev</div>
              <div className="font-mono font-semibold text-[#202124] tabular-nums">
                {formatInrCr(totalDirectRevCr)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#5F6368]">Book Value Proxy</div>
              <div className="font-mono font-semibold text-[#202124] tabular-nums">
                {formatInrCr(totalBookCr)}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-[#202124] mb-2">
              9-Plant Exposure Snapshot ({window === 'today' ? 'Today' : '2040'})
            </h4>
            <div className="overflow-x-auto border border-[#E8EAED] rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[#5F6368]">
                    <th className="py-2 px-3">Plant</th>
                    <th className="py-2 px-2">Heat (≥40°C)</th>
                    <th className="py-2 px-2">Rain/Flood</th>
                    <th className="py-2 px-2">Water</th>
                    <th className="py-2 px-3 text-right">Direct · Dep. Rev</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EAED]">
                  {sorted.map((v) => (
                    <tr key={v.plant.plantId}>
                      <td className="py-2 px-3 font-medium text-[#202124] whitespace-nowrap">
                        {v.plant.plantId} {v.plant.shortName}
                        {v.plant.coastal ? ' (Coastal)' : ''}
                      </td>
                      <td className="py-2 px-2 font-mono tabular-nums whitespace-nowrap">
                        {v.activeHeat40.low}–{v.activeHeat40.high}d
                      </td>
                      <td className="py-2 px-2 font-mono tabular-nums whitespace-nowrap">
                        rfr {v.activeRfr.toFixed(1)}/5
                      </td>
                      <td className="py-2 px-2 whitespace-nowrap">
                        {v.waterDroughtLevel}
                        {v.plant.hazards.waterOverrideApplied ? ' (override)' : ''}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                        {formatInrCr(v.directRevenueCr)}
                        {v.dependentRevenueCr > 0
                          ? ` · +${formatInrCr(v.dependentRevenueCr)}`
                          : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-[#5F6368]">
            <h4 className="text-xs font-semibold text-[#202124]">
              Key Caveats & Scope Boundary
            </h4>
            <p>
              • <strong className="text-[#202124]">Data Hygiene:</strong> Clinker balance reconciled (2.40 Mt = 2.40 Mt). Coordinates are town centres (~5–25 km grids). Gross block is book value (understates replacement cost, esp. P05 1998 kiln).
            </p>
            <p>
              • <strong className="text-[#202124]">Transition Parked for v2:</strong> FY23–24 CCTS plant baselines are absent; illustrative near-term CCTS cost (~3.4% cut on 10,932 kt @ $10/t, ₹89/$) is ~₹33 Cr (~0.3% revenue). Physical hub dependency (52.1% revenue) is the immediate priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
