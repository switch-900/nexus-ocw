# 🎯 Nexus On-Chain Wallet



## 📁 Workspace Structure

```
nexus-ocw/
├── 📁 inscriptions local/           [11 source files]
│   ├── 01-base-provider.js
│   ├── 02-normalizers.js
│   ├── 03-wallet-connector.js
│   ├── 04-unisat-provider.js
│   ├── 05-xverse-provider.js
│   ├── 06-okx-provider.js
│   ├── 07-leather-provider.js
│   ├── 08-phantom-provider.js
│   ├── 09-wizz-provider.js
│   ├── 10-magiceden-provider.js
│   └── 11-oyl-provider.js
│
├── 📁 frontend/                     [React Application]
│   ├── index.dev.html               (Development)
│   ├── index.html                   (Production)
│   ├── App.jsx                      (Main component)
│   ├── main.jsx                     (Entry point)
│   ├── vite.config.js               (Frontend config)
│   │
│   ├── 📁 components/
│   │   ├── dev-loader-simple.js     ⭐ LOADER SOURCE
│   │   ├── InscriptionCreator.jsx
│   │   ├── InscriptionItem.jsx
│   │   ├── WalletTester.jsx
│   │   ├── XversePanel.jsx
│   │   └── walletCapabilities.js
│   │
│   └── 📁 styles/
│       ├── App.css
│       ├── InscriptionItem.css
│       └── XversePanel.css
│
├── 📄 prepare-inscriptions.js       ⭐ Main inscription prep script
├── 📄 fix-local-imports.js          (Helper script)
├── 📄 vite.config.js                (Main Vite config)
├── 📄 package.json                  (Dependencies)
└── 📄 package-lock.json             (Lock file)
```

**Total**: 30 essential files (no bloat!) ⭐ **NEW**: Enhanced with utility functions & comprehensive testing

---

## 🚀 Quick Start

### Development
```bash
# Install dependencies (first time only)
npm install

# Start dev server
npm run dev

# Open browser to: http://localhost:5173
```

### Prepare for Inscription
```bash
# Generate inscription-ready files
npm run prepare-inscriptions

# Output: ready-to-inscribe/
# - regular/ (readable files)
# - minified/ (44% smaller)
# - compressed/ (91% smaller!)
```

---

## 🔑 Key Concepts

### Source Files (Edit These)
- `frontend/components/dev-loader-simple.js` → Loader source
- `inscriptions local/01-11` → Provider sources

### Generated Files (Don't Edit)
- `ready-to-inscribe/12-loader.js` → Generated from dev-loader-simple.js
- `ready-to-inscribe/01-11` → Generated from inscriptions local/
- `ready-to-inscribe/minified/*` → Optimized versions
- `ready-to-inscribe/compressed/*` → Brotli compressed

---

## 📝 Workflow

### 1. Daily Development
```bash
# Edit source files
vim frontend/components/dev-loader-simple.js
vim "inscriptions local/04-unisat-provider.js"

# Test changes
npm run dev
```

### 2. Prepare for Inscription
```bash
# Generate all inscription files
npm run prepare-inscriptions

# Script does:
# ✅ Reads dev-loader-simple.js
# ✅ Converts relative imports → SAT references
# ✅ Generates 12-loader.js
# ✅ Creates 3 versions: regular, minified, compressed
# ✅ No ordinals.com (just /r/sat/XXX/at/-1/content)
```

### 3. Inscription Process
1. **Phase 1**: Inscribe core (01-03)
2. **Phase 2**: Update SAT numbers, re-run script, inscribe providers (04-11)
3. **Phase 3**: Update SAT numbers, re-run script, inscribe loader (12)
4. **Phase 4**: Deploy frontend bundle

---

## 🔌 Wallet Compatibility Matrix

### Supported Wallets & Core Capabilities

