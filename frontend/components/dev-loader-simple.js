/**
 * NexusWalletConnect Loader - LOCAL DEVELOPMENT VERSION
 * 
 * Purpose: Simple loader using direct local imports (no dynamic loading)
 * Use: npm run dev:local
 * 
 * This version imports provider CLASSES that are already bundled/available.
 * For development, the providers should be loaded through the build process
 * or you can use the standalone HTML files for testing.
 * 
 * This is a STUB loader for API compatibility testing. The actual provider
 * classes need to be loaded separately (via script tags or bundle).
 */

// Import utility modules with relative imports
import * as NormalizerModule from '../../inscriptions local/02-normalizers.js';
import * as WalletConnectorModule from '../../inscriptions local/03-wallet-connector.js';

// Import provider classes from LOCAL DEVELOPMENT versions (with relative imports)
// The "inscriptions local/" folder contains versions for local development with relative imports
// Use "npm run prepare-inscriptions" to create inscription-ready files in "ready-to-inscribe/"
import { UniSatProvider } from '../../inscriptions local/04-unisat-provider.js';
import { XverseProvider } from '../../inscriptions local/05-xverse-provider.js';
import { OKXProvider } from '../../inscriptions local/06-okx-provider.js';
import { LeatherProvider } from '../../inscriptions local/07-leather-provider.js';
import { PhantomProvider } from '../../inscriptions local/08-phantom-provider.js';
import { WizzProvider } from '../../inscriptions local/09-wizz-provider.js';
import { MagicEdenProvider } from '../../inscriptions local/10-magiceden-provider.js';
import { OylProvider } from '../../inscriptions local/11-oyl-provider.js';

// ============================================
// UTILITY EXPORTS (for advanced usage)
// ============================================

/**
 * Load normalizer helpers (inscriptions, balances, etc.)
 * Dev version: Returns imported module directly
 * @returns {Promise<Object>} Normalizer module exports
 */
export async function loadNormalizers() {
  return {
    normalizeInscription: NormalizerModule.normalizeInscription,
    normalizeBalance: NormalizerModule.normalizeBalance,
    normalizers: NormalizerModule.normalizers || NormalizerModule.default,
    normalizePsbtOptions: NormalizerModule.normalizePsbtOptions,
    normalizeNetwork: NormalizerModule.normalizeNetwork,
    normalizeAddress: NormalizerModule.normalizeAddress
  };
}

/**
 * Load the wallet connector utility module
 * Dev version: Returns imported module directly
 * @returns {Promise<Object>} Wallet connector exports
 */
export async function loadWalletConnector() {
  return WalletConnectorModule;
}

// ============================================
// WALLET METADATA
// ============================================

