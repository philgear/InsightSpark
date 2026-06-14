const fs = require('fs');
let html = fs.readFileSync('src/app.component.html', 'utf-8');

// 1. Remove the global bgTheme animation block (lines 6-91 approx)
html = html.replace(/@if\s*\(\s*bgTheme\(\)\s*!==\s*'none'\s*\)\s*\{[\s\S]*?\}\s*<!-- Header -->/, '<!-- Header -->');

// 2. Remove the loading state animation block (lines 179-236 approx)
html = html.replace(/<!-- Immense Live Animation Background -->[\s\S]*?<\/div>\s*<div class="relative z-10/, '<div class="relative z-10');

// 3. Remove the bgTheme dropdown in the header
html = html.replace(/<div class="relative flex items-center">\s*<select \[ngModel\]="bgTheme\(\)"[\s\S]*?<\/select>\s*<app-icon name="chevron-down"[^>]*><\/app-icon>\s*<\/div>/, '');

fs.writeFileSync('src/app.component.html', html);
console.log('Removed animations from html');
