import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Inbox, CheckCircle2, Home, Mail, LogOut } from "lucide-react";
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
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          placeholder={`Type your ${word.toLowerCase()} here\u2026`}
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

function IntroCarousel({ onBegin, onGoHome, entries, setEntries, saving, saveError }) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const startX = useRef(null);
  const dragging = useRef(false);
  const go = (i) => setIndex(Math.max(0, Math.min(INTRO_SLIDES.length - 1, i)));
  const onDown = (e) => { startX.current = (e.touches ? e.touches[0].clientX : e.clientX); dragging.current = true; };
  const onMove = (e) => { if (!dragging.current) return; const x = (e.touches ? e.touches[0].clientX : e.clientX); setDragX(x - startX.current); };
  const onUp = () => { if (!dragging.current) return; dragging.current = false; if (dragX < -60) go(index + 1); else if (dragX > 60) go(index - 1); setDragX(0); };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4" style={{ background: "#E8DFCB" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Special+Elite&family=Permanent+Marker&display=swap');
        .rbt-entry::placeholder { color: var(--ph-color); opacity: 0.45; font-family: 'Permanent Marker', cursive; }
      `}</style>

      <span className="text-[10px] tracking-[0.35em] uppercase mb-4" style={{ color: "rgba(60,48,35,0.55)", fontFamily: "'Special Elite', monospace" }}>
        {index === 0 ? "Swipe to begin" : `Card ${index + 1} of ${INTRO_SLIDES.length}`}
      </span>

      <div className="w-full max-w-md md:max-w-3xl flex items-center gap-4">
        <button onClick={() => go(index - 1)} disabled={index === 0} className="hidden md:flex shrink-0 items-center justify-center w-10 h-10 rounded-full disabled:opacity-20" style={{ background: "rgba(60,48,35,0.08)" }}>
          <ChevronLeft size={18} color="rgba(60,48,35,0.7)" />
        </button>

        <div className="w-full max-w-md md:max-w-xl mx-auto relative overflow-hidden rounded-[3px] touch-pan-y" style={{ aspectRatio: "3 / 2" }} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
          <div className="flex h-full" style={{ width: `${INTRO_SLIDES.length * 100}%`, transform: `translateX(calc(${-index * (100 / INTRO_SLIDES.length)}% + ${dragX}px))`, transition: dragging.current ? "none" : "transform 320ms cubic-bezier(.2,.8,.2,1)" }}>
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
            {saving ? "SAVING\u2026" : (<>BEGIN TODAY'S CHECK-IN <ArrowRight size={13} /></>)}
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

function DeskHome({ filledCount, waitingCount, readCount, onOpenCards, onOpenInbox, saveError }) {
  const cardsDone = filledCount >= 3;
  const inboxDone = waitingCount === 0 && readCount > 0;

  return (
    <div className="min-h-screen w-full flex flex-col items-center" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&family=Permanent+Marker&display=swap');`}</style>

      <div className="w-full flex flex-col items-center px-6" style={{ maxWidth: "480px" }}>
        <div className="w-full flex items-center justify-between mt-6">
          <button onClick={() => signOut()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "rgba(43,42,31,0.06)" }}>
            <LogOut size={13} color="rgba(43,42,31,0.5)" />
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

