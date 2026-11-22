import { useState } from 'react';
import { PlantPhysicalView } from '../types/climate';
import { formatInrCr, getLevelStyles } from '../utils/physicalMetrics';

interface IndiaPlantMapProps {
  views: PlantPhysicalView[];
  selectedPlantId: string;
  onSelectPlant: (plantId: string) => void;
  onInspectPlant: (plantId: string) => void;
  highlightedHub: 'none' | 'P01' | 'P06';
  onChangeHub: (hub: 'none' | 'P01' | 'P06') => void;
}

// Exact calibrated coordinates in India_Map_HD_1e02eddd.PNG (960x1358) space — KEPT INTACT
const VIEW_BOX = '42 136 906 1110';

const PLANT_PIXEL_COORDS: Record<string, [number, number]> = {
  P01: [268, 598], // Chittorgarh, SE Rajasthan
  P02: [452, 616], // Satna, NE Madhya Pradesh
  P03: [414, 766], // Chandrapur, Eastern Maharashtra
  P04: [402, 878], // Nalgonda, Central-South Telangana
  P05: [392, 1088], // Ariyalur, Central-East Tamil Nadu
  P06: [488, 722], // Baloda Bazar, Central Chhattisgarh
  P07: [126, 664], // Mundra, Kutch Coast, Gujarat
  P08: [624, 756], // Paradip, Odisha East Coast
  P09: [634, 652], // Durgapur, West-Central West Bengal
};

function getPlantPos(plantId: string, lat: number, lon: number): [number, number] {
  if (PLANT_PIXEL_COORDS[plantId]) {
    return PLANT_PIXEL_COORDS[plantId];
  }
  const x = 83 + (lon - 68.2) * 28.53;
  const y = 174 + (37.08 - lat) * 35.59;
  return [Math.round(x), Math.round(y)];
}

const SUPPLY_ROUTES = [
  { from: 'P01', to: 'P07', volumeMt: 1.12, mode: 'Rail · 1.12 Mt', curveLift: 46 },
  { from: 'P06', to: 'P08', volumeMt: 0.68, mode: '0.68 Mt', curveLift: 28 },
  { from: 'P06', to: 'P09', volumeMt: 0.6, mode: '0.60 Mt', curveLift: 36 },
];

const LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }> = {
  P01: { dx: 0, dy: -30, anchor: 'middle' },
  P02: { dx: 22, dy: -12, anchor: 'start' },
  P03: { dx: -24, dy: 6, anchor: 'end' },
  P04: { dx: -22, dy: 8, anchor: 'end' },
  P05: { dx: 22, dy: 6, anchor: 'start' },
  P06: { dx: -20, dy: -20, anchor: 'end' },
  P07: { dx: 10, dy: 34, anchor: 'middle' },
  P08: { dx: 20, dy: 10, anchor: 'start' },
  P09: { dx: 20, dy: -10, anchor: 'start' },
};

