<img src="../../icons/icon-128.png" width="88" align="right" alt="Biểu tượng AI Page Translator">

# AI Page Translator — dịch web bằng AI của riêng bạn

**Dịch bất kỳ trang web nào sang ngôn ngữ của bạn bằng nhà cung cấp AI bạn chọn — không máy chủ, không tài khoản, không theo dõi và không tính phí theo từng từ.**

`Manifest V3` · `Không cần build` · `JavaScript thuần` · `phiên bản 1.3.1` · `22 ngôn ngữ`

Tệp này là bản dịch tiếng Việt của [README gốc bằng tiếng Anh](README.md). Nếu có khác biệt, bản tiếng Anh là chuẩn.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · **Tiếng Việt** · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator là tiện ích trình duyệt cho **Brave** và các trình duyệt khác dựa trên Chromium. Bạn tự mang nhà cung cấp: khóa Google Gemini miễn phí, bất kỳ điểm cuối tương thích OpenAI nào (OpenRouter, Groq, NVIDIA, OpenAI…), hoặc một mô hình hoàn toàn cục bộ qua **Ollama**. Tiện ích dịch trang bạn đang đọc ngay tại chỗ, giữ nguyên bố cục, liên kết và định dạng.

Không có văn bản nào đi qua dịch vụ dịch trung gian. Khóa API không rời khỏi trình duyệt, không có công cụ phân tích nào, và với Ollama thì văn bản thậm chí không rời khỏi máy của bạn.

> **Trạng thái:** phiên bản 1.3.1 · 95 bài kiểm thử tự động · bước xác minh 12 điểm · không telemetry, không mã từ xa.

---

## Vì sao cần một trình dịch khác?

Hầu hết trình dịch trang gửi từng câu một. Vì thế kết quả đọc như một chồng câu chứ không phải một trang: mất ngữ cảnh, thuật ngữ thay đổi, liên kết cắt đôi câu, và ngôn ngữ đích thừa hưởng trật tự từ của ngôn ngữ nguồn.

