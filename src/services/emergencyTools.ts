import {
  BROADCAST_LANG_META,
  HK_DISTRICTS,
  type BroadcastLang,
  type HkDistrictCoord,
  type UserPreferences,
  type WeatherSnapshot,
} from '../types/weather';
import { EasAudioEngine } from './easAudio';

export interface TranslatedBroadcast {
  headline: string;
  statusLine: string;
  actionGuidance: string;
  fullScript: string;
}

export function translateBroadcast(
  lang: BroadcastLang,
  snapshot: WeatherSnapshot
): TranslatedBroadcast {
  const tempStr = snapshot.currentTemp.toFixed(1);
  const hasWarnings = snapshot.activeWarnings.length > 0;
  const warnNames = snapshot.activeWarnings.map((w) => w.name).join(', ');
  const isCold =
    snapshot.currentTemp <= 15.0 || snapshot.activeWarnings.some((w) => w.code === 'WCOLD');
  const isRain = snapshot.activeWarnings.some((w) => w.code.startsWith('WRAIN'));
  const isTyphoon = snapshot.activeWarnings.some((w) => w.code.startsWith('TC'));

  switch (lang) {
    case 'TC': {
      const h = hasWarnings ? `【緊急天氣廣播】${warnNames}` : '【STCA 氣象廣播】天氣現況報告';
      const s = `現時${snapshot.selectedDistrict}氣溫 ${tempStr}°C，濕度 ${snapshot.humidityPercent}%。${
        snapshot.easTriggers.length
          ? `觸發條件：${snapshot.easTriggers.join('；')}`
          : '暫無緊急警報。'
      }`;
      const a = isTyphoon
        ? '請遠離岸邊及當風位置，鎖緊門窗並準備前往附近臨時庇護中心。'
        : isRain
        ? '請遠離斜坡及低窪水浸黑點，留意最新交通與停課安排。'
        : isCold
        ? '氣溫低於 15°C 或寒冷警告生效，請注意保暖並關顧獨居長者，必要時使用避寒中心。'
        : '請留意天文台最新消息，並確保手機電量充足。';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h}。${s} ${a}` };
    }
    case 'SC': {
      const h = hasWarnings ? `【紧急天气广播】${warnNames}` : '【STCA 气象广播】实时天气通报';
      const s = `当前${snapshot.selectedDistrict}气温 ${tempStr}°C，湿度 ${snapshot.humidityPercent}%。${
        snapshot.easTriggers.length
          ? `触发警报：${snapshot.easTriggers.join('；')}`
          : '暂无紧急警报。'
      }`;
      const a = isTyphoon
        ? '请远离海边及迎风位置，关紧门窗并查看附近临时庇护中心。'
        : isRain
        ? '请远离斜坡及低洼水浸黑点，留意最新交通消息。'
        : isCold
        ? '气温较低，请注意添衣保暖，需要时可使用政府避寒中心。'
        : '请继续关注香港天文台最新天气消息。';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h}。${s} ${a}` };
    }
    case 'EN': {
      const h = hasWarnings
        ? `[EMERGENCY WEATHER BROADCAST] ${warnNames}`
        : '[STCA WEATHER BROADCAST] Live Bulletin';
      const s = `Current temperature in ${snapshot.selectedDistrict} is ${tempStr}°C, humidity ${snapshot.humidityPercent}%. ${
        hasWarnings ? `Active warnings: ${warnNames}.` : 'No active severe warnings.'
      }`;
      const a = isTyphoon
        ? 'Stay indoors away from windows and shorelines. Locate your nearest temporary shelter on the offline map.'
        : isRain
        ? 'Avoid flooded roads, subways, and steep slopes. Monitor HKO updates closely.'
        : isCold
        ? 'Cold weather alert active. Wear warm layers and check on vulnerable neighbors. Cold shelters are open.'
        : 'Stay prepared and monitor STCA Weather for real-time updates.';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h}. ${s} ${a}` };
    }
    case 'ID': {
      const h = hasWarnings
        ? `[SIARAN DARURAT CUACA] ${warnNames}`
        : '[SIARAN CUACA STCA] Informasi Terkini';
      const s = `Suhu saat ini di ${snapshot.selectedDistrict} adalah ${tempStr}°C, kelembaban ${snapshot.humidityPercent}%.`;
      const a = isTyphoon
        ? 'Tetap di dalam ruangan, jauhi pantai dan jendela. Periksa lokasi tempat penampungan sementara terdekat.'
        : isRain
        ? 'Hindari jalan tergenang banjir dan lereng curam. Pantau pembaruan HKO.'
        : isCold
        ? 'Cuaca dingin ekstrem. Kenakan pakaian hangat dan gunakan pusat penampungan jika diperlukan.'
        : 'Tetap waspada dan pantau pembaruan cuaca secara berkala.';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h}. ${s} ${a}` };
    }
    case 'TL': {
      const h = hasWarnings
        ? `[BABALANG PANG-EMERHENSIYA] ${warnNames}`
        : '[STCA ULAT PANAHON] Kasalukuyang Kalagayan';
      const s = `Ang temperatura sa ${snapshot.selectedDistrict} ay ${tempStr}°C, halumigmig ${snapshot.humidityPercent}%.`;
      const a = isTyphoon
        ? 'Manatili sa loob ng bahay, lumayo sa bintana at dalampasigan. Tingnan ang pinakamalapit na evacuation shelter.'
        : isRain
        ? 'Iwasan ang mga binabahang kalsada at matarik na lugar. Subaybayan ang balita mula sa HKO.'
        : isCold
        ? 'Malamig ang panahon. Magsuot ng makapal na damit at gamitin ang cold shelter kung kinakailangan.'
        : 'Maging handa at patuloy na bantayan ang ulat ng panahon.';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h}. ${s} ${a}` };
    }
    case 'NE': {
      const h = hasWarnings
        ? `[आपतकालीन मौसम प्रसारण] ${warnNames}`
        : '[STCA मौसम सूचना] ताजा विवरण';
      const s = `${snapshot.selectedDistrict} मा हालको तापक्रम ${tempStr}°C र आर्द्रता ${snapshot.humidityPercent}% छ।`;
      const a = isTyphoon
        ? 'कृपया घरभित्र सुरक्षित रहनुहोस्, झ्याल र समुद्र किनारबाट टाढा रहनुहोस्। नजिकको आश्रय स्थल जाँच गर्नुहोस्।'
        : isRain
        ? 'डुबान हुने सडक र भिरालो जमिनबाट टाढा रहनुहोस्।'
        : isCold
        ? 'चिसो मौसमको चेतावनी छ। न्यानो लुगा लगाउनुहोस् र आवश्यक परे आश्रय केन्द्र जानुहोस्।'
        : 'मौसम सम्बन्धी ताजा जानकारीको लागि सतर्क रहनुहोस्।';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h} ${s} ${a}` };
    }
    case 'UR': {
      const h = hasWarnings
        ? `[ہنگامی موسمی نشریات] ${warnNames}`
        : '[STCA موسمی بلیٹن] تازہ صورتحال';
      const s = `${snapshot.selectedDistrict} میں موجودہ درجہ حرارت ${tempStr}°C اور نمی ${snapshot.humidityPercent}% ہے۔`;
      const a = isTyphoon
        ? 'گھر کے اندر محفوظ رہیں، کھڑکیوں اور ساحل سے دور رہیں۔ قریبی پناہ گاہ کا نقشہ دیکھیں۔'
        : isRain
        ? 'سیلابی سڑکوں اور ڈھلوانوں سے دور رہیں۔'
        : isCold
        ? 'سرد موسم کی وارننگ جاری ہے۔ گرم کپڑے پہنیں اور ضرورت پڑنے پر قریبی شیلٹر استعمال کریں۔'
        : 'موسمی اپ ڈیٹس پر نظر رکھیں اور محتاط رہیں۔';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h} ${s} ${a}` };
    }
    case 'HI': {
      const h = hasWarnings
        ? `[आपातकालीन मौसम प्रसारण] ${warnNames}`
        : '[STCA मौसम बुलेटिन] ताज़ा स्थिति';
      const s = `${snapshot.selectedDistrict} में वर्तमान तापमान ${tempStr}°C और आर्द्रता ${snapshot.humidityPercent}% है।`;
      const a = isTyphoon
        ? 'घर के अंदर सुरक्षित रहें, खिड़कियों और समुद्र तट से दूर रहें। नजदीकी आश्रय केंद्र देखें।'
        : isRain
        ? 'जलभराव वाली सड़कों और ढलानों से दूर रहें।'
        : isCold
        ? 'कड़ाके की ठंड की चेतावनी है। गर्म कपड़े पहनें और आवश्यकता होने पर शेल्टर केंद्र का उपयोग करें।'
        : 'ताज़ा मौसम अपडेट के लिए सतर्क रहें।';
      return { headline: h, statusLine: s, actionGuidance: a, fullScript: `${h} ${s} ${a}` };
    }
  }
}

export function speakBroadcast(text: string, lang: BroadcastLang): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = BROADCAST_LANG_META[lang].localeTag;
    window.speechSynthesis.speak(utter);
    return true;
  } catch {
    return false;
  }
}

export function stopBroadcastSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export const SmsEmergencyHelper = {
  buildRequestSmsBody(district: string): string {
    return `STCA WEATHER REQ | DIST:${district} | NEED:TEMP,WARN,RAIN`;
  },

  encodeSnapshotToSmsPacket(snapshot: WeatherSnapshot): string {
    const warns =
      snapshot.activeWarnings.length === 0
        ? 'NONE'
        : snapshot.activeWarnings.map((w) => w.code).join(',');
    const maxRain = snapshot.rainfallStations.length
      ? Math.max(...snapshot.rainfallStations.map((r) => r.max))
      : 0.0;
    const maxPart = snapshot.highestStation
      ? `|MAX:${snapshot.highestStation.value.toFixed(1)}@${snapshot.highestStation.place}`
      : '';
    const minPart = snapshot.lowestStation
      ? `|MIN:${snapshot.lowestStation.value.toFixed(1)}@${snapshot.lowestStation.place}`
      : '';
    return `STCA|HKO|DIST:${snapshot.selectedDistrict}|T:${snapshot.currentTemp.toFixed(1)}|RH:${snapshot.humidityPercent}|W:${warns}|RAIN:${maxRain.toFixed(1)}|UV:${snapshot.uvIndex.toFixed(1)}|AQHI:${snapshot.maxAqhi}${maxPart}${minPart}`;
  },

  buildSmsHref(phoneNumber: string, body: string): string {
    const cleanPhone = phoneNumber.trim();
    return `sms:${encodeURIComponent(cleanPhone)}?body=${encodeURIComponent(body)}`;
  },
};

export function buildWeatherReportTextSummary(snapshot: WeatherSnapshot): string {
  const warns =
    snapshot.activeWarnings.length === 0
      ? '現時無生效警告'
      : snapshot.activeWarnings.map((w) => w.name).join('、');
  const high = snapshot.highestStation
    ? `${snapshot.highestStation.place} ${snapshot.highestStation.value}°C`
    : '-';
  const low = snapshot.lowestStation
    ? `${snapshot.lowestStation.place} ${snapshot.lowestStation.value}°C`
    : '-';
  const maxRain = snapshot.rainfallStations.length
    ? Math.max(...snapshot.rainfallStations.map((r) => r.max))
    : 0.0;
  return [
    '【STCA Weather 香港即時氣象報告】',
    `更新時間：${snapshot.updatedAtText}`,
    `地區 / 站點：${snapshot.selectedDistrict} (${snapshot.nearestStationName})`,
    `現時氣溫：${snapshot.currentTemp.toFixed(1)}°C｜濕度：${snapshot.humidityPercent}%`,
    `全港最高：${high}｜全港最低：${low}`,
    `最高時雨量：${maxRain.toFixed(1)} mm｜UV：${snapshot.uvDesc}｜AQHI：${snapshot.maxAqhi}`,
    `天文台警告：${warns}`,
    ...(snapshot.generalSituation ? [`天氣概況：${snapshot.generalSituation}`] : []),
    '#STCAWeather #香港天氣 #HKO',
  ].join('\n');
}

function renderReportCardBlob(snapshot: WeatherSnapshot): Promise<Blob | null> {
  return new Promise((resolve) => {
    const w = 1080;
    const h = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(null);
      return;
    }

    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#061E38');
    grad.addColorStop(0.5, '#0F345C');
    grad.addColorStop(1, '#0A1A2E');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.beginPath();
    ctx.roundRect(60, 60, w - 120, h - 120, 40);
    ctx.fill();

    ctx.fillStyle = '#22D3EE';
    ctx.font = 'bold 44px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('STCA WEATHER · 香港氣象報告', 110, 150);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '30px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(
      `${snapshot.selectedDistrict} (${snapshot.nearestStationName}) · ${snapshot.updatedAtText}`,
      110,
      205
    );

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 156px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(`${snapshot.currentTemp.toFixed(1)}°C`, 110, 400);

    ctx.fillStyle = '#FBBF24';
    ctx.font = 'bold 38px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(snapshot.weatherScene.titleTc, 110, 470);

    const highStr = snapshot.highestStation
      ? `${snapshot.highestStation.place} (${snapshot.highestStation.value}°C)`
      : '-';
    const lowStr = snapshot.lowestStation
      ? `${snapshot.lowestStation.place} (${snapshot.lowestStation.value}°C)`
      : '-';
    const maxRain = snapshot.rainfallStations.length
      ? Math.max(...snapshot.rainfallStations.map((r) => r.max))
      : 0.0;
    const warns =
      snapshot.activeWarnings.length === 0
        ? '現時無警告'
        : snapshot.activeWarnings.map((item) => item.name).join('、');

    const lines = [
      `全港最高氣溫：${highStr}`,
      `全港最低氣溫：${lowStr}`,
      `相對濕度：${snapshot.humidityPercent}%   |   最高雨量：${maxRain.toFixed(1)} mm`,
      `紫外線 UV：${snapshot.uvDesc}   |   空氣品質 AQHI：${snapshot.maxAqhi}`,
      `生效警告：${warns}`,
    ];

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px "Plus Jakarta Sans", system-ui, sans-serif';
    let y = 580;
    for (const line of lines) {
      ctx.fillText(line.slice(0, 42), 110, y);
      y += 72;
    }

    ctx.fillStyle = '#94A3B8';
    ctx.font = '28px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('資料來源：香港天文台開放數據 (HKO) & 環境保護署', 110, h - 120);

    canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

export async function exportAndShareWeatherReport(snapshot: WeatherSnapshot): Promise<string> {
  const summaryText = buildWeatherReportTextSummary(snapshot);
  const blob = await renderReportCardBlob(snapshot);

  if (blob && typeof navigator !== 'undefined' && navigator.share) {
    const file = new File([blob], `stca_weather_report_${Date.now()}.png`, { type: 'image/png' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'STCA Weather 香港即時氣象報告',
          text: summaryText,
          files: [file],
        });
        return '已匯出並開啟分享 STCA 氣象報告圖卡';
      }
      await navigator.share({
        title: 'STCA Weather 香港即時氣象報告',
        text: summaryText,
      });
    } catch {
      // user cancelled or share unavailable; fallback to download + copy below
    }
  }

  if (blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stca_weather_report_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(summaryText);
    }
  } catch {
    // ignore clipboard permission errors
  }

  return '已下載 PNG 氣象報告圖卡並複製摘要文字';
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function detectNearestDistrict(): Promise<{
  nearestDistrict: HkDistrictCoord;
  latitude: number;
  longitude: number;
}> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('此瀏覽器不支援 GPS 定位功能'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let best = HK_DISTRICTS[4];
        let bestDist = Number.POSITIVE_INFINITY;
        for (const d of HK_DISTRICTS) {
          const dist = haversineKm(latitude, longitude, d.latitude, d.longitude);
          if (dist < bestDist) {
            bestDist = dist;
            best = d;
          }
        }
        resolve({ nearestDistrict: best, latitude, longitude });
      },
      (err) => {
        reject(new Error(err.message || '無法取得目前位置'));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function postWeatherAlertNotification(
  snapshot: WeatherSnapshot,
  prefs: UserPreferences
): void {
  if (!prefs.autoPushEnabled) return;
  if (snapshot.easTriggers.length === 0) return;
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const inQuiet = EasAudioEngine.isWithinQuietHours(prefs);
  const title = inQuiet
    ? `STCA 氣象靜音提示 (${snapshot.selectedDistrict})`
    : `STCA EAS 緊急天氣警報 (${snapshot.selectedDistrict})`;
  const body = `${snapshot.currentTemp.toFixed(1)}°C · ${snapshot.easTriggers.join(' · ')}`;

  try {
    new Notification(title, {
      body,
      icon: '/img_app_icon_foreground.jpg',
      silent: inQuiet,
      tag: 'stca-weather-eas',
    });
  } catch {
    // ignore browser notification errors
  }
}
