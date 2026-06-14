const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

// Replace `--bg-color: #ef6658;` with Amber
html = html.replace(/--bg-color:\s*#[a-zA-Z0-9]{6};/g, '--bg-color: #faa63c;');
html = html.replace(/--background-color:\s*#[a-zA-Z0-9]{6};/g, '--background-color: #faa63c;');

// Remove any remaining fluid background css in index.html just in case
html = html.replace(/\.fluid-background[^}]*}/g, '');
html = html.replace(/\.organic-shape\s*{[^}]*}/g, '.organic-shape { position: relative; border: 1px solid var(--border-color); background: var(--card-bg); border-radius: 12px; overflow: hidden; box-shadow: none; }');

fs.writeFileSync('index.html', html);
console.log('Fixed index.html background colors');
