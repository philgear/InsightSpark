const fs = require('fs');

function processFile(filename) {
    let content = fs.readFileSync(filename, 'utf-8');
    
    // Replace 1px borders with 2px borders globally
    content = content.replace(/border border-\[var\(--border-color\)]/g, 'border-2 border-[var(--border-color)]');
    // also for right border
    content = content.replace(/lg:border-r border-\[var\(--border-color\)]/g, 'lg:border-r-2 border-[var(--border-color)]');
    
    // Header gradient
    content = content.replace(/bg-gradient-to-br from-\[var\(--text-accent\)]\/20 to-\[var\(--bg-color\)]/g, 'bg-[var(--card-bg)]');
    
    // Sidebar bg
    content = content.replace(/bg-\[var\(--card-bg-subtle\)]\/30/g, 'bg-[var(--card-bg)]');
    
    // Discipline badge
    content = content.replace(/bg-\[var\(--text-accent\)]\/10 text-\[var\(--text-accent\)] border border-\[var\(--text-accent\)]\/20/g, 'bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]');
    
    // Math block in markdown
    content = content.replace(/bg-\[var\(--card-bg-subtle\)]\/50/g, 'bg-[var(--card-bg)]');
    
    // Other opacity cleanups in TS markdown renderer
    content = content.replace(/border border-\[var\(--border-color\)]/g, 'border-2 border-[var(--border-color)]'); // to catch markdown renderer strings

    fs.writeFileSync(filename, content);
    console.log(`Processed ${filename}`);
}

processFile('src/components/ui/lesson-detail.component.ts');
