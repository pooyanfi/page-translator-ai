<img src="../../icons/icon-128.png" width="88" align="right" alt="AI Page Translator simgesi">

# AI Page Translator — web'i kendi yapay zekânızla çevirin

**Herhangi bir web sayfasını seçtiğiniz yapay zekâ sağlayıcısıyla kendi dilinize çevirin — sunucu yok, hesap yok, izleme yok, kelime başına ücret yok.**

`Manifest V3` · `Derleme adımı yok` · `Saf JavaScript` · `sürüm 1.3.1` · `22 dil`

Bu dosya, [kanonik İngilizce README](README.md) metninin Türkçe çevirisidir. Bir uyuşmazlık olursa İngilizce metin geçerlidir.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · **Türkçe** · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator, **Brave** ve Chromium tabanlı diğer tarayıcılar için bir eklentidir. Sağlayıcıyı siz seçersiniz: ücretsiz bir Google Gemini anahtarı, OpenAI uyumlu herhangi bir uç nokta (OpenRouter, Groq, NVIDIA, OpenAI…) veya **Ollama** ile tamamen yerel bir model. Eklenti, okuduğunuz sayfayı bulunduğu yerde çevirir; düzeni, bağlantıları ve biçimlendirmeyi korur.

Hiçbir metin aracı bir çeviri hizmetinden geçmez. API anahtarınız tarayıcıdan çıkmaz, hiçbir analitik yoktur ve Ollama ile metin bilgisayarınızdan bile çıkmaz.

> **Durum:** sürüm 1.3.1 · 95 otomatik test · 12 maddelik doğrulama · telemetri yok, uzak kod yok.

---

## Neden bir çeviri eklentisi daha?

Çoğu sayfa çevirici her seferinde tek bir cümle gönderir. Sonuç bu yüzden sayfa gibi değil, üst üste yığılmış cümleler gibi okunur: bağlam kaybolur, terminoloji kayar, bağlantılar cümleleri ortadan böler ve hedef dil, kaynak dilin sözcük sırasını devralır.

