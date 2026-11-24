export type UiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string };

export type EasToneType = 'HKO_MP3' | 'SAME_DUAL' | 'TYPHOON_SIREN' | 'COLD_CHIME';

export const EAS_TONE_META: Record<EasToneType, { labelTc: string; labelEn: string }> = {
  HKO_MP3: { labelTc: '天文台警告原聲 MP3 (自訂音檔)', labelEn: 'HKO Warning MP3 File' },
  SAME_DUAL: { labelTc: 'EAS 雙音緊急警報 (853/960Hz)', labelEn: 'EAS Dual-Tone Attention' },
  TYPHOON_SIREN: { labelTc: '熱帶氣旋掃頻警報', labelEn: 'Cyclone Sweep Siren' },
  COLD_CHIME: { labelTc: '低溫 / 霜凍三連提示音', labelEn: 'Cold Alert Triple Chime' },
};

export type DarkModePref = 'SYSTEM' | 'LIGHT' | 'DARK';

export const DARK_MODE_META: Record<DarkModePref, { labelTc: string }> = {
  SYSTEM: { labelTc: '跟隨系統' },
  LIGHT: { labelTc: '日間亮色' },
  DARK: { labelTc: '夜間暗黑' },
};

export type UiThemeStyle =
  | 'OBSERVATORY_COMMAND'
  | 'RADAR_GLASS'
  | 'EDITORIAL_MINIMAL'
  | 'EMERGENCY_TACTICAL'
  | 'NORDIC_FROST'
  | 'SUNSET_METEO';

export const UI_THEME_META: Record<
  UiThemeStyle,
  { labelTc: string; descTc: string; swatches: [string, string, string] }
> = {
  OBSERVATORY_COMMAND: {
    labelTc: '天文台指揮艙',
    descTc: '經典深海藍配青色遙測指示',
    swatches: ['#061E38', '#0369A1', '#22D3EE'],
  },
  RADAR_GLASS: {
    labelTc: '玻璃擬態雷達',
    descTc: '微透明層次與細緻發光邊框',
    swatches: ['#090D1F', '#4F46E5', '#C084FC'],
  },
  EDITORIAL_MINIMAL: {
    labelTc: '極簡新聞簡報',
    descTc: '純淨高對比排版與柔和分層',
    swatches: ['#111827', '#1D4ED8', '#E5E7EB'],
  },
  EMERGENCY_TACTICAL: {
    labelTc: '防災高對比戰術',
    descTc: '極端天氣專用高辨識琥珀紅黑',
    swatches: ['#09090B', '#F59E0B', '#EF4444'],
  },
  NORDIC_FROST: {
    labelTc: '北歐冰川清透',
    descTc: '冷冽冰藍與翡翠薄荷調',
    swatches: ['#061B22', '#0284C7', '#5EEAD4'],
  },
  SUNSET_METEO: {
    labelTc: '暖陽暮光氣象',
    descTc: '日落暖橙金與沉穩暮紫',
    swatches: ['#291720', '#EA580C', '#FBBF24'],
  },
};

export type UiCardCornerStyle = 'SHARP' | 'ROUNDED' | 'PILL';

export const UI_CORNER_META: Record<UiCardCornerStyle, { labelTc: string; cornerPx: number }> = {
  SHARP: { labelTc: '俐落方角', cornerPx: 10 },
  ROUNDED: { labelTc: '現代圓角', cornerPx: 20 },
  PILL: { labelTc: '柔和膠囊', cornerPx: 28 },
};

export type UiLayoutDensity = 'COMPACT' | 'STANDARD' | 'SPACIOUS';

export const UI_DENSITY_META: Record<UiLayoutDensity, { labelTc: string; descTc: string }> = {
  COMPACT: { labelTc: '緊湊高密度', descTc: '濃縮間距與雙欄 HUD，單手一眼看全' },
  STANDARD: { labelTc: '標準平衡', descTc: '日常最佳閱讀比例' },
  SPACIOUS: { labelTc: '寬裕舒展', descTc: '加大留白與卡片呼吸感' },
};

export type UiNavBarStyle = 'CLASSIC' | 'FLOATING_PILL';

