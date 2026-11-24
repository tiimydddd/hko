import { Droplets, LineChart, Sun, Wind } from 'lucide-react';
import { NineDayTempTrendChart, RegionalRainfallChart } from '../components/WeatherCharts';
import { cardSurfaceStyle, useStcaUi } from '../theme/themeConfig';
import type { UiState, UserPreferences, WeatherSnapshot } from '../types/weather';

interface AnalyticsScreenProps {
  weatherState: UiState<WeatherSnapshot>;
  prefs: UserPreferences;
}

export function AnalyticsScreen({ weatherState, prefs }: AnalyticsScreenProps) {
  const ui = useStcaUi();

  if (weatherState.status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div
          style={{ borderColor: `${ui.palette.primary} transparent ${ui.palette.primary} ${ui.palette.primary}` }}
          className="w-10 h-10 rounded-full border-4 animate-spin"
        />
      </div>
    );
  }

  if (weatherState.status === 'error') {
    return (
      <div className="max-w-xl mx-auto p-6 text-center text-sm">
        無法載入氣象圖表：{weatherState.message}
      </div>
    );
  }

  const snap = weatherState.data;
  const aqhiColor =
    snap.maxAqhi <= 3
      ? '#10B981'
      : snap.maxAqhi <= 6
      ? '#F59E0B'
      : snap.maxAqhi === 7
      ? '#F97316'
      : '#EF4444';

  const uvColor =
    snap.uvIndex <= 2.9
      ? '#10B981'
      : snap.uvIndex <= 5.9
      ? '#F59E0B'
      : snap.uvIndex <= 7.9
      ? '#F97316'
      : '#EF4444';

  const topAqhiStation = snap.aqhiStations.length
    ? snap.aqhiStations.reduce((a, b) => (b.aqhi > a.aqhi ? b : a))
    : null;

  return (
    <div className={`max-w-5xl mx-auto ${ui.paddingClass} ${ui.spacingClass}`}>
      {/* 1. 9-Day Temp Trend */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center gap-2 font-bold text-base">
          <LineChart style={{ color: ui.palette.primary }} className="w-5 h-5" />
          <span>九天溫度趨勢與 {Math.trunc(prefs.tempAlertThreshold)}°C 低溫警戒線</span>
        </div>
        {snap.nineDayForecast.length === 0 ? (
          <p style={{ color: ui.palette.onSurfaceVariant }} className="text-sm">
            離線 / SMS 模式下暫無九天圖表數據
          </p>
        ) : (
          <NineDayTempTrendChart
            forecast={snap.nineDayForecast}
            coldThreshold={prefs.tempAlertThreshold}
          />
        )}
      </div>

      {/* 2. AQHI & UV Index */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-1.5`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <Wind style={{ color: aqhiColor }} className="w-4 h-4" />
            <span>空氣質素健康指數</span>
          </div>
          <p style={{ color: aqhiColor }} className="text-3xl font-bold">
            AQHI {snap.maxAqhi}
          </p>
          <p style={{ color: ui.palette.onSurfaceVariant }} className="text-sm">
            {topAqhiStation ? `${topAqhiStation.station} · ${topAqhiStation.health_risk}` : '一般水平'}
          </p>
        </div>

        <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-1.5`}>
          <div className="flex items-center gap-2 text-xs font-bold">
            <Sun style={{ color: uvColor }} className="w-4 h-4" />
            <span>紫外線指數 (UV)</span>
          </div>
          <p style={{ color: uvColor }} className="text-3xl font-bold">
            {snap.uvIndex.toFixed(1)}
          </p>
          <p style={{ color: ui.palette.onSurfaceVariant }} className="text-sm">
            {snap.uvDesc}
          </p>
        </div>
      </div>

      {/* 3. Regional Rainfall */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center gap-2 font-bold text-base">
          <Droplets className="w-5 h-5 text-sky-400" />
          <span>全港各區實時雨量監測 (過去1小時 mm)</span>
        </div>
        {snap.rainfallStations.length === 0 ? (
          <p className="text-sm">暫無各區雨量數據</p>
        ) : (
          <RegionalRainfallChart rainfall={snap.rainfallStations} />
        )}
      </div>

      {/* 4. EPD AQHI Stations */}
      {snap.aqhiStations.length > 0 && (
        <div className="space-y-2.5">
          <h2 className={`text-lg font-bold ${ui.isGlassFullBleed ? 'text-white' : ''}`}>
            各區空氣質素監測站
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[...snap.aqhiStations]
              .sort((a, b) => b.aqhi - a.aqhi)
              .map((st) => (
                <div
                  key={st.station}
                  style={cardSurfaceStyle(ui)}
                  className="px-4 py-3 flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold">{st.station}</p>
                    <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
                      {st.health_risk}
                    </p>
                  </div>
                  <span
                    style={{
                      backgroundColor: ui.palette.primaryContainer,
                      color: ui.palette.onPrimaryContainer,
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold shrink-0"
                  >
                    AQHI {st.aqhi}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* 5. All HK Station Temperature Leaderboard */}
      <div className="space-y-2.5">
        <h2 className={`text-lg font-bold ${ui.isGlassFullBleed ? 'text-white' : ''}`}>
          全港氣象站實時氣溫排行榜
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {[...snap.allStations]
            .sort((a, b) => b.value - a.value)
            .map((st) => {
              const isMax = st.place === snap.highestStation?.place;
              const isMin = st.place === snap.lowestStation?.place;
              return (
                <div
                  key={st.place}
                  style={cardSurfaceStyle(ui)}
                  className="px-4 py-3 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{st.place}</span>
                    {isMax && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-500">
                        全港最高
                      </span>
                    )}
                    {isMin && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-400/20 text-sky-400">
                        全港最低
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold font-mono-telemetry">
                    {st.value.toFixed(1)}°C
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
