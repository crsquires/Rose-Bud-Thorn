import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Inbox, CheckCircle2, Home, Mail, LogOut, Bell, Check, Users, Camera, MessageCircle } from "lucide-react";
import { supabase, signInWithEmail, signInWithGoogle, signOut } from "./lib/supabase";
import { setUnreadCount } from "./badge.js";
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

// The same postcard, already written on. Used to show the other person's
// card above your blank one.
function PostcardFrom({ slide, index, content, name, avatarUrl }) {
  const { word, ink } = slide;
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
        <p style={{
          margin: 0,
          color: hexToRgba(ENTRY_INK, 0.75),
          fontFamily: "'Permanent Marker', cursive",
          fontSize: "14px",
          lineHeight: "24px",
          wordBreak: "break-word",
          overflowWrap: "break-word",
          whiteSpace: "pre-wrap",
          textShadow: "0.4px 0.4px 0 rgba(60,42,20,0.12)",
        }}>
          {content}
        </p>
      </div>

      {/* address side: who it came from */}
      <div className="absolute overflow-hidden flex items-center gap-1.5" style={{ left: "58%", top: "62%", width: "33%", height: "57px", backgroundImage: rightLines, backgroundPosition: "0 3px" }}>
        <Avatar url={avatarUrl} name={name} size={20} />
        <p className="text-left" style={{ margin: 0, lineHeight: "19px", color: hexToRgba(ENTRY_INK, 0.7), fontFamily: "'Permanent Marker', cursive", fontSize: "10.5px", textShadow: "0.4px 0.4px 0 rgba(60,42,20,0.12)" }}>
          from {name}
        </p>
      </div>
    </div>
  );
}

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

