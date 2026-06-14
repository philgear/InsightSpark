const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// The 5 allowed colors
// Black: #000000, White: #ffffff
// Teal: #3ebc9e, Coral: #ef6658, Amber: #faa63c

// 1. Remove transparencies and gradients
css = css.replace(/rgba\(.*?\)/g, 'transparent'); 
css = css.replace(/color-mix\(.*?\)/g, 'transparent');
css = css.replace(/linear-gradient\(.*?\)/g, 'none');
css = css.replace(/radial-gradient\(.*?\)/g, 'none');

// 2. Simplify borders to all be the exact same size and solid
// Let's make them 2px solid.
css = css.replace(/border:\s*[^;]*;/g, 'border: 2px solid var(--primary-color) !important;');
// Also target specific border directions
css = css.replace(/border-(top|bottom|left|right):\s*[^;]*;/g, 'border-$1: 2px solid var(--primary-color) !important;');
// And border-width
css = css.replace(/border-width:\s*[^;]*;/g, 'border-width: 2px !important;');
css = css.replace(/border-color:\s*[^;]*;/g, 'border-color: var(--primary-color) !important;');

// 3. Remove variations, shadows, and 3D transforms
css = css.replace(/box-shadow:\s*[^;]*;/g, 'box-shadow: none !important;');
css = css.replace(/transform:\s*skew[^;]*;/g, 'transform: none !important;');
css = css.replace(/transform:\s*perspective[^;]*;/g, 'transform: none !important;');
css = css.replace(/opacity:\s*[^;]*;/g, 'opacity: 1 !important;');
css = css.replace(/backdrop-filter:\s*[^;]*;/g, 'backdrop-filter: none !important;');
css = css.replace(/-webkit-backdrop-filter:\s*[^;]*;/g, '-webkit-backdrop-filter: none !important;');
css = css.replace(/filter:\s*blur[^;]*;/g, 'filter: none !important;');

// 4. Ensure text areas and cards are strictly black/white.
// We'll update the css variables in :root and .light-theme to use pure #000000 and #ffffff instead of #111111 and #f8f8f8
css = css.replace(/--card-background-color: #111111;/g, '--card-background-color: #000000;');
css = css.replace(/--card-background-color: #f8f8f8;/g, '--card-background-color: #ffffff;');
css = css.replace(/--secondary-text-color: #cccccc;/g, '--secondary-text-color: #ffffff;');
css = css.replace(/--secondary-text-color: #333333;/g, '--secondary-text-color: #000000;');

// Also explicitly target textarea and cards to use the background and text color variables 
// (Some might have overrides, let's remove hover background changes for cards to keep them strictly black/white)
css = css.replace(/background-color:\s*var\(--secondary-color\)\s*!important;/g, 'background-color: var(--card-background-color) !important;');

fs.writeFileSync('styles.css', css);
console.log('Processed styles.css successfully!');
