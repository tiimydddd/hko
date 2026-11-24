import type {
  DailyForecastItem,
  FlwResponse,
  ImpactTimeColumn,
  ImpactTimelineMatrix,
  ImpactTimelineRow,
  MultiDayOutlookForecast,
  ProbabilityTierId,
  ProbabilityTierInfo,
  RegionalOverlayMode,
  SwtItem,
  UnofficialWarningAssessment,
  WarningItem,
  WeatherSceneId,
  WeatherSceneInfo,
  WeatherSystemTracker,
} from '../types/weather';

export const WEATHER_SCENES: Record<WeatherSceneId, WeatherSceneInfo> = {
  CLEAR: {
    id: 'CLEAR',
    titleTc: '晴朗 / 穩定天色',
    subtitleTc: '暫無極端警告觸發，主畫面維持標準觀測模式',
    gradientColors: ['#0A2540', '#134B7A', '#1E6FA8'],
    accentColor: '#38BDF8',
  },
  COLD: {
    id: 'COLD',
    titleTc: '寒冷 / 冷鋒壓境',
    subtitleTc: '氣溫顯著下降或寒冷天氣警告生效',
    gradientColors: ['#071A2F', '#0E385C', '#1E5B85'],
    accentColor: '#7DD3FC',
  },
  FROST: {
    id: 'FROST',
    titleTc: '霜凍警告生效',
    subtitleTc: '新界及高地地面結霜風險',
    gradientColors: ['#131D38', '#283C66', '#476391'],
    accentColor: '#BAE6FD',
  },
  RAIN_AMBER: {
    id: 'RAIN_AMBER',
    titleTc: '黃色暴雨 / 持續驟雨',
    subtitleTc: '廣泛地區錄得顯著雨量',
    gradientColors: ['#1E293B', '#334155', '#5C4B18'],
    accentColor: '#FBBF24',
  },
  RAIN_RED: {
    id: 'RAIN_RED',
    titleTc: '紅色暴雨警告',
    subtitleTc: '暴雨正影響本港，低窪地區注意水浸',
    gradientColors: ['#1F1224', '#4C1D24', '#7F1D1D'],
    accentColor: '#F87171',
  },
  RAIN_BLACK: {
    id: 'RAIN_BLACK',
    titleTc: '黑色暴雨警告',
    subtitleTc: '極端暴雨侵襲，請留守安全室內',
    gradientColors: ['#090A0F', '#1C1926', '#3B0764'],
    accentColor: '#C084FC',
  },
  HOT: {
    id: 'HOT',
    titleTc: '酷熱天氣警告',
    subtitleTc: '本港氣溫高達 33°C 或以上，慎防中暑',
    gradientColors: ['#451208', '#7C2D12', '#B45309'],
    accentColor: '#FB923C',
  },
  TYPHOON: {
    id: 'TYPHOON',
    titleTc: '熱帶氣旋警告訊號',
    subtitleTc: '颱風 / 烈風正接近或影響本港',
    gradientColors: ['#0B132B', '#1C2541', '#3A506B'],
    accentColor: '#F59E0B',
  },
  FIRE_DRY: {
    id: 'FIRE_DRY',
    titleTc: '極度乾燥 / 火災危險警告',
    subtitleTc: '相對濕度偏低，山火風險顯著上升',
    gradientColors: ['#2E1A0F', '#5C2B13', '#854D0E'],
    accentColor: '#FBBF24',
  },
  HUMID_FOG: {
    id: 'HUMID_FOG',
    titleTc: '潮濕有霧 / 高濕度天氣',
    subtitleTc: '相對濕度達 85% 或以上，能見度或受影響',
    gradientColors: ['#0D2B2B', '#164E4A', '#216E66'],
    accentColor: '#5EEAD4',
  },
  LANDSLIP: {
    id: 'LANDSLIP',
    titleTc: '山泥傾瀉警告',
    subtitleTc: '累積雨量高，遠離斜坡及擋土牆',
    gradientColors: ['#29190E', '#4A2B16', '#6B3F21'],
    accentColor: '#FDBA74',
  },
  THUNDERSTORM: {
    id: 'THUNDERSTORM',
    titleTc: '雷暴警告',
    subtitleTc: '本港附近有強烈對流及閃電活動',
    gradientColors: ['#18122B', '#393053', '#443C68'],
    accentColor: '#A78BFA',
  },
  FLOOD_NT: {
    id: 'FLOOD_NT',
    titleTc: '新界北部水浸特別報告',
    subtitleTc: '新界北部低窪地區正出現或預計嚴重水浸',
    gradientColors: ['#082032', '#0A4361', '#0E6BA8'],
    accentColor: '#38BDF8',
  },
  MONSOON: {
    id: 'MONSOON',
    titleTc: '強烈季候風訊號',
    subtitleTc: '受強季候風或黑球影響，風勢持續強勁',
    gradientColors: ['#0F2430', '#1E3A4C', '#2C5364'],
    accentColor: '#67E8F9',
  },
};

export const PROBABILITY_TIERS: ProbabilityTierInfo[] = [
  { id: 'LOW', labelTc: '低', rangeText: '0-24%', color: '#0E4D64' },
  { id: 'MED_LOW', labelTc: '中低', rangeText: '25-39%', color: '#15803D' },
  { id: 'MODERATE', labelTc: '中等', rangeText: '40-59%', color: '#A16207' },
  { id: 'MED_HIGH', labelTc: '中高', rangeText: '60-79%', color: '#C2410C' },
  { id: 'HIGH', labelTc: '高', rangeText: '80-89%', color: '#DC2626' },
  { id: 'VERY_HIGH', labelTc: '極高', rangeText: '90-100%', color: '#6B21A8' },
];

