import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textAnchor, matchesEdition } from '../../resources/js/reader/locator.js';
const locator = { type: 'pdf', edition_id: `sha256:${'a'.repeat(64)}`, page: 7 };
test('an anchor keeps quotation and context without crossing edition boundaries', () => {
  const anchor = textAnchor(locator, 'Avant. Un passage. Après.', 7, 17);
  assert.equal(anchor.exact, 'Un passage');
  assert.equal(anchor.prefix, 'Avant. ');
  assert.equal(matchesEdition(anchor, locator.edition_id), true);
  assert.equal(matchesEdition(anchor, `sha256:${'b'.repeat(64)}`), false);
});
test('invalid ranges and unversioned pages are rejected', () => {
  for (const [start, end] of [[-1, 3], [3, 2], [0, 100], [0.5, 2]]) {
    assert.throws(() => textAnchor(locator, 'Texte', start, end), RangeError);
  }
  assert.throws(() => textAnchor({ ...locator, page: 0 }, 'Texte', 0, 2));
});
