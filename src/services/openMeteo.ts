import { HazardRange, LiveOpenMeteoCheck, PlantRecord } from '../types/climate';

/**
 * Queries real, free, no-key Open-Meteo Climate API (CMIP6) for:
 * - "Today" window: 2005-01-01 to 2025-12-31
 * - "2040" window:  2030-01-01 to 2050-12-31
 * using the same CMIP6 models for both windows so model bias cancels out.
 * Also queries Open-Meteo Flood API (GloFAS) strictly for historical peak-flow context.
 */
export async function fetchLiveOpenMeteoPhysical(
  plant: PlantRecord
): Promise<LiveOpenMeteoCheck> {
  const lat = plant.latitude.toFixed(4);
  const lon = plant.longitude.toFixed(4);
  const models = 'EC_Earth3P_HR,MRI_AGCM3_2_S,CMCC_CM2_VHR4';

  const climateBaselineUrl = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&start_date=2005-01-01&end_date=2025-12-31&models=${models}&daily=temperature_2m_max,precipitation_sum`;
  const climate2040Url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&start_date=2030-01-01&end_date=2050-12-31&models=${models}&daily=temperature_2m_max,precipitation_sum`;
  const floodUrl = `https://flood-api.open-meteo.com/v1/flood?latitude=${lat}&longitude=${lon}&daily=river_discharge&past_days=92&forecast_days=92`;

  try {
    const [baseRes, futRes, floodRes] = await Promise.all([
      fetch(climateBaselineUrl),
      fetch(climate2040Url),
      fetch(floodUrl),
    ]);

    if (!baseRes.ok || !futRes.ok) {
      throw new Error(`Open-Meteo Climate API returned HTTP ${baseRes.status}/${futRes.status}`);
    }

    const baseJson = await baseRes.json();
    const futJson = await futRes.json();
    const floodJson = floodRes.ok ? await floodRes.json() : null;

    const analyzeWindow = (daily: Record<string, (number | null)[]>) => {
      const tempKeys = Object.keys(daily).filter((k) => k.startsWith('temperature_2m_max'));
      const rainKeys = Object.keys(daily).filter((k) => k.startsWith('precipitation_sum'));

      const perModelDays40: number[] = [];
      const perModelDays45: number[] = [];

      for (const k of tempKeys) {
        const vals = (daily[k] || []).filter((v): v is number => typeof v === 'number');
        if (vals.length === 0) continue;
        const years = Math.max(1, vals.length / 365.25);
        perModelDays40.push(Math.round(vals.filter((t) => t >= 40).length / years));
        perModelDays45.push(Math.round(vals.filter((t) => t >= 45).length / years));
      }

      const toRange = (arr: number[]): HazardRange => {
        if (arr.length === 0) return { low: 0, mid: 0, high: 0 };
        const low = Math.min(...arr);
        const high = Math.max(...arr);
        const mid = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
        return { low, mid, high };
      };

      let wettestSum = 0;
      let days100Sum = 0;
      let drySpellSum = 0;
      let rainModels = 0;

      for (const k of rainKeys) {
        const vals = (daily[k] || []).filter((v): v is number => typeof v === 'number');
        if (vals.length === 0) continue;
        rainModels++;
        const years = Math.max(1, vals.length / 365.25);
        const chunkLen = Math.max(1, Math.floor(vals.length / Math.round(years)));
        let annualMaxSum = 0;
        let annualDryMaxSum = 0;
        let yrCount = 0;

        for (let i = 0; i < vals.length; i += chunkLen) {
          const slice = vals.slice(i, i + chunkLen);
          if (slice.length < 180) continue;
          yrCount++;
          annualMaxSum += Math.max(...slice);

          let curDry = 0;
          let maxDry = 0;
          for (const r of slice) {
            if (r < 1) {
              curDry++;
              if (curDry > maxDry) maxDry = curDry;
            } else {
              curDry = 0;
            }
          }
          annualDryMaxSum += maxDry;
        }

        if (yrCount > 0) {
          wettestSum += annualMaxSum / yrCount;
          drySpellSum += annualDryMaxSum / yrCount;
        }
        days100Sum += vals.filter((r) => r >= 100).length / years;
      }

      return {
        days40: toRange(perModelDays40),
        days45: toRange(perModelDays45),
        wettestMm: rainModels > 0 ? Math.round(wettestSum / rainModels) : 0,
        days100mm: rainModels > 0 ? +(days100Sum / rainModels).toFixed(1) : 0,
        drySpell: rainModels > 0 ? Math.round(drySpellSum / rainModels) : 0,
      };
    };

    const baseStats = analyzeWindow(baseJson.daily || {});
    const futStats = analyzeWindow(futJson.daily || {});

    let glofasMax = 0;
    if (floodJson?.daily?.river_discharge) {
      const vals = (floodJson.daily.river_discharge as (number | null)[]).filter(
        (v): v is number => typeof v === 'number'
      );
      if (vals.length > 0) {
        glofasMax = Math.round(Math.max(...vals) * 10) / 10;
      }
    }

    return {
      status: 'success',
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      climateBaselineUrl,
      climate2040Url,
      floodUrl,
      todayDays40: baseStats.days40,
      futureDays40: futStats.days40,
      todayDays45: baseStats.days45,
      futureDays45: futStats.days45,
      todayWettestMm: baseStats.wettestMm,
      futureWettestMm: futStats.wettestMm,
      todayDays100mm: baseStats.days100mm,
      futureDays100mm: futStats.days100mm,
      todayDrySpell: baseStats.drySpell,
      futureDrySpell: futStats.drySpell,
      glofasMaxRecentM3s: glofasMax,
      modelsUsed: ['EC_Earth3P_HR', 'MRI_AGCM3_2_S', 'CMCC_CM2_VHR4'],
    };
  } catch (err) {
    return {
      status: 'error',
      climateBaselineUrl,
      climate2040Url,
      floodUrl,
      errorMessage:
        err instanceof Error
          ? err.message
          : 'Unable to reach Open-Meteo from browser; showing pre-calibrated CMIP6 reference ranges.',
    };
  }
}
