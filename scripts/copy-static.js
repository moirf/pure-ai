// Simple static export assembler for output:'export' replacement.
// Copies:
//  1. All route HTML files named page.html from .next/server/app -> out/<route>/index.html
//  2. Public/ assets -> out/
//  3. .next/static runtime assets -> out/_next/static
//  4. Copies any route-level metadata (favicon etc.) if present

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const appDir = path.join(root, '.next', 'server', 'app');
const outDir = path.join(root, 'out');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

// 1. Copy HTML pages
if (fs.existsSync(appDir)) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (entry === 'page.html') {
        const rel = path.relative(appDir, full); // e.g. projects/page.html
        const routePath = rel.replace(/\\/g, '/').replace(/\/page\.html$/, '');
        let destDir;
        if (routePath === '') destDir = outDir; else destDir = path.join(outDir, routePath);
        ensureDir(destDir);
        copyFile(full, path.join(destDir, 'index.html'));
      }
    }
  };
  walk(appDir);
}

// 2. Copy public assets
const publicDir = path.join(root, 'public');
if (fs.existsSync(publicDir)) {
  const copyRecursive = (src, dest) => {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      const s = path.join(src, entry);
      const d = path.join(dest, entry);
      const stat = fs.statSync(s);
      if (stat.isDirectory()) copyRecursive(s, d); else copyFile(s, d);
    }
  };
  copyRecursive(publicDir, outDir);
}

// 3. Copy _next/static runtime assets
const staticDir = path.join(root, '.next', 'static');
if (fs.existsSync(staticDir)) {
  const dest = path.join(outDir, '_next', 'static');
  const copyRecursive = (src, dest) => {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      const s = path.join(src, entry);
      const d = path.join(dest, entry);
      const stat = fs.statSync(s);
      if (stat.isDirectory()) copyRecursive(s, d); else copyFile(s, d);
    }
  };
  copyRecursive(staticDir, dest);
}

console.log('Static site assembled in out/');
