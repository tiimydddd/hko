import { createContext, useContext } from 'react';
import {
  UI_CORNER_META,
  type AppLayoutStyle,
  type DarkModePref,
  type UiCardCornerStyle,
  type UiLayoutDensity,
  type UiNavBarStyle,
  type UiThemeStyle,
  type UserPreferences,
} from '../types/weather';

export interface StcaColorPalette {
  bg: string;
  onBg: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  errorContainer: string;
  onErrorContainer: string;
  outline: string;
}

const PALETTES: Record<UiThemeStyle, { light: StcaColorPalette; dark: StcaColorPalette }> = {
  OBSERVATORY_COMMAND: {
    light: {
      bg: '#F3F7FB',
      onBg: '#0A192F',
      surface: '#FFFFFF',
      onSurface: '#0A192F',
      surfaceVariant: '#E4EEF8',
      onSurfaceVariant: '#475569',
      primary: '#0369A1',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E0F2FE',
      onPrimaryContainer: '#082F49',
      secondary: '#0891B2',
      secondaryContainer: '#CFFAFE',
      onSecondaryContainer: '#164E63',
      tertiary: '#D97706',
      tertiaryContainer: '#FEF3C7',
      onTertiaryContainer: '#78350F',
      error: '#DC2626',
      errorContainer: '#FEE2E2',
      onErrorContainer: '#7F1D1D',
      outline: '#CBD5E1',
    },
    dark: {
      bg: '#041222',
      onBg: '#F1F5F9',
      surface: '#061E38',
      onSurface: '#F1F5F9',
      surfaceVariant: '#0D2744',
      onSurfaceVariant: '#94A3B8',
      primary: '#22D3EE',
      onPrimary: '#042F42',
      primaryContainer: '#0E4A6F',
      onPrimaryContainer: '#E0F2FE',
      secondary: '#38BDF8',
      secondaryContainer: '#164E63',
      onSecondaryContainer: '#CFFAFE',
      tertiary: '#F59E0B',
      tertiaryContainer: '#78350F',
      onTertiaryContainer: '#FEF3C7',
      error: '#F87171',
      errorContainer: '#7F1D1D',
      onErrorContainer: '#FEE2E2',
      outline: '#28466B',
    },
  },
  RADAR_GLASS: {
    light: {
      bg: '#EEF2FF',
      onBg: '#0F172A',
      surface: 'rgba(248, 250, 252, 0.92)',
      onSurface: '#0F172A',
      surfaceVariant: '#E0E7FF',
      onSurfaceVariant: '#475569',
      primary: '#4F46E5',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E0E7FF',
      onPrimaryContainer: '#1E1B4B',
      secondary: '#06B6D4',
      secondaryContainer: '#CFFAFE',
      onSecondaryContainer: '#083344',
      tertiary: '#9333EA',
      tertiaryContainer: '#F3E8FF',
      onTertiaryContainer: '#3B0764',
      error: '#E11D48',
      errorContainer: '#FFE4E6',
      onErrorContainer: '#881337',
      outline: '#818CF8',
    },
    dark: {
      bg: '#090D1F',
      onBg: '#F8FAFC',
      surface: 'rgba(19, 27, 54, 0.88)',
      onSurface: '#F8FAFC',
      surfaceVariant: '#1E294E',
      onSurfaceVariant: '#A5B4FC',
      primary: '#818CF8',
      onPrimary: '#1E1B4B',
      primaryContainer: '#312E81',
      onPrimaryContainer: '#E0E7FF',
      secondary: '#22D3EE',
      secondaryContainer: '#164E63',
      onSecondaryContainer: '#CFFAFE',
      tertiary: '#C084FC',
      tertiaryContainer: '#581C87',
      onTertiaryContainer: '#F3E8FF',
      error: '#FB7185',
      errorContainer: '#881337',
      onErrorContainer: '#FFE4E6',
      outline: '#4F46E5',
    },
  },
  EDITORIAL_MINIMAL: {
    light: {
      bg: '#FAFAFA',
      onBg: '#111827',
      surface: '#FFFFFF',
      onSurface: '#111827',
      surfaceVariant: '#F1F5F9',
      onSurfaceVariant: '#4B5563',
      primary: '#1D4ED8',
      onPrimary: '#FFFFFF',
      primaryContainer: '#DBEAFE',
      onPrimaryContainer: '#1E3A8A',
      secondary: '#334155',
      secondaryContainer: '#E2E8F0',
      onSecondaryContainer: '#0F172A',
      tertiary: '#DC2626',
      tertiaryContainer: '#FEE2E2',
      onTertiaryContainer: '#7F1D1D',
      error: '#B91C1C',
      errorContainer: '#FEE2E2',
      onErrorContainer: '#7F1D1D',
      outline: '#E5E7EB',
    },
    dark: {
      bg: '#111315',
      onBg: '#F9FAFB',
      surface: '#1A1D21',
      onSurface: '#F9FAFB',
      surfaceVariant: '#262A30',
      onSurfaceVariant: '#9CA3AF',
      primary: '#93C5FD',
      onPrimary: '#1E3A8A',
      primaryContainer: '#1E40AF',
      onPrimaryContainer: '#DBEAFE',
      secondary: '#CBD5E1',
      secondaryContainer: '#334155',
      onSecondaryContainer: '#F1F5F9',
      tertiary: '#FCA5A5',
      tertiaryContainer: '#991B1B',
      onTertiaryContainer: '#FEE2E2',
      error: '#F87171',
      errorContainer: '#7F1D1D',
      onErrorContainer: '#FEE2E2',
      outline: '#374151',
    },
  },
  EMERGENCY_TACTICAL: {
    light: {
      bg: '#F5F5F4',
      onBg: '#18181B',
      surface: '#FFFFFF',
      onSurface: '#18181B',
      surfaceVariant: '#E7E5E4',
      onSurfaceVariant: '#44403C',
      primary: '#B45309',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FEF3C7',
      onPrimaryContainer: '#451A03',
      secondary: '#DC2626',
      secondaryContainer: '#FEE2E2',
      onSecondaryContainer: '#7F1D1D',
      tertiary: '#0F766E',
      tertiaryContainer: '#CCFBF1',
      onTertiaryContainer: '#134E4A',
      error: '#B91C1C',
      errorContainer: '#FEE2E2',
      onErrorContainer: '#7F1D1D',
      outline: '#D97706',
    },
    dark: {
      bg: '#09090B',
      onBg: '#FAFAFA',
      surface: '#18181B',
      onSurface: '#FAFAFA',
      surfaceVariant: '#27272A',
      onSurfaceVariant: '#A1A1AA',
      primary: '#FBBF24',
      onPrimary: '#271700',
      primaryContainer: '#78350F',
      onPrimaryContainer: '#FEF3C7',
      secondary: '#FB7185',
      secondaryContainer: '#881337',
      onSecondaryContainer: '#FFE4E6',
      tertiary: '#34D399',
      tertiaryContainer: '#065F46',
      onTertiaryContainer: '#D1FAE5',
      error: '#EF4444',
      errorContainer: '#7F1D1D',
      onErrorContainer: '#FEE2E2',
      outline: '#F59E0B',
    },
  },
  NORDIC_FROST: {
    light: {
      bg: '#F0FDFA',
      onBg: '#0F172A',
      surface: '#FFFFFF',
      onSurface: '#0F172A',
      surfaceVariant: 'rgba(204, 251, 241, 0.65)',
      onSurfaceVariant: '#334155',
      primary: '#0284C7',
      onPrimary: '#FFFFFF',
      primaryContainer: '#E0F2FE',
      onPrimaryContainer: '#0C4A6E',
      secondary: '#0D9488',
      secondaryContainer: '#CCFBF1',
      onSecondaryContainer: '#115E59',
      tertiary: '#6366F1',
      tertiaryContainer: '#E0E7FF',
      onTertiaryContainer: '#312E81',
      error: '#E11D48',
      errorContainer: '#FFE4E6',
      onErrorContainer: '#881337',
      outline: '#99F6E4',
    },
    dark: {
      bg: '#061B22',
      onBg: '#ECFEFF',
      surface: '#0B2933',
      onSurface: '#ECFEFF',
      surfaceVariant: '#133E4A',
      onSurfaceVariant: '#99F6E4',
      primary: '#7DD3FC',
      onPrimary: '#082F49',
      primaryContainer: '#075985',
      onPrimaryContainer: '#E0F2FE',
      secondary: '#5EEAD4',
      secondaryContainer: '#115E59',
      onSecondaryContainer: '#CCFBF1',
      tertiary: '#A5B4FC',
      tertiaryContainer: '#3730A3',
      onTertiaryContainer: '#E0E7FF',
      error: '#FB7185',
      errorContainer: '#881337',
      onErrorContainer: '#FFE4E6',
      outline: '#14B8A6',
    },
  },
  SUNSET_METEO: {
    light: {
      bg: '#FFF7ED',
      onBg: '#271408',
      surface: '#FFFFFF',
      onSurface: '#271408',
      surfaceVariant: 'rgba(254, 215, 170, 0.55)',
      onSurfaceVariant: '#7C2D12',
      primary: '#C2410C',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFEDD5',
      onPrimaryContainer: '#7C2D12',
      secondary: '#B45309',
      secondaryContainer: '#FEF3C7',
      onSecondaryContainer: '#78350F',
      tertiary: '#7E22CE',
      tertiaryContainer: '#F3E8FF',
      onTertiaryContainer: '#581C87',
      error: '#DC2626',
      errorContainer: '#FEE2E2',
      onErrorContainer: '#7F1D1D',
      outline: '#FDBA74',
    },
    dark: {
      bg: '#1A0F14',
      onBg: '#FFF7ED',
      surface: '#291720',
      onSurface: '#FFF7ED',
      surfaceVariant: '#3B202C',
      onSurfaceVariant: '#FDBA74',
      primary: '#FB923C',
      onPrimary: '#431407',
      primaryContainer: '#9A3412',
      onPrimaryContainer: '#FFEDD5',
      secondary: '#FBBF24',
      secondaryContainer: '#78350F',
      onSecondaryContainer: '#FEF3C7',
      tertiary: '#D8B4FE',
      tertiaryContainer: '#6B21A8',
      onTertiaryContainer: '#F3E8FF',
      error: '#F87171',
      errorContainer: '#7F1D1D',
      onErrorContainer: '#FEE2E2',
      outline: '#EA580C',
    },
  },
};

