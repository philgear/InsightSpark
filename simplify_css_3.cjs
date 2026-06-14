const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// Replace any leftover #ffffff and #000000 that might conflict.
// We want text to be var(--text-color) and backgrounds to be var(--card-background-color)
css = css.replace(/fill: #ffffff !important;/g, 'fill: var(--text-color) !important;');
css = css.replace(/stroke: #ffffff !important;/g, 'stroke: var(--text-color) !important;');
css = css.replace(/color: var\(--background-color\) !important;/g, 'color: var(--text-color) !important;');

// Ensure buttons hover state is correct
// If background is card-background-color, text should be text-color
css = css.replace(/background-color: var\(--tertiary-color\) !important;/g, 'background-color: var(--card-background-color) !important;');
css = css.replace(/color: var\(--secondary-color\) !important;/g, 'color: var(--text-color) !important;');
css = css.replace(/border-color: var\(--secondary-color\) !important;/g, 'border-color: var(--primary-color) !important;');

// Remove any remaining pseudo-elements for buttons
css = css.replace(/button.*?::before\s*\{[^}]*\}/g, '/* removed */');
css = css.replace(/\.organic-button.*?::before\s*\{[^}]*\}/g, '/* removed */');
css = css.replace(/\.generate-button.*?::before\s*\{[^}]*\}/g, '/* removed */');
css = css.replace(/\.btn.*?::before\s*\{[^}]*\}/g, '/* removed */');

fs.writeFileSync('styles.css', css);
console.log('Fixed button text colors!');
