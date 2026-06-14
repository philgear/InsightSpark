const fs = require('fs');
let html = fs.readFileSync('src/app.component.html', 'utf-8');

// Remove SVG stop-opacity
html = html.replace(/stop-opacity="[^"]*"/g, 'stop-opacity="1"');

// Remove tailwind opacity classes
html = html.replace(/opacity-\d+/g, '');
html = html.replace(/disabled:opacity-\d+/g, '');
html = html.replace(/transition-opacity/g, '');

// Remove style bindings for opacity
html = html.replace(/\[style\.opacity\]="[^"]*"/g, '');

// Also remove inline opacity transitions
html = html.replace(/opacity\s+[\d.]+s\s+linear,?/g, '');

fs.writeFileSync('src/app.component.html', html);
console.log('Removed opacity explorations from HTML');
