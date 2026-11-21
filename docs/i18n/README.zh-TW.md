<img src="../../icons/icon-128.png" width="88" align="right" alt="AI Page Translator 圖示">

# AI Page Translator — 用你自己的 AI 翻譯網頁

**用你選擇的 AI 服務，把任何網頁翻譯成你的語言——沒有後端、沒有帳號、沒有追蹤，也不按字數收費。**

`Manifest V3` · `無需建置` · `原生 JavaScript` · `版本 1.3.1` · `22 種語言`

本檔案是[英文權威 README](README.md) 的繁體中文譯本。如有出入，以英文原文為準。

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · **中文繁體** · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator 是一款適用於 **Brave** 及其他 Chromium 瀏覽器的擴充功能。服務由你自備：免費的 Google Gemini 金鑰、任何相容於 OpenAI 的介面（OpenRouter、Groq、NVIDIA、OpenAI…），或透過 **Ollama** 執行的完全本機模型。擴充功能會在原位置翻譯你正在閱讀的頁面，並保留其版面、連結與格式。

所有文字都不會經過任何翻譯服務。API 金鑰不會離開你的瀏覽器，沒有任何分析統計；使用 Ollama 時，文字甚至不會離開你的電腦。

> **狀態：** 版本 1.3.1 · 95 項自動化測試 · 12 項檢查 · 無遙測、無遠端程式碼。

---

## 為什麼還需要另一個翻譯工具？

大多數網頁翻譯工具一次只送出一句話。結果因此像一疊句子而不是一個頁面：上下文流失、術語前後不一、連結把句子切成兩半，目標語言還繼承了來源語言的語序。

這個擴充功能翻譯的是**區塊**，而不是文字節點：

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

整個區塊當作一個單位送出，行內標記換成編號符記：

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` 代表屬於這句話的行內內容（連結、強調、span），`<vN/>` 代表絕不能被翻譯的內容（程式碼、圖片、表單控制項、小工具）。模型可以移動符記，因此能**圍繞**連結建構自然的目標語言句子，而不被英文語序綁住。

回傳時，答案會先驗證再碰觸頁面。每個符記都必須存在、成對且唯一；遺失連結的譯文會被拒絕，以更嚴格的指令重試一次，仍不合格就維持原樣。頁面原有元素節點會被重複使用，因此 `href`、事件監聽器與巢狀標記都能保留。「顯示原文」會還原完全相同的原始節點。

## 功能

- **整頁原地翻譯** — 標題、段落、清單、表格、圖說與按鈕。
- **保留連結與行內格式** — 以符記驗證；遺失的連結絕不會被默默套用。
- **自然或直譯風格** — *自然*（預設）像母語作者一樣改寫；*直譯*在技術頁面上貼近原文措辭。
- **各語言專屬風格指南** — 為波斯語、阿拉伯語、烏爾都語與希伯來語提供專門指引，並為其餘 18 種語言提供通用指南。
- **確定性的排版修正** — 波斯語 `ی`/`ک`、`می`/`ها`/`تر` 中的零寬空格，以及 `، ؛ ؟`，即使模型出錯也會被修正。
- **可選的品質複核** — 把每個片段當成 {原文, 譯文} 配對來讀，因此能修正語意，而不只是措辭。
- **術語表** — 模型必須遵守的「術語 → 譯文」對照。
- **受保護內容** — `<pre>`、`<code>`、網址、電子郵件、`translate="no"`、`contenteditable`、SVG、表單控制項以及擴充功能自身介面永遠不會被送出。
- **屬性標籤** — `alt`、`title`、`placeholder` 與 `aria-label` 走獨立通道，讀起來像標籤而不是段落。
- **動態頁面** — 無限捲動或單頁應用程式新增的內容一出現就翻譯，不會形成觀察器無窮迴圈。
- **正確處理由右至左** — `dir` 加在每個已翻譯區塊上，`lang` 加在 `<html>` 上，不翻轉整個頁面；所有變更都可還原。
- **依網站記憶** — 記住每個網域的目標語言，並可在載入時自動翻譯。
- **任何有 API 的服務** — Gemini、Ollama 以及任何相容於 OpenAI 的介面，都由 service worker 呼叫，因此沒有 CORS 問題。
- **記憶體快取、重試與分割** — 相同文字只送出一次；失敗的區塊會被分割而不是讓整頁失敗；429/5xx 以遞增等待重試。
- **零建置步驟** — 一般傳統指令碼，原樣載入。

## 支援的語言

共 22 種目標語言，每種都把母語名稱寫進提示詞，模型不會把 `zh-TW` 和 `zh-CN`、波斯語和阿拉伯語搞混：

| 語言 | 母語名稱 | 方向 |
|---|---|---|
| 英語 | English | 由左至右 |
| 波斯語 | فارسی | 由右至左 |
| 阿拉伯語 | العربية | 由右至左 |
| 希伯來語 | עברית | 由右至左 |
| 烏爾都語 | اردو | 由右至左 |
| 西班牙語 | Español | 由左至右 |
| 法語 | Français | 由左至右 |
| 德語 | Deutsch | 由左至右 |
| 簡體中文 | 中文简体 | 由左至右 |
| 繁體中文 | 中文繁體 | 由左至右 |
| 俄語 | Русский | 由左至右 |
| 土耳其語 | Türkçe | 由左至右 |
| 義大利語 | Italiano | 由左至右 |
| 葡萄牙語 | Português | 由左至右 |
| 荷蘭語 | Nederlands | 由左至右 |
| 波蘭語 | Polski | 由左至右 |
| 越南語 | Tiếng Việt | 由左至右 |
| 泰語 | ไทย | 由左至右 |
| 印地語 | हिन्दी | 由左至右 |
| 印尼語 | Bahasa Indonesia | 由左至右 |
| 日語 | 日本語 | 由左至右 |
| 韓語 | 한국어 | 由左至右 |

由右至左的語言（波斯語、阿拉伯語、希伯來語、烏爾都語）以區塊為單位處理方向，頁面其餘部分維持原有幾何配置。

## 安裝

1. 下載這個儲存庫（**Code → Download ZIP** 或 `git clone`）並保留資料夾。
2. 開啟 `brave://extensions`（或 `chrome://extensions`）。
3. 開啟**開發人員模式**。
4. 點選 **Load unpacked**，選擇這個資料夾（包含 `manifest.json` 的那個）。
5. 若希望一鍵開啟彈出視窗，請釘選這個擴充功能。

