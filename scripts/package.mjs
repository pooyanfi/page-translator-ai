#!/usr/bin/env node
/* Dev-only: `npm run package` copies the shippable files into
 * dist/page-translator-ai-<version>/ after the same checks `verify` runs. */

import { ROOT, copyPackage, validatePackage } from './packaging.mjs';

const validation = validatePackage(ROOT);
if (validation.problems.length) {
  console.error('Refusing to package:');
  for (const problem of validation.problems) console.error(` - ${problem}`);
  process.exit(1);
}

const result = copyPackage(ROOT);
if (!result.ok) {
  console.error('Packaging failed:');
  for (const problem of result.problems) console.error(` - ${problem}`);
  process.exit(1);
}

console.log(`Packaged ${result.files.length} files into ${result.target}`);
console.log(`Version ${result.versions.manifest} (manifest.json == package.json)`);
