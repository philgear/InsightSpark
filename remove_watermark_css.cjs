const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// Remove .background-logo-watermark block
css = css.replace(/\.background-logo-watermark\s*{[^}]*}/g, '');

fs.writeFileSync('styles.css', css);
console.log('Removed .background-logo-watermark from styles.css');