export interface StcaUiConfig {
  appLayout: AppLayoutStyle;
  themeStyle: UiThemeStyle;
  cornerStyle: UiCardCornerStyle;
  density: UiLayoutDensity;
  navBarStyle: UiNavBarStyle;
  isDark: boolean;
  isCompact: boolean;
  isGlassFullBleed: boolean;
  isTacticalHud: boolean;
  isEditorial: boolean;
  isMeteoCommand: boolean;
  cardRadiusPx: number;
  heroRadiusPx: number;
  paddingClass: string;
  spacingClass: string;
  innerPaddingClass: string;
  palette: StcaColorPalette;
  cardBg: string;
  subtleBg: string;
  cardBorderColor: string | null;
  cardBorderWidth: number;
}

export function resolveIsDark(pref: DarkModePref, systemPrefersDark: boolean): boolean {
  if (pref === 'DARK') return true;
  if (pref === 'LIGHT') return false;
  return systemPrefersDark;
}

export function buildStcaUiConfig(prefs: UserPreferences, systemPrefersDark: boolean): StcaUiConfig {
  const isDark = resolveIsDark(prefs.darkModePref, systemPrefersDark);
  const appLayout = prefs.appLayoutStyle;
  const themeStyle = prefs.uiThemeStyle;
  const cornerStyle = prefs.uiCardCorner;
  const density = prefs.uiDensity;
  const navBarStyle = prefs.uiNavBarStyle;

  const isGlassFullBleed = appLayout === 'APPLE_WEATHER_GLASS';
  const isTacticalHud = appLayout === 'TACTICAL_HUD';
  const isEditorial = appLayout === 'EDITORIAL_MAGAZINE';
  const isMeteoCommand = appLayout === 'METEO_COMMAND';
  const isCompact = density === 'COMPACT';

  const basePalette = PALETTES[themeStyle]?.[isDark ? 'dark' : 'light'] ?? PALETTES.OBSERVATORY_COMMAND.light;
  const palette: StcaColorPalette =
    isTacticalHud && isDark
      ? { ...basePalette, bg: '#040406', surface: '#0D0E12' }
      : basePalette;

  const cardRadiusPx = UI_CORNER_META[cornerStyle]?.cornerPx ?? 20;
  const heroRadiusPx = cardRadiusPx + 6;

  const paddingClass =
    density === 'COMPACT' ? 'p-3' : density === 'SPACIOUS' ? 'p-5' : 'p-4';
  const spacingClass =
    density === 'COMPACT' ? 'space-y-2.5' : density === 'SPACIOUS' ? 'space-y-4.5' : 'space-y-3.5';
  const innerPaddingClass =
    density === 'COMPACT' ? 'p-3' : density === 'SPACIOUS' ? 'p-5' : 'p-4';

  const cardBg = isGlassFullBleed
    ? isDark
      ? 'rgba(13, 24, 44, 0.56)'
      : 'rgba(255, 255, 255, 0.80)'
    : isTacticalHud && isDark
    ? '#0D0E12'
    : palette.surface;

  const subtleBg = isGlassFullBleed
    ? isDark
      ? 'rgba(18, 34, 62, 0.45)'
      : 'rgba(241, 245, 249, 0.72)'
    : isTacticalHud && isDark
    ? '#14161D'
    : palette.surfaceVariant;

  let cardBorderColor: string | null = null;
  let cardBorderWidth = 1;
  if (isGlassFullBleed) {
    cardBorderColor = isDark ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.65)';
  } else if (isTacticalHud || themeStyle === 'EMERGENCY_TACTICAL') {
    cardBorderColor = palette.outline;
    cardBorderWidth = 1.5;
  } else if (isMeteoCommand) {
    cardBorderColor = `${palette.primary}66`;
  } else if (isEditorial || themeStyle === 'EDITORIAL_MINIMAL') {
    cardBorderColor = `${palette.outline}B3`;
  } else if (themeStyle === 'RADAR_GLASS') {
    cardBorderColor = `${palette.outline}8C`;
  }

  return {
    appLayout,
    themeStyle,
    cornerStyle,
    density,
    navBarStyle,
    isDark,
    isCompact,
    isGlassFullBleed,
    isTacticalHud,
    isEditorial,
    isMeteoCommand,
    cardRadiusPx,
    heroRadiusPx,
    paddingClass,
    spacingClass,
    innerPaddingClass,
    palette,
    cardBg,
    subtleBg,
    cardBorderColor,
    cardBorderWidth,
  };
}

