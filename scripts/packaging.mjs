/* Dev-only: what ships, what must never ship, and the integrity checks around it. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* The only top-level entries copied into a distributable extension. */
export const PACKAGE_ENTRIES = ['manifest.json', 'background', 'content', 'popup', 'options', 'icons', 'README.md'];

/* Anything matching these must never appear in the packaged output. */
export const EXCLUDED_PATTERNS = [
  /^tests(\/|$)/,
  /^node_modules(\/|$)/,
  /^scripts(\/|$)/,
  /^dist(\/|$)/,
  /^package(-lock)?\.json$/,
  /^\.gitignore$/,
  /^TEST_CHECKLIST\.md$/
];

export const EXTENSION_DIRS = ['background', 'content', 'popup', 'options'];

function walkEntry(absolutePath, relativePath) {
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) return [relativePath];
  const out = [];
  for (const name of fs.readdirSync(absolutePath).sort()) {
    out.push(...walkEntry(path.join(absolutePath, name), `${relativePath}/${name}`));
  }
  return out;
}

export function listPackageFiles(root = ROOT) {
  const files = [];
  for (const entry of PACKAGE_ENTRIES) {
    const absolute = path.join(root, entry);
    if (!fs.existsSync(absolute)) continue;
    files.push(...walkEntry(absolute, entry));
  }
  return files.sort();
}

export function listExtensionJsFiles(root = ROOT) {
  const files = [];
  for (const dir of EXTENSION_DIRS) {
    const absolute = path.join(root, dir);
    if (!fs.existsSync(absolute)) continue;
    files.push(...walkEntry(absolute, dir).filter((f) => f.endsWith('.js')));
  }
  return files.sort();
}

export function findExcluded(files) {
  return files.filter((file) => EXCLUDED_PATTERNS.some((pattern) => pattern.test(file)));
}

export function readVersions(root = ROOT) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  return { manifest: manifest.version, package: pkg.version };
}

/* Every file manifest.json points at has to exist in the shipped set. */
export function manifestFileReferences(root = ROOT) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const refs = new Set();
  if (manifest.background?.service_worker) refs.add(manifest.background.service_worker);
  for (const block of manifest.content_scripts || []) {
    for (const file of block.js || []) refs.add(file);
    for (const file of block.css || []) refs.add(file);
  }
  if (manifest.action?.default_popup) refs.add(manifest.action.default_popup);
  if (manifest.options_ui?.page) refs.add(manifest.options_ui.page);
  for (const file of Object.values(manifest.icons || {})) refs.add(file);
  for (const file of Object.values(manifest.action?.default_icon || {})) refs.add(file);
  return Array.from(refs).sort();
}

/* Relative module imports in the service worker must resolve inside the package. */
export function moduleReferences(root = ROOT) {
  const refs = [];
  for (const file of listExtensionJsFiles(root)) {
    if (!file.startsWith('background/')) continue;
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of source.matchAll(/(?:import|export)[^'"]*from\s*['"]([^'"]+)['"]/g)) {
      refs.push({ from: file, specifier: match[1] });
    }
  }
  return refs;
}

export function validatePackage(root = ROOT) {
  const problems = [];
  const files = listPackageFiles(root);
  const fileSet = new Set(files);

  for (const entry of PACKAGE_ENTRIES) {
    if (!fs.existsSync(path.join(root, entry))) problems.push(`missing required entry: ${entry}`);
  }

  for (const excluded of findExcluded(files)) {
    problems.push(`excluded path would ship: ${excluded}`);
  }

  const versions = readVersions(root);
  if (versions.manifest !== versions.package) {
    problems.push(`manifest.json version ${versions.manifest} != package.json version ${versions.package}`);
  }

  for (const ref of manifestFileReferences(root)) {
    if (!fileSet.has(ref)) problems.push(`manifest.json references a file that would not ship: ${ref}`);
  }

  for (const { from, specifier } of moduleReferences(root)) {
    if (!specifier.startsWith('./') && !specifier.startsWith('../')) {
      problems.push(`${from} imports a non-relative module: ${specifier}`);
      continue;
    }
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
    if (!fileSet.has(resolved)) problems.push(`${from} imports ${specifier}, which would not ship`);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
  const permissions = JSON.stringify(manifest.permissions || []);
  if (permissions !== JSON.stringify(['storage', 'contextMenus', 'tabs', 'activeTab'])) {
    problems.push(`manifest permissions changed unexpectedly: ${permissions}`);
  }
  const hostPermissions = JSON.stringify(manifest.host_permissions || []);
  if (hostPermissions !== JSON.stringify(['<all_urls>'])) {
    problems.push(`manifest host_permissions changed unexpectedly: ${hostPermissions}`);
  }
  if (manifest.manifest_version !== 3) problems.push('manifest_version must stay 3');

  return { problems, files, versions };
}

export function copyPackage(root = ROOT, destination = path.join(root, 'dist')) {
  const { problems, files, versions } = validatePackage(root);
  if (problems.length) return { ok: false, problems, files, versions };

  const target = path.join(destination, `page-translator-ai-${versions.manifest}`);
  fs.rmSync(target, { recursive: true, force: true });
  for (const file of files) {
    const from = path.join(root, file);
    const to = path.join(target, file);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  return { ok: true, problems: [], files, versions, target };
}
