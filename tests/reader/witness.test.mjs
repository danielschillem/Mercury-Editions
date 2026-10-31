import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import { openPdfEngine } from '../../resources/js/reader/pdfEngine.js';
const witness = process.env.MERCURY_READER_WITNESS;
test('private witness: all 55 pages parse, extract and render', { skip: !witness, timeout: 120000 }, async () => {
  const bytes = new Uint8Array(await readFile(witness));
  const digest = createHash('sha256').update(bytes).digest('hex');
  assert.equal(digest, 'f27813591b7890ab56e71ea46b6b7f1bbebd3fb89ca81d36e477e3574f73c860');
  const engine = await openPdfEngine(pdfjs, bytes, `sha256:${digest}`);
  try {
    assert.equal(engine.pageCount, 55);
    let textPages = 0;
    let renderedPages = 0;
    const started = performance.now();
    for (let i = 1; i <= engine.pageCount; i++) {
      const text = await engine.text(i);
      if (text.length) textPages++;
      const page = await engine.page(i);
      const viewport = page.getViewport({ scale: 1 });
      const canvas = engineCanvas(page, viewport);
      await page.render({ canvasContext: canvas.context, viewport, canvas: canvas.canvas }).promise;
      renderedPages++;
      page.cleanup();
    }
    assert.equal(textPages, 55);
    assert.equal(renderedPages, 55);
    console.log(JSON.stringify({ pages: engine.pageCount, textPages, renderedPages, durationMs: Math.round(performance.now() - started), outlineAvailable: !!(await engine.outline()) }));
    assert.deepEqual(engine.locator(55), { type: 'pdf', edition_id: `sha256:${digest}`, page: 55 });
    await assert.rejects(engine.page(56), RangeError);
  } finally { await engine.destroy(); }
  await assert.rejects(engine.text(1), /closed/);
});
// PDF.js supplies the Node canvas factory through its public document parameters;
// use the installed optional native canvas dependency for a real render, not a mock.
import { createCanvas } from '@napi-rs/canvas';
function engineCanvas(page, viewport) {
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  return { canvas, context: canvas.getContext('2d') };
}
