import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speechSegments } from '../../resources/js/reader/speechSegments.js';
test('speech segmentation preserves all real text without skipping long words or unicode', () => {
  const text = `Une phrase. ${'a'.repeat(500)} 🌍 ${'Écouter le texte réel. '.repeat(40)}`;
  const chunks = speechSegments(text);
  assert.equal(chunks.join(''), text);
  assert.ok(chunks.every(chunk => chunk.length <= 180));
  assert.deepEqual(speechSegments(''), []);
  const unicodeChunks = speechSegments('x'.repeat(179) + '🌍suite');
  assert.equal(unicodeChunks[0].length, 179);
  assert.equal(unicodeChunks[1], '🌍suite');
  assert.throws(() => speechSegments(text, 1), TypeError);
});
