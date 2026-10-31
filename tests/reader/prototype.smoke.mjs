import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

// Optional developer tool: no private fixture or browser binary is committed.
const witness = process.env.MERCURY_READER_WITNESS;
assert.ok(witness, 'Set MERCURY_READER_WITNESS to a private local PDF');
const { chromium } = await import(process.env.MERCURY_READER_PLAYWRIGHT || 'playwright');
const root = fileURLToPath(new URL('../../', import.meta.url));
const port = process.env.MERCURY_READER_TEST_PORT || '5191';
assert.match(port, /^\d{4,5}$/);
const url = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--config', 'vite.reader-qualification.config.js', '--port', port, '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', data => { serverLog = (serverLog + data).slice(-8000); });
server.stderr.on('data', data => { serverLog = (serverLog + data).slice(-8000); });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Vite exited: ${serverLog}`);
    try { ready = (await fetch(url)).ok; } catch { /* wait for the local server */ }
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, `Vite did not start: ${serverLog}`);
  browser = await chromium.launch({
    headless: true,
    ...(process.env.MERCURY_READER_BROWSER_EXECUTABLE ? { executablePath: process.env.MERCURY_READER_BROWSER_EXECUTABLE } : {}),
    args: JSON.parse(process.env.MERCURY_READER_BROWSER_ARGS || '[]'),
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  const unexpected = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const requestUrl = request.url();
    if (!requestUrl.startsWith(url + '/') && !requestUrl.startsWith('blob:') && !requestUrl.startsWith('data:')) unexpected.push(requestUrl);
  });
  await page.goto(url);
  await page.locator('input[type=file]').setInputFiles(witness);
  await page.getByText('Page 1 / 55', { exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('pre')?.textContent.length > 0);
  await page.getByRole('button', { name: 'Suivante', exact: true }).click();
  await page.getByText('Page 2 / 55', { exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector('pre')?.textContent.length > 0);
  await page.getByRole('button', { name: 'Précédente', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('pre')?.textContent.includes('RITES'));
  await page.locator('select').selectOption('1.5');
  await page.waitForFunction(() => document.querySelector('canvas')?.width > 600 && document.querySelector('pre')?.textContent.length > 0);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false);
  // Exercise the explicit failure path; this is not an audible speech test.
  await page.evaluate(() => Object.defineProperty(window.speechSynthesis, 'getVoices', { value: () => [] }));
  await page.getByRole('button', { name: 'Écouter la page (voix locale)', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Aucune voix française locale disponible' }).waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(unexpected, []);
  console.log(JSON.stringify({ browser: browser.version(), mobileViewport: '390x844', navigation: true, zoom: true, realText: true, noVoiceMessage: true, overflow, pageErrors: errors.length, unexpectedNetworkRequests: unexpected.length }));
} finally {
  await browser?.close();
  if (server.exitCode === null) { server.kill(); await once(server, 'exit'); }
}
