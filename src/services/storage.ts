import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/firebase';
import {
  DEFAULT_USER_PREFERENCES,
  HK_SHELTERS,
  type CommunityReport,
  type HazardType,
  type ReportSeverity,
  type ShelterCacheStatus,
  type ShelterLocation,
  type UserPreferences,
  type WeatherHistoryRecord,
} from '../types/weather';

const PREFS_STORAGE_KEY = 'stca_user_prefs_v1';
const LOCAL_HISTORY_KEY = 'stca_local_history_v1';
const LOCAL_REPORTS_KEY = 'stca_local_reports_v1';
const SHELTER_CACHE_KEY = 'stca_offline_shelters_cache_v1';

function isValidFirestoreId(id: string): boolean {
  return id.length >= 1 && id.length <= 128 && /^[a-zA-Z0-9_-]+$/.test(id);
}

export function loadLocalPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences>;
    return { ...DEFAULT_USER_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveLocalPreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

export function loadLocalHistory(): WeatherHistoryRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as WeatherHistoryRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalHistoryRecord(record: Omit<WeatherHistoryRecord, 'id'>): WeatherHistoryRecord[] {
  const next: WeatherHistoryRecord = {
    ...record,
    id: `local_hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  const list = [next, ...loadLocalHistory()].slice(0, 60);
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}

export function deleteLocalHistoryRecord(recordId: string): WeatherHistoryRecord[] {
  const list = loadLocalHistory().filter((r) => r.id !== recordId);
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}

export function loadLocalReports(): CommunityReport[] {
  try {
    const raw = localStorage.getItem(LOCAL_REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CommunityReport[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalReport(report: Omit<CommunityReport, 'id'>): CommunityReport[] {
  const next: CommunityReport = {
    ...report,
    id: `local_rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  };
  const list = [next, ...loadLocalReports()].slice(0, 60);
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}

export function deleteLocalReport(reportId: string): CommunityReport[] {
  const list = loadLocalReports().filter((r) => r.id !== reportId);
  try {
    localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}

// Offline Shelter Cache (preserves Android Room offline cache semantics in localStorage)
function formatEpoch(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function loadOfflineShelters(): {
  shelters: ShelterLocation[];
  status: ShelterCacheStatus;
} {
  try {
    const raw = localStorage.getItem(SHELTER_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { shelters?: ShelterLocation[]; cachedAtMs?: number };
      if (Array.isArray(parsed.shelters) && parsed.shelters.length > 0) {
        const ts = parsed.cachedAtMs ?? Date.now();
        return {
          shelters: parsed.shelters,
          status: {
            totalCachedCount: parsed.shelters.length,
            lastCachedAtText: formatEpoch(ts),
            isOfflineReady: true,
          },
        };
      }
    }
  } catch {
    // ignore
  }
  return refreshAndVerifyOfflineShelterCache();
}

export function refreshAndVerifyOfflineShelterCache(): {
  shelters: ShelterLocation[];
  status: ShelterCacheStatus;
} {
  const now = Date.now();
  const shelters = HK_SHELTERS.map((s) => ({ ...s, cachedAtEpochMs: now }));
  try {
    localStorage.setItem(SHELTER_CACHE_KEY, JSON.stringify({ shelters, cachedAtMs: now }));
  } catch {
    // ignore
  }
  return {
    shelters,
    status: {
      totalCachedCount: shelters.length,
      lastCachedAtText: formatEpoch(now),
      isOfflineReady: true,
    },
  };
}

// --- Firestore Operations (Strictly aligned with firebase-blueprint.json & firestore.rules) ---

function buildCloudPrefsCreatePayload(uid: string, prefs: UserPreferences): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    userId: uid,
    displayName: (prefs.displayName.trim() || 'Citizen').slice(0, 80),
    quietHoursEnabled: Boolean(prefs.quietHoursEnabled),
    quietStartHour: Math.min(23, Math.max(0, Math.trunc(prefs.quietStartHour))),
    quietStartMinute: Math.min(59, Math.max(0, Math.trunc(prefs.quietStartMinute))),
    quietEndHour: Math.min(23, Math.max(0, Math.trunc(prefs.quietEndHour))),
    quietEndMinute: Math.min(59, Math.max(0, Math.trunc(prefs.quietEndMinute))),
    tempAlertThreshold: Math.min(45, Math.max(-5, Number(prefs.tempAlertThreshold))),
    easAutoPlay: Boolean(prefs.easAutoPlay),
    easToneType: prefs.easToneType,
    autoPushEnabled: Boolean(prefs.autoPushEnabled),
    darkModePref: prefs.darkModePref,
    broadcastLang: prefs.broadcastLang,
    selectedDistrict: (prefs.selectedDistrict.trim() || '油尖旺區').slice(0, 60),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (prefs.emergencySmsNumber.trim()) {
    payload.emergencySmsNumber = prefs.emergencySmsNumber.trim().slice(0, 32);
  }
  return payload;
}

function buildCloudPrefsUpdatePayload(prefs: UserPreferences): Record<string, unknown> {
  return {
    displayName: (prefs.displayName.trim() || 'Citizen').slice(0, 80),
    quietHoursEnabled: Boolean(prefs.quietHoursEnabled),
    quietStartHour: Math.min(23, Math.max(0, Math.trunc(prefs.quietStartHour))),
    quietStartMinute: Math.min(59, Math.max(0, Math.trunc(prefs.quietStartMinute))),
    quietEndHour: Math.min(23, Math.max(0, Math.trunc(prefs.quietEndHour))),
    quietEndMinute: Math.min(59, Math.max(0, Math.trunc(prefs.quietEndMinute))),
    tempAlertThreshold: Math.min(45, Math.max(-5, Number(prefs.tempAlertThreshold))),
    easAutoPlay: Boolean(prefs.easAutoPlay),
    easToneType: prefs.easToneType,
    autoPushEnabled: Boolean(prefs.autoPushEnabled),
    darkModePref: prefs.darkModePref,
    broadcastLang: prefs.broadcastLang,
    selectedDistrict: (prefs.selectedDistrict.trim() || '油尖旺區').slice(0, 60),
    emergencySmsNumber: prefs.emergencySmsNumber.trim().slice(0, 32),
    updatedAt: serverTimestamp(),
  };
}

export async function backupPreferencesToCloud(uid: string, prefs: UserPreferences): Promise<void> {
  if (!isValidFirestoreId(uid)) throw new Error('Invalid user ID');
  const path = `users/${uid}`;
  const docRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      await setDoc(docRef, buildCloudPrefsUpdatePayload(prefs), { merge: true });
    } else {
      await setDoc(docRef, buildCloudPrefsCreatePayload(uid, prefs));
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function restorePreferencesFromCloud(
  uid: string,
  localFallback: UserPreferences
): Promise<UserPreferences | null> {
  if (!isValidFirestoreId(uid)) throw new Error('Invalid user ID');
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    const d = snap.data() as Partial<UserPreferences>;
    return {
      ...localFallback,
      userId: uid,
      displayName: d.displayName ?? localFallback.displayName,
      quietHoursEnabled: d.quietHoursEnabled ?? localFallback.quietHoursEnabled,
      quietStartHour: d.quietStartHour ?? localFallback.quietStartHour,
      quietStartMinute: d.quietStartMinute ?? localFallback.quietStartMinute,
      quietEndHour: d.quietEndHour ?? localFallback.quietEndHour,
      quietEndMinute: d.quietEndMinute ?? localFallback.quietEndMinute,
      tempAlertThreshold: d.tempAlertThreshold ?? localFallback.tempAlertThreshold,
      easAutoPlay: d.easAutoPlay ?? localFallback.easAutoPlay,
      easToneType: d.easToneType ?? localFallback.easToneType,
      autoPushEnabled: d.autoPushEnabled ?? localFallback.autoPushEnabled,
      darkModePref: d.darkModePref ?? localFallback.darkModePref,
      broadcastLang: d.broadcastLang ?? localFallback.broadcastLang,
      selectedDistrict: d.selectedDistrict ?? localFallback.selectedDistrict,
      emergencySmsNumber: d.emergencySmsNumber ?? localFallback.emergencySmsNumber,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function observeWeatherHistory(
  uid: string,
  onData: (records: WeatherHistoryRecord[]) => void
): Unsubscribe {
  const path = `users/${uid}/weather_history`;
  const q = query(collection(db, 'users', uid, 'weather_history'), orderBy('createdAt', 'desc'), limit(60));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: WeatherHistoryRecord[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          userId: String(d.userId ?? uid),
          stationName: String(d.stationName ?? ''),
          district: String(d.district ?? ''),
          recordDate: String(d.recordDate ?? ''),
          tempCelsius: Number(d.tempCelsius ?? 0),
          maxTempCelsius: Number(d.maxTempCelsius ?? 0),
          minTempCelsius: Number(d.minTempCelsius ?? 0),
          humidityPercent: Number(d.humidityPercent ?? 0),
          rainfallMm: Number(d.rainfallMm ?? 0),
          uvIndex: Number(d.uvIndex ?? 0),
          aqhiLevel: Number(d.aqhiLevel ?? 0),
          activeWarnings: String(d.activeWarnings ?? ''),
          summaryNote: d.summaryNote ? String(d.summaryNote) : undefined,
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveHistorySnapshotToCloud(
  uid: string,
  record: Omit<WeatherHistoryRecord, 'id'>
): Promise<void> {
  const path = `users/${uid}/weather_history`;
  const payload: Record<string, unknown> = {
    userId: uid,
    stationName: (record.stationName.trim() || 'Hong Kong Observatory').slice(0, 80),
    district: (record.district.trim() || '油尖旺區').slice(0, 80),
    recordDate: (record.recordDate.trim() || '2026-11-22').slice(0, 32),
    tempCelsius: Math.min(55, Math.max(-15, Number(record.tempCelsius))),
    maxTempCelsius: Math.min(55, Math.max(-15, Number(record.maxTempCelsius))),
    minTempCelsius: Math.min(55, Math.max(-15, Number(record.minTempCelsius))),
    humidityPercent: Math.min(100, Math.max(0, Math.trunc(record.humidityPercent))),
    rainfallMm: Math.min(2000, Math.max(0, Number(record.rainfallMm))),
    uvIndex: Math.min(25, Math.max(0, Number(record.uvIndex))),
    aqhiLevel: Math.min(11, Math.max(0, Math.trunc(record.aqhiLevel))),
    activeWarnings: record.activeWarnings.slice(0, 300),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (record.summaryNote && record.summaryNote.trim()) {
    payload.summaryNote = record.summaryNote.trim().slice(0, 400);
  }
  try {
    await addDoc(collection(db, 'users', uid, 'weather_history'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteHistorySnapshotFromCloud(uid: string, recordId: string): Promise<void> {
  if (!isValidFirestoreId(recordId)) throw new Error('Invalid record ID');
  const path = `users/${uid}/weather_history/${recordId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'weather_history', recordId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function observePublicCommunityReports(
  onData: (reports: CommunityReport[]) => void
): Unsubscribe {
  const path = 'community_reports';
  const q = query(
    collection(db, 'community_reports'),
    where('visibility', '==', 'PUBLIC'),
    orderBy('createdAt', 'desc'),
    limit(60)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items: CommunityReport[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          userId: String(d.userId ?? ''),
          authorAlias: String(d.authorAlias ?? 'Citizen'),
          district: String(d.district ?? ''),
          hazardType: (d.hazardType as HazardType) ?? 'FLOODING',
          severity: (d.severity as ReportSeverity) ?? 'MODERATE',
          waterDepthCm: Number(d.waterDepthCm ?? 0),
          description: String(d.description ?? ''),
          latitude: Number(d.latitude ?? 22.3019),
          longitude: Number(d.longitude ?? 114.1742),
          visibility: 'PUBLIC',
        };
      });
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function submitCommunityReportToCloud(
  uid: string,
  report: Omit<CommunityReport, 'id'>
): Promise<void> {
  const path = 'community_reports';
  const payload = {
    userId: uid,
    authorAlias: (report.authorAlias.trim() || 'Citizen').slice(0, 60),
    district: (report.district.trim() || '油尖旺區').slice(0, 60),
    hazardType: report.hazardType,
    severity: report.severity,
    waterDepthCm: Math.min(500, Math.max(0, Math.trunc(report.waterDepthCm))),
    description: (report.description.trim() || 'Weather hazard reported').slice(0, 400),
    latitude: Math.min(22.7, Math.max(22.0, Number(report.latitude))),
    longitude: Math.min(114.6, Math.max(113.7, Number(report.longitude))),
    visibility: 'PUBLIC',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  try {
    await addDoc(collection(db, 'community_reports'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteCommunityReportFromCloud(reportId: string): Promise<void> {
  if (!isValidFirestoreId(reportId)) throw new Error('Invalid report ID');
  const path = `community_reports/${reportId}`;
  try {
    await deleteDoc(doc(db, 'community_reports', reportId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
