/**
 * UniSat Wallet Provider
 * Inscription Module #4 - UniSat Wallet
 * 
 * Purpose: UniSat wallet with BRC-20 and Runes support
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers)
 * Exports: UniSatProvider class
 * Size: ~400 lines, ~8KB brotli
 * 
 * Documentation: https://docs.unisat.io/dev/unisat-developer-service/unisat-wallet
 * 
 * Update this module to add new UniSat-specific features
 */

// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js'; 
import { normalizers } from './02-normalizers.js'; 

export class UniSatProvider extends BaseWalletProvider {
  constructor() {
    super('UniSat');
    
    // UniSat wallet detection
    this.walletInstance = typeof window !== 'undefined' ? window.unisat : null;
    
    // Set feature flags
    this.features = {
      connect: true,
      getAddress: true,
      getPublicKey: true,
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
      inscribe: true,
      brc20: {
        transfer: true,
        deploy: false,
        mint: false,
        list: true              // ✅ NEW: getBRC20List support
      },
      runes: {
        send: true,
        mint: false,
        etch: false
      },
      atomicals: {
        transfer: false,
        mint: false
      },
      arc20: {
        transfer: false
      }
    };
  }

  isInstalled() {
    return !!this.walletInstance;
  }

  // ========================================
  // CONNECTION METHODS (using base class helpers)
  // ========================================

  async connect() {
    this.requireInstalled();
    
    const accounts = await this.walletInstance.requestAccounts();
    if (accounts && accounts.length > 0) {
      this.address = accounts[0];
      this.isConnected = true;
      console.log(`✅ UniSat connected: ${this.address}`);
      return { address: this.address };
    }
    
    throw new Error('Failed to connect to UniSat wallet');
  }

  async getAddress() {
    this.requireInstalled();
    this.requireConnected();
    // UniSat doesn't have getAddress() - it stores address during connect
    // Return the stored address or get accounts[0]
    if (this.address) {
      return this.address;
    }
    // Fallback: get from accounts
    const accounts = await this.walletInstance.getAccounts();
    return accounts && accounts.length > 0 ? accounts[0] : null;
  }

  async getPublicKey() {
    this.requireConnected();
    return await this.walletInstance.getPublicKey();
  }

  async getBalance() {
    this.requireConnected();
    const balance = await this.walletInstance.getBalance();
    return normalizers.balance(balance, 'UniSat');
  }

  // ========================================
  // NETWORK METHODS
  // ========================================

  async getNetwork() {
    this.requireInstalled();
    const network = await this.walletInstance.getNetwork();
    return normalizers.network(network);
  }

  async switchNetwork(network) {
    this.requireInstalled();
    await this.walletInstance.switchNetwork(network);
    console.log(`✅ Switched to ${network}`);
  }

  async getChain() {
    this.requireInstalled();
    return await this.walletInstance.getChain();
  }

  async switchChain(chain) {
    this.requireInstalled();
    await this.walletInstance.switchChain(chain);
    console.log(`✅ Switched to chain: ${chain}`);
  }

  // ========================================
  // SIGNING METHODS
  // ========================================

  async signMessage(message, type = 'ecdsa') {
    this.requireConnected();
    return await this.walletInstance.signMessage(message, type);
  }

  async multiSignMessage(messages, type = 'ecdsa') {
    this.requireConnected();
    return await this.walletInstance.multiSignMessage(messages, type);
  }

  async signData(data, type = 'ecdsa') {
    this.requireConnected();
    return await this.walletInstance.signData(data, type);
  }

  async signPsbt(psbtHex, options = {}) {
    this.requireConnected();
    
    if (!psbtHex || typeof psbtHex !== 'string') {
      throw new Error('Invalid PSBT: must be a non-empty string');
    }

    console.log('🔏 UniSat: Signing PSBT...');
    const signedPsbt = await this.walletInstance.signPsbt(psbtHex);
    
    if (!signedPsbt) {
      throw new Error('No signed PSBT returned from UniSat');
    }

    console.log('✅ UniSat PSBT signed successfully');
    return signedPsbt;
  }

  async signPsbts(psbtHexs, options = []) {
    this.requireConnected();
    return await this.walletInstance.signPsbts(psbtHexs, options);
  }

  async pushPsbt(psbtHex) {
    this.requireConnected();
    const txid = await this.walletInstance.pushPsbt(psbtHex);
    console.log('✅ PSBT pushed:', txid);
    return txid;
  }

