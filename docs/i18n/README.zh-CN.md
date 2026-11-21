<img src="../../icons/icon-128.png" width="88" align="right" alt="AI Page Translator 图标">

# AI Page Translator — 用你自己的 AI 翻译网页

**用你选择的 AI 服务，把任何网页翻译成你的语言——没有后端、没有账号、没有追踪，也不按字数收费。**

`Manifest V3` · `无需构建` · `原生 JavaScript` · `版本 1.3.1` · `22 种语言`

本文件是[英文权威 README](README.md) 简体中文译本。如有出入，以英文原文为准。

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · **中文简体** · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator 是一款适用于 **Brave** 及其他 Chromium 浏览器的扩展。服务由你自带：免费的 Google Gemini 密钥、任何兼容 OpenAI 的接口（OpenRouter、Groq、NVIDIA、OpenAI…），或通过 **Ollama** 运行的完全本地模型。扩展会在原位置翻译你正在阅读的页面，并保留其排版、链接和格式。

所有文本都不会经过任何翻译服务。API 密钥不会离开你的浏览器，没有任何分析统计；使用 Ollama 时，文本甚至不会离开你的电脑。

> **状态：** 版本 1.3.1 · 95 项自动化测试 · 12 项检查 · 无遥测、无远程代码。

---

## 为什么还要另一个翻译器？

大多数网页翻译器一次只发送一句话。于是结果像一叠句子而不是一个页面：上下文丢失、术语前后不一、链接把句子劈成两半，目标语言还继承了源语言的语序。

本扩展翻译的是**块**，而不是文本节点：

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

整块作为一个单元发送，行内标记被替换为带编号的标记：

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` 表示属于这句话的行内内容（链接、强调、span），`<vN/>` 表示绝不能翻译的内容（代码、图片、表单控件、小部件）。模型可以移动标记，因此能**围绕**链接构造自然的目标语言句子，而不被英文语序束缚。

返回时，答案会先经过校验再触碰页面。每个标记必须存在、配对且唯一；丢失链接的译文会被拒绝，用更严格的指令重试一次，仍不合格就保持原样。页面原有元素节点会被复用，因此 `href`、事件监听器和嵌套标记都能保留。“显示原文”会恢复完全相同的原始节点。

## 功能

- **整页原地翻译** — 标题、段落、列表、表格、图注和按钮。
- **保留链接与行内格式** — 通过标记校验；丢失的链接绝不会被静默应用。
- **自然或直译风格** — *自然*（默认）像母语作者一样重写；*直译*在技术页面上贴近原文措辞。
- **按语言定制的风格指南** — 为波斯语、阿拉伯语、乌尔都语和希伯来语提供专门指导，并为其余 18 种语言提供通用指南。
- **确定性的排版修正** — 波斯语 `ی`/`ک`、`می`/`ها`/`تر` 中的零宽空格以及 `، ؛ ؟`，即使模型出错也会被修正。
- **可选的质量复核** — 把每个片段当作 {原文, 译文} 对来读，因此能修正含义，而不只是措辞。
- **术语表** — 模型必须遵守的“术语 → 译文”对照。
- **受保护内容** — `<pre>`、`<code>`、网址、邮箱、`translate="no"`、`contenteditable`、SVG、表单控件以及扩展自身界面永远不会被发送。
- **属性标签** — `alt`、`title`、`placeholder` 和 `aria-label` 走独立通道，读起来像标签而不是段落。
- **动态页面** — 无限滚动或单页应用新增的内容一出现就翻译，不会形成观察器死循环。
- **正确处理从右到左** — `dir` 加在每个已翻译块上，`lang` 加在 `<html>` 上，不翻转整页；所有改动都可还原。
- **按站点记忆** — 记住每个域名的目标语言，并可在加载时自动翻译。
- **任何有 API 的服务** — Gemini、Ollama 以及任何兼容 OpenAI 的接口，都由 service worker 调用，因此没有 CORS 问题。
- **内存缓存、重试与拆分** — 相同文本只发送一次；失败的块会被拆分而不是让整页失败；429/5xx 按递增等待重试。
- **零构建步骤** — 普通经典脚本，原样加载。

## 支持的语言

共 22 种目标语言，每种都把母语名称写进提示词，模型不会把 `zh-TW` 和 `zh-CN`、波斯语和阿拉伯语搞混：

| 语言 | 母语名称 | 方向 |
|---|---|---|
| 英语 | English | 从左到右 |
| 波斯语 | فارسی | 从右到左 |
| 阿拉伯语 | العربية | 从右到左 |
| 希伯来语 | עברית | 从右到左 |
| 乌尔都语 | اردو | 从右到左 |
| 西班牙语 | Español | 从左到右 |
| 法语 | Français | 从左到右 |
| 德语 | Deutsch | 从左到右 |
| 简体中文 | 中文简体 | 从左到右 |
| 繁体中文 | 中文繁體 | 从左到右 |
| 俄语 | Русский | 从左到右 |
| 土耳其语 | Türkçe | 从左到右 |
| 意大利语 | Italiano | 从左到右 |
| 葡萄牙语 | Português | 从左到右 |
| 荷兰语 | Nederlands | 从左到右 |
| 波兰语 | Polski | 从左到右 |
| 越南语 | Tiếng Việt | 从左到右 |
| 泰语 | ไทย | 从左到右 |
| 印地语 | हिन्दी | 从左到右 |
| 印度尼西亚语 | Bahasa Indonesia | 从左到右 |
| 日语 | 日本語 | 从左到右 |
| 韩语 | 한국어 | 从左到右 |

从右到左的语言（波斯语、阿拉伯语、希伯来语、乌尔都语）按块处理方向，页面其余部分保持原有几何布局。

## 安装

1. 下载此仓库（**Code → Download ZIP** 或 `git clone`）并保留该文件夹。
2. 打开 `brave://extensions`（或 `chrome://extensions`）。
3. 打开**开发者模式**。
4. 点击 **Load unpacked**，选择这个文件夹（包含 `manifest.json` 的那个）。
5. 如果希望一键打开弹窗，请固定该扩展。

