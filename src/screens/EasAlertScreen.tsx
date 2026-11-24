import { useEffect, useState } from 'react';
import {
  BellRing,
  Languages,
  Megaphone,
  MessageSquare,
  Moon,
  Play,
  Square,
  Volume2,
} from 'lucide-react';
import { EasAudioEngine } from '../services/easAudio';
import {
  SmsEmergencyHelper,
  speakBroadcast,
  stopBroadcastSpeech,
  translateBroadcast,
} from '../services/emergencyTools';
import { cardSurfaceStyle, useStcaUi } from '../theme/themeConfig';
import {
  BROADCAST_LANG_META,
  EAS_TONE_META,
  type BroadcastLang,
  type EasToneType,
  type UiState,
  type UserPreferences,
  type WeatherSnapshot,
} from '../types/weather';

interface EasAlertScreenProps {
  weatherState: UiState<WeatherSnapshot>;
  prefs: UserPreferences;
  onUpdatePrefs: (transform: (prev: UserPreferences) => UserPreferences) => void;
  onRequestPushPermission: () => void;
  onDecodeSmsPacket: (raw: string) => void;
  onNotifyMessage: (msg: string) => void;
  onTriggerEasPopup: () => void;
}

function toTimeInputValue(h: number, m: number): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function EasAlertScreen({
  weatherState,
  prefs,
  onUpdatePrefs,
  onRequestPushPermission,
  onDecodeSmsPacket,
  onNotifyMessage,
  onTriggerEasPopup,
}: EasAlertScreenProps) {
  const ui = useStcaUi();
  const [isPlayingAudio, setIsPlayingAudio] = useState(EasAudioEngine.getIsPlaying());
  const [audioVolume, setAudioVolume] = useState(0.85);
  const [smsDecodeInput, setSmsDecodeInput] = useState('');
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const unsubAudio = EasAudioEngine.subscribe(setIsPlayingAudio);
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => {
      unsubAudio();
      window.removeEventListener('online', onOn);
      window.removeEventListener('offline', onOff);
      stopBroadcastSpeech();
    };
  }, []);

  const snapshot = weatherState.status === 'success' ? weatherState.data : null;
  const inQuietHours = EasAudioEngine.isWithinQuietHours(prefs);
  const hasHkoWarning = (snapshot?.activeWarnings.length ?? 0) > 0;
  const effectiveTone: EasToneType = hasHkoWarning ? 'HKO_MP3' : prefs.easToneType;
  const triggers = snapshot?.easTriggers ?? [];

  const c1Bg =
    triggers.length && !inQuietHours
      ? ui.palette.errorContainer
      : triggers.length && inQuietHours
      ? ui.palette.secondaryContainer
      : ui.subtleBg;
  const c1Fg =
    triggers.length && !inQuietHours
      ? ui.palette.onErrorContainer
      : triggers.length && inQuietHours
      ? ui.palette.onSecondaryContainer
      : ui.palette.onSurface;

  const smsReqBody = SmsEmergencyHelper.buildRequestSmsBody(prefs.selectedDistrict);
  const smsHref = SmsEmergencyHelper.buildSmsHref(prefs.emergencySmsNumber, smsReqBody);

  return (
    <div className={`max-w-4xl mx-auto ${ui.paddingClass} ${ui.spacingClass}`}>
      {/* Component 1: EAS Active Status */}
      <div
        style={{
          ...cardSurfaceStyle(ui, true),
          backgroundColor: c1Bg,
          color: c1Fg,
        }}
        className={`${ui.innerPaddingClass} space-y-2.5`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <BellRing className="w-5 h-5" />
            <span>組件 1 · EAS 緊急警報狀態</span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              inQuietHours
                ? 'bg-sky-500/20 text-sky-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {inQuietHours ? '靜音時段中' : '警報待命中'}
          </span>
        </div>

        <p className="text-sm">
          {triggers.length === 0
            ? `目前氣溫 ${snapshot ? snapshot.currentTemp.toFixed(1) : '--'}°C（門檻 ${Math.trunc(prefs.tempAlertThreshold)}°C 以下），無生效警報。`
            : `已觸發條件：${triggers.join(' · ')}`}
        </p>

        {inQuietHours && (
          <p className="text-xs font-medium opacity-90">
            現正處於自訂靜音時段 ({EasAudioEngine.formatQuietWindow(prefs)})，自動警報響鈴及推送聲響已靜音，僅顯示畫面提示。
          </p>
        )}

        <button
          type="button"
          disabled={!snapshot}
          onClick={onTriggerEasPopup}
          className="w-full h-11 rounded-xl border border-current/40 hover:bg-black/10 disabled:opacity-50 text-sm font-bold inline-flex items-center justify-center gap-2 transition"
        >
          <BellRing className="w-4 h-4" />
          立即彈出 EAS 緊急廣播視窗
        </button>
      </div>

      {/* Component 2: Quiet Hours, Temp Threshold & Push */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3.5`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <Moon style={{ color: ui.palette.primary }} className="w-5 h-5" />
            <span>組件 2 · 靜音時段與推送設定</span>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.quietHoursEnabled}
              onChange={(e) =>
                onUpdatePrefs((p) => ({ ...p, quietHoursEnabled: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-500/40 rounded-full peer peer-checked:bg-sky-600 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1 text-xs font-semibold block">
            <span>開始靜音</span>
            <input
              type="time"
              value={toTimeInputValue(prefs.quietStartHour, prefs.quietStartMinute)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (!Number.isNaN(h) && !Number.isNaN(m)) {
                  onUpdatePrefs((p) => ({ ...p, quietStartHour: h, quietStartMinute: m }));
                }
              }}
              style={{ borderColor: ui.palette.outline }}
              className="w-full h-10 px-3 rounded-xl border bg-transparent text-sm font-mono-telemetry"
            />
          </label>
          <label className="space-y-1 text-xs font-semibold block">
            <span>結束靜音</span>
            <input
              type="time"
              value={toTimeInputValue(prefs.quietEndHour, prefs.quietEndMinute)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                if (!Number.isNaN(h) && !Number.isNaN(m)) {
                  onUpdatePrefs((p) => ({ ...p, quietEndHour: h, quietEndMinute: m }));
                }
              }}
              style={{ borderColor: ui.palette.outline }}
              className="w-full h-10 px-3 rounded-xl border bg-transparent text-sm font-mono-telemetry"
            />
          </label>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-bold">
            <span>低溫自動觸發 EAS 門檻</span>
            <span style={{ color: ui.palette.primary }}>{prefs.tempAlertThreshold.toFixed(1)}°C 以下</span>
          </div>
          <input
            type="range"
            min={5}
            max={22}
            step={1}
            value={prefs.tempAlertThreshold}
            onChange={(e) =>
              onUpdatePrefs((p) => ({ ...p, tempAlertThreshold: Number(e.target.value) }))
            }
            className="w-full accent-sky-600"
          />
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <p className="text-sm font-semibold">極端天氣自動推送通知</p>
            <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
              每 15 分鐘背景檢查天文台警告與低溫
            </p>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.autoPushEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                if (enabled) onRequestPushPermission();
                onUpdatePrefs((p) => ({ ...p, autoPushEnabled: enabled }));
              }}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-500/40 rounded-full peer peer-checked:bg-sky-600 relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>
      </div>

      {/* Component 3: EAS Audio Siren System */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-base">
            <Volume2 className="w-5 h-5 text-red-500" />
            <span>組件 3 · EAS 警報音響系統</span>
          </div>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={prefs.easAutoPlay}
              onChange={(e) =>
                onUpdatePrefs((p) => ({ ...p, easAutoPlay: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-500/40 rounded-full peer peer-checked:bg-red-600 relative after:content-[''] after:top-0.5 after:left-0.5 after:absolute after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
          </label>
        </div>

        <p style={{ color: ui.palette.onSurfaceVariant }} className="text-xs">
          極端天氣或氣溫低於 {Math.trunc(prefs.tempAlertThreshold)}°C 時（非靜音時段）自動準確觸發並即時播放警報音效。
        </p>

        {hasHkoWarning && (
          <div className="rounded-xl bg-red-500/15 text-red-600 dark:text-red-300 px-3 py-2 text-xs font-bold">
            天文台警告生效中：已自動切換至自訂警報 MP3 音檔 (eas_hko_warning.mp3)
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(Object.keys(EAS_TONE_META) as EasToneType[]).map((tone) => {
            const active = effectiveTone === tone;
            return (
              <button
                key={tone}
                type="button"
                onClick={() => onUpdatePrefs((p) => ({ ...p, easToneType: tone }))}
                style={
                  active
                    ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                    : { borderColor: ui.palette.outline }
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  active ? 'border-transparent' : 'hover:bg-slate-500/10'
                }`}
              >
                {EAS_TONE_META[tone].labelTc}
              </button>
            );
          })}
        </div>

        <EasAudioWaveformBar isPlaying={isPlayingAudio} />

        <div className="space-y-1">
          <div className="flex justify-between text-xs font-bold">
            <span>警報音量</span>
            <span>{Math.round(audioVolume * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={audioVolume}
            onChange={(e) => setAudioVolume(Number(e.target.value))}
            className="w-full accent-red-600"
          />
        </div>

        <div className="grid grid-cols-[1.3fr_0.7fr] gap-2.5">
          <button
            type="button"
            onClick={() => EasAudioEngine.playAlertTone(effectiveTone, audioVolume, 6)}
            className="h-11 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold inline-flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4" />
            {isPlayingAudio ? '重新播放警報' : '即時觸發警報音'}
          </button>
          <button
            type="button"
            disabled={!isPlayingAudio}
            onClick={() => EasAudioEngine.stop()}
            style={{ borderColor: ui.palette.outline }}
            className="h-11 rounded-xl border disabled:opacity-40 text-sm font-bold inline-flex items-center justify-center gap-1.5 transition"
          >
            <Square className="w-4 h-4" />
            停止
          </button>
        </div>
      </div>

      {/* Component 4: 8-Language Emergency Broadcast */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center gap-2 font-bold text-base">
          <Languages style={{ color: ui.palette.primary }} className="w-5 h-5" />
          <span>組件 4 · 多語言緊急廣播界面</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(BROADCAST_LANG_META) as BroadcastLang[]).map((lang) => {
            const active = prefs.broadcastLang === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => onUpdatePrefs((p) => ({ ...p, broadcastLang: lang }))}
                style={
                  active
                    ? { backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }
                    : { borderColor: ui.palette.outline }
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  active ? 'border-transparent' : 'hover:bg-slate-500/10'
                }`}
              >
                {BROADCAST_LANG_META[lang].displayName}
              </button>
            );
          })}
        </div>

        {snapshot && (() => {
          const translated = translateBroadcast(prefs.broadcastLang, snapshot);
          return (
            <div className="space-y-2.5">
              <div
                style={{ backgroundColor: ui.subtleBg }}
                className="rounded-xl p-3.5 space-y-1.5"
              >
                <p className="text-sm font-bold">{translated.headline}</p>
                <p className="text-sm">{translated.statusLine}</p>
                <p style={{ color: ui.palette.primary }} className="text-sm font-medium">
                  {translated.actionGuidance}
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => speakBroadcast(translated.fullScript, prefs.broadcastLang)}
                  style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
                  className="flex-1 h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  語音緊急廣播 ({prefs.broadcastLang})
                </button>
                <button
                  type="button"
                  onClick={stopBroadcastSpeech}
                  style={{ borderColor: ui.palette.outline }}
                  className="px-5 h-11 rounded-xl border text-sm font-semibold"
                >
                  靜音
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Component 5: Offline SMS Emergency Helper */}
      <div style={cardSurfaceStyle(ui)} className={`${ui.innerPaddingClass} space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <MessageSquare style={{ color: ui.palette.tertiary }} className="w-5 h-5" />
            <span>組件 5 · 斷網緊急 SMS 通訊</span>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              isOnline ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'
            }`}
          >
            {isOnline ? '網絡正常' : '離線模式 (建議SMS)'}
          </span>
        </div>

        <label className="block space-y-1 text-xs font-semibold">
          <span>緊急聯絡 / 天氣中繼號碼</span>
          <input
            type="tel"
            value={prefs.emergencySmsNumber}
            onChange={(e) => {
              const val = e.target.value;
              onUpdatePrefs((p) => ({ ...p, emergencySmsNumber: val }));
            }}
            placeholder="例如親友電話或中繼號碼"
            style={{ borderColor: ui.palette.outline }}
            className="w-full h-10 px-3 rounded-xl border bg-transparent text-sm"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={smsHref}
            style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
            className="h-11 rounded-xl text-sm font-bold inline-flex items-center justify-center"
          >
            發送 SMS 求助更新
          </a>
          {snapshot && (
            <button
              type="button"
              onClick={async () => {
                const pkt = SmsEmergencyHelper.encodeSnapshotToSmsPacket(snapshot);
                try {
                  await navigator.clipboard.writeText(pkt);
                  onNotifyMessage('已複製本機氣象 SMS 封包，可轉發給斷網親友');
                } catch {
                  setSmsDecodeInput(pkt);
                  onNotifyMessage('已填入本機氣象 SMS 封包');
                }
              }}
              style={{ borderColor: ui.palette.outline }}
              className="h-11 rounded-xl border text-sm font-semibold"
            >
              複製氣象封包
            </button>
          )}
        </div>

        <label className="block space-y-1 text-xs font-semibold">
          <span>貼上收到的 SMS 氣象封包解碼</span>
          <input
            type="text"
            value={smsDecodeInput}
            onChange={(e) => setSmsDecodeInput(e.target.value)}
            placeholder="STCA|HKO|DIST:油尖旺區|T:14.2|RH:78|W:WCOLD|RAIN:0"
            style={{ borderColor: ui.palette.outline }}
            className="w-full h-10 px-3 rounded-xl border bg-transparent text-sm font-mono-telemetry"
          />
        </label>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={!smsDecodeInput.trim()}
            onClick={() => onDecodeSmsPacket(smsDecodeInput)}
            style={{ backgroundColor: ui.palette.primary, color: ui.palette.onPrimary }}
            className="flex-1 h-11 rounded-xl disabled:opacity-45 text-sm font-bold px-4"
          >
            離線解碼並更新主畫面
          </button>
          <button
            type="button"
            onClick={() =>
              setSmsDecodeInput(
                `STCA|HKO|DIST:${prefs.selectedDistrict}|T:13.8|RH:82|W:WCOLD,WMSGNL|RAIN:5.0|UV:1.0|AQHI:4|MAX:16.2@橫瀾島|MIN:10.5@打鼓嶺`
              )
            }
            style={{ borderColor: ui.palette.outline }}
            className="h-11 rounded-xl border text-xs font-semibold px-4"
          >
            填入封包範例
          </button>
        </div>
      </div>
    </div>
  );
}

function EasAudioWaveformBar({ isPlaying }: { isPlaying: boolean }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;
    const id = window.setInterval(() => {
      setPhase((p) => (p + 0.35) % (Math.PI * 2));
    }, 60);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  return (
    <div className="h-10 flex items-center justify-between gap-1 px-1">
      {Array.from({ length: 28 }).map((_, i) => {
        const amp = isPlaying
          ? Math.min(1, Math.max(0.18, 0.28 + 0.7 * Math.abs(Math.sin(phase + i * 0.45))))
          : 0.16;
        return (
          <div
            key={i}
            style={{
              height: `${Math.round(amp * 100)}%`,
              backgroundColor: isPlaying ? '#EF4444' : 'rgba(100, 116, 139, 0.4)',
            }}
            className="flex-1 rounded-full transition-all duration-75"
          />
        );
      })}
    </div>
  );
}
