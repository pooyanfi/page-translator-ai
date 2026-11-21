#!/usr/bin/env node
/* Dev-only verification entry point: `npm run verify`.
 * Everything here checks the shipped extension; nothing here is shipped. */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, listExtensionJsFiles, validatePackage, EXTENSION_DIRS } from './packaging.mjs';

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

function listJs(dir) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return [];
  const out = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...listJs(relative));
    else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) out.push(relative);
  }
  return out;
}

/* Reads the arguments of every `callee(` call without needing an AST. */
function callArguments(source, callee) {
  const args = [];
  let index = source.indexOf(callee);
  while (index !== -1) {
    let cursor = index + callee.length;
    if (source[cursor] !== '(') {
      index = source.indexOf(callee, index + callee.length);
      continue;
    }
    let depth = 0;
    const start = cursor + 1;
    for (; cursor < source.length; cursor++) {
      if (source[cursor] === '(') depth++;
      else if (source[cursor] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    args.push(source.slice(start, cursor));
    index = source.indexOf(callee, cursor);
  }
  return args;
}

// 1. Syntax: every JavaScript file the project contains must parse.
const syntaxFiles = [
  ...listExtensionJsFiles(),
  ...listJs('tests'),
  ...listJs('scripts')
];
const syntaxProblems = [];
for (const file of syntaxFiles) {
  const check = spawnSync(process.execPath, ['--check', path.join(ROOT, file)], { encoding: 'utf8' });
  if (check.status !== 0) syntaxProblems.push(`${file}: ${(check.stderr || '').trim().split('\n').slice(0, 3).join(' ')}`);
}
record('node --check', syntaxProblems.length === 0, syntaxProblems.length ? syntaxProblems.join('\n') : `${syntaxFiles.length} files parse`);

// 2. Test suite.
const testFiles = listJs('tests').filter((file) => file.endsWith('.test.js'));
const tests = spawnSync(process.execPath, ['--test', ...testFiles], { cwd: ROOT, encoding: 'utf8' });
const testOutput = `${tests.stdout || ''}${tests.stderr || ''}`;
const passed = (testOutput.match(/^# pass (\d+)$/m) || [])[1];
const failed = (testOutput.match(/^# fail (\d+)$/m) || [])[1];
record(
  'node --test',
  tests.status === 0,
  tests.status === 0 ? `${passed} passing` : `${failed} failing\n${testOutput.split('\n').slice(-40).join('\n')}`
);

// 3. Static policy checks over extension code only.
const extensionSources = new Map(listExtensionJsFiles().map((file) => [file, fs.readFileSync(path.join(ROOT, file), 'utf8')]));

const htmlInjection = [];
const dynamicCode = [];
const devDependencies = [];
const moduleSyntax = [];
const keyInPayload = [];
const keyInPrompt = [];

for (const [file, source] of extensionSources) {
  if (/\b(innerHTML|outerHTML)\b|\binsertAdjacentHTML\s*\(/.test(source)) htmlInjection.push(file);
  if (/(^|[^\w.$])eval\s*\(|new\s+Function\s*\(/.test(source)) dynamicCode.push(file);
  if (/\brequire\s*\(|\bjsdom\b|\bnode_modules\b/.test(source)) devDependencies.push(file);

  // Content scripts, popup and options are classic scripts: no import/export.
  if (!file.startsWith('background/') && /^\s*(import|export)\s/m.test(source)) moduleSyntax.push(file);

  for (const arg of callArguments(source, 'chrome.runtime.sendMessage')) {
    if (/\bapiKey\b/.test(arg)) keyInPayload.push(file);
  }
  for (const arg of callArguments(source, 'JSON.stringify')) {
    if (/\bapiKey\b/.test(arg) && file === 'content/providers.js') keyInPrompt.push(file);
  }
}

record('no innerHTML/outerHTML/insertAdjacentHTML', htmlInjection.length === 0, htmlInjection.join(', ') || `${extensionSources.size} files clean`);
record('no eval / new Function', dynamicCode.length === 0, dynamicCode.join(', ') || 'clean');
record('no dev dependencies in extension code', devDependencies.length === 0, devDependencies.join(', ') || 'clean');
record('content scripts stay classic scripts', moduleSyntax.length === 0, moduleSyntax.join(', ') || 'clean');
record('API key never in a message payload', keyInPayload.length === 0, keyInPayload.join(', ') || 'clean');
record('API key never in a prompt body', keyInPrompt.length === 0, keyInPrompt.join(', ') || 'clean');

// Background modules may only import relative files.
const backgroundImports = [];
for (const [file, source] of extensionSources) {
  if (!file.startsWith('background/')) continue;
  for (const match of source.matchAll(/(?:import|export)[^'"]*from\s*['"]([^'"]+)['"]/g)) {
    if (!match[1].startsWith('./')) backgroundImports.push(`${file} -> ${match[1]}`);
  }
}
record('service worker imports are relative', backgroundImports.length === 0, backgroundImports.join(', ') || 'clean');

// 4. Packaging: allowlist, no dev files, manifest integrity, version parity.
const packaging = validatePackage(ROOT);
record(
  'packaging + version parity',
  packaging.problems.length === 0,
  packaging.problems.length
    ? packaging.problems.join('\n')
    : `${packaging.files.length} files, manifest ${packaging.versions.manifest} == package ${packaging.versions.package}`
);

// 5. CHANGELOG must document the current version.
const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf8');
record('CHANGELOG documents this version', changelog.includes(`## ${packaging.versions.manifest}`), `looked for "## ${packaging.versions.manifest}"`);

// 6. Every extension directory named in the brief exists.
const missingDirs = EXTENSION_DIRS.filter((dir) => !fs.existsSync(path.join(ROOT, dir)));
record('extension directories present', missingDirs.length === 0, missingDirs.join(', ') || EXTENSION_DIRS.join(', '));

const failures = results.filter((result) => !result.ok);
for (const result of results) {
  console.log(`[${result.ok ? 'ok' : 'FAIL'}] ${result.name}: ${result.detail.split('\n')[0]}`);
  if (!result.ok && result.detail.includes('\n')) {
    for (const line of result.detail.split('\n').slice(1)) console.log(`       ${line}`);
  }
}
console.log('');
if (failures.length) {
  console.error(`verify: ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log(`verify: all ${results.length} checks passed`);