export const UI_NAV_META: Record<UiNavBarStyle, { labelTc: string }> = {
  CLASSIC: { labelTc: '標準底部列' },
  FLOATING_PILL: { labelTc: '懸浮膠囊導航' },
};

export type AppLayoutStyle =
  | 'CLASSIC_OBSERVATORY'
  | 'APPLE_WEATHER_GLASS'
  | 'METEO_COMMAND'
  | 'TACTICAL_HUD'
  | 'EDITORIAL_MAGAZINE';

export const APP_LAYOUT_META: Record<
  AppLayoutStyle,
  {
    shortCode: string;
    labelTc: string;
    badgeTc: string;
    descTc: string;
    recommendedTheme: UiThemeStyle;
    recommendedCorner: UiCardCornerStyle;
    recommendedDensity: UiLayoutDensity;
    recommendedNavBar: UiNavBarStyle;
    recommendedDarkMode: DarkModePref;
  }
> = {
  CLASSIC_OBSERVATORY: {
    shortCode: '預設',
    labelTc: '標準天文台觀測',
    badgeTc: '經典平衡',
    descTc: '平衡清楚的天氣主卡、溫度極值與實時系統追蹤',
    recommendedTheme: 'OBSERVATORY_COMMAND',
    recommendedCorner: 'ROUNDED',
    recommendedDensity: 'STANDARD',
    recommendedNavBar: 'CLASSIC',
    recommendedDarkMode: 'SYSTEM',
  },
  APPLE_WEATHER_GLASS: {
    shortCode: '方案 A',
    labelTc: '全屏動態毛玻璃風',
    badgeTc: '沉浸實景',
    descTc: '全螢幕實時天氣動畫背景、半透明毛玻璃 Bento 方格與懸浮導航',
    recommendedTheme: 'RADAR_GLASS',
    recommendedCorner: 'PILL',
    recommendedDensity: 'STANDARD',
    recommendedNavBar: 'FLOATING_PILL',
    recommendedDarkMode: 'DARK',
  },
  METEO_COMMAND: {
    shortCode: '方案 B',
    labelTc: 'MET WARN 氣象指揮艙',
    badgeTc: '專業直播',
    descTc: '頂部實時警報跑馬燈、遙測數據列及置頂警告機率與時段矩陣',
    recommendedTheme: 'OBSERVATORY_COMMAND',
    recommendedCorner: 'ROUNDED',
    recommendedDensity: 'COMPACT',
    recommendedNavBar: 'CLASSIC',
    recommendedDarkMode: 'DARK',
  },
  TACTICAL_HUD: {
    shortCode: '方案 C',
    labelTc: '防災戰術高對比 HUD',
    badgeTc: 'AMOLED 應急',
    descTc: '純黑省電底配琥珀紅硬朗外框，避災・EAS・SMS 快速行動優先',
    recommendedTheme: 'EMERGENCY_TACTICAL',
    recommendedCorner: 'SHARP',
    recommendedDensity: 'COMPACT',
    recommendedNavBar: 'CLASSIC',
    recommendedDarkMode: 'DARK',
  },
  EDITORIAL_MAGAZINE: {
    shortCode: '方案 D',
    labelTc: '北歐極簡氣象手賬',
    badgeTc: '清爽簡報',
    descTc: '大量留白與幼線邊框，以今日氣象自然語言簡報為主軸',
    recommendedTheme: 'EDITORIAL_MINIMAL',
    recommendedCorner: 'SHARP',
    recommendedDensity: 'SPACIOUS',
    recommendedNavBar: 'FLOATING_PILL',
    recommendedDarkMode: 'LIGHT',
  },
};

export type BroadcastLang = 'TC' | 'SC' | 'EN' | 'ID' | 'TL' | 'NE' | 'UR' | 'HI';

export const BROADCAST_LANG_META: Record<
  BroadcastLang,
  { code: BroadcastLang; displayName: string; localeTag: string }
