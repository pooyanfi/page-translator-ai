#!/usr/bin/env node
/* Dev-only: `npm run release` builds the shippable folder, then produces the
 * artifacts you actually hand to other people:
 *
 *   release/page-translator-ai-<version>.zip   single file, store-ready, or
 *                                              unzip + Load unpacked
 *   release/page-translator-ai-<version>.crx   signed package for the Chromium
 *                                              builds that still allow off-store
 *                                              installs (see INSTALL.txt)
 *   release/page-translator-ai-<version>.pem   the signing key: keep it private,
 *                                              reuse it or the extension ID changes
 *
 * None of this hides the source: a browser extension is client-side code and a
 * .crx is a signed zip. See README "Sharing it with other people".
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, copyFileSync, rmSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROOT, copyPackage, validatePackage } from './packaging.mjs';

const RELEASE_ROOT = path.join(ROOT, 'release');
/* Stable on purpose: the signing key decides the extension ID, so it must not
 * change when the version does, or an update installs as a different extension. */
const KEY_NAME = 'page-translator-ai-signing-key.pem';
const BROWSER_CANDIDATES = [
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/brave-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];

const INSTALL_TEXT = `AI Page Translator — install
============================

This package contains the whole extension. It does not contain any API key:
each user brings their own provider (Google Gemini, any OpenAI-compatible
endpoint, or a local Ollama model).

Option A — from the .zip (works everywhere)
  1. Unzip this archive into a folder you can keep.
  2. Open brave://extensions (or chrome://extensions).
  3. Turn on "Developer mode".
  4. Click "Load unpacked" and select the unzipped folder (the one with manifest.json).
  5. Open the extension's Options and connect a provider.

Option B — from the .crx (only where the browser allows it)
  Drag the .crx onto brave://extensions. Recent Chrome/Brave versions block
  off-store CRX installs on Windows and macOS; if it is blocked, use Option A
  or publish the extension to a store.

Note: a browser extension runs on the user's machine, so its code can always be
inspected. This package makes installation simple; it does not make the source
secret.
`;

function humanSize(file) {
  const bytes = statSync(file).size;
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

const validation = validatePackage(ROOT);
if (validation.problems.length) {
  console.error('Refusing to release:');
  for (const problem of validation.problems) console.error(` - ${problem}`);
  process.exit(1);
}

const packaged = copyPackage(ROOT);
if (!packaged.ok) {
  console.error('Packaging failed:');
  for (const problem of packaged.problems) console.error(` - ${problem}`);
  process.exit(1);
}

const version = packaged.versions.manifest;
const name = path.basename(packaged.target);
mkdirSync(RELEASE_ROOT, { recursive: true });

const installPath = path.join(RELEASE_ROOT, 'INSTALL.txt');
writeFileSync(installPath, INSTALL_TEXT);

/* Chrome/Store archives need manifest.json at the archive root, so zip the
 * contents of the package folder (not the folder itself). INSTALL.txt is added
 * flat on top; the extension never loads it. */
const zipPath = path.join(RELEASE_ROOT, `${name}.zip`);
rmSync(zipPath, { force: true });
execFileSync('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: packaged.target });
execFileSync('zip', ['-j', '-q', zipPath, installPath], { cwd: packaged.target });

const artifacts = [{ label: 'zip', file: zipPath }];

const browser = BROWSER_CANDIDATES.find((candidate) => existsSync(candidate));
if (browser) {
  const profile = mkdtempSync(path.join(tmpdir(), 'aipt-pack-'));
  const keyPath = path.join(RELEASE_ROOT, KEY_NAME);
  const packArgs = [
    `--pack-extension=${packaged.target}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check'
  ];
  /* Reuse the existing key; only the first release creates one. */
  if (existsSync(keyPath)) packArgs.push(`--pack-extension-key=${keyPath}`);
  try {
    /* Isolated profile: packing must not touch the user's real browser profile. */
    execFileSync(browser, packArgs, { stdio: 'ignore', timeout: 90000 });
  } catch {
    /* Packing can fail on a locked build; the zip is still complete. */
  }
  const crx = `${packaged.target}.crx`;
  const generatedPem = `${packaged.target}.pem`;
  if (existsSync(crx)) {
    const target = path.join(RELEASE_ROOT, `${name}.crx`);
    copyFileSync(crx, target);
    artifacts.push({ label: 'crx', file: target });
    rmSync(crx, { force: true });
  }
  if (existsSync(generatedPem)) {
    console.log(existsSync(keyPath)
      ? '  note: the browser produced a new key despite --pack-extension-key; the extension ID changed'
      : '  note: new signing key created — back it up, it defines the extension ID');
    copyFileSync(generatedPem, keyPath);
    rmSync(generatedPem, { force: true });
  }
  if (existsSync(keyPath)) artifacts.push({ label: 'signing key', file: keyPath });
}

console.log(`Released ${name}`);
for (const artifact of artifacts) {
  console.log(`  ${artifact.label.padEnd(12)} ${path.relative(ROOT, artifact.file)}  (${humanSize(artifact.file)})`);
}
if (!artifacts.some((a) => a.label === 'crx')) {
  console.log('  crx           not produced (no Chromium binary available); the zip is still usable');
}
console.log('\nHand out the zip. Keep the .pem private: it is the extension identity for future updates.');
