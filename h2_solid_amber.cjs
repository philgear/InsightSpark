const fs = require('fs');
const path = require('path');

const stylesPath = path.join(__dirname, 'styles.css');

if (fs.existsSync(stylesPath)) {
  let css = fs.readFileSync(stylesPath, 'utf8');

  // Remove the previous h2 gradient block
  css = css.split('/* ── Stylistic Amber to Coral Gradient for h2 ── */')[0];

  const solidAmberH2Rules = `
/* ── Solid Amber h2 Headings ── */
h2 {
  background: none !important;
  -webkit-background-clip: border-box !important;
  -webkit-text-fill-color: initial !important;
  background-clip: border-box !important;
  display: block !important;
  color: #faa63c !important; /* Solid Amber all throughout */
  font-weight: 800 !important;
}
`;
  
  css += solidAmberH2Rules;
  fs.writeFileSync(stylesPath, css, 'utf8');
  console.log('Updated h2 to solid Amber throughout');
}
