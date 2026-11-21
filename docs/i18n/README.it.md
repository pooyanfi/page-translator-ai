<img src="../../icons/icon-128.png" width="88" align="right" alt="Icona di AI Page Translator">

# AI Page Translator — traduci il web con la tua IA

**Traduci qualsiasi pagina web nella tua lingua con il provider di IA che scegli tu: senza backend, senza account, senza tracciamento e senza costi per parola.**

`Manifest V3` · `Nessuna compilazione` · `JavaScript puro` · `versione 1.3.1` · `22 lingue`

Questo file è la traduzione italiana del [README canonico in inglese](README.md). In caso di divergenza prevale il testo inglese.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · **Italiano** · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator è un'estensione per **Brave** e gli altri browser basati su Chromium. Il provider lo scegli tu: una chiave gratuita di Google Gemini, qualsiasi API compatibile con OpenAI (OpenRouter, Groq, NVIDIA, OpenAI…) oppure un modello completamente locale con **Ollama**. L'estensione traduce sul posto la pagina che stai leggendo, conservandone impaginazione, link e formattazione.

Nessun testo passa da un servizio di traduzione intermediario. La chiave API non lascia mai il browser, non c'è alcuna analitica e, con Ollama, il testo non esce nemmeno dal tuo computer.

> **Stato:** versione 1.3.1 · 95 test automatici · una verifica in 12 punti · nessuna telemetria, nessun codice remoto.

---

## Perché un altro traduttore?

La maggior parte dei traduttori di pagine invia una frase alla volta. Per questo il risultato sembra una pila di frasi e non una pagina: il contesto si perde, la terminologia cambia, i link spezzano le frasi a metà e la lingua di destinazione eredita l'ordine delle parole della lingua di partenza.

Questa estensione traduce **blocchi**, non nodi di testo:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Il blocco parte come un'unica unità, con il markup inline sostituito da token numerati:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` delimita il contenuto inline che appartiene alla frase (un link, un'enfasi, uno span); `<vN/>` delimita il contenuto che non va mai tradotto (codice, immagini, controlli di modulo, widget). Il modello può spostare i token, quindi costruisce una frase naturale **attorno** al link invece di restare vincolato all'ordine inglese.

Al ritorno, la risposta viene validata prima di toccare la pagina. Ogni token deve essere presente, bilanciato e univoco; una traduzione che perde un link viene rifiutata, ritentata una volta con un'istruzione più severa e altrimenti lasciata intatta. I nodi originali vengono riutilizzati, quindi `href`, i listener degli eventi e il markup annidato sopravvivono. «Mostra originale» ripristina esattamente i nodi di partenza.

## Funzioni

- **Traduzione dell'intera pagina sul posto** — titoli, paragrafi, elenchi, tabelle, didascalie, pulsanti.
- **Link e formattazione inline conservati** — con validazione dei token; un link perso non viene mai applicato in silenzio.
- **Stile naturale o letterale** — *Naturale* (predefinito) riscrive come farebbe un autore madrelingua; *Letterale* resta vicino al testo di partenza nelle pagine tecniche.
- **Linee guida di stile per lingua** — indicazioni dedicate a persiano, arabo, urdu ed ebraico, più una guida generale per le altre 18 lingue.
- **Correzione tipografica deterministica** — `ی`/`ک` persiane, spazi unificatori in `می`/`ها`/`تر` e i segni `، ؛ ؟` vengono corretti anche quando il modello sbaglia.
- **Passaggio di qualità opzionale** — rilegge ogni segmento come coppia {sorgente, traduzione} e corregge quindi il senso, non solo la formulazione.
- **Glossario** — coppie termine → traduzione che il modello deve rispettare.
- **Contenuti protetti** — `<pre>`, `<code>`, URL, email, `translate="no"`, `contenteditable`, SVG, controlli di modulo e l'interfaccia dell'estensione non vengono mai inviati.
- **Etichette degli attributi** — `alt`, `title`, `placeholder` e `aria-label` viaggiano su un canale separato, con tono da etichetta e non da paragrafo.
- **Pagine dinamiche** — il contenuto aggiunto da scroll infinito o da una SPA viene tradotto appena compare, senza cicli di osservazione.
- **Da destra a sinistra fatto bene** — `dir` su ogni blocco tradotto, `lang` su `<html>`, nessun ribaltamento dell'intera pagina; tutto viene ripristinato.
- **Memoria per sito** — ricorda la lingua di destinazione per dominio e può tradurre automaticamente al caricamento.
- **Qualsiasi API** — Gemini, Ollama e ogni endpoint compatibile con OpenAI, chiamati dal service worker, quindi senza problemi di CORS.
- **Cache in memoria, tentativi e suddivisione** — un testo identico viene inviato una volta; il blocco che fallisce viene diviso invece di far fallire la pagina; i 429/5xx vengono ritentati con attese crescenti.
- **Nessuna compilazione** — script classici, caricati così come sono.

