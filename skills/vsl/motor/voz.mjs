// Genera la locución escena por escena con ElevenLabs (con tiempos por letra), mide las imágenes,
// arma la cama de música y escribe src/timeline.json para el motor.
// Uso: node voz.mjs            (cachea por texto: solo regenera las escenas que cambiaron)
//      node voz.mjs --revisar  (solo valida el plan y los archivos, sin gastar voz)
// La clave: variable ELEVENLABS_API_KEY, o un archivo .env en esta carpeta o en la de arriba, o la ruta en ELEVENLABS_ENV.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const leerEnv = (ruta) => {
  try {
    for (const l of fs.readFileSync(ruta, 'utf8').split('\n')) {
      const t = l.trim(); if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('='); if (i < 0) continue;
      const k = t.slice(0, i).trim(); const v = t.slice(i + 1).replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '');
      if (!(k in process.env)) process.env[k] = v;
    }
  } catch {}
};
if (process.env.ELEVENLABS_ENV) leerEnv(process.env.ELEVENLABS_ENV);
leerEnv('.env');
leerEnv('../.env'); // una clave para todas las VSL (<motor>/vsl/.env)

const plan = JSON.parse(fs.readFileSync('plan.json', 'utf8'));
const S = plan.escenas || plan.scenes;
if (!plan.marca?.nombre) throw new Error('plan.json: falta marca.nombre');
if (!Array.isArray(S) || !S.length) throw new Error('plan.json: faltan escenas');

// ---- validación: que cada archivo que usa el plan exista y que cada escena tenga lo suyo ----
const TIPOS = ['text', 'pain', 'type', 'section', 'reveal', 'shot', 'photo', 'stats', 'logos', 'result', 'cards', 'chips', 'compare', 'vids', 'cta'];
const faltan = [];
const archivo = (p, donde) => { if (p && !fs.existsSync(path.join('public', p))) faltan.push(`${donde}: no existe public/${p}`); };
archivo(plan.marca.logo, 'marca.logo');
S.forEach((s, i) => {
  const d = `escena ${i}`;
  if (!TIPOS.includes(s.type)) faltan.push(`${d}: tipo "${s.type}" desconocido`);
  if (!s.vo?.trim()) faltan.push(`${d}: falta vo (lo que se dice)`);
  if (/\bv[ií]deos?\b/i.test(s.vo || '')) console.warn(`Aviso, ${d}: ElevenLabs suele decir "vídeo" a la española; si la voz es rioplatense, cambiá la palabra.`);
  if (['shot', 'photo'].includes(s.type)) { if (!s.src) faltan.push(`${d}: falta src`); else archivo(s.src, d); }
  if (s.type === 'logos' || s.type === 'vids') (s.items || []).forEach((p) => archivo(p, d));
  if (s.type === 'cards') (s.items || []).forEach(([p]) => archivo(p, d));
  if (s.type === 'section' && !s.n) faltan.push(`${d}: falta n (número de parte)`);
  if (s.type === 'result' && (!s.from || !s.to)) faltan.push(`${d}: faltan from/to`);
  if (s.type === 'compare' && !s.rows?.length) faltan.push(`${d}: faltan rows`);
  if (s.type === 'cta' && !s.show) faltan.push(`${d}: falta show (texto del botón)`);
});
if (faltan.length) { console.error('El plan tiene problemas:\n- ' + faltan.join('\n- ')); process.exit(1); }
const chars = S.reduce((a, s) => a + s.vo.length, 0);
console.log(`Plan OK: ${S.length} escenas, ${chars} caracteres de voz.`);
if (process.argv.includes('--revisar')) process.exit(0);

const KEY = process.env.ELEVENLABS_API_KEY;
const VOZ = plan.voz;
if (!VOZ) throw new Error('plan.json: falta voz (id de la voz de ElevenLabs).');
const MODELO = plan.modelo || 'eleven_multilingual_v2';
const AJUSTES = { stability: 0.5, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true, ...(plan.ajustesVoz || {}) };

