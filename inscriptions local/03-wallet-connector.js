/**
 * WalletConnector - Generic Connection Module
 * Inscription Module #3 - Connection Layer
 * 
 * Purpose: Generic Bitcoin wallet detection and connection
 * Dependencies: None (utility)
 * Exports: Connection helper functions
 * Size: ~400 lines, ~8KB brotli
 * 
 * Handles unique connection patterns for:
 * - Xverse/Leather: btc_providers array detection + JSON-RPC request()
 * - Magic Eden: Direct connect() method with JWT tokens
 * - Generic fallback: window.BitcoinProvider
 * 
 * Update this module to add support for new wallet connection patterns
 */

// ============= CONSTANTS =============

export const AddressPurpose = {
  Payment: 'payment',
  Ordinals: 'ordinals',
  Stacks: 'stacks'
};

export const BitcoinNetworkType = {
  Mainnet: 'Mainnet',
  Testnet: 'Testnet'
};

// ============= HELPER FUNCTIONS =============

/**
 * Extract actual provider object from btc_providers entry
 * Different wallets structure their entries differently
 */
function extractProviderFromEntry(entry) {
  if (!entry) return null;
  
  // Direct request method on entry
  if (typeof entry.request === 'function') {
    return entry;
  }
  
  // Provider in nested property
  if (entry.provider && typeof entry.provider.request === 'function') {
    return entry.provider;
  }
  
  // Wallet connector namespace (Xverse uses this)
  const ns = 'sats-connect:';
  if (entry.features?.[ns]?.provider) {
    const provider = entry.features[ns].provider;
    if (typeof provider.request === 'function') {
      return provider;
    }
  }
  
  return null;
}

/**
 * Create unsecured JWT token for Bitcoin wallet API requests
 * Used by: Magic Eden, Xverse, and other wallets that follow sats-connect pattern
 * Format: {typ: 'JWT', alg: 'none'}.{payload}.
 * 
 * This creates an unsecured JWT token with base64url encoding.
 * The token format is: header.payload. (note the trailing dot)
 * 
 * @param {Object} payload - The payload to encode in the token
 * @returns {string} JWT token string
 */
export function createUnsecuredToken(payload) {
  const header = { typ: 'JWT', alg: 'none' };
  
  const base64url = (str) => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };
  
  return `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}.`;
}

/**
 * @deprecated Use createUnsecuredToken instead
 * Kept for backwards compatibility
 */
export function createMagicEdenToken(payload) {
  return createUnsecuredToken(payload);
}

// ============= GET PROVIDER =============

/**
 * Get Bitcoin provider from various possible locations
 * Checks multiple injection points to find the active wallet
 * @returns {Object|null}
 */
export function getBitcoinProvider() {
  if (typeof window === 'undefined') return null;
  
  // Priority 1: Check btc_providers array (Xverse, Leather register here)
  if (window.btc_providers && Array.isArray(window.btc_providers) && window.btc_providers.length > 0) {
    // Try each provider in order (most recent wins)
    for (const entry of window.btc_providers) {
      const provider = extractProviderFromEntry(entry);
      if (provider) {
        console.log(`✅ Found Bitcoin provider: ${entry.name || entry.id}`);
        return provider;
      }
    }
  }
  
  // Priority 2: Check Magic Eden (uses direct connect(), not in btc_providers)
  if (window.magicEden?.bitcoin?.isMagicEden) {
    console.log('✅ Using window.magicEden.bitcoin (Magic Eden)');
    return window.magicEden.bitcoin;
  }
  
  // Priority 3: Direct window.BitcoinProvider (fallback)
  if (window.BitcoinProvider && typeof window.BitcoinProvider.request === 'function') {
    console.log('✅ Using window.BitcoinProvider');
    return window.BitcoinProvider;
  }
  
  // Priority 4: Xverse-specific location (legacy)
  if (window.XverseProviders?.BitcoinProvider) {
    console.log('✅ Using window.XverseProviders.BitcoinProvider');
    return window.XverseProviders.BitcoinProvider;
  }
  
  console.warn('❌ No Bitcoin wallet provider found');
  return null;
}

