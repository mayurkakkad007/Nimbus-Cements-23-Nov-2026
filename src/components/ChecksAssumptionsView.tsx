import {
  CheckCircle2,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  ASSUMPTIONS_REGISTER,
  DATA_SOURCES_RANKED,
  DATA_VALIDATION_CHECKS,
  MACRO_CONTEXT_NOTES,
  SCOPE_CUTS_V1,
} from '../data/nimbusPlants';
import { SimulatedStateMode } from '../types/climate';

interface ChecksAssumptionsViewProps {
  stateMode: SimulatedStateMode;
  onChangeStateMode: (mode: SimulatedStateMode) => void;
  onInspectPlant: (plantId: string) => void;
  onDownloadCsv: () => void;
}

export function ChecksAssumptionsView({
  stateMode,
  onChangeStateMode,
  onInspectPlant,
  onDownloadCsv,
}: ChecksAssumptionsViewProps) {
  const statusColor = (status: string) => {
    if (status === 'Passed') return 'text-[#137333]';
    if (status === 'Override Applied') return 'text-[#1A73E8]';
    if (status === 'Trap Flagged') return 'text-[#C5221F]';
    return 'text-[#B06000]';
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#5F6368]">
            Collect · Validate · Report · Audit Assurance Trail
          </p>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-[#202124] mt-1">
            Data Checks, Assumptions & Scope
          </h1>
          <p className="text-sm text-[#5F6368] mt-1 max-w-3xl">
            Every number in v1 traces to a named source or an explicitly labelled assumption. Where inputs are missing or approximate, v1 flags them rather than fabricating precision.
          </p>
        </div>

        <button
          type="button"
          onClick={onDownloadCsv}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[#202124] bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Export Verified CSV</span>
        </button>
      </div>

      {/* Positive Validation Highlight Card */}
      <div className="bg-white border border-[#A8DAB5] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#137333] shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold text-[#137333]">
              Data Validation Passed: Clinker Mass Balance Reconciles Exactly
            </div>
            <p className="text-xs text-[#3C4043] mt-0.5">
              Shipped clinker <span className="font-mono font-medium">2.40 Mt</span> (P01 1.12 + P06 1.28) equals received clinker{' '}
              <span className="font-mono font-medium">2.40 Mt</span> (P07 1.12 + P08 0.68 + P09 0.60). Group Scope 1 intensity is{' '}
              <span className="font-mono font-medium">596 kg CO2/t</span> (slightly better than India’s ~630 kg/t average).
            </p>
          </div>
        </div>
      </div>

      {/* 1. All 9 In-Product Data Validation Checks */}
      <section className="bg-white border border-[#DADCE0] rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E8EAED]">
          <h2 className="text-base font-semibold text-[#202124]">
            1. In-Product Data Checks (9 Findings from nimbus_cement_plants.csv)
          </h2>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Automated reconciliation plus domain traps checked before presenting figures to the Board or Auditor
          </p>
        </div>

        <div className="divide-y divide-[#E8EAED]">
          {DATA_VALIDATION_CHECKS.map((chk) => (
            <div key={chk.id} className="p-5 sm:p-6 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-semibold text-[#5F6368]">{chk.id}</span>
                <span aria-hidden="true">·</span>
                <span className={`font-semibold ${statusColor(chk.status)}`}>{chk.status}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#5F6368]">
                  Plants:{' '}
                  {chk.affectedPlants.slice(0, 5).map((pid, i) => (
                    <span key={pid}>
                      <button
                        type="button"
                        onClick={() => onInspectPlant(pid)}
                        className="font-mono text-[#1A73E8] hover:underline cursor-pointer"
                      >
                        {pid}
                      </button>
                      {i < Math.min(chk.affectedPlants.length, 5) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {chk.affectedPlants.length > 5 ? ` (+${chk.affectedPlants.length - 5} more)` : ''}
                </span>
              </div>

              <h3 className="text-sm font-semibold text-[#202124]">{chk.title}</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs leading-relaxed">
                <div>
                  <span className="font-semibold text-[#3C4043]">Why it matters: </span>
                  <span className="text-[#5F6368]">{chk.whyItMatters}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#3C4043]">How v1 handles it: </span>
                  <span className="text-[#5F6368]">{chk.howV1HandlesIt}</span>
                </div>
              </div>

              <div className="text-xs font-mono text-[#202124] bg-[#F8F9FA] border border-[#E8EAED] rounded-lg px-3.5 py-2">
                {chk.proof}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Explicit Assumptions Register */}
      <section className="bg-white border border-[#DADCE0] rounded-xl overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E8EAED]">
          <h2 className="text-base font-semibold text-[#202124]">
            2. Explicit Assumptions Register
          </h2>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Every modelling choice, interpolation, and illustrative default documented upfront
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E8EAED] text-[12px] font-medium text-[#5F6368]">
                <th className="py-3 pl-5 pr-3 whitespace-nowrap">ID</th>
                <th className="py-3 px-3 whitespace-nowrap">Topic & Tag</th>
                <th className="py-3 px-3">Assumption in v1</th>
                <th className="py-3 pl-3 pr-5">Impact if Changed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAED] text-xs">
              {ASSUMPTIONS_REGISTER.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className="py-3.5 pl-5 pr-3 font-mono text-[#5F6368] whitespace-nowrap">
                    {a.id}
                  </td>
                  <td className="py-3.5 px-3 min-w-[180px]">
                    <div className="font-semibold text-[#202124]">{a.topic}</div>
                    <div className="text-[11px] text-[#1A73E8] mt-0.5">{a.tag}</div>
                  </td>
                  <td className="py-3.5 px-3 text-[#3C4043] min-w-[260px] leading-relaxed">
                    {a.assumption}
                  </td>
                  <td className="py-3.5 pl-3 pr-5 text-[#5F6368] min-w-[200px]">
                    {a.impactIfChanged}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. Open Data Sources Ranked (Core / Supporting / Parked) */}
      <section className="bg-white border border-[#DADCE0] rounded-xl p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[#202124]">
            3. Open Data Sources & Known Limits
          </h2>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Addressing India’s fragmented climate-risk data landscape honestly across Open-Meteo, WRI Aqueduct, and IMD
          </p>
        </div>

        <div className="divide-y divide-[#E8EAED]">
          {DATA_SOURCES_RANKED.core.map((s) => (
            <div key={s.name} className="py-3.5 first:pt-0 grid grid-cols-1 lg:grid-cols-12 gap-2 text-xs">
              <div className="lg:col-span-3">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-[#1A73E8] hover:underline"
                >
                  <span>{s.name}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" aria-hidden="true" />
                </a>
                <div className="text-[11px] text-[#137333] mt-0.5">Core for v1</div>
              </div>
              <div className="lg:col-span-4 text-[#3C4043]">{s.gives}</div>
              <div className="lg:col-span-5 text-[#5F6368]">{s.limits}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-[#E8EAED] text-xs">
          <div className="space-y-2">
            <h3 className="font-semibold text-[#202124]">Supporting Sources (Validation & Production Upgrade)</h3>
            {DATA_SOURCES_RANKED.supporting.map((s) => (
              <p key={s.name} className="text-[#5F6368]">
                <strong className="text-[#202124]">{s.name}:</strong> {s.note}
              </p>
            ))}
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-[#202124]">Parked for v2</h3>
            {DATA_SOURCES_RANKED.parkedV2.map((s) => (
              <p key={s.name} className="text-[#5F6368]">
                <strong className="text-[#202124]">{s.name}:</strong> {s.note}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Scope Cuts & Macro Context */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="bg-white border border-[#DADCE0] rounded-xl p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[#137333]">Built in v1</h2>
          <div className="mt-3 divide-y divide-[#E8EAED]">
            {SCOPE_CUTS_V1.builds.map((b) => (
              <div key={b.item} className="py-2.5 first:pt-0 last:pb-0">
                <div className="text-sm font-medium text-[#202124]">{b.item}</div>
                <div className="text-xs text-[#5F6368] mt-0.5">{b.reason}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#DADCE0] rounded-xl p-5 sm:p-6">
          <h2 className="text-base font-semibold text-[#202124]">Intentionally Left Out of v1</h2>
          <div className="mt-3 divide-y divide-[#E8EAED]">
            {SCOPE_CUTS_V1.cuts.map((c) => (
              <div key={c.item} className="py-2.5 first:pt-0 last:pb-0">
                <div className="text-sm font-medium text-[#202124]">{c.item}</div>
                <div className="text-xs text-[#5F6368] mt-0.5">{c.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Board Macro Context + Operational State Demo */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-[#DADCE0] rounded-xl p-5 sm:p-6 space-y-3">
          <h2 className="text-base font-semibold text-[#202124]">
            Board & Macro Context (FY 2026–27)
          </h2>
          <div className="divide-y divide-[#E8EAED]">
            {MACRO_CONTEXT_NOTES.map((m) => (
              <div key={m.title} className="py-2.5 first:pt-0 last:pb-0">
                <div className="text-sm font-medium text-[#202124]">{m.title}</div>
                <div className="text-xs text-[#5F6368] mt-0.5">{m.detail}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Stale / API Error UI State Verification Control */}
        <div className="lg:col-span-5 bg-white border border-[#DADCE0] rounded-xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#202124]">
              Resilience & Error State Preview
            </h2>
            <p className="text-xs text-[#5F6368] mt-1">
              Test how the Overview handles a missed nightly climate refresh (stale cache) or an upstream Open-Meteo API failure without displaying unverified numbers.
            </p>
          </div>

          <div
            role="group"
            aria-label="Preview data freshness and error states"
            className="inline-flex items-center p-1 bg-[#F1F3F4] rounded-lg self-start"
          >
            {(
              [
                { id: 'normal', label: 'Normal' },
                { id: 'stale', label: 'Stale Cache (>24h)' },
                { id: 'error', label: 'API Error Fallback' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChangeStateMode(opt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  stateMode === opt.id
                    ? 'bg-white text-[#1A73E8] shadow-xs'
                    : 'text-[#5F6368] hover:text-[#202124]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <p className="text-[11px] text-[#5F6368]">
            Switch state here and return to <strong>Overview</strong> to inspect the live warning banner; Empty State can be tested via the Overview matrix search box.
          </p>
        </div>
      </section>
    </div>
  );
}
