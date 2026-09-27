import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import stylelint from 'stylelint';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Pin an older Chromium target: the current shared config checks newer Electron.
// Do not ignore css-masks or partial support; reproduce the reported warning.
const result = await stylelint.lint({
  code: await readFile(path.join(root, 'theme.css'), 'utf8'),
  config: {
    plugins: ['stylelint-no-unsupported-browser-features'],
    rules: {
      'plugin/no-unsupported-browser-features': [true, {
        browsers: ['chrome 114'],
        severity: 'warning',
      }],
    },
  },
});
const warnings = result.results.flatMap(r => r.warnings);
assert.equal(warnings.length, 0, JSON.stringify(warnings, null, 2));
assert(!result.errored);
console.log('PASS: browser compatibility lint against Chromium 114; zero warnings.');