const WALLET_INFO = {
  UniSat: {
    name: 'UniSat',
    detection: () => typeof window !== 'undefined' && typeof window.unisat !== 'undefined',
    downloadUrl: 'https://unisat.io',
    features: ['BRC-20', 'Runes', 'Inscriptions']
  },
  Xverse: {
    name: 'Xverse',
    detection: () => typeof window !== 'undefined' && (
      typeof window.BitcoinProvider !== 'undefined' || 
      typeof window.XverseProviders !== 'undefined'
    ),
    downloadUrl: 'https://www.xverse.app',
    features: ['Ordinals', 'Payment', 'Inscriptions']
  },
  OKX: {
    name: 'OKX',
    detection: () => typeof window !== 'undefined' && typeof window.okxwallet?.bitcoin !== 'undefined',
    downloadUrl: 'https://www.okx.com/web3',
    features: ['BRC-20', 'Inscriptions']
  },
  Leather: {
    name: 'Leather',
    detection: () => {
      try {
        if (typeof window === 'undefined') return false;
        
        // Simple check - just look for the provider objects
        // Leather can be in btc_providers array OR window.LeatherProvider
        if (window.btc_providers && Array.isArray(window.btc_providers)) {
          const hasLeather = window.btc_providers.some(entry => 
            entry.id === 'LeatherProvider' || 
            entry.name === 'Leather' ||
            (entry.provider && entry.provider.isLeather)
          );
          if (hasLeather) {
            console.log('✅ Leather found in btc_providers array');
            return true;
          }
        }
        
        // Fallback: Check window directly (like wallet-diagnostics.html)
        const hasWindowLeather = !!(window.LeatherProvider || window.HiroWalletProvider);
        if (hasWindowLeather) {
          console.log('✅ Leather found in window object');
        }
        return hasWindowLeather;
      } catch (error) {
        console.warn('⚠️ Leather detection error:', error);
        return false;
      }
    },
    downloadUrl: 'https://leather.io',
    features: ['Stacks', 'Bitcoin']
  },
  Phantom: {
    name: 'Phantom',
    detection: () => typeof window !== 'undefined' && typeof window.phantom?.bitcoin !== 'undefined',
    downloadUrl: 'https://phantom.app',
    features: ['Limited Bitcoin Support']
  },
  Wizz: {
    name: 'Wizz',
    detection: () => typeof window !== 'undefined' && typeof window.wizz !== 'undefined',
    downloadUrl: 'https://wizzwallet.io',
    features: ['BRC-20', 'ARC-20', 'Atomicals', 'Runes']
  },
  MagicEden: {
    name: 'MagicEden',
    detection: () => typeof window !== 'undefined' && typeof window.magicEden?.bitcoin?.isMagicEden !== 'undefined',
    downloadUrl: 'https://wallet.magiceden.io',
    features: ['NFTs', 'Bitcoin']
  },
  Oyl: {
    name: 'Oyl',
    detection: () => typeof window !== 'undefined' && typeof window.oyl !== 'undefined',
    downloadUrl: 'https://oyl.io',
    features: ['Taproot', 'SegWit']
  }
};

// Provider class mapping
const PROVIDER_CLASSES = {
  UniSat: UniSatProvider,
  Xverse: XverseProvider,
  OKX: OKXProvider,
  Leather: LeatherProvider,
  Phantom: PhantomProvider,
  Wizz: WizzProvider,
  MagicEden: MagicEdenProvider,
  Oyl: OylProvider
};

// ============================================
// STATE MANAGEMENT
// ============================================

let currentState = {
  isConnected: false,
  walletType: null,
  address: null,
  publicKey: null,
  balance: null,
  provider: null
};

const subscribers = new Set();

function setState(newState) {
  currentState = { ...currentState, ...newState };
  subscribers.forEach(callback => callback(currentState));
}

/**
 * Get current wallet state
 * @returns {Object} Current state
 */
export function getState() {
  return { ...currentState };
}

/**
 * Subscribe to state changes
 * @param {Function} callback - Called when state changes
 * @returns {Function} Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

/**
 * Get current connected provider
 * @returns {Object|null} Current provider instance
 */
export function getCurrentProvider() {
  return currentState.provider;
}

/**
 * Disconnect current wallet
 */
export async function disconnect() {
  if (currentState.provider) {
    try {
      await currentState.provider.disconnect();
    } catch (error) {
      console.warn('Disconnect failed:', error);
    }
  }
  
  setState({
    isConnected: false,
    walletType: null,
    address: null,
    publicKey: null,
    balance: null,
    provider: null
  });
}

/**
 * Get current balance
 * @returns {Promise<Object>} Balance
 */
export async function getBalance() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  const balanceData = await currentState.provider.getBalance();
  
  // Convert balance to BTC number
  // Providers return either a number or {confirmed, unconfirmed, total} object
  let balanceInBTC;
  if (typeof balanceData === 'number') {
    // Check if already in BTC format (small decimal < 1) or satoshis (large number)
    if (balanceData < 1 && balanceData > 0) {
      // Already in BTC (e.g., 0.0000369 from Xverse)
      balanceInBTC = balanceData;
    } else {
      // In satoshis (e.g., 3690 from UniSat)
      balanceInBTC = balanceData / 100000000;
    }
  } else if (balanceData && typeof balanceData === 'object') {
    const totalSats = balanceData.total || balanceData.confirmed || 0;
    balanceInBTC = totalSats / 100000000; // satoshis to BTC
  } else {
    balanceInBTC = 0;
  }
  
  setState({ balance: balanceInBTC });
  return balanceInBTC;
}

