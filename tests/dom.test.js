import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPage } from './helpers/load.js';

// Spread into same-realm arrays so strict deep-equality works across jsdom's realm.
const attrTexts = (collected) => [...collected.attrs.map((a) => a.text)];
const unitTexts = (collected) => [...collected.units.map((u) => u.text)];
const plain = (text) => text.replace(/<\/?[tv]\d+\s*\/?>/g, '');
const plainUnits = (collected) => [...collected.units.map((u) => plain(u.text))];

test('form control attributes are collected, form control text is not (B3)', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body>
      <form>
        <input id="search" type="search" placeholder="Search the site" aria-label="Search">
        <textarea id="message" placeholder="Write a message">Draft text</textarea>
        <button aria-label="Submit form">Send</button>
        <pre><input id="in-pre" placeholder="Inside pre"></pre>
        <input id="blocked" placeholder="Skip me" class="notranslate">
      </form>
      <p id="prose">Hello world</p>
    </body></html>`
  });

  const collected = AIPT.Dom.collect(document.documentElement);
  const values = attrTexts(collected);

  assert.ok(values.includes('Search the site'), 'input placeholder must be collected');
  assert.ok(values.includes('Search'), 'aria-label on a form control must be collected');
  assert.ok(values.includes('Write a message'), 'textarea placeholder must be collected');
  assert.ok(values.includes('Submit form'), 'aria-label on a button must be collected');
  assert.equal(values.includes('Inside pre'), false, 'attributes inside <pre> stay untouched');
  assert.equal(values.includes('Skip me'), false, 'notranslate still wins over attribute translation');

  const texts = plainUnits(collected);
  assert.equal(texts.includes('Draft text'), false, 'textarea content is user input, never translated');
  assert.ok(texts.includes('Send'), 'button text is translated');
  assert.ok(texts.includes('Hello world'));
});

test('a form control added on its own is still collectable for attributes (B3, dynamic path)', () => {
  const { AIPT, document } = loadPage({ html: '<!DOCTYPE html><html><body></body></html>' });
  const input = document.createElement('input');
  input.id = 'late';
  input.setAttribute('placeholder', 'Search products');
  document.body.appendChild(input);

  const collected = AIPT.Dom.collect(input);
  assert.deepEqual(attrTexts(collected), ['Search products']);
  assert.deepEqual(unitTexts(collected), []);
});

test('placeholder and aria-label round-trip through apply and restore (B3, B8)', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body>
      <input id="search" placeholder="Search the site" aria-label="Search">
      <input id="typing" placeholder="Write here">
    </body></html>`
  });
  const search = document.getElementById('search');
  const typing = document.getElementById('typing');
  // Simulate a value the user already typed: it must survive the translation.
  typing.value = 'my draft';

  const collected = AIPT.Dom.collect(document.documentElement);
  for (const entry of collected.attrs) AIPT.Dom.applyAttr(entry, 'translated:' + entry.core);

  assert.equal(search.getAttribute('placeholder'), 'translated:Search the site');
  assert.equal(search.getAttribute('aria-label'), 'translated:Search');
  assert.equal(typing.getAttribute('placeholder'), 'translated:Write here');
  assert.equal(typing.value, 'my draft', 'translating the placeholder must not touch the value');

  // A second collect must not pick the translated attributes up again.
  const again = AIPT.Dom.collect(document.documentElement);
  assert.equal(again.attrs.length, 0);

  AIPT.Dom.restore();
  assert.equal(search.getAttribute('placeholder'), 'Search the site');
  assert.equal(search.getAttribute('aria-label'), 'Search');
  assert.equal(typing.getAttribute('placeholder'), 'Write here');
});

