// scripts/check-css.js
// Fails if no .css file exists in out/_next/static

const fs = require('fs');
const path = require('path');

const staticDir = path.join(process.cwd(), 'out', '_next', 'static');
let found = false;

function searchForCss(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (searchForCss(full)) return true;
    } else if (entry.endsWith('.css')) {
      return true;
    }
  }
  return false;
}

if (!fs.existsSync(staticDir)) {
  console.error('out/_next/static does not exist!');
  process.exit(1);
}

found = searchForCss(staticDir);

if (!found) {
  console.error('No CSS file found in out/_next/static!');
  process.exit(1);
} else {
  console.log('CSS file found in out/_next/static.');
}