/**
 * Get inscriptions
 * @returns {Promise<Array>} Inscriptions
 */
export async function getInscriptions(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  const result = await currentState.provider.getInscriptions(...args);
  
  // Normalize response - some wallets return {list, total}, others return array directly
  if (result && typeof result === 'object' && Array.isArray(result.list)) {
    return result.list; // Return just the list array
  }
  
  if (Array.isArray(result)) {
    return result; // Already an array
  }
  
  return []; // Fallback to empty array
}

/**
 * Get all inscriptions (with pagination)
 * @returns {Promise<Array>} All inscriptions
 */
export async function getAllInscriptions() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.getAllInscriptions();
}

/**
 * Sign a message
 * @returns {Promise<string>} Signature
 */
export async function signMessage(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.signMessage(...args);
}

/**
 * Sign a PSBT
 * @returns {Promise<string>} Signed PSBT
 */
export async function signPsbt(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.signPsbt(...args);
}

/**
 * Sign multiple PSBTs
 * @returns {Promise<Array>} Signed PSBTs
 */
export async function signPsbts(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.signPsbts(...args);
}

/**
 * Send Bitcoin
 * @returns {Promise<string>} Transaction ID
 */
export async function sendBitcoin(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.sendBitcoin(...args);
}

/**
 * Send BTC (alias for sendBitcoin)
 * @returns {Promise<string>} Transaction ID
 */
export async function sendBTC(...args) {
  return await sendBitcoin(...args);
}

/**
 * Get network
 * @returns {Promise<string>} Network name
 */
export async function getNetwork() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.getNetwork();
}

/**
 * Switch network
 * @returns {Promise<void>}
 */
export async function switchNetwork(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.switchNetwork(...args);
}

/**
 * Get public key
 * @returns {Promise<string>} Public key
 */
export async function getPublicKey() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.getPublicKey();
}

/**
 * Get address
 * @returns {Promise<string>} Address
 */
export async function getAddress() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.getAddress();
}

/**
 * Get accounts
 * @returns {Promise<Array>} Accounts
 */
export async function getAccounts() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.getAccounts();
}

/**
 * Push PSBT
 * @returns {Promise<string>} Transaction ID
 */
export async function pushPsbt(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.pushPsbt(...args);
}

/**
 * Push transaction
 * @returns {Promise<string>} Transaction ID
 */
export async function pushTx(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.pushTx(...args);
}

/**
 * Send inscription
 * @returns {Promise<string>} Transaction ID
 */
export async function sendInscription(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.sendInscription(...args);
}

/**
 * Inscribe content
 * @returns {Promise<Object>} Inscription result
 */
export async function inscribe(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.inscribe(...args);
}

/**
 * Send Runes
 * @returns {Promise<string>} Transaction ID
 */
export async function sendRunes(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return await currentState.provider.sendRunes(...args);
}

/**
 * Get wallet info (features, capabilities)
 * @returns {Object} Wallet info
 */
export function getWalletFeatures() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  return currentState.provider.getInfo();
}

// ============================================
// XVERSE-SPECIFIC METHODS
// ============================================

/**
 * Get Xverse addresses (payment + ordinals)
 * @param {Array<string>} purposes - ['payment', 'ordinals', 'stacks']
 * @returns {Promise<Array>} Addresses with purposes
 */
export async function getAddresses(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.getAddresses !== 'function') {
    throw new Error(`${currentState.walletType} does not support getAddresses()`);
  }
  
  return await currentState.provider.getAddresses(...args);
}

/**
 * Create repeat inscriptions (Xverse batch inscribe)
 * @param {Object} payload - Inscription data with repeat count
 * @returns {Promise<Object>} Batch inscription result
 */
export async function createRepeatInscriptions(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.createRepeatInscriptions !== 'function') {
    throw new Error(`${currentState.walletType} does not support batch inscriptions`);
  }
  
  return await currentState.provider.createRepeatInscriptions(...args);
}