> = {
  TC: { code: 'TC', displayName: '繁體中文 (粵語/書面)', localeTag: 'zh-HK' },
  SC: { code: 'SC', displayName: '简体中文', localeTag: 'zh-CN' },
  EN: { code: 'EN', displayName: 'English', localeTag: 'en-GB' },
  ID: { code: 'ID', displayName: 'Bahasa Indonesia', localeTag: 'id-ID' },
  TL: { code: 'TL', displayName: 'Tagalog', localeTag: 'fil-PH' },
  NE: { code: 'NE', displayName: 'नेपाली (Nepali)', localeTag: 'ne-NP' },
  UR: { code: 'UR', displayName: 'اردو (Urdu)', localeTag: 'ur-PK' },
  HI: { code: 'HI', displayName: 'हिन्दी (Hindi)', localeTag: 'hi-IN' },
};

export type HazardType =
  | 'FLOODING'
  | 'FALLEN_TREE'
  | 'LANDSLIP'
  | 'STRONG_GUST'
  | 'ROAD_CLOSURE'
  | 'ICY_FROST';

export const HAZARD_TYPE_META: Record<HazardType, { labelTc: string; labelEn: string }> = {
  FLOODING: { labelTc: '嚴重積水 / 水浸', labelEn: 'Flooding' },
  FALLEN_TREE: { labelTc: '塌樹阻路', labelEn: 'Fallen Tree' },
  LANDSLIP: { labelTc: '山泥傾瀉 / 落石', labelEn: 'Landslip' },
  STRONG_GUST: { labelTc: '強陣風 / 棚架搖晃', labelEn: 'Strong Gust' },
  ROAD_CLOSURE: { labelTc: '道路封閉 / 障礙', labelEn: 'Road Closure' },
  ICY_FROST: { labelTc: '結霜 / 路面濕滑', labelEn: 'Frost / Slippery' },
};

export type ReportSeverity = 'LOW' | 'MODERATE' | 'SEVERE' | 'CRITICAL';

export const REPORT_SEVERITY_META: Record<ReportSeverity, { labelTc: string }> = {
  LOW: { labelTc: '輕微' },
  MODERATE: { labelTc: '中度' },
  SEVERE: { labelTc: '嚴重' },
  CRITICAL: { labelTc: '極端危急' },
};

export interface UserPreferences {
  userId: string;
  displayName: string;
  quietHoursEnabled: boolean;
  quietStartHour: number;
  quietStartMinute: number;
  quietEndHour: number;
  quietEndMinute: number;
  tempAlertThreshold: number;
  easAutoPlay: boolean;
  easToneType: EasToneType;
  autoPushEnabled: boolean;
  darkModePref: DarkModePref;
  broadcastLang: BroadcastLang;
  selectedDistrict: string;
  emergencySmsNumber: string;
  uiThemeStyle: UiThemeStyle;
  uiCardCorner: UiCardCornerStyle;
  uiDensity: UiLayoutDensity;
  uiNavBarStyle: UiNavBarStyle;
  useDynamicColor: boolean;
  appLayoutStyle: AppLayoutStyle;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  userId: '',
  displayName: 'Citizen',
  quietHoursEnabled: true,
  quietStartHour: 22,
  quietStartMinute: 30,
  quietEndHour: 7,
  quietEndMinute: 0,
  tempAlertThreshold: 15.0,
  easAutoPlay: true,
  easToneType: 'SAME_DUAL',
  autoPushEnabled: true,
  darkModePref: 'SYSTEM',
  broadcastLang: 'TC',
  selectedDistrict: '油尖旺區',
  emergencySmsNumber: '',
  uiThemeStyle: 'OBSERVATORY_COMMAND',
  uiCardCorner: 'ROUNDED',
  uiDensity: 'STANDARD',
  uiNavBarStyle: 'CLASSIC',
  useDynamicColor: false,
  appLayoutStyle: 'CLASSIC_OBSERVATORY',
};

export interface WeatherHistoryRecord {
  id: string;
  userId: string;
  stationName: string;
  district: string;
  recordDate: string;
  tempCelsius: number;
  maxTempCelsius: number;
  minTempCelsius: number;
  humidityPercent: number;
  rainfallMm: number;
  uvIndex: number;
  aqhiLevel: number;
  activeWarnings: string;
  summaryNote?: string;
}

