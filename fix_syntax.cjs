const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// Fix dangling -webkit-
css = css.replace(/-webkit-\s*border:/g, 'border:');

// Fix broken radial-gradient syntax
css = css.replace(/background: radial-gradient\([^;]+;/g, 'background: transparent;');
// Fix any other dangling transparent) syntax that might break
css = css.replace(/transparent 5%, transparent\) \d+%,/g, '');

fs.writeFileSync('styles.css', css);
console.log('Fixed syntax errors in styles.css');