/**
 * Send inscriptions (Xverse)
 * @param {Object} params - Inscription IDs and recipient
 * @returns {Promise<string>} Transaction ID
 */
export async function sendInscriptions(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.sendInscriptions !== 'function') {
    throw new Error(`${currentState.walletType} does not support sendInscriptions()`);
  }
  
  return await currentState.provider.sendInscriptions(...args);
}

/**
 * Get Runes balance (Xverse)
 * @returns {Promise<Object>} Runes balance
 */
export async function getRunesBalance() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.getRunesBalance !== 'function') {
    throw new Error(`${currentState.walletType} does not support Runes`);
  }
  
  return await currentState.provider.getRunesBalance();
}

/**
 * Transfer Runes (Xverse)
 * @param {Object} params - {recipient, runeName, amount}
 * @returns {Promise<Object>} Transfer result
 */
export async function transferRunes(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.transferRunes !== 'function') {
    throw new Error(`${currentState.walletType} does not support Runes transfer`);
  }
  
  return await currentState.provider.transferRunes(...args);
}

/**
 * Mint Runes (Xverse)
 * @param {Object} params - {runeName}
 * @returns {Promise<Object>} Mint result
 */
export async function mintRunes(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.mintRunes !== 'function') {
    throw new Error(`${currentState.walletType} does not support Runes minting`);
  }
  
  return await currentState.provider.mintRunes(...args);
}

/**
 * Etch Runes (Create new Rune) (Xverse)
 * @param {Object} params - {runeName, symbol, divisibility, premine, turbo}
 * @returns {Promise<Object>} Etch result
 */
export async function etchRunes(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.etchRunes !== 'function') {
    throw new Error(`${currentState.walletType} does not support Runes etching`);
  }
  
  return await currentState.provider.etchRunes(...args);
}

/**
 * Get Runes order status (Xverse)
 * @param {string} orderId - Order ID from mint/etch
 * @returns {Promise<Object>} Order status
 */
export async function getRunesOrder(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.getRunesOrder !== 'function') {
    throw new Error(`${currentState.walletType} does not support getRunesOrder()`);
  }
  
  return await currentState.provider.getRunesOrder(...args);
}

/**
 * Sign multiple transactions (Xverse, MagicEden)
 * @param {Array} psbts - Array of PSBTs
 * @returns {Promise<Array>} Signed PSBTs
 */
export async function signMultipleTransactions(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.signMultipleTransactions !== 'function') {
    throw new Error(`${currentState.walletType} does not support signMultipleTransactions()`);
  }
  
  return await currentState.provider.signMultipleTransactions(...args);
}

/**
 * Create inscription (Xverse, OKX)
 * @param {Object} data - Inscription data
 * @returns {Promise<Object>} Inscription result
 */
export async function createInscription(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.createInscription !== 'function') {
    throw new Error(`${currentState.walletType} does not support createInscription()`);
  }
  
  return await currentState.provider.createInscription(...args);
}

// ============================================
// LEATHER-SPECIFIC METHODS (Stacks Wallet)
// ============================================

/**
 * Get Leather product info
 * @returns {Promise<Object>} Product information
 */
export async function getProductInfo() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.getProductInfo !== 'function') {
    throw new Error(`${currentState.walletType} does not support getProductInfo() (Leather only)`);
  }
  
  return await currentState.provider.getProductInfo();
}

/**
 * Get Leather wallet URL
 * @returns {Promise<string>} Wallet URL
 */
export async function getURL() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.getURL !== 'function') {
    throw new Error(`${currentState.walletType} does not support getURL() (Leather only)`);
  }
  
  return await currentState.provider.getURL();
}

/**
 * Sign structured data (Leather)
 * @param {Object} data - Structured data to sign
 * @returns {Promise<Object>} Signature
 */
export async function signStructuredData(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.signStructuredData !== 'function') {
    throw new Error(`${currentState.walletType} does not support signStructuredData() (Leather only)`);
  }
  
  return await currentState.provider.signStructuredData(...args);
}