沒有建置、安裝或打包步驟。擴充功能只讀取 `manifest.json` 中列出的檔案；`tests/`、`scripts/`、`bench/`、`docs/` 與 `.github/` 僅供開發使用，永遠不會被載入。

需要較新的 Chromium 瀏覽器。瀏覽器開放 API 時（Chromium 119+）會翻譯封閉的 shadow root；其餘功能在舊版本上同樣可用。

## 分享給其他人

`npm run release` 會建置安裝包，並把檔案放進 `release/`（該目錄被 git 忽略）：

| 檔案 | 是什麼 | 如何安裝 |
|---|---|---|
| `page-translator-ai-<version>.zip` | 完整擴充功能，約 95 KB，內含 `INSTALL.txt` | 解壓縮 → **Load unpacked**；也是應用程式商店接受的檔案 |
| `page-translator-ai-<version>.crx` | 已簽章安裝包 | 拖到 `brave://extensions`，前提是允許商店外安裝 |
| `page-translator-ai-signing-key.pem` | 簽章金鑰 | 絕不要分享；`npm run release` 會重複使用它，使擴充功能 ID 在更新之間保持不變 |

所以你交給別人的是一個檔案，安裝步驟就在裡面。

**一個誠實的限制：**瀏覽器擴充功能是使用者端程式碼。任何安裝它的人都能讀到這些檔案——`.crx` 是簽章的 zip，未打包的擴充功能就是普通資料夾。任何打包或混淆都改變不了這點；壓縮只會拖慢閱讀，而商店政策禁止混淆。如果原始碼必須保密，唯一實際的選擇是把提示詞與服務呼叫移到自己控制的伺服器，但這會放棄「自備金鑰、無後端」的設計。

若要在不提供儲存庫的情況下散布，請把 zip 發布為 Chrome 線上應用程式商店的**私人或非公開**項目；這是非技術使用者一鍵安裝的唯一途徑。

## 設定服務供應商

擴充功能彈出視窗 → **Options & settings**，或 `brave://extensions` → 詳細資料 → 擴充功能選項。

