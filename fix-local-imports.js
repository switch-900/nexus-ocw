#!/usr/bin/env node
/**
 * Fix Inscriptions Local Folder
 * 
 * Converts SAT references in "inscriptions local/" to relative imports
 * for proper local development.
 */

import fs from 'fs';
import path from 'path';

const SOURCE_DIR = 'inscriptions local';

console.log('🔧 Fixing inscriptions local folder for development...\n');

// Files to process
const files = [
  '01-base-provider.js',
  '02-normalizers.js',
  '03-wallet-connector.js',
  '04-unisat-provider.js',
  '05-xverse-provider.js',
  '06-okx-provider.js',
  '07-leather-provider.js',
  '08-phantom-provider.js',
  '09-wizz-provider.js',
  '10-magiceden-provider.js',
  '11-oyl-provider.js'
];

let fixedCount = 0;

files.forEach(filename => {
  const filePath = path.join(SOURCE_DIR, filename);
  
  if (!fs.existsSync(filePath)) {
    console.log(`  ⚠️  ${filename} not found, skipping`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Split into lines for better context
  const lines = content.split('\n');
  const updatedLines = lines.map(line => {
    // Check if this line has a SAT import
    if (line.includes('/r/sat/TODO-Add-SAT/at/-1/content') || 
        line.includes('./r/sat/TODO-Add-SAT/at/-1/content')) {
      
      modified = true;
      
      // Determine which file based on what's being imported
      if (line.includes('BaseWalletProvider')) {
        return line.replace(/['"].*?TODO-Add-SAT.*?['"]/, "'./01-base-provider.js'");
      } else if (line.includes('normalizers')) {
        return line.replace(/['"].*?TODO-Add-SAT.*?['"]/, "'./02-normalizers.js'");
      } else if (line.includes('createUnsecuredToken') || line.includes('WalletConnector')) {
        return line.replace(/['"].*?TODO-Add-SAT.*?['"]/, "'./03-wallet-connector.js'");
      }
      
      // Default replacement
      return line.replace(/['"].*?TODO-Add-SAT.*?['"]/, "'./01-base-provider.js'");
    }
    return line;
  });

  if (modified) {
    fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf8');
    console.log(`  ✓ Fixed ${filename}`);
    fixedCount++;
  } else {
    console.log(`  ○ ${filename} already correct`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files in "${SOURCE_DIR}/"`);
console.log('📝 These files now use relative imports for local development');
console.log('📦 Run "npm run prepare-inscriptions" to create inscription-ready versions\n');
