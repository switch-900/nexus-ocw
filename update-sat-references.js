#!/usr/bin/env node

/**
 * Update SAT Numbers Script
 * 
 * Helps update SAT references in production HTML after inscribing
 * 
 * Usage:
 *   node update-sat-references.js --loader SAT123 --main SAT456 --styles SAT789
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const satNumbers = {};

for (let i = 0; i < args.length; i += 2) {
  const key = args[i].replace('--', '');
  const value = args[i + 1];
  if (value) {
    satNumbers[key] = value;
  }
}

console.log('📝 Updating SAT references...');
console.log('SAT Numbers:', satNumbers);

// Read the production HTML
const htmlPath = path.join(__dirname, 'dist-production', 'index.html');

if (!fs.existsSync(htmlPath)) {
  console.error('❌ Error: dist-production/index.html not found');
  console.error('   Run "npm run build:prod" first');
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf-8');

// Update loader SAT
if (satNumbers.loader) {
  html = html.replace(/TODO-LOADER-SAT/g, satNumbers.loader);
  console.log('✅ Updated loader SAT:', satNumbers.loader);
}

// Update main.js SAT
if (satNumbers.main) {
  html = html.replace(/TODO-MAIN-JS-SAT/g, satNumbers.main);
  console.log('✅ Updated main.js SAT:', satNumbers.main);
}

// Update styles SAT (optional)
if (satNumbers.styles) {
  // Uncomment the styles link if provided
  html = html.replace(
    /<!-- <link rel="stylesheet" href="\/r\/sat\/TODO-STYLES-SAT\/at\/-1\/content"> -->/,
    `<link rel="stylesheet" href="/r/sat/${satNumbers.styles}/at/-1/content">`
  );
  console.log('✅ Updated styles SAT:', satNumbers.styles);
}

// Write back
fs.writeFileSync(htmlPath, html, 'utf-8');

console.log('\n✅ SAT references updated successfully!');
console.log(`   Output: ${htmlPath}`);
console.log('\n📋 Next steps:');
console.log('   1. Review the updated HTML');
console.log('   2. Inscribe index.html as HTML inscription');
console.log('   3. Your app is now fully on Bitcoin!');

// Show remaining TODOs
const remaining = html.match(/TODO-[A-Z-]+/g);
if (remaining && remaining.length > 0) {
  console.log('\n⚠️  Remaining TODOs:', [...new Set(remaining)]);
}
