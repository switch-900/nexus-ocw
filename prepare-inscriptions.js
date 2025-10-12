#!/usr/bin/env node
/**
 * Inscription Preparation Script
 * 
 * Converts local development files to inscription-ready files with SAT references.
 * Creates a complete inscription package ready for Bitcoin ordinals.
 * 
 * Workflow:
 * 1. Develop in "inscriptions local/" with relative imports
 * 2. Run this script when ready to inscribe
 * 3. Script creates "ready-to-inscribe/" folder
 * 4. Prompts for known SAT numbers or uses TODO placeholders
 * 5. Converts relative imports to /r/sat/{NUMBER} references
 * 6. Creates bundled frontend pointing to inscribed loader
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import { minify } from 'terser';
import zlib from 'zlib';
import { promisify } from 'util';

const brotliCompress = promisify(zlib.brotliCompress);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOURCE_DIR = 'inscriptions local';
const OUTPUT_DIR = 'ready-to-inscribe';
const LOADER_SOURCE = 'frontend/components/dev-loader-simple.js';

// Module mapping for SAT references
const MODULE_MAP = {
  '01-base-provider.js': { name: 'BaseWalletProvider', sat: 'TODO-Add-SAT-01' },
  '02-normalizers.js': { name: 'Normalizers', sat: 'TODO-Add-SAT-02' },
  '03-wallet-connector.js': { name: 'WalletConnector', sat: 'TODO-Add-SAT-03' },
  '04-unisat-provider.js': { name: 'UniSat', sat: 'TODO-Add-SAT-04' },
  '05-xverse-provider.js': { name: 'Xverse', sat: 'TODO-Add-SAT-05' },
  '06-okx-provider.js': { name: 'OKX', sat: 'TODO-Add-SAT-06' },
  '07-leather-provider.js': { name: 'Leather', sat: 'TODO-Add-SAT-07' },
  '08-phantom-provider.js': { name: 'Phantom', sat: 'TODO-Add-SAT-08' },
  '09-wizz-provider.js': { name: 'Wizz', sat: 'TODO-Add-SAT-09' },
  '10-magiceden-provider.js': { name: 'MagicEden', sat: 'TODO-Add-SAT-10' },
  '11-oyl-provider.js': { name: 'Oyl', sat: 'TODO-Add-SAT-11' },
  '12-loader.js': { name: 'Loader', sat: 'TODO-Add-SAT-12' }
};

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

/**
 * Main execution
 */
async function main() {
  console.log('🚀 NexusWalletConnect Inscription Preparation\n');
  console.log('This script will prepare your files for Bitcoin inscription.');
  console.log('You can provide known SAT numbers or leave them as TODO placeholders.\n');

  // Ask if user wants to provide SAT numbers
  const provideSats = await question('Do you have SAT numbers to provide? (y/n): ');
  const satNumbers = {};

  if (provideSats.toLowerCase() === 'y') {
    console.log('\nEnter SAT numbers for each module (press Enter to use TODO):');
    
    for (const [filename, info] of Object.entries(MODULE_MAP)) {
      const sat = await question(`  ${info.name} (${filename}): `);
      if (sat.trim()) {
        satNumbers[filename] = sat.trim();
      } else {
        satNumbers[filename] = info.sat;
      }
    }
  } else {
    // Use all TODOs
    for (const [filename, info] of Object.entries(MODULE_MAP)) {
      satNumbers[filename] = info.sat;
    }
  }

  console.log('\n📦 Creating inscription package...\n');

  // Create output directories
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log(`⚠️  Removing existing ${OUTPUT_DIR}/ directory...`);
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'minified'), { recursive: true });
  fs.mkdirSync(path.join(OUTPUT_DIR, 'compressed'), { recursive: true });

  // Process modules 01-11 from "inscriptions local/"
  console.log('Converting local development files to inscription format...');
  for (let i = 1; i <= 11; i++) {
    const filename = `${i.toString().padStart(2, '0')}-${getModuleFilename(i)}`;
    await processInscriptionFile(filename, satNumbers);
  }

  // Process loader (12-loader.js) from inscriptions/
  console.log('Processing loader with SAT references...');
  await processLoader(satNumbers);

  // Create bundled frontend
  console.log('Creating bundled frontend...');
  await createFrontendBundle(satNumbers['12-loader.js']);

  // Create inscription manifest
  await createManifest(satNumbers);

  // Create inscription guide
  await createInscriptionGuide(satNumbers);

  console.log('\n✅ Inscription package created successfully!\n');
  console.log('📁 Output directory: ready-to-inscribe/');
  console.log('📋 Next steps:');
  console.log('   1. Review files in ready-to-inscribe/');
  console.log('   2. Follow INSCRIPTION_GUIDE.md for inscription process');
  console.log('   3. Update SAT numbers as you inscribe each module');
  console.log('   4. Test the bundled frontend after inscription\n');

  rl.close();
}

