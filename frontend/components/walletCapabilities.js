/**
 * Wallet Capabilities Reference
 * Tracks which features each Bitcoin wallet supports
 * Based on official wallet APIs and documentation
 */

export const WALLET_CAPABILITIES = {
  unisat: {
    name: 'UniSat',
    features: {
      connect: true,
      balance: true,
      inscriptions: true,
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: true,
      switchNetwork: true,
      getPublicKey: true,
      createInscription: false, // Not available in NexusWalletConnect wrapper
      pushPsbt: true,
      getAccounts: true,
      getUtxos: true, // ✅ CONFIRMED WORKING
      getBRC20List: true // ✅ CONFIRMED WORKING
    },
    inscriptionMethod: 'website', // Redirects to unisat.io for inscription creation
    inscriptionSupport: {
      contentTypes: ['brc20'], // Only BRC-20 transfers via API
      methods: {
        inscribeTransfer: true, // BRC-20 transfer inscription via API
        inscribe: 'website', // Other types via unisat.io
      },
      maxSize: 400000, // 400KB limit
      options: {
        feeRate: true,
        receiverAddress: true,
        devAddress: false,
        devFee: false
      }
    },
    notes: 'Full-featured wallet with comprehensive API support. Supports BIP322 message signing. Inscription creation NOT available in NexusWalletConnect wrapper - only BRC-20 transfers via API. For other inscription types (text, images, HTML), users must visit https://unisat.io/inscribe'
  },
  
  xverse: {
    name: 'Xverse',
    features: {
      connect: true,
      balance: true, // Supported via JSON-RPC 2.0 getBalance method
      inscriptions: true, // Via ord_getInscriptions
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: false,
      switchNetwork: false,
      getPublicKey: true, // Included in getAccounts
      createInscription: true, // Native via JWT token
      pushPsbt: 'auto-broadcast', // Can auto-broadcast during signing
      getAccounts: true,
      getUtxos: false, // ❌ NOT SUPPORTED - no UTXO access
      getBRC20List: false // ❌ NOT SUPPORTED - no BRC-20 listing
    },
    inscriptionMethod: 'native-jwt', // Uses JWT token with native provider
    inscriptionSupport: {
      contentTypes: ['text', 'image', 'json', 'html', 'brc20', 'audio', 'video', 'model'], // All types via base64
      methods: {
        createInscription: true, // Via window.XverseProviders.BitcoinProvider.createInscription()
      },
      maxSize: 400000, // 400KB recommended
      options: {
        feeRate: true,
        receiverAddress: false, // Uses ordinal address from wallet
        devAddress: true, // Service fee address
        devFee: true, // Service fee in sats
        appFee: true, // Application fee configuration
      },
      payloadTypes: ['PLAIN_TEXT', 'BASE_64'], // Encoding options
      tokenMethod: 'JWT' // Uses unsecured JWT tokens for API calls
    },
    externalApis: {},
    notes: 'Returns separate payment and ordinals addresses. Balance supported via JSON-RPC 2.0 getBalance() method. Inscriptions supported via ord_getInscriptions. Uses native createInscription() method with JWT tokens (no external dependencies). Full inscription support for all content types via PLAIN_TEXT and BASE_64 encoding.'
  },
  
  leather: {
    name: 'Leather (Hiro)',
    features: {
      connect: true,
      balance: false, // No balance API
      inscriptions: 'external', // Must use Hiro API
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: false,
      switchNetwork: false,
      getPublicKey: false,
      createInscription: false, // No native inscription support
      pushPsbt: true, // broadcastTransaction
      getAccounts: true,
      getUtxos: false, // ❌ NOT SUPPORTED - no UTXO access
      getBRC20List: false // ❌ NOT SUPPORTED - no BRC-20 listing
    },
    inscriptionMethod: 'none', // No direct inscription support
    inscriptionSupport: {
      contentTypes: [], // Must use external services
      methods: {},
      maxSize: 0,
      options: {}
    },
    notes: 'Requires external APIs for balance and inscriptions. Use Hiro Platform or other inscription services. Focuses on signing and transaction broadcast.'
  },
  
  okx: {
    name: 'OKX Wallet',
    features: {
      connect: true,
      balance: true,
      inscriptions: true,
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: true,
      switchNetwork: true,
      getPublicKey: true,
      createInscription: true, // Full inscription support
      pushPsbt: true,
      getAccounts: true,
      getUtxos: 'splitUtxo', // ⚠️ Uses splitUtxo() method instead of getUtxos()
      getBRC20List: false // ❌ NOT SUPPORTED - no BRC-20 listing
    },
    inscriptionMethod: 'native',
    inscriptionSupport: {
      contentTypes: ['brc20', 'text', 'image', 'json', 'html', 'audio', 'video'], // Extensive support
      methods: {
        mint: true, // General inscription creation
        inscribe: true, // BRC-20 inscription
        inscribeBRC20Transfer: true, // BRC-20 transfers
        inscribeBRC20Deploy: true, // BRC-20 deployment
      },
      maxSize: 400000, // 400KB
      options: {
        feeRate: true,
        receiverAddress: true,
        devAddress: true, // Service fee address
        devFee: true, // Service fee in BTC
        inscriptionType: true, // Type 51 (BRC-20), 61 (text), 62 (image/other)
      }
    },
    notes: 'Full-featured wallet similar to UniSat. Supports complete inscription creation with extensive BRC-20 support including deploy, mint, and transfer operations.'
  },
  
  magiceden: {
    name: 'Magic Eden',
    features: {
      connect: true,
      balance: false, // NOT SUPPORTED - Magic Eden API doesn't provide balance
      inscriptions: false, // NOT SUPPORTED - Magic Eden provider doesn't expose inscription data
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: true, // Returns "mainnet"
      switchNetwork: false,
      getPublicKey: false,
      createInscription: false, // No native inscription API
      pushPsbt: false,
      getAccounts: true,
      getUtxos: false, // ❌ NOT SUPPORTED - no UTXO access
      getBRC20List: false // ❌ NOT SUPPORTED - no BRC-20 listing
    },
    inscriptionMethod: 'none',
    inscriptionSupport: {
      contentTypes: [], // No native inscription support
      methods: {},
      maxSize: 0,
      options: {}
    },
    notes: 'Good support for core transaction features. Balance not available via API - use Magic Eden website. getInscriptions() is not supported by Magic Eden wallet provider - it returns empty data. No native inscription creation - users should use Magic Eden marketplace for inscriptions.'
  },
  
  wizz: {
    name: 'Wizz Wallet',
    features: {
      connect: true,
      balance: true,
      inscriptions: true,
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: true,
      switchNetwork: true,
      getPublicKey: true,
      createInscription: true, // Full inscription support
      pushPsbt: true,
      getAccounts: true,
      getUtxos: true, // ✅ CONFIRMED WORKING  
      getBRC20List: false // ❌ NOT SUPPORTED - no BRC-20 listing
    },
    inscriptionMethod: 'native',
    inscriptionSupport: {
      contentTypes: ['brc20', 'text', 'image', 'json', 'html', 'audio', 'video'], // Full support
      methods: {
        inscribe: true, // General inscription with type detection
      },
      maxSize: 400000, // 400KB
      options: {
        feeRate: true,
        receiverAddress: true,
        devAddress: true, // Service fee address
        devFee: true, // Service fee in sats
        inscriptionType: true, // Type 51 (BRC-20), 61 (text), 62 (image/other)
      }
    },
    notes: 'Full-featured wallet similar to UniSat. Supports BIP322 message signing and complete inscription creation with automatic content type detection.'
  },
  
  oyl: {
    name: 'Oyl Wallet',
    features: {
      connect: true,
      balance: true, // Returns simple number
      inscriptions: true,
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: false,
      switchNetwork: false,
      getPublicKey: false,
      createInscription: false, // No native inscription API
      pushPsbt: false,
      getAccounts: true,
      getUtxos: false, // ❌ NOT SUPPORTED - no UTXO access
      getBRC20List: false // ❌ NOT SUPPORTED - no BRC-20 listing
    },
    inscriptionMethod: 'none',
    inscriptionSupport: {
      contentTypes: [], // No native inscription support
      methods: {},
      maxSize: 0,
      options: {}
    },
    notes: 'Good support for core features. Balance returns satoshis as simple number. No native inscription creation API - use external services.'
  },
  
  phantom: {
    name: 'Phantom',
    features: {
      connect: true,
      balance: false, // NOT IMPLEMENTED - throws error "Phantom: getBalance not implemented"
      inscriptions: false, // NOT IMPLEMENTED - throws error "Phantom: getInscriptions not implemented"
      signPsbt: true,
      sendBitcoin: true,
      signMessage: true,
      getNetwork: false,
      switchNetwork: false,
      getPublicKey: true, // Included in requestAccounts
      createInscription: false, // No native inscription API
      pushPsbt: false,
      getAccounts: true,
      getUtxos: false, // ❌ NOT SUPPORTED - no UTXO access
      getBRC20List: false // ❌ NOT SUPPORTED - no BRC-20 listing
    },
    inscriptionMethod: 'none',
    inscriptionSupport: {
      contentTypes: [], // No native inscription support
      methods: {},
      maxSize: 0,
      options: {}
    },
    notes: 'Limited Bitcoin support - only connect, signing, and transactions. No balance or inscription APIs. Returns account objects with address and publicKey.'
  }
};

