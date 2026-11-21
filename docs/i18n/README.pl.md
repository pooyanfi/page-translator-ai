<img src="../../icons/icon-128.png" width="88" align="right" alt="Ikona AI Page Translator">

# AI Page Translator — tłumacz sieć własną sztuczną inteligencją

**Przetłumacz dowolną stronę internetową na swój język z wybranym przez siebie dostawcą AI — bez backendu, bez konta, bez śledzenia i bez opłat za słowo.**

`Manifest V3` · `Bez etapu budowania` · `Czysty JavaScript` · `wersja 1.3.1` · `22 języki`

Ten plik jest polskim tłumaczeniem [kanonicznego README w języku angielskim](README.md). W razie rozbieżności obowiązuje tekst angielski.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · **Polski** · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator to rozszerzenie przeglądarki dla **Brave** i innych przeglądarek opartych na Chromium. Dostawcę wybierasz sam: darmowy klucz Google Gemini, dowolne API zgodne z OpenAI (OpenRouter, Groq, NVIDIA, OpenAI…) albo całkowicie lokalny model przez **Ollama**. Rozszerzenie tłumaczy czytaną stronę na miejscu, zachowując układ, linki i formatowanie.

Żaden tekst nie przechodzi przez pośredniczący serwis tłumaczeniowy. Klucz API nie opuszcza przeglądarki, nie ma żadnej analityki, a z Ollamą tekst nie wychodzi nawet z twojego komputera.

> **Stan:** wersja 1.3.1 · 95 testów automatycznych · kontrola w 12 punktach · bez telemetrii i bez zdalnego kodu.

---

## Dlaczego kolejny tłumacz?

Większość tłumaczy stron wysyła jedno zdanie naraz. Dlatego wynik wygląda jak stos zdań, a nie strona: ginie kontekst, terminologia się rozjeżdża, linki przecinają zdania w połowie, a język docelowy dziedziczy szyk wyrazów języka źródłowego.