| Wallet | Balance | Inscriptions | Sign PSBT | Send BTC | Sign Message | Push PSBT | Get Public Key | Create Inscription |
|--------|---------|--------------|-----------|----------|--------------|-----------|----------------|-------------------|
| **UniSat** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Xverse** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **OKX** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Leather** | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Phantom** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Wizz** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Oyl** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Magic Eden** | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### Advanced Features by Wallet

| Feature | UniSat | Xverse | OKX | Leather | Phantom | Wizz | Oyl | Magic Eden |
|---------|--------|--------|-----|---------|---------|------|-----|------------|
| **Runes Support** | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **BRC-20 Tokens** | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Stacks Support** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Multi-Address** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Batch Operations** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Hardware Wallet** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **NFT Support** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| **UTXO Access** | ✅ | ❌ | ⚠️ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Capabilities API** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **BRC-20 Listing** | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 📚 NexusWalletConnect API Reference

### Core Connection Functions

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `connect(walletName)` | Connect to a specific wallet | `Promise<Provider>` | Auto-detects and connects |
| `disconnect()` | Disconnect current wallet | `Promise<void>` | Clears all state |
| `detectWallets()` | Find all installed wallets | `Array<Object>` | Returns wallet info + detection |
| `getState()` | Get current connection state | `Object` | `{isConnected, walletType, address, balance, provider}` |
| `subscribe(callback)` | Subscribe to state changes | `Function` | Returns unsubscribe function |
| `getCurrentProvider()` | Get active provider instance | `Provider\|null` | Direct access to provider |

### Wallet Information

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `getWalletInfo(name)` | Get wallet metadata | `Object` | Features, download URL, detection |
| `getAllWalletInfo()` | Get all wallet metadata | `Object` | Complete wallet registry |
| `getWalletFeatures()` | Get current wallet features | `Object` | Provider-specific capabilities |

### Basic Wallet Operations

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `getBalance()` | Get wallet balance | `Promise<number>` | Always returns BTC (not satoshis) |
| `getAddress()` | Get current address | `Promise<string>` | Primary wallet address |
| `getPublicKey()` | Get public key | `Promise<string>` | If supported by wallet |
| `getAccounts()` | Get all accounts | `Promise<Array>` | Multi-account wallets |
| `getNetwork()` | Get current network | `Promise<string>` | 'mainnet', 'testnet', etc. |
| `switchNetwork(network)` | Switch networks | `Promise<void>` | If supported |

### Transaction Operations

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `signPsbt(psbt, options)` | Sign a PSBT | `Promise<string>` | Returns signed PSBT hex |
| `signPsbts(psbts)` | Sign multiple PSBTs | `Promise<Array>` | Batch signing |
| `sendBitcoin(to, amount)` | Send Bitcoin | `Promise<string>` | Returns transaction ID |
| `sendBTC(to, amount)` | Alias for sendBitcoin | `Promise<string>` | Same as sendBitcoin |
| `pushPsbt(psbt)` | Broadcast signed PSBT | `Promise<string>` | Returns transaction ID |
| `pushTx(txHex)` | Broadcast raw transaction | `Promise<string>` | Returns transaction ID |
| `signMessage(message)` | Sign arbitrary message | `Promise<string>` | Returns signature |

### Inscription Operations

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `getInscriptions(offset, limit)` | Get inscriptions paginated | `Promise<Array>` | Normalized inscription objects |
| `getAllInscriptions()` | Get all inscriptions | `Promise<Array>` | Auto-handles pagination |
| `sendInscription(to, inscriptionId)` | Send an inscription | `Promise<string>` | Returns transaction ID |
| `createInscription(data)` | Create new inscription | `Promise<Object>` | Xverse, Wizz only |
| `inscribe(content, options)` | Inscribe content | `Promise<Object>` | Generic inscribe method |

