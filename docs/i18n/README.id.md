<img src="../../icons/icon-128.png" width="88" align="right" alt="Ikon AI Page Translator">

# AI Page Translator — terjemahkan web dengan AI Anda sendiri

**Terjemahkan halaman web apa pun ke bahasa Anda dengan penyedia AI pilihan Anda — tanpa backend, tanpa akun, tanpa pelacakan, dan tanpa biaya per kata.**

`Manifest V3` · `Tanpa langkah build` · `JavaScript murni` · `versi 1.3.1` · `22 bahasa`

Berkas ini adalah terjemahan bahasa Indonesia dari [README kanonis dalam bahasa Inggris](README.md). Jika ada perbedaan, teks bahasa Inggris yang berlaku.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · **Bahasa Indonesia**
<!-- lang-nav:end -->

AI Page Translator adalah ekstensi peramban untuk **Brave** dan peramban lain berbasis Chromium. Anda menyediakan penyedianya sendiri: kunci Google Gemini gratis, endpoint apa pun yang kompatibel dengan OpenAI (OpenRouter, Groq, NVIDIA, OpenAI…), atau model sepenuhnya lokal melalui **Ollama**. Ekstensi menerjemahkan halaman yang Anda baca di tempatnya, sambil mempertahankan tata letak, tautan, dan formatnya.

Tidak ada teks yang melewati layanan terjemahan perantara. Kunci API tidak pernah meninggalkan peramban, tidak ada alat analitik, dan dengan Ollama teks bahkan tidak keluar dari komputer Anda.

> **Status:** versi 1.3.1 · 95 pengujian otomatis · verifikasi 12 poin · tanpa telemetri, tanpa kode jarak jauh.

---

## Mengapa perlu penerjemah lain?

Sebagian besar penerjemah halaman mengirim satu kalimat setiap kali. Karena itu hasilnya terbaca seperti tumpukan kalimat, bukan halaman: konteks hilang, istilah berubah-ubah, tautan memotong kalimat menjadi dua, dan bahasa target mewarisi urutan kata bahasa sumber.

