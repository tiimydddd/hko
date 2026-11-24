import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BellRing,
  Home,
  Map as MapIcon,
  Radio,
  RefreshCw,
  Settings,
  ShieldAlert,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { EasPopupDialog } from './components/EasPopupDialog';
import { WeatherAtmosphereCanvas } from './components/WeatherAtmosphereCanvas';
import { auth, signOutUser } from './firebase/firebase';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { EasAlertScreen } from './screens/EasAlertScreen';
import { EmergencyShelterMapScreen } from './screens/EmergencyShelterMapScreen';
import { HomeScreen } from './screens/HomeScreen';
import { MapCommunityScreen } from './screens/MapCommunityScreen';
import { SettingsHistoryScreen } from './screens/SettingsHistoryScreen';
import { EasAudioEngine } from './services/easAudio';
import {
  detectNearestDistrict,
  exportAndShareWeatherReport,
  postWeatherAlertNotification,
  requestBrowserNotificationPermission,
} from './services/emergencyTools';
import {
  backupPreferencesToCloud,
  deleteCommunityReportFromCloud,
  deleteHistorySnapshotFromCloud,
  deleteLocalHistoryRecord,
  deleteLocalReport,
  loadLocalHistory,
  loadLocalPreferences,
  loadLocalReports,
  loadOfflineShelters,
  observePublicCommunityReports,
  observeWeatherHistory,
  refreshAndVerifyOfflineShelterCache,
  restorePreferencesFromCloud,
  saveHistorySnapshotToCloud,
  saveLocalHistoryRecord,
  saveLocalPreferences,
  saveLocalReport,
  submitCommunityReportToCloud,
} from './services/storage';
import {
  buildSnapshotFromSmsPacket,
  fetchHistoricalClimate,
  fetchLiveWeather,
} from './services/weatherApi';
import {
  applyThemeCssVariables,
  buildStcaUiConfig,
  StcaUiContext,
} from './theme/themeConfig';
import {
  HK_DISTRICTS,
  type CommunityReport,
  type HazardType,
  type HistoricalClimateRow,
  type ReportSeverity,
  type ShelterCacheStatus,
  type ShelterLocation,
  type UiState,
  type UserPreferences,
  type WeatherHistoryRecord,
  type WeatherSnapshot,
} from './types/weather';

type RouteId = 'HOME' | 'EAS' | 'ANALYTICS' | 'MAP_COMMUNITY' | 'SHELTER_MAP' | 'SETTINGS';

const NAV_TABS: Array<{ id: Exclude<RouteId, 'SHELTER_MAP'>; label: string; icon: typeof Home }> = [
  { id: 'HOME', label: '氣象', icon: Home },
  { id: 'EAS', label: 'EAS', icon: BellRing },
  { id: 'ANALYTICS', label: '圖表', icon: BarChart3 },
  { id: 'MAP_COMMUNITY', label: '避災', icon: MapIcon },
  { id: 'SETTINGS', label: '設定', icon: Settings },
];

