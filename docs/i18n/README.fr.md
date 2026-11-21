<img src="../../icons/icon-128.png" width="88" align="right" alt="Icône d’AI Page Translator">

# AI Page Translator — traduisez le web avec votre propre IA

**Traduisez n’importe quelle page web dans votre langue avec le fournisseur d’IA que vous choisissez — sans serveur intermédiaire, sans compte, sans pistage et sans facture au mot.**

`Manifest V3` · `Aucune compilation` · `JavaScript pur` · `version 1.3.1` · `22 langues`

Ce fichier est la traduction française du [README canonique en anglais](README.md). En cas de divergence, la version anglaise fait foi.

<!-- lang-nav:start -->
[English](../../README.md) · [فارسی](README.fa.md) · [العربية](README.ar.md) · [עברית](README.he.md) · [اردو](README.ur.md) · [Español](README.es.md) · **Français** · [Deutsch](README.de.md) · [Italiano](README.it.md) · [Português](README.pt.md) · [Nederlands](README.nl.md) · [Polski](README.pl.md) · [Русский](README.ru.md) · [Türkçe](README.tr.md) · [中文简体](README.zh-CN.md) · [中文繁體](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Tiếng Việt](README.vi.md) · [ไทย](README.th.md) · [हिन्दी](README.hi.md) · [Bahasa Indonesia](README.id.md)
<!-- lang-nav:end -->

AI Page Translator est une extension de navigateur pour **Brave** et les autres navigateurs basés sur Chromium. C’est vous qui apportez le fournisseur : une clé Google Gemini gratuite, n’importe quelle API compatible OpenAI (OpenRouter, Groq, NVIDIA, OpenAI…), ou un modèle entièrement local via **Ollama**. L’extension traduit la page que vous lisez sur place, en conservant sa mise en page, ses liens et son formatage.

Aucun texte ne passe par un service de traduction intermédiaire. Votre clé API ne quitte jamais votre navigateur, aucune analytique n’est intégrée et, avec Ollama, le texte ne sort même pas de votre machine.

> **État :** version 1.3.1 · 95 tests automatisés · une vérification en 12 points · aucune télémétrie, aucun code distant.

---

## Pourquoi un autre traducteur ?

La plupart des traducteurs de page envoient une phrase à la fois. D’où ce résultat en empilement de phrases plutôt qu’en page : le contexte se perd, la terminologie dérive, les liens coupent les phrases en deux et la langue cible hérite de l’ordre des mots de la langue source.

Cette extension traduit des **blocs**, pas des nœuds de texte :

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