### Xverse-Specific Functions

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `getAddresses(purposes)` | Get addresses by purpose | `Promise<Array>` | `['payment', 'ordinals', 'stacks']` |
| `createRepeatInscriptions(data)` | Batch inscriptions | `Promise<Object>` | Repeat same content multiple times |
| `sendInscriptions(params)` | Send multiple inscriptions | `Promise<string>` | Batch transfer |
| `getRunesBalance()` | Get Runes balance | `Promise<Object>` | Runes token balances |
| `transferRunes(params)` | Transfer Runes | `Promise<Object>` | `{recipient, runeName, amount}` |
| `mintRunes(params)` | Mint Runes | `Promise<Object>` | `{runeName}` |
| `etchRunes(params)` | Create new Rune | `Promise<Object>` | `{runeName, symbol, divisibility, premine}` |
| `getRunesOrder(orderId)` | Check Runes order status | `Promise<Object>` | Order tracking |
| `signMultipleTransactions(psbts)` | Sign multiple transactions | `Promise<Array>` | Batch operations |

### Leather-Specific Functions (Stacks Wallet)

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `getProductInfo()` | Get wallet product info | `Promise<Object>` | Leather version, features |
| `getURL()` | Get wallet URL | `Promise<string>` | Wallet app URL |
| `signStructuredData(data)` | Sign structured data | `Promise<Object>` | Stacks structured signing |
| `authenticate(options)` | Authenticate with wallet | `Promise<Object>` | Stacks authentication |
| `sendStacksTransaction(txOptions)` | Send Stacks transaction | `Promise<Object>` | Stacks network |
| `updateProfile(profileData)` | Update user profile | `Promise<Object>` | Profile management |

### Magic Eden-Specific Functions

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `isHardware()` | Check if hardware wallet | `Promise<boolean>` | Ledger, Trezor detection |
| `call(method, params)` | Call Magic Eden RPC | `Promise<*>` | Direct RPC access |
| `signMultipleTransactions(psbts)` | Sign multiple transactions | `Promise<Array>` | Batch operations |

### OKX-Specific Functions

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `inscribeTransfer(ticker, amount)` | Inscribe BRC-20 transfer | `Promise<Object>` | BRC-20 operations |
| `splitUtxo(options)` | Split UTXO | `Promise<string>` | UTXO management |
| `transferNft(to, inscriptionId)` | Transfer NFT | `Promise<string>` | NFT operations |
| `watchAsset(asset)` | Add asset to watch list | `Promise<boolean>` | Asset tracking |
| `mint(mintData)` | Mint tokens | `Promise<Object>` | Generic minting |
| `createInscription(data)` | Create inscription | `Promise<Object>` | OKX inscription creation |

### UniSat-Specific Functions

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `inscribeTransfer(ticker, amount)` | Inscribe BRC-20 transfer | `Promise<Object>` | BRC-20 operations |

### Utility Functions

| Function | Description | Returns | Notes |
|----------|-------------|---------|-------|
| `getCapabilities()` | Get wallet capabilities | `Promise<Object>` | Feature matrix for current wallet |
| `getUtxos()` | Get UTXOs | `Promise<Array>` | UniSat/Wizz only |
| `getBRC20List()` | Get BRC-20 tokens | `Promise<Array>` | Token holdings |
| `loadNormalizers()` | Load data normalizers | `Promise<Object>` | Format conversion utilities |
| `loadWalletConnector()` | Load wallet connector utils | `Promise<Object>` | Advanced connection utilities |
| `createProvider(walletName)` | Create provider instance | `Provider` | Direct provider creation |

---

## 🎯 Frontend Features

### Enhanced Wallet Testing
- **🧪 Complete Method Testing**: Test all 60+ wallet methods across 8 wallets
- **📊 Capability Matrix**: Interactive comparison of wallet features
- **💻 Code Snippets**: Copy-paste ready code for all functions
- **🔍 Comprehensive Reports**: Downloadable test reports in Markdown format

