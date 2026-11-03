#!/bin/bash
# Crea un proyecto de VSL nuevo a partir del motor de esta skill.
# Uso: bash nuevo.sh <carpeta_del_proyecto> [carpeta_del_motor_de_video]
#   Si existe el motor de video de Mente AI (por defecto ~/videos_pizarra), reusa su Remotion, sus efectos y su música.
#   Si no, instala Remotion con npm y usa los efectos y la música que vienen con la skill.
set -euo pipefail
SKILL="$(cd "$(dirname "$0")/.." && pwd)"
DEST="${1:?falta la carpeta del proyecto}"
MOTOR="${2:-${MENTE_VIDEO_DIR:-$HOME/videos_pizarra}}"
[ -e "$DEST/plan.json" ] && { echo "Ya hay un proyecto en $DEST (no piso nada)." >&2; exit 1; }
mkdir -p "$DEST"
cp -R "$SKILL/motor/." "$DEST/"
mkdir -p "$DEST/public/img" "$DEST/public/logos" "$DEST/public/vid" "$DEST/public/audio/vo" "$DEST/public/audio/sfx" "$DEST/public/audio/musica" "$DEST/out"
[ -f "$DEST/plan.json" ] || cp "$SKILL/references/plan_ejemplo.json" "$DEST/plan.json"
echo '{"marca":{"nombre":""},"escenas":[],"musica":null}' > "$DEST/src/timeline.json"
if [ -d "$MOTOR/motion/public/audio/sfx" ]; then
  cp "$MOTOR/motion/public/audio/sfx/"*.wav "$DEST/public/audio/sfx/"
  cp "$MOTOR/motion/public/audio/gen/"ad_beat_0*.mp3 "$DEST/public/audio/musica/" 2>/dev/null || true
elif ! ls "$DEST/public/audio/sfx/"*.wav >/dev/null 2>&1; then
  echo "Aviso: no hay efectos de sonido ni música (el video sale sin ellos)." >&2
fi
if [ -d "$MOTOR/motion/node_modules/remotion" ]; then
  ln -s "$MOTOR/motion/node_modules" "$DEST/node_modules" 2>/dev/null || cp -R "$MOTOR/motion/node_modules" "$DEST/node_modules"
else
  echo "Instalando Remotion (una sola vez, unos minutos)…"
  (cd "$DEST" && npm install --no-audit --no-fund --loglevel=error)
fi
echo "Proyecto listo en $DEST"