Ce bloc part comme une seule unité, le balisage en ligne étant remplacé par des jetons numérotés :

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` délimite le contenu en ligne qui appartient à la phrase (un lien, une emphase, un span) ; `<vN/>` délimite le contenu qui ne doit jamais être traduit (code, images, contrôles de formulaire, widgets). Le modèle peut déplacer les jetons : il construit donc une phrase naturelle **autour** du lien au lieu d’être contraint à l’ordre anglais.

Au retour, la réponse est validée avant toute modification de la page. Chaque jeton doit être présent, équilibré et unique ; une traduction qui perd un lien est rejetée, retentée une fois avec une consigne plus stricte, puis laissée intacte. Les nœuds d’origine sont réutilisés : `href`, écouteurs d’événements et balisage imbriqué survivent. « Afficher l’original » restaure exactement les nœuds d’origine.

## Fonctionnalités

- **Traduction intégrale sur place** — titres, paragraphes, listes, tableaux, légendes, boutons.
- **Liens et mise en forme en ligne préservés** — validés par jetons ; un lien perdu ne peut jamais être appliqué en silence.
- **Style naturel ou littéral** — *Naturel* (par défaut) réécrit comme le ferait un rédacteur natif ; *Littéral* reste proche du texte source pour les pages techniques.
- **Guides de style par langue** — conseils dédiés au persan, à l’arabe, à l’ourdou et à l’hébreu, plus un guide général pour les 18 autres langues.
- **Nettoyage typographique déterministe** — le `ی`/`ک` persan, les espaces insécables de `می`/`ها`/`تر` et les signes `، ؛ ؟` sont corrigés même quand le modèle se trompe.
- **Passe qualité facultative** — relit chaque segment sous forme de paire {source, traduction} et corrige donc le sens, pas seulement la formulation.
- **Glossaire** — paires terme → traduction que le modèle doit respecter.
- **Contenu protégé** — `<pre>`, `<code>`, URL, e-mails, `translate="no"`, `contenteditable`, SVG, contrôles de formulaire et interface de l’extension ne sont jamais envoyés.
- **Libellés d’attributs** — `alt`, `title`, `placeholder` et `aria-label` passent par un canal séparé, avec une tonalité de libellé et non de paragraphe.
- **Pages dynamiques** — le contenu ajouté par défilement infini ou par une SPA est traduit à mesure qu’il apparaît, sans boucle d’observateur.
- **Droite à gauche correct** — `dir` sur chaque bloc traduit, `lang` sur `<html>`, aucun basculement global ; tout est restauré.
- **Mémoire par site** — retient la langue cible par domaine et peut traduire automatiquement au chargement.
- **N’importe quelle API** — Gemini, Ollama et tout point de terminaison compatible OpenAI, appelés depuis le service worker, donc sans problème CORS.
- **Cache mémoire, reprise et découpage** — un texte identique n’est envoyé qu’une fois ; un lot en échec est scindé au lieu de faire échouer la page ; les 429/5xx sont réessayés avec un délai croissant.
- **Aucune compilation** — scripts classiques, chargés tels quels.

## Langues prises en charge

Vingt-deux langues cibles, chacune avec son nom natif dans le prompt : le modèle ne peut donc pas confondre `zh-TW` avec `zh-CN`, ni le persan avec l’arabe.

| Langue | Nom natif | Sens |
|---|---|---|
| Anglais | English | gauche à droite |
| Persan | فارسی | droite à gauche |
| Arabe | العربية | droite à gauche |
| Hébreu | עברית | droite à gauche |
| Ourdou | اردو | droite à gauche |
| Espagnol | Español | gauche à droite |
| Français | Français | gauche à droite |
| Allemand | Deutsch | gauche à droite |
| Chinois simplifié | 中文简体 | gauche à droite |
| Chinois traditionnel | 中文繁體 | gauche à droite |
| Russe | Русский | gauche à droite |
| Turc | Türkçe | gauche à droite |
| Italien | Italiano | gauche à droite |
| Portugais | Português | gauche à droite |
| Néerlandais | Nederlands | gauche à droite |
| Polonais | Polski | gauche à droite |
| Vietnamien | Tiếng Việt | gauche à droite |
| Thaï | ไทย | gauche à droite |
| Hindi | हिन्दी | gauche à droite |
| Indonésien | Bahasa Indonesia | gauche à droite |
| Japonais | 日本語 | gauche à droite |
| Coréen | 한국어 | gauche à droite |

Les langues de droite à gauche (persan, arabe, hébreu, ourdou) reçoivent leur direction bloc par bloc ; le reste de la page garde sa géométrie.

## Installation

1. Téléchargez ce dépôt (**Code → Download ZIP** ou `git clone`) et gardez le dossier.
2. Ouvrez `brave://extensions` (ou `chrome://extensions`).
3. Activez le **mode développeur**.
4. Cliquez sur **Load unpacked** et choisissez ce dossier (celui qui contient `manifest.json`).
5. Épinglez l’extension si vous voulez son panneau à un clic.

Il n’y a ni compilation, ni installation, ni étape de bundling. L’extension ne lit que les fichiers listés dans `manifest.json` ; `tests/`, `scripts/`, `bench/`, `docs/` et `.github/` servent uniquement au développement et ne sont jamais chargés.

Un navigateur Chromium récent est nécessaire. Les shadow roots fermés sont traduits lorsque le navigateur expose l’API (Chromium 119+) ; tout le reste fonctionne sur des versions plus anciennes.

## Partager l’extension

`npm run release` construit le paquet et produit les fichiers dans `release/` (dossier ignoré par git) :

| Fichier | Contenu | Installation |
|---|---|---|
| `page-translator-ai-<version>.zip` | l’extension complète, environ 95 Ko, avec `INSTALL.txt` à l’intérieur | décompresser → **Load unpacked** ; c’est aussi le fichier accepté par un store |
| `page-translator-ai-<version>.crx` | paquet signé | à glisser sur `brave://extensions`, là où les installations hors store sont autorisées |
| `page-translator-ai-signing-key.pem` | clé de signature | ne la diffusez jamais ; `npm run release` la réutilise pour garder le même identifiant d’une mise à jour à l’autre |

