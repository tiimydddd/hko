import {
  HK_DISTRICTS,
  type AqhiStationItem,
  type DailyForecastItem,
  type FlwResponse,
  type HistoricalClimateRow,
  type RainfallItem,
  type StationTempItem,
  type SwtItem,
  type WarningDetailItem,
  type WarningItem,
  type WeatherSnapshot,
} from '../types/weather';
import {
  buildImpactTimelineMatrix,
  buildMultiDayOutlook,
  buildTrackers,
  buildUnofficialAssessments,
  determineWeatherScene,
} from './weatherIntelligence';

const HKO_BASE = 'https://data.weather.gov.hk/weatherAPI/opendata';
const EPD_AQHI_URL = 'https://dashboard.data.gov.hk/api/aqhi-individual?format=json';
const CACHE_KEY = 'stca_hko_last_snapshot_v1';

interface RhrreadRaw {
  rainfall?: { data?: Array<{ unit?: string; place?: string; max?: number; min?: number; main?: string }> } | '';
  temperature?: { data?: Array<{ place?: string; value?: number; unit?: string }> } | '';
  humidity?: { data?: Array<{ unit?: string; value?: number; place?: string }> } | '';
  uvindex?: { data?: Array<{ place?: string; value?: number; desc?: string }> } | '' | null;
  updateTime?: string;
}

interface CachedHkoBundle {
  rhr: RhrreadRaw | null;
  warnings: Record<string, Partial<WarningItem>>;
  warningDetails: WarningDetailItem[];
  fndWeatherForecast: DailyForecastItem[];
  fndGeneralSituation?: string;
  flw: FlwResponse | null;
  swt: SwtItem[];
  aqhi: AqhiStationItem[];
  cachedAt: string;
}

function nowString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatIsoShort(raw: string): string {
  return raw.replace('T', ' ').split('+')[0].slice(0, 16);
}

function uvDescription(uv: number): string {
  if (uv <= 0.1) return '夜間 (0)';
  if (uv <= 2.9) return `低 (${uv})`;
  if (uv <= 5.9) return `中等 (${uv})`;
  if (uv <= 7.9) return `高 (${uv})`;
  if (uv <= 10.9) return `甚高 (${uv})`;
  return `極高 (${uv})`;
}

function aqhiRiskLabel(aqhi: number): string {
  if (aqhi <= 3) return '低 Low';
  if (aqhi <= 6) return '中 Moderate';
  if (aqhi === 7) return '高 High';
  if (aqhi <= 10) return '甚高 Very High';
  return '嚴重 Serious';
}

export function warningDisplayName(code: string): string {
  switch (code) {
    case 'WCOLD': return '寒冷天氣警告';
    case 'WHOT': return '酷熱天氣警告';
    case 'WFROST': return '霜凍警告';
    case 'WRAINA': return '黃色暴雨警告訊號';
    case 'WRAINR': return '紅色暴雨警告訊號';
    case 'WRAINB': return '黑色暴雨警告訊號';
    case 'WTS': return '雷暴警告';
    case 'WL': return '山泥傾瀉警告';
    case 'WFNTSA': return '新界北部水浸特別報告';
    case 'WMSGNL': return '強烈季候風訊號';
    case 'WFIREY':
    case 'WFIRER': return '火災危險警告';
    case 'TC1': return '一號戒備訊號';
    case 'TC3': return '三號強風訊號';
    case 'TC8NE':
    case 'TC8SE':
    case 'TC8NW':
    case 'TC8SW': return '八號烈風或暴風訊號';
    case 'TC9': return '九號烈風或暴風風力增強訊號';
    case 'TC10': return '十號颶風訊號';
    default: return code;
  }
}

export function computeEasTriggers(
  warnings: WarningItem[],
  currentTemp: number,
  threshold: number
): string[] {
  const triggers = warnings.map((w) => `${w.name} (${w.code})`);
  if (currentTemp <= threshold) {
    triggers.push(`低溫自動警報: ${currentTemp.toFixed(1)}°C ≤ ${threshold.toFixed(1)}°C`);
  }
  return triggers;
}

async function fetchJsonSafe<T>(url: string, timeoutMs = 12000): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

function parseWarningsMap(raw: unknown): Record<string, Partial<WarningItem>> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return raw as Record<string, Partial<WarningItem>>;
}

