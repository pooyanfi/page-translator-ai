<img src="../../icons/icon-128.png" width="88" align="right" alt="Ícone do AI Page Translator">

# AI Page Translator — traduza a web com a sua própria IA

**Traduza qualquer página web para o seu idioma com o provedor de IA que você escolher — sem backend, sem conta, sem rastreamento e sem cobrança por palavra.**

`Manifest V3` · `Sem etapa de build` · `JavaScript puro` · `versão 1.3.1` · `22 idiomas`

Este arquivo é a tradução em português do [README canônico em inglês](README.md). Em caso de divergência, vale o texto em inglês.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Italiano](README.it.md) · **Português** · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator é uma extensão de navegador para o **Brave** e outros navegadores baseados em Chromium. Você traz o provedor: uma chave gratuita do Google Gemini, qualquer API compatível com OpenAI (OpenRouter, Groq, NVIDIA, OpenAI…) ou um modelo totalmente local com **Ollama**. A extensão traduz a página que você está lendo no próprio lugar, mantendo o layout, os links e a formatação.

Nenhum texto passa por um serviço de tradução intermediário. Sua chave de API nunca sai do navegador, não há análise de uso e, com o Ollama, o texto nem sai da sua máquina.

> **Estado:** versão 1.3.1 · 95 testes automatizados · uma verificação de 12 pontos · sem telemetria e sem código remoto.

---

## Por que outro tradutor?

A maioria dos tradutores de página envia uma frase por vez. Por isso o resultado parece uma pilha de frases em vez de uma página: o contexto se perde, a terminologia varia, os links cortam frases ao meio e o idioma de destino herda a ordem das palavras do idioma de origem.

Esta extensão traduz **blocos**, não nós de texto:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

