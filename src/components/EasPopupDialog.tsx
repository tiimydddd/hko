import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  MapPin,
  Megaphone,
  Moon,
  Play,
  Sliders,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { EasAudioEngine } from '../services/easAudio';
import { speakBroadcast, stopBroadcastSpeech, translateBroadcast } from '../services/emergencyTools';
import { useStcaUi } from '../theme/themeConfig';
import {
  BROADCAST_LANG_META,
  EAS_TONE_META,
  type UserPreferences,
  type WeatherSnapshot,
} from '../types/weather';

interface EasPopupDialogProps {
  snapshot: WeatherSnapshot;
  prefs: UserPreferences;
  onDismiss: () => void;
  onOpenEasScreen: () => void;
  onOpenShelterMap: () => void;
}

export function EasPopupDialog({
  snapshot,
  prefs,
  onDismiss,
  onOpenEasScreen,
  onOpenShelterMap,
}: EasPopupDialogProps) {
  const ui = useStcaUi();
  const [isPlayingAudio, setIsPlayingAudio] = useState(EasAudioEngine.getIsPlaying());

  useEffect(() => {
    const unsub = EasAudioEngine.subscribe(setIsPlayingAudio);
    return () => {
      unsub();
      stopBroadcastSpeech();
    };
  }, []);

  const inQuietHours = EasAudioEngine.isWithinQuietHours(prefs);
  const hasHkoWarning = snapshot.activeWarnings.length > 0;
  const effectiveTone = hasHkoWarning ? 'HKO_MP3' : prefs.easToneType;
  const translated = useMemo(
    () => translateBroadcast(prefs.broadcastLang, snapshot),
    [prefs.broadcastLang, snapshot]
  );

  const bgColor = ui.isTacticalHud
    ? '#07080B'
    : ui.isGlassFullBleed
    ? 'rgba(11, 22, 40, 0.94)'
    : '#0B1120';

  const summaryText = snapshot.easTriggers.length
    ? snapshot.easTriggers.join(' · ')
    : hasHkoWarning
    ? snapshot.activeWarnings.map((w) => `${w.name} (${w.code})`).join(' · ')
    : '目前無生效嚴重警告，以下為即時氣象廣播及警報預覽。';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="EAS 緊急天氣警報彈窗"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
    >
      <div
        style={{
          backgroundColor: bgColor,
          borderRadius: `${ui.cardRadiusPx}px`,
        }}
        className="w-full max-w-xl text-slate-50 border-2 border-red-500 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Diagonal-Striped Hazard Banner */}
        <div
          style={{
            backgroundImage:
              'repeating-linear-gradient(-45deg, rgba(0,0,0,0.16), rgba(0,0,0,0.16) 14px, transparent 14px, transparent 28px), linear-gradient(90deg, #991B1B, #DC2626, #B45309)',
          }}
          className="px-4 py-3.5 flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <BellRing className="w-7 h-7 text-yellow-200 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-wider text-yellow-200">
                EMERGENCY ALERT SYSTEM · EAS
              </p>
              <h2 className="text-lg font-extrabold text-white truncate">
                {hasHkoWarning ? '香港天文台緊急天氣警報' : 'STCA 緊急氣象即時彈窗'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopBroadcastSpeech();
              onDismiss();
            }}
            aria-label="關閉 EAS 彈窗"
            className="p-2 rounded-lg text-white hover:bg-white/15 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {inQuietHours && (
            <div className="rounded-xl bg-sky-700/25 border border-sky-400/45 p-3 flex items-center gap-2.5 text-xs text-sky-100">
              <Moon className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                靜音時段 ({EasAudioEngine.formatQuietWindow(prefs)}) 內已自動靜音，僅顯示緊急彈窗；如需聽取警報請手動點擊播放。
              </span>
            </div>
          )}

          {/* Active Warning / Trigger Summary */}
          <div className="rounded-xl bg-slate-800 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  {snapshot.selectedDistrict} ({snapshot.nearestStationName})
                </span>
              </div>
              <span className="text-2xl font-extrabold text-sky-400">
                {snapshot.currentTemp.toFixed(1)}°C
              </span>
            </div>
            <p
              className={`text-xs font-semibold ${
                snapshot.easTriggers.length || hasHkoWarning ? 'text-red-300' : 'text-slate-300'
              }`}
            >
              {summaryText}
            </p>
            {snapshot.highestStation && snapshot.lowestStation && (
              <p className="text-[11px] text-slate-400">
                全港最高：{snapshot.highestStation.place} {snapshot.highestStation.value.toFixed(1)}°C ｜
                最低：{snapshot.lowestStation.place} {snapshot.lowestStation.value.toFixed(1)}°C
              </p>
            )}
          </div>

          {/* EAS Audio Control */}
          <div className="rounded-xl bg-red-900/30 border border-red-500/45 p-3 flex items-center gap-3">
            <Volume2 className="w-6 h-6 text-red-300 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {hasHkoWarning
                  ? '已自動切換 HKO 警告 MP3 音檔'
                  : `EAS 警報音響 (${EAS_TONE_META[effectiveTone].labelTc})`}
              </p>
              <p className="text-[11px] text-red-200 truncate">
                {isPlayingAudio
                  ? '正在播放緊急警報音...'
                  : hasHkoWarning
                  ? '檔案：eas_hko_warning.mp3'
                  : '點擊右側按鈕即時測試／播放'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isPlayingAudio) {
                  EasAudioEngine.stop();
                } else {
                  EasAudioEngine.playAlertTone(effectiveTone, 0.85, 6);
                }
              }}
              aria-label={isPlayingAudio ? '停止警報音' : '播放警報音'}
              className="w-11 h-11 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shrink-0 transition"
            >
              {isPlayingAudio ? <Square className="w-4 h-4" /> : <Play className="w-5 h-5" />}
            </button>
          </div>

          {/* Multilingual Emergency Broadcast */}
          <div className="rounded-xl bg-slate-800 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-sky-400">
                緊急廣播訊息 ({BROADCAST_LANG_META[prefs.broadcastLang].displayName})
              </span>
              <button
                type="button"
                onClick={() => speakBroadcast(translated.fullScript, prefs.broadcastLang)}
                aria-label="語音朗讀緊急廣播"
                className="p-2 rounded-lg text-sky-400 hover:bg-slate-700 transition"
              >
                <Megaphone className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm font-bold text-white">{translated.headline}</p>
            <p className="text-xs text-slate-200 leading-relaxed">{translated.statusLine}</p>
            <p className="text-xs text-yellow-300 font-medium leading-relaxed">
              {translated.actionGuidance}
            </p>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                stopBroadcastSpeech();
                onOpenShelterMap();
              }}
              className="h-11 rounded-xl border border-sky-400 text-sky-300 hover:bg-sky-500/10 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
            >
              <MapPin className="w-4 h-4" />
              避災地圖
            </button>
            <button
              type="button"
              onClick={() => {
                stopBroadcastSpeech();
                onOpenEasScreen();
              }}
              className="h-11 rounded-xl border border-slate-500 text-white hover:bg-slate-800 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition"
            >
              <Sliders className="w-4 h-4" />
              EAS 控制
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              stopBroadcastSpeech();
              onDismiss();
            }}
            className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold transition"
          >
            確認並關閉 EAS 警報 (停止音效)
          </button>
        </div>
      </div>
    </div>
  );
}
