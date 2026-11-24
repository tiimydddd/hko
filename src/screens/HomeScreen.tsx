import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  BookmarkPlus,
  Droplets,
  LocateFixed,
  Map,
  Play,
  RefreshCw,
  Share2,
  Snowflake,
  Square,
  Sun,
} from 'lucide-react';
import {
  ImpactTimelineMatrixCard,
  MultiDayOutlookCard,
  UnofficialWarningProbabilityPanel,
} from '../components/MetWarnForecastCards';
import { WeatherAtmosphereCanvas } from '../components/WeatherAtmosphereCanvas';
import { EasAudioEngine } from '../services/easAudio';
import { cardSurfaceStyle, useStcaUi } from '../theme/themeConfig';
import {
  EAS_TONE_META,
  type UiState,
  type UserPreferences,
  type WeatherSnapshot,
} from '../types/weather';

interface HomeScreenProps {
  weatherState: UiState<WeatherSnapshot>;
  prefs: UserPreferences;
  onRefresh: () => void;
  onRequestLocation: () => void;
  onExportReport: (snap: WeatherSnapshot) => void;
  onSaveSnapshot: () => void;
  onOpenEasTab: () => void;
  onOpenShelterMap: () => void;
  onTriggerEasPopup: () => void;
}

export function HomeScreen({
  weatherState,
  prefs,
  onRefresh,
  onRequestLocation,
  onExportReport,
  onSaveSnapshot,
  onOpenEasTab,
  onOpenShelterMap,
  onTriggerEasPopup,
}: HomeScreenProps) {
  const ui = useStcaUi();
  const [isPlayingAudio, setIsPlayingAudio] = useState(EasAudioEngine.getIsPlaying());

  useEffect(() => EasAudioEngine.subscribe(setIsPlayingAudio), []);

  if (weatherState.status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 p-6">
        <div
          style={{ borderColor: `${ui.palette.primary} transparent ${ui.palette.primary} ${ui.palette.primary}` }}
          className="w-10 h-10 rounded-full border-4 animate-spin"
        />
        <p className="text-sm font-medium opacity-80">正在同步香港天文台實時數據...</p>
      </div>
    );
  }

  if (weatherState.status === 'error') {
    return (
      <div className="max-w-xl mx-auto p-6">
        <div
          style={{
            backgroundColor: ui.palette.errorContainer,
            color: ui.palette.onErrorContainer,
            borderRadius: `${ui.cardRadiusPx}px`,
          }}
          className="p-6 space-y-4"
        >
          <h2 className="text-xl font-bold">未能取得實時氣象</h2>
          <p className="text-sm">{weatherState.message}</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onRefresh}
              className="px-4 py-2 rounded-xl bg-white/80 text-slate-900 font-semibold text-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              重試連線
            </button>
            <button
              type="button"
              onClick={onOpenEasTab}
              className="px-4 py-2 rounded-xl border border-current font-semibold text-sm"
            >
              前往 SMS 離線接收
            </button>
          </div>
        </div>
      </div>
    );
  }

  const snap = weatherState.data;
  const inQuiet = EasAudioEngine.isWithinQuietHours(prefs);
  const hasHkoWarning = snap.activeWarnings.length > 0;
  const activeEasTone = hasHkoWarning ? 'HKO_MP3' : prefs.easToneType;

  const toggleAudio = () => {
    if (isPlayingAudio) {
      EasAudioEngine.stop();
    } else {
      EasAudioEngine.playAlertTone(activeEasTone, 0.85, 6);
    }
  };

  const quickChipsProps = {
    onExportReport: () => onExportReport(snap),
    onSaveSnapshot,
    onOpenShelterMap,
    onTriggerEasPopup,
  };

  const maxRainNow = snap.rainfallStations.length
    ? Math.max(...snap.rainfallStations.map((r) => r.max))
    : 0;

  return (
    <div className={`max-w-5xl mx-auto ${ui.paddingClass} ${ui.spacingClass}`}>
      {/* 1. Primary Hero Section adapted per AppLayoutStyle */}
      {ui.appLayout === 'APPLE_WEATHER_GLASS' && (
        <div className="space-y-3">
          <div className="relative pt-4 pb-1 text-center text-white space-y-1.5">
            <div className="absolute top-0 right-0 flex items-center gap-1">
              <button
                type="button"
                onClick={onRequestLocation}
                aria-label="定位目前地區"
                className="p-2 rounded-full hover:bg-white/15 transition"
              >
                <LocateFixed className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onRefresh}
                aria-label="重新整理氣象"
                className="p-2 rounded-full hover:bg-white/15 transition"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xl font-semibold">{snap.selectedDistrict}</p>
            <p className="text-7xl font-thin tracking-tight">{snap.currentTemp.toFixed(1)}°</p>
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 border border-white/30 text-xs font-semibold">
              {snap.weatherScene.titleTc} · 最高 {snap.highestStation ? snap.highestStation.value.toFixed(1) : '--'}° /
              最低 {snap.lowestStation ? snap.lowestStation.value.toFixed(1) : '--'}°
            </span>
            <p className="text-[11px] text-white/80">
              {snap.nearestStationName}觀測站 · 更新 {snap.updatedAtText}
            </p>
          </div>

          <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <GlassBentoCell label="相對濕度" value={`${snap.humidityPercent}%`} sub="全港平均濕度" />
              <GlassBentoCell label="紫外線指數" value={snap.uvIndex.toFixed(1)} sub={snap.uvDesc} />
              <GlassBentoCell
                label="空氣質素"
                value={`AQHI ${snap.maxAqhi}`}
                sub={
                  snap.aqhiStations.length
                    ? snap.aqhiStations.reduce((a, b) => (b.aqhi > a.aqhi ? b : a)).health_risk
                    : '一般'
                }
              />
              <GlassBentoCell
                label="最高時雨量"
                value={`${maxRainNow.toFixed(1)} mm`}
                sub={snap.rainfallStations[0]?.place ?? '本港'}
              />
            </div>

            {snap.nineDayForecast.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {snap.nineDayForecast.slice(0, 6).map((day) => (
                  <div
                    key={day.forecastDate}
                    className="min-w-[84px] rounded-xl bg-white/15 border border-white/25 px-2.5 py-2 text-center space-y-0.5 shrink-0"
                  >
                    <p className="text-[11px] font-bold">{day.week}</p>
                    <p className="text-xs font-extrabold">
                      {Math.trunc(day.forecastMintemp.value)}°–{Math.trunc(day.forecastMaxtemp.value)}°
                    </p>
                    <p className="text-[10px] opacity-80 truncate">{day.forecastWeather}</p>
                  </div>
                ))}
              </div>
            )}

            <HeroQuickChipsRow {...quickChipsProps} accentColor={snap.weatherScene.accentColor} />
          </div>
        </div>
      )}

      {ui.appLayout === 'TACTICAL_HUD' && (
        <div
          style={{
            borderRadius: `${ui.cardRadiusPx}px`,
            borderColor:
              hasHkoWarning || snap.currentTemp <= prefs.tempAlertThreshold ? '#EF4444' : '#F59E0B',
          }}
          className="bg-[#0E1014] text-white border-[1.5px] p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={`font-mono-telemetry text-xs font-bold ${
                  hasHkoWarning ? 'text-red-400' : 'text-amber-400'
                }`}
              >
                [STATUS] {snap.weatherScene.titleTc}
              </p>
              <h2 className="text-base font-bold">
                {snap.selectedDistrict} ({snap.nearestStationName})
              </h2>
            </div>
            <div className="flex gap-1 text-amber-400">
              <button type="button" onClick={onRequestLocation} aria-label="定位" className="p-2 rounded-lg hover:bg-white/10">
                <LocateFixed className="w-5 h-5" />
              </button>
              <button type="button" onClick={onRefresh} aria-label="刷新" className="p-2 rounded-lg hover:bg-white/10">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p
              className={`text-5xl font-extrabold font-mono-telemetry ${
                snap.currentTemp <= prefs.tempAlertThreshold ? 'text-sky-400' : 'text-amber-400'
              }`}
            >
              {snap.currentTemp.toFixed(1)}°C
            </p>
            <div
              className={`rounded-lg border px-3 py-1.5 text-right ${
                snap.currentTemp <= prefs.tempAlertThreshold
                  ? 'bg-red-900 border-red-500'
                  : 'bg-[#1F242D] border-slate-600'
              }`}
            >
              <p className="text-[11px] text-slate-300">
                低溫門檻 {prefs.tempAlertThreshold.toFixed(1)}°C
              </p>
              <p
                className={`text-xs font-bold ${
                  snap.currentTemp <= prefs.tempAlertThreshold ? 'text-red-200' : 'text-emerald-400'
                }`}
              >
                {snap.currentTemp <= prefs.tempAlertThreshold
                  ? '已觸發 EAS 警戒'
                  : `安全距 +${(snap.currentTemp - prefs.tempAlertThreshold).toFixed(1)}°C`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <TacticalActionTile
              icon={<Map className="w-4 h-4 text-emerald-400" />}
              label="離線庇護地圖"
              accent="#34D399"
              onClick={onOpenShelterMap}
            />
            <TacticalActionTile
              icon={<BellRing className="w-4 h-4 text-red-400" />}
              label="彈出 EAS 廣播"
              accent="#EF4444"
              onClick={onTriggerEasPopup}
            />
            <TacticalActionTile
              icon={
                isPlayingAudio ? (
                  <Square className="w-4 h-4 text-amber-400" />
                ) : (
                  <Play className="w-4 h-4 text-amber-400" />
                )
              }
              label={isPlayingAudio ? '停止警報音' : '實測警報音效'}
              accent="#F59E0B"
              onClick={toggleAudio}
            />
            <TacticalActionTile
              icon={<Share2 className="w-4 h-4 text-sky-400" />}
              label="一鍵匯出報告"
              accent="#38BDF8"
              onClick={() => onExportReport(snap)}
            />
            <TacticalActionTile
              icon={<BookmarkPlus className="w-4 h-4 text-violet-400" />}
              label="備份當日氣象紀錄"
              accent="#A78BFA"
              onClick={onSaveSnapshot}
            />
          </div>
        </div>
      )}

      {ui.appLayout === 'EDITORIAL_MAGAZINE' && (
        <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
          <div className="flex items-center justify-between gap-2">
            <span style={{ color: ui.palette.primary }} className="text-xs font-bold">
              今日氣象簡報 · {snap.weatherScene.titleTc}
            </span>
            <div className="flex gap-1">
              <button type="button" onClick={onRequestLocation} aria-label="定位" className="p-2 rounded-lg hover:bg-slate-500/10">
                <LocateFixed className="w-4 h-4" />
              </button>
              <button type="button" onClick={onRefresh} aria-label="刷新" className="p-2 rounded-lg hover:bg-slate-500/10">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-5xl font-light tracking-tight">{snap.currentTemp.toFixed(1)}°</span>
            <div style={{ backgroundColor: ui.palette.outline }} className="w-px h-14 opacity-70" />
            <div className="space-y-0.5">
              <p className="text-base font-bold">
                {snap.selectedDistrict} ({snap.nearestStationName})
              </p>
              <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
                濕度 {snap.humidityPercent}% · UV {snap.uvIndex.toFixed(1)} · AQHI {snap.maxAqhi}
              </p>
              <p style={{ color: ui.palette.onSurfaceVariant }} className="text-[11px]">
                更新時間：{snap.updatedAtText}
              </p>
            </div>
          </div>

          <hr style={{ borderColor: ui.palette.outline }} className="opacity-50" />

          <p className="text-sm leading-relaxed">
            {hasHkoWarning
              ? `現正生效：${snap.activeWarnings.map((w) => w.name).join('、')}，請留意安全並查看避災路線。`
              : `目前無生效警告，${snap.weatherScene.subtitleTc}。`}
          </p>

          <HeroQuickChipsRow {...quickChipsProps} accentColor={ui.palette.primary} />
        </div>
      )}

      {ui.appLayout === 'METEO_COMMAND' && (
        <div
          style={{
            borderRadius: `${ui.heroRadiusPx}px`,
            borderColor: `${snap.weatherScene.accentColor}A6`,
          }}
          className="bg-[#0A1F36] text-white border p-4 space-y-3 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                style={{
                  backgroundColor: `${snap.weatherScene.accentColor}38`,
                  color: snap.weatherScene.accentColor,
                }}
                className="px-2.5 py-1 rounded-md text-xs font-extrabold"
              >
                {snap.weatherScene.titleTc}
              </span>
              <span className="text-base font-bold">{snap.selectedDistrict}</span>
            </div>
            <div className="flex gap-1">
              <button type="button" onClick={onRequestLocation} aria-label="定位" className="p-2 rounded-lg hover:bg-white/10">
                <LocateFixed className="w-4 h-4" />
              </button>
              <button type="button" onClick={onRefresh} aria-label="刷新" className="p-2 rounded-lg hover:bg-white/10">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            <TelemetryMetricPill label="氣溫" value={`${snap.currentTemp.toFixed(1)}°`} accent="#38BDF8" />
            <TelemetryMetricPill label="濕度" value={`${snap.humidityPercent}%`} accent="#5EEAD4" />
            <TelemetryMetricPill label="UV" value={snap.uvIndex.toFixed(0)} accent="#FBBF24" />
            <TelemetryMetricPill label="AQHI" value={String(snap.maxAqhi)} accent="#A78BFA" />
            <TelemetryMetricPill label="雨量" value={`${maxRainNow.toFixed(0)}mm`} accent="#60A5FA" />
          </div>

          <p className="text-xs text-slate-300">
            觀測站：{snap.nearestStationName} · {snap.weatherScene.subtitleTc} · {snap.updatedAtText}
          </p>

          <HeroQuickChipsRow {...quickChipsProps} accentColor={snap.weatherScene.accentColor} darkText={false} />
        </div>
      )}

      {ui.appLayout === 'CLASSIC_OBSERVATORY' && (
        <div
          style={{
            borderRadius: `${ui.heroRadiusPx}px`,
            background: `linear-gradient(180deg, ${snap.weatherScene.gradientColors.join(', ')})`,
          }}
          className="relative overflow-hidden text-white p-5 space-y-3 shadow-lg"
        >
          <WeatherAtmosphereCanvas scene={snap.weatherScene} />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span
                style={{ backgroundColor: `${snap.weatherScene.accentColor}3D` }}
                className="px-3 py-1 rounded-lg text-xs font-bold text-white"
              >
                {snap.weatherScene.titleTc}
              </span>
              <div className="flex gap-1">
                <button type="button" onClick={onRequestLocation} aria-label="定位" className="p-2 rounded-lg hover:bg-white/15">
                  <LocateFixed className="w-5 h-5" />
                </button>
                <button type="button" onClick={onRefresh} aria-label="刷新" className="p-2 rounded-lg hover:bg-white/15">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-6xl font-bold tracking-tight leading-none">
                  {snap.currentTemp.toFixed(1)}°
                </p>
                <p className="text-base font-medium text-white/90 mt-1">
                  {snap.selectedDistrict} · {snap.nearestStationName}
                </p>
              </div>

              {ui.isCompact || ui.themeStyle === 'RADAR_GLASS' ? (
                <div className="grid grid-cols-2 gap-1.5">
                  <HeroHudTile label="濕度" value={`${snap.humidityPercent}%`} />
                  <HeroHudTile label="UV" value={snap.uvDesc.split(' ')[0]} />
                  <HeroHudTile label="AQHI" value={String(snap.maxAqhi)} />
                  <HeroHudTile label="雨量" value={`${maxRainNow.toFixed(0)}mm`} />
                </div>
              ) : (
                <div className="text-right space-y-0.5 text-xs">
                  <p className="font-bold text-sky-200">濕度 {snap.humidityPercent}%</p>
                  <p className="text-white/85">UV {snap.uvDesc}</p>
                  <p className="text-white/85">AQHI {snap.maxAqhi}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-white/80">
              {snap.weatherScene.subtitleTc} · 更新: {snap.updatedAtText}
            </p>

            <HeroQuickChipsRow {...quickChipsProps} accentColor={snap.weatherScene.accentColor} darkText={false} />
          </div>
        </div>
      )}

      {/* 2. EAS Active Trigger Banner */}
      {(snap.easTriggers.length > 0 || hasHkoWarning) && (
        <div
          onClick={onTriggerEasPopup}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onTriggerEasPopup();
          }}
          style={{
            backgroundColor: inQuiet ? ui.palette.secondaryContainer : ui.palette.errorContainer,
            color: inQuiet ? ui.palette.onSecondaryContainer : ui.palette.onErrorContainer,
            borderRadius: `${ui.cardRadiusPx}px`,
            borderColor: inQuiet ? ui.palette.secondary : ui.palette.error,
          }}
          className="border p-4 flex items-center gap-3 cursor-pointer transition hover:brightness-95"
        >
          <BellRing className="w-7 h-7 shrink-0" />
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-bold">
              {inQuiet
                ? `EAS 警報觸發 (靜音時段 ${EasAudioEngine.formatQuietWindow(prefs)} 內不響)`
                : 'EAS 緊急天氣警報已啟動'}
            </p>
            <p className="text-xs">
              {(snap.easTriggers.length
                ? snap.easTriggers
                : snap.activeWarnings.map((w) => `${w.name} (${w.code})`)
              ).join(' · ')}
            </p>
            <p className="text-[11px] font-semibold">
              {hasHkoWarning
                ? '天文台警告生效中 · 已自動切換音效為 MP3 檔案 (eas_hko_warning.mp3)'
                : `目前音效：${EAS_TONE_META[activeEasTone].labelTc}`}
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleAudio();
            }}
            aria-label={isPlayingAudio ? '停止音效' : '播放音效'}
            className="w-11 h-11 rounded-xl bg-black/15 hover:bg-black/25 flex items-center justify-center shrink-0"
          >
            {isPlayingAudio ? <Square className="w-4 h-4" /> : <Play className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Scheme B prioritizes MetWarn cards immediately after Hero/EAS */}
      {ui.isMeteoCommand && (
        <div className={ui.spacingClass}>
          <UnofficialWarningProbabilityPanel
            assessments={snap.unofficialAssessments}
            updatedAtText={snap.updatedAtText}
          />
          {snap.impactTimeline && <ImpactTimelineMatrixCard matrix={snap.impactTimeline} />}
          {snap.multiDayOutlook && <MultiDayOutlookCard outlook={snap.multiDayOutlook} />}
        </div>
      )}

      {/* 3. Highest & Lowest Station Temperatures */}
      <div className="grid grid-cols-2 gap-3">
        <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-1.5`}>
          <div style={{ color: ui.palette.onSurfaceVariant }} className="flex items-center gap-1.5 text-xs font-semibold">
            <Sun className="w-4 h-4 text-orange-500" />
            <span>全港最高溫度站</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-orange-500">
            {snap.highestStation ? `${snap.highestStation.value.toFixed(1)}°C` : '--°C'}
          </p>
          <p className="text-sm font-medium">{snap.highestStation?.place ?? '暫無數據'}</p>
        </div>

        <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-1.5`}>
          <div style={{ color: ui.palette.onSurfaceVariant }} className="flex items-center gap-1.5 text-xs font-semibold">
            <Snowflake className="w-4 h-4 text-sky-400" />
            <span>全港最低溫度站</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-sky-400">
            {snap.lowestStation ? `${snap.lowestStation.value.toFixed(1)}°C` : '--°C'}
          </p>
          <p className="text-sm font-medium">{snap.lowestStation?.place ?? '暫無數據'}</p>
        </div>
      </div>

      {/* 4. Active Warnings & SWT */}
      {(snap.activeWarnings.length > 0 || snap.specialWeatherTips.length > 0) && (
        <div style={cardSurfaceStyle(ui, true)} className={`${ui.innerPaddingClass} space-y-2`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle style={{ color: ui.palette.tertiary }} className="w-4 h-4" />
            <span>天文台生效警告及特別提示</span>
          </div>
          {snap.activeWarnings.map((w) => (
            <p key={w.code} className="text-sm font-semibold">
              • {w.name} ({w.code}) · 發出：{w.issueTime.slice(0, 16)}
            </p>
          ))}
          {snap.specialWeatherTips.map((tip, idx) => (
            <p key={idx} style={{ color: ui.palette.onSurfaceVariant }} className="text-sm">
              ※ {tip.desc}
            </p>
          ))}
        </div>
      )}

      {/* 5. Real-Time Weather System Trackers */}
      {snap.trackers.length > 0 && (
        <div className="space-y-2.5">
          <h2 className={`text-lg font-bold ${ui.isGlassFullBleed ? 'text-white' : ''}`}>
            實時天氣系統追蹤 (幾時嚟？)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {snap.trackers.map((tr, idx) => {
              const badgeColor =
                tr.severityLevel === 2 ? '#EF4444' : tr.severityLevel === 1 ? '#F59E0B' : '#10B981';
              return (
                <div key={idx} style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-1.5`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold">{tr.systemName}</h3>
                    <span
                      style={{ backgroundColor: `${badgeColor}28`, color: badgeColor }}
                      className="px-2 py-0.5 rounded-md text-xs font-bold shrink-0"
                    >
                      {tr.statusBadge}
                    </span>
                  </div>
                  <p style={{ color: ui.palette.primary }} className="text-xs font-bold">
                    預計時間：{tr.etaEstimate}
                  </p>
                  <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs leading-relaxed">
                    {tr.detailText}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Non-Meteo schemes display MetWarn cards here */}
      {!ui.isMeteoCommand && (
        <div className={ui.spacingClass}>
          <UnofficialWarningProbabilityPanel
            assessments={snap.unofficialAssessments}
            updatedAtText={snap.updatedAtText}
          />
          {snap.impactTimeline && <ImpactTimelineMatrixCard matrix={snap.impactTimeline} />}
          {snap.multiDayOutlook && <MultiDayOutlookCard outlook={snap.multiDayOutlook} />}
        </div>
      )}

      {/* General Situation */}
      {snap.generalSituation && (
        <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-1.5`}>
          <div className="flex items-center gap-2 font-bold text-sm">
            <Droplets style={{ color: ui.palette.primary }} className="w-4 h-4" />
            <span>香港天氣概況</span>
          </div>
          <p className="text-sm leading-relaxed">{snap.generalSituation}</p>
          {snap.localForecast?.outlook && (
            <p style={{ color: ui.palette.onSurfaceVariant }} className="text-sm leading-relaxed">
              展望：{snap.localForecast.outlook}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function HeroQuickChipsRow({
  accentColor,
  darkText = true,
  onExportReport,
  onSaveSnapshot,
  onOpenShelterMap,
  onTriggerEasPopup,
}: {
  accentColor: string;
  darkText?: boolean;
  onExportReport: () => void;
  onSaveSnapshot: () => void;
  onOpenShelterMap: () => void;
  onTriggerEasPopup: () => void;
}) {
  const chipClass = darkText
    ? 'px-3 py-1.5 rounded-xl border border-slate-400/40 bg-slate-500/10 hover:bg-slate-500/20 text-xs font-semibold inline-flex items-center gap-1.5 transition'
    : 'px-3 py-1.5 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition';

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <button type="button" onClick={onExportReport} className={chipClass}>
        <Share2 className="w-3.5 h-3.5" style={{ color: accentColor }} />
        一鍵匯出報告
      </button>
      <button type="button" onClick={onSaveSnapshot} className={chipClass}>
        <BookmarkPlus className="w-3.5 h-3.5" style={{ color: accentColor }} />
        備份此紀錄
      </button>
      <button type="button" onClick={onOpenShelterMap} className={chipClass}>
        <Map className="w-3.5 h-3.5 text-emerald-400" />
        離線庇護地圖
      </button>
      <button type="button" onClick={onTriggerEasPopup} className={chipClass}>
        <BellRing className="w-3.5 h-3.5 text-red-400" />
        彈出 EAS
      </button>
    </div>
  );
}

function HeroHudTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/15 px-2.5 py-1 text-center">
      <p className="text-[10px] text-white/75">{label}</p>
      <p className="text-xs font-bold text-white">{value}</p>
    </div>
  );
}

function GlassBentoCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/25 p-2.5 space-y-0.5">
      <p className="text-[11px] opacity-75">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] opacity-75 truncate">{sub}</p>
    </div>
  );
}

function TelemetryMetricPill({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{ borderColor: `${accent}70` }}
      className="rounded-xl bg-[#132D4B] border py-2 px-1 text-center"
    >
      <p className="text-[10px] text-slate-400">{label}</p>
      <p style={{ color: accent }} className="text-sm font-extrabold truncate">
        {value}
      </p>
    </div>
  );
}

function TacticalActionTile({
  icon,
  label,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ borderColor: `${accent}B3` }}
      className="h-12 rounded-lg bg-[#171A21] hover:bg-[#1E222B] border px-3 flex items-center gap-2 text-xs font-bold text-white transition"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}