export function tierFromPercent(percent: number): ProbabilityTierInfo {
  const find = (id: ProbabilityTierId) =>
    PROBABILITY_TIERS.find((t) => t.id === id) ?? PROBABILITY_TIERS[0];
  if (percent >= 90) return find('VERY_HIGH');
  if (percent >= 80) return find('HIGH');
  if (percent >= 60) return find('MED_HIGH');
  if (percent >= 40) return find('MODERATE');
  if (percent >= 25) return find('MED_LOW');
  return find('LOW');
}

export function determineWeatherScene(
  warnings: WarningItem[],
  currentTemp: number,
  humidity: number,
  maxRainfall: number
): WeatherSceneInfo {
  const codes = warnings.map((w) => w.code.toUpperCase());
  if (codes.some((c) => c === 'WRAINB')) return WEATHER_SCENES.RAIN_BLACK;
  if (codes.some((c) => c === 'WRAINR')) return WEATHER_SCENES.RAIN_RED;
  if (codes.some((c) => c.startsWith('TC'))) return WEATHER_SCENES.TYPHOON;
  if (codes.some((c) => c === 'WFROST')) return WEATHER_SCENES.FROST;
  if (codes.some((c) => c === 'WCOLD') || currentTemp <= 15.0) return WEATHER_SCENES.COLD;
  if (codes.some((c) => c === 'WRAINA') || maxRainfall >= 15.0) return WEATHER_SCENES.RAIN_AMBER;
  if (codes.some((c) => c === 'WFNTSA')) return WEATHER_SCENES.FLOOD_NT;
  if (codes.some((c) => c === 'WL')) return WEATHER_SCENES.LANDSLIP;
  if (codes.some((c) => c === 'WTS')) return WEATHER_SCENES.THUNDERSTORM;
  if (codes.some((c) => c === 'WHOT') || currentTemp >= 33.0) return WEATHER_SCENES.HOT;
  if (codes.some((c) => c === 'WMSGNL')) return WEATHER_SCENES.MONSOON;
  if (codes.some((c) => c.startsWith('WFIRE')) || humidity <= 45) return WEATHER_SCENES.FIRE_DRY;
  if (humidity >= 85) return WEATHER_SCENES.HUMID_FOG;
  return WEATHER_SCENES.CLEAR;
}

function findFirstColdDropDay(
  fnd: DailyForecastItem[],
  currentTemp: number
): DailyForecastItem | null {
  for (let i = 0; i < fnd.length; i++) {
    const day = fnd[i];
    const prevMax = i === 0 ? currentTemp : fnd[i - 1].forecastMaxtemp.value;
    if (day.forecastMintemp.value <= 15.0 || prevMax - day.forecastMintemp.value >= 5.0) {
      return day;
    }
  }
  return null;
}

