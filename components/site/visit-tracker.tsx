"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

function id(key: string, storage: Storage) {
  let v = storage.getItem(key)
  if (!v) {
    v = crypto.randomUUID().replace(/-/g, "")
    storage.setItem(key, v)
  }
  return v
}

export function VisitTracker() {
  const pathname = usePathname()
  const viewRef = useRef<{ id: number; startedAt: number } | null>(null)

  useEffect(() => {
    if (pathname.startsWith("/admin")) return
    const visitorId = id("gp_vid", localStorage)
    const sessionId = id("gp_sid", sessionStorage)
    const url = new URL(window.location.href)
    const startedAt = Date.now()
    let cancelled = false

    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        visitorId,
        sessionId,
        referrer: document.referrer || null,
        utmSource: url.searchParams.get("utm_source"),
      }),
      keepalive: true,
    })
      .then((r) => r.json())
      .then((d: { id?: number }) => {
        if (!cancelled && d.id) viewRef.current = { id: d.id, startedAt }
      })
      .catch(() => {})

    const flush = () => {
      const v = viewRef.current
      if (!v) return
      const duration = Math.round((Date.now() - v.startedAt) / 1000)
      if (duration < 2) return
      navigator.sendBeacon?.(
        "/api/track",
        new Blob([JSON.stringify({ path: pathname, visitorId, sessionId, viewId: v.id, duration })], {
          type: "application/json",
        }),
      )
    }
    const onHide = () => document.visibilityState === "hidden" && flush()
    document.addEventListener("visibilitychange", onHide)
    window.addEventListener("pagehide", flush)
    return () => {
      cancelled = true
      flush()
      viewRef.current = null
      document.removeEventListener("visibilitychange", onHide)
      window.removeEventListener("pagehide", flush)
    }
  }, [pathname])

  return null
}
