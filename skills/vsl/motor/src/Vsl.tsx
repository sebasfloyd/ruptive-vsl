// Motor de VSL (video de ventas) con tipografía animada sincronizada a la voz.
// Sale de la VSL de Ruptive "Tu empresa con IA" v2 (3/11/2026). Todo se arma desde src/timeline.json,
// que genera voz.mjs a partir de plan.json (marca + escenas). No hay nada de una marca puntual en este archivo.
import React from "react";
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, Easing, continueRender, delayRender } from "remotion";
import TL from "./timeline.json";

const FPS = 30;
type Marca = {
  nombre: string; color?: string; color2?: string; logo?: string; producto?: string; partes?: string[];
  logosTitulo?: string; comparar?: [string, string]; musica?: boolean;
};
type W = { w: string; t: number };
type Scene = {
  b: string; type: string; bg: string; vo: string; show?: string; sub?: string; label?: string; n?: string; src?: string; mock?: string;
  items?: any[]; lit?: number[]; rows?: string[][]; cam?: number[]; timer?: string; from?: string; to?: string; hold?: number; end?: boolean; orb?: boolean;
  audio: string; dur: number; speechEnd: number; words: W[]; dims?: [number, number];
};
const DATA = TL as unknown as { marca: Marca; escenas: Scene[]; musica?: string };
const M = DATA.marca;
const S = DATA.escenas;

