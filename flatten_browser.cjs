const fs = require('fs');

function processFile(filename) {
    let content = fs.readFileSync(filename, 'utf-8');
    
    // Replace 1px borders with 2px borders
    content = content.replace(/border border-\[var\(--border-color\)/g, 'border-2 border-[var(--border-color)');
    
    // Remove gradients
    content = content.replace(/<div class="absolute inset-0 bg-gradient-to-br.*pointer-events-none"><\/div>/g, '');
    
    // Replace opacity modifiers on badges
    // From: bg-[var(--text-accent)]/20 text-[var(--text-accent)] border border-[var(--text-accent)]/30
    // To: bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]
    content = content.replace(/bg-\[var\(--text-accent\)]\/20 text-\[var\(--text-accent\)] border border-\[var\(--text-accent\)]\/30/g, 
                             'bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]');
                             
    // hover:bg-[var(--text-accent)]/10 hover:scale-110 => hover:bg-[var(--text-accent)] hover:text-white hover:scale-110
    content = content.replace(/hover:bg-\[var\(--text-accent\)]\/10/g, 'hover:bg-[var(--text-accent)] hover:text-white');
    
    // Tech badges: bg-[var(--card-bg-subtle)] text-[var(--text-color-muted)] border border-[var(--border-color)]
    // To: bg-[var(--card-bg)] text-[var(--text-color)] border-2 border-[var(--border-color)]
    content = content.replace(/bg-\[var\(--card-bg-subtle\)] text-\[var\(--text-color-muted\)] border border-\[var\(--border-color\)]/g,
                              'bg-[var(--card-bg)] text-[var(--text-color)] border-2 border-[var(--border-color)]');
                              
    // Video guide circle: bg-[var(--text-accent)]/20 text-[var(--text-accent)]
    content = content.replace(/bg-\[var\(--text-accent\)]\/20 text-\[var\(--text-accent\)]/g,
                              'bg-[var(--card-bg)] text-[var(--text-accent)] border-2 border-[var(--text-accent)]');

    fs.writeFileSync(filename, content);
    console.log(`Processed ${filename}`);
}

processFile('src/components/ui/lesson-browser.component.ts');
