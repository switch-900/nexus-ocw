/**
 * Phantom Wallet Provider
 * Inscription Module #8 - Phantom Wallet
 * 
 * Purpose: Phantom wallet with limited Bitcoin support
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers)
 * Exports: PhantomProvider class
 * Size: ~240 lines, ~5KB brotli
 * 
 * Documentation: https://docs.phantom.app/bitcoin/
 * 
 * Update this module to add new Phantom-specific features
 */

// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js';


export class PhantomProvider extends BaseWalletProvider {
  constructor() {
    super('Phantom');
    this.publicKey = null;
    
    this.walletInstance = typeof window !== 'undefined' ? window.phantom?.bitcoin : null;
    
    // Feature flags - Phantom ONLY supports these Bitcoin features:
    this.features = {
      connect: true,
      getAddress: true,
      getPublicKey: true,
      getBalance: true,
      getNetwork: true,
      signMessage: true,
      signPsbt: true,              // signPSBT (uppercase) supported
      sendBitcoin: true,
      eventListeners: true
    };
  }

  isInstalled() {
    return !!this.walletInstance;
  }

  // ========================================
  // CONNECTION METHODS
  // ========================================

  async connect() {
    this.requireInstalled();

    try {
      const response = await this.walletInstance.requestAccounts();
      
      if (!response || !Array.isArray(response) || response.length === 0 || !response[0] || !response[0].address) {
        throw new Error('No address returned from Phantom wallet');
      }
      
      this.address = response[0].address;
      this.publicKey = response[0].publicKey;
      this.isConnected = true;
      
      console.log('✅ Phantom connected:', {
        address: this.address,
        publicKey: this.publicKey
      });
      
      return { 
        address: this.address,
        publicKey: this.publicKey
      };
    } catch (error) {
      console.error('❌ Phantom connection failed:', error);
      throw error;
    }
  }

  async getAddress() {
    this.requireConnected();
    
    try {
      const accounts = await this.walletInstance.getAccounts();
      return accounts[0].address;
    } catch (error) {
      console.error('❌ Failed to get address:', error);
      return this.address;
    }
  }

  async getPublicKey() {
    this.requireConnected();
    return this.publicKey;
  }

  async getAccounts() {
    this.requireConnected();

    try {
      // Phantom Bitcoin API doesn't have getAccounts, but we can return the current address
      return [this.address];
    } catch (error) {
      console.error('❌ Failed to get accounts:', error);
      throw error;
    }
  }

  // ========================================
  // SIGNING METHODS
  // ========================================

  async signMessage(message) {
    this.requireConnected();

    try {
      const signature = await this.walletInstance.signMessage(message);
      // Handle both formats: string or {signature: string}
      return typeof signature === 'string' ? signature : signature.signature;
    } catch (error) {
      console.error('❌ Failed to sign message:', error);
      throw error;
    }
  }

  async signPsbt(psbtHex, options = {}) {
    this.requireConnected();

    try {
      // Phantom has two methods: signPsbt and signPSBT (uppercase)
      let signedPsbt;
      
      if (this.walletInstance.signPSBT) {
        // Try uppercase version first (newer API)
        signedPsbt = await this.walletInstance.signPSBT(psbtHex, options);
      } else if (this.walletInstance.signPsbt) {
        // Fallback to lowercase version
        signedPsbt = await this.walletInstance.signPsbt(psbtHex);
      } else {
        throw new Error('No PSBT signing method available');
      }
      
      // Handle both formats: string or {signedPsbtHex: string}
      return typeof signedPsbt === 'string' ? signedPsbt : signedPsbt.signedPsbtHex;
    } catch (error) {
      console.error('❌ Failed to sign PSBT:', error);
      throw error;
    }
  }

  // ========================================
  // BALANCE & NETWORK METHODS
  // ========================================

  async getBalance() {
    this.requireConnected();
    
    try {
      // Phantom Bitcoin API doesn't have direct getBalance
      // We need to work with what's available or return a placeholder
      console.warn('⚠️ Phantom Bitcoin API has limited balance support');
      return {
        confirmed: 0,
        unconfirmed: 0, 
        total: 0
      };
    } catch (error) {
      console.error('❌ Failed to get balance:', error);
      throw error;
    }
  }

  async getNetwork() {
    this.requireInstalled();
    
    try {
      const network = await this.walletInstance.getNetwork();
      return network;
    } catch (error) {
      console.error('❌ Failed to get network:', error);
      return 'mainnet';
    }
  }

  // ========================================
  // TRANSACTION METHODS
  // ========================================

  async sendBitcoin(recipientAddress, amount, options = {}) {
    this.requireConnected();
    
    try {
      const response = await this.walletInstance.sendTransfer({
        recipientAddress,
        amount,
        ...options
      });
      
      console.log('✅ Transaction sent:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send Bitcoin:', error);
      throw error;
    }
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================

  setupEventListeners() {
    if (!this.isInstalled()) {
      return;
    }

    // Listen for account changes
    this.walletInstance.on('accountsChanged', (accounts) => {
      console.log('👤 Phantom accounts changed:', accounts);
      if (accounts && accounts.length > 0) {
        this.address = accounts[0].address;
        this.publicKey = accounts[0].publicKey;
      } else {
        this.address = null;
        this.publicKey = null;
        this.isConnected = false;
      }
    });

    console.log('✅ Phantom event listeners set up');
  }

  removeEventListeners() {
    if (!this.isInstalled()) {
      return;
    }

    // Remove all event listeners
    this.walletInstance.removeAllListeners('accountsChanged');
    console.log('✅ Phantom event listeners removed');
  }
}

export default PhantomProvider;
