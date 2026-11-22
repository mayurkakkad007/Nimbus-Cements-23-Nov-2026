import {
  ExposureLevel,
  PlantPhysicalView,
  PlantRecord,
  TimeWindow,
} from '../types/climate';

const LEVEL_RANK: Record<ExposureLevel, number> = {
  High: 3,
  Moderate: 2,
  Low: 1,
};

export function formatInrCr(value: number, decimals = 0): string {
  return `₹${value.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} Cr`;
}

export function getLevelStyles(level: ExposureLevel): {
  text: string;
  bgSoft: string;
  dot: string;
} {
  if (level === 'High') {
    return { text: 'text-[#C5221F]', bgSoft: 'bg-[#FCE8E6]', dot: '#D93025' };
  }
  if (level === 'Moderate') {
    return { text: 'text-[#B06000]', bgSoft: 'bg-[#FEF7E0]', dot: '#E37400' };
  }
  return { text: 'text-[#137333]', bgSoft: 'bg-[#E6F4EA]', dot: '#188038' };
}

/**
 * Pure, transparent Physical Risk computation (NO black-box composite numbers!).
 * - Strictly separates Direct Revenue from Downstream Dependent Revenue (never double-counted).
 * - Linearly interpolates WRI Aqueduct 2040 values as midpoint of 2030 & 2050.
 * - Applies explicit Water-Source Overrides for Desalinated (P07), Municipal (P08), and Canal (P06).
 * - Generates deterministic template prose from numbers (zero LLM hallucination risk).
 */
export function computePhysicalViews(
  plants: PlantRecord[],
  window: TimeWindow
): PlantPhysicalView[] {
  const downstreamRev: Record<string, number> = {};
  const downstreamAsset: Record<string, number> = {};

  for (const p of plants) {
    if (p.upstreamPlantId) {
      downstreamRev[p.upstreamPlantId] =
        (downstreamRev[p.upstreamPlantId] || 0) + p.revenueInrCr;
      downstreamAsset[p.upstreamPlantId] =
        (downstreamAsset[p.upstreamPlantId] || 0) + p.assetValueInrCr;
    }
  }

  return plants.map((plant) => {
    const h = plant.hazards;
    const utilizationPct = (plant.cementOutputMt / plant.cementCapacityMtpa) * 100;
    const clinkerConsumedMt =
      plant.plantType === 'Integrated'
        ? Math.max(0, plant.clinkerProducedMt - plant.clinkerShippedMt)
        : plant.clinkerReceivedMt;
    const clinkerFactor =
      plant.cementOutputMt > 0 ? clinkerConsumedMt / plant.cementOutputMt : 0;

    // Linear interpolation for 2040 between WRI Aqueduct 4.0 2030 and 2050 projections
    const aqueductBws2040Interp = +((h.aqueductBws2030 + h.aqueductBws2050) / 2).toFixed(2);
    const aqueductRfr2040Interp = +((h.aqueductRfr2030 + h.aqueductRfr2050) / 2).toFixed(2);

    const activeHeat40 = window === 'today' ? h.heat40Today : h.heat40_2040;
    const activeHeat45 = window === 'today' ? h.heat45Today : h.heat45_2040;
    const activeWettestMm = window === 'today' ? h.wettestDayMmToday : h.wettestDayMm2040;
    const activeDays100mm = window === 'today' ? h.days100mmToday : h.days100mm2040;
    const activeDrySpell = window === 'today' ? h.drySpellDaysToday : h.drySpellDays2040;
    const activeRawBws = window === 'today' ? h.aqueductBwsToday : aqueductBws2040Interp;
    const activeRfr = window === 'today' ? h.aqueductRfrToday : aqueductRfr2040Interp;

    // Transparent, threshold-based hazard ratings (clearly documented in Assumptions ASM-03)
    const heatLevel: ExposureLevel =
      activeHeat40.mid >= 65 || activeHeat45.mid >= 12
        ? 'High'
        : activeHeat40.mid >= 42 || activeHeat45.mid >= 4
          ? 'Moderate'
          : 'Low';

    const rainFloodLevel: ExposureLevel =
      activeRfr >= 3.5 || activeDays100mm >= 2.5 || activeWettestMm.mid >= 120
        ? 'High'
        : activeRfr >= 2.2 || activeDays100mm >= 1.2 || activeWettestMm.mid >= 95
          ? 'Moderate'
          : 'Low';

    const waterDroughtLevel: ExposureLevel =
      window === 'today' ? h.effectiveWaterLevelToday : h.effectiveWaterLevel2040;

    const coastalFlagLabel = plant.coastal ? 'Coastal (Flag only)' : 'Inland';

    const levels = [heatLevel, rainFloodLevel, waterDroughtLevel];
    const highHazardCount =
      levels.filter((l) => l === 'High').length + (plant.coastal ? 1 : 0);

    // Overall physical exposure tier: High if >=1 High hazard OR Coastal + Moderate rain/flood
    let overallPhysicalLevel: ExposureLevel = 'Low';
    if (
      levels.includes('High') ||
      (plant.coastal && (rainFloodLevel !== 'Low' || heatLevel !== 'Low'))
    ) {
      overallPhysicalLevel = 'High';
    } else if (levels.includes('Moderate') || plant.coastal) {
      overallPhysicalLevel = 'Moderate';
    }

    const directRevenueCr = plant.revenueInrCr;
    const dependentRevenueCr = downstreamRev[plant.plantId] || 0;
    const directAssetCr = plant.assetValueInrCr;
    const dependentAssetCr = downstreamAsset[plant.plantId] || 0;

    // Deterministic template sentence (ZERO LLM prose)
    const topHazards: string[] = [];
    if (heatLevel === 'High') topHazards.push(`extreme heat (${activeHeat40.low}–${activeHeat40.high}d ≥40°C)`);
    if (rainFloodLevel === 'High') topHazards.push(`extreme rain/flood (WRI rfr ${activeRfr.toFixed(1)}/5)`);
    if (waterDroughtLevel === 'High') {
      topHazards.push(
        h.waterOverrideApplied
          ? `${h.waterOverrideLabel?.toLowerCase()}`
          : `water stress (${plant.waterSource}, WRI ${activeRawBws.toFixed(1)}/5)`
      );
    }
    if (plant.coastal) topHazards.push('coastal location flag');

    const hazardPhrase =
      topHazards.length > 0
        ? `Primary drivers: ${topHazards.join(' and ')}.`
        : `Moderate baseline across heat (${activeHeat40.mid}d ≥40°C) and rainfall (${activeWettestMm.mid} mm peak day).`;

    const networkPhrase =
      dependentRevenueCr > 0
        ? ` Direct ₹${directRevenueCr.toLocaleString('en-IN')} Cr + supports ₹${dependentRevenueCr.toLocaleString('en-IN')} Cr downstream (${plant.downstreamPlantIds.join(', ')}).`
        : plant.upstreamPlantId
          ? ` Depends on ${plant.upstreamPlantId} for 100% of clinker (${plant.clinkerReceivedMt.toFixed(2)} Mt/yr).`
          : '';

    const templateSummary = `${hazardPhrase}${networkPhrase}`;

    return {
      plant,
      utilizationPct,
      clinkerConsumedMt,
      clinkerFactor,
      directRevenueCr,
      dependentRevenueCr,
      directAssetCr,
      dependentAssetCr,
      aqueductBws2040Interp,
      aqueductRfr2040Interp,
      heatLevel,
      rainFloodLevel,
      waterDroughtLevel,
      coastalFlagLabel,
      overallPhysicalLevel,
      highHazardCount,
      templateSummary,
      activeHeat40,
      activeHeat45,
      activeWettestMm,
      activeDays100mm,
      activeDrySpell,
      activeRawBws,
      activeRfr,
    };
  });
}

