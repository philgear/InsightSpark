const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf-8');

// Replace dark theme background color
css = css.replace(/--background-color: #000000; \/\* Black background \*\//, '--background-color: #faa63c; /* Amber background */');
css = css.replace(/--secondary-text-color: #ffffff; \/\* Light gray text \*\//, '--secondary-text-color: #000000; /* Black text for readability */');

// Replace light theme background color
css = css.replace(/--background-color: #ffffff; \/\* White background \*\//, '--background-color: #faa63c; /* Amber background */');

fs.writeFileSync('styles.css', css);
console.log('Fixed background color');
