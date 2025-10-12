/**
 * Data Normalizers - Utility Module
 * Inscription Module #2 - Utilities Layer
 * 
 * Purpose: Normalize different wallet API response formats for consistency
 * Dependencies: None (utility)
 * Exports: normalizeFunctions object
 * Size: ~120 lines, ~3KB brotli
 * 
 * Update this module to handle new wallet API formats
 */

/**
 * Normalize inscription data from different wallet formats
 * @param {Object} inscription - Raw inscription data from wallet
 * @param {string} walletName - Name of wallet for format detection
 * @returns {Object} Normalized inscription object
 */
export function normalizeInscription(inscription, walletName) {
  // Base normalized format
  const normalized = {
    inscriptionId: inscription.inscriptionId || inscription.id,
    inscriptionNumber: inscription.inscriptionNumber || inscription.number,
    address: inscription.address,
    outputValue: inscription.outputValue || inscription.output_value || inscription.value,
    content: inscription.content,
    contentType: inscription.contentType || inscription.content_type || inscription.mimeType, // Fixed: was duplicate contentType
    contentLength: inscription.contentLength || inscription.content_length,
    timestamp: inscription.timestamp,
    genesisTransaction: inscription.genesisTransaction || inscription.genesis_transaction || inscription.genesis_tx,
    location: inscription.location,
    output: inscription.output,
    offset: inscription.offset
  };

  // Wallet-specific adjustments
  switch (walletName) {
    case 'Xverse':
      // Xverse uses different field names
      normalized.contentType = inscription.contentType || inscription.mimeType;
      normalized.inscriptionNumber = inscription.number;
      break;
      
    case 'UniSat':
      // UniSat specific format
      normalized.contentType = inscription.contentType;
      normalized.inscriptionNumber = inscription.inscriptionNumber;
      break;
      
    case 'OKX':
      // OKX uses camelCase (already correct in base format)
      // No adjustments needed - OKX uses standard format
      break;
  }

  return normalized;
}

/**
 * Normalize balance data from different wallet formats
 * @param {Object|number} balance - Raw balance data from wallet
 * @param {string} walletName - Name of wallet for format detection
 * @returns {Object} Normalized balance object with confirmed, unconfirmed, total
 */
export function normalizeBalance(balance, walletName) {
  // If balance is just a number, return simple format
  if (typeof balance === 'number') {
    return {
      confirmed: balance,
      unconfirmed: 0,
      total: balance
    };
  }

  // Handle object formats
  const normalized = {
    confirmed: balance.confirmed || balance.amount || balance.total || 0,
    unconfirmed: balance.unconfirmed || balance.pending || 0,
    total: 0
  };

  // Calculate total
  normalized.total = balance.total || (normalized.confirmed + normalized.unconfirmed);

  // Wallet-specific adjustments
  switch (walletName) {
    case 'Xverse':
      normalized.confirmed = balance.confirmed || 0;
      normalized.unconfirmed = balance.unconfirmed || 0;
      break;
      
    case 'UniSat':
      normalized.confirmed = balance.confirm || balance.confirmed || 0;
      normalized.unconfirmed = balance.pending || balance.unconfirmed || 0;
      break;
  }

  normalized.total = normalized.confirmed + normalized.unconfirmed;
  return normalized;
}

/**
 * Normalize PSBT signing options across wallets
 * @param {Object} options - Raw options from user
 * @param {string} walletName - Name of wallet for format detection
 * @returns {Object} Normalized options object
 */
export function normalizePsbtOptions(options, walletName) {
  const normalized = {
    autoFinalized: options.autoFinalized !== false, // Default true
    toSignInputs: options.toSignInputs || options.inputsToSign || []
  };

  // Wallet-specific adjustments
  switch (walletName) {
    case 'Xverse':
      // Xverse uses specific format for input signing
      if (options.inputsToSign && Array.isArray(options.inputsToSign)) {
        normalized.toSignInputs = options.inputsToSign.map(input => ({
          address: input.address,
          signingIndexes: input.signingIndexes || input.signingIndexes || [0]
        }));
      }
      break;
      
    case 'UniSat':
      // UniSat uses simple array of indices
      normalized.toSignInputs = options.toSignInputs || [];
      break;
  }

  return normalized;
}

/**
 * Normalize network names across wallets
 * @param {string} network - Raw network name from wallet
 * @returns {string} Normalized network name ('livenet', 'testnet')
 */
export function normalizeNetwork(network) {
  const networkLower = (network || '').toLowerCase();
  
  if (networkLower.includes('main') || networkLower.includes('live')) {
    return 'livenet';
  }
  if (networkLower.includes('test')) {
    return 'testnet';
  }
  
  // Default to livenet if unknown
  return 'livenet';
}

/**
 * Normalize address format (handle different address types)
 * @param {string|Object} address - Raw address data
 * @returns {string} Clean address string
 */
export function normalizeAddress(address) {
  if (typeof address === 'string') {
    return address;
  }
  
  // Handle object format (some wallets return objects)
  if (typeof address === 'object' && address !== null) {
    return address.address || address.value || String(address);
  }
  
  return '';
}

/**
 * Export all normalizers as single object
 */
export const normalizers = {
  inscription: normalizeInscription,
  balance: normalizeBalance,
  psbtOptions: normalizePsbtOptions,
  network: normalizeNetwork,
  address: normalizeAddress
};

export default normalizers;
