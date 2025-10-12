/**
 * Oyl Wallet Provider
 * Inscription Module #11 - Oyl Wallet
 * 
 * Purpose: Oyl wallet with taproot and native segwit support
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers)
 * Exports: OylProvider class
 * Size: ~340 lines, ~7KB brotli
 * 
 * API: window.oyl.getAddresses() returns {taproot: {address}, nativeSegwit: {address}}
 * Documentation: https://github.com/omnisat/lasereyes
 * 
 * Update this module to add new Oyl-specific features
 */

// Import from ordinal inscriptions
// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js';
import { normalizers } from './02-normalizers.js';


export class OylProvider extends BaseWalletProvider {
  constructor() {
    super('Oyl');
    this.paymentAddress = null;
    this.ordinalsAddress = null;
    
    this.walletInstance = typeof window !== 'undefined' ? window.oyl : null;
    
    // Feature flags - Oyl capabilities
    this.features = {
      connect: true,
      getAddress: true,
      getPublicKey: false,
      getBalance: true,
      getNetwork: true,
      switchNetwork: true,
      signMessage: true,
      signPsbt: true,
      signPsbts: true,
      pushPsbt: true,
      pushTx: false,
      sendBitcoin: true,
      sendInscription: false,
      getInscriptions: true,
      getAllInscriptions: true,
      inscribe: false,
      brc20: { transfer: false, deploy: false, mint: false },
      runes: { send: false, mint: false, etch: false },
      atomicals: { transfer: false, mint: false },
      arc20: { transfer: false },
      relayProvider: true       // sendToRelayProvider() available
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
      console.log('🔍 Connecting to Oyl wallet...');
      const provider = this.walletInstance;
      
      // Oyl wallet uses getAddresses() which returns structured object:
      // { taproot: { address, publicKey }, nativeSegwit: { address, publicKey } }
      const accounts = await provider.getAddresses();
      
      console.log('🔍 Oyl addresses:', accounts);
      
      if (!accounts) {
        throw new Error('No response from Oyl wallet');
      }
      
      // Oyl returns structured object with taproot and nativeSegwit properties
      if (accounts.taproot && accounts.taproot.address) {
        this.address = accounts.taproot.address; // Use taproot (ordinals) as primary
        this.ordinalsAddress = accounts.taproot.address;
        this.publicKey = accounts.taproot.publicKey;
      }
      
      if (accounts.nativeSegwit && accounts.nativeSegwit.address) {
        this.paymentAddress = accounts.nativeSegwit.address;
        
        // If no taproot, use nativeSegwit as fallback
        if (!this.address) {
          this.address = accounts.nativeSegwit.address;
        }
      }
      
      if (!this.address) {
        throw new Error('No valid address returned from Oyl wallet');
      }
      
      this.isConnected = true;
      
      console.log('✅ Oyl connected:');
      console.log('   Taproot (Ordinals):', this.ordinalsAddress);
      console.log('   Native SegWit (Payment):', this.paymentAddress);
      
      return { 
        address: this.address,
        ordinalsAddress: this.ordinalsAddress,
        paymentAddress: this.paymentAddress,
        publicKey: this.publicKey
      };
    } catch (error) {
      console.error('❌ Oyl connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    this.requireInstalled();

    await this.walletInstance.disconnect();
    this.isConnected = false;
    this.address = null;
    this.ordinalsAddress = null;
    this.paymentAddress = null;
    console.log('✅ Oyl disconnected');
  }

  async isConnectedCheck() {
    if (!this.isInstalled()) {
      return false;
    }

    try {
      return await this.walletInstance.isConnected();
    } catch (error) {
      return this.isConnected;
    }
  }

  async getAddress() {
    this.requireConnected();
    
    try {
      // Oyl uses getAddresses() not getAccounts()
      const accounts = await this.walletInstance.getAddresses();
      
      // Return taproot address (ordinals address)
      if (accounts && accounts.taproot && accounts.taproot.address) {
        return accounts.taproot.address;
      }
      
      // Fallback to stored address
      return this.address;
    } catch (error) {
      console.error('❌ Failed to get address:', error);
      return this.address;
    }
  }

  async getAccounts() {
    this.requireInstalled();

    try {
      // Oyl uses getAddresses() which returns structured object
      const addresses = await this.walletInstance.getAddresses();
      
      if (addresses && addresses.taproot) {
        return [addresses.taproot.address, addresses.nativeSegwit.address];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to get accounts:', error);
      throw error;
    }
  }

  async getBalance() {
    this.requireConnected();

    try {
      // Check if Oyl supports getBalance
      if (typeof this.walletInstance.getBalance === 'function') {
        const balance = await this.walletInstance.getBalance();
        return normalizers.balance(balance, 'Oyl');
      }
      
      throw new Error('Oyl wallet does not support balance fetching');
    } catch (error) {
      throw new Error(`Failed to get Oyl balance: ${error.message}`);
    }
  }

  async getNetwork() {
    this.requireInstalled();

    try {
      if (typeof this.walletInstance.getNetwork === 'function') {
        const network = await this.walletInstance.getNetwork();
        return normalizers.network(network);
      }
      return 'livenet';
    } catch (error) {
      console.error('❌ Failed to get network:', error);
      return 'livenet';
    }
  }

  async switchNetwork(network) {
    this.requireInstalled();
    await this.walletInstance.switchNetwork(network);
    console.log(`✅ Switched to network: ${network}`);
  }

  // ========================================
  // SIGNING METHODS
  // ========================================

  async signMessage(message) {
    this.requireConnected();
    return await this.walletInstance.signMessage(message);
  }

  async signPsbt(psbtHex) {
    this.requireConnected();
    return await this.walletInstance.signPsbt(psbtHex);
  }

  async signPsbts(psbtHexs) {
    this.requireConnected();
    return await this.walletInstance.signPsbts(psbtHexs);
  }

  async pushPsbt(psbtHex) {
    this.requireConnected();
    const txid = await this.walletInstance.pushPsbt(psbtHex);
    console.log('✅ PSBT pushed:', txid);
    return txid;
  }

  // ========================================
  // TRANSACTION METHODS
  // ========================================

  async sendBitcoin(toAddress, amount) {
    this.requireConnected();

    // Check if Oyl actually supports this
    if (typeof this.walletInstance.sendBitcoin !== 'function') {
      console.warn('⚠️ Oyl wallet may not support sendBitcoin directly');
      throw new Error(
        'Oyl wallet does not support sendBitcoin() method.\n' +
        'Use sendToRelayProvider() or external transaction building.'
      );
    }
    
    try {
      const txid = await this.walletInstance.sendBitcoin(toAddress, amount);
      console.log('✅ Transaction sent:', txid);
      return txid;
    } catch (error) {
      console.error('❌ Failed to send Bitcoin:', error);
      throw error;
    }
  }

  // ========================================
  // INSCRIPTION METHODS
  // ========================================

  async getInscriptions(offset = 0, limit = 100) {
    this.requireConnected();

    try {
      // Check if Oyl supports getInscriptions
      if (typeof this.walletInstance.getInscriptions !== 'function') {
        console.warn('⚠️ Oyl wallet does not support inscription fetching');
        return { list: [], total: 0 };
      }
      
      const response = await this.walletInstance.getInscriptions(offset, limit);
      
      // Handle both array and object responses
      const inscriptions = Array.isArray(response) ? response : (response.list || []);
      
      return {
        list: inscriptions.map(i => normalizers.inscription(i, 'Oyl')),
        total: inscriptions.length
      };
    } catch (error) {
      console.error('❌ Failed to fetch Oyl inscriptions:', error);
      return { list: [], total: 0 };
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async sendToRelayProvider(data) {
    this.requireInstalled();
    
    if (typeof this.walletInstance.sendToRelayProvider !== 'function') {
      throw new Error('Oyl wallet does not support sendToRelayProvider()');
    }
    
    return await this.walletInstance.sendToRelayProvider(data);
  }
}

export default OylProvider;