export function IndiaPlantMap({
  views,
  selectedPlantId,
  onSelectPlant,
  onInspectPlant,
  highlightedHub,
  onChangeHub,
}: IndiaPlantMapProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const byId = Object.fromEntries(views.map((v) => [v.plant.plantId, v]));
  const activeId = hoveredId || selectedPlantId;
  const activeView = byId[activeId] || views[0];

  const isInHighlightedHub = (plantId: string) => {
    if (highlightedHub === 'none') return false;
    if (plantId === highlightedHub) return true;
    return byId[plantId]?.plant.upstreamPlantId === highlightedHub;
  };

  return (
    <div className="bg-white border border-[#DADCE0] rounded-xl p-5 flex flex-col h-full">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3.5">
        <div>
          <h2 className="text-base font-semibold text-[#202124]">
            Portfolio Footprint & Clinker Flows
          </h2>
          <p className="text-xs text-[#5F6368] mt-0.5">
            Approximate town-centre locations · Node size scales with book value (₹ Cr)
          </p>
        </div>

        {/* 1-click Hub Dependency Highlight */}
        <div
          role="group"
          aria-label="Highlight clinker hub dependency"
          className="inline-flex items-center p-1 bg-[#F1F3F4] rounded-lg"
        >
          {(
            [
              { id: 'none', label: 'All Plants' },
              { id: 'P01', label: 'P01 Hub (27%)' },
              { id: 'P06', label: 'P06 Hub (25%)' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChangeHub(opt.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                highlightedHub === opt.id
                  ? opt.id === 'none'
                    ? 'bg-white text-[#202124] shadow-xs'
                    : 'bg-[#1A73E8] text-white shadow-xs'
                  : 'text-[#5F6368] hover:text-[#202124]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hub Dependency Callout (Direct vs Dependent clearly separated — never double-counted) */}
      {highlightedHub !== 'none' && byId[highlightedHub] && (
        <div className="mb-3 px-3.5 py-2.5 rounded-lg bg-[#E8F0FE] border border-[#AECBFA] text-xs text-[#174EA6] flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="font-semibold">
              {byId[highlightedHub].plant.plantId} {byId[highlightedHub].plant.shortName} hub:
            </strong>{' '}
            Direct {formatInrCr(byId[highlightedHub].directRevenueCr)} · Dependent (
            {byId[highlightedHub].plant.downstreamPlantIds.join(', ')}){' '}
            {formatInrCr(byId[highlightedHub].dependentRevenueCr)}
          </span>
          <span className="font-mono font-semibold tabular-nums">
            {formatInrCr(
              byId[highlightedHub].directRevenueCr +
                byId[highlightedHub].dependentRevenueCr
            )}{' '}
            network footprint (
            {(
              ((byId[highlightedHub].directRevenueCr +
                byId[highlightedHub].dependentRevenueCr) /
                9658) *
              100
            ).toFixed(1)}
            % of group)
          </span>
        </div>
      )}

      {/* Map SVG Container — Exact Attached HD India Map Preserved Intact */}
      <div className="relative flex-1 min-h-[360px] flex items-center justify-center bg-[#F8F9FA] rounded-lg border border-[#E8EAED] overflow-hidden pb-10 sm:pb-8">
        <svg
          viewBox={VIEW_BOX}
          className="w-full h-full max-h-[460px] select-none"
          role="img"
          aria-label="Official map of India showing 9 Nimbus Cement plants and directed clinker flows"
        >
          {/* Exact Official India Map Border & State Boundaries */}
          <image
            href="/assets/aistudio/India_Map_HD_1e02eddd.PNG"
            x="0"
            y="0"
            width="960"
            height="1358"
            preserveAspectRatio="xMidYMid meet"
            opacity="0.52"
            style={{ mixBlendMode: 'multiply' }}
          />

          {/* Directed Clinker Supply Corridors */}
          {SUPPLY_ROUTES.map((route) => {
            const fromV = byId[route.from];
            const toV = byId[route.to];
            if (!fromV || !toV) return null;
            const [x1, y1] = getPlantPos(
              fromV.plant.plantId,
              fromV.plant.latitude,
              fromV.plant.longitude
            );
            const [x2, y2] = getPlantPos(
              toV.plant.plantId,
              toV.plant.latitude,
              toV.plant.longitude
            );
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - route.curveLift;
            const isHubActive = highlightedHub === route.from;
            const isRelated =
              isHubActive || activeId === route.from || activeId === route.to;

            return (
              <g key={`${route.from}-${route.to}`}>
                <path
                  d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                  fill="none"
                  stroke={isHubActive ? '#1A73E8' : isRelated ? '#1A73E8' : '#5F6368'}
                  strokeWidth={isHubActive ? 4.8 : isRelated ? 3.8 : 2.6}
                  strokeDasharray="8 6"
                  opacity={highlightedHub !== 'none' && !isHubActive ? 0.28 : 1}
                />
                <text
                  x={mx}
                  y={my - 4}
                  textAnchor="middle"
                  fontSize="16.5"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight="600"
                  fill={isHubActive ? '#174EA6' : '#3C4043'}
                  stroke="#F8F9FA"
                  strokeWidth="5"
                  paintOrder="stroke"
                  opacity={highlightedHub !== 'none' && !isHubActive ? 0.3 : 1}
                >
                  {route.mode}
                </text>
              </g>
            );
          })}

          {/* Plant Nodes */}
          {views.map((v) => {
            const [cx, cy] = getPlantPos(
              v.plant.plantId,
              v.plant.latitude,
              v.plant.longitude
            );
            const style = getLevelStyles(v.overallPhysicalLevel);
            const isSelected = v.plant.plantId === activeId;
            const inHub = isInHighlightedHub(v.plant.plantId);
            const dimmed = highlightedHub !== 'none' && !inHub;
            const radius = 10 + (v.plant.assetValueInrCr / 3200) * 11;
            const offset = LABEL_OFFSETS[v.plant.plantId] || {
              dx: 18,
              dy: 6,
              anchor: 'start',
            };

            return (
              <g
                key={v.plant.plantId}
                className="cursor-pointer"
                opacity={dimmed ? 0.32 : 1}
                onMouseEnter={() => setHoveredId(v.plant.plantId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onSelectPlant(v.plant.plantId)}
              >
                {(isSelected || inHub) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 9}
                    fill="rgba(26,115,232,0.16)"
                    stroke="#1A73E8"
                    strokeWidth="2.8"
                  />
                )}

                {v.plant.plantType === 'Integrated' ? (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={style.dot}
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                  />
                ) : (
                  <rect
                    x={cx - radius * 0.85}
                    y={cy - radius * 0.85}
                    width={radius * 1.7}
                    height={radius * 1.7}
                    transform={`rotate(45 ${cx} ${cy})`}
                    fill={style.dot}
                    stroke="#FFFFFF"
                    strokeWidth="3.5"
                  />
                )}

                <text
                  x={cx + offset.dx}
                  y={cy + offset.dy}
                  textAnchor={offset.anchor}
                  fontSize="19.5"
                  fontFamily="DM Sans, sans-serif"
                  fontWeight={isSelected ? 700 : 600}
                  fill={isSelected ? '#1A73E8' : '#202124'}
                  stroke="#F8F9FA"
                  strokeWidth="6"
                  paintOrder="stroke"
                >
                  {v.plant.plantId} {v.plant.shortName}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Minimal legend bottom-left */}
        <div className="absolute bottom-2.5 left-3 right-3 sm:right-auto flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-[#5F6368] bg-white/95 px-2.5 py-1.5 rounded-md border border-[#E8EAED]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D93025] inline-block" />
            High Exposure
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E37400] inline-block" />
            Moderate
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#188038] inline-block" />
            Low
          </span>
          <span className="text-[#80868B]">·</span>
          <span>Circle: Kiln · Diamond: Grinding</span>
        </div>
      </div>

      {/* Selected plant quick inspection footer */}
      {activeView && (
        <div className="mt-4 pt-3.5 border-t border-[#E8EAED] flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono font-semibold text-[#202124]">
                {activeView.plant.plantId}
              </span>
              <span className="font-semibold text-[#202124]">
                {activeView.plant.plantName}
              </span>
              <span className="text-[#80868B]">·</span>
              <span className="text-xs text-[#5F6368]">
                Direct {formatInrCr(activeView.directRevenueCr)}
                {activeView.dependentRevenueCr > 0
                  ? ` + Dependent ${formatInrCr(activeView.dependentRevenueCr)}`
                  : ''}
              </span>
            </div>
            <p className="text-xs text-[#5F6368] mt-0.5 truncate">
              {activeView.templateSummary}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onInspectPlant(activeView.plant.plantId)}
            className="px-3 py-1.5 text-xs font-medium text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Trace Plant Data
          </button>
        </div>
      )}
    </div>
  );
}