/**
 * Authenticate with Leather wallet
 * @param {Object} options - Auth options
 * @returns {Promise<Object>} Auth result
 */
export async function authenticate(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.authenticate !== 'function') {
    throw new Error(`${currentState.walletType} does not support authenticate() (Leather only)`);
  }
  
  return await currentState.provider.authenticate(...args);
}

/**
 * Send Stacks transaction (Leather)
 * @param {Object} txOptions - Transaction options
 * @returns {Promise<Object>} Transaction result
 */
export async function sendStacksTransaction(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.sendStacksTransaction !== 'function') {
    throw new Error(`${currentState.walletType} does not support Stacks transactions (Leather only)`);
  }
  
  return await currentState.provider.sendStacksTransaction(...args);
}

/**
 * Update profile (Leather)
 * @param {Object} profileData - Profile data
 * @returns {Promise<Object>} Update result
 */
export async function updateProfile(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.updateProfile !== 'function') {
    throw new Error(`${currentState.walletType} does not support updateProfile() (Leather only)`);
  }
  
  return await currentState.provider.updateProfile(...args);
}

// ============================================
// MAGIC EDEN-SPECIFIC METHODS
// ============================================

/**
 * Check if wallet is hardware (MagicEden)
 * @returns {Promise<boolean>} Is hardware wallet
 */
export async function isHardware() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.isHardware !== 'function') {
    throw new Error(`${currentState.walletType} does not support isHardware() (MagicEden only)`);
  }
  
  return await currentState.provider.isHardware();
}

/**
 * Call MagicEden RPC method
 * @param {string} method - Method name
 * @param {Object} params - Parameters
 * @returns {Promise<*>} Result
 */
export async function call(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.call !== 'function') {
    throw new Error(`${currentState.walletType} does not support call() (MagicEden only)`);
  }
  
  return await currentState.provider.call(...args);
}

// ============================================
// OKX-SPECIFIC METHODS
// ============================================

/**
 * Inscribe transfer (OKX, UniSat)
 * @param {string} ticker - Token ticker
 * @param {number} amount - Amount
 * @returns {Promise<Object>} Inscription result
 */
export async function inscribeTransfer(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.inscribeTransfer !== 'function') {
    throw new Error(`${currentState.walletType} does not support inscribeTransfer()`);
  }
  
  return await currentState.provider.inscribeTransfer(...args);
}

/**
 * Split UTXO (OKX)
 * @param {Object} options - Split options
 * @returns {Promise<string>} Transaction ID
 */
export async function splitUtxo(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.splitUtxo !== 'function') {
    throw new Error(`${currentState.walletType} does not support splitUtxo() (OKX only)`);
  }
  
  return await currentState.provider.splitUtxo(...args);
}

/**
 * Transfer NFT (OKX)
 * @param {Object} options - {to, inscriptionId}
 * @returns {Promise<string>} Transaction ID
 */
export async function transferNft(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.transferNft !== 'function') {
    throw new Error(`${currentState.walletType} does not support transferNft() (OKX only)`);
  }
  
  return await currentState.provider.transferNft(...args);
}

/**
 * Watch asset (OKX)
 * @param {Object} asset - Asset to watch
 * @returns {Promise<boolean>} Success
 */
export async function watchAsset(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.watchAsset !== 'function') {
    throw new Error(`${currentState.walletType} does not support watchAsset() (OKX only)`);
  }
  
  return await currentState.provider.watchAsset(...args);
}

/**
 * Mint (OKX)
 * @param {Object} mintData - Mint parameters
 * @returns {Promise<Object>} Mint result
 */
export async function mint(...args) {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.mint !== 'function') {
    throw new Error(`${currentState.walletType} does not support mint() (OKX only)`);
  }
  
  return await currentState.provider.mint(...args);
}

// ============================================
// ADDITIONAL UTILITY METHODS
// ============================================

/**
 * Get wallet capabilities (Xverse)
 */