export function sortViewsByPriority(views: PlantPhysicalView[]): PlantPhysicalView[] {
  return [...views].sort((a, b) => {
    const levelDiff =
      LEVEL_RANK[b.overallPhysicalLevel] - LEVEL_RANK[a.overallPhysicalLevel];
    if (levelDiff !== 0) return levelDiff;
    const countDiff = b.highHazardCount - a.highHazardCount;
    if (countDiff !== 0) return countDiff;
    return (
      b.directRevenueCr +
      b.dependentRevenueCr -
      (a.directRevenueCr + a.dependentRevenueCr)
    );
  });
}

/**
 * Generates an auditable CSV export of the 9-plant Physical Exposure Register.
 */
export function buildExposureCsv(
  views: PlantPhysicalView[],
  window: TimeWindow
): string {
  const headers = [
    'plant_id',
    'plant_name',
    'state',
    'plant_type',
    'window',
    'direct_revenue_inr_cr',
    'dependent_downstream_revenue_inr_cr_do_not_sum',
    'gross_block_book_value_inr_cr',
    'heat_days_ge_40c_range',
    'heat_days_ge_45c_range',
    'heat_level',
    'wettest_day_mm_range',
    'days_ge_100mm',
    'wri_rfr_0_to_5',
    'rain_flood_level',
    'water_source',
    'wri_bws_raw_0_to_5',
    'water_override_applied',
    'water_drought_level',
    'coastal_flag',
    'overall_physical_exposure',
  ];

  const rows = views.map((v) => [
    v.plant.plantId,
    `"${v.plant.plantName}"`,
    `"${v.plant.state}"`,
    `"${v.plant.plantType}"`,
    window === 'today' ? 'Today (2005-2025)' : '2040 (2030-2050)',
    v.directRevenueCr,
    v.dependentRevenueCr,
    v.directAssetCr,
    `"${v.activeHeat40.low}-${v.activeHeat40.high}"`,
    `"${v.activeHeat45.low}-${v.activeHeat45.high}"`,
    v.heatLevel,
    `"${v.activeWettestMm.low}-${v.activeWettestMm.high}"`,
    v.activeDays100mm,
    v.activeRfr.toFixed(2),
    v.rainFloodLevel,
    `"${v.plant.waterSource}"`,
    v.activeRawBws.toFixed(2),
    v.plant.hazards.waterOverrideApplied ? 'Yes' : 'No',
    v.waterDroughtLevel,
    v.plant.coastal ? 'Y (Flag only)' : 'N',
    v.overallPhysicalLevel,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
