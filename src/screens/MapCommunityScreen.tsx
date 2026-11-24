import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Map as MapIcon,
  MapPin,
  Navigation,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { OfflineHkVectorMapCanvas } from '../components/WeatherCharts';
import { haversineKm } from '../services/emergencyTools';
import { cardSurfaceStyle, useStcaUi } from '../theme/themeConfig';
import {
  HAZARD_TYPE_META,
  HK_DISTRICTS,
  REPORT_SEVERITY_META,
  type CommunityReport,
  type HazardType,
  type ReportSeverity,
  type ShelterCacheStatus,
  type ShelterLocation,
  type UiState,
  type UserPreferences,
} from '../types/weather';

interface MapCommunityScreenProps {
  currentUserId: string;
  prefs: UserPreferences;
  userCoords: [number, number] | null;
  shelters: ShelterLocation[];
  cacheStatus: ShelterCacheStatus;
  reportsState: UiState<ListOrEmpty<CommunityReport>>;
  onOpenFullShelterMap: () => void;
  onSubmitReport: (
    district: string,
    hazard: HazardType,
    severity: ReportSeverity,
    waterDepthCm: number,
    desc: string
  ) => void;
  onDeleteReport: (id: string) => void;
}

type ListOrEmpty<T> = T[];

export function MapCommunityScreen({
  currentUserId,
  prefs,
  userCoords,
  shelters,
  cacheStatus,
  reportsState,
  onOpenFullShelterMap,
  onSubmitReport,
  onDeleteReport,
}: MapCommunityScreenProps) {
  const ui = useStcaUi();
  const [showReportModal, setShowReportModal] = useState(false);

  const [formDistrict, setFormDistrict] = useState(prefs.selectedDistrict);
  const [formHazard, setFormHazard] = useState<HazardType>('FLOODING');
  const [formSeverity, setFormSeverity] = useState<ReportSeverity>('MODERATE');
  const [formDepth, setFormDepth] = useState(15);
  const [formDesc, setFormDesc] = useState('');

  const districtObj = HK_DISTRICTS.find((d) => d.districtTc === prefs.selectedDistrict);
  const refLat = userCoords ? userCoords[0] : districtObj?.latitude ?? 22.3019;
  const refLon = userCoords ? userCoords[1] : districtObj?.longitude ?? 114.1742;

  const sortedShelters = useMemo(
    () =>
      [...shelters].sort(
        (a, b) =>
          haversineKm(refLat, refLon, a.latitude, a.longitude) -
          haversineKm(refLat, refLon, b.latitude, b.longitude)
      ),
    [shelters, refLat, refLon]
  );

  const reportsList = reportsState.status === 'success' ? reportsState.data : [];

  const openReportSheet = () => {
    setFormDistrict(prefs.selectedDistrict);
    setFormHazard('FLOODING');
    setFormSeverity('MODERATE');
    setFormDepth(15);
    setFormDesc('');
    setShowReportModal(true);
  };

  return (
    <div className={`max-w-5xl mx-auto ${ui.paddingClass} ${ui.spacingClass} pb-20`}>
      {/* 1. Offline HK Vector Map Preview */}
      <div style={cardSurfaceStyle(ui)} className="p-3.5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <MapIcon style={{ color: ui.palette.primary }} className="w-5 h-5" />
            <span>離線香港庇護中心及災情地圖</span>
          </div>
          <span style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
            滾輪縮放・拖曳瀏覽
          </span>
        </div>

        <div className="rounded-2xl overflow-hidden">
          <OfflineHkVectorMapCanvas
            shelters={sortedShelters}
            reports={reportsList}
            userCoords={userCoords}
            selectedDistrict={prefs.selectedDistrict}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              您的位置
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              避災庇護中心
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              社群災情點
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-bold text-[11px]">
            已離線快取 {cacheStatus.totalCachedCount} 處
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenFullShelterMap}
          style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
          className="w-full h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition hover:brightness-110"
        >
          <MapIcon className="w-4 h-4" />
          開啟完整離線緊急庇護中心地圖（搜尋・電話・篩選）
        </button>
      </div>

      {/* 2. Shelter Illustration Banner */}
      <div className="relative w-full h-36 rounded-2xl overflow-hidden shadow">
        <img
          src={`${import.meta.env.BASE_URL}img_shelter_banner.jpg`}
          alt="香港臨時庇護中心"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-[#061E38]/80 text-white text-xs font-bold">
          全港 18 區臨時避寒 / 避暑 / 防風庇護中心 (離線可用)
        </div>
      </div>

      {/* 3. Nearest 6 Shelters */}
      <div className="space-y-2.5">
        <h2 className={`text-lg font-bold ${ui.isGlassFullBleed ? 'text-white' : ''}`}>
          最近臨時庇護中心 (依距離排序)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedShelters.slice(0, 6).map((shelter) => {
            const distKm = haversineKm(refLat, refLon, shelter.latitude, shelter.longitude);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${shelter.latitude},${shelter.longitude}`;
            return (
              <div
                key={shelter.id}
                style={cardSurfaceStyle(ui)}
                className="p-3.5 flex items-center justify-between gap-3"
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
      </div>

      {/* 4. Community Disaster & Flooding Reports */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-lg font-bold ${ui.isGlassFullBleed ? 'text-white' : ''}`}>
            社群即時災情與積水通報
          </h2>
          <button
            type="button"
            onClick={openReportSheet}
            style={{
              borderColor: ui.isGlassFullBleed ? '#FFFFFF' : ui.palette.primary,
              color: ui.isGlassFullBleed ? '#FFFFFF' : ui.palette.primary,
            }}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            我要通報
          </button>
        </div>

        {reportsState.status === 'loading' && (
          <div className="py-8 flex justify-center">
            <div
              style={{ borderColor: `${ui.palette.primary} transparent ${ui.palette.primary} ${ui.palette.primary}` }}
              className="w-8 h-8 rounded-full border-4 animate-spin"
            />
          </div>
        )}

        {reportsState.status === 'error' && (
          <p className="text-sm text-red-500">社群通報讀取錯誤：{reportsState.message}</p>
        )}

        {reportsState.status === 'success' && reportsState.data.length === 0 && (
          <div style={cardSurfaceStyle(ui)} className="p-6 text-center space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto opacity-60" />
            <p className="text-base font-bold">目前尚無災情通報</p>
            <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs max-w-md mx-auto">
              {currentUserId
                ? '點擊「我要通報」即可通報附近積水或塌樹情況'
                : '免登入模式：點擊「我要通報」可記錄本機災情與積水；若於設定頁連結 Google 帳戶，可同步瀏覽全港市民公開通報。'}
            </p>
          </div>
        )}

        {reportsState.status === 'success' && reportsState.data.length > 0 && (
          <div className="space-y-2.5">
            {reportsState.data.map((rep) => {
              const sevColor =
                rep.severity === 'CRITICAL'
                  ? '#DC2626'
                  : rep.severity === 'SEVERE'
                  ? '#F97316'
                  : rep.severity === 'MODERATE'
                  ? '#F59E0B'
                  : '#38BDF8';
              return (
                <div key={rep.id} style={cardSurfaceStyle(ui)} className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      <MapPin style={{ color: sevColor }} className="w-4 h-4 shrink-0" />
                      <span>
                        {rep.district} · {HAZARD_TYPE_META[rep.hazardType]?.labelTc ?? rep.hazardType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{ backgroundColor: `${sevColor}26`, color: sevColor }}
                        className="px-2 py-0.5 rounded text-[11px] font-bold"
                      >
                        {REPORT_SEVERITY_META[rep.severity]?.labelTc ?? rep.severity}
                      </span>
                      {rep.userId === currentUserId && rep.id && (
                        <button
                          type="button"
                          onClick={() => onDeleteReport(rep.id)}
                          aria-label="撤回通報"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {rep.waterDepthCm > 0 && (
                    <p className="text-xs font-bold text-sky-400">
                      估計積水深度：{rep.waterDepthCm} cm
                    </p>
                  )}
                  <p className="text-sm">{rep.description}</p>
                  <p style={{ color: ui.palette.onSurfaceVariant }} className="text-[11px]">
                    回報人：{rep.authorAlias}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Report Modal */}
      {showReportModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        >
          <div
            style={{
              backgroundColor: ui.palette.surface,
              color: ui.palette.onSurface,
              borderRadius: `${ui.cardRadiusPx}px`,
            }}
            className="w-full max-w-lg p-5 space-y-3.5 shadow-2xl border border-slate-500/30 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">通報附近災情與積水狀況</h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-500/15"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold">災情類型</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(HAZARD_TYPE_META) as HazardType[]).map((h) => {
                  const active = formHazard === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setFormHazard(h)}
                      style={
                        active
                          ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                          : { borderColor: ui.palette.outline }
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                        active ? 'border-transparent' : ''
                      }`}
                    >
                      {HAZARD_TYPE_META[h].labelTc}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-bold">嚴重程度</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(REPORT_SEVERITY_META) as ReportSeverity[]).map((s) => {
                  const active = formSeverity === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormSeverity(s)}
                      style={
                        active
                          ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                          : { borderColor: ui.palette.outline }
                      }
                      className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                        active ? 'border-transparent' : ''
                      }`}
                    >
                      {REPORT_SEVERITY_META[s].labelTc}
                    </button>
                  );
                })}
              </div>
            </div>

            {formHazard === 'FLOODING' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>估計水深</span>
                  <span>{formDepth} cm</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={150}
                  value={formDepth}
                  onChange={(e) => setFormDepth(Number(e.target.value))}
                  className="w-full accent-sky-600"
                />
              </div>
            )}

            <label className="block space-y-1 text-xs font-bold">
              <span>所在地區</span>
              <input
                type="text"
                value={formDistrict}
                onChange={(e) => setFormDistrict(e.target.value)}
                style={{ borderColor: ui.palette.outline }}
                className="w-full h-10 px-3 rounded-xl border bg-transparent text-sm font-normal"
              />
            </label>

            <label className="block space-y-1 text-xs font-bold">
              <span>現場狀況描述 (如道路名稱、受阻情況)</span>
              <textarea
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                style={{ borderColor: ui.palette.outline }}
                className="w-full p-3 rounded-xl border bg-transparent text-sm font-normal"
              />
            </label>

            <button
              type="button"
              disabled={!formDesc.trim()}
              onClick={() => {
                onSubmitReport(
                  formDistrict.trim() || prefs.selectedDistrict,
                  formHazard,
                  formSeverity,
                  formHazard === 'FLOODING' ? formDepth : 0,
                  formDesc.trim()
                );
                setShowReportModal(false);
              }}
              style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
              className="w-full h-11 rounded-xl disabled:opacity-45 text-sm font-bold"
            >
              立即發佈社群通報
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