## Lingue supportate

Ventidue lingue di destinazione, ciascuna con il proprio nome nativo nel prompt, così il modello non confonde `zh-TW` con `zh-CN` né il persiano con l'arabo:

| Lingua | Nome nativo | Direzione |
|---|---|---|
| Inglese | English | da sinistra a destra |
| Persiano | فارسی | da destra a sinistra |
| Arabo | العربية | da destra a sinistra |
| Ebraico | עברית | da destra a sinistra |
| Urdu | اردو | da destra a sinistra |
| Spagnolo | Español | da sinistra a destra |
| Francese | Français | da sinistra a destra |
| Tedesco | Deutsch | da sinistra a destra |
| Cinese semplificato | 中文简体 | da sinistra a destra |
| Cinese tradizionale | 中文繁體 | da sinistra a destra |
| Russo | Русский | da sinistra a destra |
| Turco | Türkçe | da sinistra a destra |
| Italiano | Italiano | da sinistra a destra |
| Portoghese | Português | da sinistra a destra |
| Olandese | Nederlands | da sinistra a destra |
| Polacco | Polski | da sinistra a destra |
| Vietnamita | Tiếng Việt | da sinistra a destra |
| Thailandese | ไทย | da sinistra a destra |
| Hindi | हिन्दी | da sinistra a destra |
| Indonesiano | Bahasa Indonesia | da sinistra a destra |
| Giapponese | 日本語 | da sinistra a destra |
| Coreano | 한국어 | da sinistra a destra |

Le lingue da destra a sinistra (persiano, arabo, ebraico, urdu) ricevono la direzione blocco per blocco; il resto della pagina mantiene la sua geometria.

## Installazione

1. Scarica questo repository (**Code → Download ZIP** oppure `git clone`) e conserva la cartella.
2. Apri `brave://extensions` (o `chrome://extensions`).
3. Attiva la **modalità sviluppatore**.
4. Fai clic su **Load unpacked** e scegli questa cartella (quella che contiene `manifest.json`).
5. Fissa l'estensione se vuoi il popup a un clic.

Non esiste alcuna fase di compilazione, installazione o bundling. L'estensione legge solo i file elencati in `manifest.json`; `tests/`, `scripts/`, `bench/`, `docs/` e `.github/` servono solo allo sviluppo e non vengono mai caricati.

Serve un browser Chromium recente. Gli shadow root chiusi vengono tradotti dove il browser espone l'API (Chromium 119+); tutto il resto funziona anche nelle versioni precedenti.

## Condividere l'estensione

`npm run release` costruisce il pacchetto e produce i file in `release/` (cartella ignorata da git):

| File | Cos'è | Come si installa |
|---|---|---|
| `page-translator-ai-<version>.zip` | l'estensione completa, circa 95 KB, con `INSTALL.txt` dentro | scompattare → **Load unpacked**; è lo stesso file che accetta uno store |
| `page-translator-ai-<version>.crx` | pacchetto firmato | trascinarlo su `brave://extensions`, dove sono consentite installazioni fuori dallo store |
| `page-translator-ai-signing-key.pem` | chiave di firma | non condividerla mai; `npm run release` la riusa, così l'ID dell'estensione resta lo stesso tra gli aggiornamenti |