export function buildTrackers(
  warnings: WarningItem[],
  flw: FlwResponse | null,
  swt: SwtItem[],
  fnd: DailyForecastItem[],
  currentTemp: number,
  maxRainfall: number
): WeatherSystemTracker[] {
  const codes = warnings.map((w) => w.code.toUpperCase());
  const situation = `${flw?.generalSituation ?? ''} ${flw?.outlook ?? ''} ${swt.map((s) => s.desc).join(' ')}`.toLowerCase();
  const nearDays = fnd.slice(0, 5);
  const trackers: WeatherSystemTracker[] = [];

  // 1. Cold Front / Northerly Surge
  const coldDropDay = findFirstColdDropDay(nearDays, currentTemp);
  const coldActive = codes.includes('WCOLD') || codes.includes('WFROST') || currentTemp <= 15.0;
  const coldMentioned =
    situation.includes('冷鋒') || situation.includes('cold front') || situation.includes('顯著轉涼');
  if (coldActive) {
    trackers.push({
      systemName: '冷鋒 / 寒冷天氣',
      statusBadge: '正影響本港',
      etaEstimate: `已抵達 (${currentTemp.toFixed(1)}°C)`,
      detailText: '現時氣溫偏低，晚上及明早新界氣溫會再低 2–3°C。',
      severityLevel: 2,
    });
  } else if (coldDropDay) {
    trackers.push({
      systemName: '冷鋒 / 顯著降溫',
      statusBadge: '接近中',
      etaEstimate: `預計 ${coldDropDay.forecastDate.slice(-4)} (${coldDropDay.week}) 抵達`,
      detailText: `預報最低氣溫將跌至 ${Math.trunc(coldDropDay.forecastMintemp.value)}°C，北風增強。`,
      severityLevel: 1,
    });
  } else if (coldMentioned) {
    trackers.push({
      systemName: '冷鋒 / 東北季候風補充',
      statusBadge: '未來 48 小時關注',
      etaEstimate: '預計 24–48 小時內轉涼',
      detailText: '華南沿岸即將轉受冷鋒或季候風補充影響，請留意降溫幅度和禦寒。',
      severityLevel: 1,
    });
  }

  // 2. Rainstorm / Heavy Rain
  const highPsrDay = nearDays.find(
    (it) =>
      it.PSR.toLowerCase() === 'high' ||
      it.PSR.toLowerCase() === 'medium high' ||
      it.PSR.includes('高') ||
      it.forecastWeather.includes('暴雨') ||
      it.forecastWeather.includes('大雨') ||
      it.forecastWeather.includes('狂風')
  );
  const rainActive = codes.some((c) => c.startsWith('WRAIN')) || maxRainfall >= 10.0;
  const rainMentioned =
    situation.includes('暴雨') ||
    situation.includes('大雨') ||
    situation.includes('rainstorm') ||
    situation.includes('heavy rain');
  if (rainActive) {
    trackers.push({
      systemName: '暴雨 / 強雨帶',
      statusBadge: '正在影響',
      etaEstimate: `現正降雨 (最高 ${maxRainfall.toFixed(1)} mm/h)`,
      detailText: '各區已錄得明顯雨量，請留意水浸風險與天文台雨量更新。',
      severityLevel: 2,
    });
  } else if (highPsrDay) {
    trackers.push({
      systemName: '暴雨 / 顯著驟雨帶',
      statusBadge: '潛在雨帶接近',
      etaEstimate: `預計 ${highPsrDay.forecastDate.slice(-4)} (${highPsrDay.week}) 顯著降雨`,
      detailText: `降雨概率 ${highPsrDay.PSR}：${highPsrDay.forecastWeather}`,
      severityLevel: 1,
    });
  } else if (rainMentioned) {
    trackers.push({
      systemName: '大雨 / 不穩定雨區',
      statusBadge: '雨區醞釀',
      etaEstimate: '未來 24–48 小時或有較大雨勢',
      detailText: '天文台概況提及較大雨勢發展，請留意最新暴雨及雷暴消息。',
      severityLevel: 1,
    });
  }

  // 3. Tropical Cyclone
  const tcMsg = flw?.tcInfo?.trim() || null;
  const tcActive = codes.some((c) => c.startsWith('TC'));
  const tcMentioned =
    tcMsg !== null ||
    situation.includes('熱帶氣旋') ||
    situation.includes('颱風') ||
    situation.includes('tropical cyclone');
  if (tcActive || tcMentioned) {
    trackers.push({
      systemName: '熱帶氣旋 / 颱風',
      statusBadge: tcActive ? '熱帶氣旋警告生效' : '接近 / 監測中',
      etaEstimate: tcActive ? '正影響香港 800 公里範圍' : '正進入西北太平洋 / 南海監測',
      detailText: tcMsg ?? '熱帶氣旋正影響華南沿岸，請密切留意最新風球動向。',
      severityLevel: tcActive ? 2 : 1,
    });
  }

  // 4. Monsoon / Strong Winds
  const windDay = nearDays.find(
    (it) => it.forecastWind.includes('6') || it.forecastWind.includes('7') || it.forecastWind.includes('8')
  );
  if (codes.includes('WMSGNL')) {
    trackers.push({
      systemName: '強烈季候風 (強風)',
      statusBadge: '強烈季候風生效',
      etaEstimate: '現正吹強風',
      detailText: '離岸及高地間中吹強風，海面有湧浪。',
      severityLevel: 2,
    });
  } else if (windDay) {
    trackers.push({
      systemName: '季候風 / 強陣風',
      statusBadge: '風力增強預警',
      etaEstimate: `預計 ${windDay.forecastDate.slice(-4)} (${windDay.week}) 風力增強`,
      detailText: windDay.forecastWind,
      severityLevel: 1,
    });
  }

  // 5. Thunderstorm
  const thunderDay = fnd
    .slice(0, 4)
    .find((it) => it.forecastWeather.includes('雷') || it.forecastWeather.toLowerCase().includes('thunder'));
  if (codes.includes('WTS') || thunderDay) {
    trackers.push({
      systemName: '雷暴對流活動',
      statusBadge: codes.includes('WTS') ? '雷暴警告生效' : '預報有雷暴',
      etaEstimate: codes.includes('WTS')
        ? '現正影響本港'
        : `預計 ${thunderDay!.forecastDate.slice(-4)} (${thunderDay!.week}) 出現`,
      detailText: thunderDay?.forecastWeather ?? '本港附近有強烈對流及閃電活動。',
      severityLevel: codes.includes('WTS') ? 2 : 1,
    });
  }

  // 6. Extreme Heat
  const hotDay = fnd.slice(0, 4).find((it) => it.forecastMaxtemp.value >= 33.0);
  if (codes.includes('WHOT') || currentTemp >= 33.0 || hotDay) {
    const activeNow = codes.includes('WHOT') || currentTemp >= 33.0;
    trackers.push({
      systemName: '酷熱天氣',
      statusBadge: activeNow ? '正受酷熱影響' : '高溫預警',
      etaEstimate: activeNow
        ? `現正酷熱 (${currentTemp.toFixed(1)}°C)`
        : `預計 ${hotDay!.forecastDate.slice(-4)} 升至 ${Math.trunc(hotDay!.forecastMaxtemp.value)}°C`,
      detailText: '日間氣溫高達 33°C 或以上，戶外活動注意防暑補水。',
      severityLevel: activeNow ? 2 : 1,
    });
  }

  // 7. Landslip / Northern NT Flooding
  if (codes.includes('WFNTSA')) {
    trackers.push({
      systemName: '新界北部水浸',
      statusBadge: '特別報告生效',
      etaEstimate: '即時生效中',
      detailText: '新界北部低窪地區正出現或預計嚴重水浸，請避開低窪地帶。',
      severityLevel: 2,
    });
  }
  if (codes.includes('WL')) {
    trackers.push({
      systemName: '山泥傾瀉風險',
      statusBadge: '山泥傾瀉警告生效',
      etaEstimate: '即時生效中',
      detailText: '斜坡及擋土牆附近存在滑坡風險，請遠離斜坡。',
      severityLevel: 2,
    });
  }

  return trackers.sort((a, b) => b.severityLevel - a.severityLevel);
}