function parseAqhiList(raw: unknown): AqhiStationItem[] {
  if (!Array.isArray(raw)) return [];
  const items: AqhiStationItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const obj = entry as Record<string, unknown>;
    const station = String(obj.station ?? '').trim();
    const rawAqhi = obj.aqhi;
    let aqhi = 0;
    if (typeof rawAqhi === 'number') {
      aqhi = Math.trunc(rawAqhi);
    } else if (typeof rawAqhi === 'string') {
      if (rawAqhi.includes('+')) aqhi = 11;
      else aqhi = parseInt(rawAqhi, 10) || 0;
    }
    const risk = String(obj.health_risk ?? '').trim() || aqhiRiskLabel(aqhi);
    const pub = String(obj.publish_date ?? '').trim();
    if (station && aqhi > 0) {
      items.push({ station, aqhi, health_risk: risk, publish_date: pub });
    }
  }
  return items;
}

function mapBundleToSnapshot(
  bundle: CachedHkoBundle,
  selectedDistrict: string,
  tempThreshold: number,
  isOffline: boolean
): WeatherSnapshot {
  const rhr = bundle.rhr;
  const flw = bundle.flw;
  const swtList = (bundle.swt ?? []).filter((s) => s.desc?.trim());
  const warningDetails = bundle.warningDetails ?? [];

  const tempData =
    rhr?.temperature && typeof rhr.temperature === 'object' ? rhr.temperature.data ?? [] : [];
  const stations: StationTempItem[] = tempData
    .filter((t) => typeof t.value === 'number' && t.place)
    .map((t) => ({ place: t.place!, value: t.value!, unit: t.unit ?? 'C' }));

  const highest = stations.length
    ? stations.reduce((a, b) => (b.value > a.value ? b : a), stations[0])
    : null;
  const lowest = stations.length
    ? stations.reduce((a, b) => (b.value < a.value ? b : a), stations[0])
    : null;

  const districtObj = HK_DISTRICTS.find(
    (d) => d.districtTc === selectedDistrict || d.districtEn === selectedDistrict
  );
  const matchedStation = districtObj
    ? stations.find((st) =>
        districtObj.stationMatchKeywords.some((kw) =>
          st.place.toLowerCase().includes(kw.toLowerCase())
        )
      )
    : undefined;
  const hkoStation = stations.find(
    (st) => st.place.includes('香港天文台') || st.place.toLowerCase().includes('observatory')
  );
  const primaryStation = matchedStation ?? hkoStation ?? stations[0] ?? null;
  const currentTemp = primaryStation?.value ?? 22.0;

  const rainRaw =
    rhr?.rainfall && typeof rhr.rainfall === 'object' ? rhr.rainfall.data ?? [] : [];
  const rainList: RainfallItem[] = rainRaw
    .map((r) => ({
      unit: r.unit ?? 'mm',
      place: r.place ?? '',
      max: typeof r.max === 'number' ? r.max : 0,
      min: typeof r.min === 'number' ? r.min : null,
      main: r.main ?? 'FALSE',
    }))
    .sort((a, b) => b.max - a.max);
  const maxRainfall = rainList.length ? Math.max(...rainList.map((r) => r.max)) : 0.0;

  const humRaw =
    rhr?.humidity && typeof rhr.humidity === 'object' ? rhr.humidity.data ?? [] : [];
  const humidity = typeof humRaw[0]?.value === 'number' ? Math.trunc(humRaw[0].value) : 75;

  const uvFirst =
    rhr?.uvindex && typeof rhr.uvindex === 'object' ? rhr.uvindex.data?.[0] : undefined;
  const uvValue = typeof uvFirst?.value === 'number' ? uvFirst.value : 0.0;
  const uvDesc = uvFirst?.desc?.trim() || uvDescription(uvValue);

  const warnings: WarningItem[] = Object.entries(bundle.warnings ?? {})
    .map(([key, item]) => ({
      name: item.name?.trim() || warningDisplayName(key),
      code: item.code?.trim() || key,
      type: item.type ?? null,
      actionCode: item.actionCode ?? '',
      issueTime: item.issueTime ?? '',
      expireTime: item.expireTime ?? null,
      updateTime: item.updateTime ?? '',
    }))
    .filter((w) => w.actionCode.toUpperCase() !== 'CANCEL');

  const fndList = bundle.fndWeatherForecast ?? [];
  const aqhiList = bundle.aqhi ?? [];
  const maxAqhi = aqhiList.length ? Math.max(...aqhiList.map((a) => a.aqhi)) : 3;

  const weatherScene = determineWeatherScene(warnings, currentTemp, humidity, maxRainfall);
  const trackers = buildTrackers(warnings, flw, swtList, fndList, currentTemp, maxRainfall);
  const unofficialAssessments = buildUnofficialAssessments(
    warnings,
    fndList,
    currentTemp,
    humidity,
    maxRainfall,
    flw
  );
  const easTriggers = computeEasTriggers(warnings, currentTemp, tempThreshold);
  const impactTimeline = buildImpactTimelineMatrix(
    warnings,
    fndList,
    flw,
    currentTemp,
    maxRainfall,
    swtList
  );
  const multiDayOutlook = buildMultiDayOutlook(
    warnings,
    flw,
    fndList,
    currentTemp,
    humidity,
    maxRainfall
  );

  const rawTime = rhr?.updateTime?.trim() || bundle.cachedAt?.trim() || nowString();
  const updatedAtText = isOffline ? `${formatIsoShort(rawTime)} (離線快取)` : formatIsoShort(rawTime);

  return {
    updatedAtText,
    isOfflineFallback: isOffline,
    currentTemp,
    nearestStationName: primaryStation?.place ?? '香港天文台',
    selectedDistrict,
    highestStation: highest,
    lowestStation: lowest,
    allStations: stations,
    rainfallStations: rainList,
    humidityPercent: humidity,
    uvIndex: uvValue,
    uvDesc,
    aqhiStations: aqhiList,
    maxAqhi,
    activeWarnings: warnings,
    warningDetails,
    specialWeatherTips: swtList,
    localForecast: flw,
    nineDayForecast: fndList,
    generalSituation: flw?.generalSituation?.trim() || bundle.fndGeneralSituation?.trim() || '',
    weatherScene,
    trackers,
    unofficialAssessments,
    easTriggers,
    impactTimeline,
    multiDayOutlook,
  };
}