export async function getCapabilities() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.getCapabilities !== 'function') {
    throw new Error(`${currentState.walletType} does not support getCapabilities()`);
  }
  
  return await currentState.provider.getCapabilities();
}

/**
 * Get UTXOs (UniSat, Wizz - CONFIRMED WORKING. OKX - has splitUtxo() method only)
 * Note: Xverse and other wallets do not support UTXO fetching
 * OKX uses splitUtxo() method instead of getUtxos() - different API pattern
 */
export async function getUtxos() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  console.log(`🔍 getUtxos: Checking ${currentState.walletType} provider capabilities...`);
  console.log(`  - hasGetUtxos: ${typeof currentState.provider.getUtxos === 'function'}`);
  console.log(`  - hasGetBitcoinUtxos: ${typeof currentState.provider.getBitcoinUtxos === 'function'}`);
  console.log(`  - hasSplitUtxo: ${typeof currentState.provider.splitUtxo === 'function'}`);
  
  if (typeof currentState.provider.getUtxos !== 'function' && 
      typeof currentState.provider.getBitcoinUtxos !== 'function' &&
      typeof currentState.provider.splitUtxo !== 'function') {
    throw new Error(`${currentState.walletType} does not support UTXO fetching. Only UniSat and Wizz provide confirmed UTXO access. OKX has splitUtxo() method with different API.`);
  }
  
  let result;
  if (typeof currentState.provider.getUtxos === 'function') {
    result = await currentState.provider.getUtxos();
  } else if (typeof currentState.provider.getBitcoinUtxos === 'function') {
    result = await currentState.provider.getBitcoinUtxos();
  } else if (typeof currentState.provider.splitUtxo === 'function') {
    // OKX specific: splitUtxo returns { utxos: [...] }
    console.log('🔍 Using OKX splitUtxo method for UTXO access...');
    const splitResult = await currentState.provider.splitUtxo({
      from: currentState.address,
      amount: 2
    });
    result = splitResult.utxos || [];
  }
    
  console.log(`✅ getUtxos result:`, result);
  return result;
}

/**
 * Get BRC-20 list (UniSat only - CONFIRMED WORKING)
 */
export async function getBRC20List() {
  if (!currentState.provider) {
    throw new Error('No wallet connected');
  }
  
  if (typeof currentState.provider.getBRC20List !== 'function' &&
      typeof currentState.provider.getBRC20Summary !== 'function') {
    throw new Error(`${currentState.walletType} does not support BRC-20 listing. Only UniSat provides BRC-20 token listing.`);
  }
  
  return typeof currentState.provider.getBRC20List === 'function'
    ? await currentState.provider.getBRC20List()
    : await currentState.provider.getBRC20Summary();
}

// ============================================
// WALLET FACTORY & API
// ============================================

/**
 * Create a wallet provider instance
 * @param {string} walletName - Name of the wallet
 * @returns {Object} Wallet provider instance
 */
export function createProvider(walletName) {
  const ProviderClass = PROVIDER_CLASSES[walletName];
  
  if (!ProviderClass) {
    throw new Error(`Unknown wallet: ${walletName}`);
  }
  
  const provider = new ProviderClass();
  
  if (!provider.isInstalled()) {
    const info = WALLET_INFO[walletName];
    throw new Error(
      `${walletName} wallet is not installed.\n\n` +
      `Download: ${info?.downloadUrl || 'Visit wallet website'}`
    );
  }
  
  return provider;
}

/**
 * Detect installed wallets
 * @returns {Array<Object>} Array of {name, info} for installed wallets
 */
export function detectWallets() {
  // Debug: Log Leather-related objects
  console.log('🔍 Checking for Leather wallet...');
  console.log('  - window.LeatherProvider:', typeof window.LeatherProvider);
  console.log('  - window.HiroWalletProvider:', typeof window.HiroWalletProvider);
  console.log('  - window.btc_providers:', window.btc_providers);
  
  const installed = [];
  
  for (const [name, info] of Object.entries(WALLET_INFO)) {
    if (info.detection && info.detection()) {
      installed.push({
        name,
        ...info
      });
    }
  }
  
  console.log(`✅ Found ${installed.length} installed wallets:`, installed.map(w => w.name));
  return installed;
}

