const https = require('https');
const fs = require('fs');
const path = require('path');

const cssUrl = 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Lora:ital,wght@0,400;0,600;1,400;1,600&display=swap';
const destDir = path.join(__dirname, 'src', 'assets', 'fonts');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

https.get(cssUrl, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
}, (res) => {
  let css = '';
  res.on('data', chunk => css += chunk);
  res.on('end', async () => {
    const urls = [...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map(m => m[1]);
    let newCss = css;
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      // extract font name and weight if possible, else use index
      const filename = `font-${i}.woff2`;
      const filepath = path.join(destDir, filename);
      
      await new Promise((resolve) => {
        https.get(url, (res) => {
          const stream = fs.createWriteStream(filepath);
          res.pipe(stream);
          stream.on('finish', () => resolve());
        });
      });
      
      // Update CSS to use local relative path
      newCss = newCss.replace(url, `/assets/fonts/${filename}`);
    }
    
    fs.writeFileSync(path.join(__dirname, 'src', 'assets', 'fonts', 'fonts.css'), newCss);
    console.log('Fonts downloaded and CSS generated!');
  });
});