export interface CommunityReport {
  id: string;
  userId: string;
  authorAlias: string;
  district: string;
  hazardType: HazardType;
  severity: ReportSeverity;
  waterDepthCm: number;
  description: string;
  latitude: number;
  longitude: number;
  visibility: 'PUBLIC' | 'LOCAL';
}

// HKO Open Data DTOs
export interface StationTempItem {
  place: string;
  value: number;
  unit: string;
}

export interface RainfallItem {
  unit: string;
  place: string;
  max: number;
  min?: number | null;
  main: string;
}

export interface HumidityItem {
  unit: string;
  value: number;
  place: string;
}

export interface UvItem {
  place: string;
  value: number;
  desc: string;
}

export interface WarningItem {
  name: string;
  code: string;
  type?: string | null;
  actionCode: string;
  issueTime: string;
  expireTime?: string | null;
  updateTime: string;
}

export interface WarningDetailItem {
  contents: string[];
  warningStatementCode: string;
  subtype?: string | null;
  updateTime?: string | null;
}

export interface DailyForecastItem {
  forecastDate: string;
  week: string;
  forecastWind: string;
  forecastWeather: string;
  forecastMaxtemp: { value: number; unit: string };
  forecastMintemp: { value: number; unit: string };
  forecastMaxrh: { value: number; unit: string };
  forecastMinrh: { value: number; unit: string };
  ForecastIcon: number;
  PSR: string;
}

export interface FlwResponse {
  generalSituation?: string | null;
  tcInfo?: string | null;
  fireDangerWarning?: string | null;
  forecastPeriod?: string | null;
  forecastDesc?: string | null;
  outlook?: string | null;
  updateTime?: string | null;
}

export interface SwtItem {
  desc: string;
  updateTime: string;
}

export interface AqhiStationItem {
  station: string;
  aqhi: number;
  health_risk: string;
  publish_date: string;
}

export interface HistoricalClimateRow {
  date: string;
  value: number;
  completeness: string;
  station: string;
  metricLabel: string;
}

export interface ShelterLocation {
  id: string;
  nameTc: string;
  nameEn: string;
  district: string;
  address: string;
  shelterType: string;
  latitude: number;
  longitude: number;
  phone: string;
  capacity: number;
  facilities: string;
  cachedAtEpochMs: number;
}

export interface ShelterCacheStatus {
  totalCachedCount: number;
  lastCachedAtText: string;
  isOfflineReady: boolean;
}

export interface HkDistrictCoord {
  districtTc: string;
  districtEn: string;
  stationMatchKeywords: string[];
  latitude: number;
  longitude: number;
}

export type WeatherSceneId =
  | 'CLEAR'
  | 'COLD'
  | 'FROST'
  | 'RAIN_AMBER'
  | 'RAIN_RED'
  | 'RAIN_BLACK'
  | 'HOT'
  | 'TYPHOON'
  | 'FIRE_DRY'
  | 'HUMID_FOG'
  | 'LANDSLIP'
  | 'THUNDERSTORM'
  | 'FLOOD_NT'
  | 'MONSOON';

export interface WeatherSceneInfo {
  id: WeatherSceneId;
  titleTc: string;
  subtitleTc: string;
  gradientColors: [string, string, string];
  accentColor: string;
}

export interface WeatherSystemTracker {
  systemName: string;
  statusBadge: string;
  etaEstimate: string;
  detailText: string;
  severityLevel: number;
}

export type ProbabilityTierId =
  | 'LOW'
  | 'MED_LOW'
  | 'MODERATE'
  | 'MED_HIGH'
  | 'HIGH'
  | 'VERY_HIGH';

export interface ProbabilityTierInfo {
  id: ProbabilityTierId;
  labelTc: string;
  rangeText: string;
  color: string;
}

export interface UnofficialWarningAssessment {
  code: string;
  nameTc: string;
  shortBadge: string;
  isCurrentlyIssued: boolean;
  officialIssueTime: string | null;
  estimatedCancellationTime: string | null;
  issuanceProbabilityPercent: number;
  estimatedIssuanceWindow: string | null;
  rationale: string;
  variableText: string;
  tier: ProbabilityTierInfo;
}

