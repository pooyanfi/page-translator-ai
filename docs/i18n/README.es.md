<img src="../../icons/icon-128.png" width="88" align="right" alt="Icono de AI Page Translator">

# AI Page Translator — traduce la web con tu propia IA

**Traduce cualquier página web a tu idioma con el proveedor de IA que elijas: sin servidor intermediario, sin cuenta, sin rastreo y sin factura por palabra.**

`Manifest V3` · `Sin compilación` · `JavaScript puro` · `versión 1.3.1` · `22 idiomas`

Este archivo es la traducción al español del [README canónico en inglés](README.md). Si hay alguna discrepancia, prevalece el texto inglés.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · **Español** · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator es una extensión de navegador para **Brave** y otros navegadores basados en Chromium. Tú aportas el proveedor: una clave gratuita de Google Gemini, cualquier API compatible con OpenAI (OpenRouter, Groq, NVIDIA, OpenAI…), o un modelo totalmente local con **Ollama**. La extensión traduce la página que estás leyendo en el mismo sitio, conservando su diseño, sus enlaces y su formato.

Ningún texto pasa por un servicio de traducción intermediario. Tu clave de API nunca sale del navegador, no hay analítica y, con Ollama, el texto ni siquiera sale de tu equipo.

> **Estado:** versión 1.3.1 · 95 pruebas automatizadas · una verificación de 12 puntos · sin telemetría y sin código remoto.

---

## ¿Por qué otro traductor?

La mayoría de los traductores de páginas envían una frase cada vez. De ahí que el resultado parezca una pila de frases y no una página: se pierde el contexto, la terminología cambia, los enlaces parten las frases por la mitad y el idioma de destino hereda el orden de palabras del idioma de origen.

Esta extensión traduce **bloques**, no nodos de texto:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

