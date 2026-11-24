import { useState } from 'react';
import {
  CheckCircle2,
  CloudDownload,
  CloudUpload,
  History,
  LogOut,
  Moon,
  Palette,
  RotateCcw,
  Search,
  Share2,
  Trash2,
} from 'lucide-react';
import { signInWithGoogle } from '../firebase/firebase';
import { cardSurfaceStyle, useStcaUi } from '../theme/themeConfig';
import {
  APP_LAYOUT_META,
  DARK_MODE_META,
  HK_DISTRICTS,
  UI_CORNER_META,
  UI_DENSITY_META,
  UI_NAV_META,
  UI_THEME_META,
  type AppLayoutStyle,
  type DarkModePref,
  type HistoricalClimateRow,
  type UiCardCornerStyle,
  type UiLayoutDensity,
  type UiNavBarStyle,
  type UiState,
  type UiThemeStyle,
  type UserPreferences,
  type WeatherHistoryRecord,
  type WeatherSnapshot,
} from '../types/weather';

interface SettingsHistoryScreenProps {
  userEmail: string;
  prefs: UserPreferences;
  weatherState: UiState<WeatherSnapshot>;
  historicalClimateState: UiState<HistoricalClimateRow[]>;
  savedHistoryState: UiState<WeatherHistoryRecord[]>;
  onQueryClimate: (
    dataType: 'CLMTEMP' | 'CLMRAIN',
    station: string,
    year: number | null,
    month: number | null
  ) => void;
  onSaveSnapshot: () => void;
  onDeleteHistory: (id: string) => void;
  onExportReport: (snap: WeatherSnapshot) => void;
  onBackupCloud: () => void;
  onRestoreCloud: () => void;
  onUpdatePrefs: (transform: (prev: UserPreferences) => UserPreferences) => void;
  onSignOut: () => void;
  onNotifyMessage: (msg: string) => void;
}

const CLIMATE_STATIONS: Array<[string, string]> = [
  ['HKO', '天文台'],
  ['KP', '京士柏'],
  ['SHA', '沙田'],
  ['TKL', '打鼓嶺'],
  ['CCH', '長洲'],
];