Tiện ích này dịch **khối**, không phải nút văn bản:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Cả khối được gửi như một đơn vị, phần đánh dấu nội tuyến được thay bằng token đánh số:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` đánh dấu nội dung nội tuyến thuộc câu (liên kết, nhấn mạnh, span), còn `<vN/>` đánh dấu nội dung không bao giờ được dịch (mã, hình ảnh, điều khiển biểu mẫu, widget). Mô hình được phép di chuyển token, nên có thể dựng câu tự nhiên **quanh** liên kết thay vì bị kẹt vào trật tự tiếng Anh.

Khi trả về, câu trả lời được kiểm tra trước khi chạm vào trang. Mọi token phải có mặt, cân bằng và duy nhất; bản dịch làm mất liên kết bị từ chối, thử lại một lần với chỉ dẫn chặt hơn, và nếu vẫn sai thì giữ nguyên. Các nút gốc được dùng lại, nên `href`, trình lắng nghe sự kiện và đánh dấu lồng nhau vẫn sống. "Hiện bản gốc" khôi phục đúng các nút ban đầu.

## Tính năng

- **Dịch toàn trang tại chỗ** — tiêu đề, đoạn văn, danh sách, bảng, chú thích và nút.
- **Giữ liên kết và định dạng nội tuyến** — có kiểm tra token; liên kết bị mất không bao giờ được áp dụng âm thầm.
- **Phong cách tự nhiên hoặc sát nghĩa** — *Tự nhiên* (mặc định) viết lại như một tác giả bản ngữ; *Sát nghĩa* bám sát câu chữ gốc ở trang kỹ thuật.
- **Hướng dẫn phong cách theo ngôn ngữ** — hướng dẫn riêng cho tiếng Ba Tư, Ả Rập, Urdu và Hebrew, cùng hướng dẫn chung cho 18 ngôn ngữ còn lại.
- **Sửa kiểu chữ mang tính xác định** — `ی`/`ک` tiếng Ba Tư, dấu cách không độ rộng trong `می`/`ها`/`تر` và `، ؛ ؟` được sửa cả khi mô hình sai.
- **Lượt kiểm tra chất lượng tùy chọn** — đọc từng đoạn như cặp {nguồn, bản dịch}, nên sửa được nghĩa chứ không chỉ câu chữ.
- **Bảng thuật ngữ** — các cặp "thuật ngữ → bản dịch" mà mô hình phải tuân theo.
- **Nội dung được bảo vệ** — `<pre>`, `<code>`, URL, email, `translate="no"`, `contenteditable`, SVG, điều khiển biểu mẫu và giao diện của chính tiện ích không bao giờ được gửi.
- **Nhãn thuộc tính** — `alt`, `title`, `placeholder` và `aria-label` đi qua kênh riêng và đọc như nhãn, không như đoạn văn.
- **Trang động** — nội dung mới từ cuộn vô hạn hoặc SPA được dịch ngay khi xuất hiện, không tạo vòng lặp quan sát.
- **Phải sang trái đúng cách** — `dir` trên từng khối đã dịch, `lang` trên `<html>`, không lật cả trang; mọi thứ được khôi phục.
- **Ghi nhớ theo trang** — nhớ ngôn ngữ đích theo tên miền và có thể tự động dịch khi tải.
- **Bất kỳ API nào** — Gemini, Ollama và mọi điểm cuối tương thích OpenAI, gọi từ service worker nên không gặp vấn đề CORS.
- **Bộ nhớ đệm, thử lại và chia nhỏ** — văn bản trùng chỉ gửi một lần; khối lỗi được chia nhỏ thay vì làm hỏng trang; 429/5xx được thử lại với thời gian chờ tăng dần.
- **Không cần build** — script cổ điển thuần, tải nguyên trạng.

## Ngôn ngữ hỗ trợ

Hai mươi hai ngôn ngữ đích, mỗi ngôn ngữ có tên bản ngữ trong prompt để mô hình không nhầm `zh-TW` với `zh-CN` hay tiếng Ba Tư với tiếng Ả Rập:

| Ngôn ngữ | Tên bản ngữ | Hướng |
|---|---|---|
| Tiếng Anh | English | trái sang phải |
| Tiếng Ba Tư | فارسی | phải sang trái |
| Tiếng Ả Rập | العربية | phải sang trái |
| Tiếng Hebrew | עברית | phải sang trái |
| Tiếng Urdu | اردو | phải sang trái |
| Tiếng Tây Ban Nha | Español | trái sang phải |
| Tiếng Pháp | Français | trái sang phải |
| Tiếng Đức | Deutsch | trái sang phải |
| Tiếng Trung giản thể | 中文简体 | trái sang phải |
| Tiếng Trung phồn thể | 中文繁體 | trái sang phải |
| Tiếng Nga | Русский | trái sang phải |
| Tiếng Thổ Nhĩ Kỳ | Türkçe | trái sang phải |
| Tiếng Ý | Italiano | trái sang phải |
| Tiếng Bồ Đào Nha | Português | trái sang phải |
| Tiếng Hà Lan | Nederlands | trái sang phải |
| Tiếng Ba Lan | Polski | trái sang phải |
| Tiếng Việt | Tiếng Việt | trái sang phải |
| Tiếng Thái | ไทย | trái sang phải |
| Tiếng Hindi | हिन्दी | trái sang phải |
| Tiếng Indonesia | Bahasa Indonesia | trái sang phải |
| Tiếng Nhật | 日本語 | trái sang phải |
| Tiếng Hàn | 한국어 | trái sang phải |

Các ngôn ngữ phải sang trái (Ba Tư, Ả Rập, Hebrew, Urdu) nhận hướng theo từng khối; phần còn lại của trang giữ nguyên hình học.

## Cài đặt

1. Tải kho lưu trữ này (**Code → Download ZIP** hoặc `git clone`) và giữ thư mục.
2. Mở `brave://extensions` (hoặc `chrome://extensions`).
3. Bật **Developer mode**.
4. Bấm **Load unpacked** và chọn thư mục này (thư mục chứa `manifest.json`).
5. Ghim tiện ích nếu muốn mở popup bằng một cú nhấp.

