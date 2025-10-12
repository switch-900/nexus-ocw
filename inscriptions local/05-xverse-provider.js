/**
 * Xverse Wallet Provider
 * Inscription Module #5 - Xverse Wallet
 * 
 * Purpose: Xverse wallet with ordinals, payment addresses, and Runes support
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers), Module #3 (WalletConnector)
 * Exports: XverseProvider class
 * Size: ~745 lines, ~14KB brotli
 * 
 * Documentation: https://docs.xverse.app
 * Sats Connect API: https://docs.xverse.app/sats-connect/bitcoin-methods
 * 
 * Features (TESTED & CONFIRMED):
 * - ✅ getBalance via request('getBalance')
 * - ✅ getInscriptions via request('ord_getInscriptions')
 * - ✅ Runes support (getBalance, transfer, mint, etch, getOrder)
 * - ✅ Create inscriptions (single and batch)
 * - ✅ Send inscriptions
 * - ✅ Sign messages and transactions
 * - ❌ UTXO fetching (not supported by Xverse API)
 * 
 * Update this module to add new Xverse-specific features
 */

// Import from ordinal inscriptions (update sat numbers after inscribing)
// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js';
import { createUnsecuredToken } from './03-wallet-connector.js';

export class XverseProvider extends BaseWalletProvider {
  constructor() {
    super('Xverse');
    this.paymentAddress = null;
    this.ordinalsAddress = null;
    this.paymentPublicKey = null;
    this.ordinalsPublicKey = null;
    
    // Set walletInstance directly (can't call this.getProvider() in constructor)
    if (typeof window !== 'undefined') {
      if (window.XverseProviders?.BitcoinProvider) {
        this.walletInstance = window.XverseProviders.BitcoinProvider;
      } else if (window.BitcoinProvider) {
        this.walletInstance = window.BitcoinProvider;
      }
    }
    
    // Feature flags - Xverse capabilities (TESTED & CONFIRMED)
    // All features accessed via provider.request() method
    // Docs: https://docs.xverse.app/sats-connect/bitcoin-methods
    this.features = {
      connect: true,                    // wallet_connect via request()
      getAddress: true,                 // getAddresses via request()
      getPublicKey: true,               // From wallet_connect response
      getBalance: true,                 // ✅ CONFIRMED: request('getBalance')
      signMessage: true,                // signMessage via request()
      signTransaction: true,            // signTransaction (Xverse name for signPsbt)
      signMultipleTransactions: true,   // signMultipleTransactions
      sendBtcTransaction: true,         // sendTransfer via request()
      getInscriptions: true,            // ✅ CONFIRMED: request('ord_getInscriptions')
      sendInscription: true,            // ord_sendInscriptions via request()
      createInscription: true,          // ✅ CONFIRMED: createInscription()
      createRepeatInscriptions: true,   // ✅ CONFIRMED: createRepeatInscriptions()
      getUtxos: false,                 // ❌ NOT SUPPORTED: Xverse does not provide UTXO access
      getBitcoinUtxos: false,           // ❌ NOT SUPPORTED: No UTXO methods available
      getCapabilities: true,            // ✅ NEW: wallet capabilities info
      runes: true,                      // ✅ CONFIRMED: runes_getBalance, runes_transfer, mint, etch
      eventListeners: true,             // addListener for events
      networkSwitch: false,             // No network switching
      brc20: false,                     // No BRC-20 support
      arc20: false,                     // No ARC-20 support
      atomicals: false                  // No Atomicals support
    };
  }

  isInstalled() {
    return typeof window.BitcoinProvider !== 'undefined' || 
           typeof window.XverseProviders !== 'undefined';
  }

  getProvider() {
    if (window.XverseProviders && window.XverseProviders.BitcoinProvider) {
      return window.XverseProviders.BitcoinProvider;
    }
    if (window.BitcoinProvider) {
      return window.BitcoinProvider;
    }
    return null;
  }