export function buildUnofficialAssessments(
  warnings: WarningItem[],
  fnd: DailyForecastItem[],
  currentTemp: number,
  humidity: number,
  maxRainfall: number,
  flw: FlwResponse | null
): UnofficialWarningAssessment[] {
  const activeMap = new Map<string, WarningItem>();
  for (const w of warnings) {
    activeMap.set(w.code.toUpperCase(), w);
  }

  const minForecastTemp = fnd.length ? Math.min(...fnd.map((d) => d.forecastMintemp.value)) : currentTemp;
  const maxForecastTemp = fnd.length ? Math.max(...fnd.map((d) => d.forecastMaxtemp.value)) : currentTemp;
  const minForecastRh = fnd.length ? Math.trunc(Math.min(...fnd.map((d) => d.forecastMinrh.value))) : humidity;

  const assess = (
    code: string,
    nameTc: string,
    shortBadge: string,
    probIfNotIssued: number,
    estIssueWindow: string | null,
    estCancelWindowIfIssued: string,
    rationaleIssued: string,
    rationaleUnissued: string,
    variableText: string
  ): UnofficialWarningAssessment => {
    let active = activeMap.get(code);
    if (!active) {
      for (const [k, v] of activeMap.entries()) {
        if (k.startsWith(code)) {
          active = v;
          break;
        }
      }
    }
    if (active) {
      return {
        code: active.code,
        nameTc: active.name.trim() || nameTc,
        shortBadge,
        isCurrentlyIssued: true,
        officialIssueTime: active.issueTime.trim() || active.updateTime,
        estimatedCancellationTime: active.expireTime?.trim() || estCancelWindowIfIssued,
        issuanceProbabilityPercent: 100,
        estimatedIssuanceWindow: null,
        rationale: rationaleIssued,
        variableText,
        tier: tierFromPercent(100),
      };
    }
    const clamped = Math.min(95, Math.max(2, probIfNotIssued));
    return {
      code,
      nameTc,
      shortBadge,
      isCurrentlyIssued: false,
      officialIssueTime: null,
      estimatedCancellationTime: null, // CRITICAL RULE: If NOT issued, NEVER provide a cancellation time!
      issuanceProbabilityPercent: clamped,
      estimatedIssuanceWindow: estIssueWindow,
      rationale: rationaleUnissued,
      variableText,
      tier: tierFromPercent(clamped),
    };
  };

  const coldDay = fnd.find((it) => it.forecastMintemp.value <= 12.5);
  const coldProb =
    currentTemp <= 13.0 ? 88 : coldDay ? 78 : minForecastTemp <= 15.0 ? 45 : 8;
  const warmDay = fnd.find((it) => it.forecastMintemp.value >= 14.0);
  const coldRecovery = warmDay
    ? `預計 ${warmDay.forecastDate.slice(-4)} (${warmDay.week}) 日間回暖後取消`
    : '預計未來 24–48 小時氣溫回升至 13°C 以上逐步取消';

  const hotDay = fnd.find((it) => it.forecastMaxtemp.value >= 33.0);
  const hotProb =
    currentTemp >= 32.5 ? 85 : hotDay ? 75 : maxForecastTemp >= 31.0 ? 35 : 5;

  const rainDay = fnd.find((it) => it.PSR.toLowerCase() === 'high' || it.PSR.includes('高'));
  const rainProb =
    maxRainfall >= 20.0 ? 80 : rainDay ? 62 : maxRainfall >= 5.0 ? 30 : 10;

  const dryProb = humidity <= 40 || minForecastRh <= 45 ? 72 : humidity <= 55 ? 35 : 10;

  const frostDay = fnd.find((it) => it.forecastMintemp.value <= 7.0);
  const frostProb = frostDay ? 65 : minForecastTemp <= 10.0 ? 25 : 3;

  const tcProb = flw?.tcInfo?.trim() ? 55 : 5;

  const windDay = fnd.find(
    (it) => it.forecastWind.includes('6') || it.forecastWind.includes('7') || it.forecastWind.includes('8')
  );
  const windProb = windDay ? 68 : 15;

  const thunderDay = fnd.find(
    (it) => it.forecastWeather.includes('雷') || it.forecastWeather.toLowerCase().includes('thunder')
  );
  const thunderProb = thunderDay ? 64 : maxRainfall >= 10.0 || (humidity >= 85 && currentTemp >= 25.0) ? 42 : 12;

  const landslipProb = maxRainfall >= 30.0 ? 72 : rainDay && maxRainfall >= 10.0 ? 45 : 6;
  const floodNtProb = maxRainfall >= 35.0 ? 70 : rainDay && maxRainfall >= 15.0 ? 40 : 5;

  const items = [
    assess(
      'TC',
      '熱帶氣旋警告訊號 (1/3/8號風球)',
      '風球',
      tcProb,
      tcProb >= 40 ? '熱帶氣旋接近華南 800 公里警戒線時發出' : '目前無熱帶氣旋威脅',
      '預計氣旋登陸消散或遠離本港 800 公里後取消',
      '風帶正影響珠江口附近，視乎氣旋移動路徑與烈風圈半徑決定轉波或取消。',
      flw?.tcInfo?.trim() || '西北太平洋及南海暫無顯著熱帶氣旋接近。',
      '熱帶氣旋登陸前結構變化、路徑偏西/偏東及回南風雨強弱'
    ),
    assess(
      'WCOLD',
      '寒冷天氣警告',
      '寒冷',
      coldProb,
      coldDay
        ? `預計 ${coldDay.forecastDate.slice(-4)} (${coldDay.week}) 入夜發出`
        : coldProb >= 40
        ? '預計未來 24 小時內視乎降溫幅度'
        : '未來 9 天發出機會偏低',
      coldRecovery,
      `現時氣溫 ${currentTemp.toFixed(1)}°C，天文台一般於市區回暖並穩定於 12–13°C 以上時取消。`,
      `評估門檻 ≤12°C；9 天預報最低氣溫 ${Math.trunc(minForecastTemp)}°C。`,
      '冷鋒過境速度、雲量輻射冷卻強度及北風風寒效應'
    ),
    assess(
      'WRAIN',
      '暴雨警告訊號 (黃/紅/黑)',
      '暴雨',
      rainProb,
      rainDay
        ? `預計 ${rainDay.forecastDate.slice(-4)} (${rainDay.week}) 強雨區發展時發出`
        : '短期內發出機會低',
      '預計雨帶遠離及各區時雨量跌穿 20mm 後 1–2 小時取消',
      '強雨帶持續影響本港，需視乎每小時雨量是否回落至 30mm 以下。',
      `現時最高小時雨量 ${maxRainfall.toFixed(1)} mm，大驟雨發展訊號評估中。`,
      '強雷雨帶於珠江口發展位置、南風輻合及雨區移動速度'
    ),
    assess(
      'WHOT',
      '酷熱天氣警告',
      '酷熱',
      hotProb,
      hotDay ? `預計 ${hotDay.forecastDate.slice(-4)} (${hotDay.week}) 上午發出` : '未來 9 天發出機會極低',
      '預計當日黃昏 18:00–20:00 氣溫回落後取消',
      '高空反氣旋主導並持續高溫，通常於傍晚降溫或驟雨後取消。',
      `評估門檻 ≥33°C；9 天預報最高氣溫 ${Math.trunc(maxForecastTemp)}°C。`,
      '午後雲量發展、海風調節及局部驟雨降溫效果'
    ),
    assess(
      'WMSGNL',
      '強烈季候風訊號 (黑球)',
      '強風',
      windProb,
      windDay ? `預計 ${windDay.forecastDate.slice(-4)} (${windDay.week}) 風力增強時發出` : '風力預期維持和緩',
      '預計季候風緩和及離岸風力跌穿 6 級後取消',
      '華南沿岸氣壓梯度較大，離岸及高地風力減弱時取消。',
      '當普遍吹強風（平均風速達每小時 41 公里或以上）時觸發。',
      '大陸冷高壓南壓幅度與珠江口狹管效應風力'
    ),
    assess(
      'WTS',
      '雷暴警告',
      '雷暴',
      thunderProb,
      thunderDay ? `預計 ${thunderDay.forecastDate.slice(-4)} (${thunderDay.week}) 對流發展時發出` : '大氣對流活動暫時平穩',
      '預計對流雨區移離香港及閃電次數減少後取消',
      '本港附近錄得密集雲對地閃電，需待雷雨胞消散。',
      '高空擾動配合低層暖濕氣流時容易激發雷暴。',
      '局部強對流觸發時間與珠江口雷雨帶南壓軌跡'
    ),
    assess(
      'WL',
      '山泥傾瀉警告',
      '山泥',
      landslipProb,
      landslipProb >= 40 ? '累積雨量高企時有機會發出' : '過去 24 小時累積雨量偏低',
      '預計大雨停止且斜坡地下水壓消退後取消',
      '多區累積雨量已達土力警戒水平，須遠離斜坡及擋土牆。',
      '通常於紅／黑雨或連續大雨累積逾 150mm 時觸發。',
      '雨帶是否長時間滯留香港山地及新界斜坡'
    ),
    assess(
      'WFNTSA',
      '新界北部水浸特別報告',
      '水浸',
      floodNtProb,
      floodNtProb >= 40 ? '新界北部時雨量急升時發出' : '新界北部集水區暫無水浸風險',
      '預計排洪及上游水浸退卻後取消',
      '新界北部低窪地區累積雨量甚高，注意深圳河排洪及低窪積水。',
      '重點監測打鼓嶺、上水及元朗八鄉小時雨量。',
      '強雨帶於大帽山以北滯留時間及潮汐漲退疊加效應'
    ),
    assess(
      'WFROST',
      '霜凍警告',
      '霜凍',
      frostProb,
      frostDay ? `預計 ${frostDay.forecastDate.slice(-4)} 凌晨前發出` : '氣溫遠高於結霜門檻',
      '預計早上 08:30–09:30 日出升溫後取消',
      '清晨輻射冷卻減弱、地面溫度回升後取消。',
      '需市區約 7°C 以下或新界內陸空曠地帶近冰點。',
      '凌晨雲量散開幅度與地面微風強弱'
    ),
    assess(
      'WFIRE',
      '火災危險警告 (黃/紅)',
      '乾燥',
      dryProb,
      dryProb >= 60 ? '預計今日下午或明日乾燥時段發出' : '空氣濕度尚算充足',
      '預計濕度回升至 65% 以上或轉吹偏東風後取消',
      '乾燥季候風主導，須待相對濕度顯著回升方會取消。',
      `現時相對濕度 ${humidity}%，9 天最低預報濕度 ${minForecastRh}%。`,
      '海風濕氣回補時間及草木乾燥指數變化'
    ),
  ];

  return items.sort((a, b) => {
    if (a.isCurrentlyIssued !== b.isCurrentlyIssued) return a.isCurrentlyIssued ? -1 : 1;
    return b.issuanceProbabilityPercent - a.issuanceProbabilityPercent;
  });
}

