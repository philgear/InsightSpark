const fs = require('fs');
let html = fs.readFileSync('src/app.component.html', 'utf-8');

// The user wants no shades or variations
// Remove all tailwind opacity modifiers like /10, /20, /50, /5 etc.
html = html.replace(/\/10\b/g, '');
html = html.replace(/\/20\b/g, '');
html = html.replace(/\/30\b/g, '');
html = html.replace(/\/50\b/g, '');
html = html.replace(/\/5\b/g, '');

// Remove shadows
html = html.replace(/shadow-[a-z]+\b/g, '');
html = html.replace(/shadow\b/g, '');

// Remove backdrop blurs
html = html.replace(/backdrop-blur-[a-z]+\b/g, '');
html = html.replace(/backdrop-blur\b/g, '');

// Simplify borders in tailwind
html = html.replace(/border-3\b/g, 'border-2');
html = html.replace(/border-t\b/g, 'border-2');
html = html.replace(/border-b\b/g, 'border-2');
html = html.replace(/border-l\b/g, 'border-2');
html = html.replace(/border-r\b/g, 'border-2');
// Actually the user wants "All border sizes are the same". I set it to 2px solid in styles.css.
// In tailwind, `border-2` is 2px.
html = html.replace(/border\b(?!\-)/g, 'border-2');

// Fix any text-white or bg-black inline to use the correct variables or just let them be,
// since black and white are allowed.
// But the user complained about text areas and cards.

fs.writeFileSync('src/app.component.html', html);
console.log('Cleaned up HTML variations');
