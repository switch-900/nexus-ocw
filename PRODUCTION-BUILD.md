# Production Build Guide

## Overview

This guide explains how to build and inscribe the Nexus On-Chain Wallet as separate, maintainable inscriptions.

## Architecture

The production app is split into **separate inscriptions** for maximum maintainability:

1. **12-loader.js** (NexusWalletConnect library) - Loads all wallet providers
2. **main.js** (React app bundle) - Your frontend application  
3. **styles.css** (Optional) - App styles
4. **index.html** (Entry point) - References all SAT numbers

### Why Separate Inscriptions?

✅ **Update the app** without re-inscribing the wallet library  
✅ **Update styles** independently  
✅ **Lower costs** - only re-inscribe what changed  
✅ **Version control** - track each component separately

---

## Step 1: Inscribe Wallet Providers (01-11)

First, inscribe all wallet provider modules using **compressed** versions:

```bash
# These should already be inscribed with SAT numbers:
# 01-base-provider.js     → 1408319431385218
# 02-normalizers.js       → 1408319431385764  
# 03-wallet-connector.js  → 1180016128405661
# 04-11: TODO - inscribe compressed versions
```

Update files 04-11 with correct SAT references, then inscribe them as compressed.

---

## Step 2: Update and Inscribe the Loader

Once all providers are inscribed, update `ready-to-inscribe/12-loader.js` with all SAT numbers:

```javascript
const SAT_NUMBERS = {
  BASE_PROVIDER: '1408319431385218',
  NORMALIZERS: '1408319431385764',
  WALLET_CONNECTOR: '1180016128405661',
  UNISAT: 'YOUR-SAT-04',
  XVERSE: 'YOUR-SAT-05',
  // ... etc
};
```

Then inscribe the **compressed** version:
```bash
# Inscribe ready-to-inscribe/compressed/12-loader.js.br
```

**Record the loader SAT number** - you'll need it for the HTML!

---

## Step 3: Build the Frontend App

Build your React app into separate inscribable files:

```bash
npm run build:prod
```

This creates in `dist-production/`:
- `index.html` - Entry point (needs SAT updates)
- `main.js` - Bundled React app (**inscribe this as compressed**)
- `styles.css` - App styles (**optional, can inscribe compressed**)

---

## Step 4: Inscribe Frontend Assets

Inscribe the generated files:

```bash
# 1. Inscribe main.js as compressed
#    Use: dist-production/main.js (compress with brotli first)
#    Record SAT number

# 2. (Optional) Inscribe styles.css as compressed  
#    Use: dist-production/styles.css (compress with brotli first)
#    Record SAT number
```

---

## Step 5: Update HTML with SAT Numbers

Update the production HTML with all your SAT numbers:

```bash
node update-sat-references.js \
  --loader YOUR-LOADER-SAT \
  --main YOUR-MAIN-JS-SAT \
  --styles YOUR-STYLES-SAT
```

Or manually edit `dist-production/index.html`:

```html
<!-- Replace TODO-LOADER-SAT with your 12-loader SAT -->
<script type="module">
  import NWC from '/r/sat/YOUR-LOADER-SAT/at/-1/content';
  window.NexusWalletConnect = NWC;
</script>

<!-- Replace TODO-MAIN-JS-SAT with your main.js SAT -->
<script type="module" src="/r/sat/YOUR-MAIN-JS-SAT/at/-1/content"></script>
```

---

## Step 6: Inscribe the HTML

Finally, inscribe the updated HTML as an **HTML inscription**:

```bash
# Inscribe dist-production/index.html as HTML
# Content-Type: text/html;charset=utf-8
```

---

## Final Architecture

```
Bitcoin Inscription Layers:

┌─────────────────────────────────────┐
│  index.html (HTML inscription)      │ ← Main entry point
│  References all other SATs           │
└─────────────────────────────────────┘
           ↓ imports
┌─────────────────────────────────────┐
│  12-loader.js (Compressed)          │ ← Wallet library
│  SAT: YOUR-LOADER-SAT                │
└─────────────────────────────────────┘
           ↓ loads
┌─────────────────────────────────────┐
│  01-11 Wallet Providers (Compressed)│ ← Individual wallets
│  SATs: 1408319431385218, etc.       │
└─────────────────────────────────────┘

           ↓ runs
┌─────────────────────────────────────┐
│  main.js (Compressed)               │ ← Your React app
│  SAT: YOUR-MAIN-JS-SAT               │
└─────────────────────────────────────┘

           ↓ styles (optional)
┌─────────────────────────────────────┐
│  styles.css (Compressed)            │ ← App styles
│  SAT: YOUR-STYLES-SAT                │
└─────────────────────────────────────┘
```

---

## Updating the App

To update just the frontend (without re-inscribing wallet library):

1. **Make changes** to your React components
2. **Rebuild**: `npm run build:prod`
3. **Compress**: Brotli compress `main.js` and/or `styles.css`
4. **Inscribe**: Only inscribe the changed files
5. **Update HTML**: Update SAT references for changed files
6. **Re-inscribe HTML**: Inscribe the updated index.html

**Cost savings**: Only ~3 inscriptions instead of 15!

---

## Compression

**Always use brotli compression** for inscriptions:

```bash
# Compress a file
brotli -q 11 -o file.js.br file.js

# Verify it works
curl https://ordinals.com/r/sat/YOUR-SAT/at/-1/content
```

Ordinals.com automatically decompresses brotli with proper headers!

---

## Troubleshooting

### ES6 Import Errors
- Ensure files are inscribed as **JavaScript**, not generic binary
- Check Content-Type is set correctly

### NexusWalletConnect Undefined
- Verify loader SAT is correct in HTML
- Check browser console for import errors
- Ensure loader finished loading before main.js runs

### Styles Not Applied
- If using separate CSS inscription, uncomment the link in HTML
- Or inline styles in HTML to avoid extra inscription

---

## Development Workflow

```bash
# Development (with proxy)
npm run dev

# Production build
npm run build:prod

# Preview production build locally
npm run preview:prod
```

---

## Files to Inscribe

**Checklist:**

- [ ] 04-unisat-provider.js.br (compressed)
- [ ] 05-xverse-provider.js.br (compressed)
- [ ] 06-okx-provider.js.br (compressed)
- [ ] 07-leather-provider.js.br (compressed)
- [ ] 08-phantom-provider.js.br (compressed)
- [ ] 09-wizz-provider.js.br (compressed)
- [ ] 10-magiceden-provider.js.br (compressed)
- [ ] 11-oyl-provider.js.br (compressed)
- [ ] 12-loader.js.br (compressed) - **UPDATE SATS FIRST**
- [ ] main.js (compressed) - **BUILD FIRST**
- [ ] styles.css (compressed, optional) - **BUILD FIRST**
- [ ] index.html (HTML) - **UPDATE SATS FIRST**

---

## Success! 🎉

Your app is now fully on Bitcoin with a modular, maintainable architecture!

Access it at: `https://ordinals.com/inscription/YOUR-HTML-INSCRIPTION-ID`
