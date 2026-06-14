const fs = require('fs');
const glob = require('glob');

// 1. Remove backdrop-filter from index.html
let indexHtml = fs.readFileSync('index.html', 'utf-8');
indexHtml = indexHtml.replace(/backdrop-filter:[^;]+;/g, '');
indexHtml = indexHtml.replace(/-webkit-backdrop-filter:[^;]+;/g, '');
fs.writeFileSync('index.html', indexHtml);

// 2. Remove tailwind backdrop-blur classes from all src files
const files = glob.sync('src/**/*.{html,ts}');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    let changed = false;
    if (content.includes('backdrop-blur')) {
        content = content.replace(/backdrop-blur-[a-z]+\b/g, '');
        content = content.replace(/backdrop-blur\b/g, '');
        changed = true;
    }
    // Also remove shadow classes just to be sure we are flat
    if (content.includes('shadow-')) {
        content = content.replace(/shadow-[a-z0-9]+\b/g, '');
        changed = true;
    }
    if (changed) {
        fs.writeFileSync(file, content);
    }
});
console.log('Removed all backdrop blur and shadows');