/**
 * Get module filename from number
 */
function getModuleFilename(num) {
  const map = {
    1: 'base-provider.js',
    2: 'normalizers.js',
    3: 'wallet-connector.js',
    4: 'unisat-provider.js',
    5: 'xverse-provider.js',
    6: 'okx-provider.js',
    7: 'leather-provider.js',
    8: 'phantom-provider.js',
    9: 'wizz-provider.js',
    10: 'magiceden-provider.js',
    11: 'oyl-provider.js'
  };
  return map[num];
}

/**
 * Process an inscription file (01-11)
 */
async function processInscriptionFile(filename, satNumbers) {
  const sourcePath = path.join(SOURCE_DIR, filename);
  const targetPath = path.join(OUTPUT_DIR, filename);
  const targetMinPath = path.join(OUTPUT_DIR, 'minified', filename);
  const targetBrotliPath = path.join(OUTPUT_DIR, 'compressed', filename + '.br');

  console.log(`  Processing ${filename}...`);

  if (!fs.existsSync(sourcePath)) {
    console.log(`    ⚠️  Source file not found, skipping`);
    return;
  }

  let content = fs.readFileSync(sourcePath, 'utf8');

  // Convert relative imports to SAT references
  content = convertImportsToSatReferences(content, satNumbers);

  // Create regular version
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log(`    ✓ Created ${filename}`);

  // Create minified version
  try {
    const minified = await minify(content, {
      module: true,
      compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        keep_classnames: true,
        keep_fnames: true,
        passes: 2
      },
      mangle: false, // Keep names readable for debugging
      format: {
        comments: false
      }
    });

    if (minified.code) {
      fs.writeFileSync(targetMinPath, minified.code, 'utf8');
      
      const originalSize = content.length;
      const minifiedSize = minified.code.length;
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
      console.log(`    ✓ Minified ${filename} (${savings}% smaller)`);

      // Create brotli compressed version
      const compressed = await brotliCompress(Buffer.from(minified.code, 'utf8'), {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11, // Max compression
        }
      });

      fs.writeFileSync(targetBrotliPath, compressed);
      const compressedSize = compressed.length;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`    ✓ Compressed ${filename}.br (${compressionRatio}% smaller than original)`);
    }
  } catch (error) {
    console.log(`    ⚠️  Minification failed: ${error.message}`);
  }
}

/**
 * Process the loader file (12-loader.js)
 */
/**
 * Process the loader file - Transforms dev-loader-simple.js → 12-loader.js
 * 
 * Transformation steps:
 * 1. Read dev-loader-simple.js (with relative imports)
 * 2. Convert relative imports to SAT references
 * 3. Add SAT_NUMBERS configuration object
 * 4. Remove dev-only comments
 * 5. Create minified and compressed versions
 */
async function processLoader(satNumbers) {
  const sourcePath = LOADER_SOURCE; // frontend/components/dev-loader-simple.js
  const targetPath = path.join(OUTPUT_DIR, '12-loader.js');
  const targetMinPath = path.join(OUTPUT_DIR, 'minified', '12-loader.js');
  const targetBrotliPath = path.join(OUTPUT_DIR, 'compressed', '12-loader.js.br');

  if (!fs.existsSync(sourcePath)) {
    console.log('  ⚠️  Loader source not found at:', sourcePath);
    return;
  }

  let content = fs.readFileSync(sourcePath, 'utf8');

  // STEP 1: Convert relative imports from "inscriptions local/" to SAT references
  content = convertLoaderImportsToSatReferences(content, satNumbers);

  // STEP 2: Add SAT_NUMBERS configuration object at the top
  content = addSatNumbersConfiguration(content, satNumbers);

  // STEP 3: Update header comment for inscription version
  content = updateLoaderHeader(content);

  // Create regular version
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('  ✓ Created 12-loader.js from dev-loader-simple.js');

  // Create minified version
  try {
    const minified = await minify(content, {
      module: true,
      compress: {
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        keep_classnames: true,
        keep_fnames: true,
        passes: 2
      },
      mangle: false,
      format: {
        comments: false
      }
    });

    if (minified.code) {
      fs.writeFileSync(targetMinPath, minified.code, 'utf8');

      const originalSize = content.length;
      const minifiedSize = minified.code.length;
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
      console.log(`  ✓ Minified 12-loader.js (${savings}% smaller)`);

      // Create brotli compressed version
      const compressed = await brotliCompress(Buffer.from(minified.code, 'utf8'), {
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        }
      });

      fs.writeFileSync(targetBrotliPath, compressed);
      const compressedSize = compressed.length;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      console.log(`  ✓ Compressed 12-loader.js.br (${compressionRatio}% smaller than original)`);
    }
  } catch (error) {
    console.log(`  ⚠️  Minification failed: ${error.message}`);
  }
}