export function buildImpactTimelineMatrix(
  warnings: WarningItem[],
  fnd: DailyForecastItem[],
  flw: FlwResponse | null,
  currentTemp: number,
  maxRainfall: number,
  swt: SwtItem[] = []
): ImpactTimelineMatrix | null {
  const codes = warnings.map((w) => w.code.toUpperCase());
  const situation = `${flw?.generalSituation ?? ''} ${flw?.outlook ?? ''} ${swt.map((s) => s.desc).join(' ')}`.toLowerCase();
  const nearDays = fnd.slice(0, 4);
  const day0 = nearDays[0];
  const day1 = nearDays[1];
  const day2 = nearDays[2];

  const shortDate = (raw: string | undefined, fallback: string): string => {
    if (!raw || raw.length < 8) return fallback;
    const m = parseInt(raw.slice(4, 6), 10);
    const d = parseInt(raw.slice(6, 8), 10);
    if (Number.isNaN(m) || Number.isNaN(d)) return fallback;
    return `${d}/${m}`;
  };

  const rainActive = codes.some((c) => c.startsWith('WRAIN')) || maxRainfall >= 10.0;
  const tcActive = codes.some((c) => c.startsWith('TC'));
  const tcInfo = flw?.tcInfo?.trim() || null;
  const tcMentioned =
    tcActive ||
    tcInfo !== null ||
    situation.includes('熱帶氣旋') ||
    situation.includes('颱風') ||
    situation.includes('tropical cyclone');
  const coldActive = codes.includes('WCOLD') || codes.includes('WFROST') || currentTemp <= 15.0;
  const windActive = codes.includes('WMSGNL') || tcActive;
  const thunderActive = codes.includes('WTS');
  const hotActive = codes.includes('WHOT') || currentTemp >= 33.0;

  const coldDropIdx = nearDays.findIndex(
    (it) => it.forecastMintemp.value <= 15.0 || currentTemp - it.forecastMintemp.value >= 5.0
  );
  const rainPeakIdx = nearDays.findIndex(
    (it) =>
      it.PSR.toLowerCase() === 'high' ||
      it.PSR.toLowerCase() === 'medium high' ||
      it.PSR.includes('高') ||
      it.forecastWeather.includes('狂風') ||
      it.forecastWeather.includes('大雨') ||
      it.forecastWeather.includes('暴雨')
  );
  const windPeakIdx = nearDays.findIndex(
    (it) => it.forecastWind.includes('6') || it.forecastWind.includes('7') || it.forecastWind.includes('8')
  );
  const thunderPeakIdx = nearDays.findIndex(
    (it) => it.forecastWeather.includes('雷') || it.forecastWeather.toLowerCase().includes('thunder')
  );
  const hotPeakIdx = nearDays.findIndex((it) => it.forecastMaxtemp.value >= 33.0);

  const rainMentioned =
    situation.includes('暴雨') ||
    situation.includes('大雨') ||
    situation.includes('heavy rain') ||
    situation.includes('rainstorm');
  const coldMentioned =
    situation.includes('冷鋒') || situation.includes('cold front') || situation.includes('顯著轉涼');

  const rows: ImpactTimelineRow[] = [];

  if (rainActive) {
    rows.push({
      categoryName: '大雨',
      pillColor: '#2563EB',
      startFraction: 0.0,
      endFraction: 0.78,
      barText: '有頻密狂風大驟雨 · 暴雨風險持續',
      barColor: '#2563EB',
      peakNote: `大雨最厲害時段：現時至未來 12 小時 (最高 ${maxRainfall.toFixed(1)} mm/h)`,
    });
  } else if (rainPeakIdx >= 0) {
    const start = Math.min(0.55, Math.max(0, rainPeakIdx * 0.25));
    const end = Math.min(1, start + 0.45);
    const d = nearDays[rainPeakIdx];
    rows.push({
      categoryName: '大雨',
      pillColor: '#2563EB',
      startFraction: start,
      endFraction: end,
      barText: `降雨概率 ${d.PSR} · ${d.forecastWeather.slice(0, 12)}`,
      barColor: '#3B82F6',
      peakNote: `大雨高峰：預計 ${shortDate(d.forecastDate, '未來')} (${d.week}) 雨勢較大`,
    });
  } else if (rainMentioned) {
    rows.push({
      categoryName: '大雨',
      pillColor: '#2563EB',
      startFraction: 0.15,
      endFraction: 0.72,
      barText: '不穩定雨區靠近 · 間中有大驟雨',
      barColor: '#3B82F6',
      peakNote: '未來 24–48 小時留意珠江口強雨帶發展',
    });
  }

  if (coldActive) {
    rows.push({
      categoryName: '冷鋒',
      pillColor: '#0284C7',
      startFraction: 0.0,
      endFraction: 0.85,
      barText: `冷鋒壓境 · 氣溫 ${currentTemp.toFixed(1)}°C (EAS 警戒)`,
      barColor: '#0EA5E9',
      peakNote: '冷鋒最寒冷時段：現時至明早清晨',
    });
  } else if (coldDropIdx >= 0) {
    const start = Math.min(0.55, Math.max(0.15, coldDropIdx * 0.24));
    const d = nearDays[coldDropIdx];
    rows.push({
      categoryName: '冷鋒',
      pillColor: '#0284C7',
      startFraction: start,
      endFraction: Math.min(1, start + 0.45),
      barText: `冷鋒抵達急降溫 · 最低 ${Math.trunc(d.forecastMintemp.value)}°C`,
      barColor: '#0284C7',
      peakNote: `冷鋒最顯著時段：${shortDate(d.forecastDate, '未來')} (${d.week}) 最低 ${Math.trunc(d.forecastMintemp.value)}°C`,
    });
  } else if (coldMentioned) {
    rows.push({
      categoryName: '冷鋒',
      pillColor: '#0284C7',
      startFraction: 0.22,
      endFraction: 0.75,
      barText: '冷鋒南下轉涼 · 北風逐漸增強',
      barColor: '#0284C7',
      peakNote: '未來 24–48 小時受冷鋒影響顯著轉涼',
    });
  }

  if (windActive) {
    rows.push({
      categoryName: '強風',
      pillColor: '#16A34A',
      startFraction: 0.0,
      endFraction: 0.88,
      barText: '多處吹強風 · 離岸及高地陣風顯著',
      barColor: '#F8FAFC',
      peakNote: '強風最當風時段：現時至明日日間',
    });
  } else if (windPeakIdx >= 0) {
    const start = Math.min(0.5, Math.max(0.1, windPeakIdx * 0.25));
    const d = nearDays[windPeakIdx];
    rows.push({
      categoryName: '強風',
      pillColor: '#16A34A',
      startFraction: start,
      endFraction: Math.min(1, start + 0.48),
      barText: `起風較急 · ${d.forecastWind.slice(0, 14)}`,
      barColor: '#E2E8F0',
      peakNote: `強風增強高峰：${shortDate(d.forecastDate, '未來')} (${d.week})`,
    });
  }

  if (tcMentioned) {
    rows.push({
      categoryName: tcActive ? '烈風' : '颱風',
      pillColor: '#EAB308',
      startFraction: tcActive ? 0.05 : 0.25,
      endFraction: tcActive ? 0.78 : 0.85,
      barText: tcActive ? '起風較急 · 部分地區不排除吹烈風至暴風' : '熱帶氣旋逼近華南 · 風雨逐步增強',
      barColor: '#F59E0B',
      peakNote: tcActive ? '熱帶氣旋最接近本港時段，慎防烈風及暴風' : '密切留意熱帶氣旋路徑及風球機會',
    });
  }

  if (thunderActive || thunderPeakIdx >= 0) {
    const start = thunderActive ? 0.0 : Math.min(0.55, Math.max(0.05, thunderPeakIdx * 0.25));
    const d = !thunderActive && thunderPeakIdx >= 0 ? nearDays[thunderPeakIdx] : null;
    rows.push({
      categoryName: '雷暴',
      pillColor: '#A855F7',
      startFraction: start,
      endFraction: Math.min(1, start + 0.5),
      barText: thunderActive ? '強烈對流及閃電正影響本港' : '局部地區有狂風雷暴',
      barColor: '#9333EA',
      peakNote: thunderActive
        ? '未來 6–12 小時慎防強陣風及閃電'
        : `預計 ${shortDate(d?.forecastDate, '未來')} 對流雷暴較活躍`,
    });
  }

  if (hotActive || hotPeakIdx >= 0) {
    const start = hotActive ? 0.1 : Math.min(0.5, Math.max(0.1, hotPeakIdx * 0.22));
    const d = !hotActive && hotPeakIdx >= 0 ? nearDays[hotPeakIdx] : null;
    rows.push({
      categoryName: '酷熱',
      pillColor: '#EA580C',
      startFraction: start,
      endFraction: Math.min(1, start + 0.55),
      barText: hotActive
        ? '日間極端酷熱 ≥33°C · 慎防中暑'
        : `日間氣溫達 ${Math.trunc(d?.forecastMaxtemp.value ?? 33)}°C 酷熱水平`,
      barColor: '#EA580C',
      peakNote: hotActive
        ? '正午 12:00 至 16:00 最炎熱'
        : `預計 ${shortDate(d?.forecastDate, '未來')} 日間酷熱`,
    });
  }

  if (codes.includes('WFNTSA')) {
    rows.push({
      categoryName: '水浸',
      pillColor: '#0EA5E9',
      startFraction: 0.0,
      endFraction: 0.65,
      barText: '新界北部低窪地區水浸風險高',
      barColor: '#0284C7',
      peakNote: '即時水浸警戒：避開新界北部低窪及河道',
    });
  }
  if (codes.includes('WL')) {
    rows.push({
      categoryName: '山泥',
      pillColor: '#B45309',
      startFraction: 0.0,
      endFraction: 0.75,
      barText: '斜坡滲水飽和 · 慎防山泥傾瀉',
      barColor: '#D97706',
      peakNote: '泥石傾瀉警戒持續：遠離斜坡及擋土牆',
    });
  }

  if (rows.length === 0) return null;

  const col0Alert = rainActive || tcActive || coldActive || windActive || thunderActive || hotActive;
  const col1Alert =
    col0Alert ||
    rainPeakIdx === 0 ||
    coldDropIdx === 0 ||
    windPeakIdx === 0 ||
    thunderPeakIdx === 0 ||
    hotPeakIdx === 0;
  const col2Alert =
    rainPeakIdx === 1 || coldDropIdx === 1 || windPeakIdx === 1 || thunderPeakIdx === 1 || tcActive;
  const col3Alert = rainPeakIdx >= 2 || coldDropIdx >= 2 || windPeakIdx >= 2;

  const columns: ImpactTimeColumn[] = [
    { timeLabel: '現時–06h', dateLabel: shortDate(day0?.forecastDate, '今日'), phaseTag: col0Alert ? '警戒' : '提防', isAlertPhase: col0Alert },
    { timeLabel: '06h–18h', dateLabel: shortDate(day0?.forecastDate, '今晚'), phaseTag: col1Alert ? '警戒' : '提防', isAlertPhase: col1Alert },
    { timeLabel: '明日全天', dateLabel: shortDate(day1?.forecastDate, '明日'), phaseTag: col2Alert ? '警戒' : '提防', isAlertPhase: col2Alert },
    { timeLabel: '後天趨勢', dateLabel: shortDate(day2?.forecastDate, '後天'), phaseTag: col3Alert ? '警戒' : '提防', isAlertPhase: col3Alert },
  ];

  const dynamicTitle =
    rows.length <= 3
      ? `${rows.map((r) => r.categoryName).join('／')} 影響最厲害時段矩陣`
      : '惡劣天氣影響最厲害時段矩陣';

  return {
    titleTc: dynamicTitle,
    peakSummaryText: rows[0].peakNote,
    columns,
    rows,
  };
}

