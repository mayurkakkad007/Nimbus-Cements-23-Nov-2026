export type PlantType = 'Integrated' | 'Grinding unit';

export type WaterSourceCategory =
  | 'Groundwater'
  | 'Canal'
  | 'River'
  | 'Reservoir'
  | 'Municipal'
  | 'Desalinated';

export type TimeWindow = 'today' | '2040';

export type ViewRole = 'sustainability' | 'board' | 'auditor';

export type NavTab = 'overview' | 'exposure' | 'plants' | 'checks';

export type ExposureLevel = 'High' | 'Moderate' | 'Low';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low' | 'Flag only';

export type DataTag =
  | 'Verified CSV'
  | 'CMIP6 Modelled'
  | 'WRI Aqueduct 4.0'
  | 'Interpolated 2040'
  | 'Water Override'
  | 'Illustrative'
  | 'Historical Proxy';

export type SimulatedStateMode = 'normal' | 'stale' | 'error';

export interface HazardRange {
  low: number;
  mid: number;
  high: number;
}

export interface PhysicalHazardProfile {
  /** Extreme Heat — Days/year with Tmax >= 40°C (CMIP6 multi-model range) */
  heat40Today: HazardRange;
  heat40_2040: HazardRange;
  /** Extreme Heat — Days/year with Tmax >= 45°C (CMIP6 multi-model range) */
  heat45Today: HazardRange;
  heat45_2040: HazardRange;

  /** Extreme Rain — Wettest single day/year (mm/day) */
  wettestDayMmToday: HazardRange;
  wettestDayMm2040: HazardRange;
  /** Extreme Rain — Days/year >= 100 mm */
  days100mmToday: number;
  days100mm2040: number;

  /** WRI Aqueduct 4.0 Riverine Flood Risk (rfr, 0–5 scale: baseline, 2030, 2050 -> linear 2040) */
  aqueductRfrToday: number;
  aqueductRfr2030: number;
  aqueductRfr2050: number;
  /** Open-Meteo GloFAS historical peak river discharge (1984-present context only; NO 2040 projection) */
  glofasHistoricalPeakM3s: number;

  /** Drought — Longest consecutive dry spell (days/year, <1mm) */
  drySpellDaysToday: HazardRange;
  drySpellDays2040: HazardRange;

  /** WRI Aqueduct 4.0 Baseline Water Stress (bws, 0–5 scale: today, 2030, 2050 -> linear 2040) */
  aqueductBwsToday: number;
  aqueductBws2030: number;
  aqueductBws2050: number;
  /** WRI Aqueduct 4.0 Drought Risk (drr, 0–1 scale) */
  aqueductDrrToday: number;

  /** Water Source Override (for Desalinated P07, Municipal P08, Canal P06) */
  waterOverrideApplied: boolean;
  waterOverrideLabel?: string;
  waterOverrideExplanation?: string;
  effectiveWaterLevelToday: ExposureLevel;
  effectiveWaterLevel2040: ExposureLevel;

  /** Coastal Flag (cyclone, storm surge & SLR NOT quantified in open v1 datasets) */
  aqueductCfrNote: string;
  basinName: string;
  siteContext: string;
}

export interface PlantRecord {
  plantId: string;
  plantName: string;
  shortName: string;
  town: string;
  state: string;
  latitude: number;
  longitude: number;
  plantType: PlantType;
  cementCapacityMtpa: number;
  cementOutputMt: number;
  clinkerProducedMt: number;
  clinkerShippedMt: number;
  clinkerReceivedMt: number;
  upstreamPlantId?: string;
  downstreamPlantIds: string[];
  transportNote?: string;
  scope1Co2Kt: number;
  waterSource: string;
  waterCategory: WaterSourceCategory;
  coastal: boolean;
  /** Book value (gross block) in INR Crore — understates replacement cost */
  assetValueInrCr: number;
  revenueInrCr: number;
  employees: number;
  notes: string;
  kilnYear?: number;
  /** Specific data audit tags for this plant */
  auditFlags: string[];
  hazards: PhysicalHazardProfile;
}

export interface LiveOpenMeteoCheck {
  status: 'idle' | 'loading' | 'success' | 'error';
  fetchedAt?: string;
  climateBaselineUrl?: string;
  climate2040Url?: string;
  floodUrl?: string;
  todayDays40?: HazardRange;
  futureDays40?: HazardRange;
  todayDays45?: HazardRange;
  futureDays45?: HazardRange;
  todayWettestMm?: number;
  futureWettestMm?: number;
  todayDays100mm?: number;
  futureDays100mm?: number;
  todayDrySpell?: number;
  futureDrySpell?: number;
  glofasMaxRecentM3s?: number;
  modelsUsed?: string[];
  errorMessage?: string;
}

export interface PlantPhysicalView {
  plant: PlantRecord;
  utilizationPct: number;
  clinkerConsumedMt: number;
  clinkerFactor: number;
  /** Direct revenue booked at this plant only (never includes downstream) */
  directRevenueCr: number;
  /** Downstream revenue dependent on this plant's clinker (0 for non-hubs; NEVER summed into group total) */
  dependentRevenueCr: number;
  /** Direct Gross Block (book value) */
  directAssetCr: number;
  /** Downstream Gross Block dependent on this plant's clinker */
  dependentAssetCr: number;
  /** Interpolated 2040 WRI Aqueduct BWS (midpoint of 2030 & 2050) */
  aqueductBws2040Interp: number;
  /** Interpolated 2040 WRI Aqueduct RFR (midpoint of 2030 & 2050) */
  aqueductRfr2040Interp: number;
  /** Active hazard ratings for chosen window ('today' | '2040') */
  heatLevel: ExposureLevel;
  rainFloodLevel: ExposureLevel;
  waterDroughtLevel: ExposureLevel;
  coastalFlagLabel: string;
  /** Overall physical exposure tier (driven by worst / multi-hazard clustering, NOT black-box score) */
  overallPhysicalLevel: ExposureLevel;
  highHazardCount: number;
  /** Key 1-line deterministic summary built strictly from verified numbers */
  templateSummary: string;
  /** Active window heat range (>=40°C) */
  activeHeat40: HazardRange;
  /** Active window extreme heat range (>=45°C) */
  activeHeat45: HazardRange;
  /** Active wettest day range (mm) */
  activeWettestMm: HazardRange;
  /** Active days >= 100mm */
  activeDays100mm: number;
  /** Active longest dry spell range */
  activeDrySpell: HazardRange;
  /** Active Aqueduct water stress (raw basin value before any override) */
  activeRawBws: number;
  /** Active Aqueduct riverine flood risk */
  activeRfr: number;
}

export interface DataValidationCheck {
  id: string;
  status: 'Passed' | 'Trap Flagged' | 'Verify' | 'Missing Field' | 'Override Applied';
  title: string;
  affectedPlants: string[];
  whyItMatters: string;
  howV1HandlesIt: string;
  proof: string;
}

export interface AssumptionEntry {
  id: string;
  topic: string;
  assumption: string;
  tag: DataTag;
  impactIfChanged: string;
}