El bloque se envía como una sola unidad, con el marcado en línea sustituido por tokens numerados:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` marca el contenido en línea que pertenece a la frase (un enlace, un énfasis, un span); `<vN/>` marca el contenido que nunca debe traducirse (código, imágenes, controles de formulario, widgets). El modelo puede mover los tokens, así que construye una frase natural **alrededor** del enlace en lugar de quedar atado al orden del inglés.

A la vuelta, la respuesta se valida antes de tocar la página. Cada token debe estar presente, equilibrado y ser único; una traducción que pierde un enlace se rechaza, se reintenta una vez con una instrucción más estricta y, si no, se deja intacta. Se reutilizan los nodos originales, así que `href`, los escuchadores de eventos y el marcado anidado sobreviven. «Mostrar original» restaura exactamente los nodos originales.

## Funciones

- **Traducción integral en el mismo sitio** — títulos, párrafos, listas, tablas, pies de foto y botones.
- **Enlaces y formato en línea preservados** — con validación de tokens; un enlace perdido jamás se aplica en silencio.
- **Estilo natural o literal** — *Natural* (predeterminado) reescribe como lo haría un redactor nativo; *Literal* se mantiene cerca del texto original en páginas técnicas.
- **Guías de estilo por idioma** — instrucciones específicas para persa, árabe, urdu y hebreo, más una guía general para los otros 18 idiomas.
- **Corrección tipográfica determinista** — la `ی`/`ک` persa, los espacios finos de `می`/`ها`/`تر` y los signos `، ؛ ؟` se corrigen aunque el modelo falle.
- **Revisión de calidad opcional** — lee cada segmento como par {original, traducción}, así que corrige el significado, no solo la redacción.
- **Glosario** — pares término → traducción que el modelo debe respetar.
- **Contenido protegido** — `<pre>`, `<code>`, URL, correos, `translate="no"`, `contenteditable`, SVG, controles de formulario y la propia interfaz de la extensión nunca se envían.
- **Etiquetas de atributos** — `alt`, `title`, `placeholder` y `aria-label` viajan por un canal aparte y con tono de etiqueta, no de párrafo.
- **Páginas dinámicas** — el contenido nuevo del desplazamiento infinito o de una SPA se traduce en cuanto aparece, sin bucles de observador.
- **Derecha a izquierda bien resuelto** — `dir` en cada bloque traducido, `lang` en `<html>`, sin voltear la página entera; todo se restaura.
- **Memoria por sitio** — recuerda el idioma de destino de cada dominio y puede traducir automáticamente al cargar.
- **Cualquier API** — Gemini, Ollama y cualquier endpoint compatible con OpenAI, llamados desde el service worker, sin problemas de CORS.
- **Caché en memoria, reintentos y división** — un texto idéntico se envía una vez; el lote que falla se divide en vez de tumbar la página; los 429/5xx se reintentan con espera creciente.
- **Sin compilación** — scripts clásicos, cargados tal cual.

## Idiomas disponibles

Veintidós idiomas de destino, cada uno con su nombre nativo en el prompt, para que el modelo no confunda `zh-TW` con `zh-CN` ni el persa con el árabe:

| Idioma | Nombre nativo | Dirección |
|---|---|---|
| Inglés | English | izquierda a derecha |
| Persa | فارسی | derecha a izquierda |
| Árabe | العربية | derecha a izquierda |
| Hebreo | עברית | derecha a izquierda |
| Urdu | اردو | derecha a izquierda |
| Español | Español | izquierda a derecha |
| Francés | Français | izquierda a derecha |
| Alemán | Deutsch | izquierda a derecha |
| Chino simplificado | 中文简体 | izquierda a derecha |
| Chino tradicional | 中文繁體 | izquierda a derecha |
| Ruso | Русский | izquierda a derecha |
| Turco | Türkçe | izquierda a derecha |
| Italiano | Italiano | izquierda a derecha |
| Portugués | Português | izquierda a derecha |
| Neerlandés | Nederlands | izquierda a derecha |
| Polaco | Polski | izquierda a derecha |
| Vietnamita | Tiếng Việt | izquierda a derecha |
| Tailandés | ไทย | izquierda a derecha |
| Hindi | हिन्दी | izquierda a derecha |
| Indonesio | Bahasa Indonesia | izquierda a derecha |
| Japonés | 日本語 | izquierda a derecha |
| Coreano | 한국어 | izquierda a derecha |

Los idiomas de derecha a izquierda (persa, árabe, hebreo y urdu) reciben la dirección bloque a bloque; el resto de la página conserva su geometría.

## Instalación

1. Descarga este repositorio (**Code → Download ZIP** o `git clone`) y conserva la carpeta.
2. Abre `brave://extensions` (o `chrome://extensions`).
3. Activa el **modo de desarrollador**.
4. Pulsa **Load unpacked** y elige esta carpeta (la que contiene `manifest.json`).
5. Fija la extensión si quieres el panel a un clic.

No hay compilación, instalación ni empaquetado. La extensión solo lee los archivos indicados en `manifest.json`; `tests/`, `scripts/`, `bench/`, `docs/` y `.github/` son solo para desarrollo y nunca se cargan.

Requiere un navegador Chromium actual. Las shadow roots cerradas se traducen cuando el navegador expone la API (Chromium 119+); el resto funciona en versiones anteriores.

## Compartir la extensión

`npm run release` construye el paquete y deja los archivos en `release/` (carpeta ignorada por git):

| Archivo | Qué es | Cómo se instala |
|---|---|---|
| `page-translator-ai-<version>.zip` | la extensión completa, unos 95 KB, con `INSTALL.txt` dentro | descomprimir → **Load unpacked**; es el mismo archivo que acepta una tienda |
| `page-translator-ai-<version>.crx` | paquete firmado | arrastrarlo a `brave://extensions`, donde se permiten instalaciones fuera de la tienda |
| `page-translator-ai-signing-key.pem` | clave de firma | no la compartas nunca; `npm run release` la reutiliza para que el ID de la extensión no cambie entre actualizaciones |

Así que lo que entregas es un solo archivo, y contiene los pasos de instalación.