function IntroCarousel({ onBegin, onGoHome, onProfile, profile, title, entries, setEntries, saving, saveError, joinedExisting, theirCards, theirName, theirAvatar, groupId, userId, profiles }) {
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

      {title && (
        <p className="text-[15px] text-center mb-3 px-4" style={{ color: hexToRgba(ENTRY_INK, 0.8), fontFamily: "'Permanent Marker', cursive" }}>
          {title}
        </p>
      )}

      {theirCards && theirCards[INTRO_SLIDES[index].key] && (
        <div className="w-full max-w-md md:max-w-xl mx-auto mb-4 px-1">
          <div className="w-full rounded-[3px] overflow-hidden" style={{ aspectRatio: "3 / 2" }}>
            <PostcardFrom
              slide={INTRO_SLIDES[index]}
              index={index}
              content={theirCards[INTRO_SLIDES[index].key].content}
              name={theirName}
              avatarUrl={theirAvatar}
            />
          </div>

          <div className="px-1 mt-2">
            <CommentThread
              card={theirCards[INTRO_SLIDES[index].key]}
              groupId={groupId}
              userId={userId}
              profiles={profiles || {}}
            />
          </div>

          <p className="text-[11px] text-center mt-4" style={{ color: "rgba(60,48,35,0.5)", fontFamily: "'Special Elite', monospace" }}>
            NOW WRITE YOURS
          </p>
        </div>
      )}

      {joinedExisting && !theirCards && (
        <p className="text-[12px] text-center leading-relaxed mb-4 px-4" style={{ color: "rgba(60,48,35,0.7)", fontFamily: "'Fraunces', serif", fontStyle: "italic", maxWidth: "340px" }}>
          Fill out your rose, bud & thorn to share yours back.
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
            {saving ? "SAVING…" : (<>{title ? "SAVE MY CARDS" : "BEGIN TODAY'S CHECK-IN"} <ArrowRight size={13} /></>)}
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
        <button onClick={onProfile} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(60,48,35,0.08)" }}>
          <span className="text-[10px] tracking-wide" style={{ color: "rgba(60,48,35,0.6)", fontFamily: "'Special Elite', monospace" }}>PROFILE</span>
          <Avatar url={profile?.avatar_url} name={profile?.display_name} size={20} />
        </button>
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

// The browser won't let us revoke the permission itself, but unsubscribing
// and deleting the row means nothing can be delivered -- which is what the
// person actually means by "off". Re-enabling later won't re-prompt.
async function disablePushNotifications(userId) {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    } else {
      // No live subscription, but clear any stale rows for this device's user.
      await supabase.from("push_subscriptions").delete().eq("user_id", userId);
    }

    await setUnreadCount(0);
    return { error: null };
  } catch (err) {
    return { error: err.message || "Couldn't turn notifications off." };
  }
}

// True only if permission is granted AND a live subscription exists -- after
// turning them off, permission stays granted, so permission alone would lie.
async function pushIsActive() {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
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

function DeskHome({ filledCount, waitingCount, readCount, profile, onOpenCards, onOpenInbox, onOpenProfile, saveError }) {
  // Shown until the app is actually installed, then it stops rendering on
  // its own. No dismiss flag -- a permanent one meant a single tap could
  // cost someone notifications forever.
  const showInstall = !isStandalone();

  const cardsDone = filledCount >= 3;
  const inboxDone = waitingCount === 0 && readCount > 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>

      <div className="w-full flex flex-col items-center px-6" style={{ maxWidth: "480px" }}>
        <div className="w-full flex items-center justify-between mt-6">
          <button onClick={onOpenProfile} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(43,42,31,0.06)" }}>
            <span className="text-[11px] tracking-wide" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
              PROFILE
            </span>
            <Avatar url={profile?.avatar_url} name={profile?.display_name} size={22} />
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
          Rose, Bud, Thorn is a simple way to connect with people in your life
        </p>

        {/* One grid for all three rows, so a wrapped description hangs under
            the description above it rather than under the label. */}
        <div className="mt-5 mx-auto" style={{
          maxWidth: "280px",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: "6px",
          rowGap: "8px",
          color: hexToRgba(ENTRY_INK, 0.75),
          fontFamily: "'Permanent Marker', cursive",
        }}>
          {[
            ["rose", "something good"],
            ["bud", "something you're looking forward to"],
            ["thorn", "something that's been a little rough"],
          ].map(([type, meaning]) => (
            <React.Fragment key={type}>
              <span className="text-[13px] leading-relaxed whitespace-nowrap">{TYPE_LABELS[type]} —</span>
              <span className="text-[13px] leading-relaxed">{meaning}</span>
            </React.Fragment>
          ))}
        </div>

        <p className="text-center mt-8 mx-auto text-[11px]" style={{
          maxWidth: "280px",
          color: hexToRgba(ENTRY_INK, 0.5),
          fontFamily: "'Fraunces', serif",
          fontStyle: "italic",
        }}>
          Messages automatically deleted after 24 hours.
        </p>

        {showInstall && (
          <div className="mx-auto w-full mt-7" style={{ maxWidth: "300px" }}>
            <InstallBanner />
          </div>
        )}

        </div>
      </div>
    </div>
  );
}

const NOTIF_ASKED_KEY = "rbt_notif_asked_v1";
const PENDING_INVITE_KEY = "rbt_pending_invite_v1";

// Already added to the home screen? Then it launches without browser chrome.
function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Web push on iPhone needs 16.4+. Below that, installing changes nothing,
// so telling someone to install would be a wasted trip.
function iosVersion() {
  if (typeof navigator === "undefined") return null;
  const m = navigator.userAgent.match(/OS (\d+)_(\d+)/);
  return m ? { major: Number(m[1]), minor: Number(m[2]) } : null;
}

function iosPushUnsupported() {
  const v = iosVersion();
  if (!v) return false;
  return v.major < 16 || (v.major === 16 && v.minor < 4);
}

// Chrome on Android supports this. Safari has it behind an off-by-default
// experimental flag, so hand entry has to stay as the fallback.
const CONTACT_PICKER_SUPPORTED =
  typeof navigator !== "undefined" && "contacts" in navigator && "ContactsManager" in window;

// Last 10 digits, so "(512) 555-0134" and "+15125550134" are the same person.
function phoneKey(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits || null;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// iOS gives no install API at all -- Safari only allows notifications for
// installed apps, so these steps are the only route to them on an iPhone.
function InstallSteps({ compact }) {
  const line = {
    color: "rgba(43,42,31,0.7)",
    fontFamily: "'Fraunces', serif",
  };

  if (isIOS()) {
    return (
      <div className={compact ? "" : "mt-2"} style={{ maxWidth: "300px" }}>
        <p className="text-[13px] leading-relaxed mb-2" style={line}>
          1. Tap the Share button at the bottom of Safari (the square with an arrow).
        </p>
        <p className="text-[13px] leading-relaxed mb-2" style={line}>
          2. Scroll down and tap <strong>Add to Home Screen</strong>.
        </p>
        <p className="text-[13px] leading-relaxed" style={line}>
          3. Open Rose, Bud, Thorn from your home screen from now on.
        </p>
      </div>
    );
  }

  return (
    <div className={compact ? "" : "mt-2"} style={{ maxWidth: "300px" }}>
      <p className="text-[13px] leading-relaxed mb-2" style={line}>
        1. Open your browser's menu (the three dots).
      </p>
      <p className="text-[13px] leading-relaxed" style={line}>
        2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.
      </p>
    </div>
  );
}

// Quiet, dismissible nudge on the home screen. Not a blocker -- people who
// only want to read a friend's check-in should never be stopped by it.
function InstallBanner() {
  const [prompt, setPrompt] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const install = async () => {
    if (!prompt) { setOpen((v) => !v); return; }
    prompt.prompt();
    await prompt.userChoice;
    setPrompt(null);
  };

  const tooOld = isIOS() && iosPushUnsupported();

  return (
    <div className="w-full rounded-xl px-3.5" style={{ background: "rgba(43,42,31,0.05)" }}>
      <button onClick={install}
        className="w-full flex items-center justify-between py-2.5"
        style={{ color: "rgba(43,42,31,0.7)", fontFamily: "'Special Elite', monospace", fontSize: "12px" }}>
        <span>{isIOS() ? "Skip signing in each time" : "Add to your phone"}</span>
        <span style={{
          display: "inline-block",
          transition: "transform 0.15s ease",
          transform: open && !prompt ? "rotate(90deg)" : "none",
          color: "rgba(43,42,31,0.45)",
          fontSize: "15px",
        }}>›</span>
      </button>

      {open && !prompt && (
        <div className="pb-3">
          {tooOld ? (
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif" }}>
              Your iPhone is running an older version of iOS. You can still add Rose, Bud, Thorn to your home screen, but
              notifications need iOS 16.4 or newer — updating in Settings will turn them on.
            </p>
          ) : (
            <p className="text-[12px] leading-relaxed mb-2" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif" }}>
              {isIOS()
                ? "Links from friends open in Safari, where you're signed out every time. Add it to your home screen and you stay signed in — and check-ins arrive as notifications instead of texts."
                : "Add it to your home screen to stay signed in, and check-ins arrive as notifications instead of texts."}
            </p>
          )}
          <InstallSteps compact />
        </div>
      )}
    </div>
  );
}

function NotificationPrimer({ onEnable, onSkip, status }) {
  // Safari blocks the permission prompt outright in a browser tab.
  const needsInstall = isIOS() && !isStandalone();

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
        {needsInstall ? (
          <>
            {iosPushUnsupported() ? (
              <p className="text-[12px] leading-relaxed mb-4" style={{ color: "rgba(43,42,31,0.7)", fontFamily: "'Fraunces', serif" }}>
                Notifications need iOS 16.4 or newer, and this iPhone is on an older version. You can update in
                Settings › General › Software Update, then turn them on here.
              </p>
            ) : (
              <>
                <p className="text-[12px] leading-relaxed mb-4" style={{ color: "rgba(43,42,31,0.7)", fontFamily: "'Fraunces', serif" }}>
                  On iPhone, notifications only work once the app is on your home screen:
                </p>
                <InstallSteps compact />
              </>
            )}
            <button onClick={onSkip} className="w-full mt-6 text-[11px] underline"
              style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
              continue without notifications
            </button>
          </>
        ) : (
          <>
            <button onClick={onEnable} className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide"
              style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
              TURN ON NOTIFICATIONS
            </button>
            <button onClick={onSkip} className="w-full mt-4 text-[11px] underline"
              style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
              not now
            </button>
          </>
        )}
      </div>

      {status === "error" && !needsInstall && (
        <p className="text-[12px] mt-5" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif", maxWidth: "290px" }}>
          Couldn't turn them on on this device.
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
  const [phone, setPhone] = useState("");

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

      {/* A real form, because Safari's AutoFill is far more willing inside one. */}
      <form className="w-full" style={{ maxWidth: "300px" }} onSubmit={(e) => e.preventDefault()}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          name="name"
          autoComplete="name"
          className="w-full px-4 py-3 rounded-full text-[14px] text-center outline-none mb-3"
          style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
        />

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number (optional)"
          type="tel"
          name="tel"
          autoComplete="tel"
          maxLength={25}
          className="w-full px-4 py-3 rounded-full text-[14px] text-center outline-none mb-2"
          style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
        />

        <p className="text-[11px] leading-relaxed mb-4" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>
          Only used so friends can text you a check-in if you have notifications off. You can add it later instead.
        </p>

        <button type="button" onClick={() => onSave(name.trim(), phone.trim())} disabled={!name.trim() || saving}
          className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-40"
          style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
          {saving ? "SAVING…" : "CONTINUE"}
        </button>
      </form>

      {error && <p className="text-[12px] mt-4" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{error}</p>}
    </div>
  );
}

function GroupEditor({ pill, contacts, name, setName, picks, togglePick, onSave, onRemove, onAddPerson }) {
  const [adding, setAdding] = useState(false);
  const [pName, setPName] = useState("");
  const [pPhone, setPPhone] = useState("");

  const add = async () => {
    if (!pName.trim()) return;
    const created = await onAddPerson(pName.trim(), pPhone.trim());
    if (created) {
      togglePick(created.id);   // tick them straight into this group
      setPName(""); setPPhone(""); setAdding(false);
    }
  };

  return (
    <div className="px-1 pt-2 pb-1">
      <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
        placeholder='Group name — e.g. "College Friends"'
        className="w-full px-4 py-2.5 rounded-full text-[13px] outline-none mb-3" style={pill} />

      <p className="text-[11px] mb-2" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>Who's in it?</p>
      {contacts.map((c) => {
        const on = picks.includes(c.id);
        return (
          <button key={c.id} onClick={() => togglePick(c.id)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl mb-2"
            style={{ ...pill, background: on ? "#2B2A1F" : "#fff", color: on ? "#EFE9DA" : "#2B2A1F" }}>
            <span className="text-[13px]">{c.name}</span>
            {on && <Check size={14} />}
          </button>
        );
      })}

      {adding ? (
        <div className="mb-2">
          <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Name" maxLength={40}
            className="w-full px-4 py-2.5 rounded-full text-[13px] outline-none mb-2" style={pill} />
          <input value={pPhone} onChange={(e) => setPPhone(e.target.value)} placeholder="Phone number" type="tel"
            className="w-full px-4 py-2.5 rounded-full text-[13px] outline-none mb-2" style={pill} />
          <button onClick={add} disabled={!pName.trim()}
            className="w-full px-3 py-2 rounded-full text-[11px] font-bold tracking-wide disabled:opacity-40"
            style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
            ADD TO GROUP
          </button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} className="text-[11px] underline mb-2"
          style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Special Elite', monospace" }}>
          + someone not on this list
        </button>
      )}

      <div className="flex gap-2 mt-2">
        <button onClick={onSave} disabled={!name.trim() || picks.length === 0}
          className="flex-1 px-3 py-2 rounded-full text-[11px] font-bold tracking-wide disabled:opacity-40"
          style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
          SAVE
        </button>
        {onRemove && (
          <button onClick={onRemove} className="px-4 py-2 rounded-full text-[11px]"
            style={{ background: "rgba(140,47,69,0.1)", color: "#8C2F45", fontFamily: "'Special Elite', monospace" }}>
            REMOVE
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileScreen({ userId, email, profile, onProfileChange, onBack, notifStatus, onEnableNotifications, onDisableNotifications }) {
  const [name, setName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);

  const [contacts, setContacts] = useState(null);
  const [groups, setGroups] = useState([]);
  const [editContact, setEditContact] = useState(null);   // contact id
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState(null);       // group id, or "new"
  const [groupName, setGroupName] = useState("");
  const [groupPicks, setGroupPicks] = useState([]);
  const [addingByHand, setAddingByHand] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [importing, setImporting] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const needsInstall = isIOS() && !isStandalone();

  const dirty =
    (name.trim() !== (profile?.display_name || "") && name.trim().length > 0) ||
    phone.trim() !== (profile?.phone || "");

  const saveName = async () => {
    setSavingName(true);
    setError(null);
    const { error: err } = await supabase
      .from("users")
      .update({ display_name: name.trim(), phone: phone.trim() || null })
      .eq("id", userId);
    setSavingName(false);
    if (err) { setError(err.message); return; }
    onProfileChange({ ...profile, display_name: name.trim(), phone: phone.trim() || null });
    setNotice("Saved.");
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

  const loadPeople = async () => {
    const [{ data: cs }, { data: gs }] = await Promise.all([
      supabase
        .from("contacts")
        .select("id, name, phone, linked_user_id")
        .eq("owner_id", userId)
        .order("name"),
      supabase
        .from("contact_groups")
        .select("id, name, contact_group_members(contact_id)")
        .eq("owner_id", userId)
        .order("name"),
    ]);
    setContacts(cs || []);
    setGroups(gs || []);
  };

  useEffect(() => { loadPeople(); }, [userId]);

  const openContact = (c) => {
    setEditContact(editContact === c.id ? null : c.id);
    setEditName(c.name);
    setEditGroup(null);
  };

  const renameContact = async (c) => {
    if (!editName.trim()) return;
    const { error: err } = await supabase
      .from("contacts")
      .update({ name: editName.trim() })
      .eq("id", c.id);
    if (err) { setError(err.message); return; }
    setEditContact(null);
    setNotice("Saved.");
    loadPeople();
  };

  const removeContact = async (c) => {
    if (!window.confirm(`Remove ${c.name}? They'll drop out of any groups too.`)) return;
    const { error: err } = await supabase.from("contacts").delete().eq("id", c.id);
    if (err) { setError(err.message); return; }
    setEditContact(null);
    loadPeople();
  };

  const openGroup = (g) => {
    if (g === "new") {
      setEditGroup("new");
      setGroupName("");
      setGroupPicks([]);
    } else {
      setEditGroup(editGroup === g.id ? null : g.id);
      setGroupName(g.name);
      setGroupPicks((g.contact_group_members || []).map((m) => m.contact_id));
    }
    setEditContact(null);
  };

  const saveGroup = async () => {
    if (!groupName.trim() || groupPicks.length === 0) return;
    setError(null);

    let groupId = editGroup;

    if (editGroup === "new") {
      const { data, error: err } = await supabase
        .from("contact_groups")
        .insert({ owner_id: userId, name: groupName.trim() })
        .select()
        .single();
      if (err) { setError(err.message); return; }
      groupId = data.id;
    } else {
      const { error: err } = await supabase
        .from("contact_groups")
        .update({ name: groupName.trim() })
        .eq("id", groupId);
      if (err) { setError(err.message); return; }
      // Simplest correct approach: clear the membership and rewrite it.
      await supabase.from("contact_group_members").delete().eq("contact_group_id", groupId);
    }

    const { error: memberErr } = await supabase
      .from("contact_group_members")
      .insert(groupPicks.map((contactId) => ({ contact_group_id: groupId, contact_id: contactId })));
    if (memberErr) { setError(memberErr.message); return; }

    setEditGroup(null);
    setNotice("Saved.");
    loadPeople();
  };

  const removeGroup = async (g) => {
    if (!window.confirm(`Remove "${g.name}"? The people in it stay in your contacts.`)) return;
    const { error: err } = await supabase.from("contact_groups").delete().eq("id", g.id);
    if (err) { setError(err.message); return; }
    setEditGroup(null);
    loadPeople();
  };

  // An invite with no check-in attached -- purely to connect, so they show up
  // in your list ready for next time.
  const inviteSomeone = async () => {
    setError(null);
    const { data: circle, error: err } = await supabase
      .from("circles")
      .insert({ owner_id: userId, name: "Invite" })
      .select()
      .single();
    if (err) { setError(err.message); return; }

    const url = `${window.location.origin}/invite/${circle.invite_token}`;
    const msg = `Join me on Rose, Bud, Thorn — I want to hear how your day's going: ${url}`;
    if (navigator.share) {
      try { await navigator.share({ text: msg }); } catch { return; }
      setNotice("Invite sent. They'll appear here once they join.");
    } else {
      await navigator.clipboard.writeText(msg);
      setNotice("Invite link copied.");
    }
  };

  const addByHand = async () => {
    if (!newName.trim()) return;
    setError(null);
    const { error: err } = await supabase.from("contacts").insert({
      owner_id: userId,
      name: newName.trim(),
      phone: newPhone.trim() || null,
    });
    if (err) { setError(err.message); return; }
    setNewName(""); setNewPhone(""); setAddingByHand(false);
    setNotice("Added. They'll get a text when you send to them.");
    loadPeople();
  };

  // Android Chrome only -- Safari has no address book API at all.
  const importFromPhone = async () => {
    setError(null);
    setNotice(null);
    setImporting(true);
    try {
      const available = await navigator.contacts.getProperties();
      const wanted = ["name", "tel"].filter((p) => available.includes(p));
      const picked = await navigator.contacts.select(wanted, { multiple: true });
      if (!picked || picked.length === 0) return;

      const seen = new Set((contacts || []).map((c) => phoneKey(c.phone)).filter(Boolean));
      const rows = [];
      for (const p of picked) {
        const phone = (p.tel && p.tel[0]) || null;
        const key = phoneKey(phone);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push({ owner_id: userId, name: (p.name && p.name[0]) || phone, phone });
      }

      if (rows.length === 0) { setNotice("Already saved, or no phone numbers on those."); return; }

      const { error: err } = await supabase.from("contacts").insert(rows);
      if (err) { setError(err.message); return; }
      setNotice(`Added ${rows.length}.`);
      loadPeople();
    } catch {
      setError("Couldn't open your contacts. You can still add someone by hand.");
    } finally {
      setImporting(false);
    }
  };

  // Used by the group editor: create the person, return them so they can be
  // ticked into the group immediately.
  const addPersonForGroup = async (personName, personPhone) => {
    setError(null);
    const { data, error: err } = await supabase
      .from("contacts")
      .insert({ owner_id: userId, name: personName, phone: personPhone || null })
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    await loadPeople();
    return data;
  };

  const togglePick = (id) =>
    setGroupPicks((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const pill = { background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" };
  const heading = { color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-5 pt-8 pb-12" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full" style={{ maxWidth: "400px" }}>
        <TopBar onHome={onBack} current="profile" avatarUrl={profile?.avatar_url} name={profile?.display_name} />

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
        <form onSubmit={(e) => e.preventDefault()}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            name="name"
            autoComplete="name"
            className="w-full px-4 py-3 rounded-full text-[13px] outline-none mb-2"
            style={pill}
          />

          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (optional)"
            type="tel"
            name="tel"
            autoComplete="tel"
            maxLength={25}
            className="w-full px-4 py-3 rounded-full text-[13px] outline-none mb-2"
            style={pill}
          />
        </form>
        {dirty && (
          <button onClick={saveName} disabled={savingName}
            className="w-full px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide mb-2 disabled:opacity-50"
            style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
            {savingName ? "SAVING…" : "SAVE"}
          </button>
        )}
        <p className="text-[11px] leading-relaxed mb-8" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Fraunces', serif" }}>
          Your friends see this name and photo on every card you send. Your number is only used so they can text you
          a check-in when notifications are off.
        </p>

        {/* ---------- notifications ---------- */}
        <p className="text-[10px] tracking-[0.2em] mb-3" style={heading}>NOTIFICATIONS</p>
        <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl mb-2" style={pill}>
          <div className="flex items-center gap-2">
            <Bell size={14} color="rgba(43,42,31,0.55)" />
            <span className="text-[13px]">Check-in alerts</span>
          </div>
          {notifStatus === "enabled" ? (
            <button onClick={onDisableNotifications} className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full"
              style={{ background: "rgba(75,94,51,0.12)", color: "#4B5E33", fontFamily: "'Special Elite', monospace" }}>
              <CheckCircle2 size={13} /> ON — TURN OFF
            </button>
          ) : needsInstall ? (
            <span className="text-[10px]" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
              NEEDS INSTALL
            </span>
          ) : (
            <button onClick={onEnableNotifications} className="text-[11px] px-3 py-1 rounded-full"
              style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
              TURN ON
            </button>
          )}
        </div>
        {needsInstall && notifStatus !== "enabled" && (
          <div className="mt-2 mb-2">
            {iosPushUnsupported() ? (
              <p className="text-[12px] leading-relaxed" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif" }}>
                Notifications need iOS 16.4 or newer. Update in Settings › General › Software Update, then add the app
                to your home screen.
              </p>
            ) : (
              <>
                <p className="text-[12px] leading-relaxed mb-2" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif" }}>
                  iPhone only allows notifications for apps on your home screen:
                </p>
                <InstallSteps compact />
              </>
            )}
          </div>
        )}
        {notifStatus === "error" && !needsInstall && (
          <p className="text-[11px] leading-relaxed" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>
            Couldn't turn them on on this device.
          </p>
        )}

        {/* ---------- people ---------- */}
        <div className="flex items-center justify-between mt-9 mb-3">
          <button onClick={() => setShowPeople((v) => !v)} className="flex items-center gap-2">
            <p className="text-[10px] tracking-[0.2em]" style={heading}>
              PEOPLE {contacts ? `(${contacts.length})` : ""}
            </p>
            <span style={{
              display: "inline-block",
              transition: "transform 0.15s ease",
              transform: showPeople ? "rotate(90deg)" : "none",
              color: "rgba(43,42,31,0.4)",
              fontSize: "15px",
            }}>›</span>
          </button>
          <div className="flex items-center gap-3" style={{ display: showPeople ? "flex" : "none" }}>
            {CONTACT_PICKER_SUPPORTED && (
              <button onClick={importFromPhone} disabled={importing} className="text-[11px] underline disabled:opacity-40"
                style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Special Elite', monospace" }}>
                {importing ? "opening…" : "from contacts"}
              </button>
            )}
            <button onClick={() => setAddingByHand((v) => !v)} className="text-[11px] underline"
              style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Special Elite', monospace" }}>
              add by hand
            </button>
            <button onClick={inviteSomeone} className="text-[11px] underline"
              style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Special Elite', monospace" }}>
              invite
            </button>
          </div>
        </div>

        <div style={{ display: showPeople ? "block" : "none" }}>
        {addingByHand && (
          <div className="mb-4">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" maxLength={40}
              className="w-full px-4 py-3 rounded-full text-[13px] outline-none mb-2" style={pill} />
            <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" type="tel"
              className="w-full px-4 py-3 rounded-full text-[13px] outline-none mb-2" style={pill} />
            <button onClick={addByHand} disabled={!newName.trim()}
              className="w-full px-4 py-2.5 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-40"
              style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
              SAVE CONTACT
            </button>
            <p className="text-[11px] leading-relaxed mt-2" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Fraunces', serif" }}>
              With a number saved you can put them in a group now — they'll get a text invite when you send.
            </p>
          </div>
        )}

        {contacts === null ? (
          <p className="text-[12px]" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Fraunces', serif" }}>
            Nobody here yet. People appear once they open one of your links.
          </p>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className="mb-2">
              <button onClick={() => openContact(c)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl" style={pill}>
                <span className="flex items-center gap-2.5 text-[13px]">
                  <Avatar url={null} name={c.name} size={26} />
                  {c.name}
                </span>
                <span className="text-[10px]" style={{ color: c.linked_user_id ? "#4B5E33" : "rgba(43,42,31,0.4)" }}>
                  {c.linked_user_id ? "ON THE APP" : (c.phone || "invited")}
                </span>
              </button>

              {editContact === c.id && (
                <div className="px-1 pt-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={40}
                    className="w-full px-4 py-2.5 rounded-full text-[13px] outline-none mb-2" style={pill} />
                  <div className="flex gap-2">
                    <button onClick={() => renameContact(c)}
                      className="flex-1 px-3 py-2 rounded-full text-[11px] font-bold tracking-wide"
                      style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
                      SAVE
                    </button>
                    <button onClick={() => removeContact(c)}
                      className="px-4 py-2 rounded-full text-[11px]"
                      style={{ background: "rgba(140,47,69,0.1)", color: "#8C2F45", fontFamily: "'Special Elite', monospace" }}>
                      REMOVE
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        </div>

        {/* ---------- groups ---------- */}
        <div className="flex items-center justify-between mt-9 mb-3">
          <button onClick={() => setShowGroups((v) => !v)} className="flex items-center gap-2">
            <p className="text-[10px] tracking-[0.2em]" style={heading}>
              GROUPS {groups.length > 0 ? `(${groups.length})` : ""}
            </p>
            <span style={{
              display: "inline-block",
              transition: "transform 0.15s ease",
              transform: showGroups ? "rotate(90deg)" : "none",
              color: "rgba(43,42,31,0.4)",
              fontSize: "15px",
            }}>›</span>
          </button>
          <button onClick={() => { setShowGroups(true); openGroup("new"); }} disabled={!contacts || contacts.length === 0}
            className="text-[11px] underline disabled:opacity-30"
            style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Special Elite', monospace" }}>
            new group
          </button>
        </div>

        <div style={{ display: showGroups ? "block" : "none" }}>

        {groups.length === 0 && editGroup !== "new" && (
          <p className="text-[12px] leading-relaxed" style={{ color: "rgba(43,42,31,0.55)", fontFamily: "'Fraunces', serif" }}>
            No groups yet. Bundle people together so you can send to all of them at once.
          </p>
        )}

        {groups.map((g) => (
          <div key={g.id} className="mb-2">
            <button onClick={() => openGroup(g)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl" style={pill}>
              <span className="flex items-center gap-2 text-[13px]"><Users size={14} /> {g.name}</span>
              <span className="text-[10px]" style={{ color: "rgba(43,42,31,0.4)" }}>
                {g.contact_group_members?.length || 0} people
              </span>
            </button>

            {editGroup === g.id && (
              <GroupEditor
                pill={pill}
                contacts={contacts || []}
                name={groupName}
                setName={setGroupName}
                picks={groupPicks}
                togglePick={togglePick}
                onSave={saveGroup}
                onRemove={() => removeGroup(g)}
                onAddPerson={addPersonForGroup}
              />
            )}
          </div>
        ))}

        {editGroup === "new" && (
          <GroupEditor
            pill={pill}
            contacts={contacts || []}
            name={groupName}
            setName={setGroupName}
            picks={groupPicks}
            togglePick={togglePick}
            onSave={saveGroup}
            onRemove={null}
            onAddPerson={addPersonForGroup}
          />
        )}

        </div>

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

// "Burning Man Rose, Bud, Thorn -- how was it for you?" reads like a real
// invitation; the generic version does not say what it is about.
function inviteMessage(title, url) {
  return title
    ? `${title} Rose, Bud, Thorn — how was it for you? Join me: ${url}`
    : `How was your day? I want to hear about it — join me on Rose, Bud, Thorn: ${url}`;
}

// Builds a single SMS deep link addressed to everyone who isn't on the app yet.
// iOS and Android disagree on the separator before `body`, hence the sniff.
function buildSmsHref(numbers, body) {
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const list = numbers.map((n) => n.replace(/[^\d+]/g, "")).join(",");
  const sep = isIOS ? "&" : "?";
  return `sms:${list}${sep}body=${encodeURIComponent(body)}`;
}

function SendScreen({ userId, groupId, profile, title, onDone, onHome, onProfile }) {
  const [contacts, setContacts] = useState(null);
  const [groups, setGroups] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [picked, setPicked] = useState([]);
  const [showAllContacts, setShowAllContacts] = useState(false);
  const [showAllGroups, setShowAllGroups] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [savedGroup, setSavedGroup] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      const [{ data: cs }, { data: gs }, { data: people }] = await Promise.all([
        supabase
          .from("contacts")
          .select("id, name, phone, linked_user_id, last_sent_at, created_at")
          .eq("owner_id", userId)
          .order("last_sent_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("contact_groups")
          .select("id, name, last_sent_at, created_at, contact_group_members(contact_id)")
          .eq("owner_id", userId)
          .order("last_sent_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
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

      // "On the app" isn't the same as "can receive a push" -- on iPhone
      // that needs the app installed to the home screen. Anyone who can't
      // be pushed gets a text instead, so nobody is silently skipped.
      const linkedIds = chosen.filter((c) => c.linked_user_id).map((c) => c.linked_user_id);
      let pushable = new Set();
      if (linkedIds.length > 0) {
        const { data: reach, error: reachErr } = await supabase.rpc("contacts_reachable_by_push", {
          p_user_ids: linkedIds,
        });
        if (reachErr) console.warn("push reachability check failed:", reachErr.message);
        pushable = new Set((reach || []).map((r) => r.user_id));
      }

      const linked = chosen.filter((c) => c.linked_user_id && pushable.has(c.linked_user_id));
      const unlinked = chosen.filter((c) => !c.linked_user_id || !pushable.has(c.linked_user_id));

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
        const body = inviteMessage(title, url);
        window.location.href = buildSmsHref(withPhones.map((c) => c.phone), body);
        smsOpened = true;
      }

      // Remember who this went to so the shortlist stays the useful five.
      const now = new Date().toISOString();
      const usedGroupIds = groups.filter(groupIsOn).map((g) => g.id);
      await Promise.all([
        supabase.from("contacts").update({ last_sent_at: now }).in("id", picked),
        usedGroupIds.length > 0
          ? supabase.from("contact_groups").update({ last_sent_at: now }).in("id", usedGroupIds)
          : Promise.resolve(),
      ]);

      // Anyone we can neither push nor text: make them a link the sender can
      // hand over however they like. Better than asking someone to type in
      // another person's phone number.
      const noRoute = unlinked.filter((c) => !c.phone);
      let handoff = null;
      if (noRoute.length > 0) {
        const circle = await makeCircle(
          noRoute.length === 1 ? noRoute[0].name : "Check-in",
          noRoute.length === 1 ? noRoute[0].id : null
        );
        handoff = {
          names: noRoute.map((c) => c.name),
          message: inviteMessage(title, `${window.location.origin}/invite/${circle.invite_token}?checkin=${groupId}`),
        };
      }

      setResult({
        pushed: linked.length,
        texted: withPhones.length,
        skipped: noRoute.length,
        handoff,
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
      const msg = inviteMessage(title, url);
      if (navigator.share) {
        try { await navigator.share({ text: msg }); } catch { return; }
        setResult({ shared: true, copied: false });
      } else {
        await navigator.clipboard.writeText(msg);
        setResult({ shared: true, copied: true });
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const pill = { background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" };

  // Five most recent, plus anyone currently ticked so a selection never
  // disappears when the list is collapsed.
  const visibleContacts = (() => {
    if (!contacts) return [];
    if (showAllContacts) return contacts;
    const top = contacts.slice(0, 5);
    const extras = contacts.filter((c) => picked.includes(c.id) && !top.includes(c));
    return [...top, ...extras];
  })();

  // Nobody saved yet: the link is the only route, so it becomes the main action.
  const isEmpty = contacts !== null && contacts.length === 0 && groups.length === 0;

  if (result) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center px-6 pt-8" style={{ background: "#EFE9DA" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
        <div className="w-full" style={{ maxWidth: "380px" }}>
          <TopBar onHome={onHome} onProfile={onProfile} avatarUrl={profile?.avatar_url} name={profile?.display_name} />
        </div>
        <div className="flex flex-col items-center text-center pt-6">
        <CheckCircle2 size={26} color="#4B5E33" style={{ marginBottom: "14px" }} />
        <h1 className="text-[20px] mb-3" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Sent</h1>
        <div className="text-[13px] leading-relaxed" style={{ color: "rgba(43,42,31,0.7)", fontFamily: "'Fraunces', serif", maxWidth: "300px" }}>
          {result.shared && (
            <p className="mb-2">
              {result.copied
                ? "Link copied — paste it wherever you like."
                : "Your link is on its way."}{" "}
              Whoever opens it gets saved to your list, so next time they're one tap.
            </p>
          )}
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
          {result.handoff && (
            <div className="mb-2">
              <p className="mb-3">
                {result.handoff.names.join(" & ")} {result.handoff.names.length === 1 ? "doesn't have" : "don't have"} notifications
                turned on yet, so send them this however you like.
              </p>
              <button
                onClick={async () => {
                  if (navigator.share) {
                    try { await navigator.share({ text: result.handoff.message }); } catch {}
                  } else {
                    await navigator.clipboard.writeText(result.handoff.message);
                    setResult({ ...result, copied: true });
                  }
                }}
                className="px-5 py-2.5 rounded-full text-[12px] font-bold tracking-wide"
                style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
                SHARE THEIR LINK
              </button>
              {result.copied && (
                <p className="mt-2 text-[12px]" style={{ color: "#4B5E33" }}>Copied.</p>
              )}
            </div>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 pt-10 pb-12" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full" style={{ maxWidth: "380px" }}>
        <TopBar onHome={onHome} onProfile={onProfile} avatarUrl={profile?.avatar_url} name={profile?.display_name} />
        <h1 className="text-[20px] mb-1" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
          {title ? `Send your ${title} cards` : "Send this check-in"}
        </h1>
        <p className="text-[12px] mb-6" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>
          {isEmpty
            ? "Nobody to pick from yet — here's how the first one works."
            : "Pick a group or a few people. Anyone already on the app gets a notification right away."}
        </p>

        {groups.length > 0 && (
          <>
            <p className="text-[10px] tracking-[0.2em] mb-3" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>GROUPS</p>
            {(showAllGroups ? groups : groups.slice(0, 5)).map((g) => {
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
            {groups.length > 5 && (
              <button onClick={() => setShowAllGroups((v) => !v)} className="text-[11px] underline mt-1"
                style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}>
                {showAllGroups ? "show fewer" : `show all ${groups.length} groups`}
              </button>
            )}
            <div className="mb-6" />
          </>
        )}

        {!isEmpty && (
          <p className="text-[10px] tracking-[0.2em] mb-3" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>PEOPLE</p>
        )}

        {contacts === null ? (
          <p className="text-[12px]" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>Loading…</p>
        ) : contacts.length === 0 ? (
          <p className="text-[13px] leading-relaxed mb-1" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif" }}>
            Nobody's on your list yet. Send a link to whoever you want to hear from — once they open it, they're saved here and every check-in after this one is a single tap.
          </p>
        ) : (
          visibleContacts.map((c) => {
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

        {contacts && contacts.length > 5 && (
          <button onClick={() => setShowAllContacts((v) => !v)} className="text-[11px] underline mt-1"
            style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}>
            {showAllContacts ? "show fewer" : `show all ${contacts.length} people`}
          </button>
        )}

        {isEmpty ? (
          <button onClick={shareGenericLink}
            className="w-full mt-6 px-4 py-3 rounded-full text-[12px] font-bold tracking-wide"
            style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
            SHARE A LINK
          </button>
        ) : (
          <>
            <button onClick={send} disabled={picked.length === 0 || sending}
              className="w-full mt-5 px-4 py-3 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-40"
              style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
              {sending ? "SENDING…" : picked.length === 0 ? "PICK SOMEONE" : `SEND TO ${picked.length}`}
            </button>

            <button onClick={shareGenericLink} className="w-full mt-4 text-[11px] underline"
              style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}>
              or share a one-off link with someone new
            </button>
          </>
        )}

        {error && <p className="text-[12px] mt-4" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{error}</p>}

        <button onClick={onDone} className="w-full mt-8 text-[11px] underline" style={{ color: "rgba(43,42,31,0.4)", fontFamily: "'Special Elite', monospace" }}>
          not now — back to home
        </button>
      </div>
    </div>
  );
}

const TYPE_LABELS = { rose: "ROSE", bud: "BUD", thorn: "THORN" };
const TYPE_INK = { rose: "#8C2F45", bud: "#4B5E33", thorn: "#7A4A28" };

// Every signed-in screen gets the same two exits, so no screen is a dead end.
function TopBar({ onHome, onProfile, current, avatarUrl, name }) {
  const base = {
    fontFamily: "'Special Elite', monospace",
    fontSize: "11px",
    letterSpacing: "0.05em",
  };

  return (
    <div className="w-full flex items-center justify-between mb-7">
      <button onClick={onHome} disabled={current === "home"}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full disabled:opacity-40"
        style={{ ...base, background: "rgba(43,42,31,0.06)", color: "rgba(43,42,31,0.6)" }}>
        <Home size={13} /> HOME
      </button>

      <button onClick={onProfile} disabled={current === "profile"}
        className="flex items-center gap-2 px-2 py-1 rounded-full disabled:opacity-40"
        style={{ ...base, color: "rgba(43,42,31,0.6)" }}>
        PROFILE
        <Avatar url={avatarUrl} name={name} size={26} />
      </button>
    </div>
  );
}

// Signed-out invite landing. Shows WHO is waiting on you, never what they
// wrote -- card content stays behind the account.
// Before writing: is this about today, or about a thing that happened?
// The answer changes the invite wording and how long it stays open.
function CheckInKind({ onStart, onHome, onProfile, profile }) {
  const [mode, setMode] = useState(null);
  const [title, setTitle] = useState("");

  const pill = { background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" };

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-6 pt-8 pb-12" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>
      <div className="w-full" style={{ maxWidth: "380px" }}>
        <TopBar onHome={onHome} onProfile={onProfile} avatarUrl={profile?.avatar_url} name={profile?.display_name} />

        <h1 className="text-[20px] mb-1" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>
          What's this one about?
        </h1>
        <p className="text-[12px] mb-7" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>
          Whoever you send it to will see the same thing, so they know what they're answering.
        </p>

        <button onClick={() => setMode("daily")}
          className="w-full text-left px-4 py-4 rounded-2xl mb-3"
          style={{ ...pill, background: mode === "daily" ? "#2B2A1F" : "#fff", color: mode === "daily" ? "#EFE9DA" : "#2B2A1F" }}>
          <span className="flex items-center justify-between">
            <span className="text-[14px]">Life</span>
            {mode === "daily" && <Check size={15} />}
          </span>
          <span className="block text-[11px] mt-1" style={{ opacity: 0.6, fontFamily: "'Fraunces', serif" }}>
            How life treating you.
          </span>
        </button>

        <button onClick={() => setMode("event")}
          className="w-full text-left px-4 py-4 rounded-2xl mb-3"
          style={{ ...pill, background: mode === "event" ? "#2B2A1F" : "#fff", color: mode === "event" ? "#EFE9DA" : "#2B2A1F" }}>
          <span className="flex items-center justify-between">
            <span className="text-[14px]">An event</span>
            {mode === "event" && <Check size={15} />}
          </span>
          <span className="block text-[11px] mt-1" style={{ opacity: 0.6, fontFamily: "'Fraunces', serif" }}>
            A trip, a wedding, a festival — something you all went through.
          </span>
        </button>

        {mode === "event" && (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Name it — e.g. Burning Man"
            maxLength={50}
            autoFocus
            className="w-full px-4 py-3 rounded-full text-[13px] outline-none mt-2 mb-1"
            style={pill}
          />
        )}

        <button
          onClick={() => onStart(mode === "event" ? title.trim() : null)}
          disabled={!mode || (mode === "event" && !title.trim())}
          className="w-full mt-6 px-4 py-3 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-40"
          style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
          START
        </button>

        {mode === "event" && (
          <p className="text-[11px] leading-relaxed mt-4 text-center" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Fraunces', serif" }}>
            Event check-ins stay open for a week, so people can answer once they're home.
          </p>
        )}
      </div>
    </div>
  );
}

function InviteWelcome({ invite }) {
  const [sender, setSender] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.rpc("preview_invite_sender", {
        p_invite_token: invite.circleToken,
      });
      if (!cancelled && data && data.length > 0) {
        setSender({ name: data[0].sender_name, avatar: data[0].sender_avatar });
      }
    })();
    return () => { cancelled = true; };
  }, [invite]);

  return (
    <div className="w-full flex flex-col items-center text-center px-6 pt-12">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>
      <Avatar url={sender?.avatar} name={sender?.name} size={64} />
      <p className="text-[17px] mt-4 mb-2" style={{ color: hexToRgba(ENTRY_INK, 0.85), fontFamily: "'Permanent Marker', cursive" }}>
        {sender ? `${sender.name} shared their day with you` : "Someone shared their day with you"}
      </p>
      <p className="text-[13px] leading-relaxed" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif", maxWidth: "290px" }}>
        Sign in and it's the first thing you'll see.
      </p>
    </div>
  );
}

// Straight after joining: read what they sent, then write yours.
function CommentThread({ card, groupId, userId, profiles }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, content, user_id, created_at")
      .eq("card_id", card.id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  useEffect(() => { if (open && comments === null) load(); }, [open]);

  const post = async () => {
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    setError(null);
    const { data: inserted, error: err } = await supabase
      .from("comments")
      .insert({ card_id: card.id, group_id: groupId, user_id: userId, content: text })
      .select("id")
      .single();
    setPosting(false);
    if (err) { setError(err.message); return; }

    // Best effort -- a failed push should never look like a failed reply.
    supabase.functions
      .invoke("notify-comment", { body: { comment_id: inserted.id } })
      .catch(() => {});

    setDraft("");
    load();
  };

  const nameFor = (uid) =>
    uid === userId ? "You" : (profiles[uid] && profiles[uid].display_name) || "Friend";

  return (
    <div className="mt-1.5">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1.5 text-[10px]"
        style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
        <MessageCircle size={11} />
        {open ? "HIDE" : comments && comments.length > 0 ? `${comments.length} REPLIES` : "REPLY"}
      </button>

      {open && (
        <div className="mt-2 pl-3" style={{ borderLeft: "2px solid rgba(43,42,31,0.1)" }}>
          {comments === null ? (
            <p className="text-[11px]" style={{ color: "rgba(43,42,31,0.4)", fontFamily: "'Fraunces', serif" }}>Loading…</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="mb-2 flex items-start gap-2">
                <Avatar url={profiles[c.user_id] && profiles[c.user_id].avatar_url} name={nameFor(c.user_id)} size={20} />
                <p className="text-[12px] leading-snug" style={{ color: "rgba(43,42,31,0.8)", fontFamily: "'Fraunces', serif" }}>
                  <span style={{ fontFamily: "'Special Elite', monospace", fontSize: "10px", color: "rgba(43,42,31,0.5)" }}>
                    {nameFor(c.user_id)}{" "}
                  </span>
                  {c.content}
                </p>
              </div>
            ))
          )}

          <div className="flex items-center gap-2 mt-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") post(); }}
              placeholder="Say something…"
              maxLength={500}
              className="flex-1 px-3 py-2 rounded-full text-[12px] outline-none"
              style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Fraunces', serif" }}
            />
            <button onClick={post} disabled={!draft.trim() || posting}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30"
              style={{ background: "#2B2A1F" }}>
              <ArrowRight size={13} color="#EFE9DA" />
            </button>
          </div>

          {error && <p className="text-[11px] mt-1" style={{ color: "#8C2F45", fontFamily: "'Fraunces', serif" }}>{error}</p>}
        </div>
      )}
    </div>
  );
}

function InboxScreen({ userId, profile, onBack, onProfile, onSendMore, initialTab, onUnreadChange }) {
  const [checkins, setCheckins] = useState(null);
  const [profiles, setProfiles] = useState({});
  const [tab, setTab] = useState(initialTab || "inbox");
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, last_seen_at, groups(id, created_at, expires_at, created_by, title)")
      .eq("user_id", userId);

    const rows = (memberships || []).filter(
      (m) => m.groups && new Date(m.groups.expires_at) > new Date()
    );
    const ids = rows.map((m) => m.group_id);

    if (ids.length === 0) { setCheckins([]); return; }

    const [{ data: cards }, { data: comments }, { data: people }, { data: allMembers }] = await Promise.all([
      supabase.from("cards").select("id, group_id, type, content, user_id, created_at").in("group_id", ids),
      supabase.from("comments").select("id, group_id, card_id, user_id, content, created_at").in("group_id", ids),
      supabase.rpc("profiles_for_my_checkins"),
      // Who it went to, whether or not they have written anything yet.
      supabase.from("group_members").select("group_id, user_id").in("group_id", ids),
    ]);

    const byId = {};
    (people || []).forEach((p) => { byId[p.id] = p; });
    if (!people || people.length === 0) {
      console.warn("profiles_for_my_checkins returned nothing - names will show as 'Friend'");
    }
    setProfiles(byId);

    const built = rows
      .map((m) => {
        const g = m.groups;
        const myCards = (cards || []).filter((c) => c.group_id === g.id);
        const myComments = (comments || []).filter((c) => c.group_id === g.id);
        const seen = m.last_seen_at ? new Date(m.last_seen_at) : null;

        // Anything from someone else since the last time this person looked.
        const isNew = (item) =>
          item.user_id !== userId && (!seen || new Date(item.created_at) > seen);

        const unread =
          myCards.filter(isNew).length + myComments.filter(isNew).length;

        const stamps = [g.created_at, ...myCards.map((c) => c.created_at), ...myComments.map((c) => c.created_at)];
        const lastActivity = stamps.reduce((a, b) => (new Date(b) > new Date(a) ? b : a), g.created_at);

        const memberIds = [...new Set(
          (allMembers || []).filter((x) => x.group_id === g.id).map((x) => x.user_id)
        )];

        return { ...g, cards: myCards, comments: myComments, memberIds, unread, lastActivity };
      })
      .filter((g) => g.cards.length > 0)
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

    setCheckins(built);

    const totalUnread = built.reduce((n, g) => n + g.unread, 0);
    setUnreadCount(totalUnread);
    if (onUnreadChange) onUnreadChange(totalUnread);
  };

  useEffect(() => { load(); }, [userId]);

  const received = (checkins || []).filter((g) => g.created_by !== userId);
  const sent = (checkins || []).filter((g) => g.created_by === userId);
  const visible = tab === "inbox" ? received : sent;
  const unreadIn = received.reduce((n, g) => n + (g.unread > 0 ? 1 : 0), 0);

  const nameFor = (uid) =>
    uid === userId ? "You" : (profiles[uid] && profiles[uid].display_name) || "Friend";

  // Everyone this check-in involves apart from me. Members first, so a
  // check-in shows who it went to even before they have replied.
  const otherIds = (g) => {
    const fromMembers = (g.memberIds || []).filter((id) => id !== userId);
    if (fromMembers.length > 0) return fromMembers;
    return [...new Set(g.cards.map((c) => c.user_id))].filter((id) => id !== userId);
  };

  const openCheckIn = async (g) => {
    setOpenId(g.id);
    // Mark as seen, then clear the badge locally so it doesn't linger.
    await supabase
      .from("group_members")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("group_id", g.id)
      .eq("user_id", userId);
    setCheckins((prev) => {
      const next = (prev || []).map((c) => (c.id === g.id ? { ...c, unread: 0 } : c));
      const totalUnread = next.reduce((n, x) => n + x.unread, 0);
      setUnreadCount(totalUnread);
      if (onUnreadChange) onUnreadChange(totalUnread);
      return next;
    });
  };

  const byAuthor = (cards) => {
    const order = [];
    const map = new Map();
    for (const c of cards) {
      if (!map.has(c.user_id)) { map.set(c.user_id, []); order.push(c.user_id); }
      map.get(c.user_id).push(c);
    }
    return order.map((uid) => ({ userId: uid, cards: map.get(uid) }));
  };

  const dateLabel = (iso) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const open = (checkins || []).find((g) => g.id === openId);

  // ---------- detail ----------
  if (open) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center px-5 pt-8 pb-12" style={{ background: "#EFE9DA" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
        <div className="w-full max-w-md">
          <TopBar onHome={onBack} onProfile={onProfile} avatarUrl={profile?.avatar_url} name={profile?.display_name} />

          <button onClick={() => setOpenId(null)} className="flex items-center gap-1 text-[12px] mb-5"
            style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
            <ChevronLeft size={14} /> ALL CHECK-INS
          </button>

          <p className="text-[10px] tracking-wide mb-5" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
            {dateLabel(open.created_at)}{open.title ? ` · ${open.title.toUpperCase()}` : ""}
          </p>

          {open.created_by === userId && (
            <button onClick={() => onSendMore(open)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
              style={{ background: "rgba(43,42,31,0.06)", color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace", fontSize: "10px" }}>
              <ArrowRight size={12} /> SEND TO SOMEONE ELSE
            </button>
          )}

          {byAuthor(open.cards).map((author) => (
            <div key={author.userId} className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Avatar url={profiles[author.userId] && profiles[author.userId].avatar_url} name={nameFor(author.userId)} size={32} />
                <span className="text-[12px]" style={{ color: "rgba(43,42,31,0.75)", fontFamily: "'Special Elite', monospace" }}>
                  {nameFor(author.userId)}
                </span>
              </div>

              <div style={{ paddingLeft: "42px" }}>
                {author.cards.map((c) => (
                  <div key={c.id} className="mb-3.5">
                    <span className="text-[9px] tracking-[0.15em] font-bold" style={{ color: TYPE_INK[c.type] }}>
                      {TYPE_LABELS[c.type]}
                    </span>
                    <p className="text-[13px] leading-snug" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif" }}>
                      {c.content}
                    </p>
                    <CommentThread card={c} groupId={open.id} userId={userId} profiles={profiles} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---------- list ----------
  return (
    <div className="min-h-screen w-full flex flex-col items-center px-5 pt-8 pb-12" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full max-w-md">
        <TopBar onHome={onBack} onProfile={onProfile} avatarUrl={profile?.avatar_url} name={profile?.display_name} />

        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => setTab("inbox")} className="px-4 py-2 rounded-full text-[12px] font-bold tracking-wide"
            style={{ background: tab === "inbox" ? "#2B2A1F" : "rgba(43,42,31,0.06)", color: tab === "inbox" ? "#EFE9DA" : "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
            INBOX {unreadIn > 0 ? `(${unreadIn})` : ""}
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
          visible.map((g) => {
            const ids = otherIds(g);
            const names = ids.map(nameFor);
            const label = names.length === 0
              ? "Waiting for a reply"
              : names.length > 2
                ? `${names[0]}, ${names[1]} +${names.length - 2}`
                : names.join(" & ");

            return (
              <button key={g.id} onClick={() => openCheckIn(g)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl mb-2 text-left"
                style={{
                  background: "#fff",
                  border: g.unread > 0 ? "1px solid rgba(43,42,31,0.35)" : "1px solid rgba(43,42,31,0.12)",
                }}>
                <Avatar
                  url={profiles[ids[0]] && profiles[ids[0]].avatar_url}
                  name={names[0] || "?"}
                  size={38}
                />

                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] truncate" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: g.unread > 0 ? 600 : 500 }}>
                    {label}
                  </span>
                  <span className="block text-[11px] truncate" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}>
                    {dateLabel(g.created_at)}{g.title ? ` · ${g.title}` : ""}
                  </span>
                </span>

                {g.unread > 0 && (
                  <span className="shrink-0 min-w-[20px] h-[20px] px-1.5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: "#8C2F45", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
                    {g.unread}
                  </span>
                )}
                <ChevronRight size={15} color="rgba(43,42,31,0.3)" />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function AuthScreen({ invite }) {
  const oneTimeNote = "You'll only sign in once — after this you can save Rose, Bud, Thorn to your home screen and skip it on future visits.";

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

      {invite ? (
        <div className="mb-8 -mt-2">
          <InviteWelcome invite={invite} />
        </div>
      ) : (
        <p className="text-[15px] mb-8" style={{ color: hexToRgba(ENTRY_INK, 0.7), fontFamily: "'Permanent Marker', cursive" }}>
          Connect with a friend today
        </p>
      )}

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

      <p className="text-[11px] text-center leading-relaxed mt-8 mx-auto px-6" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Fraunces', serif", maxWidth: "300px" }}>
        {oneTimeNote}
      </p>
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
  const [notifStatus, setNotifStatus] = useState("idle");
  const [showPrimer, setShowPrimer] = useState(false);
  const [profile, setProfile] = useState(undefined);
  const [checkInTitle, setCheckInTitle] = useState(null);
  const [theirCheckIn, setTheirCheckIn] = useState(null);
  const [inboxTab, setInboxTab] = useState("inbox");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState(null);

  const [pendingInvite] = useState(() => {
    const match = window.location.pathname.match(/^\/invite\/([^/]+)/);

    if (match) {
      const params = new URLSearchParams(window.location.search);
      const invite = { circleToken: match[1], checkinGroupId: params.get("checkin") };
      try {
        window.localStorage.setItem(
          PENDING_INVITE_KEY,
          JSON.stringify({ ...invite, savedAt: Date.now() })
        );
      } catch {}
      return invite;
    }

    // Coming back from sign-in: the URL is now just "/", so recover it.
    try {
      const raw = window.localStorage.getItem(PENDING_INVITE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      // An hour is plenty to finish signing in, and stops a forgotten
      // invite hijacking a normal sign-in weeks later.
      if (!saved.savedAt || Date.now() - saved.savedAt > 60 * 60 * 1000) {
        window.localStorage.removeItem(PENDING_INVITE_KEY);
        return null;
      }
      return { circleToken: saved.circleToken, checkinGroupId: saved.checkinGroupId };
    } catch {
      return null;
    }
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

      try {
      const { data: circle, error: circleErr } = await supabase
        .from("circles")
        .select("id")
        .eq("invite_token", pendingInvite.circleToken)
        .single();

      if (circleErr || !circle) {
        try { window.localStorage.removeItem(PENDING_INVITE_KEY); } catch {}
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
      const { error: connectErr } = await supabase.rpc("connect_on_join", {
        p_circle_id: circle.id,
        p_user_id: session.user.id,
      });
      if (connectErr) {
        // Not fatal -- they still join, they just don't get saved as a contact.
        console.warn("connect_on_join failed:", connectErr.message);
      }

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
      try { window.localStorage.removeItem(PENDING_INVITE_KEY); } catch {}

      if (pendingInvite.checkinGroupId) {
        setGroupId(pendingInvite.checkinGroupId);
        setJoinedExisting(true);
        setCardEntries({ rose: "", bud: "", thorn: "" });
        await loadTheirCheckIn(pendingInvite.checkinGroupId, session.user.id);
        setStage("cards");
      } else {
        setStage("home");
      }
      } catch (err) {
        console.error("join failed:", err);
        setJoinError(`Something went wrong joining this check-in: ${err?.message || err}`);
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
        .select("id, display_name, avatar_url, phone")
        .eq("id", session.user.id)
        .maybeSingle();

      if (cancelled) return;

      if (data && data.display_name) { setProfile(data); return; }

      const meta = session.user.user_metadata || {};
      const fromProvider = meta.full_name || meta.name || null;
      const avatar = (data && data.avatar_url) || meta.avatar_url || meta.picture || null;

      if (fromProvider) {
        const { error: seedErr } = await supabase.from("users").upsert(
          { id: session.user.id, display_name: fromProvider, avatar_url: avatar },
          { onConflict: "id" }
        );
        if (seedErr) {
          // Don't pretend it saved -- fall through to the name step so the
          // person can set it, and surface the real reason in the console.
          console.error("couldn't save profile name:", seedErr.message);
          if (!cancelled) setProfile({ id: session.user.id, display_name: null, avatar_url: avatar });
          return;
        }
        if (!cancelled) setProfile({ id: session.user.id, display_name: fromProvider, avatar_url: avatar });
        return;
      }

      if (!cancelled) setProfile({ id: session.user.id, display_name: null, avatar_url: avatar });
    })();

    return () => { cancelled = true; };
  }, [session]);

  const saveDisplayName = async (value, phoneValue) => {
    setSavingName(true);
    setNameError(null);
    const { error } = await supabase.from("users").upsert(
      { id: session.user.id, display_name: value, phone: phoneValue || null },
      { onConflict: "id" }
    );
    setSavingName(false);
    if (error) {
      console.error("couldn't save display name:", error.message);
      setNameError(error.message);
      return;
    }
    setProfile((p) => ({ ...(p || { id: session.user.id }), display_name: value, phone: phoneValue || null }));
  };

  // Refresh the icon badge on load, so it is correct even for someone who
  // opens the app and never taps through to the inbox.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      const { data: memberships } = await supabase
        .from("group_members")
        .select("group_id, last_seen_at, groups(id, expires_at)")
        .eq("user_id", session.user.id);

      const live = (memberships || []).filter(
        (m) => m.groups && new Date(m.groups.expires_at) > new Date()
      );
      if (live.length === 0) { if (!cancelled) setUnreadCount(0); return; }

      const ids = live.map((m) => m.group_id);
      const [{ data: cards }, { data: comments }] = await Promise.all([
        supabase.from("cards").select("group_id, user_id, created_at").in("group_id", ids),
        supabase.from("comments").select("group_id, user_id, created_at").in("group_id", ids),
      ]);

      const count = live.reduce((n, m) => {
        const seen = m.last_seen_at ? new Date(m.last_seen_at) : null;
        const isNew = (x) =>
          x.group_id === m.group_id &&
          x.user_id !== session.user.id &&
          (!seen || new Date(x.created_at) > seen);
        return n + (cards || []).filter(isNew).length + (comments || []).filter(isNew).length;
      }, 0);

      if (!cancelled) setUnreadCount(count);
    })();

    return () => { cancelled = true; };
  }, [session, stage]);

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

  // Permission alone isn't the answer -- check for a live subscription.
  useEffect(() => {
    let cancelled = false;
    pushIsActive().then((active) => {
      if (!cancelled && active) setNotifStatus("enabled");
    });
    return () => { cancelled = true; };
  }, [session]);

  const handleDisableNotifications = async () => {
    const { error } = await disablePushNotifications(session.user.id);
    if (error) { setNotifStatus("error"); return; }
    setNotifStatus("idle");
  };

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

  // Everything the other person wrote in this check-in, keyed by type, so
  // each writing card can sit under the matching one of theirs.
  const loadTheirCheckIn = async (gid, uid) => {
    const [{ data: cards, error: cardsErr }, { data: people }] = await Promise.all([
      supabase
        .from("cards")
        .select("id, type, content, user_id, created_at")
        .eq("group_id", gid)
        .neq("user_id", uid)
        .order("created_at", { ascending: true }),
      supabase.rpc("profiles_for_my_checkins"),
    ]);

    if (cardsErr) {
      console.error("couldn't load their cards:", cardsErr.message);
      setTheirCheckIn(null);
      return;
    }
    if (!cards || cards.length === 0) {
      console.warn("no cards from anyone else in this check-in");
      setTheirCheckIn(null);
      return;
    }

    const byId = {};
    (people || []).forEach((p) => { byId[p.id] = p; });

    const byType = {};
    cards.forEach((c) => { if (!byType[c.type]) byType[c.type] = c; });

    const author = byId[cards[0].user_id];
    setTheirCheckIn({
      cards: byType,
      profiles: byId,
      name: (author && author.display_name) || "Your friend",
      avatar: author && author.avatar_url,
    });
  };

  const startCheckIn = () => {
    setSaveError(null);
    setCardEntries({ rose: "", bud: "", thorn: "" });
    setGroupId(null);
    setJoinedExisting(false);
    setCheckInTitle(null);
    setTheirCheckIn(null);
    setSendOrigin("flow");
    setStage("kind");
  };

  const [sendOrigin, setSendOrigin] = useState("flow");

  // Re-open the send screen for a check-in you already posted.
  const sendMore = (group) => {
    setGroupId(group.id);
    setCheckInTitle(group.title || null);
    setSendOrigin("inbox");
    setStage("send");
  };

  const beginWithKind = (title) => {
    setCheckInTitle(title);
    setStage("cards");
  };

  const finishCheckIn = async () => {
    setSaving(true);
    setSaveError(null);

    let targetGroupId = groupId;

    if (!targetGroupId) {
      // Events stay open a week -- people answer once they are home,
      // not the same night. Everyday check-ins keep the 24h default.
      const insert = { created_by: session.user.id };
      if (checkInTitle) {
        insert.title = checkInTitle;
        insert.expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { data: group, error: groupErr } = await supabase
        .from("groups")
        .insert(insert)
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
    return <AuthScreen invite={pendingInvite} />;
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
    return (
      <InboxScreen
        userId={session.user.id}
        profile={profile}
        initialTab={inboxTab}
        onBack={() => setStage("home")}
        onProfile={() => setStage("profile")}
        onSendMore={sendMore}
      />
    );
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
        onDisableNotifications={handleDisableNotifications}
      />
    );
  }

  if (stage === "kind") {
    return (
      <CheckInKind
        onStart={beginWithKind}
        onHome={() => setStage("home")}
        onProfile={() => setStage("profile")}
        profile={profile}
      />
    );
  }

  if (stage === "cards") {
    return (
      <IntroCarousel
        entries={cardEntries}
        setEntries={setCardEntries}
        onBegin={finishCheckIn}
        title={checkInTitle}
        theirCards={theirCheckIn && theirCheckIn.cards}
        theirName={theirCheckIn && theirCheckIn.name}
        theirAvatar={theirCheckIn && theirCheckIn.avatar}
        profiles={theirCheckIn && theirCheckIn.profiles}
        groupId={groupId}
        userId={session.user.id}
        onGoHome={() => setStage("home")}
        onProfile={() => setStage("profile")}
        profile={profile}
        saving={saving}
        saveError={saveError}
        joinedExisting={joinedExisting}
      />
    );
  }

  if (stage === "send") {
    return (
      <SendScreen
        userId={session.user.id}
        groupId={groupId}
        profile={profile}
        title={checkInTitle}
        onDone={() => {
          if (sendOrigin === "inbox") { setInboxTab("sent"); setStage("inbox"); }
          else setStage("home");
        }}
        onHome={() => setStage("home")}
        onProfile={() => setStage("profile")}
      />
    );
  }

  return (
    <DeskHome
      filledCount={filledCount}
      waitingCount={0}
      readCount={0}
      profile={profile}
      onOpenCards={startCheckIn}
      onOpenInbox={() => setStage("inbox")}
      onOpenProfile={() => setStage("profile")}
      saveError={saveError}
    />
  );
}
