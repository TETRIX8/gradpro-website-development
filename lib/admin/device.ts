export function parseDevice(ua: string | null | undefined): string {
  if (!ua) return "Неизвестное устройство"
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Другая ОС"
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /YaBrowser/.test(ua)
        ? "Yandex"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : /Firefox\//.test(ua)
              ? "Firefox"
              : "Браузер"
  return `${browser} · ${os}`
}

export function deviceType(ua: string | null | undefined): "mobile" | "tablet" | "desktop" {
  if (!ua) return "desktop"
  if (/iPad|Tablet/.test(ua)) return "tablet"
  if (/Mobi|iPhone|Android/.test(ua)) return "mobile"
  return "desktop"
}