To rozszerzenie tłumaczy **bloki**, a nie węzły tekstu:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Blok idzie jako jedna całość, a znaczniki inline zastępują numerowane tokeny:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` oznacza treść inline należącą do zdania (link, wyróżnienie, span), a `<vN/>` treść, której nigdy nie wolno tłumaczyć (kod, obrazy, kontrolki formularzy, widżety). Model może przestawiać tokeny, więc buduje naturalne zdanie **wokół** linku, zamiast tkwić w angielskim szyku.

W drodze powrotnej odpowiedź jest sprawdzana, zanim cokolwiek dotknie strony. Każdy token musi być obecny, zbalansowany i unikalny; tłumaczenie, które gubi link, jest odrzucane, ponawiane raz z ostrzejszym poleceniem, a potem zostawiane bez zmian. Oryginalne węzły są ponownie używane, więc `href`, nasłuchiwacze zdarzeń i zagnieżdżone znaczniki przetrwają. „Pokaż oryginał” przywraca dokładnie pierwotne węzły.

## Funkcje

- **Tłumaczenie całej strony na miejscu** — nagłówki, akapity, listy, tabele, podpisy i przyciski.
- **Linki i formatowanie inline zachowane** — z walidacją tokenów; zgubiony link nigdy nie zostanie zastosowany po cichu.
- **Styl naturalny lub dosłowny** — *Naturalny* (domyślny) przepisuje jak rodzimy autor; *Dosłowny* trzyma się tekstu źródła na stronach technicznych.
- **Przewodniki stylu dla języków** — osobne wskazówki dla perskiego, arabskiego, urdu i hebrajskiego oraz ogólny dla pozostałych 18 języków.
- **Deterministyczna korekta typografii** — perskie `ی`/`ک`, spacje nierozdzielające w `می`/`ها`/`تر` oraz znaki `، ؛ ؟` są poprawiane nawet wtedy, gdy model się pomyli.
- **Opcjonalny przebieg jakości** — czyta każdy segment jako parę {źródło, tłumaczenie}, więc poprawia sens, a nie tylko sformułowanie.
- **Słownik** — pary termin → tłumaczenie, których model musi przestrzegać.
- **Treść chroniona** — `<pre>`, `<code>`, adresy URL, e-maile, `translate="no"`, `contenteditable`, SVG, kontrolki formularzy i interfejs rozszerzenia nigdy nie są wysyłane.
- **Etykiety atrybutów** — `alt`, `title`, `placeholder` i `aria-label` idą osobnym kanałem i brzmią jak etykiety, nie jak akapity.
- **Strony dynamiczne** — nowa treść z nieskończonego przewijania lub SPA jest tłumaczona, gdy się pojawi, bez pętli obserwatora.
- **Od prawej do lewej porządnie** — `dir` na każdym przetłumaczonym bloku, `lang` na `<html>`, bez odwracania całej strony; wszystko jest przywracane.
- **Pamięć dla witryny** — zapamiętuje język docelowy dla domeny i może tłumaczyć automatycznie przy wczytaniu.
- **Dowolne API** — Gemini, Ollama i każdy punkt końcowy zgodny z OpenAI, wywoływane z service workera, więc bez problemów z CORS.
- **Pamięć podręczna, ponawianie i dzielenie** — identyczny tekst idzie raz; błędny blok jest dzielony zamiast wywalać stronę; błędy 429/5xx są ponawiane z rosnącym opóźnieniem.
- **Bez etapu budowania** — zwykłe skrypty klasyczne, ładowane bez zmian.

## Obsługiwane języki

Dwadzieścia dwa języki docelowe, każdy z nazwą rodzimą w promcie, żeby model nie mylił `zh-TW` z `zh-CN` ani perskiego z arabskim:

| Język | Nazwa rodzima | Kierunek |
|---|---|---|
| Angielski | English | od lewej do prawej |
| Perski | فارسی | od prawej do lewej |
| Arabski | العربية | od prawej do lewej |
| Hebrajski | עברית | od prawej do lewej |
| Urdu | اردو | od prawej do lewej |
| Hiszpański | Español | od lewej do prawej |
| Francuski | Français | od lewej do prawej |
| Niemiecki | Deutsch | od lewej do prawej |
| Chiński uproszczony | 中文简体 | od lewej do prawej |
| Chiński tradycyjny | 中文繁體 | od lewej do prawej |
| Rosyjski | Русский | od lewej do prawej |
| Turecki | Türkçe | od lewej do prawej |
| Włoski | Italiano | od lewej do prawej |
| Portugalski | Português | od lewej do prawej |
| Niderlandzki | Nederlands | od lewej do prawej |
| Polski | Polski | od lewej do prawej |
| Wietnamski | Tiếng Việt | od lewej do prawej |
| Tajski | ไทย | od lewej do prawej |
| Hindi | हिन्दी | od lewej do prawej |
| Indonezyjski | Bahasa Indonesia | od lewej do prawej |
| Japoński | 日本語 | od lewej do prawej |
| Koreański | 한국어 | od lewej do prawej |

Języki od prawej do lewej (perski, arabski, hebrajski, urdu) dostają kierunek na poziomie bloku; reszta strony zachowuje geometrię.

## Instalacja

1. Pobierz to repozytorium (**Code → Download ZIP** lub `git clone`) i zachowaj folder.
2. Otwórz `brave://extensions` (albo `chrome://extensions`).
3. Włącz **tryb programisty**.
4. Kliknij **Load unpacked** i wybierz ten folder (ten z `manifest.json`).
5. Przypnij rozszerzenie, jeśli chcesz mieć popup pod jednym kliknięciem.

Nie ma etapu budowania, instalacji ani pakowania. Rozszerzenie czyta tylko pliki wymienione w `manifest.json`; `tests/`, `scripts/`, `bench/`, `docs/` i `.github/` służą wyłącznie rozwojowi i nigdy nie są ładowane.

Potrzebna jest aktualna przeglądarka Chromium. Zamknięte shadow rooty są tłumaczone tam, gdzie przeglądarka udostępnia API (Chromium 119+); reszta działa też na starszych wersjach.

## Udostępnianie innym

`npm run release` buduje pakiet i zapisuje pliki w `release/` (folder ignorowany przez git):

| Plik | Co to jest | Jak się instaluje |
|---|---|---|
| `page-translator-ai-<version>.zip` | całe rozszerzenie, około 95 KB, z `INSTALL.txt` w środku | rozpakować → **Load unpacked**; ten sam plik przyjmuje sklep |
| `page-translator-ai-<version>.crx` | podpisany pakiet | przeciągnąć na `brave://extensions`, gdzie dozwolona jest instalacja poza sklepem |
| `page-translator-ai-signing-key.pem` | klucz podpisujący | nigdy go nie udostępniaj; `npm run release` używa go ponownie, dzięki czemu ID rozszerzenia nie zmienia się między aktualizacjami |