没有构建、安装或打包步骤。扩展只读取 `manifest.json` 中列出的文件；`tests/`、`scripts/`、`bench/`、`docs/` 和 `.github/` 仅供开发使用，永远不会被加载。

需要较新的 Chromium 浏览器。浏览器开放 API 时（Chromium 119+）会翻译封闭 shadow root；其余功能在旧版本上同样可用。

## 分享给其他人

`npm run release` 会构建安装包，并把文件放进 `release/`（该目录被 git 忽略）：

| 文件 | 是什么 | 如何安装 |
|---|---|---|
| `page-translator-ai-<version>.zip` | 完整扩展，约 95 KB，内含 `INSTALL.txt` | 解压 → **Load unpacked**；也是应用商店接受的文件 |
| `page-translator-ai-<version>.crx` | 已签名安装包 | 拖到 `brave://extensions`，前提是允许商店外安装 |
| `page-translator-ai-signing-key.pem` | 签名密钥 | 绝不要分享；`npm run release` 会复用它，使扩展 ID 在更新之间保持不变 |

所以你交给别人的是一个文件，安装步骤就在里面。

**一个诚实的限制：**浏览器扩展是客户端代码。任何安装它的人都能读到这些文件——`.crx` 是签名的 zip，未打包的扩展就是普通文件夹。任何打包或混淆都改变不了这一点；压缩只会拖慢阅读，而商店政策禁止混淆。如果源码必须保密，唯一现实的选择是把提示词和服务调用移到自己控制的服务器，但这会放弃“自带密钥、无后端”的设计。

若要在不提供仓库的情况下分发，请把 zip 发布为 Chrome 应用商店的**私有或不公开**条目；这是非技术用户一键安装的唯一途径。

## 配置服务商

扩展弹窗 → **Options & settings**，或 `brave://extensions` → 详情 → 扩展选项。