  async verifyMessageOfBIP322Simple(address, message, signature) {
    this.requireInstalled();
    return await this.walletInstance.verifyMessageOfBIP322Simple(address, message, signature);
  }

  // ========================================
  // TRANSACTION METHODS
  // ========================================

  async sendBitcoin(toAddress, amount) {
    this.requireConnected();
    const txid = await this.walletInstance.sendBitcoin(toAddress, amount);
    console.log('✅ Transaction sent:', txid);
    return txid;
  }

  async getBitcoinUtxos() {
    this.requireConnected();
    return await this.walletInstance.getBitcoinUtxos();
  }

  // ========================================
  // INSCRIPTION METHODS
  // ========================================

  async getInscriptions(cursor = 0, size = 100) {
    this.requireConnected();

    const result = await this.walletInstance.getInscriptions(cursor, size);
    
    // UniSat returns {total: number, list: Array}
    if (result && result.list) {
      console.log(`📦 UniSat returned ${result.list.length} of ${result.total} total inscriptions`);
      
      // Normalize inscriptions using normalizers
      return {
        list: result.list.map(inscription => normalizers.inscription(inscription, 'UniSat')),
        total: result.total
      };
    }
    
    return { list: [], total: 0 };
  }

  // getAllInscriptions() inherited from BaseWalletProvider with automatic pagination

  async inscribe(content, options = {}) {
    this.requireConnected();

    const {
      contentType = 'text/plain;charset=utf-8',
      metadata
    } = options;

    // UniSat primarily supports BRC-20 inscriptions via inscribeTransfer
    if (contentType.includes('brc-20') || (metadata && metadata.brc20)) {
      const brc20Data = metadata.brc20 || JSON.parse(content);
      return await this.inscribeTransfer(brc20Data.tick, brc20Data.amt);
    }

    // For other content types, inform user
    throw new Error(
      'UniSat wallet only supports BRC-20 transfer inscriptions via API. ' +
      'For other inscriptions (images, text, HTML), please use https://unisat.io/inscribe'
    );
  }

  async inscribeTransfer(ticker, amount) {
    this.requireConnected();
    const txid = await this.walletInstance.inscribeTransfer(ticker, amount);
    console.log('✅ BRC-20 transfer inscribed:', txid);
    return txid;
  }

  /**
   * Get BRC-20 token balances
   * @returns {Promise<Array>} Array of BRC-20 token balances
   */
  async getBRC20List() {
    this.requireConnected();
    
    try {
      // UniSat may have getBRC20Summary or similar method
      if (this.walletInstance.getBRC20Summary) {
        return await this.walletInstance.getBRC20Summary();
      }
      
      // Fallback: return empty array if method doesn't exist
      console.warn('⚠️ UniSat BRC-20 listing not available in this wallet version');
      return [];
    } catch (error) {
      console.error('❌ Failed to get BRC-20 list:', error);
      throw error;
    }
  }

  // ========================================
  // RUNES METHODS
  // ========================================

  async sendRunes(toAddress, runeName, amount) {
    this.requireConnected();
    const txid = await this.walletInstance.sendRunes(toAddress, runeName, amount);
    console.log('✅ Runes sent:', txid);
    return txid;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async getAccounts() {
    this.requireInstalled();
    return await this.walletInstance.getAccounts();
  }

  async getVersion() {
    this.requireInstalled();
    return await this.walletInstance.getVersion();
  }

  async getBalanceV2() {
    this.requireConnected();
    return await this.walletInstance.getBalanceV2();
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================
  // EVENT LISTENERS
  // ========================================

  setupEventListeners() {
    if (!this.isInstalled()) return;
    
    const wallet = this.walletInstance;
    if (!wallet || !wallet.on) return;
    
    // Account changes
    wallet.on('accountsChanged', (accounts) => {
      console.log(`👤 UniSat accounts changed:`, accounts);
      
      if (!accounts || accounts.length === 0) {
        this.address = null;
        this.publicKey = null;
        this.isConnected = false;
      } else {
        this.address = accounts[0];
      }
    });
    
    // Network changes
    wallet.on('networkChanged', (network) => {
      console.log(`🌐 UniSat network changed:`, network);
    });
    
    console.log(`✅ UniSat event listeners set up`);
  }

  removeEventListeners() {
    if (!this.isInstalled()) return;
    
    const wallet = this.walletInstance;
    if (wallet && wallet.removeAllListeners) {
      wallet.removeAllListeners('accountsChanged');
      wallet.removeAllListeners('networkChanged');
    }
  }
}

export default UniSatProvider;
