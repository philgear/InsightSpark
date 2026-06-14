const fs = require('fs');

const html = fs.readFileSync('src/app.component.html', 'utf8');

// A very basic HTML + Angular template tag tracker
let pos = 0;
const stack = [];

// Simple regex or scanner
while (pos < html.length) {
  if (html.startsWith('<!--', pos)) {
    // skip comment
    const end = html.indexOf('-->', pos + 4);
    if (end === -1) break;
    pos = end + 3;
    continue;
  }

  // Angular control flow blocks: @if, @else if, @else, @switch, @case, @for, @defer, @placeholder
  if (html.startsWith('@', pos)) {
    // Find the keyword
    const match = html.slice(pos).match(/^@([a-zA-Z0-9\s_()'"=\-!&|;.,]+)\s*\{/);
    if (match) {
      const blockType = match[1].trim().split(/\s+/)[0];
      stack.push({ type: 'angular', name: '@' + blockType, pos });
      pos += match[0].length;
      continue;
    }
  }

  if (html.charAt(pos) === '}' && !html.slice(pos).match(/^\}[a-zA-Z]/)) {
    // Angular block close
    // We check if it is closing an angular block
    // Let's pop from stack if top is angular
    const last = [...stack].reverse().find(x => x.type === 'angular');
    if (last) {
      // remove from stack
      const idx = stack.lastIndexOf(last);
      stack.splice(idx, 1);
    }
    pos++;
    continue;
  }

  if (html.startsWith('</', pos)) {
    const match = html.slice(pos).match(/^<\/([a-zA-Z0-9\-]+)\s*>/);
    if (match) {
      const tagName = match[1].toLowerCase();
      // find matching open tag in stack
      let foundIdx = -1;
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].type === 'html' && stack[i].name === tagName) {
          foundIdx = i;
          break;
        }
      }
      if (foundIdx !== -1) {
        stack.splice(foundIdx, 1);
      } else {
        console.log(`Mismatched close tag </${tagName}> at pos ${pos} (line ${getLineNumber(pos)})`);
      }
      pos += match[0].length;
      continue;
    }
  }

  if (html.startsWith('<', pos)) {
    // HTML open tag
    const match = html.slice(pos).match(/^<([a-zA-Z0-9\-]+)/);
    if (match) {
      const tagName = match[1].toLowerCase();
      // check if it's self-closing or void element
      const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'];
      
      // find end of open tag
      let endIdx = pos;
      let inQuote = false;
      let quoteChar = '';
      while (endIdx < html.length) {
        const c = html.charAt(endIdx);
        if ((c === '"' || c === "'") && html.charAt(endIdx - 1) !== '\\') {
          if (!inQuote) {
            inQuote = true;
            quoteChar = c;
          } else if (c === quoteChar) {
            inQuote = false;
          }
        }
        if (!inQuote && c === '>') {
          break;
        }
        endIdx++;
      }
      
      const isSelfClosing = html.slice(pos, endIdx + 1).endsWith('/>') || voidElements.includes(tagName);
      if (!isSelfClosing) {
        stack.push({ type: 'html', name: tagName, pos });
      }
      pos = endIdx + 1;
      continue;
    }
  }

  pos++;
}

console.log('Unclosed tags remaining in stack:');
stack.forEach(item => {
  console.log(`- ${item.name} opened at pos ${item.pos} (line ${getLineNumber(item.pos)})`);
});

function getLineNumber(pos) {
  return html.slice(0, pos).split('\n').length;
}