test('a sentence with inline elements is ONE unit with tokens, not four fragments', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body><p id="p">The <a href="/policy">new policy</a> takes effect <strong>immediately</strong>.</p></body></html>`
  });

  const collected = AIPT.Dom.collect(document.documentElement);
  assert.equal(collected.units.length, 1, 'the paragraph is a single translation unit');
  const unit = collected.units[0];
  assert.equal(unit.text, 'The <t1>new policy</t1> takes effect <t2>immediately</t2>.');
  assert.equal(unit.tokenCount, 2);
  assert.equal(unit.ids.get(1).el.tagName, 'A');
  assert.equal(unit.ids.get(2).el.tagName, 'STRONG');
});

test('reordered tokens rebuild the sentence and keep links, listeners and markup', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body><p id="p">The <a href="/policy">new policy</a> takes effect <strong>immediately</strong>.</p></body></html>`
  });
  const p = document.getElementById('p');
  const link = p.querySelector('a');
  const strong = p.querySelector('strong');
  let clicked = 0;
  link.addEventListener('click', () => { clicked++; });

  const unit = AIPT.Dom.collect(document.documentElement).units[0];
  const translated = '<t1>سیاست جدید</t1> بلافاصله <t2>اجرا می‌شود</t2>.';
  assert.equal(AIPT.Dom.applyUnit(unit, translated), true);

  assert.equal(p.textContent, 'سیاست جدید بلافاصله اجرا می‌شود.');
  assert.equal(p.firstChild, link, 'the original <a> node was reused and moved');
  assert.equal(link.getAttribute('href'), '/policy');
  assert.equal(link.textContent, 'سیاست جدید');
  assert.equal(strong.textContent, 'اجرا می‌شود');
  link.dispatchEvent(new document.defaultView.MouseEvent('click', { bubbles: true }));
  assert.equal(clicked, 1, 'the listener survived the rebuild');
  assert.equal(p.getAttribute('dir'), null, 'direction is only applied when requested');

  AIPT.Dom.restore();
  assert.equal(p.textContent, 'The new policy takes effect immediately.');
  assert.equal(p.querySelector('a'), link, 'restore puts the same nodes back');
  assert.equal(link.getAttribute('href'), '/policy');
});

test('translate -> restore is exact, including mixed text and attributes', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html lang="en"><body><p id="p" title="Tip">Use <code>npm test</code> <em>now</em>.</p></body></html>`
  });
  const p = document.getElementById('p');
  const before = p.innerHTML;

  const collected = AIPT.Dom.collect(document.documentElement);
  const unit = collected.units[0];
  assert.equal(unit.text, 'Use <v1/> <t2>now</t2>.');
  assert.equal(/npm test/.test(unit.text), false, 'code content is never sent to the model');

  assert.equal(AIPT.Dom.applyUnit(unit, 'از <v1/> <t2>همین حالا</t2> استفاده کنید.'), true);
  assert.equal(p.querySelector('code').textContent, 'npm test', 'code keeps its content');
  assert.equal(p.querySelector('em').textContent, 'همین حالا');

  AIPT.Dom.restore();
  assert.equal(p.innerHTML, before, 'restore is byte-for-byte the original markup');
});

test('a translation that drops a token is rejected before the DOM is touched', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body><p id="p">The <a href="/policy">new policy</a> applies.</p></body></html>`
  });
  const p = document.getElementById('p');
  const before = p.innerHTML;

  const unit = AIPT.Dom.collect(document.documentElement).units[0];
  assert.equal(AIPT.Dom.applyUnit(unit, 'سیاست جدید اعمال می‌شود.'), false, 'a missing <t1> loses the link');
  assert.equal(p.innerHTML, before);
  assert.equal(AIPT.Dom.state.units.length, 0);
  assert.equal(unit.el.__aipt_unit_done, undefined);

  // Unbalanced and unknown tokens are rejected too.
  assert.equal(AIPT.Dom.applyUnit(unit, '<t1>الف'), false);
  assert.equal(AIPT.Dom.applyUnit(unit, '<t9>الف</t9>'), false);
  assert.equal(AIPT.Dom.applyUnit(unit, '<t1>الف</t1><t1>ب</t1>'), false);
  assert.equal(p.innerHTML, before);
});