### Advanced UI Components
- **🪙 BRC-20 Token Management**: View and transfer BRC-20 tokens
- **📦 UTXO Visualization**: Inspect unspent outputs (UniSat/Wizz)
- **🔧 Utility Functions**: Access to `getCapabilities()`, `getUtxos()`, `getBRC20List()`
- **🎨 Dark/Light Mode**: Professional responsive design

### Real-time Features
- **⚡ Live Balance Updates**: Auto-refresh on wallet connection
- **🔄 State Management**: React-based reactive state updates
- **📱 Mobile Responsive**: Works on all devices
- **⚠️ Error Handling**: User-friendly error messages and validation

---

## 🚀 Usage Examples

### Basic Connection
```javascript
import NexusWalletConnect from './path/to/loader.js';

// Detect installed wallets
const wallets = NexusWalletConnect.detectWallets();
console.log('Available wallets:', wallets);

// Connect to a wallet
const provider = await NexusWalletConnect.connect('UniSat');
console.log('Connected:', NexusWalletConnect.getState());

// Get balance
const balance = await NexusWalletConnect.getBalance();
console.log('Balance:', balance, 'BTC');
```

### Advanced Features
```javascript
// Xverse multi-address
if (walletType === 'Xverse') {
  const addresses = await NexusWalletConnect.getAddresses(['payment', 'ordinals']);
  console.log('Payment address:', addresses.find(a => a.purpose === 'payment').address);
}

// Get inscriptions with pagination
const inscriptions = await NexusWalletConnect.getInscriptions(0, 20);
console.log('First 20 inscriptions:', inscriptions);

// Sign and broadcast PSBT
const signedPsbt = await NexusWalletConnect.signPsbt(psbtHex);
const txId = await NexusWalletConnect.pushPsbt(signedPsbt);
console.log('Transaction ID:', txId);
```

### New Utility Functions
```javascript
// Get wallet capabilities
const capabilities = await NexusWalletConnect.getCapabilities();
console.log('Wallet features:', capabilities);

// Get UTXOs (unspent transaction outputs) - UniSat/Wizz only
const utxos = await NexusWalletConnect.getUtxos();
console.log('Available UTXOs:', utxos);

// Get BRC-20 token holdings
const brc20s = await NexusWalletConnect.getBRC20List();
console.log('BRC-20 tokens:', brc20s);

// Usage with OKX/UniSat for BRC-20 transfers
if (walletType === 'OKX' || walletType === 'UniSat') {
  const transferResult = await NexusWalletConnect.inscribeTransfer('ordi', '100');
  console.log('BRC-20 transfer inscription:', transferResult);
}
```

---

## 🛠️ Available Scripts

```bash
npm run dev                    # Development server
npm run build                  # Build production frontend
npm run build:core             # Build core library for inscription
npm run preview                # Preview built frontend
npm run prepare-inscriptions   # Generate inscription files
npm run fix-local-imports      # Fix import paths (if needed)
```

---

## ✅ What Was Cleaned

### Package.json Scripts
- ✅ Cleaned up to 6 essential scripts only
- ✅ Removed hardcoded Linux Node.js paths  
- ✅ Removed 14+ outdated/broken script variants
- ✅ Updated main entry point to `frontend/main.jsx`
- ✅ All scripts now use standard `vite` commands


## 📚 Documentation

All workflows are documented in this README.

For more details about the inscription process:
- Run `npm run prepare-inscriptions`
- Check `ready-to-inscribe/INSCRIPTION_GUIDE.md` (generated)
- Review `ready-to-inscribe/MANIFEST.json` (generated)

---

## 🚨 Important Notes

1. **Never edit generated files** in `ready-to-inscribe/`
2. **Always edit source files**:
   - `frontend/components/dev-loader-simple.js` (loader)
   - `inscriptions local/01-11` (providers)
3. **Regenerate when needed**: Just run `npm run prepare-inscriptions`
4. **No ordinals.com domain**: Uses `/r/sat/XXX/at/-1/content`

---
