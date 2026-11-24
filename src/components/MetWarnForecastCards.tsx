import { useState } from 'react';
import { AlertTriangle, HelpCircle, Lightbulb, Search } from 'lucide-react';
import { PROBABILITY_TIERS } from '../services/weatherIntelligence';
import { useStcaUi } from '../theme/themeConfig';
import type {
  ImpactTimelineMatrix,
  MultiDayOutlookForecast,
  RegionalOverlayMode,
  UnofficialWarningAssessment,
} from '../types/weather';

export function UnofficialWarningProbabilityPanel({
  assessments,
  updatedAtText,
}: {
  assessments: UnofficialWarningAssessment[];
  updatedAtText: string;
}) {
  const ui = useStcaUi();
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!assessments.length) return null;
  const safeIdx = selectedIdx < assessments.length ? selectedIdx : 0;
  const selected = assessments[safeIdx];
  const activeTier = selected.tier;

  const containerBg = ui.isGlassFullBleed
    ? 'rgba(16, 36, 56, 0.72)'
    : ui.isTacticalHud
    ? '#0E1015'
    : '#15293B';
  const borderColor = ui.isGlassFullBleed
    ? 'rgba(255,255,255,0.28)'
    : ui.isTacticalHud
    ? '#F59E0B'
    : '#334155';

  return (
    <section
      style={{
        backgroundColor: containerBg,
        borderColor,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderRadius: `${ui.cardRadiusPx}px`,
      }}
      className="text-white p-4 space-y-3 shadow-lg"
    >
      <div className="text-center space-y-0.5">
        <p className="text-sm font-bold text-slate-100">STCA 非官方警告機率評估</p>
        <h3 className="text-xl font-extrabold text-yellow-400">
          天文台發出{selected.nameTc}機會
        </h3>
      </div>

      {/* Warning Selector Chips */}
      <div className="flex flex-wrap gap-1.5">
        {assessments.map((item, idx) => {
          const isSel = idx === safeIdx;
          const pctText = item.isCurrentlyIssued ? '生效中' : `${item.issuanceProbabilityPercent}%`;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              style={{
                backgroundColor: isSel ? item.tier.color : '#0F1E2E',
                borderColor: item.isCurrentlyIssued ? '#EF4444' : '#334155',
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs transition ${
                isSel || item.isCurrentlyIssued ? 'font-bold text-white' : 'font-medium text-slate-300 hover:text-white'
              }`}
            >
              {item.shortBadge} {pctText}
            </button>
          );
        })}
      </div>

      {/* Inner Dark Assessment Card */}
      <div className="rounded-2xl bg-[#1E364D] p-3.5 space-y-3">
        <div
          style={{
            backgroundColor: selected.isCurrentlyIssued ? '#991B1B' : '#7F1D1D',
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
        >
          <span className="w-4.5 h-4.5 rounded-full bg-white text-[#991B1B] text-[11px] font-extrabold inline-flex items-center justify-center">
            {selected.isCurrentlyIssued ? '!' : 'S'}
          </span>
          <span className="text-xs font-bold text-white">
            {selected.nameTc} ({selected.code})
          </span>
        </div>

        {/* Signal Badge + 6-Tier Segmented Probability Bar */}
        <div className="flex items-stretch gap-3">
          <div
            style={{ borderColor: activeTier.color }}
            className="w-[78px] h-[74px] shrink-0 rounded-xl bg-[#0F1E2E] border-2 flex flex-col items-center justify-center p-1"
          >
            <span className="text-yellow-400 text-base font-extrabold leading-tight">
              {selected.shortBadge}
            </span>
            <span className="text-white text-xs font-bold">
              {selected.isCurrentlyIssued ? '100%' : `${selected.issuanceProbabilityPercent}%`}
            </span>
          </div>

          <div className="flex-1 h-[74px] rounded-xl overflow-hidden bg-[#0B1522] grid grid-cols-6">
            {PROBABILITY_TIERS.map((tier) => {
              const isActive = tier.id === activeTier.id;
              return (
                <div
                  key={tier.id}
                  style={{
                    backgroundColor: isActive ? tier.color : `${tier.color}3D`,
                  }}
                  className="flex flex-col items-center justify-center px-0.5 py-1 text-center"
                >
                  <span
                    className={`font-extrabold leading-tight ${
                      tier.labelTc.length > 1 ? 'text-[11px]' : 'text-xs'
                    } ${isActive ? 'text-white' : 'text-white/45'}`}
                  >
                    {tier.labelTc}
                  </span>
                  <span
                    className={`text-[9px] font-semibold mt-0.5 ${
                      isActive ? 'text-white/95' : 'text-white/35'
                    }`}
                  >
                    {tier.rangeText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom 2 Structured Info Boxes: 預測 & 變數 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-xl bg-[#0E2235] overflow-hidden flex flex-col">
            <div className="bg-[#991B1B] px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-white">
              <Search className="w-3.5 h-3.5" />
              <span>預測</span>
            </div>
            <div className="p-2.5 text-xs text-slate-200 leading-relaxed space-y-1">
              <p>{selected.rationale}</p>
              {selected.isCurrentlyIssued && selected.officialIssueTime && (
                <p className="text-sky-300 font-semibold">
                  生效時間：{selected.officialIssueTime.slice(0, 16)}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-[#0E2235] overflow-hidden flex flex-col">
            <div className="bg-[#991B1B] px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-white">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>變數</span>
            </div>
            <div className="p-2.5 text-xs text-slate-200 leading-relaxed space-y-1">
              <p>{selected.variableText}</p>
              {selected.isCurrentlyIssued && selected.estimatedCancellationTime ? (
                <p className="text-amber-300 font-semibold">
                  預計取消：{selected.estimatedCancellationTime}
                </p>
              ) : !selected.isCurrentlyIssued && selected.estimatedIssuanceWindow ? (
                <p className="text-amber-300 font-semibold">
                  預計發出：{selected.estimatedIssuanceWindow}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <p className="text-right text-[11px] text-slate-400">
        評估時間：{updatedAtText} · 註：未發出之警告不會顯示取消時間
      </p>
    </section>
  );
}

export function ImpactTimelineMatrixCard({ matrix }: { matrix: ImpactTimelineMatrix }) {
  const ui = useStcaUi();
  if (!matrix.rows.length) return null;

  const containerBg = ui.isGlassFullBleed
    ? 'rgba(21, 32, 48, 0.75)'
    : ui.isTacticalHud
    ? '#0E1015'
    : '#1F2937';
  const borderColor = ui.isGlassFullBleed
    ? 'rgba(255,255,255,0.28)'
    : ui.isTacticalHud
    ? '#EF4444'
    : '#374151';

  return (
    <section
      style={{
        backgroundColor: containerBg,
        borderColor,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderRadius: `${ui.cardRadiusPx}px`,
      }}
      className="text-white p-4 space-y-3 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-sm font-extrabold text-white">
          {matrix.titleTc}
        </span>
        <span className="text-xs font-bold text-yellow-400">影響高峰時間軸</span>
      </div>

      <div className="rounded-xl bg-red-900/55 px-3 py-2 text-xs font-bold text-yellow-200">
        重點高峰：{matrix.peakSummaryText}
      </div>

      {/* Phase Header */}
      <div className="flex items-center gap-2">
        <div className="w-[60px] shrink-0" />
        <div className="flex-1 grid grid-cols-4 rounded-md overflow-hidden">
          {matrix.columns.map((col, i) => (
            <div
              key={i}
              className={`py-1 text-center text-xs font-extrabold ${
                col.isAlertPhase ? 'bg-red-600 text-white' : 'bg-yellow-500 text-slate-900'
              }`}
            >
              {col.phaseTag}
            </div>
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-2.5">
        {matrix.rows.map((row, idx) => {
          const startF = Math.min(0.9, Math.max(0, row.startFraction));
          const spanF = Math.min(1 - startF, Math.max(0.22, row.endFraction - startF));
          const useDarkText = row.barColor === '#F8FAFC' || row.barColor === '#E2E8F0';
          return (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-[60px] h-[38px] shrink-0 rounded-md bg-white overflow-hidden flex items-stretch">
                <div style={{ backgroundColor: row.pillColor }} className="w-2 shrink-0" />
                <div className="flex-1 flex items-center justify-center text-slate-900 text-xs font-extrabold">
                  {row.categoryName}
                </div>
              </div>

              <div className="flex-1 h-[38px] rounded-lg overflow-hidden relative grid grid-cols-4">
                {matrix.columns.map((col, cIdx) => (
                  <div
                    key={cIdx}
                    className={col.isAlertPhase ? 'bg-red-900/55' : 'bg-[#6B702E]/45'}
                  />
                ))}
                <div
                  style={{
                    left: `${startF * 100}%`,
                    width: `${spanF * 100}%`,
                    backgroundColor: row.barColor,
                    color: useDarkText ? '#0F172A' : '#FFFFFF',
                  }}
                  className="absolute top-1 bottom-1 rounded-md px-2 flex items-center justify-center text-[11px] font-bold truncate shadow"
                >
                  <span className="truncate">{row.barText}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Time Slots */}
      <div className="flex items-center gap-2">
        <div className="w-[60px] shrink-0" />
        <div className="flex-1 grid grid-cols-4 gap-1">
          {matrix.columns.map((col, idx) => (
            <div key={idx} className="rounded-md bg-[#0C4A6E] py-1 px-1 text-center">
              <div className="text-[10px] font-bold text-sky-200">{col.dateLabel}</div>
              <div className="text-[10px] font-extrabold text-white truncate">{col.timeLabel}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RegionalPrdSvg({ mode }: { mode: RegionalOverlayMode }) {
  return (
    <svg viewBox="0 0 600 200" preserveAspectRatio="none" className="w-full h-full">
      {/* Grid */}
      {[1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line x1="0" y1={(200 * i) / 5} x2="600" y2={(200 * i) / 5} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1={(600 * i) / 5} y1="0" x2={(600 * i) / 5} y2="200" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </g>
      ))}
      {/* Mainland Guangdong landmass */}
      <path
        d="M0,0 L600,0 L600,84 L468,96 L372,112 L324,96 L264,68 L204,108 L96,130 L0,144 Z"
        fill="rgba(51, 65, 85, 0.65)"
        stroke="rgba(148, 163, 184, 0.4)"
        strokeWidth="2"
      />

      {mode === 'RAINBAND' &&
        [
          [300, 116, 52],
          [216, 132, 44],
          [396, 128, 48],
          [336, 92, 36],
        ].map(([cx, cy, r], idx) => (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={r * 1.35} fill="rgba(34, 197, 94, 0.32)" />
            <circle cx={cx} cy={cy} r={r * 0.85} fill="rgba(250, 204, 21, 0.45)" />
            <circle cx={cx} cy={cy} r={r * 0.4} fill="rgba(239, 68, 68, 0.5)" />
          </g>
        ))}

      {mode === 'COLD_FRONT' && (
        <g>
          <line x1="48" y1="72" x2="552" y2="102" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" />
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const tx = 600 * (i * 0.13);
            const ty = 72 + 30 * (i * 0.13);
            return <polygon key={i} points={`${tx - 8},${ty} ${tx + 8},${ty} ${tx},${ty + 16}`} fill="#38BDF8" />;
          })}
          {[1, 2, 3, 4, 5].map((i) => {
            const ax = 600 * (i * 0.17);
            return (
              <line
                key={i}
                x1={ax + 12}
                y1={30}
                x2={ax}
                y2={72}
                stroke="rgba(125, 211, 252, 0.55)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      )}

      {mode === 'TYPHOON_WIND' && (
        <g>
          {[1, 2, 3].map((ring) => (
            <circle
              key={ring}
              cx={390}
              cy={136}
              r={ring * 36}
              fill="none"
              stroke={`rgba(245, 158, 11, ${0.45 - ring * 0.1})`}
              strokeWidth="3"
            />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
            const a = (k * Math.PI) / 4;
            const x1 = 390 + Math.cos(a) * 24;
            const y1 = 136 + Math.sin(a) * 24;
            const x2 = 390 + Math.cos(a + 0.4) * 68;
            const y2 = 136 + Math.sin(a + 0.4) * 68;
            return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(253,224,71,0.55)" strokeWidth="2" />;
          })}
        </g>
      )}

      {mode === 'HEAT_DRY' && (
        <circle cx={312} cy={100} r={140} fill="rgba(234, 88, 12, 0.35)" />
      )}

      {mode === 'STABLE' &&
        [1, 2, 3, 4, 5].map((i) => {
          const x = 600 * (i * 0.16);
          return (
            <line
              key={i}
              x1={x + 28}
              y1={110}
              x2={x - 10}
              y2={130}
              stroke="rgba(56, 189, 248, 0.35)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          );
        })}
    </svg>
  );
}

export function MultiDayOutlookCard({ outlook }: { outlook: MultiDayOutlookForecast }) {
  const ui = useStcaUi();
  const containerBg = ui.isGlassFullBleed
    ? 'rgba(10, 36, 60, 0.72)'
    : ui.isTacticalHud
    ? '#0E1015'
    : '#0A243C';
  const borderColor = ui.isGlassFullBleed
    ? 'rgba(255,255,255,0.28)'
    : ui.isTacticalHud
    ? '#F59E0B'
    : '#1E3A5F';

  return (
    <section
      style={{
        backgroundColor: containerBg,
        borderColor,
        borderWidth: '1.5px',
        borderStyle: 'solid',
        borderRadius: `${ui.cardRadiusPx}px`,
      }}
      className="text-white p-4 space-y-3 shadow-lg"
    >
      <h3 className="text-lg sm:text-xl font-extrabold text-center text-white">
        {outlook.headline}
      </h3>

      <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-gradient-to-b from-[#0B253A] via-[#0F3554] to-[#082032]">
        <RegionalPrdSvg mode={outlook.overlayMode} />
        <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-slate-900/85 text-[11px] font-bold">
          珠江口及香港天氣形勢推演
        </div>
        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md bg-red-800 text-[11px] font-bold">
          {outlook.periodBadge}
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/3 -translate-y-1/4 flex flex-col items-center">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>
          <span className="mt-0.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-[11px] font-bold">
            香港 Hong Kong
          </span>
        </div>
      </div>

      {/* 3 Pillars */}
      <div className="space-y-2.5">
        <div className="rounded-xl bg-[#0F766E] p-3.5 flex items-center gap-3">
          <div className="w-14 shrink-0 flex flex-col items-center text-teal-200">
            <Lightbulb className="w-6 h-6" />
            <span className="text-sm font-extrabold mt-0.5">預測</span>
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">{outlook.predictionText}</p>
        </div>

        <div className="rounded-xl bg-[#6A6216] p-3.5 flex items-center gap-3">
          <div className="w-14 shrink-0 flex flex-col items-center text-yellow-300">
            <AlertTriangle className="w-6 h-6" />
            <span className="text-sm font-extrabold mt-0.5">提防</span>
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">{outlook.precautionText}</p>
        </div>

        <div className="rounded-xl bg-[#6B1D4A] p-3.5 flex items-center gap-3">
          <div className="w-14 shrink-0 flex flex-col items-center text-pink-200">
            <HelpCircle className="w-6 h-6" />
            <span className="text-sm font-extrabold mt-0.5">變數</span>
          </div>
          <p className="text-sm text-white font-medium leading-relaxed">{outlook.variableText}</p>
        </div>
      </div>

      {/* Upcoming Days Strip */}
      {outlook.forecastDays.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {outlook.forecastDays.slice(0, 3).map((day) => {
            const shortDate =
              day.forecastDate.length >= 8
                ? `${parseInt(day.forecastDate.slice(4, 6), 10) || ''}/${parseInt(day.forecastDate.slice(6, 8), 10) || ''}`
                : day.forecastDate;
            return (
              <div key={day.forecastDate} className="rounded-xl bg-[#132F4C] p-2.5 space-y-1">
                <p className="text-[11px] font-bold text-sky-300">
                  {shortDate} {day.week}
                </p>
                <p className="text-sm font-extrabold text-white">
                  {Math.trunc(day.forecastMintemp.value)}°–{Math.trunc(day.forecastMaxtemp.value)}°C
                </p>
                <p className="text-[11px] text-slate-300 line-clamp-2">{day.forecastWeather}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