Ce que vous transmettez est donc un seul fichier, et il contient les étapes d’installation.

**Limite assumée :** une extension de navigateur est du code côté client. Quiconque l’installe peut lire ces fichiers — un `.crx` est un zip signé, une extension non empaquetée est un simple dossier. Aucun empaquetage ni obfuscation n’y change rien ; la minification ralentit seulement la lecture, et les règles des stores interdisent l’obfuscation. Si le code source doit réellement rester secret, la seule option sérieuse est de déplacer les prompts et les appels au fournisseur vers un serveur que vous contrôlez — au prix du modèle « votre clé, sans backend ».

Pour distribuer sans donner le dépôt, publiez le zip comme élément **privé ou non répertorié** sur le Chrome Web Store : c’est le seul chemin d’installation en un clic pour un utilisateur non technique.

## Configurer un fournisseur

Panneau de l’extension → **Options & settings**, ou `brave://extensions` → Détails → Options de l’extension.

| Fournisseur | Point de terminaison | Clé | Remarques |
|---|---|---|---|
| **Ollama** (local) | `http://localhost:11434` | aucune | Gratuit et totalement privé. Installez-le depuis [ollama.com](https://ollama.com), puis `ollama run llama3`. En cas de 403, relancez-le avec `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | clé gratuite depuis [AI Studio](https://aistudio.google.com/app/apikey) | Utilisez un identifiant de modèle actuel, par exemple `gemini-2.5-flash`. Les quotas gratuits changent : consultez la liste des modèles de Google. |
| **Compatible OpenAI** | votre point de terminaison, par ex. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | clé du fournisseur | Tout service qui parle `/chat/completions`. Les modèles suggérés dans l’interface sont des exemples : reprenez l’identifiant exact du catalogue du fournisseur. |

Ensuite :

1. Choisissez la **langue cible par défaut**.
2. Choisissez un **style de traduction** : *Naturel* (recommandé) ou *Littéral*.
3. Activez éventuellement le **mode qualité** et ajoutez des entrées de **glossaire**, une par ligne (`terme → traduction` ; `->`, `=>`, `=` et la tabulation fonctionnent aussi).
4. Laissez la **langue source** sur *Auto-detect* ou choisissez-la explicitement.
5. Cliquez sur **Test connection**, puis sur **Save settings**.

Remarques sur les fournisseurs :

- **Le réglage de réflexion de Gemini dépend de la génération du modèle.** 2.5 Flash et Flash-Lite tournent sans réflexion, 2.5 Pro utilise son budget minimal (128) et 3.x/4.x un niveau bas. Si un modèle refuse ce réglage, la requête est retentée une fois sans lui.
- **Ollama** est appelé avec une fenêtre de contexte de 8192 jetons ; un modèle entraîné sur moins tronquera encore les pages longues — c’est pourquoi la page est découpée en petites unités.
- **Les offres gratuites** limitent le débit. L’extension patiente et réessaie ; elle ne supprime jamais de texte en silence.

## Utilisation

- Cliquez sur l’icône → choisissez une langue → **Translate this page**.
- **Show original / Show translation** à tout moment ; la restauration est sans perte.
- Survolez un paragraphe traduit pour revoir le texte d’origine.
- Clic droit → **Translate this page** ou **Translate selection**.
- Clavier : `Ctrl+Shift+Y` (`Cmd+Shift+Y` sous macOS) active ou désactive la traduction ; modifiable dans la page des raccourcis du navigateur.
- Avec **Auto-translate** activé et une préférence de site enregistrée, les pages correspondantes sont traduites au chargement.
- Les réglages s’appliquent aux onglets déjà ouverts à la traduction suivante ; aucun rechargement n’est nécessaire.

## Comment ça marche

```
DOM de la page
  └─ content script : collecte des unités en blocs, sérialisation du balisage en jetons <tN>/<vN/>
       └─ découpage : 24 unités / 2400 caractères par requête
            └─ service worker : requête vers votre fournisseur (origine de l’extension, sans CORS)
                 └─ fournisseur : JSON en entrée, JSON en sortie, identifiants conservés
                      └─ validation : jetons complets, équilibrés, uniques ; identifiants concordants
                           └─ DOM : réutilisation des nœuds d’origine, écriture du texte seul
                                └─ MutationObserver : traduction du contenu ajouté ensuite
```

Les choix qui comptent :

- **Le trafic fournisseur ne part jamais du contexte de la page.** Le content script envoie un message `AIPT_FETCH` ; le service worker exécute la requête, donc les points de terminaison à CORS strict fonctionnent tels quels. Le service worker vérifie aussi `sender.id` : seule cette extension peut s’en servir comme proxy.
- **Le prompt est un contrat, pas un souhait.** Identifiants en entrée, identifiants en sortie ; une entrée par segment ; balises intouchables ; nombres, URL, code et placeholders tels quels ; aucune explication ajoutée. Les réponses sont lues par identifiant : un tableau réordonné ou partiellement malformé échoue proprement au lieu de décaler les traductions.
- **Chaque langue a son guide de style.** Le guide persan, par exemple, exige l’ordre des mots et les verbes persans (`بررسی کنید`, et non `بررسی را انجام دهید`), interdit `می‌باشد`/`بایستی`/`گردید` là où une phrase ordinaire suffit, ne garde en alphabet latin que les vrais emprunts et corrige ponctuation et espaces insécables. Les exemples few-shot montrent la cible au modèle au lieu de la décrire.
- **La direction reste locale.** Les blocs persans, arabes, hébreux et ourdous reçoivent `dir="rtl"`, `<html>` reçoit la langue cible, et le reste de la page garde sa géométrie — un basculement global cassait les mises en page centrées et les blocs de code. Les deux sont restaurés avec le texte d’origine.
- **Les échecs sont visibles et contenus.** Un lot illisible est scindé ; une unité qui échoue encore reste dans la langue d’origine et est signalée dans la bannière. Une annulation en cours de traduction s’arrête proprement, sans DOM à moitié écrit.

Pour aller plus loin : [`docs/translation-quality-design.md`](../translation-quality-design.md).

## Confidentialité et autorisations

| Autorisation | Pourquoi elle est nécessaire |
|---|---|
| `storage` | Enregistrer réglages, clé API, glossaire et préférences par site dans `chrome.storage.local`. |
| `contextMenus` | Menu contextuel « Traduire cette page / la sélection ». |
| `tabs` | Envoyer des messages à l’onglet actif et ouvrir les options. |
| `activeTab` | Agir sur la page que vous traduisez explicitement. |
| `<all_urls>` | Injecter le content script dans les pages visitées et permettre au service worker d’appeler le point de terminaison configuré. |

- La clé API est stockée uniquement dans le stockage local de ce navigateur et envoyée uniquement au fournisseur choisi.
- Aucune analytique, aucune télémétrie, aucun code distant, aucun appel maison, aucun compte.
- Tout le texte est écrit avec `textContent` / `createTextNode` ; il n’y a nulle part `innerHTML`, `eval` ou `new Function`. La sortie du modèle ne peut atteindre la page que sous forme de texte, et les attributs sont limités à une liste blanche fixe — `href`, `src` et les gestionnaires d’événements ne sont jamais écrits depuis la sortie du modèle.
- Les préférences par site passent par un unique écrivain sérialisé dans le service worker : deux onglets ne peuvent pas s’écraser mutuellement.
- La détection automatique de langue envoie au plus un échantillon de 600 caractères au même fournisseur ; choisissez la langue source manuellement pour supprimer cette requête.

Politique de sécurité et signalement d’une vulnérabilité : [`SECURITY.md`](../../SECURITY.md).

## Limites connues

- **La validation des jetons est stricte par conception.** Un modèle qui abîme systématiquement les balises `<tN>` laissera ces paragraphes dans la langue d’origine (et le dira) plutôt que de perdre un lien. Utilisez un modèle qui respecte les sorties structurées ; *Test connection* éprouve une phrase balisée.
- **La qualité dépend du modèle.** Les petits modèles locaux sont utilisables mais moins fluides que Gemini ou les modèles de classe GPT ; la couche de style aide, elle n’ajoute pas de connaissances.
- **Les shadow roots fermés et les iframes cross-origin** sont hors de portée de l’extension (sécurité du navigateur). Les shadow roots ouverts et les cadres de même origine sont gérés.
- **Les conteneurs mixtes avec du texte libre** (`<div>texte<p>…</p></div>`) reviennent à une traduction nœud par nœud pour ce texte ; les pages bien formées ne rencontrent jamais ce cas.
- **Le cache est en mémoire** (par session d’onglet). Recharger une page redemande son texte.
- **Les PDF ne sont pas traduits** ; la visionneuse PDF intégrée n’est pas scriptable par les extensions.
- **Les offres gratuites changent.** Les limites de débit et les noms de modèles dépendent du fournisseur, pas de cette extension.

## État du projet et tests

Version 1.3.1. La suite automatisée couvre la couche DOM, le prompt et l’analyse, la forme des requêtes fournisseur, le moteur et l’interface des options — **95 tests** — et `npm run verify` ajoute une vérification en 12 points : syntaxe, suite de tests, interdiction des puits HTML, fuite de clé, scripts de contenu classiques, parité des versions, couverture du CHANGELOG et empaquetage.

```bash
npm install       # développement uniquement : jsdom pour les tests DOM
npm test          # 95 tests
npm run bench     # banc de segmentation, sans clé API
npm run verify    # syntaxe + tests + contrôles de politique + empaquetage
npm run package   # copie uniquement les fichiers livrables dans dist/
npm run release   # dist + release/*.zip, *.crx, *.pem pour la distribution
```

Le banc mesure la segmentation, pas la qualité de traduction : sur les quatre pages d’exemple, un collecteur indépendant par nœuds de texte produit **108 fragments** là où le collecteur par blocs produit **63 unités** (1,7 fois moins au total, **2,5 fois** sur l’article de presse), et les fragments de moins de 25 caractères passent de **81 à 34**. La qualité de traduction dépend toujours du modèle connecté — la checklist manuelle de [`TEST_CHECKLIST.md`](../../TEST_CHECKLIST.md) couvre ce que les tests automatisés ne peuvent pas atteindre (rendu RTL, infobulles, trafic SPA réel, erreurs du fournisseur).

La CI exécute `npm run verify` et `npm run bench` sous Node 20 et 22 à chaque push et pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Structure du projet

```
manifest.json                 Manifest V3 : permissions, content scripts, raccourci
background/
  service-worker.js           menus, raccourci, routage des messages, keep-alive
  fetch-utils.js              proxy fetch du fournisseur : URL/en-têtes, délai, types d’erreur
  site-prefs.js               lecture-modification-écriture sérialisée par site
content/
  languages.js                22 langues, valeurs par défaut, noms affichés
  providers.js                prompts, guides de style, analyse JSON, normalisation, Gemini/OpenAI/Ollama
  translation-engine.js       cache, découpage, concurrence, reprise, bissection, passe qualité
  dom-processor.js            unités en blocs, jetons, application validée, restauration exacte, direction
  content-script.js           orchestration, état, messagerie, traduction automatique
  styles.css                  les deux règles dont le RTL a réellement besoin
popup/                        choix de langue, traduire/restaurer, progression, erreurs
options/                      fournisseur, clé, modèle, style, qualité, glossaire, préférences de site
icons/                        icônes 16/48/128 px
docs/i18n/                    traductions de ce README, un fichier par langue
tests/  scripts/  bench/      développement uniquement — jamais chargés par l’extension
```

## Contribuer

Les issues et les pull requests sont bienvenues. Avant d’envoyer un changement, exécutez `npm run verify` ; gardez l’extension sans compilation, gardez le trafic fournisseur dans le service worker et n’introduisez jamais `innerHTML`. Si vous modifiez le prompt, ajoutez ou mettez à jour un test : prompt, analyseur et normaliseur sont testés ensemble parce qu’ils ne fonctionnent que comme un tout.

Lisez [`CONTRIBUTING.md`](../../CONTRIBUTING.md) pour les règles complètes, la politique de traduction de `docs/i18n/` et les conventions de commit.

## Licence

MIT — voir [`LICENSE`](../../LICENSE). Les services tiers que vous connectez (Gemini, OpenRouter, Ollama…) ont leurs propres conditions et tarifs.