Bu eklenti metin düğümleri yerine **blokları** çevirir:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Blok tek bir birim olarak gönderilir; satır içi biçimlendirme yerini numaralı jetonlara bırakır:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` cümleye ait satır içi içeriği (bağlantı, vurgu, span) işaretler; `<vN/>` ise asla çevrilmemesi gereken içeriği (kod, görseller, form denetimleri, araçlar). Model jetonları taşıyabildiği için doğal hedef dil cümlesini **bağlantının etrafında** kurar, İngilizce sıraya mahkûm olmaz.

Dönüşte yanıt, sayfaya dokunulmadan önce doğrulanır. Her jeton bulunmalı, dengeli ve benzersiz olmalıdır; bağlantıyı düşüren çeviri reddedilir, bir kez daha sıkı bir talimatla yinelenir, yine olmazsa olduğu gibi bırakılır. Özgün öğe düğümleri yeniden kullanılır; böylece `href`, olay dinleyicileri ve iç içe biçimlendirme korunur. «Özgünü göster» tam olarak ilk düğümleri geri getirir.

## Özellikler

- **Sayfanın tamamını yerinde çevirme** — başlıklar, paragraflar, listeler, tablolar, görsel altı yazılar ve düğmeler.
- **Bağlantılar ve satır içi biçimlendirme korunur** — jeton doğrulamasıyla; kaybolan bağlantı asla sessizce uygulanmaz.
- **Doğal veya birebir stil** — *Doğal* (varsayılan) anadili bir yazar gibi yeniden yazar; *Birebir* teknik sayfalarda kaynağa yakın kalır.
- **Dil başına stil kılavuzu** — Farsça, Arapça, Urduca ve İbranice için özel yönergeler, diğer 18 dil için genel bir kılavuz.
- **Belirlenimci tipografi düzeltmesi** — Farsça `ی`/`ک`, `می`/`ها`/`تر` içindeki sıfır genişlikli boşluklar ve `، ؛ ؟` işaretleri model hata yapsa bile düzeltilir.
- **İsteğe bağlı kalite geçişi** — her parçayı {kaynak, çeviri} çifti olarak okur; yalnızca ifadeyi değil anlamı da düzeltir.
- **Sözlük** — modelin uyması gereken «terim → çeviri» çiftleri.
- **Korunan içerik** — `<pre>`, `<code>`, adresler, e-postalar, `translate="no"`, `contenteditable`, SVG, form denetimleri ve eklentinin kendi arayüzü asla gönderilmez.
- **Öznitelik etiketleri** — `alt`, `title`, `placeholder` ve `aria-label` ayrı bir kanaldan, paragraf değil etiket tonuyla çevrilir.
- **Dinamik sayfalar** — sonsuz kaydırma veya SPA'dan gelen yeni içerik göründüğü anda çevrilir, gözlemci döngüsü oluşmaz.
- **Sağdan sola doğru şekilde** — her çevrilen blokta `dir`, `<html>` üzerinde `lang`, sayfanın tamamı döndürülmez; her şey geri alınır.
- **Site başına bellek** — etki alanı başına hedef dili hatırlar ve yüklemede otomatik çevirebilir.
- **API'si olan her hizmet** — Gemini, Ollama ve OpenAI uyumlu her uç nokta; service worker'dan çağrıldığı için CORS sorunu olmaz.
- **Bellek içi önbellek, yeniden deneme ve bölme** — aynı metin bir kez gönderilir; başarısız blok sayfayı düşürmek yerine bölünür; 429/5xx artan bekleme ile yinelenir.
- **Derleme adımı yok** — düz klasik betikler, olduğu gibi yüklenir.

## Desteklenen diller

Yirmi iki hedef dil; her birinin yerel adı istemde yer alır, böylece model `zh-TW` ile `zh-CN`i veya Farsça ile Arapçayı karıştırmaz:

| Dil | Yerel ad | Yön |
|---|---|---|
| İngilizce | English | soldan sağa |
| Farsça | فارسی | sağdan sola |
| Arapça | العربية | sağdan sola |
| İbranice | עברית | sağdan sola |
| Urduca | اردو | sağdan sola |
| İspanyolca | Español | soldan sağa |
| Fransızca | Français | soldan sağa |
| Almanca | Deutsch | soldan sağa |
| Çince (basitleştirilmiş) | 中文简体 | soldan sağa |
| Çince (geleneksel) | 中文繁體 | soldan sağa |
| Rusça | Русский | soldan sağa |
| Türkçe | Türkçe | soldan sağa |
| İtalyanca | Italiano | soldan sağa |
| Portekizce | Português | soldan sağa |
| Felemenkçe | Nederlands | soldan sağa |
| Lehçe | Polski | soldan sağa |
| Vietnamca | Tiếng Việt | soldan sağa |
| Tayca | ไทย | soldan sağa |
| Hintçe | हिन्दी | soldan sağa |
| Endonezce | Bahasa Indonesia | soldan sağa |
| Japonca | 日本語 | soldan sağa |
| Korece | 한국어 | soldan sağa |

Sağdan sola diller (Farsça, Arapça, İbranice, Urduca) yönü blok düzeyinde alır; sayfanın geri kalanı geometrisini korur.

## Kurulum

1. Bu depoyu indirin (**Code → Download ZIP** veya `git clone`) ve klasörü saklayın.
2. `brave://extensions` (veya `chrome://extensions`) adresini açın.
3. **Developer mode** seçeneğini açın.
4. **Load unpacked** düğmesine basın ve bu klasörü seçin (`manifest.json` içeren klasör).
5. Açılır pencere tek tık uzakta olsun istiyorsanız eklentiyi sabitleyin.

Derleme, kurulum veya paketleme adımı yoktur. Eklenti yalnızca `manifest.json` içinde listelenen dosyaları okur; `tests/`, `scripts/`, `bench/`, `docs/` ve `.github/` yalnızca geliştirme içindir ve asla yüklenmez.

Güncel bir Chromium tabanlı tarayıcı gerekir. Kapalı shadow root'lar, tarayıcının API'yi sunduğu yerlerde (Chromium 119+) çevrilir; geri kalan her şey eski sürümlerde de çalışır.

## Başkalarıyla paylaşma

`npm run release` paketi oluşturur ve dosyaları `release/` klasörüne yazar (git tarafından yok sayılır):

| Dosya | Nedir | Nasıl kurulur |
|---|---|---|
| `page-translator-ai-<version>.zip` | eklentinin tamamı, yaklaşık 95 KB, içinde `INSTALL.txt` | arşivi açıp **Load unpacked**; bir mağazanın kabul ettiği dosya da budur |
| `page-translator-ai-<version>.crx` | imzalı paket | mağaza dışı kuruluma izin verilen yerlerde `brave://extensions` üzerine sürükleyin |
| `page-translator-ai-signing-key.pem` | imzalama anahtarı | asla paylaşmayın; `npm run release` onu yeniden kullanır, böylece eklenti kimliği güncellemeler arasında aynı kalır |

Yani birine verdiğiniz şey tek bir dosyadır ve kurulum adımları içindedir.

