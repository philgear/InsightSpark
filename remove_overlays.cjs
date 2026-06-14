const fs = require('fs');
let html = fs.readFileSync('src/app.component.html', 'utf-8');

// Remove fluid background and watermark
html = html.replace(/<div class="fluid-background"[^>]*><\/div>\s*/g, '');
html = html.replace(/<div class="background-logo-watermark"><\/div>\s*/g, '');

fs.writeFileSync('src/app.component.html', html);
console.log('Removed overlays from html');