export async function fetchLiveWeather(
  selectedDistrict: string,
  tempThreshold: number
): Promise<WeatherSnapshot> {
  try {
    const [rhr, warnRaw, warnInfo, fnd, flw, swt, aqhiRaw] = await Promise.all([
      fetchJsonSafe<RhrreadRaw>(`${HKO_BASE}/weather.php?dataType=rhrread&lang=tc`),
      fetchJsonSafe<unknown>(`${HKO_BASE}/warnsum.php?lang=tc`),
      fetchJsonSafe<{ details?: WarningDetailItem[] }>(`${HKO_BASE}/warningInfo.php?lang=tc`),
      fetchJsonSafe<{ generalSituation?: string; weatherForecast?: DailyForecastItem[] }>(
        `${HKO_BASE}/weather.php?dataType=fnd&lang=tc`
      ),
      fetchJsonSafe<FlwResponse>(`${HKO_BASE}/weather.php?dataType=flw&lang=tc`),
      fetchJsonSafe<{ swt?: SwtItem[] }>(`${HKO_BASE}/weather.php?dataType=swt&lang=tc`),
      fetchJsonSafe<unknown>(EPD_AQHI_URL),
    ]);

    if (!rhr && !fnd) {
      throw new Error('無法連接香港天文台伺服器');
    }

    const bundle: CachedHkoBundle = {
      rhr,
      warnings: parseWarningsMap(warnRaw),
      warningDetails: warnInfo?.details ?? [],
      fndWeatherForecast: fnd?.weatherForecast ?? [],
      fndGeneralSituation: fnd?.generalSituation,
      flw,
      swt: swt?.swt ?? [],
      aqhi: parseAqhiList(aqhiRaw),
      cachedAt: nowString(),
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(bundle));
    } catch {
      // ignore storage quota errors
    }

    return mapBundleToSnapshot(bundle, selectedDistrict, tempThreshold, false);
  } catch (err) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const parsed = JSON.parse(cachedRaw) as CachedHkoBundle;
        return mapBundleToSnapshot(parsed, selectedDistrict, tempThreshold, true);
      }
    } catch {
      // ignore cache parse errors
    }
    throw err instanceof Error ? err : new Error('無法取得香港天文台數據');
  }
}

export async function fetchHistoricalClimate(
  dataType: 'CLMTEMP' | 'CLMRAIN',
  stationCode: string,
  year: number | null,
  month: number | null
): Promise<HistoricalClimateRow[]> {
  const params = new URLSearchParams({
    dataType,
    station: stationCode,
    rformat: 'json',
    lang: 'tc',
  });
  if (year !== null) params.set('year', String(year));
  if (month !== null) params.set('month', String(month));

  const res = await fetch(`${HKO_BASE}/opendata.php?${params.toString()}`);
  if (!res.ok) throw new Error(`HKO HTTP ${res.status}`);
  const table = (await res.json()) as { data?: Array<Array<string | null>> };
  const dataRows = table.data ?? [];
  const start = Math.max(0, dataRows.length - 60);
  const rows: HistoricalClimateRow[] = [];

  for (let i = dataRows.length - 1; i >= start; i--) {
    const arr = dataRows[i];
    if (!arr || arr.length < 4) continue;
    const y = arr[0] ?? '';
    const m = String(arr[1] ?? '').padStart(2, '0');
    const d = String(arr[2] ?? '').padStart(2, '0');
    const valStr = String(arr[3] ?? '');
    const comp = String(arr[4] ?? '').trim() || 'C';
    const numVal = Number(valStr);
    if (Number.isNaN(numVal)) continue;
    rows.push({
      date: `${y}-${m}-${d}`,
      value: numVal,
      completeness: comp,
      station: stationCode,
      metricLabel: dataType === 'CLMRAIN' ? '日雨量 (mm)' : '平均氣溫 (°C)',
    });
  }
  return rows;
}

