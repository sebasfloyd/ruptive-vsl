---
name: vsl
description: Crea una VSL (video de ventas de 3 a 6 minutos) sin que nadie se grabe. Escribe el guion con la estructura de Hormozi (filtro, promesa, dolor, prueba, mecanismo, objeciones y un solo llamado), lo pasa a escenas, genera la voz con ElevenLabs (puede ser la voz clonada de la persona) y renderiza un video 16:9 con tipografía animada sincronizada a la voz, maquetas del dolor, capturas reales con zoom, números, logos, música y efectos de sonido. Usar cuando digan "armame una VSL", "un video de ventas para la landing", "un video que explique la oferta sin grabarme", "VSL para vender X". Para editar un video donde una persona habla a cámara, usar /video-pizarra.
argument-hint: "[qué se vende] [duración] [a dónde lleva el botón]"
---

# VSL · video de ventas sin grabar

Sale de la VSL de Ruptive "Tu empresa con IA" (noviembre 2026): 4:49, 60 escenas, voz clonada del dueño y nada filmado. El guion vende; el motor solo lo pone en pantalla. Primero el guion, después el video.

| Archivo | Cuándo |
|---|---|
| `references/guion.md` | **Leer siempre** antes de escribir: estructura, pesos de cada parte y la revisión final. |
| `references/plan.md` | **Leer siempre** antes de armar `plan.json`: marca, campos y los 15 tipos de escena. |
| `references/plan_ejemplo.json` | Un plan corto de ejemplo, completo. |
| `motor/` | El proyecto de Remotion que renderiza (se copia a cada VSL nueva). |

## 0. Comandos según dónde corrés

- **En la app de Mente AI** solo existe el comando `mente-video`. Las acciones de VSL son:
  `mente-video vsl-nuevo <nombre>` · `vsl-sumar <nombre> <archivo> [img|logos|vid]` · `vsl-voz <nombre> [--revisar]` · `vsl-cuadro <nombre> <frame> <salida.png>` · `vsl-render <nombre> <salida>` · `vsl-estado <nombre> <salida>`.
  El proyecto queda en `<motor de video>/vsl/<nombre>/` (la carpeta que dice `MENTE_VIDEO_DIR`). Si `mente-video` no existe, pedile a la persona que active **Edición de video** en Integraciones; mientras tanto, entregá el guion.
- **En Claude Code directo** (lo normal): `bash .claude/skills/vsl/scripts/nuevo.sh <carpeta>`, y adentro de la carpeta `node voz.mjs [--revisar]`, `bash render.sh --cuadro <frame> <salida.png>` y `bash render.sh <salida>` (este último en segundo plano: tarda más que el límite de un comando). Necesita Node 18 o más y ffmpeg; la primera vez `nuevo.sh` instala Remotion con npm. La clave de ElevenLabs va en un `.env` en la carpeta del proyecto o en la de arriba.

## 1. Juntar el material (de archivos reales, no de memoria)

Si la carpeta es una Mente AI, el material está en las rutas de abajo. Si no, buscá en la carpeta lo equivalente (catálogo, casos, preguntas frecuentes, marca) y pedile a la persona lo que falte: qué vende, a quién, 3 a 5 dolores reales de sus clientes, sus números y casos comprobables, sus objeciones más comunes y su logo y colores.

- **Qué se vende y a quién**: `03_SERVICIOS/catalogo.md`, `06_NEGOCIO/`. Precio solo si está escrito ahí.
- **Prueba**: `06_NEGOCIO/casos_de_exito.md`, números y logos de clientes, capturas reales de lo que se entrega. Anotá de qué archivo sale cada dato.
- **Dolor y dudas**: `06_NEGOCIO/objeciones_comunes.md`, `07_PROCESOS/faqs.md`, reuniones en las carpetas de clientes.
- **Voz y marca**: `01_VOZ/`, `02_MARCA/` (tono, colores, logo).
- **Destino del botón**: la página o el calendario al que lleva el llamado.

Preguntá solo lo que no esté: qué se vende, a quién, a dónde lleva el botón y qué voz usar. Si dicen "hacelo", decidí vos y aclaralo en una línea.

