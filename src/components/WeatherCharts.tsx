import { useCallback, useEffect, useRef, useState } from 'react';
import {
  HK_DISTRICTS,
  type CommunityReport,
  type DailyForecastItem,
  type RainfallItem,
  type ShelterLocation,
} from '../types/weather';
import { useStcaUi } from '../theme/themeConfig';

export function NineDayTempTrendChart({
  forecast,
  coldThreshold,
}: {
  forecast: DailyForecastItem[];
  coldThreshold: number;
}) {
  const ui = useStcaUi();
  if (!forecast.length) return null;

  const w = 640;
  const h = 230;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 30;
  const padBottom = 38;
  const chartW = w - padLeft - padRight;
  const chartH = h - padTop - padBottom;

  const allMax = Math.max(...forecast.map((d) => d.forecastMaxtemp.value));
  const allMin = Math.min(...forecast.map((d) => d.forecastMintemp.value));
  const yMax = Math.max(allMax + 2, coldThreshold + 4);
  const yMin = Math.min(allMin - 2, coldThreshold - 3);
  const ySpan = Math.max(1, yMax - yMin);

  const yForTemp = (t: number) => padTop + chartH * (1 - (t - yMin) / ySpan);
  const stepX = forecast.length > 1 ? chartW / (forecast.length - 1) : chartW;

  const maxPts = forecast.map((d, i) => ({
    x: padLeft + i * stepX,
    y: yForTemp(d.forecastMaxtemp.value),
    val: Math.trunc(d.forecastMaxtemp.value),
    label: d.week.replace('星期', ''),
  }));
  const minPts = forecast.map((d, i) => ({
    x: padLeft + i * stepX,
    y: yForTemp(d.forecastMintemp.value),
    val: Math.trunc(d.forecastMintemp.value),
  }));

  const maxLine = maxPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const minLine = minPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${maxLine} ${[...minPts]
    .reverse()
    .map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ')} Z`;
  const thY = yForTemp(coldThreshold);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-56 select-none">
        <defs>
          <linearGradient id="tempBandGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <line
          x1={padLeft}
          y1={thY}
          x2={w - padRight}
          y2={thY}
          stroke="#22D3EE"
          strokeOpacity="0.6"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <text x={8} y={thY + 4} fill="#22D3EE" fontSize="11" fontWeight="700">
          {Math.trunc(coldThreshold)}°
        </text>

        <path d={areaPath} fill="url(#tempBandGrad)" />
        <path d={maxLine} fill="none" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={minLine} fill="none" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {maxPts.map((pt, idx) => {
          const minPt = minPts[idx];
          return (
            <g key={idx}>
              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#F59E0B" />
              <circle cx={minPt.x} cy={minPt.y} r="4.5" fill="#38BDF8" />
              <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#F59E0B" fontSize="11" fontWeight="700">
                {pt.val}°
              </text>
              <text x={minPt.x} y={minPt.y + 16} textAnchor="middle" fill="#38BDF8" fontSize="11" fontWeight="700">
                {minPt.val}°
              </text>
              <text x={pt.x} y={h - 10} textAnchor="middle" fill={ui.palette.onSurfaceVariant} fontSize="11" fontWeight="600">
                {pt.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RegionalRainfallChart({ rainfall }: { rainfall: RainfallItem[] }) {
  const topItems = rainfall.slice(0, 10);
  const maxVal = Math.max(10, ...topItems.map((r) => r.max));

  return (
    <div className="space-y-2.5">
      {topItems.map((item) => {
        const ratio = Math.min(100, Math.max(2, (item.max / maxVal) * 100));
        const barColor =
          item.max >= 50
            ? '#EF4444'
            : item.max >= 20
            ? '#F59E0B'
            : item.max > 0
            ? '#38BDF8'
            : 'rgba(100, 116, 139, 0.45)';
        return (
          <div key={item.place} className="grid grid-cols-[110px_1fr_58px] items-center gap-2.5 text-xs">
            <span className="truncate font-medium">{item.place}</span>
            <div className="h-3.5 rounded-full bg-slate-500/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: item.max > 0 ? `${ratio}%` : '4px',
                  backgroundColor: barColor,
                }}
              />
            </div>
            <span className="text-right font-mono-telemetry font-semibold">
              {item.max.toFixed(1)}mm
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface OfflineHkVectorMapCanvasProps {
  shelters: ShelterLocation[];
  reports: CommunityReport[];
  userCoords: [number, number] | null;
  selectedDistrict: string;
  selectedShelterId?: string | null;
  externalZoomMultiplier?: number;
  resetKey?: number;
  onSelectShelter?: (shelter: ShelterLocation) => void;
  className?: string;
}

const NT_POLYGON: [number, number][] = [
  [22.5, 113.98],
  [22.55, 114.12],
  [22.53, 114.25],
  [22.42, 114.36],
  [22.29, 114.28],
  [22.3, 114.17],
  [22.34, 114.12],
  [22.37, 113.96],
  [22.45, 113.93],
];
const HKI_POLYGON: [number, number][] = [
  [22.28, 114.12],
  [22.29, 114.24],
  [22.22, 114.25],
  [22.21, 114.16],
  [22.25, 114.12],
];
const LANTAU_POLYGON: [number, number][] = [
  [22.31, 113.85],
  [22.33, 113.98],
  [22.26, 114.04],
  [22.21, 113.92],
  [22.24, 113.84],
];
const CHEUNG_CHAU_POLYGON: [number, number][] = [
  [22.218, 114.022],
  [22.218, 114.038],
  [22.2, 114.038],
  [22.2, 114.022],
];

const MIN_LAT = 22.18;
const MAX_LAT = 22.56;
const MIN_LON = 113.83;
const MAX_LON = 114.42;

export function OfflineHkVectorMapCanvas({
  shelters,
  reports,
  userCoords,
  selectedDistrict,
  selectedShelterId = null,
  externalZoomMultiplier = 1,
  resetKey = 0,
  onSelectShelter,
  className = '',
}: OfflineHkVectorMapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gestureScale, setGestureScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ active: boolean; moved: boolean; startX: number; startY: number; origX: number; origY: number }>({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    origX: 0,
    origY: 0,
  });

  useEffect(() => {
    setGestureScale(1);
    setOffset({ x: 0, y: 0 });
  }, [resetKey]);

  const totalScale = Math.min(4, Math.max(0.85, gestureScale * externalZoomMultiplier));

  const projectPoint = useCallback(
    (lat: number, lon: number, w: number, h: number) => {
      const nx = (lon - MIN_LON) / (MAX_LON - MIN_LON);
      const ny = 1 - (lat - MIN_LAT) / (MAX_LAT - MIN_LAT);
      const cx = w / 2;
      const cy = h / 2;
      return {
        x: (nx * w - cx) * totalScale + cx + offset.x,
        y: (ny * h - cy) * totalScale + cy + offset.y,
      };
    },
    [totalScale, offset.x, offset.y]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w <= 0 || h <= 0) return;

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Sea gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#071A2F');
      bg.addColorStop(1, '#0A2A47');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const gx = (w * i) / 5;
        const gy = (h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Landmass polygons
      [NT_POLYGON, HKI_POLYGON, LANTAU_POLYGON, CHEUNG_CHAU_POLYGON].forEach((poly) => {
        ctx.beginPath();
        poly.forEach(([la, lo], idx) => {
          const pt = projectPoint(la, lo, w, h);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fillStyle = '#173D5E';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // District labels
      HK_DISTRICTS.filter((d, i) => i % 2 === 0 || d.districtTc === selectedDistrict).forEach((d) => {
        const pt = projectPoint(d.latitude, d.longitude, w, h);
        const isSel = d.districtTc === selectedDistrict;
        ctx.fillStyle = isSel ? '#22D3EE' : '#94A3B8';
        ctx.font = isSel ? 'bold 11px "Plus Jakarta Sans", sans-serif' : '9px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(d.districtTc.replace('區', ''), pt.x - 14, pt.y + 3);
      });

      const districtObj = HK_DISTRICTS.find((d) => d.districtTc === selectedDistrict);
      const uLat = userCoords ? userCoords[0] : districtObj?.latitude ?? 22.3019;
      const uLon = userCoords ? userCoords[1] : districtObj?.longitude ?? 114.1742;
      const uPt = projectPoint(uLat, uLon, w, h);

      const selectedShelter = shelters.find((s) => s.id === selectedShelterId) ?? null;
      if (selectedShelter) {
        const sPt = projectPoint(selectedShelter.latitude, selectedShelter.longitude, w, h);
        ctx.save();
        ctx.strokeStyle = '#34D399';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(uPt.x, uPt.y);
        ctx.lineTo(sPt.x, sPt.y);
        ctx.stroke();
        ctx.restore();
      }

      // Shelter pins
      shelters.forEach((sh) => {
        const pt = projectPoint(sh.latitude, sh.longitude, w, h);
        const isSelected = sh.id === selectedShelterId;
        if (isSelected) {
          ctx.fillStyle = 'rgba(52, 211, 153, 0.35)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 18, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FDE047';
          ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(
            sh.nameTc.slice(0, 10),
            Math.min(w - 130, pt.x + 12),
            Math.max(16, pt.y - 10)
          );
        } else {
          ctx.fillStyle = '#10B981';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Community hazard pins
      reports.forEach((rep) => {
        const pt = projectPoint(rep.latitude, rep.longitude, w, h);
        const isSevere = rep.severity === 'CRITICAL' || rep.severity === 'SEVERE';
        ctx.fillStyle = isSevere ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isSevere ? '#EF4444' : '#F59E0B';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // User beacon
      ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
      ctx.beginPath();
      ctx.arc(uPt.x, uPt.y, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22D3EE';
      ctx.beginPath();
      ctx.arc(uPt.x, uPt.y, 6.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(uPt.x, uPt.y, 2.8, 0, Math.PI * 2);
      ctx.fill();

      // North indicator
      ctx.fillStyle = 'rgba(186, 230, 253, 0.88)';
      ctx.font = 'bold 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('N ↑ · 離線向量圖', 12, 20);
    };

    render();
    const ro = new ResizeObserver(render);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [shelters, reports, userCoords, selectedDistrict, selectedShelterId, projectPoint]);

  return (
    <canvas
      ref={canvasRef}
      onWheel={(e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.12 : 0.9;
        setGestureScale((s) => Math.min(3.5, Math.max(0.85, s * factor)));
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
          active: true,
          moved: false,
          startX: e.clientX,
          startY: e.clientY,
          origX: offset.x,
          origY: offset.y,
        };
      }}
      onPointerMove={(e) => {
        if (!dragRef.current.active) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          dragRef.current.moved = true;
        }
        setOffset({
          x: Math.min(360, Math.max(-360, dragRef.current.origX + dx)),
          y: Math.min(260, Math.max(-260, dragRef.current.origY + dy)),
        });
      }}
      onPointerUp={(e) => {
        const wasMoved = dragRef.current.moved;
        dragRef.current.active = false;
        if (wasMoved || !onSelectShelter || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const tapY = e.clientY - rect.top;
        let best: { sh: ShelterLocation; dist2: number } | null = null;
        for (const sh of shelters) {
          const pt = projectPoint(sh.latitude, sh.longitude, rect.width, rect.height);
          const dx = pt.x - tapX;
          const dy = pt.y - tapY;
          const dist2 = dx * dx + dy * dy;
          if (!best || dist2 < best.dist2) {
            best = { sh, dist2 };
          }
        }
        if (best && best.dist2 <= 28 * 28) {
          onSelectShelter(best.sh);
        }
      }}
      className={`w-full h-[280px] touch-none cursor-grab active:cursor-grabbing block ${className}`}
    />
  );
}