  async connect() {
    this.requireInstalled();

    try {
      const provider = this.getProvider();
      
      // Xverse uses 'wallet_connect' method, NOT 'getAccounts'!
      console.log('🔍 Xverse: Requesting wallet_connect...');
      const response = await provider.request('wallet_connect');

      console.log('🔍 Xverse response:', response);

      if (!response?.result?.addresses) {
        throw new Error('No addresses returned from Xverse');
      }

      // Get payment and ordinals addresses from result.addresses
      const addresses = response.result.addresses;
      const ordinalsAccount = addresses.find(acc => acc.purpose === 'ordinals');
      const paymentAccount = addresses.find(acc => acc.purpose === 'payment');

      if (!ordinalsAccount || !paymentAccount) {
        throw new Error('Missing ordinals or payment address from Xverse');
      }

      this.paymentAddress = paymentAccount.address;
      this.ordinalsAddress = ordinalsAccount.address;
      this.paymentPublicKey = paymentAccount.publicKey;
      this.ordinalsPublicKey = ordinalsAccount.publicKey;
      this.address = this.ordinalsAddress; // Use ordinals address as primary
      this.isConnected = true;

      console.log('✅ Xverse connected:', {
        ordinals: this.ordinalsAddress,
        payment: this.paymentAddress,
        ordinalsPublicKey: this.ordinalsPublicKey,
        paymentPublicKey: this.paymentPublicKey
      });

      return { 
        address: this.address,
        paymentAddress: this.paymentAddress,
        ordinalsAddress: this.ordinalsAddress,
        paymentPublicKey: this.paymentPublicKey,
        ordinalsPublicKey: this.ordinalsPublicKey
      };
    } catch (error) {
      console.error('❌ Xverse connection failed:', error);
      throw error;
    }
  }

  async getAddress() {
    this.requireConnected();
    return this.ordinalsAddress || this.address;
  }

  /**
   * Get all addresses (payment and ordinals) using Sats Connect API
   * Follows: https://docs.xverse.app/sats-connect/bitcoin-methods/getaddresses
   * @param {Array<string>} purposes - Array of address purposes ['ordinals', 'payment']
   * @returns {Promise<Array>} Array of address objects with {address, publicKey, purpose}
   */
  async getAddresses(purposes = ['ordinals', 'payment']) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔍 Xverse: Requesting getAddresses with purposes:', purposes);
      
      // Use Sats Connect getAddresses method
      const response = await provider.request('getAddresses', {
        purposes: purposes,
        message: 'App requesting addresses'
      });
      
      console.log('✅ Xverse getAddresses response:', response);
      
      if (response && response.result && response.result.addresses) {
        return response.result.addresses;
      }
      
