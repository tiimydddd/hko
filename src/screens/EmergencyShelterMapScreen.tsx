import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Crosshair,
  LocateFixed,
  Minus,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { OfflineHkVectorMapCanvas } from '../components/WeatherCharts';
import { haversineKm } from '../services/emergencyTools';
import { cardSurfaceStyle, useStcaUi } from '../theme/themeConfig';
import {
  HK_DISTRICTS,
  type CommunityReport,
  type ShelterCacheStatus,
  type ShelterLocation,
  type UiState,
  type UserPreferences,
  type WeatherSnapshot,
} from '../types/weather';

type ShelterFilterMode = 'ALL' | 'TYPHOON' | 'COLD' | 'HEAT' | 'MY_DISTRICT';

const FILTER_META: Record<ShelterFilterMode, { labelTc: string; token: string | null }> = {
  ALL: { labelTc: '全部庇護中心', token: null },
  TYPHOON: { labelTc: '防風 / 暴雨', token: 'TYPHOON' },
  COLD: { labelTc: '臨時避寒', token: 'COLD' },
  HEAT: { labelTc: '臨時避暑', token: 'HEAT' },
  MY_DISTRICT: { labelTc: '僅看本區', token: 'DISTRICT' },
};

interface EmergencyShelterMapScreenProps {
  shelters: ListOrEmpty<ShelterLocation>;
  cacheStatus: ShelterCacheStatus;
  prefs: UserPreferences;
  userCoords: [number, number] | null;
  weatherState: UiState<WeatherSnapshot>;
  reportsState: UiState<CommunityReport[]>;
  onNavigateBack: () => void;
  onRequestLocation: () => void;
  onRefreshCache: () => void;
  onNotifyMessage: (msg: string) => void;
}

type ListOrEmpty<T> = T[];