test('opaque inline elements are tokens; invented tokens in plain units are stripped', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body><p id="plain">Hello</p></body></html>`
  });
  const unit = AIPT.Dom.collect(document.documentElement).units[0];
  assert.equal(unit.tokenCount, 0);
  AIPT.Dom.applyUnit(unit, '<t1>سلام</t1>');
  assert.equal(document.getElementById('plain').textContent, 'سلام', 'literal markup never reaches the page');
});

test('selection replacement keeps the original inline markup and restores it (B4)', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body><p id="p">Visit <a href="/docs">the <em>docs</em></a> now</p></body></html>`
  });
  const p = document.getElementById('p');

  const range = document.createRange();
  range.setStart(p.firstChild, 0);
  range.setEnd(p.lastChild, p.lastChild.textContent.length);

  const span = AIPT.Dom.replaceSelection(range, 'متن ترجمه');
  assert.ok(span, 'replaceSelection returns the inserted span');
  assert.equal(span.className.includes('aipt-translated-selection'), true);
  assert.equal(p.textContent.trim(), 'متن ترجمه');

  // The inserted span must never be collected again (no double translation),
  // and a paragraph holding only that span has no text of its own.
  const collected = AIPT.Dom.collect(document.body);
  assert.equal(collected.units.length, 0);
  assert.equal(collected.texts.length, 0);

  AIPT.Dom.restore();

  const link = p.querySelector('a');
  assert.ok(link, 'the <a> element comes back on restore');
  assert.equal(link.getAttribute('href'), '/docs');
  assert.equal(link.querySelector('em').textContent, 'docs', 'nested inline markup is preserved');
  assert.equal(p.textContent, 'Visit the docs now');
  assert.equal(p.querySelector('.aipt-translated-selection'), null);
  assert.equal(AIPT.Dom.state.selections.length, 0);
});

test('replaceSelection refuses a collapsed range', () => {
  const { AIPT, document } = loadPage({ html: '<!DOCTYPE html><html><body><p id="p">Hello</p></body></html>' });
  const range = document.createRange();
  range.setStart(document.getElementById('p').firstChild, 2);
  range.collapse(true);
  assert.equal(AIPT.Dom.replaceSelection(range, 'x'), null);
  assert.equal(document.getElementById('p').textContent, 'Hello');
});

test('nested shadow roots are collected exactly once (B7)', () => {
  const { AIPT, document } = loadPage({ html: '<!DOCTYPE html><html><body></body></html>' });

  const host = document.createElement('div');
  document.body.appendChild(host);
  const outer = host.attachShadow({ mode: 'open' });
  const outerP = document.createElement('p');
  outerP.textContent = 'Outer shadow text';
  outer.appendChild(outerP);

  const innerHost = document.createElement('div');
  outer.appendChild(innerHost);
  const middle = innerHost.attachShadow({ mode: 'open' });

  const deepHost = document.createElement('div');
  middle.appendChild(deepHost);
  const deep = deepHost.attachShadow({ mode: 'open' });
  const deepP = document.createElement('p');
  deepP.textContent = 'Deep shadow text';
  deep.appendChild(deepP);

  const collected = AIPT.Dom.collect(document.documentElement);
  const texts = plainUnits(collected);

  assert.equal(texts.filter((t) => t === 'Outer shadow text').length, 1);
  assert.equal(texts.filter((t) => t === 'Deep shadow text').length, 1, 'a root inside a shadow root is walked once');
  assert.equal(collected.shadowRoots.length, 3);
  assert.equal(new Set(collected.shadowRoots).size, 3, 'no duplicate shadow root entries');

  // Attributes inside nested shadow roots are collected once as well.
  const deepInput = document.createElement('input');
  deepInput.setAttribute('placeholder', 'Deep placeholder');
  deep.appendChild(deepInput);
  const withAttr = AIPT.Dom.collect(document.documentElement);
  assert.equal(attrTexts(withAttr).filter((t) => t === 'Deep placeholder').length, 1);
});

