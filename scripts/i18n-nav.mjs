#!/usr/bin/env node
/* Dev-only: keeps the language switcher identical in every README, including the
 * canonical English one at the repository root.
 * Edit LANGS, run `node scripts/i18n-nav.mjs`, commit the regenerated files.
 * The block between the two markers is replaced; everything else is left alone. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const I18N = path.join(ROOT, 'docs', 'i18n');
const ROOT_README = path.join(ROOT, 'README.md');
const START = '<!-- lang-nav:start -->';
const END = '<!-- lang-nav:end -->';
const I18N_PREFIX = 'docs/i18n/';

/* English lives at the repository root; every other entry is a file in docs/i18n. */
export const LANGS = [
  { file: null, label: 'English', english: 'English', rtl: false },
  { file: 'README.fa.md', label: 'فارسی', english: 'Persian', rtl: true },
  { file: 'README.ar.md', label: 'العربية', english: 'Arabic', rtl: true },
  { file: 'README.he.md', label: 'עברית', english: 'Hebrew', rtl: true },
  { file: 'README.ur.md', label: 'اردو', english: 'Urdu', rtl: true },
  { file: 'README.es.md', label: 'Español', english: 'Spanish', rtl: false },
  { file: 'README.fr.md', label: 'Français', english: 'French', rtl: false },
  { file: 'README.de.md', label: 'Deutsch', english: 'German', rtl: false },
  { file: 'README.it.md', label: 'Italiano', english: 'Italian', rtl: false },
  { file: 'README.pt.md', label: 'Português', english: 'Portuguese', rtl: false },
  { file: 'README.nl.md', label: 'Nederlands', english: 'Dutch', rtl: false },
  { file: 'README.pl.md', label: 'Polski', english: 'Polish', rtl: false },
  { file: 'README.ru.md', label: 'Русский', english: 'Russian', rtl: false },
  { file: 'README.tr.md', label: 'Türkçe', english: 'Turkish', rtl: false },
  { file: 'README.zh-CN.md', label: '中文简体', english: 'Chinese (Simplified)', rtl: false },
  { file: 'README.zh-TW.md', label: '中文繁體', english: 'Chinese (Traditional)', rtl: false },
  { file: 'README.ja.md', label: '日本語', english: 'Japanese', rtl: false },
  { file: 'README.ko.md', label: '한국어', english: 'Korean', rtl: false },
  { file: 'README.vi.md', label: 'Tiếng Việt', english: 'Vietnamese', rtl: false },
  { file: 'README.th.md', label: 'ไทย', english: 'Thai', rtl: false },
  { file: 'README.hi.md', label: 'हिन्दी', english: 'Hindi', rtl: false },
  { file: 'README.id.md', label: 'Bahasa Indonesia', english: 'Indonesian', rtl: false }
];

export const TRANSLATED_LANGS = LANGS.filter((entry) => entry.file);

function linkFor(entry, currentFile, fromRoot) {
  if (entry.file === null) {
    if (fromRoot) return '**English**';
    if (currentFile === null) return '[English](../../README.md)';
    return '[English](../../README.md)';
  }
  if (!fromRoot && entry.file === currentFile) return `**${entry.label}**`;
  const href = fromRoot ? `${I18N_PREFIX}${entry.file}` : entry.file;
  return `[${entry.label}](${href})`;
}

export function navLine(currentFile, { fromRoot = false } = {}) {
  const parts = LANGS.map((entry) => linkFor(entry, currentFile, fromRoot));
  return [START, parts.join(' · '), END].join('\n');
}

function syncFile(file, { fromRoot = false } = {}) {
  const absolute = fromRoot ? ROOT_README : path.join(I18N, file);
  const relative = fromRoot ? 'README.md' : `docs/i18n/${file}`;
  if (!fs.existsSync(absolute)) return { file: relative, status: 'missing' };
  const source = fs.readFileSync(absolute, 'utf8');
  const start = source.indexOf(START);
  const end = source.indexOf(END);
  if (start === -1 || end === -1 || end < start) return { file: relative, status: 'no markers' };
  const updated = `${source.slice(0, start)}${navLine(file, { fromRoot })}${source.slice(end + END.length)}`;
  if (updated === source) return { file: relative, status: 'unchanged' };
  fs.writeFileSync(absolute, updated);
  return { file: relative, status: 'updated' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const results = [
    syncFile(null, { fromRoot: true }),
    ...TRANSLATED_LANGS.map((entry) => syncFile(entry.file))
  ];
  for (const result of results) console.log(`[${result.status}] ${result.file}`);
  const problems = results.filter((result) => result.status === 'missing' || result.status === 'no markers');
  if (problems.length) {
    console.error(`i18n-nav: ${problems.length} file(s) need attention`);
    process.exit(1);
  }
  console.log(`i18n-nav: ${results.length} README files, ${LANGS.length} languages`);
}