| 服务商 | 接口 | 密钥 | 说明 |
|---|---|---|---|
| **Ollama**（本地） | `http://localhost:11434` | 不需要 | 免费且完全私密。从 [ollama.com](https://ollama.com) 安装，然后运行 `ollama run llama3`。若返回 403，用 `OLLAMA_ORIGINS=chrome-extension://*` 重启。 |
| **Google Gemini** | `generativelanguage.googleapis.com` | 来自 [AI Studio](https://aistudio.google.com/app/apikey) 的免费密钥 | 使用当前模型 ID，例如 `gemini-2.5-flash`。免费额度会变化，请查看 Google 的模型列表。 |
| **兼容 OpenAI** | 你的接口，例如 `https://openrouter.ai/api/v1`、`https://api.groq.com/openai/v1`、`https://integrate.api.nvidia.com/v1` | 服务商密钥 | 任何支持 `/chat/completions` 的服务。界面里的模型建议只是示例，请使用服务商目录中的准确 ID。 |

然后：

1. 选择**默认目标语言**。
2. 选择**翻译风格**：*Natural*（推荐）或 *Literal*。
3. 可选：开启 **Quality mode** 并添加**术语表**条目，每行一条（`术语 → 译文`；也支持 `->`、`=>`、`=` 和 TAB）。
4. 把**源语言**设为 *Auto-detect* 或手动选择。
5. 点击 **Test connection**，再点 **Save settings**。

服务商说明：

- **Gemini 的思考设置按模型代际选择。**2.5 Flash 和 Flash-Lite 关闭思考，2.5 Pro 使用最低预算（128），3.x/4.x 使用低级别。若模型拒绝该设置，请求会在不带该设置的情况下重试一次。
- **Ollama** 以 8192 个标记的上下文窗口调用；训练上下文更小的模型仍会截断长页面，因此页面会被切成小单元。
- **免费额度**会限速。扩展会等待并重试，绝不会静默丢弃文本。

## 使用

- 点击图标 → 选择语言 → **Translate this page**。
- 随时切换 **Show original / Show translation**；还原不会有任何损失。
- 将鼠标悬停在已翻译段落上可查看原文。
- 右键 → **Translate this page** 或 **Translate selection**。
- 键盘：`Ctrl+Shift+Y`（macOS 为 `Cmd+Shift+Y`）切换翻译；可在浏览器的扩展快捷键页面重新绑定。
- 开启 **Auto-translate** 并保存站点偏好后，匹配的页面会在加载时自动翻译。
- 设置会在下一次翻译时应用到已打开的标签页，无需刷新。

## 工作原理

```
页面 DOM
  └─ content script：收集块单元，把行内标记序列化为 <tN>/<vN/> 标记
       └─ 分块器：每次请求 24 个单元 / 2400 个字符
            └─ service worker：请求你的服务商（扩展源，无 CORS）
                 └─ 服务商：JSON 进、JSON 出，ID 保持不变
                      └─ 校验：标记完整、配对、唯一；ID 一致
                           └─ DOM：复用原有元素节点，只写入文本
                                └─ MutationObserver：翻译后来新增的内容
```

真正重要的设计选择：

- **服务商流量绝不从页面上下文发出。**content script 发送 `AIPT_FETCH` 消息，由 service worker 执行请求，因此 CORS 严格的接口也能原样使用。service worker 还会检查 `sender.id`，只有本扩展能把它当作代理。
- **提示词是契约，不是愿望。**ID 进、ID 出；每个片段一条；标签不可触碰；数字、网址、代码和占位符原样保留；不添加解释。响应按 ID 解析，因此顺序被打乱或部分损坏的数组会安全失败，而不会让译文错位。
- **每种语言都有自己的风格指南。**例如波斯语指南要求波斯语语序和动词（`بررسی کنید`，而不是 `بررسی را انجام دهید`），在普通句子足够时禁用 `می‌باشد`/`بایستی`/`گردید`，只保留真正的拉丁字母外来词，并修正标点和零宽空格。few-shot 示例把目标展示给模型，而不只是描述。
- **方向是本地的。**波斯语、阿拉伯语、希伯来语和乌尔都语块加 `dir="rtl"`，`<html>` 加目标语言，页面其余部分保持几何布局——整页翻转曾破坏居中布局和代码块。两者都会随原文一起还原。
- **失败可见且受控。**无法解析的块会被拆分；仍失败的单元保留原文并在顶部提示中报告。翻译过程中取消会干净停止，不会留下写了一半的 DOM。

更多细节：[`docs/translation-quality-design.md`](../translation-quality-design.md)。

## 隐私与权限

| 权限 | 为什么需要 |
|---|---|
| `storage` | 在 `chrome.storage.local` 中保存设置、API 密钥、术语表和站点偏好。 |
| `contextMenus` | 右键菜单“翻译此页面 / 所选内容”。 |
| `tabs` | 向当前标签页发送消息并打开选项页。 |
| `activeTab` | 只在你明确翻译的页面上操作。 |
| `<all_urls>` | 向访问的页面注入 content script，并允许 service worker 调用你配置的接口。 |

- API 密钥只保存在本浏览器的本地存储中，只会发送给你选择的服务商。
- 没有分析统计、没有遥测、没有远程代码、不回传开发者服务器、没有账号。
- 所有文本都用 `textContent` / `createTextNode` 写入；扩展中不存在 `innerHTML`、`eval` 或 `new Function`。模型输出只能以文本形式到达页面，属性被限制在固定白名单内——`href`、`src` 和事件处理程序绝不会由模型输出写入。
- 站点偏好由 service worker 中唯一的串行写入器写入，两个标签页不会互相覆盖。
- 自动语言检测最多向同一服务商发送 600 个字符的样本；手动选择源语言即可完全取消该请求。

安全策略与漏洞报告：[`SECURITY.md`](../../SECURITY.md)。

## 已知限制

- **标记校验刻意严格。**总是破坏 `<tN>` 的模型会让这些段落保留原文（并说明），而不是丢掉链接。请使用遵守结构化输出的模型；*Test connection* 会用带标记的句子测试。
- **质量取决于模型。**小型本地模型可用，但不如 Gemini 或 GPT 级模型流畅；风格层有帮助，但不会增加知识。
- **封闭 shadow root 与跨域 iframe** 超出扩展能力（浏览器安全限制）。开放的 shadow root 和同源框架可以处理。
- **含散落文本的混合容器**（`<div>文本<p>…</p></div>`）会对那段散落文本退回逐节点翻译；结构良好的页面不会遇到。
- **缓存位于内存中**（每个标签页会话）。刷新页面会重新请求文本。
- **PDF 不会被翻译**；内置 PDF 查看器不能被扩展脚本控制。
- **免费额度会变化。**速率限制和模型名称由服务商决定，而不是本扩展。

## 项目状态与测试

版本 1.3.1。自动化测试覆盖 DOM 层、提示词与解析、各服务商请求格式、引擎行为和选项界面——**95 项测试**——`npm run verify` 另加 12 项检查：语法、测试套件、HTML 注入点禁令、密钥泄漏检查、经典 content script、版本一致性、CHANGELOG 覆盖和打包。

```bash
npm install       # 仅开发：用于 DOM 测试的 jsdom
npm test          # 95 项测试
npm run bench     # 分块基准，无需 API 密钥
npm run verify    # 语法 + 测试 + 策略检查 + 打包检查
npm run package   # 只把可分发文件复制到 dist/
npm run release   # 生成 dist 与 release/*.zip、*.crx、*.pem 用于分发
```

基准测的是分块，不是翻译质量：在四个示例页面上，独立的文本节点收集器产生 **108 个片段**，而块收集器产生 **63 个单元**（整体少 1.7 倍，新闻文章上少 **2.5 倍**），短于 25 个字符的片段从 **81 降到 34**。翻译质量本身仍取决于你接入的模型；自动化测试无法覆盖的浏览器级行为（RTL 渲染、提示气泡、真实 SPA 流量、服务商错误）见 [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) 中的人工清单。

CI 在每次 push 和 pull request 时，在 Node 20 和 22 上运行 `npm run verify` 与 `npm run bench`（[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)）。

## 项目结构

```
manifest.json                 Manifest V3：权限、content script、快捷键
background/
  service-worker.js           菜单、快捷键、消息路由、keep-alive
  fetch-utils.js              服务商 fetch 代理：URL/请求头检查、超时、错误类型
  site-prefs.js               按站点串行化的读-改-写
content/
  languages.js                22 种语言、默认值、显示名称
  providers.js                提示词、风格指南、JSON 解析、规范化、Gemini/OpenAI/Ollama
  translation-engine.js       缓存、分块、并发、重试、二分拆分、质量复核
  dom-processor.js            块单元、标记、校验后应用、精确还原、方向
  content-script.js           编排、状态、消息传递、自动翻译
  styles.css                  RTL 真正需要的那两条规则
popup/                       语言选择、翻译/还原、进度、错误
options/                     服务商、密钥、模型、风格、质量、术语表、站点偏好
icons/                       16/48/128 像素图标
docs/i18n/                   本 README 的各语言译本，每种语言一个文件
tests/  scripts/  bench/      仅开发——扩展从不加载
```

## 参与贡献

欢迎提交 issue 和 pull request。发送改动前请运行 `npm run verify`；保持扩展无需构建、服务商流量留在 service worker 中，并且绝不引入 `innerHTML`。如果修改提示词，请新增或更新测试：提示词、解析器和规范化器一起测试，因为它们只有作为一个整体才能工作。

完整规则、`docs/i18n/` 的翻译政策和提交约定见 [`CONTRIBUTING.md`](../../CONTRIBUTING.md)。

## 许可证

MIT — 见 [`LICENSE`](../../LICENSE)。你连接的第三方服务（Gemini、OpenRouter、Ollama…）有自己的条款和价格。