export function EmergencyShelterMapScreen({
  shelters,
  cacheStatus,
  prefs,
  userCoords,
  weatherState,
  reportsState,
  onNavigateBack,
  onRequestLocation,
  onRefreshCache,
  onNotifyMessage,
}: EmergencyShelterMapScreenProps) {
  const ui = useStcaUi();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<ShelterFilterMode>('ALL');
  const [showHazardOverlay, setShowHazardOverlay] = useState(true);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [resetMapKey, setResetMapKey] = useState(0);
  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);

  const districtObj = HK_DISTRICTS.find((d) => d.districtTc === prefs.selectedDistrict);
  const refLat = userCoords ? userCoords[0] : districtObj?.latitude ?? 22.3019;
  const refLon = userCoords ? userCoords[1] : districtObj?.longitude ?? 114.1742;

  const snapshot = weatherState.status === 'success' ? weatherState.data : null;
  const suggestedFilter: ShelterFilterMode = useMemo(() => {
    const codes = snapshot?.activeWarnings.map((w) => w.code.toUpperCase()) ?? [];
    if (codes.some((c) => c.startsWith('TC') || c.startsWith('WRAIN'))) return 'TYPHOON';
    if (codes.includes('WCOLD') || codes.includes('WFROST') || (snapshot?.currentTemp ?? 22) <= 15) {
      return 'COLD';
    }
    if (codes.includes('WHOT') || (snapshot?.currentTemp ?? 22) >= 33) return 'HEAT';
    return 'ALL';
  }, [snapshot]);

  const sortedFilteredShelters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return shelters
      .filter((s) => {
        const matchesSearch =
          !q ||
          s.nameTc.toLowerCase().includes(q) ||
          s.nameEn.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q);
        const matchesFilter =
          filterMode === 'ALL'
            ? true
            : filterMode === 'MY_DISTRICT'
            ? s.district === prefs.selectedDistrict
            : s.shelterType.toUpperCase().includes(FILTER_META[filterMode].token ?? '');
        return matchesSearch && matchesFilter;
      })
      .sort(
        (a, b) =>
          haversineKm(refLat, refLon, a.latitude, a.longitude) -
          haversineKm(refLat, refLon, b.latitude, b.longitude)
      );
  }, [shelters, refLat, refLon, searchQuery, filterMode, prefs.selectedDistrict]);

  useEffect(() => {
    if (
      sortedFilteredShelters.length > 0 &&
      !sortedFilteredShelters.some((s) => s.id === selectedShelterId)
    ) {
      setSelectedShelterId(sortedFilteredShelters[0].id);
    }
  }, [sortedFilteredShelters, selectedShelterId]);

  const selectedShelter =
    sortedFilteredShelters.find((s) => s.id === selectedShelterId) ??
    sortedFilteredShelters[0] ??
    null;

  const reportsList =
    showHazardOverlay && reportsState.status === 'success' ? reportsState.data : [];

  const copyAddress = async (sh: ShelterLocation) => {
    const text = `${sh.nameTc} (${sh.district}${sh.address}) ${sh.latitude},${sh.longitude}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotifyMessage('已複製離線地址及座標');
    } catch {
      onNotifyMessage(text);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Top Bar */}
      <div
        style={{
          backgroundColor: ui.isGlassFullBleed ? ui.cardBg : ui.palette.surface,
          borderColor: ui.palette.outline,
        }}
        className="sticky top-0 z-20 border-b px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-md"
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onNavigateBack}
            aria-label="返回"
            className="p-2 rounded-xl hover:bg-slate-500/15"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold truncate">緊急庇護中心離線地圖</h1>
            <p className="text-xs text-emerald-500 font-semibold">
              離線快取 · {cacheStatus.totalCachedCount} 個指定中心
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onRequestLocation}
            aria-label="定位"
            className="p-2 rounded-xl hover:bg-slate-500/15"
          >
            <LocateFixed className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onRefreshCache}
            aria-label="刷新離線快取"
            className="p-2 rounded-xl hover:bg-slate-500/15"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Responsive Two-Pane Grid */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 items-start">
        {/* Left Pane: Cache Banner + Map + Spotlight */}
        <div className="space-y-3">
          {/* Offline Cache Banner */}
          <div className="rounded-2xl bg-[#064E3B]/95 text-white p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">本機離線庇護中心資料庫已就緒</p>
                  <p className="text-[11px] text-emerald-200 truncate">
                    已快取 {cacheStatus.totalCachedCount} 個指定中心 · 更新：{cacheStatus.lastCachedAtText}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onRefreshCache}
                className="px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-50 text-xs font-bold shrink-0 hover:bg-white/10"
              >
                更新快取
              </button>
            </div>

            {suggestedFilter !== 'ALL' && filterMode !== suggestedFilter && (
              <button
                type="button"
                onClick={() => setFilterMode(suggestedFilter)}
                className="w-full rounded-xl bg-red-900/85 hover:bg-red-800 px-3 py-2 flex items-center gap-2 text-xs font-semibold text-white text-left"
              >
                <AlertTriangle className="w-4 h-4 text-yellow-300 shrink-0" />
                <span>
                  偵測到相關天氣警告，點擊篩選「{FILTER_META[suggestedFilter].labelTc}」中心
                </span>
              </button>
            )}
          </div>

          {/* Interactive Vector Map */}
          <div style={cardSurfaceStyle(ui)} className="p-3 space-y-2.5">
            <div className="relative rounded-2xl overflow-hidden">
              <OfflineHkVectorMapCanvas
                shelters={sortedFilteredShelters}
                reports={reportsList}
                userCoords={userCoords}
                selectedDistrict={prefs.selectedDistrict}
                selectedShelterId={selectedShelter?.id ?? null}
                externalZoomMultiplier={zoomMultiplier}
                resetKey={resetMapKey}
                onSelectShelter={(sh) => setSelectedShelterId(sh.id)}
              />

              <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomMultiplier((z) => Math.min(3.2, z * 1.25))}
                  aria-label="放大"
                  className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center shadow"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomMultiplier((z) => Math.max(0.85, z / 1.25))}
                  aria-label="縮小"
                  className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center shadow"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoomMultiplier(1);
                    setResetMapKey((k) => k + 1);
                  }}
                  aria-label="重設地圖視角"
                  className="w-10 h-10 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-white flex items-center justify-center shadow"
                >
                  <Crosshair className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  您的位置
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  庇護中心 (點選圖釘)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHazardOverlay((v) => !v)}
                style={
                  showHazardOverlay
                    ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                    : { borderColor: ui.palette.outline }
                }
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  showHazardOverlay ? 'border-transparent' : ''
                }`}
              >
                災情點
              </button>
            </div>
          </div>

          {/* Selected Shelter Spotlight Card */}
          {selectedShelter && (() => {
            const distKm = haversineKm(
              refLat,
              refLon,
              selectedShelter.latitude,
              selectedShelter.longitude
            );
            const walkMinutes = Math.max(2, Math.round((distKm / 4.5) * 60));
            const isRecommended =
              suggestedFilter !== 'ALL' &&
              selectedShelter.shelterType
                .toUpperCase()
                .includes(FILTER_META[suggestedFilter].token ?? '');
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedShelter.latitude},${selectedShelter.longitude}`;

            return (
              <div
                style={{
                  backgroundColor: `${ui.palette.primaryContainer}80`,
                  borderColor: '#10B981',
                  borderRadius: `${ui.cardRadiusPx}px`,
                }}
                className="border-[1.5px] p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px] font-bold">
                        已選取庇護中心
                      </span>
                      {isRecommended && (
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[11px] font-bold">
                          現行警告適用
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold">{selectedShelter.nameTc}</h3>
                    <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
                      {selectedShelter.nameEn}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-extrabold text-emerald-500">
                      {distKm.toFixed(1)} km
                    </p>
                    <p style={{ color: ui.palette.onSurfaceVariant }} className="text-[11px]">
                      步程約 {walkMinutes} 分鐘
                    </p>
                  </div>
                </div>

                <p className="text-sm font-medium">
                  地址：{selectedShelter.district} {selectedShelter.address}
                </p>
                <p style={{ color: ui.palette.primary }} className="text-xs font-bold">
                  類型：{selectedShelter.shelterType} · 容量約 {selectedShelter.capacity} 人
                </p>
                <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
                  離線設施資料：{selectedShelter.facilities}
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
                    className="flex-1 h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    地圖導航
                  </a>
                  {selectedShelter.phone && (
                    <a
                      href={`tel:${selectedShelter.phone.replace(/\s+/g, '')}`}
                      style={{
                        backgroundColor: ui.palette.secondaryContainer,
                        color: ui.palette.onSecondaryContainer,
                      }}
                      className="h-11 px-3.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" />
                      {selectedShelter.phone}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => copyAddress(selectedShelter)}
                    aria-label="複製庇護中心地址"
                    style={{
                      backgroundColor: ui.palette.secondaryContainer,
                      color: ui.palette.onSecondaryContainer,
                    }}
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Pane: Search, Filter & Full List */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 opacity-60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋庇護中心名稱、地區或街道"
              style={{ borderColor: ui.palette.outline }}
              className="w-full h-11 pl-10 pr-10 rounded-xl border bg-transparent text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="清除搜尋"
                className="p-1.5 absolute right-2 top-1/2 -translate-y-1/2 rounded-lg hover:bg-slate-500/15"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(FILTER_META) as ShelterFilterMode[]).map((mode) => {
              const active = filterMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  style={
                    active
                      ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                      : { borderColor: ui.palette.outline }
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    active ? 'border-transparent' : ''
                  }`}
                >
                  {FILTER_META[mode].labelTc}
                </button>
              );
            })}
          </div>

          <h2 className={`text-sm font-bold ${ui.isGlassFullBleed ? 'text-white' : ''}`}>
            離線指定庇護中心名錄 ({sortedFilteredShelters.length} 個，按距離排序)
          </h2>

          {sortedFilteredShelters.length === 0 ? (
            <div style={cardSurfaceStyle(ui)} className="p-6 text-center space-y-2.5">
              <p className="text-sm font-bold">找不到符合條件的指定庇護中心</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('ALL');
                }}
                style={{ borderColor: ui.palette.outline }}
                className="px-4 py-2 rounded-xl border text-xs font-semibold"
              >
                顯示全港所有已快取庇護中心
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 lg:max-h-[70vh] lg:overflow-y-auto pr-0.5">
              {sortedFilteredShelters.map((shelter) => {
                const distKm = haversineKm(refLat, refLon, shelter.latitude, shelter.longitude);
                const isSelected = shelter.id === selectedShelter?.id;
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${shelter.latitude},${shelter.longitude}`;
                return (
                  <div
                    key={shelter.id}
                    onClick={() => setSelectedShelterId(shelter.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setSelectedShelterId(shelter.id);
                    }}
                    style={{
                      ...cardSurfaceStyle(ui),
                      backgroundColor: isSelected ? `${ui.palette.secondaryContainer}99` : cardSurfaceStyle(ui).backgroundColor,
                      border: isSelected ? '1.5px solid #10B981' : cardSurfaceStyle(ui).border,
                    }}
                    className="p-3.5 flex items-center justify-between gap-2 cursor-pointer transition hover:brightness-105"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-bold truncate">{shelter.nameTc}</p>
                      <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs truncate">
                        {shelter.district} · {shelter.address}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold">
                          {distKm.toFixed(1)} km
                        </span>
                        <span style={{ color: ui.palette.primary }} className="font-semibold">
                          {shelter.shelterType}
                        </span>
                      </div>
                    </div>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label="導航前往庇護中心"
                      style={{ color: ui.palette.primary }}
                      className="p-2.5 rounded-xl hover:bg-slate-500/10 shrink-0"
                    >
                      <Navigation className="w-5 h-5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