Quindi ciò che consegni è un solo file, e contiene le istruzioni di installazione.

**Limite onesto:** un'estensione per browser è codice lato client. Chi la installa può leggere quei file: un `.crx` è uno zip firmato e un'estensione non pacchettizzata è una cartella normale. Nessun pacchetto o offuscamento cambia questo fatto; la minificazione rallenta solo chi legge e le regole degli store vietano l'offuscamento. Se il codice deve restare segreto, l'unica opzione concreta è spostare prompt e chiamate al provider su un server che controlli tu, rinunciando al modello «la tua chiave, senza backend».

Per distribuire senza consegnare il repository, pubblica lo zip come elemento **privato o non elencato** nel Chrome Web Store; è l'unica via di installazione in un clic per un utente non tecnico.

## Configurare un provider

Popup dell'estensione → **Options & settings**, oppure `brave://extensions` → Dettagli → Opzioni estensione.

| Provider | Endpoint | Chiave | Note |
|---|---|---|---|
| **Ollama** (locale) | `http://localhost:11434` | nessuna | Gratuito e completamente privato. Installalo da [ollama.com](https://ollama.com), poi `ollama run llama3`. Se restituisce 403, riavvialo con `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | chiave gratuita da [AI Studio](https://aistudio.google.com/app/apikey) | Usa un ID di modello attuale, ad esempio `gemini-2.5-flash`. I limiti gratuiti cambiano: controlla l'elenco dei modelli di Google. |
| **Compatibile OpenAI** | il tuo endpoint, ad es. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | chiave del provider | Qualsiasi servizio che parli `/chat/completions`. I modelli suggeriti nell'interfaccia sono esempi: usa l'ID esatto del catalogo del provider. |

Poi:

1. Scegli la **lingua di destinazione predefinita**.
2. Scegli uno **stile di traduzione**: *Natural* (consigliato) o *Literal*.
3. Se vuoi, attiva **Quality mode** e aggiungi voci al **glossario**, una per riga (`termine → traduzione`; funzionano anche `->`, `=>`, `=` e TAB).
4. Lascia la **lingua di partenza** su *Auto-detect* o sceglila esplicitamente.
5. Fai clic su **Test connection**, poi su **Save settings**.

Note sui provider:

- **L'impostazione di ragionamento di Gemini dipende dalla generazione del modello.** 2.5 Flash e Flash-Lite girano senza ragionamento, 2.5 Pro usa il budget minimo (128), 3.x/4.x un livello basso. Se un modello rifiuta l'impostazione, la richiesta viene ritentata una volta senza.
- **Ollama** viene chiamato con una finestra di contesto di 8192 token; un modello addestrato su meno troncherà comunque le pagine lunghe, per questo la pagina viene divisa in unità piccole.
- **I piani gratuiti** limitano la frequenza. L'estensione attende e riprova; non scarta mai testo in silenzio.

## Uso

- Fai clic sull'icona → scegli una lingua → **Translate this page**.
- **Show original / Show translation** in qualsiasi momento; il ripristino è senza perdite.
- Passa il mouse su un paragrafo tradotto per vedere il testo originale.
- Clic destro → **Translate this page** o **Translate selection**.
- Tastiera: `Ctrl+Shift+Y` (`Cmd+Shift+Y` su macOS) attiva o disattiva la traduzione; è modificabile nella pagina delle scorciatoie del browser.
- Con **Auto-translate** attivo e una preferenza di sito salvata, le pagine corrispondenti vengono tradotte al caricamento.
- Le impostazioni si applicano alle schede già aperte alla traduzione successiva; non serve ricaricare.

## Come funziona

```
DOM della pagina
  └─ content script: raccoglie le unità a blocco, serializza il markup inline in token <tN>/<vN/>
       └─ suddivisore: 24 unità o 2400 caratteri per richiesta
            └─ service worker: richiesta al tuo provider (origine dell'estensione, senza CORS)
                 └─ provider: JSON in ingresso, JSON in uscita, ID conservati
                      └─ validazione: token completi, bilanciati e univoci; ID corrispondenti
                           └─ DOM: riusa i nodi originali, scrive solo il testo
                                └─ MutationObserver: traduce il contenuto aggiunto dopo
```

Scelte che contano davvero:

- **Il traffico verso il provider non parte mai dal contesto della pagina.** Il content script invia un messaggio `AIPT_FETCH`; il service worker esegue la richiesta, così gli endpoint con CORS severo funzionano invariati. Il service worker controlla anche `sender.id`: solo questa estensione può usarlo come proxy.
- **Il prompt è un contratto, non un desiderio.** ID in ingresso, ID in uscita; una voce per segmento; tag intoccabili; numeri, URL, codice e placeholder identici; nessuna spiegazione aggiunta. Le risposte vengono lette per ID, quindi un array riordinato o parzialmente malformato fallisce in sicurezza invece di disallineare le traduzioni.
- **Ogni lingua ha la sua linea guida.** Quella persiana, per esempio, richiede ordine delle parole e verbi persiani (`بررسی کنید`, non `بررسی را انجام دهید`), vieta `می‌باشد`/`بایستی`/`گردید` dove basta una frase normale, tiene in alfabeto latino solo i prestiti reali e corregge punteggiatura e spazi unificatori. Gli esempi few-shot mostrano l'obiettivo al modello invece di descriverlo.
- **La direzione resta locale.** I blocchi in persiano, arabo, ebraico e urdu ricevono `dir="rtl"`, `<html>` riceve la lingua di destinazione e il resto della pagina mantiene la sua geometria: un ribaltamento globale rompeva layout centrati e blocchi di codice. Entrambi vengono ripristinati con il testo originale.
- **Gli errori sono visibili e circoscritti.** Il blocco illeggibile viene diviso; l'unità che fallisce ancora resta nella lingua originale ed è segnalata nel banner. Annullare durante la traduzione si ferma in modo pulito e non lascia un DOM scritto a metà.

Altri dettagli: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Privacy e permessi

| Permesso | Perché serve |
|---|---|
| `storage` | Salvare impostazioni, chiave API, glossario e preferenze per sito in `chrome.storage.local`. |
| `contextMenus` | Voce del menu contestuale «Traduci questa pagina / la selezione». |
| `tabs` | Inviare messaggi alla scheda attiva e aprire le opzioni. |
| `activeTab` | Agire sulla pagina che traduci esplicitamente. |
| `<all_urls>` | Iniettare il content script nelle pagine visitate e consentire al service worker di chiamare l'endpoint configurato. |

- La chiave API è salvata solo nello spazio locale di questo browser e inviata solo al provider che hai scelto.
- Nessuna analitica, nessuna telemetria, nessun codice remoto, nessuna chiamata a casa, nessun account.
- Ogni testo è scritto con `textContent` / `createTextNode`; non esiste `innerHTML`, `eval` o `new Function` da nessuna parte. L'output del modello può raggiungere la pagina solo come testo e gli attributi sono limitati a una lista bianca fissa: `href`, `src` e i gestori di eventi non vengono mai scritti dall'output del modello.
- Le preferenze per sito passano da un unico scrittore serializzato nel service worker, così due schede non possono sovrascriversi.
- Il rilevamento automatico della lingua invia al massimo un campione di 600 caratteri allo stesso provider; scegliendo la lingua di partenza a mano, quella richiesta sparisce.

Politica di sicurezza e come segnalare una vulnerabilità: [`SECURITY.md`](../../SECURITY.md).

## Limiti noti

- **La validazione dei token è severa per scelta.** Un modello che rovina `<tN>` in modo sistematico lascerà quei paragrafi nella lingua originale (e lo dirà) invece di perdere un link. Usa un modello che rispetta l'output strutturato; *Test connection* prova una frase con token.
- **La qualità dipende dal modello.** I modelli locali piccoli sono usabili ma meno fluidi di Gemini o dei modelli di classe GPT; il livello di stile aiuta, non aggiunge conoscenza.
- **Shadow root chiusi e iframe cross-origin** sono fuori dalla portata dell'estensione (sicurezza del browser). Shadow root aperti e frame della stessa origine sono gestiti.
- **Contenitori misti con testo libero** (`<div>testo<p>…</p></div>`) tornano alla traduzione nodo per nodo per quel testo; le pagine ben formate non arrivano mai a questo caso.
- **La cache è in memoria** (per sessione di scheda). Ricaricando la pagina il testo viene richiesto di nuovo.
- **I PDF non vengono tradotti**; il visualizzatore PDF integrato non è programmabile dalle estensioni.
- **I piani gratuiti cambiano.** Limiti di frequenza e nomi dei modelli li decide il provider, non questa estensione.

## Stato del progetto e test

Versione 1.3.1. La suite automatica copre il livello DOM, prompt e analisi, la forma delle richieste ai provider, il comportamento del motore e l'interfaccia delle opzioni — **95 test** — e `npm run verify` aggiunge una verifica in 12 punti: sintassi, suite di test, divieto di sink HTML, controllo delle fughe di chiave, content script classici, parità di versione, copertura del CHANGELOG e pacchettizzazione.

```bash
npm install       # solo sviluppo: jsdom per i test DOM
npm test          # 95 test
npm run bench     # benchmark di segmentazione, senza chiave API
npm run verify    # sintassi + test + controlli di policy + pacchetto
npm run package   # copia solo i file distribuibili in dist/
npm run release   # dist + release/*.zip, *.crx, *.pem per la distribuzione
```

Il benchmark misura la segmentazione, non la qualità della traduzione: nelle quattro pagine di esempio un raccoglitore indipendente per nodi di testo produce **108 frammenti**, quello per blocchi **63 unità** (1,7 volte in meno in totale, **2,5 volte** sull'articolo di cronaca), e i frammenti sotto i 25 caratteri scendono da **81 a 34**. La qualità della traduzione dipende ancora dal modello collegato: la checklist manuale in [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) copre ciò che i test automatici non raggiungono (resa RTL, tooltip, traffico SPA reale, errori del provider).

La CI esegue `npm run verify` e `npm run bench` su Node 20 e 22 a ogni push e pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Struttura del progetto

```
manifest.json                 Manifest V3: permessi, content script, scorciatoia
background/
  service-worker.js           menu, scorciatoia, instradamento messaggi, keep-alive
  fetch-utils.js              proxy fetch del provider: URL/header, timeout, tipi di errore
  site-prefs.js               lettura-modifica-scrittura serializzata per sito
content/
  languages.js                22 lingue, valori predefiniti, nomi visualizzati
  providers.js                prompt, linee guida di stile, parsing JSON, normalizzazione, Gemini/OpenAI/Ollama
  translation-engine.js       cache, suddivisione, concorrenza, tentativi, bisezione, passaggio di qualità
  dom-processor.js            unità a blocco, token, applicazione validata, ripristino esatto, direzione
  content-script.js           orchestrazione, stato, messaggistica, traduzione automatica
  styles.css                  le due regole che servono davvero all'RTL
popup/                        scelta lingua, traduci/ripristina, avanzamento, errori
options/                      provider, chiave, modello, stile, qualità, glossario, preferenze per sito
icons/                        icone 16/48/128 px
docs/i18n/                    traduzioni di questo README, un file per lingua
tests/  scripts/  bench/      solo sviluppo — mai caricati dall'estensione
```

## Contribuire

Issue e pull request sono benvenute. Prima di inviare una modifica esegui `npm run verify`; mantieni l'estensione senza compilazione, lascia il traffico verso il provider nel service worker e non introdurre mai `innerHTML`. Se cambi il prompt, aggiungi o aggiorna un test: prompt, parser e normalizzatore vengono testati insieme perché funzionano solo come insieme.

Leggi [`CONTRIBUTING.md`](../../CONTRIBUTING.md) per le regole complete, la politica di traduzione di `docs/i18n/` e le convenzioni dei commit.

## Licenza

MIT — vedi [`LICENSE`](../../LICENSE). I servizi di terze parti che colleghi (Gemini, OpenRouter, Ollama…) hanno termini e prezzi propri.