function SendScreen({ userId, groupId, onDone }) {
  const [circles, setCircles] = useState(null);
  const [mode, setMode] = useState("list");
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [activeLink, setActiveLink] = useState(null);

  useEffect(() => {
    supabase
      .from("circles")
      .select("id, name, invite_token, circle_members(id)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setCircles(data || []));
  }, [userId]);

  const buildLink = (circleToken) => `${window.location.origin}/invite/${circleToken}?checkin=${groupId}`;

  const openCircle = (circle) => {
    setActiveLink({ name: circle.name, url: buildLink(circle.invite_token) });
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const { data: circle, error: circleErr } = await supabase
      .from("circles")
      .insert({ owner_id: userId, name: newName.trim() || "New group" })
      .select()
      .single();
    setCreating(false);
    if (circleErr) {
      setError(circleErr.message);
      return;
    }
    setActiveLink({ name: circle.name, url: buildLink(circle.invite_token) });
  };

  const shareLink = async () => {
    const msg = `How was your day? I want to hear about it \u2014 join me on Rose, Bud, Thorn: ${activeLink.url}`;
    if (navigator.share) {
      try { await navigator.share({ text: msg }); } catch {}
    } else {
      await navigator.clipboard.writeText(msg);
      alert("Link copied \u2014 paste it anywhere to send.");
    }
  };

  if (activeLink) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-6" style={{ background: "#EFE9DA" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
        <div className="w-full text-center" style={{ maxWidth: "340px" }}>
          <h1 className="text-[20px] mb-1" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>{activeLink.name}</h1>
          <p className="text-[12px] mb-6" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>
            Share this link with anyone you want in this check-in. No typing needed — they'll join with their own name once they sign in.
          </p>
          <button onClick={shareLink} className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide mb-3"
            style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
            SHARE LINK
          </button>
          <button
            onClick={() => { navigator.clipboard.writeText(activeLink.url); alert("Copied!"); }}
            className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide"
            style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
          >
            COPY LINK
          </button>
          <button onClick={onDone} className="w-full mt-6 text-[12px] underline" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full" style={{ maxWidth: "360px" }}>
        <h1 className="text-[20px] mb-1" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Send this check-in</h1>
        <p className="text-[12px] mb-6" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>Pick a saved group, or create a new link — even just one friend is fine.</p>

        {mode === "list" && (
          <>
            {circles === null ? (
              <p className="text-[12px]" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>Loading\u2026</p>
            ) : circles.length === 0 ? (
              <p className="text-[12px] mb-4" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>No saved groups yet.</p>
            ) : (
              circles.map((c) => (
                <button key={c.id} onClick={() => openCircle(c)}
                  className="w-full flex items-center justify-between mb-3 px-4 py-3 rounded-full" style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)" }}>
                  <span className="text-[13px]" style={{ color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}>{c.name}</span>
                  <span className="text-[10px]" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>{c.circle_members?.length || 0} joined</span>
                </button>
              ))
            )}
            <button onClick={() => setMode("new")} className="w-full mt-2 px-4 py-3 rounded-full text-[12px] font-bold tracking-wide"
              style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
              + NEW LINK
            </button>
          </>
        )}

        {mode === "new" && (
          <>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={'Name it (optional — e.g. "College Friends")'}
              className="w-full px-4 py-3 rounded-full text-[13px] outline-none mb-4"
              style={{ background: "#fff", border: "1px solid rgba(43,42,31,0.15)", color: "#2B2A1F", fontFamily: "'Special Elite', monospace" }}
            />
            <button onClick={handleCreate} disabled={creating} className="w-full px-4 py-3 rounded-full text-[12px] font-bold tracking-wide disabled:opacity-50"
              style={{ background: "#2B2A1F", color: "#EFE9DA", fontFamily: "'Special Elite', monospace" }}>
              {creating ? "CREATING\u2026" : "CREATE & GET LINK"}
            </button>
            <button onClick={() => setMode("list")} className="w-full mt-3 text-[11px] underline" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Special Elite', monospace" }}>back to saved groups</button>
          </>
        )}

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

      const withCards = await Promise.all(
        groups.map(async (g) => {
          const { data: cards } = await supabase
            .from("cards")
            .select("type, content, user_id, created_at")
            .eq("group_id", g.id)
            .order("created_at", { ascending: true });
          return { ...g, cards: cards || [] };
        })
      );

      if (!cancelled) setCheckins(withCards.filter((g) => g.cards.length > 0));
    })();

    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center px-5 pt-8" style={{ background: "#EFE9DA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;1,500&family=Special+Elite&display=swap');`}</style>
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1 text-[12px] mb-6" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Special Elite', monospace" }}>
          <ChevronLeft size={14} /> BACK TO HOME
        </button>
        <h1 className="text-[22px] mb-2" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Inbox</h1>

        {checkins === null ? (
          <p className="text-[13px]" style={{ color: "rgba(43,42,31,0.5)", fontFamily: "'Fraunces', serif" }}>Loading\u2026</p>
        ) : checkins.length === 0 ? (
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(43,42,31,0.65)", fontFamily: "'Fraunces', serif" }}>
            Nothing here yet. Start a check-in and send it to a group to see answers appear here as people post.
          </p>
        ) : (
          checkins.map((g) => (
            <div key={g.id} className="mb-6 pb-6" style={{ borderBottom: "1px solid rgba(43,42,31,0.1)" }}>
              <p className="text-[10px] tracking-wide mb-3" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Special Elite', monospace" }}>
                {new Date(g.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
              {g.cards.length === 0 ? (
                <p className="text-[12px]" style={{ color: "rgba(43,42,31,0.45)", fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
                  No answers posted yet.
                </p>
              ) : (
                g.cards.map((c, i) => (
                  <div key={i} className="mb-3">
                    <span className="text-[9px] tracking-[0.15em] font-bold" style={{ color: TYPE_INK[c.type] }}>
                      {TYPE_LABELS[c.type]} {c.user_id === userId ? "(You)" : ""}
                    </span>
                    <p className="text-[13px] leading-snug" style={{ color: "#2B2A1F", fontFamily: "'Fraunces', serif" }}>
                      {c.content}
                    </p>
                  </div>
                ))
              )}
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
                  {loading ? "SENDING\u2026" : "SEND SIGN-IN LINK"}
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

      const displayName = session.user.email?.split("@")[0] || "Friend";

      await supabase.from("circle_members").upsert(
        { circle_id: circle.id, user_id: session.user.id, display_name: displayName },
        { onConflict: "circle_id,user_id" }
      );

      if (pendingInvite.checkinGroupId) {
        await supabase.from("group_members").insert({
          group_id: pendingInvite.checkinGroupId,
          user_id: session.user.id,
          invite_token: crypto.randomUUID(),
          joined_at: new Date().toISOString(),
        });
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

  const filledCount = Object.values(cardEntries).filter((v) => v.trim().length > 0).length;

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
          <p className="text-[14px]" style={{ color: "rgba(43,42,31,0.6)", fontFamily: "'Fraunces', serif" }}>Joining\u2026</p>
        )}
      </div>
    );
  }

  if (stage === "inbox") {
    return <InboxScreen userId={session.user.id} onBack={() => setStage("home")} />;
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
      saveError={saveError}
    />
  );
}