export function applyThemeCssVariables(cfg: StcaUiConfig): void {
  const root = document.documentElement;
  if (cfg.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  const p = cfg.palette;
  root.style.setProperty('--stca-bg', p.bg);
  root.style.setProperty('--stca-on-bg', p.onBg);
  root.style.setProperty('--stca-surface', p.surface);
  root.style.setProperty('--stca-on-surface', p.onSurface);
  root.style.setProperty('--stca-surface-variant', p.surfaceVariant);
  root.style.setProperty('--stca-on-surface-variant', p.onSurfaceVariant);
  root.style.setProperty('--stca-primary', p.primary);
  root.style.setProperty('--stca-on-primary', p.onPrimary);
  root.style.setProperty('--stca-primary-container', p.primaryContainer);
  root.style.setProperty('--stca-on-primary-container', p.onPrimaryContainer);
  root.style.setProperty('--stca-secondary', p.secondary);
  root.style.setProperty('--stca-secondary-container', p.secondaryContainer);
  root.style.setProperty('--stca-on-secondary-container', p.onSecondaryContainer);
  root.style.setProperty('--stca-tertiary', p.tertiary);
  root.style.setProperty('--stca-tertiary-container', p.tertiaryContainer);
  root.style.setProperty('--stca-on-tertiary-container', p.onTertiaryContainer);
  root.style.setProperty('--stca-error', p.error);
  root.style.setProperty('--stca-error-container', p.errorContainer);
  root.style.setProperty('--stca-on-error-container', p.onErrorContainer);
  root.style.setProperty('--stca-outline', p.outline);
  root.style.setProperty('--stca-card-radius', `${cfg.cardRadiusPx}px`);
  root.style.setProperty('--stca-hero-radius', `${cfg.heroRadiusPx}px`);
}

const DEFAULT_CFG = buildStcaUiConfig(
  {
    userId: '',
    displayName: 'Citizen',
    quietHoursEnabled: true,
    quietStartHour: 22,
    quietStartMinute: 30,
    quietEndHour: 7,
    quietEndMinute: 0,
    tempAlertThreshold: 15,
    easAutoPlay: true,
    easToneType: 'SAME_DUAL',
    autoPushEnabled: true,
    darkModePref: 'SYSTEM',
    broadcastLang: 'TC',
    selectedDistrict: '油尖旺區',
    emergencySmsNumber: '',
    uiThemeStyle: 'OBSERVATORY_COMMAND',
    uiCardCorner: 'ROUNDED',
    uiDensity: 'STANDARD',
    uiNavBarStyle: 'CLASSIC',
    useDynamicColor: false,
    appLayoutStyle: 'CLASSIC_OBSERVATORY',
  },
  false
);

export const StcaUiContext = createContext<StcaUiConfig>(DEFAULT_CFG);

export function useStcaUi(): StcaUiConfig {
  return useContext(StcaUiContext);
}

export function cardSurfaceStyle(cfg: StcaUiConfig, subtle = false): React.CSSProperties {
  return {
    backgroundColor: subtle ? cfg.subtleBg : cfg.cardBg,
    color: cfg.palette.onSurface,
    borderRadius: `${cfg.cardRadiusPx}px`,
    border: cfg.cardBorderColor
      ? `${cfg.cardBorderWidth}px solid ${cfg.cardBorderColor}`
      : '1px solid rgba(148, 163, 184, 0.16)',
    backdropFilter: cfg.isGlassFullBleed ? 'blur(18px)' : undefined,
    WebkitBackdropFilter: cfg.isGlassFullBleed ? 'blur(18px)' : undefined,
  };
}