/**
 * Check if a wallet supports a specific feature
 * @param {string} walletType - Wallet type (unisat, xverse, etc.)
 * @param {string} feature - Feature to check (balance, inscriptions, etc.)
 * @returns {boolean|string} true if supported, false if not, or string for partial support
 */
export function checkWalletCapability(walletType, feature) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  if (!wallet) return false;
  
  return wallet.features[feature] || false;
}

/**
 * Get user-friendly message for unsupported features
 * @param {string} walletType - Wallet type
 * @param {string} feature - Feature that's not supported
 * @returns {string} User-friendly message
 */
export function getUnsupportedFeatureMessage(walletType, feature) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  if (!wallet) return `Unknown wallet: ${walletType}`;
  
  const capability = wallet.features[feature];
  
  if (capability === 'external') {
    return `${wallet.name} requires external APIs for ${feature}. This feature is available but may be slower.`;
  }
  
  if (capability === 'brc20-only') {
    return `${wallet.name} only supports BRC-20 ${feature}.`;
  }
  
  if (capability === 'auto-broadcast') {
    return `${wallet.name} uses auto-broadcast for ${feature}.`;
  }
  
  if (!capability) {
    return `${wallet.name} does not support ${feature} on-chain. Please use the wallet interface directly or switch to a different wallet.`;
  }
  
  return '';
}