O bloco vai como uma única unidade, com a marcação inline substituída por tokens numerados:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` marca o conteúdo inline que pertence à frase (um link, uma ênfase, um span); `<vN/>` marca o conteúdo que nunca deve ser traduzido (código, imagens, controles de formulário, widgets). O modelo pode mover os tokens, então monta uma frase natural **em volta** do link em vez de ficar preso à ordem do inglês.

Na volta, a resposta é validada antes de tocar na página. Cada token precisa estar presente, balanceado e ser único; uma tradução que perde um link é rejeitada, repetida uma vez com instrução mais rígida e, se ainda falhar, deixada intacta. Os nós originais são reaproveitados, então `href`, ouvintes de evento e marcação aninhada sobrevivem. «Mostrar original» restaura exatamente os nós originais.

## Recursos

- **Tradução da página inteira no lugar** — títulos, parágrafos, listas, tabelas, legendas e botões.
- **Links e formatação inline preservados** — com validação de tokens; um link perdido nunca é aplicado em silêncio.
- **Estilo natural ou literal** — *Natural* (padrão) reescreve como um autor nativo faria; *Literal* fica próximo do texto de origem em páginas técnicas.
- **Guias de estilo por idioma** — orientação específica para persa, árabe, urdu e hebraico, além de um guia geral para os outros 18 idiomas.
- **Correção tipográfica determinística** — `ی`/`ک` do persa, espaços inseparáveis em `می`/`ها`/`تر` e os sinais `، ؛ ؟` são corrigidos mesmo quando o modelo erra.
- **Revisão de qualidade opcional** — lê cada segmento como par {origem, tradução} e corrige o sentido, não apenas a redação.
- **Glossário** — pares termo → tradução que o modelo precisa respeitar.
- **Conteúdo protegido** — `<pre>`, `<code>`, URLs, e-mails, `translate="no"`, `contenteditable`, SVG, controles de formulário e a própria interface da extensão nunca são enviados.
- **Rótulos de atributos** — `alt`, `title`, `placeholder` e `aria-label` vão por um canal separado, com tom de rótulo e não de parágrafo.
- **Páginas dinâmicas** — conteúdo novo de rolagem infinita ou de uma SPA é traduzido assim que aparece, sem laços de observação.
- **Direita para esquerda do jeito certo** — `dir` em cada bloco traduzido, `lang` no `<html>`, sem virar a página inteira; tudo é restaurado.
- **Memória por site** — lembra o idioma de destino por domínio e pode traduzir automaticamente ao carregar.
- **Qualquer API** — Gemini, Ollama e qualquer endpoint compatível com OpenAI, chamados pelo service worker, sem problemas de CORS.
- **Cache em memória, novas tentativas e divisão** — texto idêntico é enviado uma vez; o bloco que falha é dividido em vez de derrubar a página; erros 429/5xx são repetidos com espera crescente.
- **Sem etapa de build** — scripts clássicos, carregados como estão.

## Idiomas disponíveis

Vinte e dois idiomas de destino, cada um com o nome nativo no prompt, para o modelo não confundir `zh-TW` com `zh-CN` nem persa com árabe:

| Idioma | Nome nativo | Direção |
|---|---|---|
| Inglês | English | da esquerda para a direita |
| Persa | فارسی | da direita para a esquerda |
| Árabe | العربية | da direita para a esquerda |
| Hebraico | עברית | da direita para a esquerda |
| Urdu | اردو | da direita para a esquerda |
| Espanhol | Español | da esquerda para a direita |
| Francês | Français | da esquerda para a direita |
| Alemão | Deutsch | da esquerda para a direita |
| Chinês simplificado | 中文简体 | da esquerda para a direita |
| Chinês tradicional | 中文繁體 | da esquerda para a direita |
| Russo | Русский | da esquerda para a direita |
| Turco | Türkçe | da esquerda para a direita |
| Italiano | Italiano | da esquerda para a direita |
| Português | Português | da esquerda para a direita |
| Holandês | Nederlands | da esquerda para a direita |
| Polonês | Polski | da esquerda para a direita |
| Vietnamita | Tiếng Việt | da esquerda para a direita |
| Tailandês | ไทย | da esquerda para a direita |
| Hindi | हिन्दी | da esquerda para a direita |
| Indonésio | Bahasa Indonesia | da esquerda para a direita |
| Japonês | 日本語 | da esquerda para a direita |
| Coreano | 한국어 | da esquerda para a direita |

Os idiomas da direita para a esquerda (persa, árabe, hebraico e urdu) recebem direção bloco a bloco; o restante da página mantém a geometria.

## Instalação

1. Baixe este repositório (**Code → Download ZIP** ou `git clone`) e guarde a pasta.
2. Abra `brave://extensions` (ou `chrome://extensions`).
3. Ative o **modo de desenvolvedor**.
4. Clique em **Load unpacked** e escolha esta pasta (a que contém `manifest.json`).
5. Fixe a extensão se quiser o popup a um clique.

Não há etapa de build, instalação ou empacotamento. A extensão lê apenas os arquivos listados em `manifest.json`; `tests/`, `scripts/`, `bench/`, `docs/` e `.github/` são só para desenvolvimento e nunca são carregados.

É necessário um navegador Chromium atual. Shadow roots fechados são traduzidos quando o navegador expõe a API (Chromium 119+); o restante funciona em versões anteriores.

## Compartilhar a extensão

`npm run release` monta o pacote e gera os arquivos em `release/` (pasta ignorada pelo git):

| Arquivo | O que é | Como instalar |
|---|---|---|
| `page-translator-ai-<version>.zip` | a extensão completa, cerca de 95 KB, com `INSTALL.txt` dentro | descompactar → **Load unpacked**; é o mesmo arquivo que uma loja aceita |
| `page-translator-ai-<version>.crx` | pacote assinado | arrastar para `brave://extensions`, onde instalações fora da loja são permitidas |
| `page-translator-ai-signing-key.pem` | chave de assinatura | nunca compartilhe; `npm run release` reutiliza a chave para o ID da extensão não mudar entre atualizações |