      // Fallback to cached addresses from connection
      return [
        {
          purpose: 'ordinals',
          address: this.ordinalsAddress,
          publicKey: this.ordinalsPublicKey
        },
        {
          purpose: 'payment',
          address: this.paymentAddress,
          publicKey: this.paymentPublicKey
        }
      ];
    } catch (error) {
      console.warn('⚠️ Xverse getAddresses failed, using cached addresses:', error);
      
      // Return cached addresses from connection
      return [
        {
          purpose: 'ordinals',
          address: this.ordinalsAddress,
          publicKey: this.ordinalsPublicKey
        },
        {
          purpose: 'payment',
          address: this.paymentAddress,
          publicKey: this.paymentPublicKey
        }
      ];
    }
  }

  async getBalance() {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      if (!provider || typeof provider.request !== 'function') {
        console.warn('⚠️ Xverse provider does not have request method');
        return 0;
      }
      
      // Use Xverse's getBalance method via request
      // According to sats-connect docs: request('getBalance', undefined)
      // The wallet automatically returns balance for the connected payment address
      console.log('🔍 Xverse: Requesting getBalance...');
      const response = await provider.request('getBalance', undefined);
      
      console.log('🔍 Xverse getBalance response:', response);
      
      // Handle both JSON-RPC 2.0 format and sats-connect format
      let balance;
      
      if (response && response.jsonrpc === '2.0' && response.result) {
        // JSON-RPC 2.0 format: { jsonrpc: "2.0", result: { confirmed, unconfirmed, total }, id }
        balance = response.result;
      } else if (response && response.status === 'success' && response.result) {
        // sats-connect format: { status: "success", result: { confirmed, unconfirmed, total } }
        balance = response.result;
      } else if (response && response.status === 'error') {
        throw new Error(response.error?.message || 'Failed to get balance from Xverse');
      } else {
        console.warn('⚠️ Unexpected response format from Xverse getBalance:', response);
        return 0;
      }
      
      if (balance && balance.total) {
        console.log('💰 Xverse balance:', balance);
        
        // balance = { confirmed: "123456", unconfirmed: "0", total: "123456" }
        // All values are strings in satoshis
        const totalSats = parseInt(balance.total, 10);
        const btcBalance = totalSats / 100000000;
        
        return btcBalance;
      } else {
        console.warn('⚠️ No balance data in response');
        return { balance: 0, error: 'No balance data in response', available: false };
      }
    } catch (error) {
      console.error('❌ Xverse getBalance failed:', error);
      // Return object to differentiate "couldn't fetch" from "balance is 0"
      return { 
        balance: 0, 
        error: error.message || 'Failed to fetch balance',
        available: false 
      };
    }
  }

  async getInscriptions(offset = 0, limit = 100) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      const address = this.ordinalsAddress || this.address;
      
      console.log(`📦 Xverse: Fetching inscriptions for ${address} (offset: ${offset}, limit: ${limit})`);
      
      // Use wallet connector request method (JSON-RPC pattern)
      const response = await provider.request('ord_getInscriptions', {
        offset: offset,
        limit: limit
      });
      
      console.log('✅ Xverse inscriptions response:', response);
      
      // Check for error in response
      if (response && response.status === 'error') {
        console.error('Xverse inscriptions error:', response.error);
        throw new Error(response.error.message || 'Failed to get inscriptions');
      }
      
      // Extract inscriptions from result
      const inscriptions = response?.result?.inscriptions || response?.inscriptions || [];
      
      return inscriptions.map(inscription => ({
        inscriptionId: inscription.inscriptionId || inscription.id,
        inscriptionNumber: inscription.inscriptionNumber || inscription.number,
        contentType: inscription.contentType || inscription.content_type,
        contentLength: inscription.contentLength || inscription.content_length,
        contentBody: `/content/${inscription.inscriptionId || inscription.id}`,
        timestamp: inscription.timestamp,
        genesisTransaction: inscription.genesisTransaction || inscription.genesis_transaction,
        location: inscription.location,
        output: inscription.output,
        outputValue: inscription.outputValue || inscription.output_value
      }));
    } catch (error) {
      console.error('❌ Failed to fetch Xverse inscriptions:', error);
      throw error;
    }
  }
  // ✅ getAllInscriptions() inherited from BaseWalletProvider
  // Provides automatic pagination - no need to override


  async signPSBT(psbtHex, options = {}) {
    this.requireConnected();

    if (!psbtHex || typeof psbtHex !== 'string') {
      throw new Error('Invalid PSBT: must be a non-empty string');
    }

    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('Xverse provider not available');
      }

      const params = {
        psbt: psbtHex,
        broadcast: options.broadcast || false
      };

      // Add signInputs if provided (maps addresses to input indices)
      // Format: { "address1": [0, 1], "address2": [2] }
      if (options.signInputs && typeof options.signInputs === 'object') {
        params.signInputs = options.signInputs;
      }

      console.log('🔏 Xverse: Signing PSBT with params:', { 
        broadcast: params.broadcast, 
        hasSignInputs: !!params.signInputs 
      });

      // Use sats-connect format: request('signPsbt', params)
      const response = await provider.request('signPsbt', params);

      // Handle sats-connect response format
      if (response && response.status === 'success') {
        if (!response.result || !response.result.psbt) {
          throw new Error('No signed PSBT in response');
        }
        console.log('✅ Xverse PSBT signed successfully');
        return response.result.psbt;
      } else if (response && response.error) {
        // Handle error response
        const errorCode = response.error.code;
        if (errorCode === 'USER_REJECTION') {
          throw new Error('User rejected the signing request');
        }
        throw new Error(response.error.message || 'PSBT signing failed');
      }

      throw new Error('Invalid response from Xverse wallet');
    } catch (error) {
      console.error('❌ Xverse PSBT signing failed:', error);
      const errorMessage = error?.message || 'Unknown Xverse signing error';
      throw new Error(`Xverse: ${errorMessage}`);
    }
  }


  async sendBitcoin(toAddress, amount) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      const response = await provider.request({
        method: 'sendTransfer',
        params: {
          recipients: [{
            address: toAddress,
            amountSats: amount
          }]
        }
      });

      console.log('✅ Transaction sent:', response.txid);
      return response.txid;
    } catch (error) {
      console.error('❌ Failed to send Bitcoin:', error);
      throw error;
    }
  }

  // Note: Xverse does not support UTXO fetching through their API
  // The getInfo method does not exist in sats-connect
  // If UTXOs are needed, use a different wallet like UniSat or Wizz

  /**
   * Get wallet capabilities
   * @returns {Promise<Object>} Wallet capabilities
   */
  async getCapabilities() {
    this.requireConnected();
    
    try {
      return {
        walletType: 'Xverse',
        methods: Object.keys(this.features).filter(key => this.features[key] === true),
        features: {
          multiAddress: true,
          runes: true,
          inscriptions: true,
          batchOperations: true,
          utxos: false  // Xverse does not support UTXO fetching
        },
        addresses: {
          payment: this.paymentAddress,
          ordinals: this.ordinalsAddress
        }
      };
    } catch (error) {
      console.error('❌ Failed to get capabilities:', error);
      throw error;
    }
  }

  async signMessage(message) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      const result = await provider.request('signMessage', {
        address: this.ordinalsAddress || this.address,
        message: message
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Sign a transaction using native Xverse signTransaction method
   * @param {string} psbtBase64 - Base64 encoded PSBT
   * @param {Object} options - Signing options
   * @returns {Promise<Object>} Signed transaction result
   */
  async signTransaction(psbtBase64, options = {}) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      const result = await provider.signTransaction(psbtBase64, options);
      console.log('✅ Transaction signed via Xverse signTransaction');
      return result;
    } catch (error) {
      console.error('❌ Failed to sign transaction:', error);
      throw error;
    }
  }

  /**
   * Sign multiple transactions at once using native Xverse method
   * @param {Array<string>} psbtBase64s - Array of Base64 encoded PSBTs
   * @param {Object} options - Signing options
   * @returns {Promise<Array<Object>>} Array of signed transaction results
   */
  async signMultipleTransactions(psbtBase64s, options = {}) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      const results = await provider.signMultipleTransactions(psbtBase64s, options);
      console.log(`✅ ${results.length} transactions signed via Xverse`);
      return results;
    } catch (error) {
      console.error('❌ Failed to sign multiple transactions:', error);
      throw error;
    }
  }

  /**
   * Create an inscription using native Xverse createInscription method
   * @param {Object} inscriptionData - Inscription data
   * @param {string} inscriptionData.content - Content to inscribe (base64 for binary, string for text)
   * @param {string} inscriptionData.contentType - MIME type (e.g., 'text/plain', 'image/png')
   * @param {Object} options - Additional options (fee rate, etc.)
   * @returns {Promise<Object>} Inscription result with txid
   */
  async createInscription(inscriptionData, options = {}) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      const result = await provider.createInscription({
        ...inscriptionData,
        ...options
      });
      console.log('✅ Inscription created via Xverse:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to create inscription:', error);
      throw error;
    }
  }

  /**
   * Create multiple identical inscriptions in a single transaction
   * Xverse-specific batch inscription feature
   * @param {Object} payload - Inscription payload with repeat count
   * @returns {Promise<Object>} Batch inscription result with txids
   */
  async createRepeatInscriptions(payload) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('Xverse provider not found');
      }

      console.log('🔍 Xverse: Creating repeat inscriptions with payload:', {
        repeat: payload.repeat,
        contentType: payload.contentType,
        payloadType: payload.payloadType,
        feeRate: payload.suggestedMinerFeeRate
      });

      // Create JWT token using shared utility - same as inscribe
      const token = createUnsecuredToken(payload);
      console.log('🔍 Xverse: Created JWT token for repeat inscriptions request');

      // Call createRepeatInscriptions method with JWT token
      const response = await provider.createRepeatInscriptions(token);
      
      console.log('✅ Xverse repeat inscriptions response:', response);

      // Handle response
      if (!response) {
        throw new Error('No response from Xverse wallet');
      }

      if (response.error) {
        throw new Error(response.error.message || 'Provider returned an error');
      }

      // Extract result
      const result = {
        txId: response.txId,
        inscriptionIds: response.inscriptionIds || [],
        count: payload.repeat
      };

      console.log(`✅ ${payload.repeat} inscriptions created via Xverse:`, result);
      return result;
    } catch (error) {
      console.error('❌ Failed to create repeat inscriptions:', error);
      
      // Handle user cancellation
      if (error.code === 4001 || error.message?.includes('cancel')) {
        throw new Error('Batch inscription cancelled by user');
      }
      
      throw new Error(`Batch inscription failed: ${error.message}`);
    }
  }

  async getNetwork() {
    // Xverse defaults to mainnet
    return 'mainnet';
  }

  async getPublicKey() {
    this.requireConnected();

    // Return ordinals public key (preferred for inscriptions)
    return this.ordinalsPublicKey || this.paymentPublicKey;
  }

  async getAccounts() {
    this.requireConnected();

    // Return cached account info from connection
    return [
      {
        purpose: 'ordinals',
        address: this.ordinalsAddress,
        publicKey: this.ordinalsPublicKey
      },
      {
        purpose: 'payment',
        address: this.paymentAddress,
        publicKey: this.paymentPublicKey
      }
    ];
  }

  /**
   * Get all inscriptions with automatic pagination
   * @returns {Promise<Array>} All inscriptions
   */

  /**
   * Create inscription via Xverse wallet using native provider
   * No external dependencies - uses JWT token method directly
   * @param {string|ArrayBuffer} content - Content to inscribe
   * @param {Object} options - Inscription options
   * @returns {Promise<{inscriptionId: string, txId: string}>}
   */
  async inscribe(content, options = {}) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('Xverse provider not found');
      }

      const {
        contentType = 'text/plain;charset=utf-8',
        feeRate = 10,
        receiverAddress,
        devAddress,
        devFee = 0
      } = options;

      // Determine payload type based on content
      let payloadType = 'PLAIN_TEXT';
      let processedContent = content;

      // If content is ArrayBuffer or we have image/binary content type, use BASE_64
      if (content instanceof ArrayBuffer || contentType.startsWith('image/')) {
        payloadType = 'BASE_64';
        
        // Convert ArrayBuffer to base64 if needed
        if (content instanceof ArrayBuffer) {
          const bytes = new Uint8Array(content);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          processedContent = btoa(binary);
        }
      }

      // Build inscription payload following Xverse/sats-connect format
      const inscriptionPayload = {
        contentType,
        content: processedContent,
        payloadType,
        network: { type: 'Mainnet' }
      };

      // Add optional parameters
      if (feeRate) {
        inscriptionPayload.suggestedMinerFeeRate = feeRate;
      }

      if (devAddress && devFee > 0) {
        inscriptionPayload.appFeeAddress = devAddress;
        inscriptionPayload.appFee = devFee;
      }

      console.log('🔍 Xverse: Creating inscription with payload:', {
        contentType: inscriptionPayload.contentType,
        payloadType: inscriptionPayload.payloadType,
        contentLength: processedContent.length,
        feeRate: inscriptionPayload.suggestedMinerFeeRate,
        hasServiceFee: !!(devAddress && devFee)
      });

      // Create JWT token using shared utility
      const token = createUnsecuredToken(inscriptionPayload);
      console.log('🔍 Xverse: Created JWT token for inscription request');

      // Call createInscription method with JWT token
      const response = await provider.createInscription(token);
      
      console.log('✅ Xverse inscription response:', response);

      // Handle response
      if (!response) {
        throw new Error('No response from Xverse wallet');
      }

      if (response.error) {
        throw new Error(response.error.message || 'Provider returned an error');
      }

      // Extract result
      const result = {
        txId: response.txId,
        inscriptionId: response.inscriptionId || response.txId
      };

      console.log('✅ Xverse inscription created:', result);
      return result;

    } catch (error) {
      console.error('❌ Xverse inscribe error:', error);
      
      // Handle user cancellation
      if (error.code === 4001 || error.message?.includes('cancel')) {
        throw new Error('Inscription cancelled by user');
      }
      
      throw new Error(`Inscription failed: ${error.message}`);
    }
  }

  /**
   * Get Runes balance for the connected wallet
   * Uses Xverse's runes_getBalance method
   * @returns {Promise<Object>} Runes balance data
   */
  async getRunesBalance() {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔍 Xverse: Requesting runes_getBalance...');
      const response = await provider.request('runes_getBalance', undefined);
      
      console.log('✅ Xverse runes balance:', response);
      
      if (response && response.result) {
        return response.result;
      }
      
      return response;
    } catch (error) {
      console.error('❌ Xverse getRunesBalance failed:', error);
      throw error;
    }
  }

  /**
   * Transfer Runes to another address
   * Uses Xverse's runes_transfer method
   * @param {Object} transferParams - Transfer parameters
   * @param {string} transferParams.recipient - Recipient address
   * @param {string} transferParams.runeName - Name of the rune to transfer
   * @param {string} transferParams.amount - Amount to transfer
   * @returns {Promise<Object>} Transfer result with txid
   */
  async transferRunes(transferParams) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔍 Xverse: Transferring runes:', transferParams);
      const response = await provider.request('runes_transfer', transferParams);
      
      console.log('✅ Xverse runes transfer:', response);
      return response;
    } catch (error) {
      console.error('❌ Xverse transferRunes failed:', error);
      throw error;
    }
  }

  /**
   * Mint Runes
   * Uses Xverse's rune minting method
   * @param {Object} mintParams - Mint parameters
   * @returns {Promise<Object>} Mint result with txid
   */
  async mintRunes(mintParams) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔍 Xverse: Minting runes:', mintParams);
      const response = await provider.request('runes_mint', mintParams);
      
      console.log('✅ Xverse runes mint:', response);
      return response;
    } catch (error) {
      console.error('❌ Xverse mintRunes failed:', error);
      throw error;
    }
  }

  /**
   * Etch (create) new Runes
   * Uses Xverse's rune etching method
   * @param {Object} etchParams - Etch parameters
   * @returns {Promise<Object>} Etch result with txid
   */
  async etchRunes(etchParams) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔍 Xverse: Etching runes:', etchParams);
      const response = await provider.request('runes_etch', etchParams);
      
      console.log('✅ Xverse runes etch:', response);
      return response;
    } catch (error) {
      console.error('❌ Xverse etchRunes failed:', error);
      throw error;
    }
  }

  /**
   * Get Runes order status
   * Uses Xverse's runes_getOrder method
   * @param {string} orderId - Order ID to check
   * @returns {Promise<Object>} Order status
   */
  async getRunesOrder(orderId) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔍 Xverse: Getting runes order:', orderId);
      const response = await provider.request('runes_getOrder', { orderId });
      
      console.log('✅ Xverse runes order:', response);
      return response;
    } catch (error) {
      console.error('❌ Xverse getRunesOrder failed:', error);
      throw error;
    }
  }

  /**
   * Send inscriptions to another address
   * Uses Xverse's ord_sendInscriptions method
   * @param {Object} sendParams - Send parameters
   * @param {string} sendParams.recipient - Recipient address
   * @param {Array<string>} sendParams.inscriptionIds - Array of inscription IDs to send
   * @returns {Promise<Object>} Send result with txid
   */
  async sendInscriptions(sendParams) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔍 Xverse: Sending inscriptions:', sendParams);
      const response = await provider.request('ord_sendInscriptions', sendParams);
      
      console.log('✅ Xverse inscriptions sent:', response);
      return response;
    } catch (error) {
      console.error('❌ Xverse sendInscriptions failed:', error);
      throw error;
    }
  }
}

export default XverseProvider;
