import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire, Module } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function load() {
  const file = resolve(root, 'src/lib/analytics.ts');
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const loaded = new Module(file);
  loaded.filename = file;
  loaded._compile(code, file);
  return loaded.exports;
}

test('analytics only runs in production, with an ID, and never on admin pages', () => {
  const { analyticsEnabled } = load();
  assert.equal(analyticsEnabled({ measurementId: 'G-TEST', pathname: '/', production: true }), true);
  assert.equal(analyticsEnabled({ measurementId: 'G-TEST', pathname: '/webinar', production: true }), true);
  assert.equal(analyticsEnabled({ measurementId: 'G-TEST', pathname: '/admin', production: true }), false);
  assert.equal(analyticsEnabled({ measurementId: 'G-TEST', pathname: '/admin/reports', production: true }), false);
  assert.equal(analyticsEnabled({ measurementId: 'G-TEST', pathname: '/', production: false }), false);
  assert.equal(analyticsEnabled({ measurementId: '', pathname: '/', production: true }), false);
  assert.equal(analyticsEnabled({ measurementId: undefined, pathname: '/', production: true }), false);
});

test('events are dropped until analytics starts, then queued in the format gtag.js reads', () => {
  const analytics = load();
  globalThis.window = { location: { origin: 'https://example.com' } };
  globalThis.document = { title: 'Quiz' };
  try {
    analytics.trackEvent('quiz_start', { quiz_id: 'q1' });
    assert.equal(globalThis.window.dataLayer, undefined);

    analytics.startAnalytics('G-TEST');
    analytics.startAnalytics('G-TEST'); // starting twice must not queue the setup twice
    analytics.trackEvent('quiz_start', { quiz_id: 'q1' });
    analytics.trackPageView('/webinar');

    const queued = globalThis.window.dataLayer.map((entry) => Array.from(entry));
    assert.deepEqual(queued.map((entry) => entry[0]), ['js', 'config', 'event', 'event']);
    assert.deepEqual(queued[1].slice(1), ['G-TEST', { send_page_view: false }]);
    assert.deepEqual(queued[2].slice(1), ['quiz_start', { quiz_id: 'q1' }]);
    assert.equal(queued[3][1], 'page_view');
    assert.equal(queued[3][2].page_location, 'https://example.com/webinar');
    // gtag.js ignores arrays: the queue must hold `arguments` objects.
    assert.equal(Object.prototype.toString.call(globalThis.window.dataLayer[0]), '[object Arguments]');
  } finally {
    delete globalThis.window;
    delete globalThis.document;
  }
});
