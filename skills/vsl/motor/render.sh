#!/bin/bash
# Renderiza la VSL y deja el audio a -15 LUFS (volumen de redes y web).
# Uso: bash render.sh <nombre_salida>       → out/<nombre_salida>.mp4
#      bash render.sh --cuadro <frame> <salida.png>   → un cuadro suelto para revisar
set -euo pipefail
cd "$(dirname "$0")"
[ -f src/timeline.json ] || { echo "Falta src/timeline.json: corré primero node voz.mjs" >&2; exit 1; }
if [ "${1:-}" = "--cuadro" ]; then
  mkdir -p out
  npx remotion still src/index.ts vsl "${3:?falta la salida .png}" --frame="${2:?falta el frame}" > out/_cuadro.log 2>&1 || { tail -15 out/_cuadro.log >&2; exit 1; }
  echo "Cuadro: $3"
  exit 0
fi
NOMBRE="${1:?falta el nombre de salida}"
[[ "$NOMBRE" =~ ^[A-Za-z0-9_-]{1,80}$ ]] || { echo "Nombre inválido (letras, números, - y _)" >&2; exit 1; }
mkdir -p out
echo "Renderizando: una VSL de 5 minutos tarda entre 20 y 45 minutos según la compu…"
npx remotion render src/index.ts vsl "out/_${NOMBRE}_crudo.mp4" > out/_render.log 2>&1 || { tail -20 out/_render.log >&2; echo "El render falló (log completo en out/_render.log)." >&2; exit 1; }
ffmpeg -y -v error -i "out/_${NOMBRE}_crudo.mp4" -c:v copy -af "loudnorm=I=-15:TP=-1.5:LRA=11" -c:a aac -b:a 192k "out/${NOMBRE}.mp4"
rm -f "out/_${NOMBRE}_crudo.mp4"
echo "Listo: $(pwd)/out/${NOMBRE}.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "out/${NOMBRE}.mp4" | cut -d. -f1) s)"