// ============= ADDRESS METHODS =============

/**
 * Get addresses from wallet
 * @param {Object} options
 * @param {Array<string>} options.purposes - Array of address purposes
 * @param {string} [options.message] - Message to display
 * @returns {Promise<Array>} Array of addresses
 */
export async function getAddresses({ purposes, message }) {
  const provider = getBitcoinProvider();
  
  if (!provider) {
    throw new Error('No Bitcoin wallet found. Install Xverse, Leather, or Magic Eden.');
  }
  
  // Check if this is Magic Eden (uses direct connect() with JWT)
  if (window.magicEden?.bitcoin && provider === window.magicEden.bitcoin) {
    console.log('🔍 Using Magic Eden direct connect()...');
    return await connectMagicEden(purposes, message);
  }
  
  // For all other wallets, try multiple method names (different wallets use different ones)
  const methodNames = ['wallet_connect', 'getAddresses'];
  let lastError = null;
  
  for (const methodName of methodNames) {
    try {
      console.log(`🔍 Trying ${methodName}...`);
      
      const response = await provider.request(methodName, {
        purposes: purposes || [AddressPurpose.Payment, AddressPurpose.Ordinals],
        message: message || 'Connect to view your Bitcoin addresses'
      });
      
      console.log(`✅ ${methodName} response:`, response);
      
      // Handle different response formats
      if (response?.status === 'success') {
        return response.result.addresses || response.result;
      } else if (response?.status === 'error') {
        throw new Error(response.error?.message || 'Failed to get addresses');
      } else if (response?.result?.addresses) {
        return response.result.addresses;
      } else if (response?.addresses) {
        return response.addresses;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      // If we got a response but it's not in expected format, try next method
      console.warn(`⚠️ ${methodName} returned unexpected format, trying next method...`);
      lastError = new Error(`${methodName} returned unexpected format`);
      
    } catch (error) {
      console.warn(`⚠️ ${methodName} failed:`, error.message);
      lastError = error;
      // Try next method
    }
  }
  
  // All methods failed
  throw lastError || new Error('Failed to get addresses from wallet');
}

/**
 * Helper: Connect to Magic Eden using direct connect() method with JWT token
 */
async function connectMagicEden(purposes, message) {
  const provider = window.magicEden.bitcoin;
  
  // Create JWT token (Magic Eden requires this format)
  const payload = {
    purposes: purposes || ['payment', 'ordinals'],
    message: message || 'Connect to view your Bitcoin addresses',
    network: { type: 'Mainnet' }
  };
  
  const token = createUnsecuredToken(payload);
  
  console.log('🔍 Calling Magic Eden connect() with JWT token...');
  const response = await provider.connect(token);
  
  console.log('✅ Magic Eden response:', response);
  
  // Magic Eden returns {addresses: [...]}
  if (response?.addresses && Array.isArray(response.addresses)) {
    return response.addresses;
  }
  
  throw new Error('Invalid response from Magic Eden');
}

// ============= SIGNING =============

/**
 * Sign a message
 * @param {Object} options
 * @param {string} options.address - Address to sign with
 * @param {string} options.message - Message to sign
 * @param {string} [options.protocol] - 'BIP322' or 'ECDSA'
 * @returns {Promise<string>} Signature
 */
export async function signMessage({ address, message, protocol = 'BIP322' }) {
  const provider = getBitcoinProvider();
  
  if (!provider) {
    throw new Error('No Bitcoin wallet found');
  }
  
  const response = await provider.request('signMessage', {
    address,
    message,
    protocol
  });
  
  if (response.status === 'success') {
    return response.result.signature || response.result;
  } else if (response.status === 'error') {
    throw new Error(response.error?.message || 'Failed to sign message');
  }
  
  return response;
}

/**
 * Sign PSBT
 * @param {Object} options
 * @param {string} options.psbtBase64 - Base64 PSBT
 * @param {Array} options.inputsToSign - Inputs to sign
 * @param {boolean} [options.broadcast] - Broadcast after signing
 * @returns {Promise<Object>} Signed PSBT
 */
export async function signPsbt({ psbtBase64, inputsToSign, broadcast = false }) {
  const provider = getBitcoinProvider();
  
  if (!provider) {
    throw new Error('No Bitcoin wallet found');
  }
  
  const response = await provider.request('signPsbt', {
    psbt: {
      psbtBase64,
      inputsToSign,
      broadcast
    }
  });
  
  if (response.status === 'success') {
    return {
      psbtBase64: response.result.psbtBase64 || response.result,
      txid: response.result.txid
    };
  } else if (response.status === 'error') {
    throw new Error(response.error?.message || 'Failed to sign PSBT');
  }
  
  return response;
}

// ============= TRANSFERS =============

/**
 * Send Bitcoin
 * @param {Object} options
 * @param {Array} options.recipients - Recipients array
 * @returns {Promise<string>} Transaction ID
 */
export async function sendTransfer({ recipients }) {
  const provider = getBitcoinProvider();
  
  if (!provider) {
    throw new Error('No Bitcoin wallet found');
  }
  
  const response = await provider.request('sendTransfer', { recipients });
  
  if (response.status === 'success') {
    return response.result.txid || response.result;
  } else if (response.status === 'error') {
    throw new Error(response.error?.message || 'Failed to send transfer');
  }
  
  return response;
}

// ============= INSCRIPTIONS =============

/**
 * Get inscriptions
 * @param {Object} options
 * @param {number} [options.offset]
 * @param {number} [options.limit]
 * @returns {Promise<Array>} Inscriptions
 */
export async function getInscriptions({ offset = 0, limit = 100 }) {
  const provider = getBitcoinProvider();
  
  if (!provider) {
    throw new Error('No Bitcoin wallet found');
  }
  
  try {
    const response = await provider.request('ord_getInscriptions', {
      offset,
      limit
    });
    
    if (response.status === 'success') {
      return response.result.inscriptions || response.result.list || response.result || [];
    }
  } catch (error) {
    console.warn('Inscriptions not supported:', error.message);
    return [];
  }
  
  return [];
}

// ============= BALANCE =============

/**
 * Get balance from wallet
 * @param {Object} [options] - Options (currently unused as sats-connect auto-uses payment address)
 * @returns {Promise<{confirmed: string, unconfirmed: string, total: string}>} Balance in satoshis
 */
export async function getBalance(options = {}) {
  const provider = getBitcoinProvider();
  
  if (!provider) {
    throw new Error('No Bitcoin wallet found');
  }
  
  try {
    // Use getBalance method via sats-connect request pattern
    // According to sats-connect spec: request('getBalance', undefined)
    // The wallet automatically returns balance for the connected payment address
    const response = await provider.request('getBalance', undefined);
    
    // Handle both JSON-RPC 2.0 format and sats-connect format
    if (response && response.jsonrpc === '2.0' && response.result) {
      // JSON-RPC 2.0 format: { jsonrpc: "2.0", result: { confirmed, unconfirmed, total }, id }
      return response.result;
    } else if (response.status === 'success') {
      // sats-connect format: { status: "success", result: { confirmed, unconfirmed, total } }
      return response.result;
    } else if (response.status === 'error') {
      throw new Error(response.error?.message || 'Failed to get balance');
    }
    
    return response;
  } catch (error) {
    console.warn('getBalance not supported:', error.message);
    throw error;
  }
}

// ============= EXPORTS =============

export default {
  AddressPurpose,
  BitcoinNetworkType,
  getBitcoinProvider,
  getAddresses,
  signMessage,
  signPsbt,
  sendTransfer,
  getInscriptions,
  getBalance,
  createUnsecuredToken,
  createMagicEdenToken // deprecated alias
};