**Dürüst sınır:** tarayıcı eklentisi istemci tarafı koddur. Kuran herkes bu dosyaları okuyabilir — `.crx` imzalı bir zip, paketlenmemiş eklenti ise sıradan bir klasördür. Hiçbir paketleme veya gizleme bunu değiştirmez; küçültme yalnızca okumayı yavaşlatır ve mağaza politikaları gizlemeyi yasaklar. Kaynak gerçekten gizli kalmalıysa tek makul seçenek, istemleri ve sağlayıcı çağrılarını kendi denetiminizdeki bir sunucuya taşımaktır; bu da «kendi anahtarın, sunucusuz» tasarımından vazgeçmek demektir.

Depoyu vermeden dağıtmak için zip'i Chrome Web Store'da **özel veya listelenmemiş** öğe olarak yayımlayın; teknik olmayan kullanıcı için tek tıkla kurulumun tek yolu budur.

## Sağlayıcı ayarlama

Eklenti açılır penceresi → **Options & settings**, veya `brave://extensions` → Ayrıntılar → Uzantı seçenekleri.

| Sağlayıcı | Uç nokta | Anahtar | Notlar |
|---|---|---|---|
| **Ollama** (yerel) | `http://localhost:11434` | gerekmez | Ücretsiz ve tamamen özel. [ollama.com](https://ollama.com) adresinden kurun, ardından `ollama run llama3`. 403 dönerse `OLLAMA_ORIGINS=chrome-extension://*` ile yeniden başlatın. |
| **Google Gemini** | `generativelanguage.googleapis.com` | [AI Studio](https://aistudio.google.com/app/apikey) ücretsiz anahtar | Güncel bir model kimliği kullanın, örneğin `gemini-2.5-flash`. Ücretsiz kotalar değişir; Google'ın model listesine bakın. |
| **OpenAI uyumlu** | kendi uç noktanız, örn. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | sağlayıcı anahtarı | `/chat/completions` konuşan her hizmet. Arayüzdeki model önerileri örnektir — sağlayıcının kataloğundaki tam kimliği kullanın. |

Sonra:

1. **Varsayılan hedef dili** seçin.
2. **Çeviri stilini** seçin: *Natural* (önerilir) veya *Literal*.
3. İsterseniz **Quality mode** seçeneğini açın ve **sözlük** girdileri ekleyin, her satıra bir tane (`terim → çeviri`; `->`, `=>`, `=` ve TAB da çalışır).
4. **Kaynak dili** *Auto-detect* olarak bırakın veya kendiniz seçin.
5. **Test connection** ve ardından **Save settings** düğmesine basın.

Sağlayıcı notları:

- **Gemini'nin düşünme ayarı model nesline göre seçilir.** 2.5 Flash ve Flash-Lite düşünmeden çalışır, 2.5 Pro en düşük bütçesini (128) kullanır, 3.x/4.x düşük düzeyi. Model ayarı reddederse istek bir kez onsuz yinelenir.
- **Ollama** 8192 jetonluk bağlam penceresiyle çağrılır; daha azıyla eğitilmiş bir model uzun sayfaları yine kısaltır — bu yüzden sayfa küçük birimlere bölünür.
- **Ücretsiz planlar** hız sınırı koyar. Eklenti bekler ve yeniden dener; metni sessizce atmaz.

## Kullanım

- Simgeye tıklayın → bir dil seçin → **Translate this page**.
- **Show original / Show translation** her an; geri dönüş kayıpsızdır.
- Çevrilen paragrafın üzerine gelerek özgün metni görün.
- Sağ tık → **Translate this page** veya **Translate selection**.
- Klavye: `Ctrl+Shift+Y` (macOS'te `Cmd+Shift+Y`) çeviriyi açar/kapatır; tarayıcının kısayollar sayfasından değiştirilebilir.
- **Auto-translate** açık ve site tercihi kayıtlıysa ilgili sayfalar yüklemede çevrilir.
- Ayarlar açık sekmelere bir sonraki çeviride uygulanır; sayfayı yenilemek gerekmez.

## Nasıl çalışır

```
sayfa DOM'u
  └─ content script: blok birimlerini toplar, satır içi biçimlendirmeyi <tN>/<vN/> jetonlarına çevirir
       └─ bölücü: istek başına 24 birim / 2400 karakter
            └─ service worker: sağlayıcınıza istek (eklenti kaynağı, CORS yok)
                 └─ sağlayıcı: JSON girer, JSON çıkar, kimlikler korunur
                      └─ doğrulama: jetonlar eksiksiz, dengeli ve benzersiz; kimlikler eşleşir
                           └─ DOM: özgün öğe düğümlerini yeniden kullanır, yalnızca metin yazar
                                └─ MutationObserver: sonradan eklenen içeriği çevirir
```

Gerçekten fark yaratan kararlar:

- **Sağlayıcı trafiği asla sayfa bağlamından çıkmaz.** Content script bir `AIPT_FETCH` iletisi gönderir; isteği service worker yapar, böylece katı CORS'lu uç noktalar olduğu gibi çalışır. Service worker ayrıca `sender.id` denetler; yalnızca bu eklenti onu vekil olarak kullanabilir.
- **İstem bir sözleşmedir, dilek değil.** Kimlikler girer, kimlikler çıkar; segment başına bir kayıt; etiketler dokunulmaz; sayılar, adresler, kod ve yer tutucular aynen; ek açıklama yok. Yanıtlar kimliğe göre okunur; yeniden sıralanmış veya kısmen bozuk dizi, çevirileri kaydırmak yerine güvenle başarısız olur.
- **Her dilin kendi stil kılavuzu var.** Farsça kılavuz örneğin Farsça sözcük sırası ve fiil ister (`بررسی کنید`, `بررسی را انجام دهید` değil), sıradan bir cümlenin yettiği yerde `می‌باشد`/`بایستی`/`گردید` yasaklar, Latin alfabesinde yalnızca gerçek alıntıları bırakır, noktalama ve sıfır genişlikli boşlukları düzeltir. Few-shot örnekleri hedefi modele gösterir, yalnızca tarif etmez.
- **Yön yereldir.** Farsça, Arapça, İbranice ve Urduca bloklar `dir="rtl"` alır, `<html>` hedef dili alır, sayfanın geri kalanı geometrisini korur — sayfayı tümden döndürmek ortalanmış düzenleri ve kod bloklarını bozuyordu. İkisi de özgün metinle geri alınır.
- **Hatalar görünür ve sınırlıdır.** Ayrıştırılamayan blok bölünür; yine başarısız olan birim kaynak dilinde kalır ve üst çubukta bildirilir. Çeviri sırasında iptal temiz durur, yarım yazılmış DOM bırakmaz.

Daha fazlası: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Gizlilik ve izinler

| İzin | Neden gerekli |
|---|---|
| `storage` | Ayarları, API anahtarını, sözlüğü ve site tercihlerini `chrome.storage.local` içinde saklamak. |
| `contextMenus` | Sağ tık «Bu sayfayı / seçimi çevir» seçeneği. |
| `tabs` | Etkin sekmeye ileti göndermek ve seçenekleri açmak. |
| `activeTab` | Açıkça çevirdiğiniz sayfada işlem yapmak. |
| `<all_urls>` | Ziyaret edilen sayfalara content script eklemek ve service worker'ın yapılandırılmış uç noktayı çağırmasına izin vermek. |

- API anahtarı yalnızca bu tarayıcının yerel deposunda tutulur ve yalnızca seçtiğiniz sağlayıcıya gönderilir.
- Analitik yok, telemetri yok, uzak kod yok, geliştiricinin sunucusuna çağrı yok, hesap yok.
- Tüm metin `textContent` / `createTextNode` ile yazılır; `innerHTML`, `eval` veya `new Function` hiçbir yerde yoktur. Model çıktısı sayfaya yalnızca metin olarak ulaşır; öznitelikler sabit bir izin listesiyle sınırlıdır — `href`, `src` ve olay işleyicileri asla model çıktısından yazılmaz.
- Site tercihleri service worker'daki tek bir sıralı yazıcı tarafından yazılır; iki sekme birbirinin yazdığını ezemez.
- Otomatik dil algılama, aynı sağlayıcıya en fazla 600 karakterlik örnek gönderir; kaynak dili elle seçerseniz bu istek tamamen kalkar.

Güvenlik politikası ve güvenlik açığı bildirimi: [`SECURITY.md`](../../SECURITY.md).

## Bilinen sınırlamalar

- **Jeton doğrulaması bilerek katıdır.** `<tN>` etiketlerini sürekli bozan bir model, bağlantıyı düşürmek yerine o paragrafları kaynak dilinde bırakır (ve bunu bildirir). Yapılandırılmış çıktıya uyan bir model kullanın; *Test connection* jetonlu bir cümleyi dener.
- **Kalite modele bağlıdır.** Küçük yerel modeller kullanılabilir ama Gemini veya GPT sınıfı modellerden daha az akıcıdır; stil katmanı yardımcı olur, bilgi eklemez.
- **Kapalı shadow root'lar ve cross-origin iframe'ler** eklentinin erişimi dışındadır (tarayıcı güvenliği). Açık shadow root'lar ve aynı kaynaklı çerçeveler desteklenir.
- **Serbest metin içeren karışık kapsayıcılar** (`<div>metin<p>…</p></div>`) o metin için düğüm düğüm çeviriye döner; düzgün sayfalar bu duruma hiç gelmez.
- **Önbellek bellekte** (sekme oturumu başına). Sayfayı yenilemek metni yeniden ister.
- **PDF'ler çevrilmez**; yerleşik PDF görüntüleyici eklentilerle betiklenemez.
- **Ücretsiz planlar değişir.** Hız sınırlarını ve model adlarını sağlayıcı belirler, bu eklenti değil.

## Proje durumu ve testler

Sürüm 1.3.1. Otomatik takım DOM katmanını, istem ve ayrıştırmayı, sağlayıcı isteklerinin biçimini, motor davranışını ve Options arayüzünü kapsar — **95 test** — ve `npm run verify` 12 maddelik bir doğrulama ekler: sözdizimi, test takımı, HTML havuzlarının yasaklanması, anahtar sızıntısı denetimi, klasik content script'ler, sürüm eşitliği, CHANGELOG kapsamı ve paketleme.

```bash
npm install       # yalnızca geliştirme: DOM testleri için jsdom
npm test          # 95 test
npm run bench     # segmentasyon ölçümü, API anahtarı gerekmez
npm run verify    # sözdizimi + testler + politika denetimleri + paketleme
npm run package   # yalnızca dağıtılabilir dosyaları dist/ içine kopyalar
npm run release   # dist + dağıtım için release/*.zip, *.crx, *.pem
```

Ölçüm segmentasyonu ölçer, çeviri kalitesini değil: dört örnek sayfada bağımsız bir metin düğümü toplayıcı **108 parça** üretirken blok toplayıcı **63 birim** üretir (toplamda 1,7 kat az, haber makalesinde **2,5 kat**) ve 25 karakterden kısa parçalar **81'den 34'e** düşer. Çeviri kalitesi yine bağladığınız modele bağlıdır; otomatik testlerin ulaşamadığı tarayıcı düzeyi davranışları (RTL görünümü, ipuçları, gerçek SPA trafiği, sağlayıcı hataları) [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) içindeki el listesi kapsar.

CI, her push ve pull request'te `npm run verify` ve `npm run bench` komutlarını Node 20 ve 22 üzerinde çalıştırır ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Proje yapısı

```
manifest.json                 Manifest V3: izinler, content script'ler, kısayol
background/
  service-worker.js           menüler, kısayol, ileti yönlendirme, keep-alive
  fetch-utils.js              sağlayıcı fetch vekili: URL/başlık denetimi, zaman aşımı, hata türleri
  site-prefs.js               site tercihleri için sıralı oku-değiştir-yaz
content/
  languages.js                22 dil, varsayılanlar, görünen adlar
  providers.js                istemler, stil kılavuzları, JSON ayrıştırma, normalleştirme, Gemini/OpenAI/Ollama
  translation-engine.js       önbellek, bölme, eşzamanlılık, yeniden deneme, ikiye bölme, kalite geçişi
  dom-processor.js            blok birimleri, jetonlar, doğrulanmış uygulama, tam geri alma, yön
  content-script.js           düzenleme, durum, mesajlaşma, otomatik çeviri
  styles.css                  RTL'in gerçekten ihtiyaç duyduğu iki kural
popup/                        dil seçimi, çevir/geri al, ilerleme, hatalar
options/                      sağlayıcı, anahtar, model, stil, kalite, sözlük, site tercihleri
icons/                        16/48/128 px simgeler
docs/i18n/                    bu README'nin çevirileri, dil başına bir dosya
tests/  scripts/  bench/      yalnızca geliştirme — eklenti asla yüklemez
```

## Katkıda bulunma

Issue ve pull request'ler memnuniyetle karşılanır. Değişiklik göndermeden önce `npm run verify` çalıştırın; eklentiyi derlemesiz tutun, sağlayıcı trafiğini service worker'da bırakın ve asla `innerHTML` eklemeyin. İstemi değiştirirseniz test ekleyin veya güncelleyin; istem, ayrıştırıcı ve normalleştirici birlikte test edilir çünkü yalnızca bir bütün olarak çalışırlar.

Tam kurallar, `docs/i18n/` çeviri politikası ve commit kuralları için [`CONTRIBUTING.md`](../../CONTRIBUTING.md) dosyasını okuyun.

## Lisans

MIT — bkz. [`LICENSE`](../../LICENSE). Bağladığınız üçüncü taraf hizmetlerin (Gemini, OpenRouter, Ollama…) kendi koşulları ve fiyatları vardır.