const dur = (p) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).toString());
const dims = (p) => { const [w, h] = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', p]).toString().trim().split('x').map(Number); return [w, h]; };

fs.mkdirSync('public/audio/vo', { recursive: true });
const out = [];
for (let i = 0; i < S.length; i++) {
  const s = S[i];
  const h = crypto.createHash('md5').update(s.vo + VOZ + (MODELO === 'eleven_multilingual_v2' ? '' : MODELO)).digest('hex').slice(0, 10);
  const mp3 = `public/audio/vo/${String(i).padStart(2, '0')}_${h}.mp3`, js = mp3.replace('.mp3', '.json');
  if (!fs.existsSync(js)) {
    if (!KEY) throw new Error('Falta ELEVENLABS_API_KEY (variable, .env en esta carpeta o ELEVENLABS_ENV).');
    for (let t = 0; ; t++) {
      const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ}/with-timestamps?output_format=mp3_44100_128`, {
        method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: s.vo, model_id: MODELO, previous_text: S[i - 1]?.vo, next_text: S[i + 1]?.vo, voice_settings: AJUSTES }) });
      if (r.ok) { const j = await r.json(); fs.writeFileSync(mp3, Buffer.from(j.audio_base64, 'base64')); fs.writeFileSync(js, JSON.stringify(j.alignment)); break; }
      const txt = await r.text();
      if (r.status === 401 || r.status === 402 || r.status === 403 || t > 2) throw new Error(`ElevenLabs, escena ${i}: ${r.status} ${txt.slice(0, 300)}`);
      await new Promise((ok) => setTimeout(ok, 3000));
    }
    console.log('voz', i, s.vo.slice(0, 60));
  }
  const al = JSON.parse(fs.readFileSync(js, 'utf8'));
  const words = []; let cur = '', st = null;
  al.characters.forEach((c, k) => { if (/\s/.test(c)) { if (cur) words.push({ w: cur, t: st }); cur = ''; st = null; } else { if (st === null) st = al.character_start_times_seconds[k]; cur += c; } });
  if (cur) words.push({ w: cur, t: st });
  const extra = s.type === 'shot' && s.src ? { dims: dims(path.join('public', s.src)) } : {};
  out.push({ ...s, ...extra, audio: mp3.replace('public/', ''), dur: dur(mp3), speechEnd: al.character_end_times_seconds.at(-1), words });
}

// Largo total, igual que el motor (Vsl.tsx): 0,08 s de entrada + voz + 0,24 s + hold, redondeado a cuadros de 30 fps.
const FPS = 30;
const total = (out.reduce((a, s) => a + Math.round((0.08 + s.speechEnd + 0.24 + (s.hold || 0)) * FPS), 0) + 10) / FPS;

// Cama de música: alterna las pistas de public/audio/musica hasta cubrir el largo, con fundido al final.
let musica = null;
const dirM = 'public/audio/musica';
const pistas = plan.marca.musica === false || !fs.existsSync(dirM) ? [] : fs.readdirSync(dirM).filter((f) => /\.(mp3|wav|m4a)$/i.test(f)).sort();
if (pistas.length) {
  const lista = []; let acc = 0, k = 0;
  while (acc < total + 2) { const p = path.join(dirM, pistas[k % pistas.length]); lista.push(p); acc += dur(p); k++; }
  const txt = 'public/audio/_lista_musica.txt';
  fs.writeFileSync(txt, lista.map((p) => `file '${path.resolve(p).replace(/'/g, "'\\''")}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', txt, '-af', `atrim=0:${total.toFixed(2)},afade=t=in:d=0.8,afade=t=out:st=${(total - 2.5).toFixed(2)}:d=2.5`, '-ar', '44100', '-b:a', '192k', 'public/audio/bed.mp3']);
  fs.rmSync(txt);
  musica = 'audio/bed.mp3';
}

fs.writeFileSync('src/timeline.json', JSON.stringify({ marca: plan.marca, escenas: out, musica }));
// cuadros.txt: el frame del medio de cada escena, para revisar con render.sh --cuadro
{ let a = 0; const filas = out.map((s, i) => { const n = Math.round((0.08 + s.speechEnd + 0.24 + (s.hold || 0)) * FPS); const fila = `${i}\t${s.type}${s.mock ? '/' + s.mock : ''}\t${a + Math.round(n * 0.7)}\t${(s.show || s.vo).slice(0, 50)}`; a += n; return fila; });
  fs.writeFileSync('cuadros.txt', 'escena\ttipo\tframe\ttexto\n' + filas.join('\n') + '\n'); }
const m = Math.floor(total / 60), sg = Math.round(total % 60);
console.log(`Listo: ${out.length} escenas, ${m}:${String(sg).padStart(2, '0')} de duración${musica ? ', con música' : ', sin música'}.`);
