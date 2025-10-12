/**
 * Magic Eden Wallet Provider
 * Inscription Module #10 - Magic Eden Wallet
 * 
 * Purpose: Magic Eden wallet with JWT authentication
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers), Module #3 (WalletConnector)
 * Exports: MagicEdenProvider class
 * Size: ~370 lines, ~8KB brotli
 * 
 * Documentation: https://wallet.magiceden.io/developer
 * 
 * Magic Eden API Pattern:
 * - Uses JWT tokens for requests (createUnsecuredToken)
 * - Direct methods: connect(), signMessage(), signTransaction(), sendBtcTransaction()
 * - NO provider.request() method support
 * 
 * ⚠️ WARNING: Magic Eden does NOT work properly when multiple Bitcoin wallets
 * are installed (Xverse, Leather, etc). Use XverseProvider instead.
 * 
 * Update this module to add new Magic Eden-specific features
 */

// Import from ordinal inscriptions
// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js';
import { createUnsecuredToken } from './03-wallet-connector.js';

export class MagicEdenProvider extends BaseWalletProvider {
  constructor() {
    super('MagicEden');
    this.paymentAddress = null;
    this.ordinalsAddress = null;
    
    this.walletInstance = this.getProvider();
    
    // Feature flags - Magic Eden capabilities
    this.features = {
      connect: true,
      getAddress: true,
      getPublicKey: false,
      getBalance: false,
      getNetwork: true,
      switchNetwork: false,
      signMessage: true,
      signPsbt: true,
      signPsbts: true,
      signTransaction: true,
      pushPsbt: false,
      pushTx: false,
      sendBitcoin: true,
      sendInscription: false,
      getInscriptions: false,
      getAllInscriptions: false,
      inscribe: false,
      brc20: { transfer: false, deploy: false, mint: false },
      runes: { send: false, mint: false, etch: false },
      atomicals: { transfer: false, mint: false },
      arc20: { transfer: false },
      jwtAuth: true,            // Uses JWT token authentication (UNIQUE)
      hardwareDetection: true   // Has isHardware() method
    };
  }

  getProvider() {
    if (typeof window === 'undefined') return null;
    
    // Check window.magicEden.bitcoin exists
    if (window.magicEden?.bitcoin?.isMagicEden) {
      return window.magicEden.bitcoin;
    }
    
    // Check if Magic Eden took over window.BitcoinProvider
    if (window.BitcoinProvider?.isMagicEden) {
      return window.BitcoinProvider;
    }
    
    return null;
  }

  isInstalled() {
    return !!this.walletInstance;
  }

  // ========================================
  // CONNECTION METHODS
  // ========================================

