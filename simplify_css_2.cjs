const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// The user wants:
// 1. Text areas and cards are black and white.
// 2. All border sizes are the same (2px solid).
// 3. Simple border styles, no variations or shades.
// 4. Use only #3ebc9e, #ef6658, #faa63c, #000000, #ffffff

// Remove pseudo elements used for offset shadows/3D effects
// Regex to match .selector::before { ... }
css = css.replace(/([^{]*?)::before\s*\{[^}]*?\}/g, (match, p1) => {
    // Only remove if it looks like a shadow or styling pseudo element, but let's just remove all of them that have absolute positioning or background
    if (match.includes('position: absolute') && match.includes('z-index: -1')) {
        return '/* removed pseudo-element shadow */';
    }
    return match;
});

// Remove any remaining backdrop filters or box shadows that might not have been caught
css = css.replace(/backdrop-filter:[^;]+;/g, '');
css = css.replace(/-webkit-backdrop-filter:[^;]+;/g, '');
css = css.replace(/box-shadow:[^;]+;/g, 'box-shadow: none !important;');

// Remove any hover transforms
css = css.replace(/transform:\s*perspective[^;]+;/g, '');
css = css.replace(/transform:\s*translate[^;]+;/g, '');
css = css.replace(/transform:\s*skew[^;]+;/g, '');
css = css.replace(/transform:\s*none[^;]*;/g, '');

// Clean up text areas specifically
css = css.replace(/textarea,\s*input\s*\{([^}]+)\}/g, (match, p1) => {
    return `textarea, input {
  background-color: var(--card-background-color) !important;
  color: var(--text-color) !important;
  border: 2px solid var(--primary-color) !important;
  font-weight: normal !important;
  border-radius: 0 !important;
}`;
});

// Also fix hover and focus outlines to just be 2px solid
css = css.replace(/outline:\s*[^;]+;/g, 'outline: 2px solid var(--secondary-color) !important;');

// Fix button text to use var(--text-color) instead of white
// Wait, the user said "Ensure text areas, and cards are black and white... Use only these three colors and black and white"
// So button text can be black/white.
css = css.replace(/color:\s*#ffffff\s*!important;/gi, 'color: var(--background-color) !important;');
css = css.replace(/color:\s*#000000\s*!important;/gi, 'color: var(--text-color) !important;');

// Force border radius to 0 or a consistent small value? "Simply border styles" usually means square or basic. Let's make everything square or uniformly 4px.
// The user didn't specify border radius, but "simply border styles" might imply removing fancy border-radius.
css = css.replace(/border-radius:\s*[^;]+;/g, 'border-radius: 0 !important;');

// Ensure cards and sections have simple backgrounds
css = css.replace(/\.step-section,\s*\.organic-shape,\s*\.strategy-button,\s*\.card\s*\{([^}]+)\}/g, (match, p1) => {
    return `.step-section, .organic-shape, .strategy-button, .card {
  background-color: var(--card-background-color) !important;
  color: var(--text-color) !important;
  border: 2px solid var(--primary-color) !important;
  padding: 1.5rem !important;
  margin-bottom: 2rem !important;
  border-radius: 0 !important;
}`;
});

fs.writeFileSync('styles.css', css);
console.log('Cleaned up styles.css for simple borders and no shades');