export function buildMultiDayOutlook(
  warnings: WarningItem[],
  flw: FlwResponse | null,
  fnd: DailyForecastItem[],
  currentTemp: number,
  _humidity: number,
  maxRainfall: number
): MultiDayOutlookForecast {
  const codes = warnings.map((w) => w.code.toUpperCase());
  const hasColdUpcoming = codes.includes('WCOLD') || fnd.slice(0, 4).some((d) => d.forecastMintemp.value <= 15.0);
  const hasRainUpcoming =
    codes.some((c) => c.startsWith('WRAIN')) ||
    maxRainfall >= 10.0 ||
    fnd.slice(0, 4).some((d) => d.PSR.toLowerCase() === 'high' || d.PSR.toLowerCase() === 'medium high' || d.PSR.includes('高'));
  const hasTyphoonUpcoming = codes.some((c) => c.startsWith('TC')) || Boolean(flw?.tcInfo?.trim());
  const hasHotDry = codes.includes('WHOT') || codes.some((c) => c.startsWith('WFIRE')) || currentTemp >= 32.0;

  let overlayMode: RegionalOverlayMode = 'STABLE';
  if (hasTyphoonUpcoming) overlayMode = 'TYPHOON_WIND';
  else if (hasRainUpcoming) overlayMode = 'RAINBAND';
  else if (hasColdUpcoming) overlayMode = 'COLD_FRONT';
  else if (hasHotDry) overlayMode = 'HEAT_DRY';

  const headlineMap: Record<RegionalOverlayMode, string> = {
    TYPHOON_WIND: '未來數日受熱帶氣旋及風雨影響',
    RAINBAND: '未來一兩日天氣不穩 · 有驟雨雷暴',
    COLD_FRONT: '未來數日冷鋒南下顯著轉涼',
    HEAT_DRY: '未來數日高溫酷熱 / 乾燥天氣持續',
    STABLE: '未來數日華南沿岸天氣大致穩定',
  };

  const fallbackPred: Record<RegionalOverlayMode, string> = {
    RAINBAND: '本港附近低空受偏南／西南濕潤氣流佔據，高空擾動靠近時有利強雷雨區發展。',
    COLD_FRONT: '一道冷鋒正橫過華南並於未來 1–3 日影響香港，北風增強且氣溫顯著下降。',
    TYPHOON_WIND: '熱帶氣旋正靠近華南沿岸，外圍雨帶及烈風區將逐步影響珠江口。',
    HEAT_DRY: '受高空反氣旋或乾燥大陸氣流主導，日間陽光充沛且氣溫偏高。',
    STABLE: '東北季候風或偏東氣流維持，珠江口未來數日天色大致晴朗或間中有陽光。',
  };

  const prediction = flw?.generalSituation?.trim() || fallbackPred[overlayMode];

  const next3 = fnd.slice(0, 3);
  let tempRangeStr = '';
  if (next3.length > 0) {
    const lo = Math.trunc(Math.min(...next3.map((d) => d.forecastMintemp.value)));
    const hi = Math.trunc(Math.max(...next3.map((d) => d.forecastMaxtemp.value)));
    tempRangeStr = `未來 3 日氣溫介乎 ${lo}–${hi}°C。`;
  }

  const precautionMap: Record<RegionalOverlayMode, string> = {
    RAINBAND: `提防大驟雨、強陣風和雷暴，或影響上下班時間及戶外活動。${tempRangeStr}`,
    COLD_FRONT: `日夜溫差擴大並可能跌破 15°C EAS 門檻，長者及戶外工作者需提防風寒。${tempRangeStr}`,
    TYPHOON_WIND: `提防狂風、驟雨及海面湧浪，遠離岸邊並提前檢查門窗及避災中心位置。${tempRangeStr}`,
    HEAT_DRY: `提防高溫中暑及山火乾燥風險，戶外活動需補充足夠水分。${tempRangeStr}`,
    STABLE: `整體天候平穩，早晚或有薄霧或微涼，仍建議留意最新預報更新。${tempRangeStr}`,
  };

  let variable = '海風調節幅度、局部雲量變化及季候風微調時間對每日最高／最低氣溫仍有輕微變數。';
  if (overlayMode === 'RAINBAND') {
    variable = '雨區發展時間、位置和範圍對本港影響存在變數；若局部強對流於珠江口滯留，雨勢將較預期顯著。';
  } else if (overlayMode === 'COLD_FRONT') {
    variable = '冷鋒推進速度、夜間雲量散開幅度及新界空曠地區輻射降溫仍有 2–3°C 變數。';
  } else if (overlayMode === 'TYPHOON_WIND') {
    variable = '熱帶氣旋路徑與登陸前結構變化仍存變數，直接影響風球級別與雨帶分佈。';
  }

  const periodBadge = flw?.forecastPeriod?.trim().slice(0, 14) || '未來 1–3 日重點預告';

  return {
    headline: headlineMap[overlayMode],
    periodBadge,
    overlayMode,
    predictionText: prediction,
    precautionText: precautionMap[overlayMode],
    variableText: variable,
    forecastDays: fnd.slice(0, 4),
  };
}