test('translating a shadow-root subtree does not duplicate entries (B7)', () => {
  const { AIPT, document } = loadPage({ html: '<!DOCTYPE html><html><body></body></html>' });
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = host.attachShadow({ mode: 'open' });
  const section = document.createElement('section');
  const p = document.createElement('p');
  p.textContent = 'Shadow content';
  section.appendChild(p);
  root.appendChild(section);

  const collected = AIPT.Dom.collect(section);
  assert.equal(plainUnits(collected).filter((t) => t === 'Shadow content').length, 1);
});

test('restore clears bookkeeping so a later run translates again (B8)', () => {
  const { AIPT, document } = loadPage({
    html: '<!DOCTYPE html><html><body><p id="one">Hello</p><p id="two">World</p></body></html>'
  });

  const first = AIPT.Dom.collect(document.documentElement);
  assert.equal(first.units.length, 2);
  for (const unit of first.units) AIPT.Dom.applyUnit(unit, 'ترجمه');
  assert.equal(document.getElementById('one').textContent, 'ترجمه');

  // Everything is marked done, so nothing is collected while translated.
  assert.equal(AIPT.Dom.collect(document.documentElement).units.length, 0);

  AIPT.Dom.restore();
  assert.equal(document.getElementById('one').textContent, 'Hello');
  assert.equal(document.getElementById('two').textContent, 'World');
  assert.equal(AIPT.Dom.state.units.length, 0);
  assert.equal(document.querySelectorAll('.aipt-translated').length, 0);

  const second = AIPT.Dom.collect(document.documentElement);
  assert.deepEqual(plainUnits(second).sort(), ['Hello', 'World'], 'flags were cleared by restore');
});

test('pruneDetached drops references to elements the page removed (B8)', () => {
  const { AIPT, document } = loadPage({
    html: '<!DOCTYPE html><html><body><div id="keep"><p>Keep me</p></div><div id="drop"><p>Drop me</p></div></body></html>'
  });

  const collected = AIPT.Dom.collect(document.documentElement);
  for (const unit of collected.units) AIPT.Dom.applyUnit(unit, 'T:' + unit.text);
  assert.equal(AIPT.Dom.state.units.length, 2);

  document.getElementById('drop').remove();
  AIPT.Dom.pruneDetached();
  assert.equal(AIPT.Dom.state.units.length, 1);
  assert.equal(AIPT.Dom.state.units[0].el.isConnected, true);

  AIPT.Dom.restore();
  assert.equal(document.getElementById('keep').textContent, 'Keep me');
});

test('excluded subtrees are never collected', () => {
  const { AIPT, document } = loadPage({
    html: `<!DOCTYPE html><html><body>
      <div class="notranslate"><p>Never</p></div>
      <p translate="no">Never either</p>
      <pre><code>const x = 1;</code></pre>
      <div contenteditable="true">Editable text</div>
      <p>Translatable</p>
    </body></html>`
  });
  assert.deepEqual(plainUnits(AIPT.Dom.collect(document.documentElement)), ['Translatable']);
});

test('whitespace around a block is preserved when applying a translation', () => {
  const { AIPT, document } = loadPage({
    html: '<!DOCTYPE html><html><body><p id="p">   Hello world   </p></body></html>'
  });
  const unit = AIPT.Dom.collect(document.documentElement).units[0];
  assert.equal(unit.text, 'Hello world');

  AIPT.Dom.applyUnit(unit, 'سلام دنیا');
  assert.equal(document.getElementById('p').textContent, '   سلام دنیا   ');

  AIPT.Dom.restore();
  assert.equal(document.getElementById('p').textContent, '   Hello world   ');
});

test('identical strings are collected once per unique unit text, not per element', () => {
  const { AIPT, document } = loadPage({
    html: '<!DOCTYPE html><html><body><p>Same</p><p>Same</p><p>Other</p></body></html>'
  });
  const collected = AIPT.Dom.collect(document.documentElement);
  assert.equal(collected.units.length, 3);
  const unique = new Set(collected.units.map((u) => u.text));
  assert.deepEqual([...unique].sort(), ['Other', 'Same']);
});