/**
 * Connect to a wallet
 * @param {string} walletName - Name of wallet to connect
 * @returns {Promise<Object>} Connected provider instance
 */
export async function connect(walletName) {
  console.log(`🔌 Connecting to ${walletName}...`);
  
  const provider = createProvider(walletName);
  
  try {
    const result = await provider.connect();
    
    // Update state
    setState({
      isConnected: true,
      walletType: walletName,
      address: result.address || provider.address,
      publicKey: result.publicKey || provider.publicKey,
      provider: provider
    });
    
    console.log(`✅ Connected to ${walletName}`);
    
    // Auto-fetch balance after connecting
    try {
      const balanceData = await provider.getBalance();
      
      // Convert balance to BTC number
      let balanceInBTC;
      let totalSats = 0;
      if (typeof balanceData === 'number') {
        // Check if already in BTC format (small decimal < 1) or satoshis (large number)
        if (balanceData < 1 && balanceData > 0) {
          // Already in BTC (e.g., 0.0000369 from Xverse)
          balanceInBTC = balanceData;
          totalSats = Math.round(balanceData * 100000000);
        } else {
          // In satoshis (e.g., 3690 from UniSat)
          totalSats = balanceData;
          balanceInBTC = balanceData / 100000000;
        }
      } else if (balanceData && typeof balanceData === 'object') {
        totalSats = balanceData.total || balanceData.confirmed || 0;
        balanceInBTC = totalSats / 100000000; // satoshis to BTC
      } else {
        balanceInBTC = 0;
      }
      
      setState({ balance: balanceInBTC });
      console.log(`💰 Balance fetched: ${balanceInBTC} BTC (${totalSats} sats)`);
    } catch (balanceError) {
      console.warn(`⚠️ Could not fetch balance:`, balanceError.message);
      setState({ balance: null });
    }
    
    return provider;
  } catch (error) {
    console.error(`❌ Failed to connect to ${walletName}:`, error);
    throw error;
  }
}

/**
 * Get wallet information
 * @param {string} walletName - Name of wallet
 * @returns {Object} Wallet info
 */
export function getWalletInfo(walletName) {
  return WALLET_INFO[walletName] || null;
}

/**
 * Get all wallet information
 * @returns {Object} All wallet info
 */
export function getAllWalletInfo() {
  return { ...WALLET_INFO };
}

// Export everything as default too
export default {
  // Core functions
  createProvider,
  detectWallets,
  connect,
  disconnect,
  getState,
  subscribe,
  getCurrentProvider,
  getWalletInfo,
  getAllWalletInfo,
  
  // Utility functions for advanced usage
  loadNormalizers,
  loadWalletConnector,
  
  // Generic wallet methods - direct passthrough to provider
  getBalance,
  getInscriptions,
  getAllInscriptions,
  signMessage,
  signPsbt,
  signPsbts,
  sendBitcoin,
  sendBTC,  // Alias for sendBitcoin
  getNetwork,
  switchNetwork,
  getPublicKey,
  getAddress,
  getAccounts,
  pushPsbt,
  pushTx,
  sendInscription,
  inscribe,
  sendRunes,
  getWalletFeatures,
  
  // Xverse-specific methods
  getAddresses,
  createRepeatInscriptions,
  sendInscriptions,
  getRunesBalance,
  transferRunes,
  mintRunes,
  etchRunes,
  getRunesOrder,
  signMultipleTransactions,
  createInscription,
  
  // Leather-specific methods
  getProductInfo,
  getURL,
  signStructuredData,
  authenticate,
  sendStacksTransaction,
  updateProfile,
  
  // MagicEden-specific methods
  isHardware,
  call,
  
  // OKX-specific methods
  inscribeTransfer,
  splitUtxo,
  transferNft,
  watchAsset,
  mint,
  
  // Additional utility methods
  getCapabilities,
  getUtxos,
  getBRC20List,
  
  // Reference
  WALLET_INFO
};
