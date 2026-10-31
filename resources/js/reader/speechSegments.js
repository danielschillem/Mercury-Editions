/** Keep every character, including uninterrupted words and surrogate pairs. */
export function speechSegments(text, limit = 180) {
  if (typeof text !== 'string' || !Number.isInteger(limit) || limit < 2) {
    throw new TypeError('Text and a chunk size of at least two are required');
  }
  const chunks = [];
  while (text.length > limit) {
    const space = text.lastIndexOf(' ', limit - 1);
    let end = space >= limit / 2 ? space + 1 : limit;
    const last = text.charCodeAt(end - 1);
    if (last >= 0xd800 && last <= 0xdbff) end--;
    chunks.push(text.slice(0, end));
    text = text.slice(end);
  }
  if (text.length) chunks.push(text);
  return chunks;
}
