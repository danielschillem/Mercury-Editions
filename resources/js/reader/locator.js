/** Offsets are UTF-16 code units in the versioned extracted page text. */
export function textAnchor(locator, text, start, end) {
  if (locator.type !== 'pdf' || !/^sha256:[a-f0-9]{64}$/.test(locator.edition_id)
      || !Number.isInteger(locator.page) || locator.page < 1
      || !Number.isInteger(start) || !Number.isInteger(end)
      || start < 0 || end <= start || end > text.length) throw new RangeError('Invalid anchor');
  return { ...locator, text_version: 1, start, end, exact: text.slice(start, end),
    prefix: text.slice(Math.max(0, start - 32), start), suffix: text.slice(end, end + 32) };
}

export function matchesEdition(anchor, editionId) {
  return anchor.edition_id === editionId;
}