Ou seja, o que você entrega é um único arquivo, e ele contém as instruções de instalação.

**Limitação honesta:** uma extensão de navegador é código do lado do cliente. Quem instala pode ler esses arquivos — um `.crx` é um zip assinado e uma extensão não empacotada é uma pasta comum. Nenhum empacotamento ou ofuscação muda isso; a minificação só atrasa a leitura, e as políticas das lojas proíbem ofuscação. Se o código precisa mesmo ficar secreto, a única opção real é mover os prompts e as chamadas ao provedor para um servidor que você controla, o que abandona o modelo «sua chave, sem backend».

Para distribuir sem entregar o repositório, publique o zip como item **privado ou não listado** na Chrome Web Store; é o único caminho de instalação em um clique para usuários não técnicos.

## Configurar um provedor

Popup da extensão → **Options & settings**, ou `brave://extensions` → Detalhes → Opções da extensão.

| Provedor | Endpoint | Chave | Observações |
|---|---|---|---|
| **Ollama** (local) | `http://localhost:11434` | nenhuma | Gratuito e totalmente privado. Instale em [ollama.com](https://ollama.com) e rode `ollama run llama3`. Se retornar 403, reinicie com `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | chave gratuita do [AI Studio](https://aistudio.google.com/app/apikey) | Use um ID de modelo atual, como `gemini-2.5-flash`. Os limites gratuitos mudam; consulte a lista de modelos do Google. |
| **Compatível com OpenAI** | seu endpoint, por exemplo `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | chave do provedor | Qualquer serviço que fale `/chat/completions`. Os modelos sugeridos na interface são exemplos: use o ID exato do catálogo do provedor. |

Depois:

1. Escolha o **idioma de destino padrão**.
2. Escolha um **estilo de tradução**: *Natural* (recomendado) ou *Literal*.
3. Se quiser, ative o **modo de qualidade** e adicione entradas ao **glossário**, uma por linha (`termo → tradução`; `->`, `=>`, `=` e TAB também funcionam).
4. Deixe o **idioma de origem** em *Auto-detect* ou escolha explicitamente.
5. Clique em **Test connection** e depois em **Save settings**.

Notas sobre os provedores:

- **O ajuste de raciocínio do Gemini é escolhido por geração de modelo.** 2.5 Flash e Flash-Lite rodam sem raciocínio, 2.5 Pro usa o orçamento mínimo (128) e 3.x/4.x um nível baixo. Se um modelo recusar o ajuste, a requisição é repetida uma vez sem ele.
- **O Ollama** é chamado com janela de contexto de 8192 tokens; um modelo treinado com menos ainda vai truncar páginas longas — por isso a página é dividida em unidades pequenas.
- **Planos gratuitos** limitam a taxa. A extensão espera e tenta de novo; nunca descarta texto em silêncio.

## Uso

- Clique no ícone → escolha um idioma → **Translate this page**.
- **Show original / Show translation** a qualquer momento; a restauração não perde nada.
- Passe o mouse sobre um parágrafo traduzido para ver o texto original.
- Clique com o botão direito → **Translate this page** ou **Translate selection**.
- Teclado: `Ctrl+Shift+Y` (`Cmd+Shift+Y` no macOS) alterna a tradução; pode ser alterado na página de atalhos do navegador.
- Com **Auto-translate** ligado e uma preferência de site salva, as páginas correspondentes são traduzidas ao carregar.
- As configurações valem para abas já abertas na próxima tradução; não é preciso recarregar.

## Como funciona

```
DOM da página
  └─ content script: coleta unidades em bloco, serializa a marcação inline como tokens <tN>/<vN/>
       └─ divisor: 24 unidades ou 2400 caracteres por requisição
            └─ service worker: requisição ao seu provedor (origem da extensão, sem CORS)
                 └─ provedor: JSON entra, JSON sai, IDs preservados
                      └─ validação: tokens completos, balanceados e únicos; IDs correspondentes
                           └─ DOM: reutiliza os nós originais e escreve apenas o texto
                                └─ MutationObserver: traduz o conteúdo adicionado depois
```

Decisões que fazem diferença:

- **O tráfego ao provedor nunca sai do contexto da página.** O content script envia uma mensagem `AIPT_FETCH`; o service worker faz a requisição, então endpoints com CORS rígido funcionam sem alteração. O service worker também verifica `sender.id`, de modo que só esta extensão pode usá-lo como proxy.
- **O prompt é um contrato, não um desejo.** IDs entram, IDs saem; uma entrada por segmento; tags intocáveis; números, URLs, código e placeholders como estão; sem explicações extras. As respostas são lidas por ID, então uma matriz reordenada ou parcialmente malformada falha com segurança em vez de desalinhar traduções.
- **Cada idioma tem seu guia de estilo.** O guia persa, por exemplo, exige ordem de palavras e verbos persas (`بررسی کنید`, não `بررسی را انجام دهید`), proíbe `می‌باشد`/`بایستی`/`گردید` onde uma frase comum basta, mantém no alfabeto latino apenas empréstimos reais e corrige pontuação e espaços. Exemplos few-shot mostram o alvo ao modelo em vez de apenas descrevê-lo.
- **A direção é local.** Blocos em persa, árabe, hebraico e urdu recebem `dir="rtl"`, o `<html>` recebe o idioma de destino e o restante da página mantém a geometria — virar tudo quebrava layouts centralizados e blocos de código. Ambos são restaurados com o texto original.
- **Falhas são visíveis e contidas.** O bloco ilegível é dividido; a unidade que ainda falha fica no idioma original e é informada na faixa superior. Cancelar no meio da tradução para de forma limpa e não deixa DOM pela metade.

Mais detalhes: [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Privacidade e permissões

| Permissão | Por que é necessária |
|---|---|
| `storage` | Salvar configurações, chave de API, glossário e preferências por site em `chrome.storage.local`. |
| `contextMenus` | Item de menu «Traduzir esta página / a seleção». |
| `tabs` | Enviar mensagens à aba ativa e abrir as opções. |
| `activeTab` | Agir na página que você traduz explicitamente. |
| `<all_urls>` | Injetar o content script nas páginas visitadas e permitir que o service worker chame o endpoint configurado. |

- A chave de API fica apenas no armazenamento local deste navegador e vai apenas para o provedor escolhido.
- Sem análise de uso, sem telemetria, sem código remoto, sem contato com o servidor do desenvolvedor e sem conta.
- Todo texto é escrito com `textContent` / `createTextNode`; não existe `innerHTML`, `eval` ou `new Function` em lugar nenhum. A saída do modelo só chega à página como texto, e os atributos são limitados a uma lista fixa — `href`, `src` e manipuladores de evento nunca são escritos a partir da saída do modelo.
- As preferências por site passam por um único escritor serializado no service worker, então duas abas não se sobrescrevem.
- A detecção automática de idioma envia no máximo 600 caracteres de amostra ao mesmo provedor; escolher o idioma de origem manualmente elimina essa requisição.

Política de segurança e como relatar uma vulnerabilidade: [`SECURITY.md`](../../SECURITY.md).

## Limitações conhecidas

- **A validação de tokens é rígida de propósito.** Um modelo que estraga `<tN>` de forma sistemática deixa esses parágrafos no idioma original (e avisa) em vez de perder um link. Use um modelo que respeite saída estruturada; *Test connection* testa uma frase com tokens.
- **A qualidade depende do modelo.** Modelos locais pequenos são utilizáveis, mas menos fluentes que Gemini ou modelos da classe GPT; a camada de estilo ajuda, não acrescenta conhecimento.
- **Shadow roots fechados e iframes cross-origin** ficam fora do alcance da extensão (segurança do navegador). Shadow roots abertos e quadros de mesma origem são tratados.
- **Contêineres mistos com texto solto** (`<div>texto<p>…</p></div>`) voltam à tradução nó a nó para esse texto; páginas bem formadas nunca chegam a esse caso.
- **O cache fica na memória** (por sessão de aba). Recarregar a página pede o texto de novo.
- **PDFs não são traduzidos**; o visualizador de PDF embutido não é programável por extensões.
- **Planos gratuitos mudam.** Limites de taxa e nomes de modelo são controlados pelo provedor, não por esta extensão.

## Status do projeto e testes

Versão 1.3.1. A suíte automatizada cobre a camada DOM, o prompt e a análise, o formato das requisições aos provedores, o comportamento do motor e a interface de opções — **95 testes** — e `npm run verify` acrescenta uma verificação de 12 pontos: sintaxe, suíte de testes, proibição de sumidouros de HTML, checagem de vazamento de chave, content scripts clássicos, paridade de versões, cobertura do CHANGELOG e empacotamento.

```bash
npm install       # só desenvolvimento: jsdom para os testes de DOM
npm test          # 95 testes
npm run bench     # benchmark de segmentação, sem chave de API
npm run verify    # sintaxe + testes + verificações de política + empacotamento
npm run package   # copia apenas os arquivos distribuíveis para dist/
npm run release   # dist + release/*.zip, *.crx, *.pem para distribuição
```

O benchmark mede segmentação, não qualidade de tradução: nas quatro páginas de exemplo, um coletor independente por nós de texto produz **108 fragmentos** onde o coletor por blocos produz **63 unidades** (1,7 vez menos no total, **2,5 vezes** na matéria de notícias), e fragmentos com menos de 25 caracteres caem de **81 para 34**. A qualidade da tradução em si continua dependendo do modelo conectado — a lista manual em [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) cobre o que os testes automatizados não alcançam (renderização RTL, tooltips, tráfego real de SPA e erros do provedor).

A CI executa `npm run verify` e `npm run bench` em Node 20 e 22 a cada push e pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Estrutura do projeto

```
manifest.json                 Manifest V3: permissões, content scripts, atalho
background/
  service-worker.js           menus, atalho, roteamento de mensagens, keep-alive
  fetch-utils.js              proxy fetch do provedor: URL/cabeçalhos, timeout, tipos de erro
  site-prefs.js               leitura-modificação-escrita serializada por site
content/
  languages.js                22 idiomas, padrões, nomes de exibição
  providers.js                prompts, guias de estilo, análise de JSON, normalização, Gemini/OpenAI/Ollama
  translation-engine.js       cache, divisão, concorrência, novas tentativas, bisseção, revisão de qualidade
  dom-processor.js            unidades em bloco, tokens, aplicação validada, restauração exata, direção
  content-script.js           orquestração, estado, mensagens, tradução automática
  styles.css                  as duas regras de que o RTL realmente precisa
popup/                        escolha de idioma, traduzir/restaurar, progresso, erros
options/                      provedor, chave, modelo, estilo, qualidade, glossário, preferências por site
icons/                        ícones 16/48/128 px
docs/i18n/                    traduções deste README, um arquivo por idioma
tests/  scripts/  bench/      só desenvolvimento — nunca carregados pela extensão
```

## Contribuindo

Issues e pull requests são bem-vindos. Antes de enviar uma mudança, rode `npm run verify`; mantenha a extensão sem build, mantenha o tráfego ao provedor no service worker e nunca introduza `innerHTML`. Se alterar o prompt, adicione ou atualize um teste: prompt, analisador e normalizador são testados juntos porque só funcionam como conjunto.

Leia [`CONTRIBUTING.md`](../../CONTRIBUTING.md) para as regras completas, a política de tradução de `docs/i18n/` e as convenções de commit.

## Licença

MIT — consulte [`LICENSE`](../../LICENSE). Os serviços de terceiros que você conecta (Gemini, OpenRouter, Ollama…) têm termos e preços próprios.