export function buildSnapshotFromSmsPacket(
  rawSms: string,
  selectedDistrict: string,
  tempThreshold: number
): WeatherSnapshot {
  const parts = rawSms.trim().split('|');
  if (!parts.some((p) => p.startsWith('T:'))) {
    throw new Error('SMS 格式不符，請輸入如 STCA|HKO|T:14.2|RH:78|W:WCOLD|RAIN:0');
  }

  let temp = 20.0;
  let rh = 75;
  let rain = 0.0;
  let uv = 1.0;
  let aqhi = 3;
  let warnCodes: string[] = [];
  let maxStation: StationTempItem | null = null;
  let minStation: StationTempItem | null = null;
  let stationName = selectedDistrict;

  for (const part of parts) {
    if (part.startsWith('DIST:')) stationName = part.slice(5);
    else if (part.startsWith('T:')) temp = parseFloat(part.slice(2)) || temp;
    else if (part.startsWith('RH:')) rh = parseInt(part.slice(3), 10) || rh;
    else if (part.startsWith('RAIN:')) rain = parseFloat(part.slice(5)) || rain;
    else if (part.startsWith('UV:')) uv = parseFloat(part.slice(3)) || uv;
    else if (part.startsWith('AQHI:')) aqhi = parseInt(part.slice(5), 10) || aqhi;
    else if (part.startsWith('W:')) {
      warnCodes = part
        .slice(2)
        .split(',')
        .map((c) => c.trim().toUpperCase())
        .filter((c) => c.length > 0 && c !== 'NONE');
    } else if (part.startsWith('MAX:')) {
      const sub = part.slice(4).split('@');
      const v = parseFloat(sub[0] ?? '');
      if (!Number.isNaN(v)) maxStation = { place: sub[1] ?? '最高站', value: v, unit: 'C' };
    } else if (part.startsWith('MIN:')) {
      const sub = part.slice(4).split('@');
      const v = parseFloat(sub[0] ?? '');
      if (!Number.isNaN(v)) minStation = { place: sub[1] ?? '最低站', value: v, unit: 'C' };
    }
  }

  const now = nowString();
  const warnings: WarningItem[] = warnCodes.map((code) => ({
    name: warningDisplayName(code),
    code,
    actionCode: 'ISSUE',
    issueTime: now,
    updateTime: now,
  }));

  const stations: StationTempItem[] = [
    { place: stationName, value: temp, unit: 'C' },
    ...(maxStation ? [maxStation] : []),
    ...(minStation ? [minStation] : []),
  ];

  const weatherScene = determineWeatherScene(warnings, temp, rh, rain);
  const trackers = buildTrackers(warnings, null, [], [], temp, rain);
  const unofficialAssessments = buildUnofficialAssessments(warnings, [], temp, rh, rain, null);
  const easTriggers = computeEasTriggers(warnings, temp, tempThreshold);
  const impactTimeline = buildImpactTimelineMatrix(warnings, [], null, temp, rain);
  const multiDayOutlook = buildMultiDayOutlook(warnings, null, [], temp, rh, rain);

  const highestStation =
    maxStation ?? stations.reduce((a, b) => (b.value > a.value ? b : a), stations[0]);
  const lowestStation =
    minStation ?? stations.reduce((a, b) => (b.value < a.value ? b : a), stations[0]);

  return {
    updatedAtText: `${now} (SMS 離線解碼)`,
    isOfflineFallback: true,
    isSmsDecoded: true,
    currentTemp: temp,
    nearestStationName: stationName,
    selectedDistrict,
    highestStation,
    lowestStation,
    allStations: stations,
    rainfallStations: [{ unit: 'mm', place: selectedDistrict, max: rain, min: rain, main: 'TRUE' }],
    humidityPercent: rh,
    uvIndex: uv,
    uvDesc: uvDescription(uv),
    aqhiStations: [
      { station: selectedDistrict, aqhi, health_risk: aqhiRiskLabel(aqhi), publish_date: now },
    ],
    maxAqhi: aqhi,
    activeWarnings: warnings,
    warningDetails: [],
    specialWeatherTips: [],
    localForecast: null,
    nineDayForecast: [],
    generalSituation: '已透過緊急 SMS 離線封包更新氣象遙測。',
    weatherScene,
    trackers,
    unofficialAssessments,
    easTriggers,
    impactTimeline,
    multiDayOutlook,
  };
}