Không có bước build, cài đặt hay đóng gói. Tiện ích chỉ đọc các tệp liệt kê trong `manifest.json`; `tests/`, `scripts/`, `bench/`, `docs/` và `.github/` chỉ dành cho phát triển và không bao giờ được tải.

Cần trình duyệt Chromium mới. Shadow root đóng được dịch khi trình duyệt mở API (Chromium 119+); phần còn lại vẫn chạy trên phiên bản cũ hơn.

## Chia sẻ với người khác

`npm run release` tạo gói và đặt tệp trong `release/` (thư mục bị git bỏ qua):

| Tệp | Là gì | Cách cài |
|---|---|---|
| `page-translator-ai-<version>.zip` | toàn bộ tiện ích, khoảng 95 KB, có `INSTALL.txt` bên trong | giải nén → **Load unpacked**; cũng là tệp cửa hàng chấp nhận |
| `page-translator-ai-<version>.crx` | gói đã ký | kéo vào `brave://extensions`, nơi cho phép cài ngoài cửa hàng |
| `page-translator-ai-signing-key.pem` | khóa ký | đừng bao giờ chia sẻ; `npm run release` dùng lại khóa này để ID tiện ích không đổi qua các bản cập nhật |

Vậy thứ bạn đưa cho người khác là một tệp, và bên trong đã có các bước cài đặt.

**Một giới hạn trung thực:** tiện ích trình duyệt là mã phía máy khách. Ai cài cũng đọc được các tệp đó — `.crx` là một zip đã ký và tiện ích chưa đóng gói là một thư mục thường. Không cách đóng gói hay làm rối mã nào thay đổi điều đó; thu nhỏ chỉ làm chậm người đọc và chính sách cửa hàng cấm làm rối. Nếu mã nguồn thực sự phải giữ bí mật, lựa chọn hợp lý duy nhất là chuyển prompt và các lệnh gọi nhà cung cấp sang máy chủ do bạn kiểm soát — đồng nghĩa từ bỏ thiết kế "khóa của bạn, không máy chủ".

Để phân phối mà không đưa kho lưu trữ, hãy phát hành zip dưới dạng mục **riêng tư hoặc không công khai** trên Chrome Web Store; đó là cách duy nhất để người không chuyên cài bằng một cú nhấp.

## Cấu hình nhà cung cấp

Popup tiện ích → **Options & settings**, hoặc `brave://extensions` → Chi tiết → Tùy chọn tiện ích.