/**
 * Get all wallets that support a specific feature
 * @param {string} feature - Feature to check
 * @returns {string[]} Array of wallet types that support this feature
 */
export function getWalletsThatSupport(feature) {
  return Object.keys(WALLET_CAPABILITIES).filter(walletType => {
    const capability = WALLET_CAPABILITIES[walletType].features[feature];
    return capability === true || (typeof capability === 'string');
  });
}

/**
 * Get wallet display name
 * @param {string} walletType - Wallet type
 * @returns {string} Display name
 */
export function getWalletDisplayName(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.name || walletType;
}

/**
 * Check if wallet needs external API for inscriptions
 * @param {string} walletType - Wallet type
 * @returns {boolean}
 */
export function needsExternalInscriptionAPI(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.inscriptionMethod === 'external';
}

/**
 * Get external API URLs for a wallet
 * @param {string} walletType - Wallet type
 * @returns {object|null} Object with API URLs or null
 */
export function getExternalApis(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.externalApis || null;
}

/**
 * Check if wallet supports inscription creation
 * @param {string} walletType - Wallet type
 * @returns {boolean}
 */
export function supportsInscriptionCreation(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.features.createInscription === true;
}

/**
 * Get supported content types for inscriptions
 * @param {string} walletType - Wallet type
 * @returns {string[]} Array of supported content types
 */
export function getInscriptionContentTypes(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.inscriptionSupport?.contentTypes || [];
}

/**
 * Check if wallet supports a specific content type
 * @param {string} walletType - Wallet type
 * @param {string} contentType - Content type (brc20, text, image, etc.)
 * @returns {boolean}
 */
export function supportsContentType(walletType, contentType) {
  const types = getInscriptionContentTypes(walletType);
  return types.includes(contentType);
}

/**
 * Get inscription options supported by wallet
 * @param {string} walletType - Wallet type
 * @returns {object} Object with supported options
 */
export function getInscriptionOptions(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.inscriptionSupport?.options || {};
}

/**
 * Get maximum inscription size for wallet
 * @param {string} walletType - Wallet type
 * @returns {number} Max size in bytes
 */
export function getMaxInscriptionSize(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.inscriptionSupport?.maxSize || 0;
}

/**
 * Get inscription method type
 * @param {string} walletType - Wallet type
 * @returns {string} Method type (native, sats-connect, none)
 */
export function getInscriptionMethod(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.inscriptionMethod || 'none';
}

/**
 * Get user-friendly inscription support message
 * @param {string} walletType - Wallet type
 * @returns {string} Message describing inscription support
 */
export function getInscriptionSupportMessage(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  if (!wallet) return `Unknown wallet: ${walletType}`;
  
  const method = wallet.inscriptionMethod;
  const contentTypes = wallet.inscriptionSupport?.contentTypes || [];
  
  if (method === 'none') {
    return `${wallet.name} does not support native inscription creation. Please use external services or the wallet's own interface.`;
  }
  
  if (method === 'website') {
    return `${wallet.name} supports BRC-20 inscriptions programmatically. For other types, please visit unisat.io.`;
  }
  
  if (method === 'native-jwt') {
    return `${wallet.name} supports inscription creation via native JWT token method (no external dependencies). Supported types: ${contentTypes.join(', ')}.`;
  }
  
  if (method === 'sats-connect') {
    return `${wallet.name} supports inscription creation via sats-connect library. Supported types: ${contentTypes.join(', ')}.`;
  }
  
  if (method === 'native') {
    return `${wallet.name} has full native inscription support. Supported types: ${contentTypes.join(', ')}.`;
  }
  
  return `${wallet.name} inscription support: ${method}`;
}

/**
 * Check if wallet requires JWT token for inscriptions
 * @param {string} walletType - Wallet type
 * @returns {boolean}
 */
export function usesJWTTokens(walletType) {
  const wallet = WALLET_CAPABILITIES[walletType?.toLowerCase()];
  return wallet?.inscriptionSupport?.tokenMethod === 'JWT';
}
