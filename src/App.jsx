import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Inbox, CheckCircle2, Home, Mail, LogOut, Trash2, User, Bell, Check, Users, Camera } from "lucide-react";
import { supabase, signInWithEmail, signInWithGoogle, signOut } from "./lib/supabase";
import { STAMP_IMG, WORD_IMG } from "./assets";

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const ENTRY_INK = "#3E4E5A";

function fadedRuledLines(spacing, color) {
  return `repeating-linear-gradient(to bottom, transparent 0, transparent ${spacing - 1}px, ${color} ${spacing - 1}px, ${color} ${spacing}px)`;
}

const NOISE_BG = "url(\"data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"
) + "\")";

const STAIN_SETS = [
  "radial-gradient(ellipse 190px 150px at 4% 8%, rgba(110,85,55,0.28), transparent 55%), radial-gradient(ellipse 90px 60px at 92% 10%, rgba(120,90,50,0.12), transparent 65%), radial-gradient(circle 50px at 55% 30%, rgba(120,90,50,0.08), transparent 70%)",
  "radial-gradient(ellipse 110px 130px at 95% 75%, rgba(120,90,50,0.15), transparent 60%), radial-gradient(circle 70px at 12% 20%, rgba(120,90,50,0.1), transparent 65%), radial-gradient(ellipse 80px 50px at 40% 90%, rgba(120,90,50,0.1), transparent 70%)",
  "radial-gradient(circle 90px at 15% 55%, rgba(120,90,50,0.14), transparent 62%), radial-gradient(ellipse 100px 70px at 85% 88%, rgba(120,90,50,0.12), transparent 65%), radial-gradient(circle 45px at 70% 15%, rgba(120,90,50,0.09), transparent 70%)",
];

const TODAY_STR = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();


