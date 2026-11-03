# El guion de una VSL que vende

Una VSL (video de ventas) es una charla de venta grabada: la mira alguien que todavía no habló con vos y al final tiene que querer dar un solo paso. Esta estructura es la de Alex Hormozi, adaptada y probada en la VSL de Ruptive "Tu empresa con IA" (4:49, 60 escenas).

## Las partes y cuánto pesan

| Parte | Peso | Qué hace |
|---|---|---|
| 1. Intro | 15 a 20 % | En los primeros 30 segundos, quien mira decide si se queda. |
| 2. Lo único | 25 a 30 % | Qué es la oferta y por qué funciona distinto. |
| 3. Dudas | 35 a 40 % | Las objeciones reales, una por una. |
| 4. Llamado | 10 % | Un solo paso. |

## 1. Intro: las 5 P

1. **Para quién (filtro)**: la primera frase dice a quién le sirve. "Si tenés una empresa de dos a cincuenta personas, esto es para vos." El que no es, se va, y está bien.
2. **Promesa**: el resultado concreto y el plazo. "Cómo responder todas las consultas en menos de cinco minutos." Nada que no se pueda cumplir.
3. **Dolor**: 3 a 5 situaciones que la persona reconoce de su semana, cada una con su maqueta (`pain`). Situaciones, no adjetivos: "una propuesta que tarda días en salir" en vez de "procesos ineficientes".
4. **Prueba**: quién sos y por qué creerte. Números, logos y casos **reales**, sacados de los archivos de la Mente. Si no hay, se dice menos: nunca se inventa.
5. **Plan (mapa)**: "Te voy a contar cuatro cosas: qué es, cómo funciona, tus dudas y cómo empezar." Son las 4 `partes` del mapa de arriba.

## 2. Lo único

- Empezá por lo que la persona cree que necesita y mostrá por qué no alcanza ("probaste ChatGPT, pero cada uno lo usa a su manera").
- Mostrá el mecanismo funcionando: una captura real (`shot`) con el tiempo que tardó (`timer`), un antes y después (`result`).
- Recién ahí, la **revelación** del nombre de la oferta (`reveal`). Una sola vez.
- Explicá cómo se trabaja en 3 o 4 pasos (`chips`) y qué se lleva la persona.

## 3. Dudas

Cada objeción tiene 4 golpes, en este orden:

1. **Lo que piensan**: dicho con sus palabras. "No tengo tiempo para esto."
2. **Por qué no es así**: una frase.
3. **Lo que sí es**: cómo funciona en realidad.
4. **La prueba**: un dato, una captura o un caso.

Sacá las objeciones de `06_NEGOCIO/objeciones_comunes.md`, `07_PROCESOS/faqs.md` y de las reuniones reales. Las de siempre: precio, tiempo, "ya lo probé", "mi negocio es distinto", "mi equipo no es técnico", "¿y si no funciona?". Una tabla `compare` sirve para cerrar esta parte.

## 4. Llamado

- **Un solo paso**: "Tocá el botón de acá abajo y elegí un horario." Nada de "seguinos, escribinos o compralo".
- Qué pasa después de tocar el botón (es gratis, cuánto dura, qué se llevan).
- La última escena repite el paso en corto y cierra con la marca (`end: true`).

## Cómo escribir para la voz

- Frases cortas, de hablar. Una idea por escena.
- Números en letras ("noventa días"), siglas como se dicen ("pe de efe" no: escribí "un PDF" y escuchá cómo suena).
- Evitá palabras que la voz pronuncia raro. Con voces rioplatenses en ElevenLabs, "video" sale "vídeo" a la española: decí "esto", "lo que estás viendo" o "la charla".
- Tuteo o voseo según `02_MARCA/tono.md`. Sin "¿Sabías que…?", sin "En este video te voy a contar".
- Nada de promesas que dependen del cliente ("vas a duplicar tus ventas"). Prometé lo que hacés vos ("te acompañamos mientras lo implementan").

## Revisión antes de generar la voz

- [ ] La primera frase filtra a quién le sirve.
- [ ] Cada número, logo y caso está en un archivo de la Mente (anotá de cuál).
- [ ] Hay una sola revelación y un solo llamado.
- [ ] Cada objeción tiene sus 4 golpes.
- [ ] Leído en voz alta dura entre 4 y 6 minutos (unas 2,5 palabras por segundo).
