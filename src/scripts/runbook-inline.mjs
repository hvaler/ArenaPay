const escape = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// Each span excludes its opening delimiter, so failed matches cannot repeatedly
// scan the same suffix at every opener (notably a long sequence of '[').
export function renderInline(source) {
  const tokens = /`([^`]+)`|\[([^\[\]]+)\]\(([^()[\]]+)\)|\*\*([^*]+)\*\*/g;
  const output = [];
  let cursor = 0;
  for (const match of source.matchAll(tokens)) {
    output.push(escape(source.slice(cursor, match.index)));
    if (match[1] !== undefined) output.push(`<code>${escape(match[1])}</code>`);
    else if (match[2] !== undefined) output.push(`<a href="${escape(match[3])}">${escape(match[2])}</a>`);
    else output.push(`<strong>${escape(match[4])}</strong>`);
    cursor = match.index + match[0].length;
  }
  output.push(escape(source.slice(cursor)));
  return output.join('');
}
