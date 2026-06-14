const fs = require('fs');

const html = fs.readFileSync('src/app.component.html', 'utf8');

let pos = 0;
const stack = [];

while (pos < html.length) {
  if (html.startsWith('<!--', pos)) {
    const end = html.indexOf('-->', pos + 4);
    if (end === -1) break;
    pos = end + 3;
    continue;
  }

  // Angular block start
  if (html.startsWith('@', pos)) {
    const match = html.slice(pos).match(/^@([a-zA-Z0-9\s_()'"=\-!&|;.,]+)\s*\{/);
    if (match) {
      const blockType = match[1].trim().split(/\s+/)[0];
      stack.push({ type: 'angular', name: '@' + blockType, pos });
      pos += match[0].length;
      continue;
    }
  }

  if (html.charAt(pos) === '}' && !html.slice(pos).match(/^\}[a-zA-Z]/)) {
    // find nearest angular block in stack
    let foundIdx = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].type === 'angular') {
        foundIdx = i;
        break;
      }
    }
    if (foundIdx !== -1) {
      stack.splice(foundIdx, 1);
    }
    pos++;
    continue;
  }

  if (html.startsWith('</', pos)) {
    const match = html.slice(pos).match(/^<\/([a-zA-Z0-9\-]+)\s*>/);
    if (match) {
      const tagName = match[1].toLowerCase();
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
    const match = html.slice(pos).match(/^<([a-zA-Z0-9\-]+)/);
    if (match) {
      const tagName = match[1].toLowerCase();
      const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr'];
      
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
