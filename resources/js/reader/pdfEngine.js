/** Renderer port: positions always refer to an immutable edition and real page. */
export async function openPdfEngine(pdfjs, data, editionId) {
  if (!/^sha256:[a-f0-9]{64}$/.test(editionId)) throw new TypeError('Immutable edition required');
  const task = pdfjs.getDocument({ data, isEvalSupported: false });
  let document;
  try { document = await task.promise; } catch (error) { await task.destroy(); throw error; }
  let closed = false;
  function check(page) {
    if (closed) throw new Error('Reader closed');
    if (!Number.isInteger(page) || page < 1 || page > document.numPages) throw new RangeError('Invalid page');
  }
  return {
    pageCount: document.numPages,
    editionId,
    async page(number) { check(number); return document.getPage(number); },
    async text(number) {
      check(number);
      const page = await document.getPage(number);
      const content = await page.getTextContent();
      return content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join('').trim();
    },
    async outline() { if (closed) throw new Error('Reader closed'); return document.getOutline(); },
    locator(number) { check(number); return { type: 'pdf', edition_id: editionId, page: number }; },
    async destroy() { if (!closed) { closed = true; await task.destroy(); } },
  };
}
