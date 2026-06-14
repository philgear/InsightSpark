const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

const regex = /\.header-chip\.active\s*\{\s*background:\s*var\(--primary-cta-bg\);\s*color:\s*var\(--primary-cta-text\);\s*border-color:\s*var\(--primary-color\)\s*!important;\s*\.organic-button::after\s*\{/m;

const replacementStr = `.header-chip.active {
  background: var(--primary-cta-bg);
  color: var(--primary-cta-text);
  border-color: var(--primary-color) !important;
}

.header-chip.active .app-icon {
  color: white;
  filter: drop-shadow(0 0 4px transparent);
}

.organic-button {
  position: relative;
  overflow: hidden;
  transition: all 500ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 !important;
  background: var(--button-bg);
  border: 2px solid var(--primary-color) !important;
}

.organic-button:hover, .organic-button:focus {
  background: var(--button-bg-hover);
  border-color: var(--primary-color) !important;
}

.organic-button::after {`;

if (regex.test(css)) {
  css = css.replace(regex, replacementStr);
  fs.writeFileSync('styles.css', css);
  console.log('Restored broken CSS block with regex');
} else {
  console.log('Target block still not found!');
}