| 供應商 | 介面 | 金鑰 | 說明 |
|---|---|---|---|
| **Ollama**（本機） | `http://localhost:11434` | 不需要 | 免費且完全私密。從 [ollama.com](https://ollama.com) 安裝，然後執行 `ollama run llama3`。若回應 403，請以 `OLLAMA_ORIGINS=chrome-extension://*` 重新啟動。 |
| **Google Gemini** | `generativelanguage.googleapis.com` | 來自 [AI Studio](https://aistudio.google.com/app/apikey) 的免費金鑰 | 使用目前的模型 ID，例如 `gemini-2.5-flash`。免費額度會變動，請查看 Google 的模型清單。 |
| **相容於 OpenAI** | 你的介面，例如 `https://openrouter.ai/api/v1`、`https://api.groq.com/openai/v1`、`https://integrate.api.nvidia.com/v1` | 供應商金鑰 | 任何支援 `/chat/completions` 的服務。介面中的模型建議只是範例，請使用供應商目錄中的確切 ID。 |

然後：

1. 選擇**預設目標語言**。
2. 選擇**翻譯風格**：*Natural*（建議）或 *Literal*。
3. 可選：開啟 **Quality mode** 並新增**術語表**項目，每行一筆（`術語 → 譯文`；也支援 `->`、`=>`、`=` 與 TAB）。
4. 把**來源語言**設為 *Auto-detect* 或手動選擇。
5. 點選 **Test connection**，再點 **Save settings**。

供應商說明：

- **Gemini 的思考設定依模型世代選擇。**2.5 Flash 與 Flash-Lite 關閉思考，2.5 Pro 使用最低預算（128），3.x/4.x 使用低等級。若模型拒絕該設定，請求會在沒有該設定的情況下重試一次。
- **Ollama** 以 8192 個符記的上下文視窗呼叫；訓練上下文更小的模型仍會截斷長頁面，因此頁面會被切成小單位。
- **免費額度**會限速。擴充功能會等待並重試，絕不會默默丟棄文字。

## 使用方式

- 點選圖示 → 選擇語言 → **Translate this page**。
- 隨時切換 **Show original / Show translation**；還原不會有任何損失。
- 將滑鼠移到已翻譯段落上可查看原文。
- 按右鍵 → **Translate this page** 或 **Translate selection**。
- 鍵盤：`Ctrl+Shift+Y`（macOS 為 `Cmd+Shift+Y`）切換翻譯；可在瀏覽器的擴充功能快速鍵頁面重新綁定。
- 開啟 **Auto-translate** 並儲存網站偏好後，符合的頁面會在載入時自動翻譯。
- 設定會在下一次翻譯時套用到已開啟的分頁，無需重新載入。

## 運作原理

```
頁面 DOM
  └─ content script：收集區塊單位，把行內標記序列化為 <tN>/<vN/> 符記
       └─ 分塊器：每次請求 24 個單位 / 2400 個字元
            └─ service worker：向你的供應商發出請求（擴充功能來源，無 CORS）
                 └─ 供應商：JSON 進、JSON 出，ID 保持不變
                      └─ 驗證：符記完整、成對、唯一；ID 一致
                           └─ DOM：重複使用原有元素節點，只寫入文字
                                └─ MutationObserver：翻譯後來新增的內容
```

真正重要的設計選擇：

- **供應商流量絕不會從頁面上下文發出。**content script 送出 `AIPT_FETCH` 訊息，由 service worker 執行請求，因此 CORS 嚴格的介面也能原樣使用。service worker 也會檢查 `sender.id`，只有本擴充功能能把它當作代理。
- **提示詞是契約，不是願望。**ID 進、ID 出；每個片段一筆；標籤不可觸碰；數字、網址、程式碼與預留位置原樣保留；不添加解釋。回應依 ID 解析，因此順序被打亂或部分損毀的陣列會安全失敗，而不會讓譯文錯位。
- **每種語言都有自己的風格指南。**例如波斯語指南要求波斯語語序與動詞（`بررسی کنید`，而不是 `بررسی را انجام دهید`），在普通句子足夠時禁用 `می‌باشد`/`بایستی`/`گردید`，只保留真正的拉丁字母外來詞，並修正標點與零寬空格。few-shot 範例把目標展示給模型，而不只是描述。
- **方向是區域性的。**波斯語、阿拉伯語、希伯來語與烏爾都語區塊加上 `dir="rtl"`，`<html>` 加上目標語言，頁面其餘部分維持幾何配置——整頁翻轉曾破壞置中版面與程式碼區塊。兩者都會隨原文一起還原。
- **失敗可見且受控。**無法解析的區塊會被分割；仍失敗的單位保留原文並在頂部提示中回報。翻譯過程中取消會乾淨停止，不會留下寫了一半的 DOM。

更多細節：[`docs/translation-quality-design.md`](../translation-quality-design.md)。

## 隱私與權限

| 權限 | 為什麼需要 |
|---|---|
| `storage` | 在 `chrome.storage.local` 中儲存設定、API 金鑰、術語表與網站偏好。 |
| `contextMenus` | 右鍵選單「翻譯此頁面 / 選取範圍」。 |
| `tabs` | 向目前分頁送出訊息並開啟選項頁。 |
| `activeTab` | 只在你明確翻譯的頁面上操作。 |
| `<all_urls>` | 向造訪的頁面注入 content script，並允許 service worker 呼叫你設定的介面。 |

- API 金鑰只保存在本瀏覽器的本機儲存空間，只會傳送給你選擇的供應商。
- 沒有分析統計、沒有遙測、沒有遠端程式碼、不回傳開發者伺服器、沒有帳號。
- 所有文字都以 `textContent` / `createTextNode` 寫入；擴充功能中不存在 `innerHTML`、`eval` 或 `new Function`。模型輸出只能以文字形式到達頁面，屬性被限制在固定白名單內——`href`、`src` 與事件處理常式絕不會由模型輸出寫入。
- 網站偏好由 service worker 中唯一的序列化寫入器寫入，兩個分頁不會互相覆蓋。
- 自動語言偵測最多向同一供應商送出 600 個字元的樣本；手動選擇來源語言即可完全取消該請求。

安全政策與漏洞回報：[`SECURITY.md`](../../SECURITY.md)。

## 已知限制

- **符記驗證刻意嚴格。**總是破壞 `<tN>` 的模型會讓那些段落保留原文（並說明），而不是遺失連結。請使用遵守結構化輸出的模型；*Test connection* 會用帶符記的句子測試。
- **品質取決於模型。**小型本機模型可用，但不如 Gemini 或 GPT 等級模型流暢；風格層有幫助，但不會增加知識。
- **封閉的 shadow root 與跨來源 iframe** 超出擴充功能的能力（瀏覽器安全限制）。開放的 shadow root 與同來源框架可以處理。
- **含散落文字的混合容器**（`<div>文字<p>…</p></div>`）會對那段散落文字退回逐節點翻譯；結構良好的頁面不會遇到。
- **快取位於記憶體中**（每個分頁工作階段）。重新載入頁面會重新請求文字。
- **PDF 不會被翻譯**；內建 PDF 檢視器無法被擴充功能指令碼控制。
- **免費額度會變動。**速率限制與模型名稱由供應商決定，而不是本擴充功能。

## 專案狀態與測試

版本 1.3.1。自動化測試涵蓋 DOM 層、提示詞與解析、各供應商請求格式、引擎行為與選項介面——**95 項測試**——`npm run verify` 另加 12 項檢查：語法、測試套件、HTML 注入點禁令、金鑰外洩檢查、傳統 content script、版本一致性、CHANGELOG 覆蓋與打包。

```bash
npm install       # 僅開發：用於 DOM 測試的 jsdom
npm test          # 95 項測試
npm run bench     # 分塊基準，無需 API 金鑰
npm run verify    # 語法 + 測試 + 政策檢查 + 打包檢查
npm run package   # 只把可散布檔案複製到 dist/
npm run release   # 產生 dist 與 release/*.zip、*.crx、*.pem 供散布
```

基準測的是分塊，不是翻譯品質：在四個範例頁面上，獨立的文字節點收集器產生 **108 個片段**，而區塊收集器產生 **63 個單位**（整體少 1.7 倍，新聞文章上少 **2.5 倍**），短於 25 個字元的片段從 **81 降到 34**。翻譯品質本身仍取決於你接入的模型；自動化測試無法涵蓋的瀏覽器層級行為（RTL 呈現、提示氣泡、真實 SPA 流量、供應商錯誤）見 [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) 中的人工清單。

CI 在每次 push 與 pull request 時，於 Node 20 與 22 上執行 `npm run verify` 與 `npm run bench`（[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)）。

## 專案結構

```
manifest.json                 Manifest V3：權限、content script、快速鍵
background/
  service-worker.js           選單、快速鍵、訊息路由、keep-alive
  fetch-utils.js              供應商 fetch 代理：URL/標頭檢查、逾時、錯誤類型
  site-prefs.js               依網站序列化的讀-改-寫
content/
  languages.js                22 種語言、預設值、顯示名稱
  providers.js                提示詞、風格指南、JSON 解析、正規化、Gemini/OpenAI/Ollama
  translation-engine.js       快取、分塊、並行、重試、二分分割、品質複核
  dom-processor.js            區塊單位、符記、驗證後套用、精確還原、方向
  content-script.js           協調、狀態、訊息傳遞、自動翻譯
  styles.css                  RTL 真正需要的那兩條規則
popup/                       語言選擇、翻譯/還原、進度、錯誤
options/                     供應商、金鑰、模型、風格、品質、術語表、網站偏好
icons/                       16/48/128 像素圖示
docs/i18n/                   本 README 的各語言譯本，每種語言一個檔案
tests/  scripts/  bench/      僅供開發——擴充功能從不載入
```

## 參與貢獻

歡迎提交 issue 與 pull request。送出變更前請執行 `npm run verify`；保持擴充功能無需建置、供應商流量留在 service worker 中，並且絕不引入 `innerHTML`。如果修改提示詞，請新增或更新測試：提示詞、解析器與正規化器一起測試，因為它們只有作為一個整體才能運作。

完整規則、`docs/i18n/` 的翻譯政策與提交慣例見 [`CONTRIBUTING.md`](../../CONTRIBUTING.md)。

## 授權條款

MIT — 見 [`LICENSE`](../../LICENSE)。你連接的第三方服務（Gemini、OpenRouter、Ollama…）有自己的條款與價格。
