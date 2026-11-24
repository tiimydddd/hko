import type { EasToneType, UserPreferences } from '../types/weather';

type AudioListener = (playing: boolean) => void;

class EasAudioEngineImpl {
  private isPlayingState = false;
  private listeners = new Set<AudioListener>();
  private audioEl: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private stopTimer: number | null = null;

  subscribe(fn: AudioListener): () => void {
    this.listeners.add(fn);
    fn(this.isPlayingState);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private setPlaying(val: boolean): void {
    this.isPlayingState = val;
    this.listeners.forEach((fn) => fn(val));
  }

  getIsPlaying(): boolean {
    return this.isPlayingState;
  }

  isWithinQuietHours(prefs: UserPreferences, date: Date = new Date()): boolean {
    if (!prefs.quietHoursEnabled) return false;
    const nowMinutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = prefs.quietStartHour * 60 + prefs.quietStartMinute;
    const endMinutes = prefs.quietEndHour * 60 + prefs.quietEndMinute;
    if (startMinutes <= endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }
    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }

  formatQuietWindow(prefs: UserPreferences): string {
    const sh = String(prefs.quietStartHour).padStart(2, '0');
    const sm = String(prefs.quietStartMinute).padStart(2, '0');
    const eh = String(prefs.quietEndHour).padStart(2, '0');
    const em = String(prefs.quietEndMinute).padStart(2, '0');
    return `${sh}:${sm} – ${eh}:${em}`;
  }

  playAlertTone(toneType: EasToneType, volume = 0.85, durationSeconds = 5): void {
    this.stop();
    const safeVol = Math.min(1, Math.max(0.05, volume));

    if (toneType === 'HKO_MP3') {
      try {
        const audio = new Audio(`${import.meta.env.BASE_URL}eas_hko_warning.mp3`);
        audio.volume = safeVol;
        this.audioEl = audio;
        this.setPlaying(true);

        audio.onended = () => {
          if (this.audioEl === audio) {
            this.audioEl = null;
            this.setPlaying(false);
          }
        };
        audio.onerror = () => {
          if (this.audioEl === audio) {
            this.audioEl = null;
            this.playSynthesized('SAME_DUAL', safeVol, durationSeconds);
          }
        };

        void audio.play().catch(() => {
          if (this.audioEl === audio) {
            this.audioEl = null;
            this.playSynthesized('SAME_DUAL', safeVol, durationSeconds);
          }
        });
        return;
      } catch {
        // fallback to Web Audio synthesizer
      }
    }

    this.playSynthesized(toneType, safeVol, durationSeconds);
  }

  private playSynthesized(toneType: EasToneType, safeVol: number, durationSeconds: number): void {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) {
        this.setPlaying(false);
        return;
      }
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new Ctx();
      }
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }

      const sampleRate = this.audioCtx.sampleRate || 44100;
      const totalSamples = Math.floor(sampleRate * durationSeconds);
      const buffer = this.audioCtx.createBuffer(1, totalSamples, sampleRate);
      const channel = buffer.getChannelData(0);

      for (let i = 0; i < totalSamples; i++) {
        const t = i / sampleRate;
        let sampleVal = 0;
        if (toneType === 'SAME_DUAL' || toneType === 'HKO_MP3') {
          if (t < 0.9) {
            const gate = Math.trunc(t * 14) % 2 === 0 ? 1.0 : 0.15;
            const freq = Math.trunc(t * 28) % 2 === 0 ? 2083.3 : 1562.5;
            sampleVal = Math.sin(2.0 * Math.PI * freq * t) * gate * 0.55;
          } else {
            const pulse = Math.trunc(t * 2.0) % 2 === 0 ? 1.0 : 0.72;
            sampleVal =
              0.5 *
              (Math.sin(2.0 * Math.PI * 853.0 * t) + Math.sin(2.0 * Math.PI * 960.0 * t)) *
              pulse;
          }
        } else if (toneType === 'TYPHOON_SIREN') {
          const phase = (t % 1.6) / 1.6;
          const tri = phase < 0.5 ? phase * 2.0 : (1.0 - phase) * 2.0;
          const freq = 520.0 + 460.0 * tri;
          sampleVal = Math.sin(2.0 * Math.PI * freq * t) * 0.85;
        } else {
          // COLD_CHIME
          const cycle = t % 1.5;
          let freq = 0;
          if (cycle < 0.45) freq = 880.0;
          else if (cycle < 0.9) freq = 1174.66;
          else if (cycle < 1.35) freq = 659.25;
          const decay = 1.0 - ((cycle % 0.45) / 0.45) * 0.6;
          sampleVal = freq === 0 ? 0 : Math.sin(2.0 * Math.PI * freq * t) * decay * 0.8;
        }

        const fadeOut = i > totalSamples - sampleRate * 0.1 ? (totalSamples - i) / (sampleRate * 0.1) : 1.0;
        channel[i] = Math.max(-1, Math.min(1, sampleVal * safeVol * fadeOut));
      }

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      this.activeSource = source;
      this.setPlaying(true);

      source.onended = () => {
        if (this.activeSource === source) {
          this.activeSource = null;
          this.setPlaying(false);
        }
      };

      source.start();
      this.stopTimer = window.setTimeout(() => {
        if (this.activeSource === source) {
          this.stop();
        }
      }, durationSeconds * 1000 + 250);
    } catch {
      this.setPlaying(false);
    }
  }

  stop(): void {
    if (this.stopTimer !== null) {
      window.clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    if (this.audioEl) {
      try {
        this.audioEl.pause();
        this.audioEl.currentTime = 0;
      } catch {
        // ignore
      }
      this.audioEl = null;
    }
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {
        // ignore
      }
      this.activeSource = null;
    }
    this.setPlaying(false);
  }
}

export const EasAudioEngine = new EasAudioEngineImpl();