/**
 * Convert dev-loader-simple.js imports to SAT references
 * Transforms: from '../../inscriptions local/01-base-provider.js'
 * To: from '/r/sat/XXXXX/at/-1/content'
 */
function convertLoaderImportsToSatReferences(content, satNumbers) {
  const lines = content.split('\n');
  
  const updatedLines = lines.map(line => {
    // Match: from '../../inscriptions local/XX-filename.js'
    const localImportMatch = line.match(/from\s+['"]\.\.\/\.\.\/inscriptions local\/(\d{2}-.+?\.js)['"]/);
    
    if (localImportMatch) {
      const importedFile = localImportMatch[1];
      const satNumber = satNumbers[importedFile] || 'TODO-Add-SAT';
      
      // Replace with SAT reference (NO ordinals.com domain)
      return line.replace(
        /from\s+['"]\.\.\/\.\.\/inscriptions local\/\d{2}-.+?\.js['"]/,
        `from '/r/sat/${satNumber}/at/-1/content'`
      );
    }
    
    return line;
  });
  
  return updatedLines.join('\n');
}

/**
 * Add SAT_NUMBERS configuration object at the beginning of the file
 */
function addSatNumbersConfiguration(content, satNumbers) {
  const satConfig = `// ============================================
// SAT NUMBER CONFIGURATION
// ============================================
// Update these SAT numbers after inscribing each module
// Then inscribe this loader as the final module (#12)

const SAT_NUMBERS = {
  // Phase 1: Core dependencies (inscribe first)
  BASE_PROVIDER: '${satNumbers['01-base-provider.js']}',
  NORMALIZERS: '${satNumbers['02-normalizers.js']}',
  WALLET_CONNECTOR: '${satNumbers['03-wallet-connector.js']}',
  
  // Phase 2: Wallet providers (inscribe after Phase 1)
  UNISAT: '${satNumbers['04-unisat-provider.js']}',
  XVERSE: '${satNumbers['05-xverse-provider.js']}',
  OKX: '${satNumbers['06-okx-provider.js']}',
  LEATHER: '${satNumbers['07-leather-provider.js']}',
  PHANTOM: '${satNumbers['08-phantom-provider.js']}',
  WIZZ: '${satNumbers['09-wizz-provider.js']}',
  MAGICEDEN: '${satNumbers['10-magiceden-provider.js']}',
  OYL: '${satNumbers['11-oyl-provider.js']}'
};

// ============================================
// INSCRIPTION-READY LOADER
// ============================================

`;
  
  // Find where to insert (after initial comments, before first import)
  const firstImportIndex = content.indexOf('import ');
  if (firstImportIndex === -1) return satConfig + content;
  
  // Find the comment block before first import
  const beforeImports = content.substring(0, firstImportIndex);
  const afterImports = content.substring(firstImportIndex);
  
  return beforeImports + satConfig + afterImports;
}

/**
 * Update header comment for inscription version
 */
function updateLoaderHeader(content) {
  const newHeader = `/**
 * NexusWalletConnect Loader
 * Inscription Module #12 - Main Entry Point
 * 
 * GENERATED FROM: frontend/components/dev-loader-simple.js
 * DO NOT EDIT THIS FILE MANUALLY - Use prepare-inscriptions.js
 * 
 * Purpose: Dynamic wallet provider loader for Bitcoin ordinals
 * Dependencies: Modules #1-11 (must be inscribed first)
 * Exports: connect(), detectWallets(), loadNormalizers(), loadWalletConnector()
 * 
 * INSCRIBE THIS MODULE LAST
 * 1. Inscribe modules 01-11 first
 * 2. Update SAT_NUMBERS below with actual inscription SATs
 * 3. Re-run prepare-inscriptions.js to regenerate this file
 * 4. Inscribe this loader.js as module #12
 * 
 * Usage in your application:
 * <script type="module">
 *   import { connect, detectWallets } from '/r/sat/LOADER_SAT/at/-1/content';
 *   
 *   const wallets = await detectWallets();
 *   const provider = await connect('UniSat');
 *   const result = await provider.connect();
 * </script>
 */

`;
  
  // Remove existing header comment block
  const headerEndIndex = content.indexOf('*/');
  if (headerEndIndex !== -1) {
    content = content.substring(headerEndIndex + 2).trim();
  }
  
  return newHeader + content;
}
/**
 * Create bundled frontend that points to inscribed loader
 */

/**
 * Convert relative imports to SAT references (for provider files 01-11)
 * Transforms: from './01-base-provider.js'
 * To: from '/r/sat/XXXXX/at/-1/content'
 */
function convertImportsToSatReferences(content, satNumbers) {
  const lines = content.split('\n');

  const updatedLines = lines.map(line => {
    // Match relative imports: from './XX-filename.js'
    const relativeImportMatch = line.match(/from\s+['"]\.\/(\d{2}-.+?\.js)['"]/);

    if (relativeImportMatch) {
      const importedFile = relativeImportMatch[1];
      const satNumber = satNumbers[importedFile] || 'TODO-Add-SAT';

      // Replace with SAT reference (NO ordinals.com domain)
      return line.replace(
        /from\s+['"]\.\/\d{2}-.+?\.js['"]/,
        `from '/r/sat/${satNumber}/at/-1/content'`
      );
    }

    return line;
  });

  return updatedLines.join('\n');
}
async function createFrontendBundle(loaderSat) {
  const bundleDir = path.join(OUTPUT_DIR, 'frontend-bundle');
  fs.mkdirSync(bundleDir, { recursive: true });

  console.log('  Building frontend with Vite...');
  
  // Build the frontend
  const { execSync } = await import('child_process');
  try {
    execSync('npm run build:frontend', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    console.log('  ✓ Frontend built successfully');
  } catch (error) {
    console.log('  ⚠️  Frontend build failed, creating simple demo instead');
    await createSimpleFrontendBundle(loaderSat, bundleDir);
    return;
  }

  // Read the built files
  const distIndexPath = path.join('dist', 'index.html');
  if (!fs.existsSync(distIndexPath)) {
    console.log('  ⚠️  Built index.html not found, creating simple demo');
    await createSimpleFrontendBundle(loaderSat, bundleDir);
    return;
  }

  let htmlContent = fs.readFileSync(distIndexPath, 'utf8');
  
  // Find and inline all JavaScript files
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*><\/script>/g;
  let match;
  const scriptsToInline = [];
  
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const scriptSrc = match[1];
    const scriptPath = path.join('dist', scriptSrc.replace(/^\//, ''));
    
    if (fs.existsSync(scriptPath)) {
      scriptsToInline.push({
        tag: match[0],
        src: scriptSrc,
        path: scriptPath
      });
    }
  }

  // Inline all scripts
  for (const script of scriptsToInline) {
    let scriptContent = fs.readFileSync(script.path, 'utf8');
    
    // Minify the script content
    try {
      const minified = await minify(scriptContent, {
        module: true,
        compress: {
          dead_code: true,
          drop_console: true,
          drop_debugger: true,
          passes: 2
        },
        mangle: true,
        format: {
          comments: false
        }
      });
      
      if (minified.code) {
        scriptContent = minified.code;
      }
    } catch (e) {
      console.log(`  ⚠️  Could not minify ${script.src}`);
    }
    
    // Replace external script with inline script
    const inlineScript = `<script type="module">${scriptContent}</script>`;
    htmlContent = htmlContent.replace(script.tag, inlineScript);
  }

  // Find and inline all CSS files
  const linkRegex = /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const cssHref = match[1];
    const cssPath = path.join('dist', cssHref.replace(/^\//, ''));
    
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      const inlineStyle = `<style>${cssContent}</style>`;
      htmlContent = htmlContent.replace(match[0], inlineStyle);
    }
  }

  // Update the import to use the inscribed loader
  htmlContent = htmlContent.replace(
    /import\s+.*?from\s+['"].*?(?:dev-loader-simple|12-loader).*?['"]/g,
    `import NexusWalletConnect from '/r/sat/${loaderSat}/at/-1/content'`
  );

  // Add inscription info
  htmlContent = htmlContent.replace(
    '</body>',
    `
  <!-- Fully Inscribed on Bitcoin -->
  <!-- Loader SAT: ${loaderSat} -->
  <!-- All frontend code inlined and compressed -->
</body>`
  );

  fs.writeFileSync(path.join(bundleDir, 'index.html'), htmlContent, 'utf8');
  console.log('  ✓ Created frontend-bundle/index.html (fully inlined)');

  // Create compressed version
  const compressed = await brotliCompress(Buffer.from(htmlContent, 'utf8'), {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    }
  });
  
  fs.writeFileSync(path.join(bundleDir, 'index.html.br'), compressed);
  const originalSize = Buffer.byteLength(htmlContent, 'utf8');
  const compressedSize = compressed.length;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  console.log(`  ✓ Compressed index.html.br (${ratio}% smaller)`);
  
  await createFrontendBundleReadme(loaderSat, bundleDir, originalSize, compressedSize);
}

/**
 * Create simple frontend bundle (fallback)
 */
async function createSimpleFrontendBundle(loaderSat, bundleDir) {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NexusWalletConnect - Bitcoin Wallet Integration</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 2em;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 1.1em;
    }
    .status {
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .status.loading {
      background: #fff3cd;
      color: #856404;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
    }
    .wallet-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }
    .wallet-button {
      padding: 20px;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      background: white;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: center;
      font-size: 1em;
    }
    .wallet-button:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    .wallet-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .info {
      background: #e7f3ff;
      padding: 15px;
      border-radius: 10px;
      margin-top: 20px;
      font-size: 0.9em;
      color: #004085;
    }
    .code {
      background: #f5f5f5;
      padding: 3px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 NexusWalletConnect</h1>
    <p class="subtitle">Bitcoin Wallet Integration from Ordinals</p>
    
    <div id="status" class="status loading">
      📦 Loading wallet connector from inscription...
    </div>

    <div id="wallets" class="wallet-grid" style="display: none;">
      <!-- Wallet buttons will be inserted here -->
    </div>

    <div id="connection-info" style="display: none;">
      <div class="info">
        <strong>Connected Wallet:</strong> <span id="wallet-name"></span><br>
        <strong>Address:</strong> <span class="code" id="wallet-address"></span><br>
        <strong>Network:</strong> <span id="wallet-network"></span>
      </div>
    </div>

    <div class="info">
      <strong>🎯 Fully Inscribed on Bitcoin</strong><br>
      This wallet connector is loaded entirely from Bitcoin ordinal inscriptions.
      No external dependencies or npm packages required!
      <br><br>
      <strong>Loader SAT:</strong> <span class="code">${loaderSat}</span>
    </div>
  </div>

  <script type="module">
    // Load NexusWalletConnect from inscription
    import NexusWalletConnect from '/r/sat/${loaderSat}/at/-1/content';

    const statusEl = document.getElementById('status');
    const walletsEl = document.getElementById('wallets');
    const connectionInfoEl = document.getElementById('connection-info');

    // Initialize
    async function init() {
      try {
        statusEl.textContent = '✅ Wallet connector loaded successfully!';
        statusEl.className = 'status success';

        // Detect available wallets
        const availableWallets = NexusWalletConnect.detectWallets();
        
        if (availableWallets.length === 0) {
          statusEl.textContent = '⚠️ No Bitcoin wallets detected. Please install a wallet extension.';
          statusEl.className = 'status error';
          return;
        }

        // Show wallet buttons
        walletsEl.style.display = 'grid';
        availableWallets.forEach(wallet => {
          const button = document.createElement('button');
          button.className = 'wallet-button';
          button.textContent = wallet;
          button.onclick = () => connectWallet(wallet);
          walletsEl.appendChild(button);
        });

      } catch (error) {
        statusEl.textContent = \`❌ Error loading wallet connector: \${error.message}\`;
        statusEl.className = 'status error';
        console.error('Initialization error:', error);
      }
    }

    // Connect to wallet
    async function connectWallet(walletName) {
      statusEl.textContent = \`🔌 Connecting to \${walletName}...\`;
      statusEl.className = 'status loading';

      try {
        const connection = await NexusWalletConnect.connect(walletName);
        
        statusEl.textContent = \`✅ Connected to \${walletName}!\`;
        statusEl.className = 'status success';

        // Show connection info
        document.getElementById('wallet-name').textContent = connection.wallet;
        document.getElementById('wallet-address').textContent = connection.address;
        document.getElementById('wallet-network').textContent = connection.network || 'mainnet';
        connectionInfoEl.style.display = 'block';

        // Disable other wallet buttons
        document.querySelectorAll('.wallet-button').forEach(btn => {
          if (btn.textContent !== walletName) {
            btn.disabled = true;
          }
        });

      } catch (error) {
        statusEl.textContent = \`❌ Connection failed: \${error.message}\`;
        statusEl.className = 'status error';
        console.error('Connection error:', error);
      }
    }

    // Start initialization
    init();
  </script>

  <!-- Fully Inscribed on Bitcoin -->
  <!-- Loader SAT: ${loaderSat} -->
</body>
</html>`;

  fs.writeFileSync(path.join(bundleDir, 'index.html'), htmlContent, 'utf8');
  console.log('  ✓ Created frontend-bundle/index.html (simple demo)');

  const compressed = await brotliCompress(Buffer.from(htmlContent, 'utf8'), {
    params: {
      [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
    }
  });
  
  fs.writeFileSync(path.join(bundleDir, 'index.html.br'), compressed);
  const originalSize = Buffer.byteLength(htmlContent, 'utf8');
  const compressedSize = compressed.length;
  const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
  console.log(`  ✓ Compressed index.html.br (${ratio}% smaller)`);

  await createFrontendBundleReadme(loaderSat, bundleDir, originalSize, compressedSize);
}

/**
 * Create README for frontend bundle
 */
async function createFrontendBundleReadme(loaderSat, bundleDir, originalSize, compressedSize) {
  const readmeContent = `# NexusWalletConnect Frontend Bundle

**All frontend code inlined and compressed!**

## File Sizes

- Original: ${(originalSize / 1024).toFixed(2)} KB
- Compressed (.br): ${(compressedSize / 1024).toFixed(2)} KB
- Compression Ratio: ${((1 - compressedSize / originalSize) * 100).toFixed(1)}%

## Features

- ✅ All JavaScript inlined and minified
- ✅ All CSS inlined
- ✅ Loads NexusWalletConnect from inscription SAT: \`${loaderSat}\`
- ✅ Single-file deployment
- ✅ Brotli compressed version included
- ✅ No external dependencies

## Usage

### Option 1: Local Testing
\`\`\`bash
npx serve .
# Visit http://localhost:3000/index.html
\`\`\`

### Option 2: Inscribe to Bitcoin
\`\`\`bash
# Inscribe the regular version
ord wallet inscribe --file index.html --fee-rate 5

# Or inscribe the compressed version (smaller)
ord wallet inscribe --file index.html.br --fee-rate 5
\`\`\`

### Option 3: Deploy to Static Host
Upload to:
- GitHub Pages
- Netlify  
- Vercel
- IPFS
- Any static file server

## Technical Details

- **Format**: Single HTML file
- **Scripts**: All inlined and minified
- **Styles**: All inlined
- **Loader**: Imported from Bitcoin inscription SAT \`${loaderSat}\`
- **Compression**: Brotli (quality 11)

## Customization

The HTML is self-contained. To customize:
1. Edit the inlined JavaScript/CSS in \`index.html\`
2. Update the loader SAT reference in the module import

`;

  fs.writeFileSync(path.join(bundleDir, 'README.md'), readmeContent, 'utf8');
  console.log('  ✓ Created frontend-bundle/README.md');
}

/**
 * Create inscription manifest
 */
async function createManifest(satNumbers) {
  const manifest = {
    name: "NexusWalletConnect",
    version: "1.0.0",
    description: "Bitcoin Wallet Integration Library - Fully Inscribed on Bitcoin",
    created: new Date().toISOString(),
    modules: []
  };

  for (const [filename, info] of Object.entries(MODULE_MAP)) {
    const filePath = path.join(OUTPUT_DIR, filename);
    const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
    
    manifest.modules.push({
      filename,
      name: info.name,
      sat: satNumbers[filename],
      size: stats ? stats.size : 0,
      ready: satNumbers[filename] !== info.sat // true if SAT number provided
    });
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'MANIFEST.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log('  ✓ Created MANIFEST.json');
}

/**
 * Create inscription guide
 */
async function createInscriptionGuide(satNumbers) {
  const hasAllSats = Object.values(satNumbers).every(sat => !sat.includes('TODO'));

  const guide = `# Inscription Guide

## Overview

This directory contains files ready for Bitcoin inscription using ordinals.com or similar tools.

**Status**: ${hasAllSats ? '✅ All SAT numbers provided - Ready to inscribe!' : '⚠️ Some SAT numbers are TODO - Inscribe in phases'}

## Inscription Process

### Phase 1: Core Dependencies (Inscribe First)

These modules have no dependencies and must be inscribed first:

1. **01-base-provider.js** - BaseWalletProvider class
   - SAT: \`${satNumbers['01-base-provider.js']}\`
   - No dependencies
   
2. **02-normalizers.js** - Address normalization utilities
   - SAT: \`${satNumbers['02-normalizers.js']}\`
   - No dependencies
   
3. **03-wallet-connector.js** - Wallet connector utilities
   - SAT: \`${satNumbers['03-wallet-connector.js']}\`
   - No dependencies

**After Phase 1**: Record the SAT numbers and re-run \`npm run prepare-inscriptions\` to update Phase 2 files.

### Phase 2: Wallet Providers

These modules depend on Phase 1 SATs. Update their imports before inscribing:

4. **04-unisat-provider.js** - SAT: \`${satNumbers['04-unisat-provider.js']}\`
5. **05-xverse-provider.js** - SAT: \`${satNumbers['05-xverse-provider.js']}\`
6. **06-okx-provider.js** - SAT: \`${satNumbers['06-okx-provider.js']}\`
7. **07-leather-provider.js** - SAT: \`${satNumbers['07-leather-provider.js']}\`
8. **08-phantom-provider.js** - SAT: \`${satNumbers['08-phantom-provider.js']}\`
9. **09-wizz-provider.js** - SAT: \`${satNumbers['09-wizz-provider.js']}\`
10. **10-magiceden-provider.js** - SAT: \`${satNumbers['10-magiceden-provider.js']}\`
11. **11-oyl-provider.js** - SAT: \`${satNumbers['11-oyl-provider.js']}\`

**After Phase 2**: Record all SAT numbers and re-run script to update the loader.

### Phase 3: Loader

The main entry point that loads all other modules:

12. **12-loader.js** - Main NexusWalletConnect loader
    - SAT: \`${satNumbers['12-loader.js']}\`
    - Update SAT_NUMBERS object with all Phase 1 & 2 SATs before inscribing

## Inscription Commands

### Using ordinals.com (Recommended)

\`\`\`bash
# Inscribe each file individually
ord wallet inscribe --file ready-to-inscribe/01-base-provider.js --fee-rate <fee>
ord wallet inscribe --file ready-to-inscribe/02-normalizers.js --fee-rate <fee>
# ... continue for all files
\`\`\`

### Using Gamma or other tools

Follow their specific inscription process. Make sure to inscribe in the order specified above.

## After Inscription

1. **Test the inscribed loader**:
   \`\`\`html
   <script type="module">
     import NexusWalletConnect from '/r/sat/${satNumbers['12-loader.js']}/at/-1/content';
     // Test API
   </script>
   \`\`\`

2. **Deploy the frontend bundle**:
   - Inscribe \`frontend-bundle/index.html\` as an HTML inscription
   - Or deploy to any static host

3. **Update documentation** with final SAT numbers

## File Sizes

Run \`npm run inscription-report\` to see file sizes and compression stats.

## Verification Checklist

- [ ] Phase 1 files inscribed and SAT numbers recorded
- [ ] Phase 2 files updated with Phase 1 SATs
- [ ] Phase 2 files inscribed and SAT numbers recorded
- [ ] Loader updated with all SAT numbers
- [ ] Loader inscribed and SAT number recorded
- [ ] Tested loader from inscription URL
- [ ] Frontend bundle created
- [ ] Frontend bundle tested/deployed
- [ ] Documentation updated

## Support

For issues or questions, refer to the main project documentation.
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'INSCRIPTION_GUIDE.md'), guide, 'utf8');
  console.log('  ✓ Created INSCRIPTION_GUIDE.md');
}

// Run main function
main().catch(error => {
  console.error('\n❌ Error:', error.message);
  console.error(error.stack);
  rl.close();
  process.exit(1);
});
