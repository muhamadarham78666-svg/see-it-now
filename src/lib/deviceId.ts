/** Browser-side device signature used for the one-device login rule. */

function hash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = (h1 ^ c) * 0x01000193;
    h2 = (h2 + c * 31 + i) | 0;
  }
  return (Math.abs(h1) >>> 0).toString(16) + (Math.abs(h2) >>> 0).toString(16);
}

function browserName(ua: string): string {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\//i.test(ua)) return 'Opera';
  if (/chrome\//i.test(ua)) return 'Chrome';
  if (/safari\//i.test(ua)) return 'Safari';
  if (/firefox\//i.test(ua)) return 'Firefox';
  return 'Browser';
}

function osName(ua: string): string {
  if (/windows/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/mac os/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown OS';
}

export interface DeviceInfo {
  fingerprint: string;
  label: string;
  browser: string;
  os: string;
}

export function deviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { fingerprint: 'server', label: 'Server', browser: '', os: '' };
  }
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const parts = [
    ua,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    String(navigator.hardwareConcurrency ?? ''),
    String(nav.deviceMemory ?? ''),
    Intl.DateTimeFormat().resolvedOptions().timeZone ?? '',
    navigator.platform ?? '',
  ];
  const browser = browserName(ua);
  const os = osName(ua);
  return {
    fingerprint: hash(parts.join('|')),
    label: `${browser} on ${os}`,
    browser,
    os,
  };
}