const hexRgb = (h: string) => { const x = h.replace("#", ""); const n = parseInt(x.length === 3 ? x.split("").map((c) => c + c).join("") : x, 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };
const ACC = M.color || "#f56300";
const C = { accent: ACC, accent2: M.color2 || ACC, rgb: hexRgb(ACC), ink: "#1d1d1f", ink2: "#6e6e73", tile: "#f5f5f7", line: "#e3e3e8", red: "#e5484d", wa: "#25d366" };
const SANS = "Geist, -apple-system, Helvetica Neue, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const PARTES = M.partes && M.partes.length ? M.partes : ["Qué es", "Cómo funciona", "Tus dudas", "Cómo empezar"];

const LEAD = 0.08;
const lenOf = (s: Scene) => LEAD + s.speechEnd + 0.24 + (s.hold || 0);
const starts: number[] = [];
{ let acc = 0; for (const s of S) { starts.push(acc); acc += Math.round(lenOf(s) * FPS); } starts.push(acc); }
export const totalFrames = () => starts[starts.length - 1] + 10;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const prog = (f: number, a: number, len = 8) => ease(clamp((f - a) / len));
const pop = (p: number) => 0.7 + 0.3 * p + 0.12 * Math.sin(Math.PI * p);

// ---------- fondos con movimiento ----------
const Bg: React.FC<{ kind: string; f: number; g: number }> = ({ kind, f, g }) => {
  if (kind === "light") {
    return (
      <AbsoluteFill style={{ background: C.tile }}>
        <AbsoluteFill style={{ backgroundImage: "radial-gradient(#d4d4da 1.3px, transparent 1.6px)", backgroundSize: "38px 38px", backgroundPosition: `${g * 0.25}px ${g * 0.15}px`, opacity: 0.6,
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 30%, #000 100%)" }} />
        <AbsoluteFill style={{ background: `radial-gradient(circle at ${50 + 30 * Math.sin(g / 140)}% 110%, rgba(${C.rgb},0.10), transparent 45%)` }} />
      </AbsoluteFill>
    );
  }
  const glow = kind === "glow";
  const ox = 50 + 25 * Math.sin(g / 120), oy = glow ? 115 : 105 + 6 * Math.cos(g / 90);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse ${glow ? "80% 70%" : "55% 45%"} at ${ox}% ${oy}%, rgba(${C.rgb},${glow ? 0.62 + 0.08 * Math.sin(f / 18) : 0.22}) 0%, transparent 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
        backgroundSize: "90px 90px", backgroundPosition: `0px ${g * 0.4}px`, WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, #000 0%, transparent 80%)" }} />
    </AbsoluteFill>
  );
};

// ---------- texto con marcas: [marcador de color] y _serif itálica_ ----------
type Tok = { w: string; hl: boolean; it: boolean };
const tokens = (s: string): Tok[] => {
  const out: Tok[] = []; let hl = false, it = false, cur = "";
  const push = () => { if (cur) out.push({ w: cur, hl, it }); cur = ""; };
  for (const ch of s) {
    if (ch === "[") { push(); hl = true; } else if (ch === "]") { push(); hl = false; }
    else if (ch === "_") { push(); it = !it; } else if (ch === " ") push(); else cur += ch;
  }
  push();
  return out.reduce<Tok[]>((a, t) => { if (/^[.,;:!?…]+$/.test(t.w) && a.length) a[a.length - 1].w += t.w; else a.push(t); return a; }, []);
};
const tokTime = (sc: Scene, i: number, n: number) => {
  const m = sc.words.length; if (!m) return 0;
  const k = Math.min(m - 1, Math.floor((i * m * 0.88) / n));
  return Math.max(0, sc.words[k].t - 0.06);
};
const hlTimes = (sc: Scene) => {
  const tk = tokens(sc.show || ""); const out: number[] = []; let prev = false;
  tk.forEach((t, i) => { if (t.hl && !prev) out.push(LEAD + tokTime(sc, i, tk.length)); prev = t.hl; });
  return out;
};

const Kinetic: React.FC<{ sc: Scene; f: number; text: string; dark: boolean; size?: number; align?: "center" | "left"; maxW?: number }> = ({ sc, f, text, dark, size, align = "center", maxW = 1560 }) => {
  const tk = tokens(text);
  const len = text.replace(/[\[\]_]/g, "").length;
  const fs = size || (len <= 26 ? 132 : len <= 44 ? 110 : len <= 62 ? 92 : 78);
  const groups: { hl: boolean; idx: number[] }[] = [];
  tk.forEach((t, i) => { const g = groups[groups.length - 1]; if (t.hl && g && g.hl) g.idx.push(i); else groups.push({ hl: t.hl, idx: [i] }); });
  const word = (i: number, last: boolean) => {
    const t = tk[i]; const a = (LEAD + tokTime(sc, i, tk.length)) * FPS; const p = prog(f, a, 7);
    return (
      <span key={i} style={{
        display: "inline-block", marginRight: t.hl && last ? 0 : "0.24em", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${pop(p)})`, filter: `blur(${(1 - p) * 8}px)`,
        fontFamily: t.it ? SERIF : SANS, fontStyle: t.it ? "italic" : "normal", fontWeight: t.it ? 400 : 700, letterSpacing: t.it ? "-0.01em" : undefined,
        color: t.hl ? undefined : t.it ? (dark ? "rgba(255,255,255,0.82)" : C.ink2) : undefined,
      }}>{t.w}</span>
    );
  };
  return (
    <div style={{ maxWidth: maxW, textAlign: align, fontFamily: SANS, fontWeight: 700, fontSize: fs, lineHeight: 1.12, letterSpacing: "-0.035em", color: dark ? "#fff" : C.ink }}>
      {groups.map((g, gi) => {
        if (!g.hl) return g.idx.map((i) => word(i, false));
        const a0 = (LEAD + tokTime(sc, g.idx[0], tk.length)) * FPS; const aN = (LEAD + tokTime(sc, g.idx[g.idx.length - 1], tk.length)) * FPS;
        const sw = ease(clamp((f - a0 - 2) / Math.max(8, aN - a0 + 8)));
        return (
          <span key={"g" + gi} style={{ display: "inline", padding: "0 0.16em", marginRight: "0.24em", borderRadius: "0.14em", WebkitBoxDecorationBreak: "clone", boxDecorationBreak: "clone" as any,
            backgroundImage: `linear-gradient(${C.accent}, ${C.accent})`, backgroundRepeat: "no-repeat", backgroundSize: `${sw * 100}% 100%`,
            color: sw > 0.3 ? "#fff" : (dark ? C.accent2 : C.accent) }}>
            {g.idx.map((i, k) => word(i, k === g.idx.length - 1))}
          </span>
        );
      })}
    </div>
  );
};

// ---------- subtítulo en las escenas de prueba ----------
const chunksOf = (words: W[]) => {
  const out: { a: number; w: string[] }[] = []; let cur: W[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    if (cur.length >= 6 || (/[.,;:?!]$/.test(w.w) && cur.length >= 3) || i === words.length - 1) { out.push({ a: cur[0].t, w: cur.map((x) => x.w) }); cur = []; }
  });
  return out;
};
const Caption: React.FC<{ sc: Scene; f: number; dark: boolean }> = ({ sc, f, dark }) => {
  const t = f / FPS - LEAD; const ch = chunksOf(sc.words);
  let k = -1; ch.forEach((c, i) => { if (t >= c.a - 0.05) k = i; });
  if (k < 0) return null;
  const c = ch[k]; const p = prog(f, (LEAD + c.a - 0.05) * FPS, 5);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 44, display: "flex", justifyContent: "center" }}>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 42, letterSpacing: "-0.01em", padding: "14px 30px", borderRadius: 18, opacity: p, transform: `translateY(${(1 - p) * 12}px) scale(${0.96 + 0.04 * p})`,
        background: dark ? "rgba(0,0,0,0.75)" : "#fff", color: dark ? "#fff" : C.ink, boxShadow: dark ? "none" : "0 10px 30px rgba(0,0,0,0.10)" }}>
        {c.w.join(" ")}
      </div>
    </div>
  );
};

// ---------- mapa de ruta (las 4 partes) ----------
const RoadMap: React.FC<{ n: number; dark: boolean }> = ({ n, dark }) => (
  <div style={{ position: "absolute", top: 38, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10, fontFamily: SANS }}>
    {PARTES.map((p, i) => {
      const on = i + 1 === n, done = i + 1 < n;
      return (
        <div key={p} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 22, fontWeight: 600, padding: "8px 18px", borderRadius: 999,
            background: on ? C.accent : "transparent", color: on ? "#fff" : dark ? (done ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.4)") : (done ? C.ink : C.ink2),
            border: on ? `1px solid ${C.accent}` : `1px solid ${dark ? "rgba(255,255,255,0.18)" : C.line}` }}>{i + 1}. {p}</div>
          {i < PARTES.length - 1 && <div style={{ width: 22, height: 2, background: done ? C.accent : dark ? "rgba(255,255,255,0.2)" : C.line }} />}
        </div>
      );
    })}
  </div>
);

// ---------- maquetas del dolor (los textos salen de items/label; si faltan, quedan estos de ejemplo) ----------
const card: React.CSSProperties = { background: "#16161a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 22, fontFamily: SANS, color: "#fff" };
const COLOR_APP: Record<string, string> = { Mail: "#4285f4", WhatsApp: C.wa, Planilla: "#0f9d58", Instagram: "#e1306c", Slack: "#611f69", Teléfono: "#8e8e93" };
const DEF: Record<string, any[]> = {
  notifs: [["Mail", "Re: Re: presupuesto actualizado"], ["WhatsApp", "¿Me pasás el precio?"], ["Planilla", "Actualizar stock de la semana"], ["Mail", "Factura pendiente"],
    ["WhatsApp", "¿Hay novedades del pedido?"], ["Mail", "Reunión: cambio de horario"], ["Planilla", "Cargar ventas del día"], ["WhatsApp", "Hola, ¿siguen atendiendo?"], ["Mail", "Te reenvío lo que pidieron"]],
  chats: [["lun 10:14", "¿Pudiste ver el presupuesto?"], ["mié 18:02", "Hola, ¿seguimos?"], ["vie 11:40", "Bueno, lo resolvimos con otro. Gracias."]],
  chaos: [["Ana", "Escribime un mail para un cliente"], ["Martín", "Hacé un resumen de esta planilla"], ["Lucía", "Dame ideas para Instagram"]],
  repeat: ["Lunes", "Martes", "Miércoles"],
};
const itemsOf = (sc: Scene) => (sc.items && sc.items.length ? sc.items : DEF[sc.mock || ""] || []);
const mockBeats = (sc: Scene): number[] => {
  const T = (x: number) => LEAD + sc.speechEnd * x;
  if (sc.mock === "notifs") return itemsOf(sc).slice(0, 9).map((_, i) => T(0.02 + i * 0.09));
  if (sc.mock === "chats" || sc.mock === "chaos") return itemsOf(sc).slice(0, 3).map((_, i) => T(0.05 + i * 0.22));
  if (sc.mock === "days") return [T(0.15), T(0.35), T(0.55), T(0.75)];
  if (sc.mock === "repeat") return itemsOf(sc).slice(0, 3).map((_, i) => T(0.05 + i * 0.25));
  return [];
};
const Mock: React.FC<{ sc: Scene; f: number }> = ({ sc, f }) => {
  const b = mockBeats(sc).map((t) => t * FPS);
  const it = itemsOf(sc);
  if (sc.mock === "notifs") {
    return (
      <div style={{ position: "relative", width: 1500, height: 430 }}>
        {it.slice(0, 9).map(([app, txt]: string[], i: number) => {
          const p = prog(f, b[i], 7); const col3 = i % 3, row = Math.floor(i / 3);
          const x = 20 + col3 * 490 + ((i * 37) % 24), y = row * 135 + ((i * 53) % 20); const r = ((i * 29) % 7) - 3;
          return (
            <div key={i} style={{ ...card, position: "absolute", left: x, top: y, width: 450, padding: "20px 24px", display: "flex", gap: 16, alignItems: "center", opacity: p, transform: `translateY(${(1 - p) * -60}px) rotate(${r}deg) scale(${pop(p)})`, boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: COLOR_APP[app] || C.accent, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}><div style={{ fontSize: 22, color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{app}</div><div style={{ fontSize: 24, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{txt}</div></div>
            </div>
          );
        })}
      </div>
    );
  }
  if (sc.mock === "chats") {
    return (
      <div style={{ ...card, width: 900, padding: "30px 34px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 54, height: 54, borderRadius: 27, background: "#2a2a30" }} /><div style={{ fontSize: 30, fontWeight: 700 }}>{sc.label || "Cliente potencial"}</div>
          <div style={{ marginLeft: "auto", fontSize: 22, fontWeight: 700, color: "#fff", background: C.red, padding: "6px 14px", borderRadius: 999, opacity: prog(f, (b[b.length - 1] || 0) + 10, 8) }}>Sin responder</div>
        </div>
        {it.slice(0, 3).map(([h, m]: string[], i: number) => {
          const p = prog(f, b[i], 8);
          return <div key={i} style={{ alignSelf: "flex-start", background: "#24242a", borderRadius: "6px 22px 22px 22px", padding: "16px 22px", fontSize: 30, opacity: p, transform: `translateX(${(1 - p) * -40}px) scale(${pop(p)})`, maxWidth: 760 }}>
            {m}<span style={{ fontSize: 20, color: "rgba(255,255,255,0.45)", marginLeft: 16 }}>{h}</span></div>;
        })}
      </div>
    );
  }
  if (sc.mock === "days") {
    let d = 1; b.forEach((t, i) => { if (f >= t) d = i + 1; });
    const flip = prog(f, b[Math.max(0, d - 1)], 6);
    return (
      <div style={{ display: "flex", gap: 50, alignItems: "center" }}>
        <div style={{ ...card, width: 520, padding: 34 }}>
          <div style={{ fontSize: 24, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{sc.sub || "Propuesta · Cliente nuevo"}</div>
          <div style={{ fontSize: 40, fontWeight: 700, marginTop: 8 }}>{sc.label || "propuesta_v3_FINAL.docx"}</div>
          {[0.9, 0.7, 0.8, 0.5].map((w, i) => <div key={i} style={{ height: 14, width: `${w * 100}%`, background: "rgba(255,255,255,0.1)", borderRadius: 7, marginTop: 16 }} />)}
          <div style={{ marginTop: 22, display: "inline-block", fontSize: 22, fontWeight: 700, color: C.accent2, background: `rgba(${C.rgb},0.15)`, padding: "6px 14px", borderRadius: 999 }}>Borrador</div>
        </div>
        <div style={{ ...card, width: 300, height: 300, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.accent2 }}>DÍA</div>
          <div style={{ fontSize: 170, fontWeight: 900, lineHeight: 1, transform: `translateY(${(1 - flip) * -40}px)`, opacity: flip }}>{d}</div>
        </div>
      </div>
    );
  }
  if (sc.mock === "chaos") {
    return (
      <div style={{ display: "flex", gap: 30 }}>
        {it.slice(0, 3).map(([n, q]: string[], i: number) => {
          const p = prog(f, b[i], 8);
          return <div key={i} style={{ ...card, width: 470, padding: 26, opacity: p, transform: `translateY(${(1 - p) * 50}px) rotate(${(i - 1) * 2.5}deg) scale(${pop(p)})` }}>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Chat de {n} · nuevo</div>
            <div style={{ marginTop: 16, marginLeft: "auto", background: "#2d2d34", borderRadius: "22px 22px 6px 22px", padding: "14px 18px", fontSize: 27, width: "fit-content" }}>{q}</div>
            {[0.9, 0.75, 0.6].map((w, k) => <div key={k} style={{ height: 12, width: `${w * 100}%`, background: "rgba(255,255,255,0.1)", borderRadius: 6, marginTop: 14 }} />)}
          </div>;
        })}
      </div>
    );
  }
  if (sc.mock === "repeat") {
    return (
      <div style={{ position: "relative", width: 980, height: 360 }}>
        {it.slice(0, 3).map((d: string, i: number) => {
          const p = prog(f, b[i], 8);
          return <div key={i} style={{ ...card, position: "absolute", left: i * 40, top: i * 70, width: 900, padding: "22px 28px", opacity: p, transform: `translateY(${(1 - p) * 40}px) scale(${pop(p)})`, boxShadow: "0 25px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ fontSize: 22, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>{d} · chat nuevo</div>
            <div style={{ marginTop: 10, fontSize: 30 }}>"{sc.label || "Te explico: somos una empresa de servicios, trabajamos con comercios, nuestros precios son..."}"</div>
          </div>;
        })}
      </div>
    );
  }
  return null;
};

// "Tu empresa [con IA]" → la parte entre corchetes va en color
const Producto: React.FC<{ txt: string }> = ({ txt }) => {
  const m = txt.match(/^(.*?)\[(.*?)\](.*)$/);
  if (!m) return <>{txt}</>;
  return <>{m[1]}<span style={{ color: C.accent2 }}>{m[2]}</span>{m[3]}</>;
};

// ---------- escenas ----------
const SceneView: React.FC<{ sc: Scene; idx: number; part: number; g0: number }> = ({ sc, idx, part, g0 }) => {
  const f = useCurrentFrame(); const g = g0 + f;
  const dark = sc.bg !== "light";
  const T = (frac: number) => (LEAD + sc.speechEnd * frac) * FPS;
  const center: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" };
  const proofTypes = ["shot", "photo", "stats", "logos", "result", "cards", "chips", "compare", "vids"];
  let body: React.ReactNode = null;

  switch (sc.type) {
    case "text": {
      body = (
        <AbsoluteFill style={{ ...center, padding: "0 160px" }}>
          <Kinetic sc={sc} f={f} text={sc.show || sc.vo} dark={dark} />
          {sc.sub && <div style={{ marginTop: 44, fontFamily: SANS, fontSize: 40, fontWeight: 500, color: dark ? "rgba(255,255,255,0.75)" : C.ink2, opacity: prog(f, T(0.6), 10) }}>{sc.sub}</div>}
          {sc.end && <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 80, opacity: prog(f, T(1), 14), fontFamily: SANS, fontWeight: 700, fontSize: 52, color: dark ? "#fff" : C.ink, letterSpacing: "-0.03em" }}>{M.logo && <Img src={staticFile(M.logo)} style={{ height: 76 }} />}{M.nombre}</div>}
        </AbsoluteFill>
      );
      break;
    }
    case "pain": {
      body = (
        <AbsoluteFill style={{ ...center, padding: "60px 140px 0", gap: 56 }}>
          <Mock sc={sc} f={f} />
          <Kinetic sc={sc} f={f} text={sc.show || sc.vo} dark={dark} size={74} />
        </AbsoluteFill>
      );
      break;
    }
    case "type": {
      const txt = sc.show || sc.vo; const n = Math.round(clamp((f / FPS - LEAD) / Math.max(0.5, sc.speechEnd)) * txt.length);
      body = (
        <AbsoluteFill style={center}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 120, color: dark ? "rgba(255,255,255,0.92)" : C.ink }}>
            {txt.slice(0, n)}<span style={{ opacity: Math.floor(f / 8) % 2 ? 0 : 1, color: C.accent, fontStyle: "normal" }}>|</span>
          </div>
        </AbsoluteFill>
      );
      break;
    }
    case "section": {
      const p = prog(f, 0, 10);
      body = (
        <AbsoluteFill style={{ ...center, flexDirection: "row", gap: 70 }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 440, lineHeight: 0.8, color: p > 0.95 ? `rgba(${C.rgb},0.12)` : "transparent", WebkitTextStroke: `5px ${C.accent}`, opacity: p, transform: `scale(${1.6 - 0.6 * p}) rotate(${(1 - p) * -12}deg)` }}>{sc.n}</div>
          <Kinetic sc={sc} f={f} text={sc.show || sc.vo} dark={dark} size={124} align="left" maxW={1000} />
        </AbsoluteFill>
      );
      break;
    }
    case "reveal": {
      const p = prog(f, 0, 14); const q = prog(f, T(0.12), 12);
      const ring = clamp(f / 24);
      body = (
        <AbsoluteFill style={center}>
          <div style={{ position: "absolute", width: 300 + ring * 1500, height: 300 + ring * 1500, borderRadius: "50%", border: `3px solid rgba(${C.rgb},${0.6 * (1 - ring)})` }} />
          {M.logo && <Img src={staticFile(M.logo)} style={{ height: 180, opacity: p, transform: `scale(${pop(p)}) rotate(${(1 - p) * -90}deg)`, marginBottom: 46 }} />}
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 150, letterSpacing: "-0.045em", color: "#fff", opacity: q, transform: `scale(${1.15 - 0.15 * q})`, filter: `blur(${(1 - q) * 14}px)`, textAlign: "center", maxWidth: 1700, lineHeight: 1.05 }}>
            <Producto txt={sc.show || M.producto || M.nombre} />
          </div>
          {sc.sub && <div style={{ marginTop: 30, fontFamily: SANS, fontSize: 42, fontWeight: 500, color: "rgba(255,255,255,0.8)", opacity: prog(f, T(0.55), 12) }}>{sc.sub}</div>}
        </AbsoluteFill>
      );
      break;
    }
    case "shot": {
      const src = sc.src!; const [iw, ih] = sc.dims || [1400, 875];
      const AW = 1640, AH = 790; const fit = Math.min(AW / iw, AH / ih);
      const cam = sc.cam || [0, 0, 1, 1]; const full = cam[0] === 0 && cam[1] === 0 && cam[2] === 1 && cam[3] === 1;
      const rw = (cam[2] - cam[0]) * iw, rh = (cam[3] - cam[1]) * ih;
      const zs = Math.min(AW / rw, AH / rh, fit * 2.1); const cx = (cam[0] + cam[2]) / 2 * iw, cy = (cam[1] + cam[3]) / 2 * ih;
      const k = full ? 0 : ease(clamp((f - T(0.08)) / (T(0.4) - T(0.08))));
      const s = full ? fit * (1 + 0.06 * clamp(f / (lenOf(sc) * FPS))) : fit + (zs - fit) * k;
      const px = (iw / 2) + (cx - iw / 2) * k, py = (ih / 2) + (cy - ih / 2) * k;
      const pin = prog(f, 0, 10);
      body = (
        <AbsoluteFill style={{ ...center, paddingBottom: 70 }}>
          <div style={{ width: AW, height: AH, borderRadius: 28, overflow: "hidden", background: "#fff", position: "relative", boxShadow: "0 30px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)", opacity: pin, transform: `translateY(${(1 - pin) * 60}px)` }}>
            <Img src={staticFile(src)} style={{ position: "absolute", left: AW / 2 - px * s, top: AH / 2 - py * s, width: iw * s, height: ih * s }} />
            {sc.timer && (
              <div style={{ position: "absolute", right: 28, bottom: 28, display: "flex", alignItems: "center", gap: 12, background: C.accent, color: "#fff", fontFamily: SANS, fontWeight: 800, fontSize: 44, padding: "16px 30px", borderRadius: 999, opacity: prog(f, T(0.6), 6), transform: `scale(${pop(prog(f, T(0.6), 10))})`, boxShadow: `0 15px 40px rgba(${C.rgb},0.4)` }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>{sc.timer}
              </div>
            )}
          </div>
        </AbsoluteFill>
      );
      break;
    }
    case "photo": {
      const p = prog(f, 0, 12); const [nm, rol] = (sc.label || "").split(" · ");
      body = (
        <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", padding: "0 120px", gap: 80 }}>
          <div style={{ width: 980, height: 780, borderRadius: 32, overflow: "hidden", opacity: p, transform: `translateX(${(1 - p) * -80}px)`, boxShadow: "0 30px 80px rgba(0,0,0,0.15)" }}>
            <Img src={staticFile(sc.src!)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${1.04 + 0.08 * clamp(f / (lenOf(sc) * FPS))})` }} />
          </div>
          <div style={{ fontFamily: SANS }}>
            <div style={{ fontSize: 100, fontWeight: 800, letterSpacing: "-0.04em", color: dark ? "#fff" : C.ink, lineHeight: 1, opacity: prog(f, 6, 8), transform: `translateY(${(1 - prog(f, 6, 8)) * 30}px)` }}>{nm}</div>
            <div style={{ fontSize: 44, fontWeight: 600, color: C.accent, marginTop: 22, opacity: prog(f, 14, 8) }}>{rol}</div>
          </div>
        </AbsoluteFill>
      );
      break;
    }
    case "stats": {
      const items = (sc.items || []) as string[][];
      body = (
        <AbsoluteFill style={{ ...center, flexDirection: "row", gap: 60, paddingBottom: 60 }}>
          {items.map(([num, lab], i) => {
            const a = T(i * 0.3); const p = prog(f, a, 9);
            const m = num.match(/^(\+?)([\d.]+)$/);
            let shown = num;
            if (m) { const target = parseInt(m[2].replace(/\./g, ""), 10); const v = Math.round(target * ease(clamp((f - a) / 20))); shown = m[1] + v.toLocaleString("es-AR"); }
            return (
              <div key={i} style={{ width: 480, padding: "56px 30px", borderRadius: 32, background: dark ? "rgba(255,255,255,0.06)" : "#fff", border: dark ? "1px solid rgba(255,255,255,0.1)" : "none", boxShadow: dark ? "none" : "0 20px 60px rgba(0,0,0,0.08)", textAlign: "center", fontFamily: SANS, opacity: p, transform: `translateY(${(1 - p) * 60}px) scale(${pop(p)})` }}>
                <div style={{ fontSize: m ? 124 : 72, fontWeight: 800, letterSpacing: "-0.04em", color: C.accent, lineHeight: 1.05, height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>{shown}</div>
                <div style={{ fontSize: 38, fontWeight: 600, color: dark ? "#fff" : C.ink, marginTop: 18 }}>{lab}</div>
              </div>
            );
          })}
        </AbsoluteFill>
      );
      break;
    }
    case "logos": {
      // Logos siempre sobre fondo oscuro y en color, en mosaicos translúcidos (los blancos sobre claro no se ven).
      const items = (sc.items || []) as string[];
      const cols = Math.min(6, items.length);
      body = (
        <AbsoluteFill style={{ ...center, paddingBottom: 80 }}>
          <div style={{ fontFamily: SANS, fontSize: 36, fontWeight: 600, color: "rgba(255,255,255,0.75)", marginBottom: 40, opacity: prog(f, 0, 10) }}>{sc.label || M.logosTitulo || "Empresas que trabajaron con nosotros"}</div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 240px)`, gap: 24 }}>
            {items.map((src, i) => {
              const p = prog(f, 4 + i * 4, 8);
              return <div key={src} style={{ height: 140, borderRadius: 22, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px) scale(${pop(p)})` }}>
                <Img src={staticFile(src)} style={{ width: 190, height: 95, objectFit: "contain" }} />
              </div>;
            })}
          </div>
        </AbsoluteFill>
      );
      break;
    }
    case "result": {
      const a = T(0.15), b = T(0.4);
      const strike = clamp((f - a - 8) / 8);
      const shake = f > b && f < b + 8 ? Math.sin(f * 3) * 6 : 0;
      body = (
        <AbsoluteFill style={{ ...center, paddingBottom: 60, fontFamily: SANS, transform: `translateX(${shake}px)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
            <div style={{ position: "relative", fontSize: 190, fontWeight: 800, color: C.ink2, letterSpacing: "-0.05em", opacity: prog(f, a, 8) }}>
              {sc.from}
              <div style={{ position: "absolute", left: -10, top: "52%", height: 14, borderRadius: 7, background: C.red, width: `${strike * 105}%` }} />
            </div>
            <svg width="120" height="80" viewBox="0 0 120 80" style={{ opacity: prog(f, b - 4, 8) }}><path d="M5 40h100M80 12l28 28-28 28" fill="none" stroke={C.accent} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <div style={{ fontSize: 260, fontWeight: 900, color: C.accent, letterSpacing: "-0.05em", opacity: prog(f, b, 6), transform: `scale(${pop(prog(f, b, 10)) * (1 + 0.3 * (1 - prog(f, b, 10)))})` }}>{sc.to}</div>
          </div>
          <div style={{ fontSize: 44, fontWeight: 600, color: dark ? "#fff" : C.ink, marginTop: 20, opacity: prog(f, b + 6, 10) }}>{sc.label}</div>
        </AbsoluteFill>
      );
      break;
    }
    case "cards": {
      const items = (sc.items || []) as string[][];
      body = (
        <AbsoluteFill style={{ ...center, flexDirection: "row", gap: 50, paddingBottom: 80 }}>
          {items.map(([src, lab], i) => {
            const p = prog(f, T(0.25 + i * 0.18), 9); const rot = (i - 1) * 5;
            return (
              <div key={i} style={{ opacity: p, transform: `translateY(${(1 - p) * 120 + (i === 1 ? -20 : 0)}px) rotate(${rot * p - (1 - p) * 15}deg) scale(${pop(p)})`, textAlign: "center" }}>
                <Img src={staticFile(src)} style={{ width: 440, height: 550, objectFit: "cover", borderRadius: 26, boxShadow: "0 30px 70px rgba(0,0,0,0.18)" }} />
                <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 600, color: dark ? "rgba(255,255,255,0.75)" : C.ink2, marginTop: 22 }}>{lab}</div>
              </div>
            );
          })}
        </AbsoluteFill>
      );
      break;
    }
    case "chips": {
      const items = (sc.items || []) as string[]; const lit = sc.lit || items.map((_, i) => i / items.length);
      body = (
        <AbsoluteFill style={{ ...center, paddingBottom: 80 }}>
          {sc.orb && M.logo && <Img src={staticFile(M.logo)} style={{ height: 200, marginBottom: 30, opacity: prog(f, 0, 12), transform: `scale(${pop(prog(f, 0, 14))}) rotate(${Math.sin(f / 20) * 6}deg)` }} />}
          {sc.sub && <div style={{ fontFamily: SANS, fontSize: 54, fontWeight: 700, letterSpacing: "-0.03em", color: dark ? "#fff" : C.ink, marginBottom: 46, opacity: prog(f, 2, 10) }}>{sc.sub}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 22, maxWidth: 1700 }}>
            {items.map((it, i) => {
              const on = f >= T(lit[i]); const p = prog(f, T(lit[i]), 8); const ap = prog(f, i * 3, 8);
              if (it === "→") return <div key={i} style={{ fontFamily: SANS, fontSize: 56, color: on ? C.accent : "#c9c9cf", opacity: ap }}>→</div>;
              return (
                <div key={i} style={{ fontFamily: SANS, fontSize: items.length > 5 ? 50 : 58, fontWeight: 700, letterSpacing: "-0.02em", padding: "26px 44px", borderRadius: 999, opacity: (0.4 + 0.6 * p) * ap,
                  background: on ? C.accent : dark ? "rgba(255,255,255,0.08)" : "#fff", color: on ? "#fff" : dark ? "rgba(255,255,255,0.6)" : C.ink2, transform: `translateY(${(1 - ap) * 30}px) scale(${1 + 0.12 * Math.sin(Math.PI * p)})`, boxShadow: on ? `0 18px 40px rgba(${C.rgb},0.35)` : "0 8px 24px rgba(0,0,0,0.05)" }}>{it}</div>
              );
            })}
          </div>
        </AbsoluteFill>
      );
      break;
    }
    case "compare": {
      const rows = sc.rows || [];
      const [colA, colB] = M.comparar || ["Por tu cuenta", "Con nosotros"];
      const cell: React.CSSProperties = { padding: "26px 34px", fontFamily: SANS, fontSize: 38 };
      body = (
        <AbsoluteFill style={{ ...center, paddingBottom: 90 }}>
          <div style={{ width: 1600, borderRadius: 30, overflow: "hidden", background: "#fff", boxShadow: "0 25px 70px rgba(0,0,0,0.1)", opacity: prog(f, 0, 8) }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.3fr", borderBottom: `1px solid ${C.line}` }}>
              <div style={cell} /><div style={{ ...cell, color: C.ink2, fontWeight: 600 }}>{colA}</div><div style={{ ...cell, color: C.accent, fontWeight: 700 }}>{colB}</div>
            </div>
            {rows.map(([a, b, c], i) => {
              const p = prog(f, T(0.08 + i * 0.22), 8); const st = clamp((f - T(0.08 + i * 0.22) - 6) / 8);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.3fr", borderBottom: i < rows.length - 1 ? `1px solid ${C.line}` : "none", opacity: p, transform: `translateX(${(1 - p) * 50}px)` }}>
                  <div style={{ ...cell, fontWeight: 700, color: C.ink }}>{a}</div>
                  <div style={{ ...cell, color: C.ink2, position: "relative" }}>{b}<div style={{ position: "absolute", left: 30, top: "50%", height: 3, background: C.red, width: `${st * 70}%` }} /></div>
                  <div style={{ ...cell, color: C.ink, fontWeight: 700, background: `rgba(${C.rgb},${0.08 * st})` }}>{c}</div>
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      );
      break;
    }
    case "vids": {
      const items = (sc.items || []) as string[];
      body = (
        <AbsoluteFill style={{ ...center, paddingBottom: 90 }}>
          {sc.label && <div style={{ fontFamily: SANS, fontSize: 28, fontWeight: 600, color: dark ? "rgba(255,255,255,0.7)" : C.ink2, marginBottom: 26 }}>{sc.label}</div>}
          <div style={{ display: "flex", gap: 40 }}>
            {items.map((v, i) => {
              const p = prog(f, i * 6, 10);
              return <div key={v} style={{ width: items.length > 1 ? 800 : 1300, height: items.length > 1 ? 560 : 730, borderRadius: 28, overflow: "hidden", background: "#fff", boxShadow: "0 25px 70px rgba(0,0,0,0.12)", opacity: p, transform: `translateY(${(1 - p) * 60}px) rotate(${(i ? 1 : -1) * 1.5 * p}deg)` }}>
                <OffthreadVideo src={staticFile(v)} muted style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              </div>;
            })}
          </div>
        </AbsoluteFill>
      );
      break;
    }
    case "cta": {
      const p = prog(f, 0, 12); const pulse = 1 + 0.04 * Math.sin(f / 5);
      const bob = Math.sin(f / 6) * 16;
      body = (
        <AbsoluteFill style={center}>
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 100, letterSpacing: "-0.03em", color: "#fff", background: C.accent, padding: "46px 100px", borderRadius: 999, boxShadow: `0 30px ${90 + 30 * Math.sin(f / 5)}px rgba(${C.rgb},0.6)`, opacity: p, transform: `scale(${pop(p) * pulse})` }}>{sc.show}</div>
          <svg width="96" height="96" viewBox="0 0 24 24" style={{ marginTop: 50, transform: `translateY(${bob}px)`, opacity: prog(f, T(0.15), 10) }}><path d="M12 4v15M5 12l7 7 7-7" fill="none" stroke={dark ? "#fff" : C.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          {sc.sub && <div style={{ marginTop: 30, fontFamily: SANS, fontSize: 44, fontWeight: 600, color: dark ? "rgba(255,255,255,0.88)" : C.ink, opacity: prog(f, T(0.4), 10) }}>{sc.sub}</div>}
        </AbsoluteFill>
      );
      break;
    }
  }

  // transición de entrada (alterna dirección) + empuje de cámara continuo
  const ent = prog(f, 0, 7); const dir = idx % 2 ? 1 : -1;
  const push = 1 + 0.035 * clamp(f / (lenOf(sc) * FPS));
  const fadeOut = sc.end ? 1 - clamp((f - (lenOf(sc) * FPS - 20)) / 20) : 1;
  return (
    <AbsoluteFill style={{ opacity: fadeOut }}>
      <Bg kind={sc.bg} f={f} g={g} />
      <AbsoluteFill style={{ opacity: ent, transform: `translateX(${(1 - ent) * dir * 90}px) scale(${(1 + (1 - ent) * 0.06) * push})`, filter: `blur(${(1 - ent) * 10}px)` }}>{body}</AbsoluteFill>
      {part > 0 && <RoadMap n={part} dark={dark} />}
      {proofTypes.includes(sc.type) && <Caption sc={sc} f={f} dark={dark} />}
      {(sc.type === "section" || sc.type === "reveal") && <AbsoluteFill style={{ background: "#fff", opacity: 0.5 * (1 - clamp(f / 6)) }} />}
    </AbsoluteFill>
  );
};

const useFonts = () => {
  const [h] = React.useState(() => delayRender("fuentes"));
  React.useEffect(() => {
    const fs = [["Medium", 500], ["SemiBold", 600], ["Bold", 700], ["Black", 900], ["Bold", 800]] as const;
    Promise.all(fs.map(([n, w]) => new FontFace("Geist", `url(${staticFile(`fonts/Geist-${n}.woff2`)})`, { weight: String(w) }).load().then((ff) => document.fonts.add(ff))))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};

// ---------- efectos de sonido ----------
type Fx = { at: number; f: string; v: number };
const sfxFor = (sc: Scene, i: number): Fx[] => {
  const fr = (s: number) => Math.round(s * FPS); const out: Fx[] = [];
  const T = (x: number) => LEAD + sc.speechEnd * x;
  if (sc.type !== "section") out.push({ at: 0, f: i % 2 ? "whoosh_corto" : "whoosh", v: 0.22 });
  hlTimes(sc).forEach((t) => out.push({ at: fr(t + 0.1), f: "pop", v: 0.22 }));
  mockBeats(sc).forEach((t) => out.push({ at: fr(t), f: sc.mock === "notifs" ? "pop" : "click", v: sc.mock === "notifs" ? 0.2 : 0.3 }));
  if (sc.type === "section") out.push({ at: 0, f: "boom", v: 0.5 }, { at: 0, f: "impacto", v: 0.3 });
  if (sc.type === "reveal") out.push({ at: 0, f: "boom", v: 0.6 }, { at: 0, f: "impacto", v: 0.45 }, { at: fr(T(0.12)), f: "campana", v: 0.2 });
  if (sc.type === "type") for (let k = 0; k < 9; k++) out.push({ at: fr(T(k / 9)), f: "click", v: 0.18 });
  if (sc.type === "chips") (sc.lit || []).forEach((l, k) => { if ((sc.items as string[])[k] !== "→") out.push({ at: fr(T(l)), f: "pop", v: 0.22 }); });
  if (sc.type === "stats") (sc.items || []).forEach((_, k) => out.push({ at: fr(T(k * 0.3)), f: "caja", v: 0.25 }));
  if (sc.type === "logos") (sc.items || []).forEach((_, k) => out.push({ at: 4 + k * 4, f: "click", v: 0.12 }));
  if (sc.type === "cards") (sc.items || []).forEach((_, k) => out.push({ at: fr(T(0.25 + k * 0.18)), f: "whoosh_corto", v: 0.18 }));
  if (sc.type === "compare") (sc.rows || []).forEach((_, k) => out.push({ at: fr(T(0.08 + k * 0.22)), f: "click", v: 0.25 }));
  if (sc.type === "result") out.push({ at: fr(T(0.15)) + 8, f: "whoosh_corto", v: 0.2 }, { at: fr(T(0.4)), f: "impacto", v: 0.45 });
  if (sc.timer) out.push({ at: fr(T(0.6)), f: "campana", v: 0.3 });
  if (sc.type === "shot" && sc.cam && sc.cam.join() !== "0,0,1,1") out.push({ at: fr(T(0.08)), f: "whoosh", v: 0.14 });
  if (sc.type === "cta") out.push({ at: 0, f: "impacto", v: 0.4 }, { at: 4, f: "campana", v: 0.3 });
  return out;
};

// Música: presente debajo de la voz, se corta justo antes de la revelación y vuelve fuerte con ella.
const REVEAL = S.findIndex((s) => s.type === "reveal");
const CTA0 = S.findIndex((s) => s.b === "cta" || s.type === "cta");
const musicVol = (fr: number) => {
  if (REVEAL >= 0) {
    const r = starts[REVEAL];
    if (fr > r - 16 && fr < r) return 0.04;
    if (fr >= r && fr < r + 12) return 0.6;
  }
  if (CTA0 >= 0 && fr >= starts[CTA0]) return 0.5;
  return 0.42 * Math.min(1, fr / 20);
};

export const Vsl: React.FC = () => {
  useFonts();
  let part = 0; const parts = S.map((s) => { if (s.type === "section") part = parseInt(s.n || "0", 10); return part; });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {S.map((sc, i) => (
        <Sequence key={i} from={starts[i]} durationInFrames={starts[i + 1] - starts[i]}>
          <SceneView sc={sc} idx={i} part={parts[i]} g0={starts[i]} />
          <Sequence from={Math.round(LEAD * FPS)}><Audio src={staticFile(sc.audio)} /></Sequence>
          {sfxFor(sc, i).map((x, k) => (
            <Sequence key={"fx" + k} from={x.at} durationInFrames={45}><Audio src={staticFile(`audio/sfx/${x.f}.wav`)} volume={x.v} /></Sequence>
          ))}
        </Sequence>
      ))}
      {DATA.musica && <Audio src={staticFile(DATA.musica)} volume={musicVol} />}
    </AbsoluteFill>
  );
};