  async connect() {
    this.requireInstalled();

    const provider = this.walletInstance;

    // CRITICAL: Detect multi-wallet conflicts early
    const hasXverse = typeof window.XverseProviders !== 'undefined' || typeof window.BitcoinProvider?.request === 'function';
    const hasLeather = typeof window.LeatherProvider !== 'undefined';
    
    if ((hasXverse || hasLeather) && !provider?.isMagicEden) {
      throw new Error(
        '🚨 WALLET CONFLICT DETECTED\n\n' +
        'Magic Eden cannot coexist with other Bitcoin wallets.\n' +
        `Detected: ${hasXverse ? 'Xverse ' : ''}${hasLeather ? 'Leather' : ''}\n\n` +
        'SOLUTIONS:\n' +
        '1. Disable Xverse and Leather extensions\n' +
        '2. Refresh the page\n' +
        '3. Try again\n\n' +
        'OR use Xverse wallet instead (recommended for multi-wallet support)'
      );
    }

    if (!provider || !provider.isMagicEden) {
      throw new Error(
        '⚠️ Magic Eden wallet is installed but cannot be accessed.\n\n' +
        'This happens when multiple Bitcoin wallets are installed.\n\n' +
        'SOLUTION:\n' +
        '1. Disable Xverse and Leather extensions\n' +
        '2. Refresh the page\n' +
        '3. Try again\n\n' +
        'OR use Xverse wallet instead (recommended)'
      );
    }

    try {
      // Create JWT token for connection request
      const payload = {
        purposes: ['payment', 'ordinals'],
        message: 'Connect to view your Bitcoin addresses',
        network: { type: 'Mainnet' }
      };
      
      const request = createUnsecuredToken(payload);
      
      // Call Magic Eden's direct connect() method
      const response = await provider.connect(request);

      if (!response?.addresses || !Array.isArray(response.addresses)) {
        throw new Error('No addresses returned from Magic Eden wallet');
      }

      // Find payment and ordinals addresses
      const paymentAddress = response.addresses.find(a => a.purpose === 'payment');
      const ordinalsAddress = response.addresses.find(a => a.purpose === 'ordinals');

      if (!paymentAddress && !ordinalsAddress) {
        throw new Error('No valid addresses returned');
      }

      // Store the addresses
      this.paymentAddress = paymentAddress?.address;
      this.ordinalsAddress = ordinalsAddress?.address;
      this.address = ordinalsAddress?.address || paymentAddress?.address;
      this.publicKey = paymentAddress?.publicKey || ordinalsAddress?.publicKey;
      this.isConnected = true;

      console.log('✅ Magic Eden connected:', {
        payment: this.paymentAddress,
        ordinals: this.ordinalsAddress
      });

      return {
        address: this.address,
        paymentAddress: this.paymentAddress,
        ordinalsAddress: this.ordinalsAddress,
        publicKey: this.publicKey
      };
    } catch (error) {
      console.error('❌ Magic Eden connection failed:', error);
      throw error;
    }
  }

  async getAddress() {
    this.requireConnected();
    return this.address;
  }

  async getAccounts() {
    this.requireConnected();

    return [
      {
        address: this.paymentAddress,
        publicKey: this.publicKey,
        purpose: 'payment'
      },
      {
        address: this.ordinalsAddress,
        publicKey: this.publicKey,
        purpose: 'ordinals'
      }
    ].filter(account => account.address);
  }

  async getBalance() {
    this.requireConnected();

    // Magic Eden wallet does not support getBalance via their API
    console.log('ℹ️ Magic Eden does not support getBalance - use their web interface');
    return { confirmed: 0, unconfirmed: 0, total: 0 };
  }

  async getNetwork() {
    return 'mainnet';
  }

  // ========================================
  // SIGNING METHODS
  // ========================================

  async signMessage(message) {
    this.requireConnected();

    try {
      // Create JWT token for sign message request
      const payload = {
        address: this.address,
        message,
        protocol: 'BIP322' // Default to BIP322, can use 'ECDSA' for legacy
      };
      
      const request = createUnsecuredToken(payload);
      
      // Call Magic Eden's direct signMessage() method
      const signature = await this.walletInstance.signMessage(request);

      console.log('✅ Magic Eden message signed');
      return signature;
    } catch (error) {
      console.error('❌ Magic Eden sign message failed:', error);
      throw new Error(`Message signing failed: ${error.message}`);
    }
  }

  async signPsbt(psbtBase64, options = {}) {
    this.requireConnected();

    try {
      const signingIndexes = options.signingIndexes || [0];
      
      // Create JWT token for sign transaction request
      const payload = {
        network: { type: 'Mainnet' },
        message: 'Sign transaction',
        psbtBase64,
        broadcast: false,
        inputsToSign: [{
          address: this.address,
          signingIndexes
        }]
      };
      
      const request = createUnsecuredToken(payload);
      
      // Call Magic Eden's direct signTransaction() method
      const result = await this.walletInstance.signTransaction(request);

      console.log('✅ Magic Eden PSBT signed');
      
      // Return the signed PSBT
      if (result?.psbtBase64) {
        return result.psbtBase64;
      }
      
      throw new Error('No signed PSBT returned');
    } catch (error) {
      console.error('❌ Magic Eden sign PSBT failed:', error);
      throw new Error(`PSBT signing failed: ${error.message}`);
    }
  }

  async signTransaction(psbtBase64) {
    this.requireConnected();

    const result = await this.walletInstance.signTransaction(psbtBase64);
    console.log('✅ Transaction signed via Magic Eden');
    return result;
  }