Ekstensi ini menerjemahkan **blok**, bukan simpul teks:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Blok dikirim sebagai satu kesatuan, dengan markup sebaris diganti token bernomor:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` menandai konten sebaris yang termasuk kalimat (tautan, penekanan, span), sedangkan `<vN/>` menandai konten yang tidak boleh diterjemahkan (kode, gambar, kontrol formulir, widget). Model boleh memindahkan token, sehingga dapat menyusun kalimat alami **di sekitar** tautan alih-alih terikat urutan bahasa Inggris.

Saat kembali, jawaban divalidasi sebelum halaman disentuh. Setiap token harus ada, seimbang, dan unik; terjemahan yang kehilangan tautan ditolak, dicoba ulang sekali dengan instruksi lebih ketat, lalu dibiarkan apa adanya. Simpul elemen asli digunakan kembali, sehingga `href`, pendengar peristiwa, dan markup bertingkat tetap bertahan. "Tampilkan asli" memulihkan simpul asli secara persis.

## Fitur

- **Terjemahan seluruh halaman di tempat** — judul, paragraf, daftar, tabel, keterangan gambar, dan tombol.
- **Tautan dan format sebaris dipertahankan** — dengan validasi token; tautan yang hilang tidak pernah diterapkan diam-diam.
- **Gaya alami atau literal** — *Alami* (bawaan) menulis ulang seperti penulis asli; *Literal* tetap dekat dengan teks sumber pada halaman teknis.
- **Panduan gaya per bahasa** — panduan khusus untuk Persia, Arab, Urdu, dan Ibrani, plus panduan umum untuk 18 bahasa lainnya.
- **Perbaikan tipografi deterministik** — `ی`/`ک` Persia, spasi lebar-nol pada `می`/`ها`/`تر`, dan `، ؛ ؟` diperbaiki meski model keliru.
- **Pemeriksaan kualitas opsional** — membaca setiap segmen sebagai pasangan {sumber, terjemahan}, sehingga memperbaiki makna, bukan hanya susunan kata.
- **Daftar istilah** — pasangan "istilah → terjemahan" yang wajib dipatuhi model.
- **Konten terlindungi** — `<pre>`, `<code>`, URL, email, `translate="no"`, `contenteditable`, SVG, kontrol formulir, dan antarmuka ekstensi sendiri tidak pernah dikirim.
- **Label atribut** — `alt`, `title`, `placeholder`, dan `aria-label` melewati kanal terpisah dengan nada label, bukan paragraf.
- **Halaman dinamis** — konten baru dari gulir tak terbatas atau SPA diterjemahkan begitu muncul, tanpa perulangan pengamat.
- **Kanan-ke-kiri dengan benar** — `dir` pada setiap blok terjemahan, `lang` pada `<html>`, tanpa membalik seluruh halaman; semuanya dipulihkan.
- **Ingatan per situs** — mengingat bahasa target per domain dan dapat menerjemahkan otomatis saat dimuat.
- **API apa pun** — Gemini, Ollama, dan endpoint kompatibel OpenAI, dipanggil dari service worker sehingga tidak ada masalah CORS.
- **Cache di memori, percobaan ulang, dan pemecahan** — teks identik dikirim sekali; blok gagal dipecah alih-alih menggagalkan halaman; 429/5xx dicoba ulang dengan jeda meningkat.
- **Tanpa langkah build** — skrip klasik biasa, dimuat apa adanya.

## Bahasa yang didukung

Dua puluh dua bahasa target, masing-masing dengan nama aslinya di prompt agar model tidak mengacaukan `zh-TW` dengan `zh-CN` atau Persia dengan Arab:

| Bahasa | Nama asli | Arah |
|---|---|---|
| Inggris | English | kiri ke kanan |
| Persia | فارسی | kanan ke kiri |
| Arab | العربية | kanan ke kiri |
| Ibrani | עברית | kanan ke kiri |
| Urdu | اردو | kanan ke kiri |
| Spanyol | Español | kiri ke kanan |
| Prancis | Français | kiri ke kanan |
| Jerman | Deutsch | kiri ke kanan |
| Tionghoa sederhana | 中文简体 | kiri ke kanan |
| Tionghoa tradisional | 中文繁體 | kiri ke kanan |
| Rusia | Русский | kiri ke kanan |
| Turki | Türkçe | kiri ke kanan |
| Italia | Italiano | kiri ke kanan |
| Portugis | Português | kiri ke kanan |
| Belanda | Nederlands | kiri ke kanan |
| Polandia | Polski | kiri ke kanan |
| Vietnam | Tiếng Việt | kiri ke kanan |
| Thai | ไทย | kiri ke kanan |
| Hindi | हिन्दी | kiri ke kanan |
| Indonesia | Bahasa Indonesia | kiri ke kanan |
| Jepang | 日本語 | kiri ke kanan |
| Korea | 한국어 | kiri ke kanan |

Bahasa kanan-ke-kiri (Persia, Arab, Ibrani, Urdu) mendapat arah per blok; sisa halaman mempertahankan geometrinya.

## Instalasi

1. Unduh repositori ini (**Code → Download ZIP** atau `git clone`) dan simpan foldernya.
2. Buka `brave://extensions` (atau `chrome://extensions`).
3. Aktifkan **Developer mode**.
4. Klik **Load unpacked** dan pilih folder ini (folder yang berisi `manifest.json`).
5. Sematkan ekstensi jika ingin popup hanya berjarak satu klik.

Tidak ada langkah build, instalasi, atau bundling. Ekstensi hanya membaca berkas yang tercantum di `manifest.json`; `tests/`, `scripts/`, `bench/`, `docs/`, dan `.github/` hanya untuk pengembangan dan tidak pernah dimuat.

Diperlukan peramban Chromium terbaru. Shadow root tertutup diterjemahkan bila peramban menyediakan API-nya (Chromium 119+); sisanya berfungsi di versi lama.

## Berbagi dengan orang lain

`npm run release` membangun paket dan menaruh berkasnya di `release/` (folder yang diabaikan git):

| Berkas | Isinya | Cara memasang |
|---|---|---|
| `page-translator-ai-<version>.zip` | ekstensi lengkap, sekitar 95 KB, dengan `INSTALL.txt` di dalamnya | ekstrak → **Load unpacked**; juga berkas yang diterima toko |
| `page-translator-ai-<version>.crx` | paket bertanda tangan | seret ke `brave://extensions`, tempat pemasangan di luar toko diizinkan |
| `page-translator-ai-signing-key.pem` | kunci penandatangan | jangan pernah dibagikan; `npm run release` memakainya lagi agar ID ekstensi tetap sama antar pembaruan |

Jadi yang Anda berikan kepada orang lain adalah satu berkas, dan di dalamnya ada langkah pemasangannya.