export interface ImpactTimeColumn {
  timeLabel: string;
  dateLabel: string;
  phaseTag: string;
  isAlertPhase: boolean;
}

export interface ImpactTimelineRow {
  categoryName: string;
  pillColor: string;
  startFraction: number;
  endFraction: number;
  barText: string;
  barColor: string;
  peakNote: string;
}

export interface ImpactTimelineMatrix {
  titleTc: string;
  peakSummaryText: string;
  columns: ImpactTimeColumn[];
  rows: ImpactTimelineRow[];
}

export type RegionalOverlayMode =
  | 'RAINBAND'
  | 'COLD_FRONT'
  | 'TYPHOON_WIND'
  | 'HEAT_DRY'
  | 'STABLE';

export interface MultiDayOutlookForecast {
  headline: string;
  periodBadge: string;
  overlayMode: RegionalOverlayMode;
  predictionText: string;
  precautionText: string;
  variableText: string;
  forecastDays: DailyForecastItem[];
}

export interface WeatherSnapshot {
  updatedAtText: string;
  isOfflineFallback: boolean;
  isSmsDecoded?: boolean;
  currentTemp: number;
  nearestStationName: string;
  selectedDistrict: string;
  highestStation: StationTempItem | null;
  lowestStation: StationTempItem | null;
  allStations: StationTempItem[];
  rainfallStations: RainfallItem[];
  humidityPercent: number;
  uvIndex: number;
  uvDesc: string;
  aqhiStations: AqhiStationItem[];
  maxAqhi: number;
  activeWarnings: WarningItem[];
  warningDetails: WarningDetailItem[];
  specialWeatherTips: SwtItem[];
  localForecast: FlwResponse | null;
  nineDayForecast: DailyForecastItem[];
  generalSituation: string;
  weatherScene: WeatherSceneInfo;
  trackers: WeatherSystemTracker[];
  unofficialAssessments: UnofficialWarningAssessment[];
  easTriggers: string[];
  impactTimeline: ImpactTimelineMatrix | null;
  multiDayOutlook: MultiDayOutlookForecast | null;
}

export const HK_DISTRICTS: HkDistrictCoord[] = [
  { districtTc: '中西區', districtEn: 'Central & Western', stationMatchKeywords: ['中環', 'Central', '山頂', 'The Peak', '香港公園', 'Hong Kong Park'], latitude: 22.2819, longitude: 114.1583 },
  { districtTc: '灣仔區', districtEn: 'Wan Chai', stationMatchKeywords: ['跑馬地', 'Happy Valley', '香港天文台'], latitude: 22.2760, longitude: 114.1751 },
  { districtTc: '東區', districtEn: 'Eastern', stationMatchKeywords: ['筲箕灣', 'Shau Kei Wan', '北角'], latitude: 22.2799, longitude: 114.2254 },
  { districtTc: '南區', districtEn: 'Southern', stationMatchKeywords: ['黃竹坑', 'Wong Chuk Hang', '赤柱', 'Stanley'], latitude: 22.2471, longitude: 114.1588 },
  { districtTc: '油尖旺區', districtEn: 'Yau Tsim Mong', stationMatchKeywords: ['香港天文台', 'Hong Kong Observatory', '京士柏', "King's Park"], latitude: 22.3019, longitude: 114.1742 },
  { districtTc: '深水埗區', districtEn: 'Sham Shui Po', stationMatchKeywords: ['深水埗', 'Sham Shui Po'], latitude: 22.3307, longitude: 114.1622 },
  { districtTc: '九龍城區', districtEn: 'Kowloon City', stationMatchKeywords: ['九龍城', 'Kowloon City', '啟德'], latitude: 22.3282, longitude: 114.1915 },
  { districtTc: '黃大仙區', districtEn: 'Wong Tai Sin', stationMatchKeywords: ['黃大仙', 'Wong Tai Sin'], latitude: 22.3418, longitude: 114.1951 },
  { districtTc: '觀塘區', districtEn: 'Kwun Tong', stationMatchKeywords: ['觀塘', 'Kwun Tong'], latitude: 22.3133, longitude: 114.2258 },
  { districtTc: '葵青區', districtEn: 'Kwai Tsing', stationMatchKeywords: ['青衣', 'Tsing Yi'], latitude: 22.3549, longitude: 114.1261 },
  { districtTc: '荃灣區', districtEn: 'Tsuen Wan', stationMatchKeywords: ['荃灣', 'Tsuen Wan', '城門谷'], latitude: 22.3713, longitude: 114.1141 },
  { districtTc: '屯門區', districtEn: 'Tuen Mun', stationMatchKeywords: ['屯門', 'Tuen Mun'], latitude: 22.3908, longitude: 113.9725 },
  { districtTc: '元朗區', districtEn: 'Yuen Long', stationMatchKeywords: ['元朗', 'Yuen Long', '流浮山', '濕地公園'], latitude: 22.4445, longitude: 114.0222 },
  { districtTc: '北區', districtEn: 'North', stationMatchKeywords: ['打鼓嶺', 'Ta Kwu Ling', '上水', 'Sheung Shui'], latitude: 22.5011, longitude: 114.1277 },
  { districtTc: '大埔區', districtEn: 'Tai Po', stationMatchKeywords: ['大埔', 'Tai Po', '大美督'], latitude: 22.4508, longitude: 114.1642 },
  { districtTc: '沙田區', districtEn: 'Sha Tin', stationMatchKeywords: ['沙田', 'Sha Tin'], latitude: 22.3814, longitude: 114.1879 },
  { districtTc: '西貢區', districtEn: 'Sai Kung', stationMatchKeywords: ['西貢', 'Sai Kung', '將軍澳', 'Tseung Kwan O'], latitude: 22.3814, longitude: 114.2705 },
  { districtTc: '離島區', districtEn: 'Islands', stationMatchKeywords: ['赤鱲角', 'Chek Lap Kok', '長洲', 'Cheung Chau', '坪洲'], latitude: 22.2611, longitude: 113.9461 },
];

