import React, { useEffect, useRef, useState } from "react";

const CHECK_EVERY_MS = 30 * 60 * 1000; // while the app stays open
const MIN_GAP_MS = 60 * 1000;          // don't re-check more than once a minute

async function fetchLiveVersion() {
  const res = await fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.version || null;
}

export default function UpdateBanner() {
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastCheck = useRef(0);

  useEffect(() => {
    if (import.meta.env.DEV) return;

    const check = async () => {
      if (Date.now() - lastCheck.current < MIN_GAP_MS) return;
      lastCheck.current = Date.now();
      try {
        const live = await fetchLiveVersion();
        if (live && live !== __APP_VERSION__) {
          // Nudge the service worker to pick up the new sw.js too.
          const reg = await navigator.serviceWorker?.getRegistration();
          reg?.update();
          setReady(true);
          setDismissed(false);
        }
      } catch {
        // Offline or a bad response: try again next time.
      }
    };

    // Home-screen apps get suspended, not closed, so check whenever they come back.
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") check();
    }, CHECK_EVERY_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      clearInterval(timer);
    };
  }, []);

  if (!ready || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-0 right-0 top-0 z-[1000] flex justify-center px-3 pointer-events-none"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 10px)" }}
    >
      <style>{`
        @keyframes rbt-slip-in { from { transform: translateY(-120%) rotate(-1deg); } to { transform: translateY(0) rotate(-1deg); } }
        .rbt-update-slip { animation: rbt-slip-in 320ms ease-out both; }
        @media (prefers-reduced-motion: reduce) { .rbt-update-slip { animation: none; transform: rotate(-1deg); } }
        .rbt-update-slip button:focus-visible { outline: 2px solid #E9DCBE; outline-offset: 2px; }
      `}</style>
      <div
        className="rbt-update-slip pointer-events-auto flex items-center gap-3 w-full"
        style={{
          maxWidth: "360px",
          background: "#2B2A1F",
          color: "#E9DCBE",
          borderRadius: "4px 8px 6px 9px",
          padding: "10px 12px 10px 16px",
          boxShadow: "0 10px 24px -10px rgba(43,42,31,0.6)",
        }}
      >
        <p className="flex-1 text-[13px] leading-snug" style={{ margin: 0, fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
          A new version of the app is ready.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-[11px] tracking-wide px-2 py-2"
          style={{ background: "transparent", color: "rgba(233,220,190,0.6)", border: "none", fontFamily: "'Special Elite', monospace" }}
        >
          Later
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-[12px] tracking-wide px-3 py-2"
          style={{ background: "#E9DCBE", color: "#2B2A1F", border: "none", borderRadius: "3px 5px 4px 6px", fontFamily: "'Special Elite', monospace" }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
