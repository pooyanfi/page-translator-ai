/* AI Page Translator — DOM layer.
 *
 * Translation happens on *blocks*, not on text nodes. A paragraph like
 *
 *   The <a>new policy</a> takes effect <strong>immediately</strong>.
 *
 * used to arrive at the model as four unrelated strings, and the answer could
 * never be put back in Persian word order. Now the whole paragraph is one unit,
 * its inline elements become tokens:
 *
 *   The <t1>new policy</t1> takes effect <t2>immediately</t2>.
 *
 * the model returns the sentence with the tokens where Persian needs them, and
 * this file rebuilds the DOM by reusing the original elements — so href,
 * listeners and nested markup survive, and restore puts the exact original
 * nodes back.
 */

AIPT.Dom = (() => {
  const BLOCK_TAGS = new Set([
    'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'BODY', 'CAPTION', 'DD', 'DETAILS', 'DIALOG',
    'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE', 'FOOTER', 'FORM', 'H1', 'H2', 'H3',
    'H4', 'H5', 'H6', 'HEADER', 'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'OL', 'OPTION', 'P', 'PRE',
    'SECTION', 'SUMMARY', 'TABLE', 'TBODY', 'TD', 'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
  ]);

  /* Elements that must never be translated and travel through the model as a
   * single opaque token. Inline ones (code, img, input, svg) stay inside their
   * sentence; block ones (pre, textarea) end the unit. */
  const OPAQUE_TAGS = new Set([
    'SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'CANVAS', 'SVG', 'MATH', 'IFRAME', 'TEXTAREA',
    'INPUT', 'IMG', 'BR', 'HR', 'VIDEO', 'AUDIO', 'SOURCE', 'TRACK', 'OBJECT', 'EMBED', 'METER',
    'PROGRESS', 'DATALIST', 'TEMPLATE'
  ]);

  // Form controls own their text (user input or fallback content), but their
  // attributes — placeholder, aria-label, title, alt — are UI text.
  const FORM_TAGS = new Set(['TEXTAREA', 'INPUT', 'METER', 'PROGRESS', 'DATALIST']);
  const ATTR_NAMES = ['alt', 'title', 'placeholder', 'aria-label', 'aria-roledescription'];
  const TOOLTIP_ID = 'aipt-translator-tooltip';
  const SKIP_CLASS = 'aipt-translator-skip';
  const SELECTION_CLASS = 'aipt-translated-selection';
  const BANNER_ID = 'aipt-banner';
  const DYNAMIC_FLUSH_MS = 400;

  const state = {
    units: [],       // {el, snapshot, originalText, text, oldDir}
    texts: [],       // {node, text}  (loose text nodes in mixed containers)
    attrs: [],       // {el, attr, text}
    selections: [],  // {span, fragment}
    direction: null, // {lang, rtl, oldLang}
    translated: false,
    lang: null
  };

  let tooltip = null;
  let tooltipListenersInstalled = false;
  let observer = null;
  let shadowObservers = [];
  let pendingDynamic = [];
  let dynamicTimer = null;

  /* ---------------- shared helpers ---------------- */

  function getShadowRoot(el) {
    try {
      if (typeof chrome !== 'undefined' && chrome.dom && chrome.dom.openOrClosedShadowRoot) {
        return chrome.dom.openOrClosedShadowRoot(el);
      }
      return el.shadowRoot;
    } catch {
      return null;
    }
  }

  function tagOf(el) {
    return el && el.tagName ? el.tagName.toUpperCase() : '';
  }

  function isNeverTouched(el) {
    if (!el || el.nodeType !== 1) return true;
    if (OPAQUE_TAGS.has(tagOf(el))) return true;
    if (el.getAttribute('translate') === 'no') return true;
    if (el.classList.contains('notranslate') || el.classList.contains(SKIP_CLASS)) return true;
    // isContentEditable is the browser truth; the attribute check keeps the same
    // semantics where that property is unavailable.
    const editable = el.getAttribute('contenteditable');
    if (el.isContentEditable || editable === '' || editable === 'true' || editable === 'plaintext-only') return true;
    if (el.id === TOOLTIP_ID || el.id === BANNER_ID) return true;
    return false;
  }

  function isTextExcluded(el) {
    if (isNeverTouched(el)) return true;
    return FORM_TAGS.has(tagOf(el));
  }

  function isInsideTextExcluded(el) {
    for (let cur = el; cur && cur.nodeType === 1; cur = cur.parentElement) {
      if (isTextExcluded(cur)) return true;
    }
    return false;
  }

  /* Attributes of a form control ARE UI text, so the control itself must not
   * disqualify its placeholder/title/aria-label. Only the control's ancestors
   * (a notranslate wrapper, a <pre>, an editable region) exclude it. */
  function isSelfAttrExcluded(el) {
    if (el.getAttribute('translate') === 'no') return true;
    if (el.classList.contains('notranslate') || el.classList.contains(SKIP_CLASS)) return true;
    const editable = el.getAttribute('contenteditable');
    if (editable === '' || editable === 'true' || editable === 'plaintext-only' || el.isContentEditable) return true;
    if (el.id === TOOLTIP_ID || el.id === BANNER_ID) return true;
    return false;
  }

  function isInsideAttrExcluded(el) {
    if (isSelfAttrExcluded(el)) return true;
    for (let cur = el.parentElement; cur && cur.nodeType === 1; cur = cur.parentElement) {
      if (isNeverTouched(cur)) return true;
    }
    return false;
  }

  function splitWhitespace(text) {
    const leading = text.match(/^\s*/)[0];
    const trailing = text.match(/\s*$/)[0];
    const core = text.slice(leading.length, text.length - trailing.length);
    return { lead: leading, core, trail: trailing };
  }

  function hasLetter(text) {
    return /\p{L}/u.test(text);
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  /* ---------------- collection ---------------- */

  function containsBlock(el) {
    for (const child of Array.from(el.children)) {
      const tag = tagOf(child);
      if (BLOCK_TAGS.has(tag)) return true;
      if (isNeverTouched(child)) continue; // inline code/img stays in the sentence
      if (containsBlock(child)) return true;
    }
    return false;
  }

  function collectAttrs(scope, attrs) {
    if (!scope || typeof scope.querySelectorAll !== 'function') return;
    const elements = [];
    if (scope.nodeType === 1) elements.push(scope);
    elements.push(...scope.querySelectorAll('[' + ATTR_NAMES.join('], [') + ']'));
    for (const el of elements) {
      if (isInsideAttrExcluded(el)) continue;
      for (const attr of ATTR_NAMES) {
        const value = el.getAttribute(attr);
        if (!value || !value.trim() || !hasLetter(value)) continue;
        if (!el.__aipt_translatedAttrs) el.__aipt_translatedAttrs = new Set();
        if (el.__aipt_translatedAttrs.has(attr)) continue;
        const ws = splitWhitespace(value);
        attrs.push({ el, attr, text: value, lead: ws.lead, core: ws.core, trail: ws.trail });
      }
    }
  }

  function addLooseText(node, texts) {
    if (!node || node.nodeType !== 3) return;
    if (node.__aipt_done) return;
    const trimmed = node.data.trim();
    if (!trimmed || !hasLetter(trimmed)) return;
    if (isInsideTextExcluded(node.parentElement)) return;
    const ws = splitWhitespace(node.data);
    texts.push({ node, text: node.data, lead: ws.lead, core: ws.core, trail: ws.trail });
  }

  /* Last-resort path for trees that cannot be tokenised (an inline element that
   * wraps a block, or literal token-like text in the page). Keeps the old
   * per-text-node behaviour so nothing is silently dropped. */
  function collectTextNodes(root, texts) {
    const stack = [root];
    while (stack.length) {
      const scope = stack.pop();
      for (const child of Array.from(scope.childNodes || [])) {
        if (child.nodeType === 3) {
          addLooseText(child, texts);
        } else if (child.nodeType === 1) {
          if (isNeverTouched(child)) continue;
          stack.push(child);
        }
      }
    }
  }

  /* Serialises a unit's inline content. Paired inline elements become
   * <tN>...</tN>, opaque ones <vN/>; every token maps back to a live element. */
  function serializeUnit(el) {
    const ids = new Map();
    const parts = [];
    let nextId = 0;
    let collision = false;
    let unsupported = false;

    function walkNode(node) {
      if (node.nodeType === 3) {
        if (/<\/?[tv]\d+\s*\/?>/.test(node.data)) collision = true;
        parts.push(node.data);
        return;
      }
      if (node.nodeType !== 1) return;
      if (BLOCK_TAGS.has(tagOf(node))) {
        unsupported = true;
        return;
      }
      const id = ++nextId;
      if (isNeverTouched(node)) {
        ids.set(id, { el: node, opaque: true });
        parts.push(`<v${id}/>`);
        return;
      }
      ids.set(id, { el: node, opaque: false });
      parts.push(`<t${id}>`);
      for (const child of Array.from(node.childNodes)) walkNode(child);
      parts.push(`</t${id}>`);
    }

    for (const child of Array.from(el.childNodes)) walkNode(child);
    if (unsupported || collision) return { unsupported, collision };

    const raw = parts.join('');
    const ws = splitWhitespace(raw);
    // Token-only content (e.g. a paragraph that now only holds a selection
    // span) has no text of its own: strip the tokens before deciding.
    if (!hasLetter(ws.core.replace(/<[tv]\d+\s*\/?>/g, ''))) return null;
    return { core: ws.core, ids, count: nextId, lead: ws.lead, trail: ws.trail };
  }

  function addUnit(el, out) {
    if (el.__aipt_unit_done) return;
    const serialized = serializeUnit(el);
    if (!serialized) return;
    if (serialized.unsupported || serialized.collision) {
      collectTextNodes(el, out.texts);
      return;
    }
    out.units.push({
      el,
      text: serialized.core,
      ids: serialized.ids,
      tokenCount: serialized.count,
      lead: serialized.lead,
      trail: serialized.trail
    });
  }

  function walkShadowRoot(root, out) {
    collectAttrs(root, out.attrs);
    for (const child of Array.from(root.children || [])) walkElement(child, out);
    for (const node of Array.from(root.childNodes || [])) addLooseText(node, out.texts);
  }

  function walkElement(el, out) {
    if (!el || el.nodeType !== 1) return;
    if (isNeverTouched(el)) return;
    if (el.__aipt_unit_done) return;

    const sr = getShadowRoot(el);
    if (sr && !out.seenRoots.has(sr)) {
      out.seenRoots.add(sr);
      out.shadowRoots.push(sr);
      walkShadowRoot(sr, out);
    }

    // The whole element is inline content: it is the sentence.
    if (!containsBlock(el)) {
      addUnit(el, out);
      return;
    }

    for (const child of Array.from(el.children)) walkElement(child, out);
    for (const node of Array.from(el.childNodes)) addLooseText(node, out.texts);
  }

  function collect(root) {
    const out = { units: [], texts: [], attrs: [], shadowRoots: [], seenRoots: new Set() };
    if (!root) return out;

    let start = null;
    if (root.nodeType === 9) start = root.body || root.documentElement;
    else if (root.nodeType === 11) start = root;
    else if (root.nodeType === 1) start = root;
    if (!start) return out;

    // Never translate <head> (title/meta) — it only changed the tab title.
    if (start.nodeType === 1 && start === document.documentElement) start = document.body || start;
    if (start.nodeType === 1 && start === document.head) return out;

    if (start.nodeType === 1 && isNeverTouched(start)) {
      if (!isInsideAttrExcluded(start)) collectAttrs(start, out.attrs);
      return out;
    }

    collectAttrs(start, out.attrs);
    if (start.nodeType === 11) {
      walkShadowRoot(start, out);
    } else if (start === document.body) {
      // Body is a container, not a sentence: never rebuild it.
      for (const child of Array.from(start.children || [])) walkElement(child, out);
      for (const node of Array.from(start.childNodes || [])) addLooseText(node, out.texts);
    } else {
      // A subtree handed in by the dynamic observer can itself be a unit
      // (a freshly added <p>, <li>, <button>…).
      walkElement(start, out);
    }
    return out;
  }

  /* ---------------- apply ---------------- */

  function snapshotChildren(parent) {
    const list = [];
    for (const node of Array.from(parent.childNodes)) {
      if (node.nodeType === 1) list.push({ type: 'el', node, children: snapshotChildren(node) });
      else if (node.nodeType === 3) list.push({ type: 'text', node });
      else list.push({ type: 'other', node });
    }
    return list;
  }

  function restoreList(list) {
    const frag = document.createDocumentFragment();
    for (const entry of list) {
      if (entry.type === 'el') {
        clearChildren(entry.node);
        entry.node.appendChild(restoreList(entry.children));
        frag.appendChild(entry.node);
      } else {
        frag.appendChild(entry.node);
      }
    }
    return frag;
  }

  const TOKEN_RE = /<t(\d+)\s*>|<\/t(\d+)\s*>|<v(\d+)\s*\/>/g;
  const ANY_TOKEN_RE = /<\/?[tv]\d+\s*\/?>/;

  /* A translation is only applied if every inline element is present exactly
   * once and correctly nested. A dropped <t1> means a lost link, so the unit is
   * rejected instead of being written with the link removed. */
  function validateTokens(unit, text) {
    TOKEN_RE.lastIndex = 0;
    const stack = [];
    const opened = new Set();
    const closed = new Set();
    const voids = new Set();
    let rest = '';
    let last = 0;
    let match;
    while ((match = TOKEN_RE.exec(text))) {
      rest += text.slice(last, match.index);
      last = TOKEN_RE.lastIndex;
      if (match[1] !== undefined) {
        const id = Number(match[1]);
        const info = unit.ids.get(id);
        if (!info || info.opaque || opened.has(id)) return false;
        opened.add(id);
        stack.push(id);
      } else if (match[2] !== undefined) {
        const id = Number(match[2]);
        if (!stack.length || stack[stack.length - 1] !== id) return false;
        stack.pop();
        closed.add(id);
      } else {
        const id = Number(match[3]);
        const info = unit.ids.get(id);
        if (!info || !info.opaque || voids.has(id)) return false;
        voids.add(id);
      }
    }
    rest += text.slice(last);
    if (stack.length) return false;
    if (ANY_TOKEN_RE.test(rest)) return false;
    for (const [id, info] of unit.ids) {
      if (info.opaque ? !voids.has(id) : !(opened.has(id) && closed.has(id))) return false;
    }
    return true;
  }

  function buildNodes(unit, text) {
    const frag = document.createDocumentFragment();
    const stack = [frag];
    if (unit.lead) frag.appendChild(document.createTextNode(unit.lead));
    let last = 0;
    let match;
    TOKEN_RE.lastIndex = 0;
    const appendText = (value) => {
      if (!value) return;
      stack[stack.length - 1].appendChild(document.createTextNode(value));
    };
    while ((match = TOKEN_RE.exec(text))) {
      appendText(text.slice(last, match.index));
      if (match[1] !== undefined) {
        const el = unit.ids.get(Number(match[1])).el;
        clearChildren(el);
        stack[stack.length - 1].appendChild(el);
        stack.push(el);
      } else if (match[2] !== undefined) {
        stack.pop();
      } else {
        stack[stack.length - 1].appendChild(unit.ids.get(Number(match[3])).el);
      }
      last = TOKEN_RE.lastIndex;
    }
    appendText(text.slice(last));
    if (unit.trail) frag.appendChild(document.createTextNode(unit.trail));
    return frag;
  }

  function finishUnit(el, snapshot, originalText, text) {
    // Remember the class attribute itself: classList.remove() leaves class=""
    // behind on an element that had no class attribute, which makes restore
    // visibly complete but not byte-exact.
    const oldClass = el.getAttribute('class');
    el.__aipt_unit_done = true;
    el.classList.add('aipt-translated', 'aipt-translated-block');
    const record = { el, snapshot, originalText, text, oldDir: undefined, oldClass };
    if (state.direction) {
      record.oldDir = el.getAttribute('dir');
      el.setAttribute('dir', state.direction.rtl ? 'rtl' : 'ltr');
    }
    state.units.push(record);
  }

  function applyUnit(unit, translation) {
    if (!unit || !unit.el || !unit.el.isConnected) return false;
    if (unit.el.__aipt_unit_done) return false;
    let text = typeof translation === 'string' ? translation.trim() : '';
    if (!text) return false;
    if (unit.tokenCount > 0) {
      if (!validateTokens(unit, text)) return false;
    } else {
      // No inline elements in this unit: a token the model invented would be
      // shown to the reader as literal markup.
      text = text.replace(/<\/?[tv]\d+\s*\/?>/g, '').trim();
      if (!text) return false;
    }

    const snapshot = snapshotChildren(unit.el);
    const originalText = unit.el.textContent;

    if (unit.tokenCount === 0) {
      const frag = document.createDocumentFragment();
      if (unit.lead) frag.appendChild(document.createTextNode(unit.lead));
      frag.appendChild(document.createTextNode(text));
      if (unit.trail) frag.appendChild(document.createTextNode(unit.trail));
      clearChildren(unit.el);
      unit.el.appendChild(frag);
      finishUnit(unit.el, snapshot, originalText, unit.text);
      return true;
    }

    let rebuilt;
    try {
      rebuilt = buildNodes(unit, text);
    } catch {
      // Put the original nodes back; build may have emptied an inline element.
      clearChildren(unit.el);
      unit.el.appendChild(restoreList(snapshot));
      return false;
    }
    clearChildren(unit.el);
    unit.el.appendChild(rebuilt);
    finishUnit(unit.el, snapshot, originalText, unit.text);
    return true;
  }

  function applyText(entry, translation) {
    if (!entry || !entry.node || !entry.node.isConnected) return false;
    if (entry.node.__aipt_done) return false;
    const text = typeof translation === 'string' ? translation.trim() : '';
    if (!text) return false;
    entry.node.__aipt_original = entry.text;
    entry.node.textContent = entry.lead + text + entry.trail;
    entry.node.__aipt_done = true;
    state.texts.push({ node: entry.node, text: entry.text });
    return true;
  }

  function applyAttr(entry, translation) {
    if (!entry || !entry.el || !entry.el.isConnected) return false;
    const text = typeof translation === 'string' ? translation.trim() : '';
    if (!text) return false;
    entry.el.setAttribute(entry.attr, entry.lead + text + entry.trail);
    if (!entry.el.__aipt_translatedAttrs) entry.el.__aipt_translatedAttrs = new Set();
    entry.el.__aipt_translatedAttrs.add(entry.attr);
    state.attrs.push({ el: entry.el, attr: entry.attr, text: entry.text });
    return true;
  }

  /* ---------------- direction ---------------- */

  const RTL_CODES = new Set(['ar', 'fa', 'he', 'ur']);

  function isRTL(lang) {
    return RTL_CODES.has(String(lang || '').toLowerCase());
  }

  /* Direction is applied per translated block. Flipping <html> broke centred
   * layouts, code blocks and every non-translated element on the page. */
  function applyDirection(lang, rtl) {
    if (!lang) return;
    const html = document.documentElement;
    if (!state.direction) {
      state.direction = { lang, rtl: !!rtl, oldLang: html.getAttribute('lang') };
    }
    state.direction.lang = lang;
    state.direction.rtl = !!rtl;
    if (html.getAttribute('lang') !== lang) html.setAttribute('lang', lang);
    for (const unit of state.units) {
      if (!unit.el.isConnected) continue;
      if (unit.oldDir === undefined) unit.oldDir = unit.el.getAttribute('dir');
      unit.el.setAttribute('dir', rtl ? 'rtl' : 'ltr');
    }
  }

  function restoreDirection() {
    const direction = state.direction;
    if (!direction) return;
    for (const unit of state.units) {
      if (unit.oldDir === undefined || !unit.el.isConnected) continue;
      if (unit.oldDir === null) unit.el.removeAttribute('dir');
      else unit.el.setAttribute('dir', unit.oldDir);
    }
    const html = document.documentElement;
    if (direction.oldLang === null) html.removeAttribute('lang');
    else html.setAttribute('lang', direction.oldLang);
    state.direction = null;
  }

  /* ---------------- tooltip ---------------- */

  function ensureTooltip() {
    if (tooltip) return tooltip;
    tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    tooltip.className = SKIP_CLASS;
    tooltip.dir = 'auto';
    tooltip.style.cssText = 'position:fixed;z-index:2147483647;max-width:320px;padding:10px 14px;background:#222;color:#fff;border-radius:6px;font-size:13px;line-height:1.5;pointer-events:none;opacity:0;transition:opacity .15s ease;box-shadow:0 2px 10px rgba(0,0,0,.35);display:none;';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function showTooltip(targetEl, originalText) {
    const t = ensureTooltip();
    t.textContent = originalText;
    t.style.display = 'block';
    requestAnimationFrame(() => { t.style.opacity = 1; });
    const r = targetEl.getBoundingClientRect();
    t.style.left = Math.max(8, Math.min(window.innerWidth - t.offsetWidth - 8, r.left + r.width / 2 - t.offsetWidth / 2)) + 'px';
    t.style.top = Math.max(8, r.top - t.offsetHeight - 10) + 'px';
  }

  function hideTooltip() {
    if (!tooltip) return;
    tooltip.style.opacity = 0;
    setTimeout(() => { if (tooltip) tooltip.style.display = 'none'; }, 150);
  }

  function unitFor(el) {
    for (const unit of state.units) {
      if (unit.el === el) return unit;
    }
    return null;
  }

  function setupTooltipDelegation() {
    if (tooltipListenersInstalled) return;
    tooltipListenersInstalled = true;
    document.addEventListener('mouseover', (e) => {
      if (!state.translated) return;
      const target = e.target && e.target.closest ? e.target.closest('.aipt-translated-block') : null;
      if (!target) return;
      const unit = unitFor(target);
      const original = unit && unit.originalText ? unit.originalText.trim() : '';
      if (original && original !== target.textContent.trim()) {
        showTooltip(target, original.slice(0, 1200));
      }
    }, true);
    document.addEventListener('mouseout', (e) => {
      if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('.aipt-translated-block')) {
        hideTooltip();
      }
    }, true);
    document.addEventListener('mousemove', (e) => {
      if (tooltip && tooltip.style.display === 'block') {
        tooltip.style.left = Math.min(window.innerWidth - tooltip.offsetWidth - 8, Math.max(8, e.clientX + 12)) + 'px';
        tooltip.style.top = Math.min(window.innerHeight - tooltip.offsetHeight - 8, Math.max(8, e.clientY + 12)) + 'px';
      }
    });
  }

  /* ---------------- restore ---------------- */

  /* Drop references to nodes the page has thrown away (SPA navigation), so a
   * long session does not hold detached DOM trees alive. */
  function pruneDetached() {
    state.units = state.units.filter(({ el }) => el.isConnected);
    state.texts = state.texts.filter(({ node }) => node.isConnected);
    state.attrs = state.attrs.filter(({ el }) => el.isConnected);
    state.selections = state.selections.filter(({ span }) => span.isConnected);
    pendingDynamic = pendingDynamic.filter((item) => {
      if (item.kind === 'unit') return item.unit.el.isConnected;
      if (item.kind === 'text') return item.entry.node.isConnected;
      return item.entry.el.isConnected;
    });
  }

  function restore() {
    restoreDirection();

    for (const unit of state.units) {
      try {
        if (unit.el.isConnected) {
          clearChildren(unit.el);
          unit.el.appendChild(restoreList(unit.snapshot));
        }
      } catch {}
      unit.el.__aipt_unit_done = false;
      unit.el.classList.remove('aipt-translated', 'aipt-translated-block');
      if (unit.oldClass === null) unit.el.removeAttribute('class');
      else if (unit.oldClass !== undefined) unit.el.setAttribute('class', unit.oldClass);
    }

    for (const { node, text } of state.texts) {
      try {
        if (node.isConnected) node.textContent = text;
      } catch {}
      node.__aipt_done = false;
      delete node.__aipt_original;
    }

    for (let i = state.attrs.length - 1; i >= 0; i--) {
      const { el, attr, text } = state.attrs[i];
      try {
        if (el.isConnected) el.setAttribute(attr, text);
      } catch {}
      if (el.__aipt_translatedAttrs) el.__aipt_translatedAttrs.clear();
    }

    for (const { span, fragment } of state.selections) {
      try {
        if (!span.isConnected) continue;
        if (fragment) span.replaceWith(fragment);
        else span.remove();
      } catch {}
    }

    if (dynamicTimer) {
      clearTimeout(dynamicTimer);
      dynamicTimer = null;
    }
    for (const item of pendingDynamic) {
      if (item.kind === 'text') {
        item.entry.node.__aipt_done = false;
        delete item.entry.node.__aipt_original;
      }
    }
    pendingDynamic = [];

    state.units = [];
    state.texts = [];
    state.attrs = [];
    state.selections = [];
    state.translated = false;
    state.lang = null;

    hideTooltip();
  }

  /* ---------------- selection ---------------- */

  /* Replace a selection's text without losing the inline markup underneath:
   * the original nodes are kept in a fragment and put back by restore(). The
   * inserted span is skipped by collect(), so it is never translated twice. */
  function replaceSelection(range, translatedText) {
    if (!range || range.collapsed || typeof translatedText !== 'string' || !translatedText.trim()) return null;
    const fragment = range.extractContents();
    const span = document.createElement('span');
    span.className = SELECTION_CLASS + ' ' + SKIP_CLASS;
    span.dir = 'auto';
    span.textContent = translatedText.trim();
    range.insertNode(span);
    state.selections.push({ span, fragment });
    return span;
  }

  /* ---------------- dynamic content ---------------- */

  function enqueueUnit(unit) {
    pendingDynamic.push({ kind: 'unit', unit });
  }

  function collectAddedNode(node) {
    if (!node) return;
    if (node.nodeType === 1) {
      const sub = collect(node);
      for (const unit of sub.units) pendingDynamic.push({ kind: 'unit', unit });
      for (const entry of sub.texts) pendingDynamic.push({ kind: 'text', entry });
      for (const entry of sub.attrs) pendingDynamic.push({ kind: 'attr', entry });
      for (const sr of sub.shadowRoots) observeShadowRoot(sr);
    } else if (node.nodeType === 3) {
      const parent = node.parentElement;
      if (!parent || isInsideTextExcluded(parent) || node.__aipt_done) return;
      const trimmed = node.data.trim();
      if (!trimmed || !hasLetter(trimmed)) return;

      // New text inside an existing page: translate the highest ancestor whose
      // whole content is inline, so a re-rendered sentence keeps its links.
      let target = node.parentElement;
      while (target && target.parentElement && !containsBlock(target.parentElement) && !isNeverTouched(target.parentElement)) {
        target = target.parentElement;
      }
      if (target && !containsBlock(target) && !isNeverTouched(target) && !target.__aipt_unit_done) {
        const serialized = serializeUnit(target);
        if (serialized && !serialized.unsupported && !serialized.collision) {
          enqueueUnit({ el: target, text: serialized.core, ids: serialized.ids, tokenCount: serialized.count });
          return;
        }
      }
      const ws = splitWhitespace(node.data);
      pendingDynamic.push({ kind: 'text', entry: { node, text: node.data, lead: ws.lead, core: ws.core, trail: ws.trail } });
    }
  }

  function dedupeBatch(batch) {
    const units = [];
    const texts = [];
    const attrs = [];
    const seenUnits = new Set();
    const seenTexts = new Set();
    const seenAttrPairs = [];
    for (const item of batch) {
      if (item.kind === 'unit') {
        const { el } = item.unit;
        if (!el.isConnected || seenUnits.has(el) || el.__aipt_unit_done) continue;
        seenUnits.add(el);
        units.push(item.unit);
      } else if (item.kind === 'text') {
        const { node } = item.entry;
        if (!node.isConnected || seenTexts.has(node) || node.__aipt_done) continue;
        seenTexts.add(node);
        texts.push(item.entry);
      } else {
        const { el, attr } = item.entry;
        if (!el.isConnected) continue;
        if (seenAttrPairs.some(([seenEl, seenAttr]) => seenEl === el && seenAttr === attr)) continue;
        seenAttrPairs.push([el, attr]);
        attrs.push(item.entry);
      }
    }
    return { units, texts, attrs };
  }

  /* Rebuilding a block is a mutation like any other. Without this, the observer
   * saw our own translated text nodes, queued them, and translated them again
   * (visible as a doubled prefix or twice-translated link text). MutationObserver
   * queues records until the microtask checkpoint, so takeRecords() right after
   * our writes drops exactly those. */
  function dropOwnMutations() {
    try { if (observer) observer.takeRecords(); } catch {}
    for (const { observer: obs } of shadowObservers) {
      try { obs.takeRecords(); } catch {}
    }
  }

  function groupByCore(list, keyOf) {
    const map = new Map();
    for (const item of list) {
      const key = keyOf(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    }
    return map;
  }

  function scheduleDynamicFlush(getCtx, engine, signal) {
    if (!pendingDynamic.length || dynamicTimer) return;
    dynamicTimer = setTimeout(async () => {
      const batch = pendingDynamic;
      pendingDynamic = [];
      dynamicTimer = null;

      const { units, texts, attrs } = dedupeBatch(batch);
      if (!units.length && !texts.length && !attrs.length) return;

      const baseCtx = getCtx();
      const makeCtx = (kind) => ({
        ...baseCtx,
        kind,
        onStatus: () => {},
        stats: { skipped: 0, lastError: '' }
      });

      try {
        if (units.length) {
          const grouped = groupByCore(units, (u) => u.text);
          const keys = Array.from(grouped.keys());
          const translations = await engine.translateTexts(keys, makeCtx('block'), signal);
          if ((signal && signal.aborted) || !state.translated) return;
          keys.forEach((key, index) => {
            for (const unit of grouped.get(key)) applyUnit(unit, translations[index]);
          });
          dropOwnMutations();
        }
        if (texts.length) {
          const grouped = groupByCore(texts, (t) => t.core);
          const keys = Array.from(grouped.keys());
          const translations = await engine.translateTexts(keys, makeCtx('block'), signal);
          if ((signal && signal.aborted) || !state.translated) return;
          keys.forEach((key, index) => {
            for (const entry of grouped.get(key)) applyText(entry, translations[index]);
          });
          dropOwnMutations();
        }
        if (attrs.length) {
          const grouped = groupByCore(attrs, (a) => a.core);
          const keys = Array.from(grouped.keys());
          const translations = await engine.translateTexts(keys, makeCtx('label'), signal);
          if ((signal && signal.aborted) || !state.translated) return;
          keys.forEach((key, index) => {
            for (const entry of grouped.get(key)) applyAttr(entry, translations[index]);
          });
          dropOwnMutations();
        }
      } catch (err) {
        if (!(err && err.type === 'abort')) {
          console.error('[AI Page Translator] dynamic update failed', err);
        }
      }
    }, DYNAMIC_FLUSH_MS);
  }

  function onMutation(mutations, getCtx, engine, signal) {
    if (!state.translated) return;
    for (const m of mutations) {
      for (const node of m.addedNodes) collectAddedNode(node);
    }
    scheduleDynamicFlush(getCtx, engine, signal);
  }

  function observeShadowRoot(sr, getCtx, engine, signal) {
    if (shadowObservers.some((o) => o.root === sr)) return;
    const obs = new MutationObserver((mutations) => onMutation(mutations, getCtx, engine, signal));
    obs.observe(sr, { childList: true, subtree: true });
    shadowObservers.push({ root: sr, observer: obs });
  }

  function observeDynamic(getCtx, engine, signal, shadowRoots = []) {
    if (observer) return;
    observer = new MutationObserver((mutations) => onMutation(mutations, getCtx, engine, signal));
    observer.observe(document.documentElement, { childList: true, subtree: true });
    for (const sr of shadowRoots) observeShadowRoot(sr, getCtx, engine, signal);
  }

  function disconnectObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    for (const { observer: obs } of shadowObservers) obs.disconnect();
    shadowObservers = [];
    if (dynamicTimer) {
      clearTimeout(dynamicTimer);
      dynamicTimer = null;
    }
    pendingDynamic = [];
  }

  return {
    collect,
    applyUnit,
    applyText,
    applyAttr,
    replaceSelection,
    pruneDetached,
    restore,
    applyDirection,
    isRTL,
    setupTooltipDelegation,
    observeDynamic,
    disconnectObserver,
    state
  };
})();
