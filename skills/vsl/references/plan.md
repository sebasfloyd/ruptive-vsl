# plan.json: la VSL escena por escena

El motor arma todo a partir de `plan.json`. Cada escena dura lo que tarda la voz en decir su `vo`, más un respiro corto. No hay tiempos a mano.

```json
{
  "nombre": "vsl_mi_producto",
  "voz": "<id de la voz de ElevenLabs>",
  "modelo": "eleven_multilingual_v2",
  "marca": {
    "nombre": "Mi Marca",
    "color": "#f56300",
    "color2": "#ff8a3d",
    "logo": "img/logo.png",
    "producto": "Nombre de la [oferta]",
    "partes": ["Qué es", "Cómo funciona", "Tus dudas", "Cómo empezar"],
    "logosTitulo": "Empresas que trabajaron con nosotros",
    "comparar": ["Por tu cuenta", "Con nosotros"]
  },
  "escenas": [ { "b": "intro", "type": "text", "bg": "dark", "vo": "...", "show": "..." } ]
}
```

## La marca

| Campo | Para qué |
|---|---|
| `nombre` | Aparece al final, al lado del logo. Obligatorio. |
| `color`, `color2` | El color del marcador, los botones y el brillo. `color2` es una versión más clara para fondos oscuros. Sacalos de `02_MARCA/`. |
| `logo` | Ruta dentro de `public/`. Es mejor un PNG que se vea sobre negro: logo claro o isotipo con brillo. Si el logo es oscuro, no lo pongas: un logo negro sobre negro no se ve. |
| `producto` | El nombre de la oferta en la revelación. La parte `[entre corchetes]` va en color. |
| `partes` | Las 4 etapas del mapa de arriba (una por cada escena `section`). |
| `logosTitulo` | El título de la escena de logos. |
| `comparar` | Los encabezados de las dos columnas de la escena `compare`. |
| `musica` | Ponelo en `false` si no querés música. |

## Cada escena

| Campo | Para qué |
|---|---|
| `b` | Bloque: `intro`, `metodo`, `dudas` o `cta`. La música sube desde el primer `cta`. |
| `type` | El tipo de escena (tabla de abajo). |
| `bg` | Fondo: `dark` (negro con grilla), `light` (gris claro con puntos) o `glow` (negro con brillo del color de la marca, para la revelación y el llamado a la acción). |
| `vo` | Lo que dice la voz. Una o dos frases. **Escribí los números en letras** ("diecisiete mil", "noventa días") para que los lea bien. |
| `show` | El texto en pantalla, más corto que `vo`. `[entre corchetes]` va con marcador de color, `_entre guiones bajos_` va en itálica serif. Si falta, se muestra `vo`. |
| `sub` | Una línea chica debajo (en `text`, `reveal`, `chips`, `cta`). |
| `hold` | Segundos extra de silencio al final (por ejemplo `2` en la última escena). |
| `end` | `true` en la última escena: muestra logo y nombre de la marca y funde a negro. |

## Tipos

| `type` | Qué muestra | Campos propios |
|---|---|---|
| `text` | Frase grande que entra palabra por palabra con la voz. Es la más usada. | `show`, `sub`, `end` |
| `type` | Frase en itálica que se escribe letra por letra ("Seguro te pasa esto…"). | `show` |
| `pain` | Una maqueta animada del dolor + la frase debajo. | `mock` y sus textos (abajo) |
| `section` | Número gigante de la parte (1 a 4) con flash y golpe. Mueve el mapa de arriba. | `n`, `show` |
| `reveal` | La revelación del nombre de la oferta: anillo, logo y nombre. La música se corta justo antes. Una sola por VSL. | `show` (si falta, `marca.producto`), `sub` |
| `shot` | Una captura de pantalla real con zoom de cámara a una zona. | `src`, `cam` [x1,y1,x2,y2 de 0 a 1; [0,0,1,1] = completa], `timer` (insignia con tiempo, por ejemplo "2 min 18 s") |
| `photo` | Foto real a la izquierda y nombre · rol a la derecha. | `src`, `label` ("Nombre · rol") |
| `stats` | Hasta 3 números que cuentan hacia arriba. | `items` [["+17.000", "personas formadas"], …] |
| `logos` | Grilla de logos de clientes, en color sobre mosaicos oscuros. Usar con `bg: dark`. | `items` ["logos/a.png", …], `label` |
| `result` | Antes tachado → después grande. | `from`, `to`, `label` |
| `cards` | Hasta 3 imágenes verticales en abanico. | `items` [["img/a.webp", "texto"], …] |
| `chips` | Píldoras que se encienden cuando la voz las nombra. `→` sirve de flecha. | `items`, `lit` (fracción de la escena en que se enciende cada una, de 0 a 1), `sub`, `orb` (logo arriba) |
| `compare` | Tabla de 3 columnas: tema · por tu cuenta (tachado) · con la oferta. | `rows` [["Tema", "sin la oferta", "con la oferta"], …] |
| `vids` | 1 o 2 videos reales en marco, sin sonido. | `items` ["vid/a.mp4"], `label` |
| `cta` | Botón grande que late, flecha y dirección web. | `show` (texto del botón), `sub` (la web) |

### Maquetas de `pain` (`mock`)

| `mock` | Qué es | Textos |
|---|---|---|
| `days` | Un documento en "Borrador" y un contador de días que avanza. | `label` (nombre del archivo), `sub` (arriba del nombre) |
| `chats` | Un chat de cliente con 3 mensajes sin respuesta y la etiqueta "Sin responder". | `label` (nombre del contacto), `items` [["lun 10:14", "mensaje"], …] |
| `notifs` | 9 notificaciones que se apilan (Mail, WhatsApp, Planilla, Instagram, Slack, Teléfono). | `items` [["WhatsApp", "¿Me pasás el precio?"], …] |
| `chaos` | 3 chats distintos de IA, cada persona pide otra cosa. | `items` [["Ana", "pedido"], …] |
| `repeat` | El mismo "te explico mi negocio" repetido tres días. | `items` ["Lunes", "Martes", "Miércoles"], `label` (la frase que se repite) |

Si no ponés textos, quedan unos de ejemplo genéricos. Siempre conviene cambiarlos por los del rubro de la persona.

## Ritmo que funciona

- 45 a 65 escenas para 4 a 5 minutos. Una idea por escena.
- Cada 3 o 4 escenas de `text`, una que muestre algo: `pain`, `shot`, `stats`, `chips`, `compare`.
- `show` de 2 a 8 palabras, con una sola parte entre corchetes (la que tiene que quedar).
- Las escenas de prueba (`shot`, `stats`, `logos`, `result`, `cards`, `chips`, `compare`, `vids`, `photo`) muestran el subtítulo de la voz abajo.