export function SettingsHistoryScreen({
  userEmail,
  prefs,
  weatherState,
  historicalClimateState,
  savedHistoryState,
  onQueryClimate,
  onSaveSnapshot,
  onDeleteHistory,
  onExportReport,
  onBackupCloud,
  onRestoreCloud,
  onUpdatePrefs,
  onSignOut,
  onNotifyMessage,
}: SettingsHistoryScreenProps) {
  const ui = useStcaUi();
  const [selectedDataType, setSelectedDataType] = useState<'CLMTEMP' | 'CLMRAIN'>('CLMTEMP');
  const [selectedStation, setSelectedStation] = useState('HKO');
  const [yearInput, setYearInput] = useState('2025');
  const [monthInput, setMonthInput] = useState('11');
  const [authBusy, setAuthBusy] = useState(false);

  const snap = weatherState.status === 'success' ? weatherState.data : null;

  const handleGoogleSignIn = async () => {
    setAuthBusy(true);
    try {
      await signInWithGoogle();
      onNotifyMessage('已連結 Google 雲端同步帳戶');
    } catch (err) {
      onNotifyMessage(err instanceof Error ? err.message : 'Google 登入失敗或已取消');
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${ui.paddingClass} ${ui.spacingClass}`}>
      {/* 0A. Whole-App Architectural Redesign Schemes */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center gap-2.5">
          <Palette style={{ color: ui.palette.primary }} className="w-5 h-5 shrink-0" />
          <div>
            <h2 className="text-base font-bold">全 App 風格改造方案（一鍵整機變身）</h2>
            <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
              即時更改全螢幕背景、首頁排布、導航列及警報視窗風格
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {(Object.keys(APP_LAYOUT_META) as AppLayoutStyle[]).map((layout) => {
            const meta = APP_LAYOUT_META[layout];
            const isSelected = prefs.appLayoutStyle === layout;
            const swatches = UI_THEME_META[meta.recommendedTheme].swatches;
            return (
              <button
                key={layout}
                type="button"
                onClick={() => {
                  onUpdatePrefs((prev) => ({
                    ...prev,
                    appLayoutStyle: layout,
                    uiThemeStyle: meta.recommendedTheme,
                    uiCardCorner: meta.recommendedCorner,
                    uiDensity: meta.recommendedDensity,
                    uiNavBarStyle: meta.recommendedNavBar,
                    darkModePref: meta.recommendedDarkMode,
                    useDynamicColor: false,
                  }));
                  onNotifyMessage(`已切換至${meta.shortCode}：${meta.labelTc}`);
                }}
                style={{
                  backgroundColor: isSelected
                    ? `${ui.palette.primaryContainer}B8`
                    : `${ui.subtleBg}A6`,
                  borderColor: isSelected ? ui.palette.primary : `${ui.palette.outline}59`,
                  borderWidth: isSelected ? '2px' : '1px',
                }}
                className="w-full text-left rounded-2xl border p-3 space-y-1 transition hover:brightness-105"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      style={
                        isSelected
                          ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                          : {
                              backgroundColor: ui.palette.secondaryContainer,
                              color: ui.palette.onSecondaryContainer,
                            }
                      }
                      className="px-2 py-0.5 rounded-md text-[11px] font-extrabold"
                    >
                      {meta.shortCode}
                    </span>
                    <span className="text-sm font-bold">{meta.labelTc}</span>
                    <span
                      style={{
                        backgroundColor: `${ui.palette.tertiaryContainer}B3`,
                        color: ui.palette.onTertiaryContainer,
                      }}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold"
                    >
                      {meta.badgeTc}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {swatches.map((hex) => (
                      <span
                        key={hex}
                        style={{ backgroundColor: hex }}
                        className="w-2.5 h-2.5 rounded-full inline-block"
                      />
                    ))}
                    {isSelected && (
                      <CheckCircle2 style={{ color: ui.palette.primary }} className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
                  {meta.descTc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 0B. Fine-Grained UI Theme & Layout Studio */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3.5`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <Palette style={{ color: ui.palette.primary }} className="w-5 h-5" />
            <span>進階細節混搭微調 (配色・圓角・密度)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdatePrefs((prev) => ({
                ...prev,
                appLayoutStyle: 'CLASSIC_OBSERVATORY',
                uiThemeStyle: 'OBSERVATORY_COMMAND',
                uiCardCorner: 'ROUNDED',
                uiDensity: 'STANDARD',
                uiNavBarStyle: 'CLASSIC',
                darkModePref: 'SYSTEM',
                useDynamicColor: false,
              }));
              onNotifyMessage('已重設為預設經典風格');
            }}
            style={{ color: ui.palette.primary }}
            className="text-xs font-bold inline-flex items-center gap-1 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重設預設
          </button>
        </div>

        {/* Live Mini Preview */}
        <div
          style={{
            backgroundColor: ui.palette.primaryContainer,
            color: ui.palette.onPrimaryContainer,
            borderRadius: `${ui.cardRadiusPx}px`,
            borderColor: `${ui.palette.primary}66`,
          }}
          className="border p-3 flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">
              {APP_LAYOUT_META[prefs.appLayoutStyle].shortCode} (
              {APP_LAYOUT_META[prefs.appLayoutStyle].labelTc}) ·{' '}
              {UI_THEME_META[prefs.uiThemeStyle].labelTc}
            </p>
            <p className="text-[11px] opacity-80">
              {UI_CORNER_META[prefs.uiCardCorner].labelTc} ·{' '}
              {UI_DENSITY_META[prefs.uiDensity].labelTc} ·{' '}
              {UI_NAV_META[prefs.uiNavBarStyle].labelTc}
            </p>
          </div>
          <span
            style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
            className="px-3 py-1 rounded-full text-xs font-bold shrink-0"
          >
            22.5°C
          </span>
        </div>

        {/* 6 Presets */}
        <div className="space-y-2">
          <p className="text-xs font-bold">1. 選擇介面配色與質感 (6 款預設)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.keys(UI_THEME_META) as UiThemeStyle[]).map((styleKey) => {
              const meta = UI_THEME_META[styleKey];
              const isSelected = prefs.uiThemeStyle === styleKey;
              return (
                <button
                  key={styleKey}
                  type="button"
                  onClick={() =>
                    onUpdatePrefs((prev) => ({
                      ...prev,
                      uiThemeStyle: styleKey,
                      useDynamicColor: false,
                    }))
                  }
                  style={{
                    backgroundColor: isSelected
                      ? `${ui.palette.primaryContainer}A6`
                      : `${ui.palette.surfaceVariant}80`,
                    borderColor: isSelected ? ui.palette.primary : `${ui.palette.outline}59`,
                    borderWidth: isSelected ? '2px' : '1px',
                  }}
                  className="text-left rounded-2xl border p-2.5 space-y-1 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {meta.swatches.map((hex) => (
                        <span
                          key={hex}
                          style={{ backgroundColor: hex }}
                          className="w-3 h-3 rounded-full"
                        />
                      ))}
                    </div>
                    {isSelected && (
                      <CheckCircle2 style={{ color: ui.palette.primary }} className="w-4 h-4" />
                    )}
                  </div>
                  <p className="text-xs font-bold">{meta.labelTc}</p>
                  <p style={{ color: ui.palette.onSurfaceVariant }} className="text-[11px] line-clamp-2">
                    {meta.descTc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Corner Radius */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold">2. 卡片圓角造型</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(UI_CORNER_META) as UiCardCornerStyle[]).map((corner) => {
              const active = prefs.uiCardCorner === corner;
              return (
                <button
                  key={corner}
                  type="button"
                  onClick={() => onUpdatePrefs((p) => ({ ...p, uiCardCorner: corner }))}
                  style={
                    active
                      ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                      : { borderColor: ui.palette.outline }
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    active ? 'border-transparent' : ''
                  }`}
                >
                  {UI_CORNER_META[corner].labelTc}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Density */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold">
            3. 資訊排版密度 ({UI_DENSITY_META[prefs.uiDensity].descTc})
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(UI_DENSITY_META) as UiLayoutDensity[]).map((density) => {
              const active = prefs.uiDensity === density;
              return (
                <button
                  key={density}
                  type="button"
                  onClick={() => onUpdatePrefs((p) => ({ ...p, uiDensity: density }))}
                  style={
                    active
                      ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                      : { borderColor: ui.palette.outline }
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    active ? 'border-transparent' : ''
                  }`}
                >
                  {UI_DENSITY_META[density].labelTc}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nav Bar Style */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold">4. 底部導航列風格</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(UI_NAV_META) as UiNavBarStyle[]).map((navStyle) => {
              const active = prefs.uiNavBarStyle === navStyle;
              return (
                <button
                  key={navStyle}
                  type="button"
                  onClick={() => onUpdatePrefs((p) => ({ ...p, uiNavBarStyle: navStyle }))}
                  style={
                    active
                      ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                      : { borderColor: ui.palette.outline }
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    active ? 'border-transparent' : ''
                  }`}
                >
                  {UI_NAV_META[navStyle].labelTc}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 1. Dark Mode & 18-District Selector */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center gap-2 font-bold text-base">
          <Moon style={{ color: ui.palette.primary }} className="w-5 h-5" />
          <span>夜間護眼暗黑模式與預設地區</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(DARK_MODE_META) as DarkModePref[]).map((mode) => {
            const active = prefs.darkModePref === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onUpdatePrefs((p) => ({ ...p, darkModePref: mode }))}
                style={
                  active
                    ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                    : { borderColor: ui.palette.outline }
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  active ? 'border-transparent' : ''
                }`}
              >
                {DARK_MODE_META[mode].labelTc}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-bold">預設監測地區 ({prefs.selectedDistrict})</p>
        <div className="flex flex-wrap gap-1.5">
          {HK_DISTRICTS.map((d) => {
            const active = prefs.selectedDistrict === d.districtTc;
            return (
              <button
                key={d.districtTc}
                type="button"
                onClick={() => onUpdatePrefs((p) => ({ ...p, selectedDistrict: d.districtTc }))}
                style={
                  active
                    ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                    : { borderColor: ui.palette.outline }
                }
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  active ? 'border-transparent font-bold' : ''
                }`}
              >
                {d.districtTc}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Export, Local Save & Optional Google Cloud Backup */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <h2 className="text-base font-bold">報告匯出、本機保存與雲端備份</h2>

        {userEmail ? (
          <div className="space-y-2.5">
            <p style={{ color: ui.palette.onSurfaceVariant }} className="text-sm">
              已連結 Google 帳戶：{userEmail}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onBackupCloud}
                style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
                className="h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2"
              >
                <CloudUpload className="w-4 h-4" />
                立即備份雲端
              </button>
              <button
                type="button"
                onClick={onRestoreCloud}
                style={{ borderColor: ui.palette.outline }}
                className="h-11 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2"
              >
                <CloudDownload className="w-4 h-4" />
                換機還原設定
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="relative h-28 rounded-xl overflow-hidden">
              <img src={`${import.meta.env.BASE_URL}img_auth_hero.jpg`} alt="STCA 雲端同步" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex items-end p-3">
                <p className="text-xs text-slate-100 leading-relaxed">
                  目前為免登入模式（設定及紀錄均已於本機保存，無須登入即可完整使用）。如需換機同步雲端備份，才須選用登入：
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={!snap}
            onClick={() => snap && onExportReport(snap)}
            style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
            className="h-11 rounded-xl disabled:opacity-45 text-sm font-bold inline-flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            匯出分享氣象報告
          </button>
          <button
            type="button"
            disabled={!snap}
            onClick={onSaveSnapshot}
            style={{ borderColor: ui.palette.outline }}
            className="h-11 rounded-xl border disabled:opacity-45 text-sm font-semibold"
          >
            {userEmail ? '存檔至雲端歷史' : '存檔至本機歷史'}
          </button>
        </div>

        {userEmail ? (
          <button
            type="button"
            onClick={onSignOut}
            style={{ borderColor: ui.palette.outline }}
            className="w-full h-11 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            登出帳戶
          </button>
        ) : (
          <button
            type="button"
            disabled={authBusy}
            onClick={handleGoogleSignIn}
            className="w-full h-11 rounded-xl bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 disabled:opacity-60 text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm"
          >
            <span>{authBusy ? '正在連接 Google 帳戶...' : '使用 Google 帳戶登入 (選用雲端備份)'}</span>
          </button>
        )}
      </div>

      {/* 3. HKO Historical Climate Query */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center gap-2 font-bold text-base">
          <History style={{ color: ui.palette.primary }} className="w-5 h-5" />
          <span>歷史天氣查詢系統 (天文台歷史資料庫)</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedDataType('CLMTEMP')}
            style={
              selectedDataType === 'CLMTEMP'
                ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                : { borderColor: ui.palette.outline }
            }
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold"
          >
            每日平均氣溫
          </button>
          <button
            type="button"
            onClick={() => setSelectedDataType('CLMRAIN')}
            style={
              selectedDataType === 'CLMRAIN'
                ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                : { borderColor: ui.palette.outline }
            }
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold"
          >
            每日總雨量
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {CLIMATE_STATIONS.map(([code, name]) => {
            const active = selectedStation === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedStation(code)}
                style={
                  active
                    ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                    : { borderColor: ui.palette.outline }
                }
                className="px-3 py-1 rounded-xl border text-xs font-semibold"
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <label className="block space-y-1 text-xs font-semibold">
            <span>年份 (選填)</span>
            <input
              type="text"
              inputMode="numeric"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              style={{ borderColor: ui.palette.outline }}
              className="w-full h-10 px-3 rounded-xl border bg-transparent text-sm"
            />
          </label>
          <label className="block space-y-1 text-xs font-semibold">
            <span>月份 (1-12)</span>
            <input
              type="text"
              inputMode="numeric"
              value={monthInput}
              onChange={(e) => setMonthInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
              style={{ borderColor: ui.palette.outline }}
              className="w-full h-10 px-3 rounded-xl border bg-transparent text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            const y = parseInt(yearInput, 10);
            const m = parseInt(monthInput, 10);
            onQueryClimate(
              selectedDataType,
              selectedStation,
              Number.isNaN(y) ? null : y,
              !Number.isNaN(m) && m >= 1 && m <= 12 ? m : null
            );
          }}
          style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
          className="w-full h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          查詢 HKO 歷史氣象資料
        </button>

        {historicalClimateState.status === 'loading' && (
          <div className="py-4 flex justify-center">
            <div
              style={{ borderColor: `${ui.palette.primary} transparent ${ui.palette.primary} ${ui.palette.primary}` }}
              className="w-7 h-7 rounded-full border-4 animate-spin"
            />
          </div>
        )}
        {historicalClimateState.status === 'error' && (
          <p className="text-xs text-red-500">
            歷史查詢失敗：{historicalClimateState.message}
          </p>
        )}
        {historicalClimateState.status === 'success' && historicalClimateState.data.length > 0 && (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {historicalClimateState.data.slice(0, 15).map((row) => (
              <div
                key={`${row.date}-${row.station}`}
                style={{ backgroundColor: ui.subtleBg }}
                className="rounded-xl px-3.5 py-2 flex items-center justify-between text-sm"
              >
                <span>
                  {row.date} ({row.station})
                </span>
                <span className="font-bold font-mono-telemetry">
                  {row.value} {row.metricLabel.includes('mm') ? 'mm' : '°C'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Saved Weather History Snapshots */}
      <div className="space-y-2.5">
        <h2 className={`text-lg font-bold ${ui.isGlassFullBleed ? 'text-white' : ''}`}>
          {userEmail ? '雲端個人氣象歷史存檔' : '本機氣象歷史存檔'}
        </h2>

        {savedHistoryState.status === 'loading' && (
          <div className="py-4 flex justify-center">
            <div
              style={{ borderColor: `${ui.palette.primary} transparent ${ui.palette.primary} ${ui.palette.primary}` }}
              className="w-7 h-7 rounded-full border-4 animate-spin"
            />
          </div>
        )}

        {savedHistoryState.status === 'error' && (
          <p className="text-sm text-red-500">{savedHistoryState.message}</p>
        )}

        {savedHistoryState.status === 'success' && savedHistoryState.data.length === 0 && (
          <p
            style={{
              color: ui.isGlassFullBleed ? 'rgba(255,255,255,0.85)' : ui.palette.onSurfaceVariant,
            }}
            className="text-sm"
          >
            尚未有氣象存檔，可於首頁點擊「備份此紀錄」保存當日氣象。
          </p>
        )}

        {savedHistoryState.status === 'success' && savedHistoryState.data.length > 0 && (
          <div className="space-y-2.5">
            {savedHistoryState.data.map((rec) => (
              <div
                key={rec.id}
                style={cardSurfaceStyle(ui)}
                className="p-3.5 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">
                    {rec.recordDate} · {rec.district} ({rec.stationName})
                  </p>
                  <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
                    {rec.tempCelsius.toFixed(1)}°C · 濕度 {rec.humidityPercent}% · 雨量 {rec.rainfallMm}mm ·{' '}
                    {rec.activeWarnings}
                  </p>
                </div>
                {rec.id && (
                  <button
                    type="button"
                    onClick={() => onDeleteHistory(rec.id)}
                    aria-label="刪除紀錄"
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