export const HK_SHELTERS: ShelterLocation[] = [
  { id: 'sh_cw_1', nameTc: '西營盤社區綜合大樓臨時庇護中心', nameEn: 'Sai Ying Pun Community Complex Shelter', district: '中西區', address: '西營盤高街2號', shelterType: 'COLD / TYPHOON / HEAT', latitude: 22.2856, longitude: 114.1445, phone: '2540 8491', capacity: 260, facilities: '無障礙通道 · 飲用水 · 毛氈 · 備用發電機', cachedAtEpochMs: 0 },
  { id: 'sh_cw_2', nameTc: '中環中心街區臨時庇護站 (堅尼地城社區綜合大樓)', nameEn: 'Kennedy Town Community Complex', district: '中西區', address: '堅尼地城石山街12號', shelterType: 'COLD / TYPHOON', latitude: 22.2815, longitude: 114.1282, phone: '2817 1711', capacity: 220, facilities: '無障礙通道 · 醫療急救 · 熱水供應', cachedAtEpochMs: 0 },
  { id: 'sh_wc_1', nameTc: '禮頓山社區會堂臨時庇護中心', nameEn: 'Leighton Hill Community Hall', district: '灣仔區', address: '跑馬地黃泥涌道133號', shelterType: 'COLD / HEAT / TYPHOON', latitude: 22.2738, longitude: 114.1815, phone: '2895 1621', capacity: 240, facilities: '無障礙通道 · 暖氣/空調 · 飲用水 · 充電插座', cachedAtEpochMs: 0 },
  { id: 'sh_e_1', nameTc: '銅鑼灣社區中心臨時庇護中心', nameEn: 'Causeway Bay Community Centre', district: '東區', address: '北角福蔭道7號', shelterType: 'TYPHOON / HEAT / COLD', latitude: 22.2886, longitude: 114.1924, phone: '2570 4031', capacity: 280, facilities: '無障礙通道 · 急救站 · 飲用水 · 備用電源', cachedAtEpochMs: 0 },
  { id: 'sh_e_2', nameTc: '柴灣社區會堂臨時庇護中心', nameEn: 'Chai Wan Community Hall', district: '東區', address: '柴灣興華邨一號社區會堂', shelterType: 'TYPHOON / COLD', latitude: 22.2633, longitude: 114.2369, phone: '2556 7612', capacity: 210, facilities: '防風閘 · 醫療箱 · 飲用水 · 睡墊', cachedAtEpochMs: 0 },
  { id: 'sh_s_1', nameTc: '華貴社區中心臨時庇護中心', nameEn: 'Wah Kwai Community Centre', district: '南區', address: '香港仔華貴邨', shelterType: 'TYPHOON / COLD', latitude: 22.2512, longitude: 114.1391, phone: '2551 6090', capacity: 200, facilities: '無障礙通道 · 防風設施 · 飲用水 · 毛氈', cachedAtEpochMs: 0 },
  { id: 'sh_ytm_1', nameTc: '梁顯利油麻地社區中心', nameEn: 'Henry G. Leong Yaumatei Community Centre', district: '油尖旺區', address: '油麻地眾坊街60號', shelterType: 'COLD / HEAT / TYPHOON', latitude: 22.3106, longitude: 114.1704, phone: '2384 3285', capacity: 350, facilities: '24小時當值 · 無障礙電梯 · 急救 · 熱食區', cachedAtEpochMs: 0 },
  { id: 'sh_ssp_1', nameTc: '南昌社區中心臨時庇護中心', nameEn: 'Nam Cheong Community Centre', district: '深水埗區', address: '深水埗昌新里1號', shelterType: 'COLD / TYPHOON', latitude: 22.3277, longitude: 114.1604, phone: '2728 5221', capacity: 260, facilities: '無障礙通道 · 飲用水 · 充電站 · 急救箱', cachedAtEpochMs: 0 },
  { id: 'sh_kc_1', nameTc: '紅磡社區會堂臨時庇護中心', nameEn: 'Hung Hom Community Hall', district: '九龍城區', address: '紅磡庇利街42號', shelterType: 'COLD / HEAT', latitude: 22.3095, longitude: 114.1887, phone: '2334 8921', capacity: 230, facilities: '無障礙通道 · 暖氣/空調 · 飲用水', cachedAtEpochMs: 0 },
  { id: 'sh_wts_1', nameTc: '慈雲山(南區)社區中心', nameEn: 'Tsz Wan Shan (South) Estate Community Centre', district: '黃大仙區', address: '慈雲山雲華街45號', shelterType: 'TYPHOON / COLD', latitude: 22.3468, longitude: 114.2007, phone: '2327 7732', capacity: 250, facilities: '無障礙通道 · 備用發電機 · 飲用水 · 睡墊', cachedAtEpochMs: 0 },
  { id: 'sh_kt_1', nameTc: '藍田(西區)社區中心', nameEn: 'Lam Tin (West) Estate Community Centre', district: '觀塘區', address: '藍田啟田道71號', shelterType: 'COLD / HEAT / TYPHOON', latitude: 22.3075, longitude: 114.2348, phone: '2347 1102', capacity: 300, facilities: '無障礙通道 · 急救站 · 飲用水 · 充電插座', cachedAtEpochMs: 0 },
  { id: 'sh_kwt_1', nameTc: '葵芳社區會堂臨時庇護中心', nameEn: 'Kwai Fong Community Hall', district: '葵青區', address: '葵涌禮芳街2號', shelterType: 'COLD / HEAT / TYPHOON', latitude: 22.3578, longitude: 114.1288, phone: '2423 1966', capacity: 240, facilities: '無障礙通道 · 防風設施 · 飲用水 · 醫療箱', cachedAtEpochMs: 0 },
  { id: 'sh_tw_1', nameTc: '梨木樹社區會堂臨時庇護中心', nameEn: 'Lei Muk Shue Community Hall', district: '荃灣區', address: '荃灣梨木樹邨', shelterType: 'COLD / TYPHOON', latitude: 22.3775, longitude: 114.1361, phone: '2420 5541', capacity: 220, facilities: '無障礙通道 · 飲用水 · 毛氈 · 充電區', cachedAtEpochMs: 0 },
  { id: 'sh_tm_1', nameTc: '蝴蝶灣社區中心臨時庇護中心', nameEn: 'Butterfly Bay Community Centre', district: '屯門區', address: '屯門蝴蝶邨', shelterType: 'TYPHOON / COLD', latitude: 22.3752, longitude: 113.9628, phone: '2466 3781', capacity: 260, facilities: '防風結構 · 備用電源 · 飲用水 · 睡墊', cachedAtEpochMs: 0 },
  { id: 'sh_yl_1', nameTc: '朗屏社區會堂臨時庇護中心', nameEn: 'Long Ping Community Hall', district: '元朗區', address: '元朗朗屏邨', shelterType: 'COLD / HEAT / TYPHOON', latitude: 22.4488, longitude: 114.0235, phone: '2475 8810', capacity: 290, facilities: '高地防浸設計 · 無障礙通道 · 飲用水 · 急救站', cachedAtEpochMs: 0 },
  { id: 'sh_yl_2', nameTc: '天暉路社區會堂臨時庇護中心', nameEn: 'Tin Fai Road Community Hall', district: '元朗區', address: '天水圍天瑞路63號', shelterType: 'TYPHOON / HEAT / COLD', latitude: 22.4631, longitude: 113.9985, phone: '2617 9123', capacity: 310, facilities: '防洪儲備 · 無障礙通道 · 空調/暖氣 · 飲用水', cachedAtEpochMs: 0 },
  { id: 'sh_n_1', nameTc: '粉嶺祥華社區會堂', nameEn: 'Cheung Wah Community Hall', district: '北區', address: '粉嶺祥華邨', shelterType: 'COLD / FROST / TYPHOON', latitude: 22.4926, longitude: 114.1419, phone: '2675 7711', capacity: 270, facilities: '避寒防霜專用 · 暖爐 · 熱水 · 防浸儲備', cachedAtEpochMs: 0 },
  { id: 'sh_tp_1', nameTc: '大埔社區中心臨時庇護中心', nameEn: 'Tai Po Community Centre', district: '大埔區', address: '大埔鄉事會街2號', shelterType: 'COLD / TYPHOON', latitude: 22.4519, longitude: 114.1656, phone: '2658 4412', capacity: 280, facilities: '無障礙通道 · 備用發電機 · 飲用水 · 毛氈', cachedAtEpochMs: 0 },
  { id: 'sh_st_1', nameTc: '隆亨社區中心臨時庇護中心', nameEn: 'Lung Hang Community Centre', district: '沙田區', address: '沙田大圍隆亨邨', shelterType: 'COLD / HEAT / TYPHOON', latitude: 22.3694, longitude: 114.1795, phone: '2601 8722', capacity: 260, facilities: '無障礙通道 · 急救站 · 飲用水 · 充電插座', cachedAtEpochMs: 0 },
  { id: 'sh_sk_1', nameTc: '坑口社區會堂臨時庇護中心', nameEn: 'Hang Hau Community Hall', district: '西貢區', address: '將軍澳培成路38號', shelterType: 'TYPHOON / HEAT', latitude: 22.3168, longitude: 114.2654, phone: '2706 6090', capacity: 250, facilities: '防風防湧浪配置 · 無障礙通道 · 飲用水', cachedAtEpochMs: 0 },
  { id: 'sh_is_1', nameTc: '東涌社區會堂臨時庇護中心', nameEn: 'Tung Chung Community Hall', district: '離島區', address: '東涌文東路39號', shelterType: 'TYPHOON / COLD', latitude: 22.2912, longitude: 113.9445, phone: '2109 0501', capacity: 240, facilities: '防風抗災配置 · 備用電源 · 飲用水 · 急救箱', cachedAtEpochMs: 0 },
  { id: 'sh_is_2', nameTc: '長洲體育館臨時庇護中心', nameEn: 'Cheung Chau Sports Centre Shelter', district: '離島區', address: '長洲南蛇塘醫院路', shelterType: 'TYPHOON / COLD', latitude: 22.2089, longitude: 114.0315, phone: '2981 6285', capacity: 190, facilities: '離島應急物資 · 備用電源 · 飲用水 · 急救箱', cachedAtEpochMs: 0 },
];