Czyli to, co komuś przekazujesz, to jeden plik — i zawiera instrukcję instalacji.

**Uczciwe ograniczenie:** rozszerzenie przeglądarki to kod po stronie klienta. Kto je zainstaluje, może przeczytać te pliki — `.crx` to podpisany zip, a rozpakowane rozszerzenie to zwykły folder. Żadne pakowanie ani zaciemnianie tego nie zmienia; minifikacja tylko spowalnia czytelnika, a regulaminy sklepów zabraniają zaciemniania. Jeśli kod musi pozostać tajny, jedyną realną opcją jest przeniesienie promptów i wywołań dostawcy na własny serwer — co porzuca model „własny klucz, bez backendu”.

Aby dystrybuować bez przekazywania repozytorium, opublikuj zip jako **prywatną lub niepubliczną** pozycję w Chrome Web Store; to jedyna droga instalacji jednym kliknięciem dla osoby nietechnicznej.

## Konfiguracja dostawcy

Popup rozszerzenia → **Options & settings**, albo `brave://extensions` → Szczegóły → Opcje rozszerzenia.

| Dostawca | Punkt końcowy | Klucz | Uwagi |
|---|---|---|---|
| **Ollama** (lokalnie) | `http://localhost:11434` | brak | Darmowo i całkowicie prywatnie. Zainstaluj z [ollama.com](https://ollama.com), potem `ollama run llama3`. Przy 403 uruchom ponownie z `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | darmowy klucz z [AI Studio](https://aistudio.google.com/app/apikey) | Użyj aktualnego ID modelu, np. `gemini-2.5-flash`. Limity darmowe się zmieniają; sprawdź listę modeli Google. |
| **Zgodny z OpenAI** | twój punkt końcowy, np. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | klucz dostawcy | Każda usługa obsługująca `/chat/completions`. Modele proponowane w interfejsie to przykłady — użyj dokładnego ID z katalogu dostawcy. |

Potem:

1. Wybierz **domyślny język docelowy**.
2. Wybierz **styl tłumaczenia**: *Natural* (zalecany) lub *Literal*.
3. Opcjonalnie włącz **Quality mode** i dodaj wpisy **słownika**, po jednym w wierszu (`termin → tłumaczenie`; działają też `->`, `=>`, `=` i TAB).
4. Zostaw **język źródłowy** na *Auto-detect* lub wybierz go jawnie.
5. Kliknij **Test connection**, a potem **Save settings**.

Uwagi o dostawcach:

- **Ustawienie rozumowania Gemini zależy od generacji modelu.** 2.5 Flash i Flash-Lite działają bez rozumowania, 2.5 Pro używa minimum (128), a 3.x/4.x niskiego poziomu. Jeśli model odrzuci ustawienie, żądanie jest ponawiane raz bez niego.
- **Ollama** jest wywoływana z oknem kontekstu 8192 tokenów; model trenowany na mniejszym nadal utnie długie strony — dlatego strona jest dzielona na małe jednostki.
- **Darmowe plany** ograniczają tempo. Rozszerzenie czeka i ponawia; nigdy nie wyrzuca tekstu po cichu.

## Korzystanie

- Kliknij ikonę → wybierz język → **Translate this page**.
- **Show original / Show translation** w dowolnym momencie; przywracanie jest bezstratne.
- Najedź na przetłumaczony akapit, aby zobaczyć oryginał.
- Prawy przycisk → **Translate this page** lub **Translate selection**.
- Klawiatura: `Ctrl+Shift+Y` (`Cmd+Shift+Y` w macOS) przełącza tłumaczenie; można zmienić na stronie skrótów przeglądarki.
- Z włączonym **Auto-translate** i zapisaną preferencją witryny pasujące strony tłumaczą się przy wczytaniu.
- Ustawienia działają na otwartych kartach przy następnym tłumaczeniu; przeładowanie nie jest potrzebne.

## Jak to działa

```
DOM strony
  └─ content script: zbiera jednostki blokowe, serializuje znaczniki inline do tokenów <tN>/<vN/>
       └─ dzielnik: 24 jednostki / 2400 znaków na żądanie
            └─ service worker: żądanie do twojego dostawcy (pochodzenie rozszerzenia, bez CORS)
                 └─ dostawca: JSON wchodzi, JSON wychodzi, ID zachowane
                      └─ walidacja: tokeny kompletne, zbalansowane i unikalne; ID się zgadzają
                           └─ DOM: ponowne użycie oryginalnych węzłów, zapis tylko tekstu
                                └─ MutationObserver: tłumaczenie treści dodanej później
```

Decyzje, które naprawdę mają znaczenie:

- **Ruch do dostawcy nigdy nie wychodzi z kontekstu strony.** Content script wysyła wiadomość `AIPT_FETCH`; service worker wykonuje żądanie, więc punkty końcowe z ostrym CORS działają bez zmian. Service worker sprawdza też `sender.id`, więc tylko to rozszerzenie może używać go jako proxy.
- **Prompt to umowa, nie życzenie.** ID wchodzą, ID wychodzą; jeden wpis na segment; tagi nietykalne; liczby, adresy URL, kod i placeholdery dosłownie; bez dodatkowych wyjaśnień. Odpowiedzi są czytane po ID, więc przestawiona lub częściowo zniekształcona tablica zawodzi bezpiecznie, zamiast przesuwać tłumaczenia.
- **Każdy język ma własny przewodnik stylu.** Przewodnik perski wymaga na przykład perskiego szyku i czasowników (`بررسی کنید`, nie `بررسی را انجام دهید`), zakazuje `می‌باشد`/`بایستی`/`گردید` tam, gdzie zwykłe zdanie wystarcza, zostawia w alfabecie łacińskim tylko prawdziwe zapożyczenia i poprawia interpunkcję oraz spacje. Przykłady few-shot pokazują modelowi cel, a nie tylko go opisują.
- **Kierunek jest lokalny.** Bloki perskie, arabskie, hebrajskie i urdu dostają `dir="rtl"`, `<html>` dostaje język docelowy, a reszta strony zachowuje geometrię — globalne odwrócenie psuło wyśrodkowane układy i bloki kodu. Oba są przywracane wraz z oryginalnym tekstem.
- **Błędy są widoczne i ograniczone.** Nieczytelny blok jest dzielony; jednostka, która nadal zawodzi, zostaje w języku źródłowym i jest zgłaszana w pasku. Anulowanie w trakcie tłumaczenia zatrzymuje się czysto i nie zostawia na wpół zapisanego DOM.

Więcej szczegółów: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Prywatność i uprawnienia

| Uprawnienie | Dlaczego jest potrzebne |
|---|---|
| `storage` | Zapis ustawień, klucza API, słownika i preferencji witryn w `chrome.storage.local`. |
| `contextMenus` | Pozycja menu pod prawym przyciskiem „Przetłumacz stronę / zaznaczenie”. |
| `tabs` | Wysyłanie wiadomości do aktywnej karty i otwieranie opcji. |
| `activeTab` | Działanie na stronie, którą sam tłumaczysz. |
| `<all_urls>` | Wstrzykiwanie content scriptu do odwiedzanych stron i pozwolenie service workerowi na wywołanie skonfigurowanego punktu końcowego. |

- Klucz API jest przechowywany tylko w lokalnej pamięci tej przeglądarki i wysyłany tylko do wybranego dostawcy.
- Bez analityki, bez telemetrii, bez zdalnego kodu, bez łączenia się z serwerem autora i bez konta.
- Cały tekst jest zapisywany przez `textContent` / `createTextNode`; nigdzie nie ma `innerHTML`, `eval` ani `new Function`. Wynik modelu może trafić na stronę tylko jako tekst, a atrybuty są ograniczone do stałej listy dozwolonych — `href`, `src` i handlery zdarzeń nigdy nie są zapisywane z wyniku modelu.
- Preferencje witryn zapisuje jeden serializowany zapisujący w service workerze, więc dwie karty nie nadpisują się nawzajem.
- Automatyczne wykrywanie języka wysyła do tego samego dostawcy próbkę maksymalnie 600 znaków; ręczny wybór języka źródłowego usuwa to żądanie.

Polityka bezpieczeństwa i zgłaszanie luk: [`SECURITY.md`](../../SECURITY.md).

## Znane ograniczenia

- **Walidacja tokenów jest celowo ostra.** Model, który systematycznie psuje `<tN>`, zostawi te akapity w języku źródłowym (i to zgłosi), zamiast zgubić link. Używaj modelu respektującego ustrukturyzowane wyjście; *Test connection* sprawdza zdanie z tokenami.
- **Jakość zależy od modelu.** Małe modele lokalne są użyteczne, ale mniej płynne niż Gemini czy modele klasy GPT; warstwa stylu pomaga, nie dodaje wiedzy.
- **Zamknięte shadow rooty i iframes cross-origin** są poza zasięgiem rozszerzenia (bezpieczeństwo przeglądarki). Otwarte shadow rooty i ramki z tej samej domeny są obsługiwane.
- **Mieszane kontenery z luźnym tekstem** (`<div>tekst<p>…</p></div>`) wracają do tłumaczenia węzeł po węźle dla tego tekstu; poprawne strony nigdy tego nie dotykają.
- **Pamięć podręczna jest w RAM** (na sesję karty). Przeładowanie strony ponownie prosi o tekst.
- **PDF-y nie są tłumaczone**; wbudowana przeglądarka PDF nie jest skryptowalna dla rozszerzeń.
- **Darmowe plany się zmieniają.** Limity tempa i nazwy modeli ustala dostawca, nie to rozszerzenie.

## Stan projektu i testy

Wersja 1.3.1. Zestaw automatyczny obejmuje warstwę DOM, prompt i parsowanie, kształt żądań do dostawców, zachowanie silnika i interfejs opcji — **95 testów** — a `npm run verify` dodaje kontrolę w 12 punktach: składnia, zestaw testów, zakaz ujść HTML, wyciek klucza, klasyczne content scripty, zgodność wersji, pokrycie CHANGELOG i pakowanie.

```bash
npm install       # tylko rozwój: jsdom do testów DOM
npm test          # 95 testów
npm run bench     # benchmark segmentacji, bez klucza API
npm run verify    # składnia + testy + kontrole polityki + pakowanie
npm run package   # kopiuje tylko pliki do dystrybucji do dist/
npm run release   # dist + release/*.zip, *.crx, *.pem do dystrybucji
```

Benchmark mierzy segmentację, nie jakość tłumaczenia: na czterech przykładowych stronach niezależny kolektor węzłów tekstu daje **108 fragmentów**, a kolektor bloków **63 jednostki** (1,7 raza mniej łącznie, **2,5 raza** w artykule informacyjnym), a fragmenty krótsze niż 25 znaków spadają z **81 do 34**. Sama jakość tłumaczenia nadal zależy od podłączonego modelu — ręczna lista w [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) obejmuje to, czego testy automatyczne nie osiągają (renderowanie RTL, podpowiedzi, prawdziwy ruch SPA, błędy dostawcy).

CI uruchamia `npm run verify` i `npm run bench` na Node 20 i 22 przy każdym pushu i pull requeście ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Struktura projektu

```
manifest.json                 Manifest V3: uprawnienia, content scripty, skrót
background/
  service-worker.js           menu, skrót, routing wiadomości, keep-alive
  fetch-utils.js              proxy fetch dostawcy: URL/nagłówki, limit czasu, rodzaje błędów
  site-prefs.js               serializowany odczyt-modyfikacja-zapis preferencji witryn
content/
  languages.js                22 języki, wartości domyślne, nazwy wyświetlane
  providers.js                prompty, przewodniki stylu, parsowanie JSON, normalizacja, Gemini/OpenAI/Ollama
  translation-engine.js       cache, dzielenie, współbieżność, ponawianie, bisekcja, przebieg jakości
  dom-processor.js            jednostki blokowe, tokeny, zwalidowane stosowanie, dokładne przywracanie, kierunek
  content-script.js           orkiestracja, stan, komunikacja, automatyczne tłumaczenie
  styles.css                  dwie reguły, których RTL naprawdę potrzebuje
popup/                        wybór języka, tłumacz/przywróć, postęp, błędy
options/                      dostawca, klucz, model, styl, jakość, słownik, preferencje witryn
icons/                        ikony 16/48/128 px
docs/i18n/                    tłumaczenia tego README, jeden plik na język
tests/  scripts/  bench/      tylko rozwój — nigdy nie ładowane przez rozszerzenie
```

## Współpraca

Issues i pull requesty są mile widziane. Przed wysłaniem zmiany uruchom `npm run verify`; utrzymuj rozszerzenie bez etapu budowania, zostawiaj ruch do dostawcy w service workerze i nigdy nie wprowadzaj `innerHTML`. Jeśli zmieniasz prompt, dodaj lub zaktualizuj test: prompt, parser i normalizator są testowane razem, bo działają tylko jako zestaw.

Pełne zasady, polityka tłumaczeń `docs/i18n/` i konwencje commitów są w [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Licencja

MIT — zobacz [`LICENSE`](../../LICENSE). Usługi zewnętrzne, które podłączasz (Gemini, OpenRouter, Ollama…), mają własne warunki i cenniki.
