const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// I will just parse lines and look for lines starting with `.insight-card-magical:hover {`
// Let's restore the broken part.
// I will just use regex to replace from `.insight-card-magical {` to `.insight-card-magical:hover {` with the proper structure.

const searchString = `.insight-card-magical {
  border-radius: 0 !important;
  overflow: hidden;
  position: relative;
.insight-card-magical:hover {`;

// But wait, the file currently looks like this due to the bad replace:
/*
  border-radius: 0 !important;
  overflow: hidden;
  position: relative;
.insight-card-magical:hover {
*/

css = css.replace(/  border-radius: 0 !important;\s*overflow: hidden;\s*position: relative;\s*\.insight-card-magical:hover {/, `  border-radius: 0 !important;
  overflow: hidden;
  position: relative;
  border: 2px solid var(--primary-color) !important;
  background: none !important;
  box-shadow: none !important;
}

.insight-card-magical:hover::before {
  opacity: 1 !important;
}

.insight-card-magical:hover {`);

fs.writeFileSync('styles.css', css);
console.log('Restored insight-card-magical CSS');