**Limitación honesta:** una extensión de navegador es código del lado del cliente. Cualquiera que la instale puede leer esos archivos: un `.crx` es un zip firmado y una extensión sin empaquetar es una carpeta normal. Ningún empaquetado ni ofuscación cambia eso; la minificación solo frena al lector y las políticas de las tiendas prohíben la ofuscación. Si el código debe seguir siendo secreto, la única opción real es mover los prompts y las llamadas al proveedor a un servidor que controles, lo que renuncia al diseño de «tu clave, sin backend».

Para distribuir sin entregar el repositorio, publica el zip como elemento **privado o no listado** en Chrome Web Store; es la única vía de instalación en un clic para un usuario no técnico.

## Configurar un proveedor

Panel de la extensión → **Options & settings**, o `brave://extensions` → Detalles → Opciones de la extensión.

| Proveedor | Endpoint | Clave | Notas |
|---|---|---|---|
| **Ollama** (local) | `http://localhost:11434` | ninguna | Gratis y totalmente privado. Instálalo desde [ollama.com](https://ollama.com) y ejecuta `ollama run llama3`. Si devuelve 403, reinícialo con `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | clave gratuita de [AI Studio](https://aistudio.google.com/app/apikey) | Usa un ID de modelo actual, por ejemplo `gemini-2.5-flash`. Los límites gratuitos cambian; consulta la lista de modelos de Google. |
| **Compatible con OpenAI** | tu endpoint, p. ej. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | clave del proveedor | Cualquier servicio que hable `/chat/completions`. Los modelos sugeridos en la interfaz son ejemplos: usa el ID exacto del catálogo del proveedor. |

Después:

1. Elige el **idioma de destino predeterminado**.
2. Elige un **estilo de traducción**: *Natural* (recomendado) o *Literal*.
3. Si quieres, activa el **modo de calidad** y añade entradas al **glosario**, una por línea (`término → traducción`; también funcionan `->`, `=>`, `=` y TAB).
4. Deja el **idioma de origen** en *Auto-detect* o elígelo explícitamente.
5. Pulsa **Test connection** y luego **Save settings**.

Notas sobre los proveedores:

- **El ajuste de razonamiento de Gemini se elige según la generación del modelo.** 2.5 Flash y Flash-Lite funcionan sin razonamiento, 2.5 Pro usa su presupuesto mínimo (128) y 3.x/4.x un nivel bajo. Si un modelo rechaza el ajuste, la petición se reintenta una vez sin él.
- **Ollama** se llama con una ventana de contexto de 8192 tokens; un modelo entrenado con menos seguirá truncando páginas largas, por eso la página se divide en unidades pequeñas.
- **Los planes gratuitos** limitan el ritmo. La extensión espera y reintenta; nunca descarta texto en silencio.

## Uso

- Pulsa el icono → elige un idioma → **Translate this page**.
- **Show original / Show translation** en cualquier momento; la restauración no pierde nada.
- Pasa el cursor por un párrafo traducido para ver el texto original.
- Clic derecho → **Translate this page** o **Translate selection**.
- Teclado: `Ctrl+Shift+Y` (`Cmd+Shift+Y` en macOS) alterna la traducción; se puede cambiar en la página de atajos del navegador.
- Con **Auto-translate** activo y una preferencia de sitio guardada, las páginas correspondientes se traducen al cargar.
- Los ajustes se aplican a las pestañas ya abiertas en la siguiente traducción; no hace falta recargar.

## Cómo funciona

```
DOM de la página
  └─ content script: recoge unidades de bloque y serializa el marcado en línea como tokens <tN>/<vN/>
       └─ divisor: 24 unidades o 2400 caracteres por petición
            └─ service worker: petición a tu proveedor (origen de la extensión, sin CORS)
                 └─ proveedor: JSON de entrada, JSON de salida, IDs conservados
                      └─ validación: tokens completos, equilibrados y únicos; IDs coincidentes
                           └─ DOM: reutiliza los nodos originales y escribe solo el texto
                                └─ MutationObserver: traduce el contenido añadido después
```

Decisiones que importan:

- **El tráfico al proveedor nunca sale del contexto de la página.** El content script envía un mensaje `AIPT_FETCH`; el service worker hace la petición, así que los endpoints con CORS estricto funcionan tal cual. El service worker también comprueba `sender.id`, de modo que solo esta extensión puede usarlo como proxy.
- **El prompt es un contrato, no un deseo.** IDs de entrada, IDs de salida; una entrada por segmento; etiquetas intocables; números, URL, código y placeholders tal cual; sin explicaciones añadidas. Las respuestas se leen por ID, así que una matriz reordenada o parcialmente malformada falla de forma segura en vez de desalinear traducciones.
- **Cada idioma tiene su guía de estilo.** La guía persa, por ejemplo, exige el orden de palabras y los verbos persas (`بررسی کنید`, no `بررسی را انجام دهید`), prohíbe `می‌باشد`/`بایستی`/`گردید` donde basta una frase normal, solo conserva en alfabeto latino los préstamos reales y corrige puntuación y espacios finos. Los ejemplos few-shot muestran el objetivo al modelo en lugar de describirlo.
- **La dirección es local.** Los bloques en persa, árabe, hebreo y urdu reciben `dir="rtl"`, `<html>` recibe el idioma de destino y el resto de la página conserva su geometría: un volteo global rompía los diseños centrados y los bloques de código. Ambos se restauran con el texto original.
- **Los fallos son visibles y acotados.** El lote ilegible se divide; la unidad que sigue fallando se queda en su idioma y se informa en el aviso superior. Cancelar a mitad de traducción se detiene limpiamente y no deja un DOM a medio escribir.

Más detalles: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Privacidad y permisos

| Permiso | Por qué se necesita |
|---|---|
| `storage` | Guardar ajustes, clave de API, glosario y preferencias por sitio en `chrome.storage.local`. |
| `contextMenus` | Opción de clic derecho «Traducir esta página / la selección». |
| `tabs` | Enviar mensajes a la pestaña activa y abrir Opciones. |
| `activeTab` | Actuar sobre la página que traduces explícitamente. |
| `<all_urls>` | Inyectar el content script en las páginas que visitas y permitir que el service worker llame al endpoint configurado. |

- La clave de API se guarda solo en el almacenamiento local de este navegador y se envía solo al proveedor que elijas.
- Sin analítica, sin telemetría, sin código remoto, sin llamadas a casa y sin cuenta.
- Todo el texto se escribe con `textContent` / `createTextNode`; no hay `innerHTML`, `eval` ni `new Function` en ninguna parte. La salida del modelo solo puede llegar a la página como texto, y los atributos se limitan a una lista blanca fija: `href`, `src` y los manejadores de eventos nunca se escriben desde la salida del modelo.
- Las preferencias por sitio las escribe un único escritor serializado en el service worker, así que dos pestañas no pueden pisarse.
- La detección automática de idioma envía como máximo una muestra de 600 caracteres al mismo proveedor; si eliges el idioma de origen a mano, esa petición desaparece.

Política de seguridad y cómo informar de una vulnerabilidad: [`SECURITY.md`](../../SECURITY.md).

## Limitaciones conocidas

- **La validación de tokens es estricta por diseño.** Un modelo que estropee `<tN>` de forma sistemática dejará esos párrafos en el idioma original (y lo dirá) antes que perder un enlace. Usa un modelo que respete la salida estructurada; *Test connection* prueba una frase con tokens.
- **La calidad depende del modelo.** Los modelos locales pequeños son usables pero menos fluidos que Gemini o los modelos de clase GPT; la capa de estilo ayuda, no añade conocimiento.
- **Las shadow roots cerradas y los iframes cross-origin** quedan fuera del alcance de la extensión (seguridad del navegador). Las shadow roots abiertas y los marcos del mismo origen sí se cubren.
- **Los contenedores mixtos con texto suelto** (`<div>texto<p>…</p></div>`) vuelven a la traducción nodo a nodo para ese texto; las páginas bien formadas nunca llegan a ese caso.
- **La caché está en memoria** (por sesión de pestaña). Recargar una página vuelve a pedir su texto.
- **Los PDF no se traducen**; el visor de PDF integrado no es programable por extensiones.
- **Los planes gratuitos cambian.** Los límites de ritmo y los nombres de modelo los controla el proveedor, no esta extensión.

## Estado del proyecto y pruebas

Versión 1.3.1. La suite automatizada cubre la capa DOM, el prompt y el análisis, la forma de las peticiones a proveedores, el comportamiento del motor y la interfaz de opciones — **95 pruebas** — y `npm run verify` añade una verificación de 12 puntos: sintaxis, suite de pruebas, prohibición de sumideros HTML, fugas de clave, scripts de contenido clásicos, paridad de versiones, cobertura del CHANGELOG y empaquetado.

```bash
npm install       # solo desarrollo: jsdom para las pruebas de DOM
npm test          # 95 pruebas
npm run bench     # banco de segmentación, sin clave de API
npm run verify    # sintaxis + pruebas + controles de política + empaquetado
npm run package   # copia solo los archivos distribuibles a dist/
npm run release   # dist + release/*.zip, *.crx, *.pem para distribuir
```

El banco mide segmentación, no calidad de traducción: en las cuatro páginas de ejemplo, un colector independiente por nodos de texto produce **108 fragmentos** donde el colector por bloques produce **63 unidades** (1,7 veces menos en total, **2,5 veces** en el artículo de noticias), y los fragmentos de menos de 25 caracteres bajan de **81 a 34**. La calidad de la traducción sigue dependiendo del modelo que conectes: la lista manual de [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) cubre lo que las pruebas automáticas no alcanzan (render RTL, tooltips, tráfico real de SPA y errores del proveedor).

La CI ejecuta `npm run verify` y `npm run bench` en Node 20 y 22 en cada push y pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Estructura del proyecto

```
manifest.json                 Manifest V3: permisos, content scripts, atajo
background/
  service-worker.js           menús, atajo, enrutado de mensajes, keep-alive
  fetch-utils.js              proxy fetch del proveedor: URL/cabeceras, tiempo límite, tipos de error
  site-prefs.js               lectura-modificación-escritura serializada por sitio
content/
  languages.js                22 idiomas, valores predeterminados, nombres visibles
  providers.js                prompts, guías de estilo, análisis JSON, normalización, Gemini/OpenAI/Ollama
  translation-engine.js       caché, división, concurrencia, reintentos, bisección, revisión de calidad
  dom-processor.js            unidades de bloque, tokens, aplicación validada, restauración exacta, dirección
  content-script.js           orquestación, estado, mensajería, traducción automática
  styles.css                  las dos reglas que RTL realmente necesita
popup/                        selector de idioma, traducir/restaurar, progreso, errores
options/                      proveedor, clave, modelo, estilo, calidad, glosario, preferencias por sitio
icons/                        iconos de 16/48/128 px
docs/i18n/                    traducciones de este README, un archivo por idioma
tests/  scripts/  bench/      solo desarrollo — la extensión nunca los carga
```

## Contribuir

Las issues y los pull requests son bienvenidos. Antes de enviar un cambio, ejecuta `npm run verify`; mantén la extensión sin compilación, mantén el tráfico al proveedor en el service worker y no introduzcas nunca `innerHTML`. Si cambias el prompt, añade o actualiza una prueba: prompt, analizador y normalizador se prueban juntos porque solo funcionan como conjunto.

Lee [`CONTRIBUTING.md`](../../CONTRIBUTING.md) para las reglas completas, la política de traducción de `docs/i18n/` y las convenciones de commit.

## Licencia

MIT — consulta [`LICENSE`](../../LICENSE). Los servicios de terceros que conectes (Gemini, OpenRouter, Ollama…) tienen sus propias condiciones y precios.