test('direction is applied per translated unit and restored (no global html flip)', () => {
  const { AIPT, document } = loadPage({
    html: '<!DOCTYPE html><html lang="en" dir="ltr"><body><h1 id="h">Title</h1><p id="p">Body</p></body></html>'
  });
  const collected = AIPT.Dom.collect(document.documentElement);
  for (const unit of collected.units) AIPT.Dom.applyUnit(unit, 'متن');

  AIPT.Dom.applyDirection('fa', true);
  assert.equal(document.documentElement.getAttribute('lang'), 'fa');
  assert.equal(document.documentElement.getAttribute('dir'), 'ltr', 'the page direction itself is not flipped');
  assert.equal(document.getElementById('p').getAttribute('dir'), 'rtl');
  assert.equal(document.getElementById('h').getAttribute('dir'), 'rtl');

  AIPT.Dom.restore();
  assert.equal(document.documentElement.getAttribute('lang'), 'en');
  assert.equal(document.getElementById('p').getAttribute('dir'), null);
  assert.equal(document.getElementById('h').getAttribute('dir'), null);
});

test('dynamic flush translates new content exactly once and marks it as a block', async () => {
  const { AIPT, document } = loadPage({ html: '<!DOCTYPE html><html><body><p>First sentence</p></body></html>' });
  for (const unit of AIPT.Dom.collect(document.body).units) AIPT.Dom.applyUnit(unit, 'X:' + unit.text);
  AIPT.Dom.state.translated = true;

  let calls = 0;
  const engine = {
    translateTexts: async (texts) => {
      calls++;
      return texts.map((t) => 'Y:' + t);
    }
  };
  AIPT.Dom.observeDynamic(() => ({}), engine, undefined, []);

  const p = document.createElement('p');
  p.innerHTML = 'New with <a href="/z">a link</a> here';
  document.body.appendChild(p);

  await new Promise((resolve) => setTimeout(resolve, 800));
  AIPT.Dom.disconnectObserver();

  assert.equal(calls, 1, 'our own rebuild must not queue a second translation');
  assert.equal(p.textContent, 'Y:New with a link here');
  assert.equal(p.querySelector('a').getAttribute('href'), '/z');
  assert.equal(p.classList.contains('aipt-translated-block'), true, 'the new paragraph is a unit, not loose text');

  AIPT.Dom.restore();
  assert.equal(p.textContent, 'New with a link here');
});

test('restore is byte-exact for the whole container, including absent class attributes', () => {
  const { AIPT, document } = loadPage({
    html: '<!DOCTYPE html><html><body>\n<header><nav><a href="/">Home</a> <a href="/x">X</a></nav></header>\n<p id="p">Body</p>\n</body></html>'
  });
  const before = document.body.innerHTML;
  for (const unit of AIPT.Dom.collect(document.body).units) AIPT.Dom.applyUnit(unit, 'FA:' + unit.text);
  assert.equal(document.querySelector('nav').getAttribute('class').includes('aipt-translated-block'), true);
  AIPT.Dom.restore();
  assert.equal(document.body.innerHTML, before);
  assert.equal(document.querySelector('nav').hasAttribute('class'), false, 'no class="" left behind');
});

test('a subtree handed in directly is collected as one unit (dynamic path)', () => {
  const { AIPT, document } = loadPage({ html: '<!DOCTYPE html><html><body></body></html>' });
  const p = document.createElement('p');
  p.innerHTML = 'New with <a href="/z">a link</a> here';
  document.body.appendChild(p);

  const collected = AIPT.Dom.collect(p);
  assert.equal(collected.units.length, 1, 'the paragraph itself is the unit, not its text nodes');
  assert.equal(collected.units[0].el, p);
  assert.equal(collected.units[0].text, 'New with <t1>a link</t1> here');
});

test('attributes inside a translated block are still collected', () => {
  const { AIPT, document } = loadPage({
    html: '<!DOCTYPE html><html><body><p>Read <a href="#" title="Opens in a new tab">more</a></p></body></html>'
  });
  const collected = AIPT.Dom.collect(document.documentElement);
  assert.equal(collected.units.length, 1);
  assert.deepEqual(attrTexts(collected), ['Opens in a new tab']);
});