  async signMultipleTransactions(psbtBase64s) {
    this.requireConnected();

    const results = await this.walletInstance.signMultipleTransactions(psbtBase64s);
    console.log(`✅ ${results.length} transactions signed via Magic Eden`);
    return results;
  }

  // ========================================
  // TRANSACTION METHODS
  // ========================================

  async sendBitcoin(toAddress, amount) {
    this.requireConnected();

    // Validate Bitcoin address format
    if (!toAddress || typeof toAddress !== 'string') {
      throw new Error('Invalid recipient address: must be a valid Bitcoin address string');
    }

    // Basic Bitcoin address validation
    const addressRegex = /^(bc1|[13]|tb1)[a-zA-HJ-NP-Z0-9]{25,90}$/;
    if (!addressRegex.test(toAddress)) {
      throw new Error(`Invalid Bitcoin address format: ${toAddress}`);
    }

    try {
      // Convert BTC to satoshis if needed
      const amountSats = amount > 100000 ? amount : Math.floor(amount * 100000000);
      
      if (amountSats <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      
      // Use payment address as sender (required by Magic Eden)
      const senderAddress = this.paymentAddress;
      if (!senderAddress) {
        throw new Error('Payment address not available. Please reconnect wallet.');
      }
      
      // Create JWT token for send BTC request
      const payload = {
        recipients: [{
          address: toAddress,
          amountSats: amountSats
        }],
        senderAddress: senderAddress
      };
      
      const request = createUnsecuredToken(payload);
      
      // Call Magic Eden's direct sendBtcTransaction() method
      const txid = await this.walletInstance.sendBtcTransaction(request);

      console.log('✅ Magic Eden BTC sent:', txid);
      return txid;
    } catch (error) {
      console.error('❌ Magic Eden send BTC failed:', error);
      
      // Improve error messages
      let errorMessage = error.message || 'Unknown error';
      
      if (errorMessage.includes('validation')) {
        errorMessage = 'Invalid address format. Please check the recipient address.';
      } else if (errorMessage.includes('rejected')) {
        errorMessage = 'Transaction was rejected by user';
      } else if (errorMessage.includes('insufficient')) {
        errorMessage = 'Insufficient balance to complete transaction';
      }
      
      throw new Error(`Send transaction failed: ${errorMessage}`);
    }
  }

  // ========================================
  // INSCRIPTION METHODS
  // ========================================

  async getInscriptions(offset = 0, limit = 100) {
    this.requireConnected();

    // Magic Eden wallet doesn't provide direct inscription access
    return { list: [], total: 0 };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async isHardware() {
    if (!this.walletInstance) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.walletInstance.isHardware();
    } catch (error) {
      console.warn('⚠️ isHardware method not supported:', error.message);
      return false;
    }
  }

  async call(method, params = {}) {
    if (!this.walletInstance || !this.walletInstance.call) {
      throw new Error('Magic Eden RPC call method not available');
    }

    try {
      console.log(`🔍 Magic Eden RPC call: ${method}`, params);
      const result = await this.walletInstance.call(method, params);
      console.log(`✅ Magic Eden RPC result:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Magic Eden RPC call failed:`, error);
      throw new Error(`RPC call failed: ${error.message}`);
    }
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================

  setupEventListeners() {
    if (!this.isInstalled()) return;
    
    const wallet = this.walletInstance;
    if (!wallet || !wallet.on) return;
    
    // Account changes
    wallet.on('accountsChanged', (accounts) => {
      console.log(`👤 Magic Eden accounts changed:`, accounts);
      
      if (!accounts || accounts.length === 0) {
        this.paymentAddress = null;
        this.ordinalsAddress = null;
        this.isConnected = false;
      } else {
        // Magic Eden returns address strings
        this.paymentAddress = accounts[0];
        this.ordinalsAddress = accounts[0];
      }
    });
    
    console.log(`✅ Magic Eden event listeners set up`);
  }

  removeEventListeners() {
    if (!this.isInstalled()) return;
    
    const wallet = this.walletInstance;
    if (wallet && wallet.removeAllListeners) {
      wallet.removeAllListeners('accountsChanged');
    }
  }
}

export default MagicEdenProvider;