export function App() {
  const [route, setRoute] = useState<RouteId>('HOME');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadLocalPreferences());
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const [weatherState, setWeatherState] = useState<UiState<WeatherSnapshot>>({ status: 'loading' });
  const [historicalClimateState, setHistoricalClimateState] = useState<
    UiState<HistoricalClimateRow[]>
  >({ status: 'success', data: [] });
  const [savedHistoryState, setSavedHistoryState] = useState<UiState<WeatherHistoryRecord[]>>(() => ({
    status: 'success',
    data: loadLocalHistory(),
  }));
  const [reportsState, setReportsState] = useState<UiState<CommunityReport[]>>(() => ({
    status: 'success',
    data: loadLocalReports(),
  }));

  const initialShelters = useMemo(() => loadOfflineShelters(), []);
  const [shelters, setShelters] = useState<ShelterLocation[]>(initialShelters.shelters);
  const [cacheStatus, setCacheStatus] = useState<ShelterCacheStatus>(initialShelters.status);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [easPopupSnapshot, setEasPopupSnapshot] = useState<WeatherSnapshot | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toastTimerRef = useRef<number | null>(null);
  const lastAutoPlayedSigRef = useRef<string | null>(null);
  const lastDismissedPopupSigRef = useRef<string | null>(null);
  const prefsRef = useRef<UserPreferences>(prefs);
  prefsRef.current = prefs;

  const notifyMessage = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 3800);
  }, []);

  // System dark mode + online status listeners
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onThemeChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', onThemeChange);

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      mq.removeEventListener('change', onThemeChange);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const uiConfig = useMemo(
    () => buildStcaUiConfig(prefs, systemPrefersDark),
    [prefs, systemPrefersDark]
  );

  useEffect(() => {
    applyThemeCssVariables(uiConfig);
  }, [uiConfig]);

  const updatePrefs = useCallback((transform: (prev: UserPreferences) => UserPreferences) => {
    setPrefs((prev) => {
      const next = transform(prev);
      saveLocalPreferences(next);
      return next;
    });
  }, []);

  // Firebase Auth listener + Cloud Firestore sync
  useEffect(() => {
    let unsubHistory: (() => void) | null = null;
    let unsubReports: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubHistory) {
        unsubHistory();
        unsubHistory = null;
      }
      if (unsubReports) {
        unsubReports();
        unsubReports = null;
      }

      setAuthUser(user);

      if (user) {
        try {
          const restored = await restorePreferencesFromCloud(user.uid, prefsRef.current);
          if (restored) {
            setPrefs(restored);
            saveLocalPreferences(restored);
          } else {
            updatePrefs((p) => ({
              ...p,
              userId: user.uid,
              displayName: user.displayName || p.displayName,
            }));
          }
        } catch {
          // ignore initial cloud read failure and stay functional with local prefs
        }

        unsubHistory = observeWeatherHistory(user.uid, (records) => {
          setSavedHistoryState({ status: 'success', data: records });
        });
        unsubReports = observePublicCommunityReports((reports) => {
          setReportsState({ status: 'success', data: reports });
        });
      } else {
        setSavedHistoryState({ status: 'success', data: loadLocalHistory() });
        setReportsState({ status: 'success', data: loadLocalReports() });
      }
    });

    return () => {
      unsubAuth();
      if (unsubHistory) unsubHistory();
      if (unsubReports) unsubReports();
    };
  }, [updatePrefs]);

  // Evaluate EAS trigger signature, HKO MP3 auto-switch, popup & quiet-hours audio
  const evaluateEasAndAlerts = useCallback(
    (snapshot: WeatherSnapshot, currentPrefs: UserPreferences) => {
      const hasHkoWarning = snapshot.activeWarnings.length > 0;
      let effectiveTone = currentPrefs.easToneType;

      if (hasHkoWarning && currentPrefs.easToneType !== 'HKO_MP3') {
        effectiveTone = 'HKO_MP3';
        updatePrefs((p) => ({ ...p, easToneType: 'HKO_MP3' }));
      }

      if (snapshot.easTriggers.length > 0 || hasHkoWarning) {
        const sig = `${snapshot.easTriggers.join('|')}|${snapshot.activeWarnings.map((w) => w.code).join(',')}`;
        if (lastDismissedPopupSigRef.current !== sig) {
          setEasPopupSnapshot(snapshot);
        }
        const inQuiet = EasAudioEngine.isWithinQuietHours(currentPrefs);
        if (currentPrefs.easAutoPlay && !inQuiet && lastAutoPlayedSigRef.current !== sig) {
          lastAutoPlayedSigRef.current = sig;
          EasAudioEngine.playAlertTone(effectiveTone, 0.85, 6);
        }
        postWeatherAlertNotification(snapshot, currentPrefs);
      } else {
        lastAutoPlayedSigRef.current = null;
        lastDismissedPopupSigRef.current = null;
      }
    },
    [updatePrefs]
  );

  const refreshWeather = useCallback(
    async (silent = false) => {
      if (!silent) {
        setWeatherState((prev) => (prev.status === 'success' ? prev : { status: 'loading' }));
      }
      try {
        const p = prefsRef.current;
        const snap = await fetchLiveWeather(p.selectedDistrict, p.tempAlertThreshold);
        setWeatherState({ status: 'success', data: snap });
        evaluateEasAndAlerts(snap, p);
      } catch (err) {
        setWeatherState({
          status: 'error',
          message: err instanceof Error ? err.message : '無法取得香港天文台數據',
        });
      }
    },
    [evaluateEasAndAlerts]
  );

  // Initial weather load + re-evaluate on district/threshold change
  useEffect(() => {
    void refreshWeather(true);
  }, [prefs.selectedDistrict, prefs.tempAlertThreshold, refreshWeather]);

  // 15-minute background telemetry poll when autoPushEnabled is active
  useEffect(() => {
    if (!prefs.autoPushEnabled) return;
    const timer = window.setInterval(() => {
      void refreshWeather(true);
    }, 15 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [prefs.autoPushEnabled, refreshWeather]);

  const handleRequestLocation = useCallback(async () => {
    try {
      const res = await detectNearestDistrict();
      setUserCoords([res.latitude, res.longitude]);
      updatePrefs((p) => ({ ...p, selectedDistrict: res.nearestDistrict.districtTc }));
      notifyMessage(`已定位至：${res.nearestDistrict.districtTc}`);
    } catch (err) {
      notifyMessage(err instanceof Error ? err.message : '定位失敗');
    }
  }, [notifyMessage, updatePrefs]);

  const handleExportReport = useCallback(
    async (snap: WeatherSnapshot) => {
      try {
        const msg = await exportAndShareWeatherReport(snap);
        notifyMessage(msg);
      } catch (err) {
        notifyMessage(err instanceof Error ? err.message : '匯出報告失敗');
      }
    },
    [notifyMessage]
  );

  const handleSaveSnapshot = useCallback(async () => {
    if (weatherState.status !== 'success') {
      notifyMessage('尚未有即時天氣數據可儲存');
      return;
    }
    const snap = weatherState.data;
    const maxRain = snap.rainfallStations.length
      ? Math.max(...snap.rainfallStations.map((r) => r.max))
      : 0;
    const warnsText = snap.activeWarnings.length
      ? snap.activeWarnings.map((w) => w.name).join('、')
      : '無生效警告';

    const record: Omit<WeatherHistoryRecord, 'id'> = {
      userId: authUser?.uid || 'guest_local',
      stationName: snap.nearestStationName,
      district: snap.selectedDistrict,
      recordDate: snap.updatedAtText.split(' ')[0] || new Date().toISOString().slice(0, 10),
      tempCelsius: snap.currentTemp,
      maxTempCelsius: snap.highestStation?.value ?? snap.currentTemp,
      minTempCelsius: snap.lowestStation?.value ?? snap.currentTemp,
      humidityPercent: snap.humidityPercent,
      rainfallMm: maxRain,
      uvIndex: snap.uvIndex,
      aqhiLevel: snap.maxAqhi,
      activeWarnings: warnsText,
      summaryNote: snap.generalSituation.slice(0, 200) || undefined,
    };

    if (authUser) {
      try {
        await saveHistorySnapshotToCloud(authUser.uid, record);
        notifyMessage('已將氣象快照同步至雲端紀錄');
      } catch (err) {
        notifyMessage(err instanceof Error ? err.message : '雲端儲存失敗');
      }
    } else {
      const next = saveLocalHistoryRecord(record);
      setSavedHistoryState({ status: 'success', data: next });
      notifyMessage('已儲存至本機氣象快照紀錄');
    }
  }, [authUser, notifyMessage, weatherState]);

  const handleDeleteHistory = useCallback(
    async (id: string) => {
      if (authUser) {
        try {
          await deleteHistorySnapshotFromCloud(authUser.uid, id);
          notifyMessage('已刪除雲端氣象紀錄');
        } catch (err) {
          notifyMessage(err instanceof Error ? err.message : '刪除紀錄失敗');
        }
      } else {
        const next = deleteLocalHistoryRecord(id);
        setSavedHistoryState({ status: 'success', data: next });
        notifyMessage('已刪除本機氣象紀錄');
      }
    },
    [authUser, notifyMessage]
  );

  const handleDecodeSmsPacket = useCallback(
    (raw: string) => {
      try {
        const snap = buildSnapshotFromSmsPacket(
          raw,
          prefsRef.current.selectedDistrict,
          prefsRef.current.tempAlertThreshold
        );
        setWeatherState({ status: 'success', data: snap });
        evaluateEasAndAlerts(snap, prefsRef.current);
        notifyMessage('已成功解碼 SMS 離線氣象封包');
      } catch (err) {
        notifyMessage(err instanceof Error ? err.message : 'SMS 解碼失敗');
      }
    },
    [evaluateEasAndAlerts, notifyMessage]
  );

  const handleRequestPushPermission = useCallback(async () => {
    const perm = await requestBrowserNotificationPermission();
    if (perm === 'granted') {
      notifyMessage('瀏覽器系統通知已啟用');
      if (weatherState.status === 'success') {
        postWeatherAlertNotification(weatherState.data, prefsRef.current);
      }
    } else if (perm === 'denied') {
      notifyMessage('瀏覽器封鎖了通知權限，請於網址列網站設定手動開啟');
    } else {
      notifyMessage('此瀏覽器環境不支援桌面推送通知');
    }
  }, [notifyMessage, weatherState]);

  const handleSubmitReport = useCallback(
    async (
      district: string,
      hazard: HazardType,
      severity: ReportSeverity,
      waterDepthCm: number,
      desc: string
    ) => {
      const distCoord = HK_DISTRICTS.find((d) => d.districtTc === district) ?? HK_DISTRICTS[4];
      const lat = userCoords ? userCoords[0] : distCoord.latitude;
      const lon = userCoords ? userCoords[1] : distCoord.longitude;
      const reportData: Omit<CommunityReport, 'id'> = {
        userId: authUser?.uid || 'guest_local',
        authorAlias: prefsRef.current.displayName || 'Citizen',
        district,
        hazardType: hazard,
        severity,
        waterDepthCm,
        description: desc,
        latitude: lat,
        longitude: lon,
        visibility: authUser ? 'PUBLIC' : 'LOCAL',
      };

      if (authUser) {
        try {
          await submitCommunityReportToCloud(authUser.uid, reportData);
          notifyMessage('已公開發佈社群災情回報');
        } catch (err) {
          notifyMessage(err instanceof Error ? err.message : '回報發佈失敗');
        }
      } else {
        const next = saveLocalReport(reportData);
        setReportsState({ status: 'success', data: next });
        notifyMessage('已發佈本機災情筆記（登入帳號可公開同步）');
      }
    },
    [authUser, notifyMessage, userCoords]
  );

  const handleDeleteReport = useCallback(
    async (id: string) => {
      if (authUser) {
        try {
          await deleteCommunityReportFromCloud(id);
          notifyMessage('已移除災情回報');
        } catch (err) {
          notifyMessage(err instanceof Error ? err.message : '移除回報失敗');
        }
      } else {
        const next = deleteLocalReport(id);
        setReportsState({ status: 'success', data: next });
        notifyMessage('已移除本機災情筆記');
      }
    },
    [authUser, notifyMessage]
  );

  const handleQueryClimate = useCallback(
    async (
      dataType: 'CLMTEMP' | 'CLMRAIN',
      station: string,
      year: number | null,
      month: number | null
    ) => {
      setHistoricalClimateState({ status: 'loading' });
      try {
        const rows = await fetchHistoricalClimate(dataType, station, year, month);
        setHistoricalClimateState({ status: 'success', data: rows });
      } catch (err) {
        setHistoricalClimateState({
          status: 'error',
          message: err instanceof Error ? err.message : '無法查詢歷史氣候資料',
        });
      }
    },
    []
  );

  const handleBackupCloud = useCallback(async () => {
    if (!authUser) {
      notifyMessage('請先登入 Google 帳號方可使用雲端備份');
      return;
    }
    try {
      await backupPreferencesToCloud(authUser.uid, prefsRef.current);
      notifyMessage('已備份設定至雲端資料庫');
    } catch (err) {
      notifyMessage(err instanceof Error ? err.message : '雲端備份失敗');
    }
  }, [authUser, notifyMessage]);

  const handleRestoreCloud = useCallback(async () => {
    if (!authUser) {
      notifyMessage('請先登入 Google 帳號方可使用雲端還原');
      return;
    }
    try {
      const restored = await restorePreferencesFromCloud(authUser.uid, prefsRef.current);
      if (restored) {
        setPrefs(restored);
        saveLocalPreferences(restored);
        notifyMessage('已從雲端還原個人設定');
      } else {
        notifyMessage('雲端尚未有您的設定備份');
      }
    } catch (err) {
      notifyMessage(err instanceof Error ? err.message : '雲端還原失敗');
    }
  }, [authUser, notifyMessage]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
      notifyMessage('已登出帳號，切換回本機訪客模式');
    } catch (err) {
      notifyMessage(err instanceof Error ? err.message : '登出失敗');
    }
  }, [notifyMessage]);

  const handleRefreshShelterCache = useCallback(() => {
    const res = refreshAndVerifyOfflineShelterCache();
    setShelters(res.shelters);
    setCacheStatus(res.status);
    notifyMessage(`已重新核對並離線快取 ${res.status.totalCachedCount} 間庇護中心`);
  }, [notifyMessage]);

  const triggerManualEasPopup = useCallback(() => {
    if (weatherState.status === 'success') {
      lastDismissedPopupSigRef.current = null;
      setEasPopupSnapshot(weatherState.data);
    } else {
      notifyMessage('請等待實時天氣載入完成');
    }
  }, [notifyMessage, weatherState]);

  const liveSnap = weatherState.status === 'success' ? weatherState.data : null;
  const isShelterFullMap = route === 'SHELTER_MAP';
  const showFloatingNav = uiConfig.navBarStyle === 'FLOATING_PILL';

  return (
    <StcaUiContext.Provider value={uiConfig}>
      <div
        style={{
          backgroundColor: uiConfig.isGlassFullBleed ? 'transparent' : uiConfig.palette.bg,
          color: uiConfig.palette.onBg,
        }}
        className="min-h-screen flex flex-col md:flex-row relative selection:bg-sky-500/30"
      >
        {/* Scheme A: Full-Bleed Animated Weather Atmosphere Canvas */}
        {uiConfig.isGlassFullBleed && liveSnap && (
          <div
            style={{
              background: `linear-gradient(160deg, ${liveSnap.weatherScene.gradientColors[0]}, ${liveSnap.weatherScene.gradientColors[1]}, ${liveSnap.weatherScene.gradientColors[2]})`,
            }}
            className="fixed inset-0 -z-10 pointer-events-none"
          >
            <WeatherAtmosphereCanvas scene={liveSnap.weatherScene} className="w-full h-full opacity-85" />
          </div>
        )}

        {/* Desktop Left Navigation Rail */}
        {!isShelterFullMap && (
          <aside
            style={{
              backgroundColor: uiConfig.isGlassFullBleed
                ? uiConfig.isDark
                  ? 'rgba(10, 20, 38, 0.72)'
                  : 'rgba(255, 255, 255, 0.75)'
                : uiConfig.palette.surface,
              borderColor: uiConfig.cardBorderColor ?? `${uiConfig.palette.outline}55`,
              backdropFilter: uiConfig.isGlassFullBleed ? 'blur(18px)' : undefined,
            }}
            className="hidden md:flex md:flex-col w-56 shrink-0 border-r px-3 py-5 justify-between sticky top-0 h-screen z-20"
          >
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <img
                  src="/img_app_icon_foreground.jpg"
                  alt="STCA Weather"
                  className="w-10 h-10 rounded-xl object-cover shadow"
                />
                <div className="min-w-0">
                  <p className="font-display-grotesk font-extrabold text-sm tracking-tight truncate">
                    STCA Weather
                  </p>
                  <p
                    style={{ color: uiConfig.palette.onSurfaceVariant }}
                    className="text-[11px] truncate"
                  >
                    {prefs.selectedDistrict}
                  </p>
                </div>
              </div>

              <nav className="space-y-1.5" aria-label="主導航列">
                {NAV_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = route === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setRoute(tab.id)}
                      style={{
                        backgroundColor: active ? uiConfig.palette.primaryContainer : 'transparent',
                        color: active ? uiConfig.palette.onPrimaryContainer : uiConfig.palette.onSurface,
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition hover:opacity-90 text-left"
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{tab.label}</span>
                      {tab.id === 'EAS' && (liveSnap?.easTriggers.length ?? 0) > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold">
                          {liveSnap?.easTriggers.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-2.5 px-1">
              {liveSnap && (
                <div
                  style={{
                    backgroundColor: uiConfig.subtleBg,
                    borderRadius: `${uiConfig.cardRadiusPx}px`,
                  }}
                  className="p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>{liveSnap.nearestStationName}</span>
                    <span style={{ color: uiConfig.palette.primary }}>
                      {liveSnap.currentTemp.toFixed(1)}°C
                    </span>
                  </div>
                  <p style={{ color: uiConfig.palette.onSurfaceVariant }} className="text-[11px]">
                    濕度 {liveSnap.humidityPercent}% · UV {liveSnap.uvIndex.toFixed(1)}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => void refreshWeather(false)}
                style={{
                  borderColor: `${uiConfig.palette.outline}88`,
                  color: uiConfig.palette.onSurface,
                }}
                className="w-full h-9 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-80 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                立即同步 HKO
              </button>
            </div>
          </aside>
        )}

        {/* Main Content Column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Scheme-specific Header Chrome */}
          {!isShelterFullMap && uiConfig.isMeteoCommand && (
            <header
              style={{
                backgroundColor: uiConfig.isDark ? '#08182C' : '#0C4A6E',
              }}
              className="text-white px-4 py-2 flex items-center gap-3 text-xs border-b border-cyan-400/30"
            >
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 font-bold shrink-0 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                LIVE METWARN
              </span>
              <div className="flex-1 truncate font-medium">
                {liveSnap?.activeWarnings.length
                  ? `生效警告：${liveSnap.activeWarnings.map((w) => w.name).join(' · ')}`
                  : liveSnap
                  ? `${liveSnap.selectedDistrict} ${liveSnap.currentTemp.toFixed(1)}°C · ${liveSnap.weatherScene.titleTc} · ${liveSnap.generalSituation || '香港天文台實時遙測中'}`
                  : '正在同步香港天文台遙測串流...'}
              </div>
              <span className="font-mono-telemetry text-[11px] text-cyan-200 hidden sm:inline">
                {liveSnap?.updatedAtText ?? '--:--'}
              </span>
            </header>
          )}

          {!isShelterFullMap && uiConfig.isTacticalHud && (
            <header
              style={{
                backgroundColor: '#050608',
                borderColor: uiConfig.palette.outline,
              }}
              className="text-amber-300 px-4 py-2 flex items-center justify-between gap-2 text-xs border-b font-mono-telemetry"
            >
              <div className="flex items-center gap-2 truncate">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
                <span className="font-bold tracking-wider">STCA // TACTICAL HUD</span>
                <span className="text-zinc-400 hidden sm:inline">
                  [{prefs.selectedDistrict}]
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={isOnline ? 'text-emerald-400' : 'text-red-400'}>
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1">
                      <Wifi className="w-3.5 h-3.5" /> ONLINE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <WifiOff className="w-3.5 h-3.5" /> OFFLINE
                    </span>
                  )}
                </span>
                {liveSnap && (
                  <span className="font-bold text-white">{liveSnap.currentTemp.toFixed(1)}°C</span>
                )}
              </div>
            </header>
          )}

          {!isShelterFullMap && uiConfig.isEditorial && (
            <header
              style={{
                borderColor: `${uiConfig.palette.outline}88`,
                backgroundColor: uiConfig.palette.surface,
              }}
              className="px-4 py-3 border-b flex items-center justify-between max-w-5xl w-full mx-auto"
            >
              <div>
                <p className="font-display-grotesk font-bold text-lg tracking-tight">
                  STCA 氣象手賬
                </p>
                <p style={{ color: uiConfig.palette.onSurfaceVariant }} className="text-xs">
                  {prefs.selectedDistrict} · {liveSnap?.updatedAtText ?? '香港天文台即時數據'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refreshWeather(false)}
                style={{ color: uiConfig.palette.primary }}
                className="text-xs font-bold inline-flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                更新
              </button>
            </header>
          )}

          {/* Mobile Compact Top Strip for Classic / Glass modes */}
          {!isShelterFullMap && !uiConfig.isMeteoCommand && !uiConfig.isTacticalHud && !uiConfig.isEditorial && (
            <header
              style={{
                backgroundColor: uiConfig.isGlassFullBleed
                  ? 'rgba(8, 18, 36, 0.35)'
                  : uiConfig.palette.surface,
                color: uiConfig.isGlassFullBleed ? '#FFFFFF' : uiConfig.palette.onSurface,
                borderColor: uiConfig.isGlassFullBleed
                  ? 'rgba(255,255,255,0.16)'
                  : `${uiConfig.palette.outline}44`,
              }}
              className="md:hidden px-4 py-2.5 border-b flex items-center justify-between gap-2 backdrop-blur-md"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src="/img_app_icon_foreground.jpg"
                  alt="STCA Weather"
                  className="w-7 h-7 rounded-lg object-cover"
                />
                <span className="font-display-grotesk font-extrabold text-sm truncate">
                  STCA Weather
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs">
                <span className="opacity-80">{prefs.selectedDistrict}</span>
                {liveSnap && (
                  <span className="font-extrabold">{liveSnap.currentTemp.toFixed(1)}°C</span>
                )}
              </div>
            </header>
          )}

          {/* Screen Viewport */}
          <main
            className={`flex-1 ${
              isShelterFullMap ? '' : showFloatingNav ? 'pb-24 md:pb-8' : 'pb-20 md:pb-8'
            }`}
          >
            {route === 'HOME' && (
              <HomeScreen
                weatherState={weatherState}
                prefs={prefs}
                onRefresh={() => void refreshWeather(false)}
                onRequestLocation={() => void handleRequestLocation()}
                onExportReport={(snap) => void handleExportReport(snap)}
                onSaveSnapshot={() => void handleSaveSnapshot()}
                onOpenEasTab={() => setRoute('EAS')}
                onOpenShelterMap={() => setRoute('SHELTER_MAP')}
                onTriggerEasPopup={triggerManualEasPopup}
              />
            )}

            {route === 'EAS' && (
              <EasAlertScreen
                weatherState={weatherState}
                prefs={prefs}
                onUpdatePrefs={updatePrefs}
                onRequestPushPermission={() => void handleRequestPushPermission()}
                onDecodeSmsPacket={handleDecodeSmsPacket}
                onNotifyMessage={notifyMessage}
                onTriggerEasPopup={triggerManualEasPopup}
              />
            )}

            {route === 'ANALYTICS' && <AnalyticsScreen weatherState={weatherState} prefs={prefs} />}

            {route === 'MAP_COMMUNITY' && (
              <MapCommunityScreen
                currentUserId={authUser?.uid ?? ''}
                prefs={prefs}
                userCoords={userCoords}
                shelters={shelters}
                cacheStatus={cacheStatus}
                reportsState={reportsState}
                onOpenFullShelterMap={() => setRoute('SHELTER_MAP')}
                onSubmitReport={(dist, hazard, sev, depth, desc) =>
                  void handleSubmitReport(dist, hazard, sev, depth, desc)
                }
                onDeleteReport={(id) => void handleDeleteReport(id)}
              />
            )}

            {route === 'SHELTER_MAP' && (
              <EmergencyShelterMapScreen
                shelters={shelters}
                cacheStatus={cacheStatus}
                prefs={prefs}
                userCoords={userCoords}
                weatherState={weatherState}
                reportsState={reportsState}
                onNavigateBack={() => setRoute('MAP_COMMUNITY')}
                onRequestLocation={() => void handleRequestLocation()}
                onRefreshCache={handleRefreshShelterCache}
                onNotifyMessage={notifyMessage}
              />
            )}

            {route === 'SETTINGS' && (
              <SettingsHistoryScreen
                userEmail={authUser?.email ?? ''}
                prefs={prefs}
                weatherState={weatherState}
                historicalClimateState={historicalClimateState}
                savedHistoryState={savedHistoryState}
                onQueryClimate={(dt, st, y, m) => void handleQueryClimate(dt, st, y, m)}
                onSaveSnapshot={() => void handleSaveSnapshot()}
                onDeleteHistory={(id) => void handleDeleteHistory(id)}
                onExportReport={(snap) => void handleExportReport(snap)}
                onBackupCloud={() => void handleBackupCloud()}
                onRestoreCloud={() => void handleRestoreCloud()}
                onUpdatePrefs={updatePrefs}
                onSignOut={() => void handleSignOut()}
                onNotifyMessage={notifyMessage}
              />
            )}
          </main>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        {!isShelterFullMap && (
          <nav
            aria-label="行動底部導航列"
            className={
              showFloatingNav
                ? 'md:hidden fixed bottom-3 left-3 right-3 z-30'
                : 'md:hidden fixed bottom-0 left-0 right-0 z-30'
            }
          >
            <div
              style={{
                backgroundColor: uiConfig.isGlassFullBleed
                  ? uiConfig.isDark
                    ? 'rgba(10, 20, 38, 0.85)'
                    : 'rgba(255, 255, 255, 0.90)'
                  : uiConfig.palette.surface,
                borderColor: uiConfig.cardBorderColor ?? `${uiConfig.palette.outline}55`,
                backdropFilter: uiConfig.isGlassFullBleed ? 'blur(18px)' : undefined,
              }}
              className={
                showFloatingNav
                  ? 'rounded-3xl border shadow-xl px-2 py-1.5 grid grid-cols-5 gap-1'
                  : 'border-t px-1 py-1.5 grid grid-cols-5 gap-1'
              }
            >
              {NAV_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = route === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoute(tab.id)}
                    style={{
                      backgroundColor: active ? uiConfig.palette.primaryContainer : 'transparent',
                      color: active ? uiConfig.palette.onPrimaryContainer : uiConfig.palette.onSurfaceVariant,
                    }}
                    className="flex flex-col items-center justify-center py-1.5 rounded-2xl text-[11px] font-bold transition relative"
                  >
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span>{tab.label}</span>
                    {tab.id === 'EAS' && (liveSnap?.easTriggers.length ?? 0) > 0 && (
                      <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-red-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        )}

        {/* Floating Toast Notification */}
        {toastMsg && (
          <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[calc(100%-2rem)]">
            <div className="rounded-2xl bg-slate-900/95 text-white border border-slate-700 shadow-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs font-semibold backdrop-blur-md">
              <span className="leading-snug">{toastMsg}</span>
              <button
                type="button"
                onClick={() => setToastMsg(null)}
                aria-label="關閉提示"
                className="p-1 rounded-lg hover:bg-white/10 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* EAS Emergency Popup Dialog */}
        {easPopupSnapshot && (
          <EasPopupDialog
            snapshot={easPopupSnapshot}
            prefs={prefs}
            onDismiss={() => {
              EasAudioEngine.stop();
              const sig = `${easPopupSnapshot.easTriggers.join('|')}|${easPopupSnapshot.activeWarnings
                .map((w) => w.code)
                .join(',')}`;
              lastDismissedPopupSigRef.current = sig;
              setEasPopupSnapshot(null);
            }}
            onOpenEasScreen={() => {
              setEasPopupSnapshot(null);
              setRoute('EAS');
            }}
            onOpenShelterMap={() => {
              setEasPopupSnapshot(null);
              setRoute('SHELTER_MAP');
            }}
          />
        )}
      </div>
    </StcaUiContext.Provider>
  );
}
export default App;
