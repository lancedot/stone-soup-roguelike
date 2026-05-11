import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const out = path.join(root, '面包小队-单文件版.html');
let html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

html = html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, (_, src) => {
  const js = fs.readFileSync(path.join(dist, src.replace(/^\//, '')), 'utf8');
  return `<script type="module">\n${js}\n</script>`;
});

html = html.replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, (_, href) => {
  const css = fs.readFileSync(path.join(dist, href.replace(/^\//, '')), 'utf8');
  return `<style>\n${css}\n</style>`;
});

// Inline every image asset reference used by the app as data URLs.
html = html.replace(/(?:\.\/)?assets\/([A-Za-z0-9_-]+\.(svg|png))/g, (_, file, ext) => {
  const assetPath = path.join(dist, 'assets', file);
  if (ext === 'svg') {
    const svg = fs.readFileSync(assetPath, 'utf8');
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  const png = fs.readFileSync(assetPath);
  return `data:image/png;base64,${png.toString('base64')}`;
});

html = html.replace('</head>', `<meta name="description" content="面包小队：可分享的单文件小体量肉鸽游戏，所有素材已内联。">\n</head>`);
fs.writeFileSync(out, html);
const sizeKb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`${out}\n${sizeKb} KB`);