function DatePostmark({ ink }) {
  const uid = ink.replace("#", "");
  const topId = `pmTop-${uid}`;
  const botId = `pmBot-${uid}`;
  return (
    <div className="absolute" style={{ left: "68%", top: "20%", width: "21%", aspectRatio: "1", opacity: 0.55, transform: "rotate(-8deg)" }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <defs>
          <path id={topId} d="M 18 50 A 30 30 0 0 1 82 50" fill="none" />
          <path id={botId} d="M 18 54 A 30 30 0 0 0 82 54" fill="none" />
        </defs>
        <circle cx="50" cy="50" r="30" fill="none" stroke={ink} strokeWidth="0.9" opacity="0.6" />
        <circle cx="50" cy="50" r="25" fill="none" stroke={ink} strokeWidth="0.5" strokeDasharray="1.5,1.5" opacity="0.4" />
        <text fontSize="11" fontWeight="bold" fill={ink} fontFamily="'Special Elite', monospace" letterSpacing="1">
          <textPath href={`#${topId}`} startOffset="50%" textAnchor="middle">POSTED</textPath>
        </text>
        <text fontSize="10" fill={ink} fontFamily="'Special Elite', monospace">
          <textPath href={`#${botId}`} startOffset="50%" textAnchor="middle">{TODAY_STR}</textPath>
        </text>
      </svg>
    </div>
  );
}

function BrandStamp({ ink }) {
  return (
    <div className="relative shrink-0" style={{ width: "100%", aspectRatio: "0.85", transform: "rotate(-4deg)" }}>
      <img src={STAMP_IMG} alt="Rose, Bud, Thorn stamp" className="w-full h-full object-contain" style={{ opacity: 0.75, filter: "sepia(0.35) saturate(0.7) contrast(0.9) brightness(1.04) drop-shadow(2px 4px 3px rgba(40,30,15,0.35))" }} />
    </div>
  );
}

const INTRO_SLIDES = [
  { key: "rose", word: "Rose", note: "something good, or a recent highlight.", ink: "#8C2F45" },
  { key: "bud", word: "Bud", note: "something growing, or hopeful about.", ink: "#4B5E33" },
  { key: "thorn", word: "Thorn", note: "something hard, or a recent struggle.", ink: "#7A4A28" },
];

function PostcardBack({ slide, index, value, onChange }) {
  const { word, note, ink } = slide;
  const leftLines = useMemo(() => fadedRuledLines(24, "rgba(80,62,38,0.14)"), []);
  const rightLines = useMemo(() => fadedRuledLines(19, "rgba(80,62,38,0.12)"), []);
  return (
    <div className="relative w-full h-full overflow-hidden flex flex-col" style={{
      background: "#E9DCBE",
      boxShadow: "inset 0 0 50px rgba(90,65,35,0.22), inset 0 0 10px rgba(60,42,20,0.2), 0 1px 0 rgba(0,0,0,0.05), 0 16px 34px -14px rgba(43,42,31,0.45)",
      border: "1px solid rgba(100,80,50,0.35)",
      borderRadius: "6px 10px 8px 12px",
    }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: STAIN_SETS[index % STAIN_SETS.length] }} />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 4px rgba(70,50,25,0.35)" }} />

      <img src={WORD_IMG[slide.key]} alt={word} className="absolute object-contain object-left" style={{ left: "54%", top: "5%", width: "24%", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.1))" }} />

      <div className="absolute" style={{ top: "4%", right: "4%", width: "19%" }}>
        <BrandStamp ink={ink} />
      </div>

      <DatePostmark ink={ink} />

      <div className="absolute pointer-events-none" style={{ left: "50%", top: "7%", bottom: "10%", width: "1px", background: "rgba(100,75,45,0.4)" }} />

      <div className="absolute overflow-hidden" style={{ left: "5%", top: "9%", width: "39%", bottom: "8%", backgroundImage: leftLines, backgroundPosition: "0 3px" }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onDragStart={(e) => e.preventDefault()}
          placeholder={`Type your ${word.toLowerCase()} here…`}
          className="rbt-entry w-full h-full resize-none bg-transparent outline-none border-none"
          style={{
            "--ph-color": ENTRY_INK,
            color: hexToRgba(ENTRY_INK, 0.7),
            fontFamily: "'Permanent Marker', cursive",
            fontSize: "14px",
            lineHeight: "24px",
            boxSizing: "border-box",
            padding: "0",
            wordBreak: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            textShadow: "0.4px 0.4px 0 rgba(60,42,20,0.12)",
          }}
          maxLength={220}
        />
      </div>

      <div className="absolute overflow-hidden" style={{ left: "58%", top: "62%", width: "33%", height: "57px", backgroundImage: rightLines, backgroundPosition: "0 3px" }}>
        <p className="text-left" style={{ margin: 0, lineHeight: "19px", color: hexToRgba(ENTRY_INK, 0.7), fontFamily: "'Permanent Marker', cursive", fontSize: "10.5px", textShadow: "0.4px 0.4px 0 rgba(60,42,20,0.12)" }}>
          {word.toUpperCase()}: {note}
        </p>
      </div>
    </div>
  );
}

function IntroCarousel({ onBegin, onGoHome, entries, setEntries, saving, saveError, joinedExisting }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const start = useRef(null);
  const axis = useRef(null);
  const dragging = useRef(false);
  const go = (i) => setIndex(Math.max(0, Math.min(INTRO_SLIDES.length - 1, i)));

  const point = (e) => (e.touches && e.touches[0] ? e.touches[0] : e);

  const onDown = (e) => {
    const p = point(e);
    start.current = { x: p.clientX, y: p.clientY };
    axis.current = null;
    dragging.current = true;
  };

  const onMove = (e) => {
    if (!dragging.current || !start.current) return;
    const p = point(e);
    const dx = p.clientX - start.current.x;
    const dy = p.clientY - start.current.y;

    // Wait until the gesture is clearly horizontal or vertical before
    // committing. A tap (tiny movement) never commits, so tapping the
    // writing area still focuses it and opens the keyboard.
    if (axis.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis.current === "x" && document.activeElement && document.activeElement.blur) {
        document.activeElement.blur();
      }
    }

    if (axis.current !== "x") return;
    setDragX(dx);
  };

  const onUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (axis.current === "x") {
      if (dragX < -60) go(index + 1);
      else if (dragX > 60) go(index - 1);
    }
    axis.current = null;
    start.current = null;
    setDragX(0);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4" style={{ background: "#E8DFCB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Permanent+Marker&display=swap');
        .rbt-entry::placeholder { color: var(--ph-color); opacity: 0.45; font-family: 'Permanent Marker', cursive; }
      `}</style>

      <span className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: "rgba(60,48,35,0.55)", fontFamily: "'Special Elite', monospace" }}>
        {index === 0 ? "Swipe to begin" : `Card ${index + 1} of ${INTRO_SLIDES.length}`}
      </span>

      {joinedExisting && (
        <p className="text-[12px] text-center leading-relaxed mb-4 px-4" style={{ color: "rgba(60,48,35,0.7)", fontFamily: "'Fraunces', serif", fontStyle: "italic", maxWidth: "340px" }}>
          Fill out your rose, bud & thorn to see what they shared.
        </p>
      )}

      <div className="w-full max-w-md md:max-w-3xl flex items-center gap-4">
        <button onClick={() => go(index - 1)} disabled={index === 0} className="hidden md:flex shrink-0 items-center justify-center w-10 h-10 rounded-full disabled:opacity-20" style={{ background: "rgba(60,48,35,0.08)" }}>
          <ChevronLeft size={18} color="rgba(60,48,35,0.7)" />
        </button>

        <div className="w-full max-w-md md:max-w-xl mx-auto relative overflow-hidden rounded-[3px] touch-pan-y" style={{ aspectRatio: "3 / 2" }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
          <div className="flex h-full" style={{ width: `${INTRO_SLIDES.length * 100}%`, transform: `translateX(calc(${-index * (100 / INTRO_SLIDES.length)}% + ${dragX}px))`, transition: axis.current === "x" ? "none" : "transform 320ms cubic-bezier(.2,.8,.2,1)" }}>
            {INTRO_SLIDES.map((slide, i) => (
              <div key={slide.key} className="h-full px-1" style={{ width: `${100 / INTRO_SLIDES.length}%` }}>
                <PostcardBack slide={slide} index={i} value={entries[slide.key]} onChange={(v) => setEntries((s) => ({ ...s, [slide.key]: v }))} />
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => go(index + 1)} disabled={index === INTRO_SLIDES.length - 1} className="hidden md:flex shrink-0 items-center justify-center w-10 h-10 rounded-full disabled:opacity-20" style={{ background: "rgba(60,48,35,0.08)" }}>
          <ChevronRight size={18} color="rgba(60,48,35,0.7)" />
        </button>
      </div>

      <div className="flex items-center gap-3 mt-6">
        {INTRO_SLIDES.map((s, i) => (
          <button key={s.key} onClick={() => go(i)} className="w-2 h-2 rounded-full transition-all" style={{ background: i === index ? s.ink : "rgba(60,48,35,0.25)", transform: i === index ? "scale(1.3)" : "scale(1)" }} />
        ))}
      </div>

      {index === INTRO_SLIDES.length - 1 && (
        <div className="flex flex-col items-center">
          <button onClick={onBegin} disabled={saving} className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-wide disabled:opacity-60"
            style={{ background: "#2B2A1F", color: "#E9DCBE", fontFamily: "'Special Elite', monospace" }}>
            {saving ? "SAVING…" : (<>BEGIN TODAY'S CHECK-IN <ArrowRight size={13} /></>)}
          </button>
          {saveError && (
            <p className="text-[11px] mt-2" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{saveError}</p>
          )}
        </div>
      )}

      <div className="w-full flex items-center justify-center gap-3 mt-6 mb-6" style={{ maxWidth: "640px" }}>
        <button onClick={onGoHome} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(60,48,35,0.08)" }}>
          <Home size={13} color="rgba(60,48,35,0.6)" />
          <span className="text-[10px] tracking-wide" style={{ color: "rgba(60,48,35,0.6)", fontFamily: "'Special Elite', monospace" }}>HOME</span>
        </button>
        {index !== INTRO_SLIDES.length - 1 && (
          <button onClick={onGoHome} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(60,48,35,0.08)" }}>
            <span className="text-[10px] tracking-wide" style={{ color: "rgba(60,48,35,0.6)", fontFamily: "'Special Elite', monospace" }}>SKIP</span>
          </button>
        )}
      </div>
    </div>
  );
}

const VAPID_PUBLIC_KEY = "BHI7wXECF3F0U9KYT4BIDo3OT4n5DTgvEV0YNVPwqBCRsWUPxu8PrKoKFu2MnmBXVStPEvA7ssOZl8BGEE5FYGA";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function enablePushNotifications(userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return { error: "Push notifications aren't supported on this browser." };
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { error: "Notifications permission was not granted." };
  }
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  const json = subscription.toJSON();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  return { error };
}

function DeskHome({ filledCount, waitingCount, readCount, onOpenCards, onOpenInbox, onOpenProfile, saveError }) {
  const cardsDone = filledCount >= 3;
  const inboxDone = waitingCount === 0 && readCount > 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>

      <div className="w-full flex flex-col items-center px-6" style={{ maxWidth: "480px" }}>
        <div className="w-full flex items-center justify-between mt-6">
          <button onClick={onOpenProfile} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(43,42,31,0.06)" }}>
            <User size={14} color="rgba(43,42,31,0.55)" />
            <span className="text-[11px] tracking-wide" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
              PROFILE
            </span>
          </button>
          <button onClick={onOpenInbox} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(43,42,31,0.06)" }}>
            {inboxDone && <CheckCircle2 size={13} color="#4B5E33" />}
            <Inbox size={14} color="rgba(43,42,31,0.55)" />
            <span className="text-[11px] tracking-wide" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
              {readCount}/{readCount + waitingCount}
            </span>
          </button>
        </div>

        <div className="flex-1 w-full flex flex-col items-center pt-4">
        <div className="flex items-end justify-center gap-1 mb-4 w-full mx-auto" style={{ maxWidth: "360px" }}>
          <img src={WORD_IMG.rose} alt="Rose" style={{ width: "30%", height: "auto", transform: "rotate(-6deg)" }} />
          <img src={WORD_IMG.bud} alt="Bud" style={{ width: "30%", height: "auto", transform: "translateY(20px) rotate(3deg)" }} />
          <img src={WORD_IMG.thorn} alt="Thorn" style={{ width: "30%", height: "auto", transform: "rotate(7deg)" }} />
        </div>

        <p className="text-[22px] mb-10" style={{ color: hexToRgba(ENTRY_INK, 0.75), fontFamily: "'Permanent Marker', cursive" }}>
          Connect with a friend today
        </p>

        <div className="mb-4 flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(43,42,31,0.08)" }}>
          {cardsDone && <CheckCircle2 size={13} color="#4B5E33" />}
          <span className="text-[12px] tracking-wide" style={{ color: cardsDone ? "#4B5E33" : "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
            {filledCount}/3
          </span>
        </div>

        <button onClick={onOpenCards} className="relative block mx-auto" style={{ width: "70vw", maxWidth: "260px", aspectRatio: "3 / 2" }}>
          <div className="absolute inset-0" style={{
            background: "#E4D6B0",
            border: "1px solid rgba(100,80,50,0.35)",
            borderRadius: "5px 8px 6px 9px",
            boxShadow: "0 8px 16px -6px rgba(43,42,31,0.3)",
            transform: "rotate(-3deg) translate(10px, 10px)",
          }} />
          <div className="absolute inset-0" style={{
            background: "#E9DCBE",
            border: "1px solid rgba(100,80,50,0.4)",
            borderRadius: "5px 8px 6px 9px",
            boxShadow: "0 10px 20px -6px rgba(43,42,31,0.32)",
            transform: "rotate(-3deg) translate(5px, 5px)",
          }} />
          <div className="absolute inset-0" style={{
            background: "#E9DCBE",
            boxShadow: "0 16px 28px -8px rgba(43,42,31,0.35), 0 1px 0 rgba(255,255,255,0.4)",
            border: "1px solid rgba(100,80,50,0.4)",
            borderRadius: "5px 8px 6px 9px",
            overflow: "hidden",
            transform: "rotate(-3deg)",
          }}>
            <img src={STAMP_IMG} alt="Rose, Bud, Thorn stamp" style={{ position: "absolute", top: "6%", right: "6%", width: "18%", opacity: 0.85, transform: "rotate(-4deg)" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <img src={WORD_IMG.rose} alt="Rose" style={{ height: "26%", opacity: 0.9 }} />
              <span className="text-[9px] tracking-[0.15em] font-bold" style={{ color: "rgba(60,44,20,0.85)", fontFamily: "'Special Elite', monospace" }}>TAP TO BEGIN</span>
            </div>
          </div>
        </button>

        {saveError && (
          <p className="text-center mt-3 text-[11px]" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>
            {saveError}
          </p>
        )}

        <p className="text-center mt-8 mx-auto text-[13px] leading-relaxed" style={{ maxWidth: "280px", color: hexToRgba(ENTRY_INK, 0.75), fontFamily: "'Permanent Marker', cursive" }}>
          Rose, Bud, Thorn is a simple way to stay part of your friends' everyday lives. Share something good, something you're looking forward to, and something that's been a little rough. It's part game, part check-in, and an easy way to feel closer even when life gets busy.
        </p>

        </div>
      </div>
    </div>
  );
}

const NOTIF_ASKED_KEY = "rbt_notif_asked_v1";

function NotificationPrimer({ onEnable, onSkip, status }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>

      <div className="flex items-center justify-center gap-1 mb-6 w-full mx-auto" style={{ maxWidth: "280px" }}>
        <img src={WORD_IMG.rose} alt="Rose" style={{ width: "30%", height: "auto", transform: "rotate(-6deg)" }} />
        <img src={WORD_IMG.bud} alt="Bud" style={{ width: "30%", height: "auto", transform: "translateY(14px) rotate(3deg)" }} />
        <img src={WORD_IMG.thorn} alt="Thorn" style={{ width: "30%", height: "auto", transform: "rotate(7deg)" }} />
      </div>

      <Bell size={22} color={ENTRY_INK} style={{ marginBottom: "14px", opacity: 0.8 }} />

      <p className="text-[18px] mb-3" style={{ color: hexToRgba(ENTRY_INK, 0.8), fontFamily: "'Permanent Marker', cursive" }}>
        Know when a friend checks in
      </p>

      <p className="text-[13px] leading-relaxed mb-8" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif", maxWidth: "290px" }}>
        We'll nudge you when someone shares their rose, bud &amp; thorn with you — and give you a gentle reminder if it's been a while. Nothing else.
      </p>

      <div className="w-full" style={{ maxWidth: "300px" }}>
        <button onClick={onEnable} className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide"
          style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
          TURN ON NOTIFICATIONS
        </button>
        <button onClick={onSkip} className="w-full mt-4 text-[11px] underline"
          style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
          not now
        </button>
      </div>

      {status === "error" && (
        <p className="text-[12px] mt-5" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif", maxWidth: "290px" }}>
          Couldn't turn them on here. On iPhone, add Rose, Bud, Thorn to your home screen first — Safari only allows notifications for installed apps.
        </p>
      )}
    </div>
  );
}

function Avatar({ url, name, size = 34 }) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (url) {
    return (
      <img src={url} alt={name || "Profile"} style={{
        width: size, height: size, borderRadius: "50%", objectFit: "cover",
        border: "1px solid rgba(43,42,31,0.2)", flexShrink: 0,
      }} />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "rgba(43,42,31,0.1)", border: "1px solid rgba(43,42,31,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "rgba(43,42,31,0.55)", fontFamily: "'Special Elite', monospace",
      fontSize: Math.round(size * 0.42),
    }}>{initial}</div>
  );
}

// Squares off and shrinks the picked image before upload. Phone cameras
// produce multi-megabyte files and this only ever renders at 40px.
async function shrinkImage(file, size = 256) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - side) / 2;
  const sy = (bitmap.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d").drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't process that image."))),
      "image/jpeg",
      0.85
    );
  });
}

async function uploadAvatar(userId, file) {
  const blob = await shrinkImage(file);
  const path = `${userId}/avatar-${Date.now()}.jpg`;

  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { contentType: "image/jpeg", upsert: true });
  if (upErr) throw new Error(upErr.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = data.publicUrl;

  const { error: dbErr } = await supabase.from("users").update({ avatar_url: url }).eq("id", userId);
  if (dbErr) throw new Error(dbErr.message);

  return url;
}

function NameStep({ initialName, onSave, saving, error }) {
  const [name, setName] = useState(initialName || "");

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>

      <div className="flex items-center justify-center gap-1 mb-8 w-full mx-auto" style={{ maxWidth: "280px" }}>
        <img src={WORD_IMG.rose} alt="Rose" style={{ width: "30%", height: "auto", transform: "rotate(-6deg)" }} />
        <img src={WORD_IMG.bud} alt="Bud" style={{ width: "30%", height: "auto", transform: "translateY(14px) rotate(3deg)" }} />
        <img src={WORD_IMG.thorn} alt="Thorn" style={{ width: "30%", height: "auto", transform: "rotate(7deg)" }} />
      </div>

      <p className="text-[18px] mb-3" style={{ color: hexToRgba(ENTRY_INK, 0.8), fontFamily: "'Permanent Marker', cursive" }}>
        What should people call you?
      </p>
      <p className="text-[13px] leading-relaxed mb-7" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif", maxWidth: "290px" }}>
        This is the name your friends see on every card you send.
      </p>

      <div className="w-full" style={{ maxWidth: "300px" }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          className="w-full px-4 py-3 rounded-full text-[14px] text-center outline-none mb-3"
          style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
        />
        <button onClick={() => onSave(name.trim())} disabled={!name.trim() || saving}
          className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-40"
          style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
          {saving ? "SAVING…" : "CONTINUE"}
        </button>
      </div>

      {error && <p className="text-[12px] mt-4" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{error}</p>}
    </div>
  );
}

function ProfileScreen({ userId, email, profile, onProfileChange, onBack, notifStatus, onEnableNotifications }) {
  const [name, setName] = useState(profile?.display_name || "");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);

  const dirty = name.trim() !== (profile?.display_name || "") && name.trim().length > 0;

  const saveName = async () => {
    setSavingName(true);
    setError(null);
    const { error: err } = await supabase.from("users").update({ display_name: name.trim() }).eq("id", userId);
    setSavingName(false);
    if (err) { setError(err.message); return; }
    onProfileChange({ ...profile, display_name: name.trim() });
    setNotice("Name updated.");
  };

  const pickImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    setNotice(null);
    try {
      const url = await uploadAvatar(userId, file);
      onProfileChange({ ...profile, avatar_url: url });
      setNotice("Photo updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const pill = { background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" };
  const heading = { color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-5 pt-8 pb-12" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] mb-8" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
          <ChevronLeft size={14} /> BACK TO HOME
        </button>

        {/* ---------- photo + name ---------- */}
        <div className="w-full flex flex-col items-center mb-8">
          <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="relative mb-3">
            <Avatar url={profile?.avatar_url} name={profile?.display_name || email} size={84} />
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: "#2B2A1F", border: "2px solid #EFE9DA" }}>
              <Camera size={13} color="#EFE9DA" />
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display: "none" }} />
          <p className="text-[11px]" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
            {uploading ? "UPLOADING…" : "TAP TO CHANGE PHOTO"}
          </p>
        </div>

        <p className="text-[10px] tracking-[0.2em] mb-3" style={heading}>YOUR NAME</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          className="w-full px-4 py-3 rounded-full text-[13px] outline-none mb-2"
          style={pill}
        />
        {dirty && (
          <button onClick={saveName} disabled={savingName}
            className="w-full px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide mb-2 disabled:opacity-50"
            style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
            {savingName ? "SAVING…" : "SAVE NAME"}
          </button>
        )}
        <p className="text-[11px] leading-relaxed mb-8" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Fraunces', serif" }}>
          Your friends see this name and photo on every card you send.
        </p>

        {/* ---------- notifications ---------- */}
        <p className="text-[10px] tracking-[0.2em] mb-3" style={heading}>NOTIFICATIONS</p>
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2" style={pill}>
          <div className="flex items-center gap-2">
            <Bell size={14} color="rgba(43,42,31,0.55)" />
            <span className="text-[13px]">Check-in alerts</span>
          </div>
          {notifStatus === "enabled" ? (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: "#4B5E33" }}>
              <CheckCircle2 size={13} /> ON
            </span>
          ) : (
            <button onClick={onEnableNotifications} className="text-[11px] px-3 py-1 rounded-full"
              style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
              TURN ON
            </button>
          )}
        </div>
        {notifStatus === "error" && (
          <p className="text-[11px] leading-relaxed" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>
            Couldn't turn them on here. On iPhone, add the app to your home screen first, then try again.
          </p>
        )}

        {notice && <p className="text-[11px] mt-6" style={{ color: "#4B5E33", fontFamily: "'Fraunces', serif" }}>{notice}</p>}
        {error && <p className="text-[12px] mt-6" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{error}</p>}

        <button onClick={() => signOut()} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full text-[12px] mt-10"
          style={{ background: "rgba(43,42,31,0.06)", color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
          <LogOut size={13} /> SIGN OUT
        </button>

        <p className="text-center text-[10px] mt-4" style={{ color: "rgba(43,42,31,0.3)", fontFamily: "'Special Elite', monospace" }}>
          {email}
        </p>
      </div>
    </div>
  );
}

// Builds a single SMS deep link addressed to everyone who isn't on the app yet.
// iOS and Android disagree on the separator before `body`, hence the sniff.
function buildSmsHref(numbers, body) {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const list = numbers.map((n) => n.replace(/[^\d+]/g, "")).join(",");
  const sep = isIOS ? "&" : "?";
  return `sms:${list}${sep}body=${encodeURIComponent(body)}`;
}

function SendScreen({ userId, groupId, onDone }) {
  const [contacts, setContacts] = useState(null);
  const [groups, setGroups] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [picked, setPicked] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [savedGroup, setSavedGroup] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: gs }, { data: people }] = await Promise.all([
        supabase.from("contacts").select("id, name, phone, linked_user_id").eq("owner_id", userId).order("name"),
        supabase.from("contact_groups").select("id, name, contact_group_members(contact_id)").eq("owner_id", userId).order("name"),
        supabase.rpc("profiles_for_my_checkins"),
      ]);
      const byId = {};
      (people || []).forEach((p) => { byId[p.id] = p; });
      setProfiles(byId);
      setContacts(cs || []);
      setGroups(gs || []);
    })();
  }, [userId]);

  const toggleContact = (id) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleGroup = (g) => {
    const ids = (g.contact_group_members || []).map((m) => m.contact_id);
    const allOn = ids.length > 0 && ids.every((id) => picked.includes(id));
    setPicked((prev) => (allOn ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };

  const groupIsOn = (g) => {
    const ids = (g.contact_group_members || []).map((m) => m.contact_id);
    return ids.length > 0 && ids.every((id) => picked.includes(id));
  };

  // One circle per send. Tagging it with contact_id (when it is a
  // one-to-one send) is what lets us auto-link that contact to their
  // account the moment they accept, so next time they get push instead.
  const makeCircle = async (name, contactId) => {
    const { data, error: err } = await supabase
      .from("circles")
      .insert({ owner_id: userId, name, contact_id: contactId || null })
      .select()
      .single();
    if (err) throw new Error(err.message);
    return data;
  };

  const send = async () => {
    setSending(true);
    setError(null);

    try {
      const chosen = (contacts || []).filter((c) => picked.includes(c.id));
      const linked = chosen.filter((c) => c.linked_user_id);
      const unlinked = chosen.filter((c) => !c.linked_user_id);

      // 1. People already on the app: drop them straight into this
      //    check-in and push them. No text, no tapping.
      if (linked.length > 0) {
        const { error: memberErr } = await supabase.from("group_members").insert(
          linked.map((c) => ({
            group_id: groupId,
            user_id: c.linked_user_id,
            invite_token: crypto.randomUUID(),
            joined_at: null,
          }))
        );
        if (memberErr) throw new Error(memberErr.message);

        await supabase.functions
          .invoke("send-push", { body: { group_id: groupId, sender_id: userId } })
          .catch(() => {});
      }

      // 2. Everyone else: one pre-filled text with the invite link.
      let smsOpened = false;
      const withPhones = unlinked.filter((c) => c.phone);

      if (withPhones.length > 0) {
        const circle = await makeCircle(
          withPhones.length === 1 ? withPhones[0].name : "Check-in",
          withPhones.length === 1 ? withPhones[0].id : null
        );
        const url = `${window.location.origin}/invite/${circle.invite_token}?checkin=${groupId}`;
        const body = `How was your day? I want to hear about it — join me on Rose, Bud, Thorn: ${url}`;
        window.location.href = buildSmsHref(withPhones.map((c) => c.phone), body);
        smsOpened = true;
      }

      setResult({
        pushed: linked.length,
        texted: withPhones.length,
        skipped: unlinked.length - withPhones.length,
        smsOpened,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const saveAsGroup = async () => {
    setError(null);
    const { data: g, error: gErr } = await supabase
      .from("contact_groups")
      .insert({ owner_id: userId, name: groupName.trim() })
      .select()
      .single();
    if (gErr) { setError(gErr.message); return; }

    const { error: mErr } = await supabase.from("contact_group_members").insert(
      picked.map((contactId) => ({ contact_group_id: g.id, contact_id: contactId }))
    );
    if (mErr) { setError(mErr.message); return; }

    setSavedGroup(true);
  };

  // Fallback for anyone not saved as a contact yet.
  const shareGenericLink = async () => {
    setError(null);
    try {
      const circle = await makeCircle("Check-in", null);
      const url = `${window.location.origin}/invite/${circle.invite_token}?checkin=${groupId}`;
      const msg = `How was your day? I want to hear about it — join me on Rose, Bud, Thorn: ${url}`;
      if (navigator.share) {
        try { await navigator.share({ text: msg }); } catch {}
      } else {
        await navigator.clipboard.writeText(msg);
        alert("Link copied — paste it anywhere to send.");
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const pill = { background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" };

  if (result) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center" style={{ background: "#EFE9DA" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
        <CheckCircle2 size={26} color="#4B5E33" style={{ marginBottom: "14px" }} />
        <h1 className="text-[20px] mb-3" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Sent</h1>
        <div className="text-[13px] leading-relaxed" style={{ color: "rgba(43,42,31,0.7)", fontFamily: "'Fraunces', serif", maxWidth: "300px" }}>
          {result.pushed > 0 && (
            <p className="mb-2">
              {result.pushed} {result.pushed === 1 ? "person" : "people"} got a notification straight away.
            </p>
          )}
          {result.texted > 0 && (
            <p className="mb-2">
              {result.texted} {result.texted === 1 ? "invite is" : "invites are"} waiting in your Messages app — hit send there to finish.
            </p>
          )}
          {result.skipped > 0 && (
            <p className="mb-2" style={{ color: "#8C2F45" }}>
              {result.skipped} {result.skipped === 1 ? "contact has" : "contacts have"} no phone number saved, so we couldn't reach them.
            </p>
          )}
        </div>

        {picked.length > 1 && !savedGroup && (
          <div className="w-full mt-8 pt-6" style={{ maxWidth: "300px", borderTop: "1px solid rgba(43,42,31,0.12)" }}>
            <p className="text-[12px] leading-relaxed mb-3" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>
              Send to these {picked.length} often? Save them as a group.
            </p>
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder='Name it — e.g. "College Friends"'
              maxLength={40}
              className="w-full px-4 py-2.5 rounded-full text-[13px] outline-none mb-2"
              style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
            />
            <button onClick={saveAsGroup} disabled={!groupName.trim()}
              className="w-full px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-40"
              style={{ background: "rgba(43,42,31,0.08)", color: "rgba(43,42,31,0.7)", fontFamily: "'Special Elite', monospace" }}>
              SAVE AS GROUP
            </button>
          </div>
        )}

        {savedGroup && (
          <p className="text-[12px] mt-6" style={{ color: "#4B5E33", fontFamily: "'Fraunces', serif" }}>
            Saved. They'll be one tap next time.
          </p>
        )}

        {error && <p className="text-[12px] mt-4" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{error}</p>}

        <button onClick={onDone} className="mt-8 px-6 py-3 rounded-full text-[12px] font-bold tracking-wide"
          style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
          DONE
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 pt-10 pb-12" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full" style={{ maxWidth: "380px" }}>
        <h1 className="text-[20px] mb-1" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Send this check-in</h1>
        <p className="text-[12px] mb-6" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>
          Pick a group or a few people. Anyone already on the app gets a notification right away.
        </p>

        {groups.length > 0 && (
          <>
            <p className="text-[10px] tracking-[0.2em] mb-3" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>GROUPS</p>
            {groups.map((g) => {
              const on = groupIsOn(g);
              return (
                <button key={g.id} onClick={() => toggleGroup(g)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2"
                  style={{ ...pill, background: on ? "#2B2A1F" : "#fff", color: on ? "#EFE9DA" : "#2B2A1F" }}>
                  <span className="flex items-center gap-2 text-[13px]"><Users size={14} /> {g.name}</span>
                  {on ? <Check size={14} /> : (
                    <span className="text-[10px]" style={{ color: "rgba(43,42,31,0.4)" }}>{g.contact_group_members?.length || 0}</span>
                  )}
                </button>
              );
            })}
            <div className="mb-6" />
          </>
        )}

        <p className="text-[10px] tracking-[0.2em] mb-3" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>PEOPLE</p>

        {contacts === null ? (
          <p className="text-[12px]" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="text-[12px] leading-relaxed mb-4" style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Fraunces', serif" }}>
            No saved contacts yet. Add some on your profile, or share a one-off link below.
          </p>
        ) : (
          contacts.map((c) => {
            const on = picked.includes(c.id);
            return (
              <button key={c.id} onClick={() => toggleContact(c.id)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2"
                style={{ ...pill, background: on ? "#2B2A1F" : "#fff", color: on ? "#EFE9DA" : "#2B2A1F" }}>
                <span className="flex items-center gap-2.5 text-[13px]">
                  <Avatar url={profiles[c.linked_user_id] && profiles[c.linked_user_id].avatar_url} name={c.name} size={28} />
                  {c.name}
                </span>
                {on ? <Check size={14} /> : (
                  <span className="text-[10px]" style={{ color: c.linked_user_id ? "#4B5E33" : "rgba(43,42,31,0.35)" }}>
                    {c.linked_user_id ? "notify" : "text"}
                  </span>
                )}
              </button>
            );
          })
        )}

        <button onClick={send} disabled={picked.length === 0 || sending}
          className="w-full mt-5 px-4 py-3 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-40"
          style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
          {sending ? "SENDING…" : picked.length === 0 ? "SEND" : `SEND TO ${picked.length}`}
        </button>

        <button onClick={shareGenericLink} className="w-full mt-4 text-[11px] underline"
          style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}>
          or share a one-off link
        </button>

        {error && <p className="text-[12px] mt-4" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{error}</p>}

        <button onClick={onDone} className="w-full mt-6 text-[11px] underline" style={{ color: "rgba(43,42,31,0.4)", fontFamily: "'Special Elite', monospace" }}>skip for now</button>
      </div>
    </div>
  );
}

const TYPE_LABELS = { rose: "ROSE", bud: "BUD", thorn: "THORN" };
const TYPE_INK = { rose: "#8C2F45", bud: "#4B5E33", thorn: "#7A4A28" };

function InboxScreen({ userId, onBack }) {
  const [checkins, setCheckins] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [tab, setTab] = useState("inbox");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, groups(id, created_at, expires_at, created_by)")
        .eq("user_id", userId);

      const groups = (memberships || [])
        .map((m) => m.groups)
        .filter((g) => g && new Date(g.expires_at) > new Date())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const [withCards, { data: people }] = await Promise.all([
        Promise.all(
          groups.map(async (g) => {
            const { data: cards } = await supabase
              .from("cards")
              .select("type, content, user_id, created_at")
              .eq("group_id", g.id)
              .order("created_at", { ascending: true });
            return { ...g, cards: cards || [] };
          })
        ),
        supabase.rpc("profiles_for_my_checkins"),
      ]);

      if (cancelled) return;

      const byId = {};
      (people || []).forEach((p) => { byId[p.id] = p; });
      setProfiles(byId);
      setCheckins(withCards.filter((g) => g.cards.length > 0));
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const received = (checkins || []).filter((g) => g.created_by !== userId);
  const sent = (checkins || []).filter((g) => g.created_by === userId);
  const visible = tab === "inbox" ? received : sent;

  // Cards arrive flat; group them by author so each person shows up once
  // with their photo and name above their rose, bud and thorn.
  const byAuthor = (cards) => {
    const order = [];
    const map = new Map();
    for (const c of cards) {
      if (!map.has(c.user_id)) { map.set(c.user_id, []); order.push(c.user_id); }
      map.get(c.user_id).push(c);
    }
    return order.map((uid) => ({ userId: uid, cards: map.get(uid) }));
  };

  const nameFor = (uid) =>
    uid === userId ? "You" : (profiles[uid] && profiles[uid].display_name) || "Friend";

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-5 pt-8 pb-12" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] mb-6" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
          <ChevronLeft size={14} /> BACK TO HOME
        </button>

        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setTab("inbox")} className="px-4 py-2 rounded-full text-[12px] font-bold tracking-wide"
            style={{ background: tab === "inbox" ? "#2B2A1F" : "rgba(43,42,31,0.06)", color: tab === "inbox" ? "#EFE9DA" : "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
            INBOX {received.length > 0 ? `(${received.length})` : ""}
          </button>
          <button onClick={() => setTab("sent")} className="px-4 py-2 rounded-full text-[12px] font-bold tracking-wide"
            style={{ background: tab === "sent" ? "#2B2A1F" : "rgba(43,42,31,0.06)", color: tab === "sent" ? "#EFE9DA" : "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
            SENT {sent.length > 0 ? `(${sent.length})` : ""}
          </button>
        </div>

        {checkins === null ? (
          <p className="text-[13px]" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>Loading…</p>
        ) : visible.length === 0 ? (
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif" }}>
            {tab === "inbox"
              ? "Nothing here yet. When someone sends you a check-in and you both post, it'll show up here."
              : "Nothing here yet. Check-ins you start and send to others will show up here."}
          </p>
        ) : (
          visible.map((g) => (
            <div key={g.id} className="mb-7 pb-6" style={{ borderBottom: "1px solid rgba(43,42,31,0.1)" }}>
              <p className="text-[10px] tracking-wide mb-4" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
                {new Date(g.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>

              {byAuthor(g.cards).map((author) => (
                <div key={author.userId} className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar
                      url={profiles[author.userId] && profiles[author.userId].avatar_url}
                      name={nameFor(author.userId)}
                      size={32}
                    />
                    <span className="text-[12px]" style={{ color: "rgba(43,42,31,0.75)", fontFamily: "'Special Elite', monospace" }}>
                      {nameFor(author.userId)}
                    </span>
                  </div>

                  <div style={{ paddingLeft: "42px" }}>
                    {author.cards.map((c, i) => (
                      <div key={i} className="mb-2.5">
                        <span className="text-[9px] tracking-[0.15em] font-bold" style={{ color: TYPE_INK[c.type] }}>
                          {TYPE_LABELS[c.type]}
                        </span>
                        <p className="text-[13px] leading-snug" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif" }}>
                          {c.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AuthScreen() {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await signInWithEmail(email.trim());
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>

      <div className="flex items-center justify-center gap-1 mb-2 w-full mx-auto" style={{ maxWidth: "300px" }}>
        <img src={WORD_IMG.rose} alt="Rose" style={{ width: "30%", height: "auto", transform: "rotate(-6deg)" }} />
        <img src={WORD_IMG.bud} alt="Bud" style={{ width: "30%", height: "auto", transform: "translateY(14px) rotate(3deg)" }} />
        <img src={WORD_IMG.thorn} alt="Thorn" style={{ width: "30%", height: "auto", transform: "rotate(7deg)" }} />
      </div>

      <p className="text-[15px] mb-8" style={{ color: hexToRgba(ENTRY_INK, 0.7), fontFamily: "'Permanent Marker', cursive" }}>
        Connect with a friend today
      </p>

      {sent ? (
        <div className="w-full text-center" style={{ maxWidth: "320px" }}>
          <Mail size={22} color={ENTRY_INK} style={{ margin: "0 auto 12px" }} />
          <p className="text-[14px] leading-relaxed" style={{ color: "rgba(43,42,31,0.75)", fontFamily: "'Fraunces', serif" }}>
            Check <strong>{email}</strong> for a sign-in link.
          </p>
        </div>
      ) : (
        <div className="w-full" style={{ maxWidth: "320px" }}>
          <button
            onClick={handleGoogleSignIn}
            className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide"
            style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}
          >
            CONTINUE WITH GOOGLE
          </button>

          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              className="w-full text-center mt-4 text-[11px] underline"
              style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}
            >
              or sign in with email instead
            </button>
          ) : (
            <div className="mt-4">
              <p className="text-[11px] leading-relaxed mb-2" style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Fraunces', serif" }}>
                We'll email you a one-time link — no password needed. You'll need to open your inbox and tap it to finish signing in.
              </p>
              <form onSubmit={handleEmailSignIn} className="w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-full text-[13px] outline-none mb-3"
                  style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-50"
                  style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
                >
                  {loading ? "SENDING…" : "SEND SIGN-IN LINK"}
                </button>
              </form>
            </div>
          )}

          {error && (
            <p className="text-[12px] text-center mt-4" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DesktopBlockScreen() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Permanent+Marker&display=swap');`}</style>
      <div className="flex items-center justify-center gap-1 mb-6 w-full mx-auto" style={{ maxWidth: "300px" }}>
        <img src={WORD_IMG.rose} alt="Rose" style={{ width: "30%", height: "auto", transform: "rotate(-6deg)" }} />
        <img src={WORD_IMG.bud} alt="Bud" style={{ width: "30%", height: "auto", transform: "translateY(14px) rotate(3deg)" }} />
        <img src={WORD_IMG.thorn} alt="Thorn" style={{ width: "30%", height: "auto", transform: "rotate(7deg)" }} />
      </div>
      <p className="text-[16px] mb-3" style={{ color: hexToRgba(ENTRY_INK, 0.75), fontFamily: "'Permanent Marker', cursive" }}>
        This one's meant for your phone
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif", maxWidth: "300px" }}>
        Rose, Bud, Thorn is built for quick daily check-ins on the go. Open this page on your phone to get started.
      </p>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [stage, setStage] = useState("home");
  const [cardEntries, setCardEntries] = useState({ rose: "", bud: "", thorn: "" });
  const [groupId, setGroupId] = useState(null);
  const [joinedExisting, setJoinedExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [notifStatus, setNotifStatus] = useState(() =>
    typeof Notification !== "undefined" && Notification.permission === "granted" ? "enabled" : "idle"
  );
  const [showPrimer, setShowPrimer] = useState(false);
  const [profile, setProfile] = useState(undefined);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);

  const [pendingInvite] = useState(() => {
    const match = window.location.pathname.match(/^\/invite\/([^/]+)/);
    if (!match) return null;
    const params = new URLSearchParams(window.location.search);
    return { circleToken: match[1], checkinGroupId: params.get("checkin") };
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || !pendingInvite) return;

    (async () => {
      setStage("joining");
      setJoinError(null);

      const { data: circle, error: circleErr } = await supabase
        .from("circles")
        .select("id")
        .eq("invite_token", pendingInvite.circleToken)
        .single();

      if (circleErr || !circle) {
        setJoinError("This invite link isn't valid.");
        return;
      }

      const { data: me } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", session.user.id)
        .maybeSingle();
      const meta = session.user.user_metadata || {};
      const displayName =
        (me && me.display_name) || meta.full_name || meta.name || session.user.email?.split("@")[0] || "Friend";

      await supabase.from("circle_members").upsert(
        { circle_id: circle.id, user_id: session.user.id, display_name: displayName },
        { onConflict: "circle_id,user_id" }
      );

      // If this invite was made for a specific saved contact, bind that
      // contact to this account. From now on the sender can notify them
      // directly instead of texting a link.
      await supabase
        .rpc("connect_on_join", { p_circle_id: circle.id, p_user_id: session.user.id })
        .catch(() => {});

      if (pendingInvite.checkinGroupId) {
        const { error: joinInsertErr } = await supabase.from("group_members").insert({
          group_id: pendingInvite.checkinGroupId,
          user_id: session.user.id,
          invite_token: crypto.randomUUID(),
          joined_at: new Date().toISOString(),
        });
        if (joinInsertErr) {
          setJoinError(`Couldn't join this check-in: ${joinInsertErr.message}`);
          return;
        }
      }

      window.history.replaceState({}, "", "/");

      if (pendingInvite.checkinGroupId) {
        setGroupId(pendingInvite.checkinGroupId);
        setJoinedExisting(true);
        setCardEntries({ rose: "", bud: "", thorn: "" });
        setStage("cards");
      } else {
        setStage("home");
      }
    })();
  }, [session, pendingInvite]);

  // Load (or create) this user's profile row. Google gives us a real name
  // for free; magic-link users have to be asked.
  useEffect(() => {
    if (!session) { setProfile(undefined); return; }
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data && data.display_name) { setProfile(data); return; }

      const meta = session.user.user_metadata || {};
      const fromProvider = meta.full_name || meta.name || null;
      const avatar = (data && data.avatar_url) || meta.avatar_url || meta.picture || null;

      if (fromProvider) {
        await supabase.from("users").upsert(
          { id: session.user.id, display_name: fromProvider, avatar_url: avatar },
          { onConflict: "id" }
        );
        if (!cancelled) setProfile({ id: session.user.id, display_name: fromProvider, avatar_url: avatar });
        return;
      }

      if (!cancelled) setProfile({ id: session.user.id, display_name: null, avatar_url: avatar });
    })();

    return () => { cancelled = true; };
  }, [session]);

  const saveDisplayName = async (value) => {
    setSavingName(true);
    setNameError(null);
    const { error } = await supabase.from("users").upsert(
      { id: session.user.id, display_name: value },
      { onConflict: "id" }
    );
    setSavingName(false);
    if (error) { setNameError(error.message); return; }
    setProfile((p) => ({ ...(p || { id: session.user.id }), display_name: value }));
  };

  // First open after sign-in: ask about notifications once, and only once.
  // Skipping is remembered, and the toggle always lives on the profile.
  useEffect(() => {
    if (!session || pendingInvite) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    let asked = null;
    try { asked = window.localStorage.getItem(NOTIF_ASKED_KEY); } catch {}
    if (!asked) setShowPrimer(true);
  }, [session, pendingInvite]);

  const markPrimerSeen = () => {
    try { window.localStorage.setItem(NOTIF_ASKED_KEY, "1"); } catch {}
  };

  const filledCount = Object.values(cardEntries).filter((v) => v.trim().length > 0).length;

  const handleEnableNotifications = async () => {
    const { error } = await enablePushNotifications(session.user.id);
    setNotifStatus(error ? "error" : "enabled");
    return !error;
  };

  const handlePrimerEnable = async () => {
    const ok = await handleEnableNotifications();
    markPrimerSeen();
    if (ok) setShowPrimer(false);
  };

  const handlePrimerSkip = () => {
    markPrimerSeen();
    setShowPrimer(false);
  };

  const startCheckIn = () => {
    setSaveError(null);
    setCardEntries({ rose: "", bud: "", thorn: "" });
    setGroupId(null);
    setJoinedExisting(false);
    setStage("cards");
  };

  const finishCheckIn = async () => {
    setSaving(true);
    setSaveError(null);

    let targetGroupId = groupId;

    if (!targetGroupId) {
      const { data: group, error: groupErr } = await supabase
        .from("groups")
        .insert({ created_by: session.user.id })
        .select()
        .single();

      if (groupErr) {
        setSaving(false);
        setSaveError(groupErr.message);
        return;
      }

      await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: session.user.id,
        invite_token: group.id,
        joined_at: new Date().toISOString(),
      });

      targetGroupId = group.id;
    }

    const rows = Object.entries(cardEntries)
      .filter(([, value]) => value.trim().length > 0)
      .map(([type, content]) => ({
        group_id: targetGroupId,
        user_id: session.user.id,
        type,
        content,
      }));

    const { error: cardsError } = await supabase.from("cards").insert(rows);

    if (cardsError) {
      setSaving(false);
      setSaveError(cardsError.message);
      return;
    }

    const { data: userRow } = await supabase
      .from("users")
      .select("fill_count")
      .eq("id", session.user.id)
      .single();

    await supabase
      .from("users")
      .update({ fill_count: (userRow?.fill_count ?? 0) + 1 })
      .eq("id", session.user.id);

    supabase.functions
      .invoke("send-push", { body: { group_id: targetGroupId, sender_id: session.user.id } })
      .catch(() => {});

    setGroupId(targetGroupId);
    setSaving(false);
    setStage(joinedExisting ? "home" : "send");
  };

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    return <DesktopBlockScreen />;
  }

  if (session === undefined) {
    return <div className="min-h-screen w-full" style={{ background: "#EFE9DA" }} />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (stage === "joining") {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 text-center" style={{ background: "#EFE9DA" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&display=swap');`}</style>
        {joinError ? (
          <>
            <p className="text-[14px] mb-4" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{joinError}</p>
            <button onClick={() => { window.history.replaceState({}, "", "/"); setStage("home"); }} className="text-[12px] underline" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>
              Go to home
            </button>
          </>
        ) : (
          <p className="text-[14px]" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>Joining…</p>
        )}
      </div>
    );
  }

  if (profile === undefined) {
    return <div className="min-h-screen w-full" style={{ background: "#EFE9DA" }} />;
  }

  if (!profile.display_name) {
    return <NameStep onSave={saveDisplayName} saving={savingName} error={nameError} />;
  }

  if (showPrimer) {
    return <NotificationPrimer onEnable={handlePrimerEnable} onSkip={handlePrimerSkip} status={notifStatus} />;
  }

  if (stage === "inbox") {
    return <InboxScreen userId={session.user.id} onBack={() => setStage("home")} />;
  }

  if (stage === "profile") {
    return (
      <ProfileScreen
        userId={session.user.id}
        email={session.user.email}
        profile={profile}
        onProfileChange={setProfile}
        onBack={() => setStage("home")}
        notifStatus={notifStatus}
        onEnableNotifications={handleEnableNotifications}
      />
    );
  }

  if (stage === "cards") {
    return (
      <IntroCarousel
        entries={cardEntries}
        setEntries={setCardEntries}
        onBegin={finishCheckIn}
        onGoHome={() => setStage("home")}
        saving={saving}
        saveError={saveError}
        joinedExisting={joinedExisting}
      />
    );
  }

  if (stage === "send") {
    return <SendScreen userId={session.user.id} groupId={groupId} onDone={() => setStage("home")} />;
  }

  return (
    <DeskHome
      filledCount={filledCount}
      waitingCount={0}
      readCount={0}
      onOpenCards={startCheckIn}
      onOpenInbox={() => setStage("inbox")}
      onOpenProfile={() => setStage("profile")}
      saveError={saveError}
    />
  );
}
