const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// Remove .fluid-background and .fluid-background::before blocks
css = css.replace(/\.fluid-background\s*{[^}]*}/g, '');
css = css.replace(/\.fluid-background::before\s*{[^}]*}/g, '');
css = css.replace(/@keyframes fluid-flow\s*{[\s\S]*?100%\s*{[^}]*}\s*}/g, '');

fs.writeFileSync('styles.css', css);
console.log('Removed fluid background from styles.css');
