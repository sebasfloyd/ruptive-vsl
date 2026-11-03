# VSL sin grabarte · una skill gratis de Ruptive

Una skill para Claude Code que arma un **video de ventas (VSL) de 3 a 6 minutos sin que nadie se grabe**. Le contás qué vendés y a quién; Claude escribe el guion, lo narra con una voz de ElevenLabs (puede ser la tuya, clonada) y renderiza un video 16:9 con tipografía animada al ritmo de la voz, maquetas del problema, capturas con zoom, números, logos, música y efectos de sonido.

Es el mismo sistema con el que hicimos la VSL de [Tu empresa con IA](https://www.ruptiveai.com/empresa-con-ia): 4:49, 60 escenas y ni un minuto de cámara.

## Qué hace

1. **Guion que vende**: estructura de Alex Hormozi (a quién le sirve, promesa, dolor, prueba, cómo funciona, objeciones y un solo llamado a la acción). Solo con datos reales que le des: no inventa números ni clientes.
2. **Escenas**: lo pasa a un `plan.json` con 15 tipos de escena (frases animadas, maquetas de mensajes que se acumulan o chats sin responder, capturas con zoom, contadores, logos, antes y después, tabla comparativa, botón final).
3. **Voz**: ElevenLabs escena por escena, con el tiempo de cada palabra para que el texto entre justo cuando se dice.
4. **Video**: Remotion, con música que se corta antes de la revelación y efectos en cada golpe. Audio final a -15 LUFS.

## Instalar

Necesitás [Claude Code](https://claude.com/claude-code), Node 18 o más, ffmpeg (`brew install ffmpeg` en Mac) y una cuenta de [ElevenLabs](https://elevenlabs.io).

```bash
git clone <este repo> ruptive-vsl
mkdir -p ~/.claude/skills && cp -R ruptive-vsl/skills/vsl ~/.claude/skills/
```

Después, en Claude Code: **"Armame una VSL de 4 minutos para vender [tu producto]. El botón lleva a [tu página]."**

La clave de ElevenLabs va en un archivo `.env` (`ELEVENLABS_API_KEY=...`) que Claude te ayuda a crear. Nunca la subas a GitHub.

## Bueno saber

- **Costo**: una VSL de 5 minutos usa unos 4.500 caracteres de ElevenLabs. La cuenta gratis sirve para probar, pero **no permite uso comercial**: para publicar el video necesitás un plan pago (el más barato ya incluye licencia comercial y clonar tu voz).
- **Remotion** es gratis para personas y empresas de hasta 3 personas; las más grandes necesitan [su licencia](https://www.remotion.dev/license).
- **Render**: entre 20 y 45 minutos para 5 minutos de video, según la compu.
- La música y los efectos de sonido los generamos en Ruptive y podés usarlos en tus videos. La tipografía es [Geist](https://vercel.com/font) (licencia SIL Open Font).

## ¿Y si querés que tu equipo haga esto con todo?

En Ruptive acompañamos a empresas de 2 a 50 personas a sumar IA a su trabajo, en 90 días y desde adentro. [Pedí tu demo gratis](https://www.ruptiveai.com/empresa-con-ia).

---

Hecho por [Ruptive](https://www.ruptiveai.com) · Seba Chuffer