**Batasan yang jujur:** ekstensi peramban adalah kode sisi klien. Siapa pun yang memasangnya dapat membaca berkas itu — `.crx` adalah zip bertanda tangan dan ekstensi yang belum dikemas adalah folder biasa. Tidak ada pengemasan atau pengaburan yang mengubahnya; minifikasi hanya memperlambat pembaca, dan kebijakan toko melarang pengaburan. Jika kode sumber harus tetap rahasia, satu-satunya pilihan masuk akal adalah memindahkan prompt dan panggilan penyedia ke server yang Anda kendalikan — yang berarti melepaskan desain "kunci Anda sendiri, tanpa backend".

Untuk distribusi tanpa menyerahkan repositori, terbitkan zip sebagai item **privat atau tidak terdaftar** di Chrome Web Store; itulah satu-satunya jalur pemasangan sekali klik bagi pengguna nonteknis.

## Mengatur penyedia

Popup ekstensi → **Options & settings**, atau `brave://extensions` → Detail → Opsi ekstensi.

| Penyedia | Endpoint | Kunci | Catatan |
|---|---|---|---|
| **Ollama** (lokal) | `http://localhost:11434` | tidak perlu | Gratis dan sepenuhnya privat. Pasang dari [ollama.com](https://ollama.com), lalu jalankan `ollama run llama3`. Jika muncul 403, jalankan ulang dengan `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | kunci gratis dari [AI Studio](https://aistudio.google.com/app/apikey) | Gunakan ID model terkini, misalnya `gemini-2.5-flash`. Kuota gratis berubah; periksa daftar model Google. |
| **Kompatibel OpenAI** | endpoint Anda, mis. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | kunci penyedia | Layanan apa pun yang mendukung `/chat/completions`. Model yang disarankan di antarmuka hanya contoh — gunakan ID persis dari katalog penyedia. |

Lalu:

1. Pilih **bahasa target bawaan**.
2. Pilih **gaya terjemahan**: *Natural* (disarankan) atau *Literal*.
3. Bila perlu, aktifkan **Quality mode** dan tambahkan entri **daftar istilah**, satu per baris (`istilah → terjemahan`; `->`, `=>`, `=`, dan TAB juga berfungsi).
4. Biarkan **bahasa sumber** pada *Auto-detect* atau pilih sendiri.
5. Klik **Test connection**, lalu **Save settings**.

Catatan penyedia:

- **Pengaturan penalaran Gemini dipilih menurut generasi model.** 2.5 Flash dan Flash-Lite berjalan tanpa penalaran, 2.5 Pro memakai anggaran minimum (128), dan 3.x/4.x memakai tingkat rendah. Jika model menolak pengaturan itu, permintaan dicoba ulang sekali tanpa pengaturan tersebut.
- **Ollama** dipanggil dengan jendela konteks 8192 token; model yang dilatih dengan konteks lebih kecil tetap akan memotong halaman panjang — karena itu halaman dipecah menjadi unit kecil.
- **Paket gratis** membatasi laju. Ekstensi menunggu dan mencoba lagi; tidak pernah membuang teks diam-diam.

## Penggunaan

- Klik ikon → pilih bahasa → **Translate this page**.
- **Show original / Show translation** kapan saja; pemulihan tanpa kehilangan.
- Arahkan kursor ke paragraf terjemahan untuk melihat teks asli.
- Klik kanan → **Translate this page** atau **Translate selection**.
- Papan ketik: `Ctrl+Shift+Y` (`Cmd+Shift+Y` di macOS) mengalihkan terjemahan; dapat diubah di halaman pintasan peramban.
- Dengan **Auto-translate** aktif dan preferensi situs tersimpan, halaman yang cocok diterjemahkan saat dimuat.
- Pengaturan berlaku pada tab yang sudah terbuka saat terjemahan berikutnya; tidak perlu memuat ulang.

## Cara kerjanya

```
DOM halaman
  └─ content script: mengumpulkan unit blok, menserialkan markup sebaris menjadi token <tN>/<vN/>
       └─ pemecah: 24 unit / 2400 karakter per permintaan
            └─ service worker: permintaan ke penyedia Anda (asal ekstensi, tanpa CORS)
                 └─ penyedia: JSON masuk, JSON keluar, ID dipertahankan
                      └─ validasi: token lengkap, seimbang, unik; ID cocok
                           └─ DOM: memakai ulang simpul asli, hanya menulis teks
                                └─ MutationObserver: menerjemahkan konten yang ditambahkan kemudian
```

Keputusan yang benar-benar penting:

- **Lalu lintas ke penyedia tidak pernah keluar dari konteks halaman.** Content script mengirim pesan `AIPT_FETCH`; service worker melakukan permintaan, sehingga endpoint dengan CORS ketat berfungsi apa adanya. Service worker juga memeriksa `sender.id`, jadi hanya ekstensi ini yang dapat memakainya sebagai proksi.
- **Prompt adalah kontrak, bukan harapan.** ID masuk, ID keluar; satu entri per segmen; tag tak tersentuh; angka, URL, kode, dan placeholder apa adanya; tanpa penjelasan tambahan. Jawaban dibaca berdasarkan ID, sehingga larik yang diurutkan ulang atau rusak sebagian gagal dengan aman alih-alih menggeser terjemahan.
- **Setiap bahasa punya panduan gayanya sendiri.** Panduan Persia, misalnya, menuntut urutan kata dan verba Persia (`بررسی کنید`, bukan `بررسی را انجام دهید`), melarang `می‌باشد`/`بایستی`/`گردید` bila kalimat biasa cukup, hanya menyisakan kata serapan asli dalam aksara Latin, serta memperbaiki tanda baca dan spasi lebar-nol. Contoh few-shot memperlihatkan target kepada model, bukan sekadar menjelaskannya.
- **Arah bersifat lokal.** Blok Persia, Arab, Ibrani, dan Urdu mendapat `dir="rtl"`, `<html>` mendapat bahasa target, dan sisa halaman mempertahankan geometri — membalik seluruh halaman merusak tata letak terpusat dan blok kode. Keduanya dipulihkan bersama teks asli.
- **Kegagalan terlihat dan terbatas.** Blok yang tak terbaca dipecah; unit yang tetap gagal bertahan dalam bahasa asli dan dilaporkan di bilah atas. Membatalkan saat penerjemahan berhenti bersih dan tidak meninggalkan DOM setengah tertulis.

Detail lebih lanjut: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Privasi dan izin

| Izin | Mengapa diperlukan |
|---|---|
| `storage` | Menyimpan pengaturan, kunci API, daftar istilah, dan preferensi per situs di `chrome.storage.local`. |
| `contextMenus` | Item klik kanan "Terjemahkan halaman / pilihan ini". |
| `tabs` | Mengirim pesan ke tab aktif dan membuka Opsi. |
| `activeTab` | Bertindak pada halaman yang Anda terjemahkan sendiri. |
| `<all_urls>` | Menyuntikkan content script ke halaman yang Anda kunjungi dan mengizinkan service worker memanggil endpoint yang Anda atur. |

- Kunci API hanya disimpan di penyimpanan lokal peramban ini dan hanya dikirim ke penyedia yang Anda pilih.
- Tanpa analitik, tanpa telemetri, tanpa kode jarak jauh, tanpa menghubungi server pengembang, tanpa akun.
- Semua teks ditulis dengan `textContent` / `createTextNode`; tidak ada `innerHTML`, `eval`, atau `new Function` di mana pun. Keluaran model hanya dapat mencapai halaman sebagai teks, dan atribut dibatasi pada daftar izin tetap — `href`, `src`, dan penangan peristiwa tidak pernah ditulis dari keluaran model.
- Preferensi per situs ditulis oleh satu penulis terserialisasi di service worker, sehingga dua tab tidak saling menimpa.
- Deteksi bahasa otomatis mengirim paling banyak 600 karakter sampel ke penyedia yang sama; memilih bahasa sumber secara manual menghapus permintaan itu sepenuhnya.

Kebijakan keamanan dan cara melaporkan kerentanan: [`SECURITY.md`](../../SECURITY.md).

## Batasan yang diketahui

- **Validasi token sengaja ketat.** Model yang terus merusak `<tN>` akan membiarkan paragraf itu dalam bahasa asli (dan memberitahukannya) daripada kehilangan tautan. Gunakan model yang mengikuti keluaran terstruktur; *Test connection* menguji kalimat bertoken.
- **Kualitas bergantung pada model.** Model lokal kecil dapat dipakai tetapi kurang lancar dibanding Gemini atau model kelas GPT; lapisan gaya membantu, tidak menambah pengetahuan.
- **Shadow root tertutup dan iframe lintas asal** di luar jangkauan ekstensi (keamanan peramban). Shadow root terbuka dan bingkai seasal ditangani.
- **Wadah campuran dengan teks lepas** (`<div>teks<p>…</p></div>`) kembali ke terjemahan per simpul untuk teks itu; halaman yang tertata baik tidak pernah mengalaminya.
- **Cache ada di memori** (per sesi tab). Memuat ulang halaman akan meminta teksnya lagi.
- **PDF tidak diterjemahkan**; penampil PDF bawaan tidak dapat dikendalikan skrip ekstensi.
- **Paket gratis berubah.** Batas laju dan nama model ditentukan penyedia, bukan ekstensi ini.

## Status proyek dan pengujian

Versi 1.3.1. Rangkaian otomatis mencakup lapisan DOM, prompt dan penguraian, bentuk permintaan tiap penyedia, perilaku mesin, dan antarmuka Opsi — **95 pengujian** — dan `npm run verify` menambahkan verifikasi 12 poin: sintaksis, rangkaian pengujian, larangan sink HTML, pemeriksaan kebocoran kunci, content script klasik, kesetaraan versi, cakupan CHANGELOG, dan pengemasan.

```bash
npm install       # hanya pengembangan: jsdom untuk pengujian DOM
npm test          # 95 pengujian
npm run bench     # tolok ukur pemecahan, tanpa kunci API
npm run verify    # sintaksis + pengujian + pemeriksaan kebijakan + pengemasan
npm run package   # menyalin hanya berkas yang dapat didistribusikan ke dist/
npm run release   # dist + release/*.zip, *.crx, *.pem untuk distribusi
```

Tolok ukur mengukur pemecahan, bukan kualitas terjemahan: pada empat halaman contoh, pengumpul simpul teks independen menghasilkan **108 fragmen** sementara pengumpul blok menghasilkan **63 unit** (1,7 kali lebih sedikit secara keseluruhan, **2,5 kali** pada artikel berita), dan fragmen di bawah 25 karakter turun dari **81 menjadi 34**. Kualitas terjemahan sendiri tetap bergantung pada model yang Anda hubungkan; daftar periksa manual di [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) mencakup perilaku tingkat peramban yang tidak terjangkau pengujian otomatis (render RTL, tooltip, lalu lintas SPA nyata, kesalahan penyedia).

CI menjalankan `npm run verify` dan `npm run bench` pada Node 20 dan 22 untuk setiap push dan pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Struktur proyek

```
manifest.json                 Manifest V3: izin, content script, pintasan
background/
  service-worker.js           menu, pintasan, perutean pesan, keep-alive
  fetch-utils.js              proksi fetch penyedia: pemeriksaan URL/header, batas waktu, jenis kesalahan
  site-prefs.js               baca-ubah-tulis terserialisasi untuk preferensi per situs
content/
  languages.js                22 bahasa, bawaan, nama tampilan
  providers.js                prompt, panduan gaya, penguraian JSON, normalisasi, Gemini/OpenAI/Ollama
  translation-engine.js       cache, pemecahan, konkurensi, percobaan ulang, pembelahan, pemeriksaan kualitas
  dom-processor.js            unit blok, token, penerapan tervalidasi, pemulihan persis, arah
  content-script.js           orkestrasi, status, perpesanan, terjemahan otomatis
  styles.css                  dua aturan yang benar-benar dibutuhkan RTL
popup/                        pemilih bahasa, terjemahkan/pulihkan, kemajuan, kesalahan
options/                      penyedia, kunci, model, gaya, kualitas, daftar istilah, preferensi situs
icons/                        ikon 16/48/128 px
docs/i18n/                    terjemahan README ini, satu berkas per bahasa
tests/  scripts/  bench/      hanya pengembangan — tidak pernah dimuat ekstensi
```

## Berkontribusi

Issue dan pull request diterima. Sebelum mengirim perubahan, jalankan `npm run verify`; jaga ekstensi tetap tanpa build, pertahankan lalu lintas penyedia di service worker, dan jangan pernah memasukkan `innerHTML`. Jika mengubah prompt, tambahkan atau perbarui pengujian: prompt, pengurai, dan penormalisasi diuji bersama karena hanya bekerja sebagai satu kesatuan.

Baca [`CONTRIBUTING.md`](../../CONTRIBUTING.md) untuk aturan lengkap, kebijakan terjemahan `docs/i18n/`, dan konvensi commit.

## Lisensi

MIT — lihat [`LICENSE`](../../LICENSE). Layanan pihak ketiga yang Anda hubungkan (Gemini, OpenRouter, Ollama…) memiliki syarat dan harga sendiri.