## 2. El guion

Escribilo siguiendo `references/guion.md`, directo como escenas (una o dos frases por escena, 45 a 65 escenas para 4 a 5 minutos). Guardalo legible en `08_CONTENIDO/borradores/vsl_<tema>_AAAA-MM-DD.md` (o en la carpeta del proyecto si no es una Mente) con la fuente de cada dato al lado. No hace falta esperar el OK del guion si pidieron el video: el guion queda escrito y se corrige sobre el video.

## 3. El proyecto y los archivos

1. `vsl-nuevo <nombre>` (o `nuevo.sh`). Nombre corto: `vsl_<producto>`.
2. Sumá las imágenes reales con `vsl-sumar` (logo en `img`, logos de clientes en `logos`, capturas en `img`, videos en `vid`). Si la persona las arrastró al chat, usá esa ruta.
3. Escribí `plan.json` en la carpeta del proyecto según `references/plan.md`. Marca: colores y logo de `02_MARCA/`. Textos de las maquetas del dolor: del rubro de la persona, no los de ejemplo.
4. `vsl-voz <nombre> --revisar` valida el plan y los archivos sin gastar voz. Corregí hasta que diga "Plan OK".

## 4. La voz (ElevenLabs)

- Hace falta una clave de ElevenLabs. Si no la tiene, guiala: crear cuenta en elevenlabs.io, Perfil → API Keys → crear una. Una VSL de 5 minutos usa unos 4.500 caracteres. La cuenta gratis sirve para probar, pero **no permite uso comercial**: para publicar la VSL hace falta un plan pago (el más barato, Starter, ya incluye licencia comercial y clonar **su propia voz** con 1 a 3 minutos de audio limpio).
- Guardá la clave en `<motor>/vsl/.env` como `ELEVENLABS_API_KEY=...` (sirve para todas las VSL). **Nunca** dentro de una carpeta que se comparte o se sube a GitHub.
- El id de la voz va en `plan.json` → `voz` (ElevenLabs → Voices → la voz → copiar ID).
- `vsl-voz <nombre>` genera la voz escena por escena (solo regenera las que cambiaron), mide las imágenes y arma la música. Al final dice la duración. La primera vez tarda unos minutos: corrélo con el tiempo máximo del comando (10 minutos).

## 5. Revisar y renderizar

1. Antes del render, sacá 6 a 8 cuadros con `vsl-cuadro` (uno de cada tipo de escena; el frame de cada escena está en `cuadros.txt` del proyecto). Miralos: texto que se corta, logos que no se ven, capturas ilegibles. Corregí y repetí.
2. `vsl-render <nombre> <nombre>_v1` arranca el render en segundo plano: tarda entre 20 y 45 minutos para 5 minutos de video. Avisale a la persona y consultá con `vsl-estado <nombre> <nombre>_v1` (no lo consultes en un bucle: si sigue en marcha, decí cuánto va y que te pregunte en un rato). Queda en `out/<nombre>_v1.mp4`, con el audio a -15 LUFS.
3. Cada cambio sale como versión nueva (`_v2`, `_v3`): nunca pises la anterior.
4. En `08_CONTENIDO/` dejá un `.md` con el guion final, la ruta del video y de dónde salió cada dato.

## 6. Reglas

- **Solo prueba real.** Ningún número, cliente, logo, testimonio o captura que la persona no haya dado o que no esté en sus archivos. Si falta prueba, la VSL es más corta, no inventada.
- **Nada de caras ni escenas generadas por IA.** Fotos y capturas reales o nada.
- **No promete lo que depende del cliente.** "Te acompañamos mientras lo implementan", no "vas a duplicar tus ventas".
- **Nunca se publica sin el OK de la persona.** El video se entrega para revisar; subirlo a la web o a redes lo decide ella.
- Vos no escuchás el audio: pedile a la persona que lo escuche entero. Si una palabra suena rara (siglas, nombres en inglés, "video" a la española), reescribila y corré `vsl-voz` de nuevo: solo regenera esa escena.
