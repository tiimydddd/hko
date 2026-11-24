import { useEffect, useRef } from 'react';
import type { WeatherSceneInfo } from '../types/weather';

interface WeatherAtmosphereCanvasProps {
  scene: WeatherSceneInfo;
  className?: string;
}

export function WeatherAtmosphereCanvas({ scene, className = '' }: WeatherAtmosphereCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    const start = performance.now();

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w > 0 && h > 0) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w > 0 && h > 0) {
        const phase = ((now - start) % 4200) / 4200;
        ctx.clearRect(0, 0, w, h);

        const id = scene.id;
        if (
          id === 'RAIN_AMBER' ||
          id === 'RAIN_RED' ||
          id === 'RAIN_BLACK' ||
          id === 'FLOOD_NT'
        ) {
          const count = id === 'RAIN_BLACK' ? 38 : 22;
          ctx.strokeStyle = `${scene.accentColor}59`;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          for (let i = 0; i < count; i++) {
            const x = (((i * 73) % 100) / 100) * w;
            const y = ((phase + i * 0.13) % 1) * (h + 80) - 40;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 10, y + 34);
            ctx.stroke();
          }
        } else if (id === 'THUNDERSTORM') {
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.lineWidth = 1.8;
          ctx.lineCap = 'round';
          for (let i = 0; i < 20; i++) {
            const x = (((i * 67) % 100) / 100) * w;
            const y = ((phase + i * 0.17) % 1) * (h + 60) - 30;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 8, y + 28);
            ctx.stroke();
          }
          if (Math.trunc(phase * 10) % 5 === 0) {
            ctx.strokeStyle = 'rgba(253, 224, 71, 0.72)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(w * 0.78, 12);
            ctx.lineTo(w * 0.72, h * 0.35);
            ctx.lineTo(w * 0.79, h * 0.37);
            ctx.lineTo(w * 0.70, h * 0.68);
            ctx.stroke();
          }
        } else if (id === 'TYPHOON') {
          const cx = w * 0.82;
          const cy = h * 0.38;
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          for (let r = 1; r <= 4; r++) {
            const radius = r * 32 + phase * 14;
            ctx.strokeStyle = `${scene.accentColor}${Math.round((0.28 / r + 0.08) * 255)
              .toString(16)
              .padStart(2, '0')}`;
            const startAng = ((phase * 360 + r * 45) * Math.PI) / 180;
            const endAng = startAng + (210 * Math.PI) / 180;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, startAng, endAng);
            ctx.stroke();
          }
        } else if (id === 'COLD' || id === 'FROST') {
          ctx.fillStyle = 'rgba(255,255,255,0.35)';
          for (let i = 0; i < 22; i++) {
            const x = (((i * 89) % 100) / 100) * w + Math.sin(phase * 2 * Math.PI + i) * 8;
            const y = ((phase * 0.6 + i * 0.11) % 1) * h;
            ctx.beginPath();
            ctx.arc(x, y, (i % 3) + 2, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (id === 'HOT') {
          for (let i = 0; i < 3; i++) {
            const r = 80 + i * 44 + Math.sin(phase * 2 * Math.PI) * 10;
            ctx.fillStyle = `rgba(253, 186, 116, ${0.14 - i * 0.03})`;
            ctx.beginPath();
            ctx.arc(w * 0.85, h * 0.24, r, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (id === 'MONSOON' || id === 'FIRE_DRY') {
          ctx.strokeStyle = `${scene.accentColor}40`;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          for (let i = 0; i < 7; i++) {
            const y = h * (0.15 + i * 0.12);
            const xStart = ((phase + i * 0.2) % 1) * w - 120;
            ctx.beginPath();
            ctx.moveTo(xStart, y);
            ctx.lineTo(xStart + 140, y - 8);
            ctx.stroke();
          }
        } else if (id === 'HUMID_FOG') {
          ctx.fillStyle = 'rgba(255,255,255,0.09)';
          for (let i = 0; i < 4; i++) {
            const y = h * (0.25 + i * 0.18);
            const shift = Math.sin(phase * 2 * Math.PI + i) * 24;
            ctx.beginPath();
            ctx.roundRect(-20 + shift, y, w + 40, 22, 12);
            ctx.fill();
          }
        } else if (id === 'LANDSLIP') {
          ctx.fillStyle = `${scene.accentColor}29`;
          ctx.beginPath();
          ctx.moveTo(w * 0.55, h);
          ctx.lineTo(w, h * 0.45);
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = `${scene.accentColor}24`;
          ctx.beginPath();
          ctx.arc(w * 0.85, h * 0.25, 110, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [scene]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full ${className}`}
    />
  );
}