| Nhà cung cấp | Điểm cuối | Khóa | Ghi chú |
|---|---|---|---|
| **Ollama** (cục bộ) | `http://localhost:11434` | không cần | Miễn phí và hoàn toàn riêng tư. Cài từ [ollama.com](https://ollama.com), rồi chạy `ollama run llama3`. Nếu trả về 403, khởi động lại với `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | khóa miễn phí từ [AI Studio](https://aistudio.google.com/app/apikey) | Dùng ID mô hình hiện hành, ví dụ `gemini-2.5-flash`. Hạn mức miễn phí thay đổi; xem danh sách mô hình của Google. |
| **Tương thích OpenAI** | điểm cuối của bạn, ví dụ `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | khóa của nhà cung cấp | Bất kỳ dịch vụ nào nói `/chat/completions`. Mô hình gợi ý trong giao diện chỉ là ví dụ — dùng đúng ID trong danh mục của nhà cung cấp. |

Sau đó:

1. Chọn **ngôn ngữ đích mặc định**.
2. Chọn **phong cách dịch**: *Natural* (khuyến nghị) hoặc *Literal*.
3. Nếu muốn, bật **Quality mode** và thêm mục **bảng thuật ngữ**, mỗi dòng một mục (`thuật ngữ → bản dịch`; `->`, `=>`, `=` và TAB cũng được).
4. Để **ngôn ngữ nguồn** ở *Auto-detect* hoặc chọn thủ công.
5. Bấm **Test connection**, rồi **Save settings**.

Lưu ý về nhà cung cấp:

- **Cài đặt suy luận của Gemini được chọn theo thế hệ mô hình.** 2.5 Flash và Flash-Lite chạy không suy luận, 2.5 Pro dùng mức tối thiểu (128), 3.x/4.x dùng mức thấp. Nếu mô hình từ chối cài đặt, yêu cầu được thử lại một lần mà không có nó.
- **Ollama** được gọi với cửa sổ ngữ cảnh 8192 token; mô hình huấn luyện với ít hơn vẫn sẽ cắt trang dài — vì vậy trang được chia thành đơn vị nhỏ.
- **Hạn mức miễn phí** giới hạn tốc độ. Tiện ích chờ và thử lại; không bao giờ bỏ văn bản một cách âm thầm.

## Cách dùng

- Nhấp biểu tượng → chọn ngôn ngữ → **Translate this page**.
- **Show original / Show translation** bất cứ lúc nào; khôi phục không mất gì.
- Rê chuột lên đoạn đã dịch để xem bản gốc.
- Nhấp chuột phải → **Translate this page** hoặc **Translate selection**.
- Bàn phím: `Ctrl+Shift+Y` (`Cmd+Shift+Y` trên macOS) bật/tắt dịch; đổi được ở trang phím tắt của trình duyệt.
- Bật **Auto-translate** và đã lưu tùy chọn trang thì các trang khớp sẽ tự động dịch khi tải.
- Cài đặt áp dụng cho tab đang mở ở lần dịch tiếp theo; không cần tải lại.

## Cách hoạt động

```
DOM của trang
  └─ content script: thu thập đơn vị khối, tuần tự hóa đánh dấu nội tuyến thành token <tN>/<vN/>
       └─ bộ chia: 24 đơn vị / 2400 ký tự mỗi yêu cầu
            └─ service worker: gửi yêu cầu tới nhà cung cấp (nguồn tiện ích, không CORS)
                 └─ nhà cung cấp: JSON vào, JSON ra, ID được giữ
                      └─ kiểm tra: token đầy đủ, cân bằng, duy nhất; ID khớp
                           └─ DOM: dùng lại nút gốc, chỉ ghi văn bản
                                └─ MutationObserver: dịch nội dung thêm vào sau
```

Những lựa chọn thực sự quan trọng:

- **Lưu lượng tới nhà cung cấp không bao giờ đi từ ngữ cảnh trang.** Content script gửi thông điệp `AIPT_FETCH`; service worker thực hiện yêu cầu, nên các điểm cuối CORS nghiêm ngặt vẫn chạy nguyên. Service worker cũng kiểm tra `sender.id`, nên chỉ tiện ích này dùng được nó làm proxy.
- **Prompt là hợp đồng, không phải điều ước.** ID vào, ID ra; một mục mỗi đoạn; thẻ bất khả xâm phạm; số, URL, mã và placeholder giữ nguyên; không thêm giải thích. Câu trả lời được đọc theo ID, nên mảng bị đảo thứ tự hay hỏng một phần sẽ thất bại an toàn thay vì làm lệch bản dịch.
- **Mỗi ngôn ngữ có hướng dẫn phong cách riêng.** Ví dụ hướng dẫn tiếng Ba Tư yêu cầu trật tự từ và động từ tiếng Ba Tư (`بررسی کنید`, không phải `بررسی را انجام دهید`), cấm `می‌باشد`/`بایستی`/`گردید` ở nơi câu thường là đủ, chỉ giữ từ vay thật trong bảng chữ Latinh và sửa dấu câu cùng dấu cách không độ rộng. Ví dụ few-shot cho mô hình thấy đích đến chứ không chỉ mô tả.
- **Hướng là cục bộ.** Khối Ba Tư, Ả Rập, Hebrew và Urdu nhận `dir="rtl"`, `<html>` nhận ngôn ngữ đích, phần còn lại giữ hình học — lật cả trang từng làm hỏng bố cục căn giữa và khối mã. Cả hai đều được khôi phục cùng văn bản gốc.
- **Lỗi hiện ra và được giới hạn.** Khối không đọc được sẽ bị chia; đơn vị vẫn lỗi sẽ ở lại ngôn ngữ gốc và được báo trên dải thông báo. Hủy giữa chừng dừng sạch, không để lại DOM viết dở.

Chi tiết thêm: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Quyền riêng tư và quyền truy cập

| Quyền | Vì sao cần |
|---|---|
| `storage` | Lưu cài đặt, khóa API, bảng thuật ngữ và tùy chọn theo trang trong `chrome.storage.local`. |
| `contextMenus` | Mục chuột phải "Dịch trang / phần đã chọn". |
| `tabs` | Gửi thông điệp tới tab đang hoạt động và mở Tùy chọn. |
| `activeTab` | Chỉ tác động lên trang bạn chủ động dịch. |
| `<all_urls>` | Chèn content script vào trang bạn truy cập và cho phép service worker gọi điểm cuối đã cấu hình. |

- Khóa API chỉ lưu trong bộ nhớ cục bộ của trình duyệt này và chỉ gửi tới nhà cung cấp bạn chọn.
- Không phân tích, không telemetry, không mã từ xa, không gọi về máy chủ nhà phát triển, không tài khoản.
- Mọi văn bản được ghi bằng `textContent` / `createTextNode`; không có `innerHTML`, `eval` hay `new Function` ở đâu cả. Đầu ra của mô hình chỉ đến trang dưới dạng văn bản, và thuộc tính bị giới hạn trong danh sách cho phép cố định — `href`, `src` và trình xử lý sự kiện không bao giờ được ghi từ đầu ra của mô hình.
- Tùy chọn theo trang do một bộ ghi tuần tự duy nhất trong service worker ghi, nên hai tab không đè lên nhau.
- Phát hiện ngôn ngữ tự động gửi tối đa 600 ký tự mẫu tới cùng nhà cung cấp; chọn ngôn ngữ nguồn thủ công sẽ bỏ hẳn yêu cầu đó.

Chính sách bảo mật và cách báo lỗ hổng: [`SECURITY.md`](../../SECURITY.md).

## Hạn chế đã biết

- **Kiểm tra token nghiêm ngặt có chủ đích.** Mô hình cứ làm hỏng `<tN>` sẽ để các đoạn đó ở ngôn ngữ gốc (và báo), thay vì làm mất liên kết. Dùng mô hình tuân thủ đầu ra có cấu trúc; *Test connection* thử một câu có token.
- **Chất lượng phụ thuộc mô hình.** Mô hình cục bộ nhỏ dùng được nhưng kém trôi chảy hơn Gemini hay các mô hình lớp GPT; lớp phong cách giúp ích, nhưng không thêm kiến thức.
- **Shadow root đóng và iframe cross-origin** nằm ngoài tầm với của tiện ích (bảo mật trình duyệt). Shadow root mở và khung cùng nguồn được xử lý.
- **Vùng chứa hỗn hợp có văn bản rời** (`<div>văn bản<p>…</p></div>`) quay về dịch từng nút cho phần văn bản đó; trang chuẩn không bao giờ gặp trường hợp này.
- **Bộ nhớ đệm nằm trong RAM** (theo phiên tab). Tải lại trang sẽ yêu cầu lại văn bản.
- **PDF không được dịch**; trình xem PDF tích hợp không cho tiện ích điều khiển bằng script.
- **Hạn mức miễn phí thay đổi.** Giới hạn tốc độ và tên mô hình do nhà cung cấp quyết định, không phải tiện ích này.

## Tình trạng dự án và kiểm thử

Phiên bản 1.3.1. Bộ kiểm thử tự động bao phủ lớp DOM, prompt và phân tích, hình dạng yêu cầu của từng nhà cung cấp, hành vi động cơ và giao diện Tùy chọn — **95 bài** — và `npm run verify` thêm bước kiểm tra 12 điểm: cú pháp, bộ kiểm thử, cấm điểm chèn HTML, rò rỉ khóa, content script cổ điển, đồng bộ phiên bản, độ phủ CHANGELOG và đóng gói.

```bash
npm install       # chỉ phát triển: jsdom cho kiểm thử DOM
npm test          # 95 bài kiểm thử
npm run bench     # đo phân đoạn, không cần khóa API
npm run verify    # cú pháp + kiểm thử + kiểm tra chính sách + đóng gói
npm run package   # chỉ sao chép tệp phân phối được vào dist/
npm run release   # dist + release/*.zip, *.crx, *.pem để phân phối
```

Phép đo đo phân đoạn, không đo chất lượng dịch: trên bốn trang mẫu, bộ thu nút văn bản độc lập tạo **108 mảnh** trong khi bộ thu khối tạo **63 đơn vị** (ít hơn 1,7 lần tổng thể, **2,5 lần** ở bài báo), và các mảnh dưới 25 ký tự giảm từ **81 xuống 34**. Chất lượng dịch vẫn phụ thuộc mô hình bạn kết nối; danh sách kiểm tra thủ công trong [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) bao phủ những gì kiểm thử tự động không với tới (hiển thị RTL, tooltip, lưu lượng SPA thật, lỗi nhà cung cấp).

CI chạy `npm run verify` và `npm run bench` trên Node 20 và 22 ở mỗi push và pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Cấu trúc dự án

```
manifest.json                 Manifest V3: quyền, content script, phím tắt
background/
  service-worker.js           menu, phím tắt, định tuyến thông điệp, keep-alive
  fetch-utils.js              proxy fetch tới nhà cung cấp: kiểm tra URL/header, thời gian chờ, loại lỗi
  site-prefs.js               đọc-sửa-ghi tuần tự cho tùy chọn theo trang
content/
  languages.js                22 ngôn ngữ, mặc định, tên hiển thị
  providers.js                prompt, hướng dẫn phong cách, phân tích JSON, chuẩn hóa, Gemini/OpenAI/Ollama
  translation-engine.js       bộ nhớ đệm, chia nhỏ, đồng thời, thử lại, chia đôi, lượt chất lượng
  dom-processor.js            đơn vị khối, token, áp dụng đã kiểm, khôi phục chính xác, hướng
  content-script.js           điều phối, trạng thái, nhắn tin, tự động dịch
  styles.css                  hai quy tắc RTL thực sự cần
popup/                        chọn ngôn ngữ, dịch/khôi phục, tiến trình, lỗi
options/                      nhà cung cấp, khóa, mô hình, phong cách, chất lượng, bảng thuật ngữ, tùy chọn trang
icons/                        biểu tượng 16/48/128 px
docs/i18n/                    bản dịch của README này, mỗi ngôn ngữ một tệp
tests/  scripts/  bench/      chỉ phát triển — tiện ích không bao giờ tải
```

## Đóng góp

Hoan nghênh issue và pull request. Trước khi gửi thay đổi, chạy `npm run verify`; giữ tiện ích không cần build, giữ lưu lượng nhà cung cấp trong service worker và đừng bao giờ đưa `innerHTML` vào. Nếu sửa prompt, hãy thêm hoặc cập nhật kiểm thử: prompt, bộ phân tích và bộ chuẩn hóa được kiểm thử cùng nhau vì chúng chỉ hoạt động như một bộ.

Đọc [`CONTRIBUTING.md`](../../CONTRIBUTING.md) để biết đầy đủ quy tắc, chính sách dịch của `docs/i18n/` và quy ước commit.

## Giấy phép

MIT — xem [`LICENSE`](../../LICENSE). Các dịch vụ bên thứ ba bạn kết nối (Gemini, OpenRouter, Ollama…) có điều khoản và giá riêng.
