/**
 * OKX Wallet Provider
 * Inscription Module #6 - OKX Wallet
 * 
 * Purpose: OKX wallet with comprehensive Bitcoin features
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers)
 * Exports: OKXProvider class
 * Size: ~400 lines, ~9KB brotli
 * 
 * Documentation: https://www.okx.com/web3/build/docs/sdks/chains/bitcoin/provider
 * 
 * Update this module to add new OKX-specific features
 */

// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js';
import { normalizers } from './02-normalizers.js';


export class OKXProvider extends BaseWalletProvider {
  constructor() {
    super('OKX');
    
    this.walletInstance = typeof window !== 'undefined' ? window.okxwallet?.bitcoin : null;
    
    this.features = {
      connect: true,
      getAddress: false, // OKX doesn't have getAddress() - use getAccounts() instead
      getPublicKey: true,
      getBalance: true,
      getNetwork: true,
      switchNetwork: false,
      signMessage: true,
      signPsbt: true,
      signPsbts: true, // Available in v2.77.1+
      pushPsbt: true, // Available in v6.51.0+ and v2.77.1+
      pushTx: true, // Available in v6.51.0+ and v2.77.1+
      sendBitcoin: true,
      sendInscription: true,
      getInscriptions: true,
      getAllInscriptions: true,
      inscribe: true,
      brc20: { transfer: true, deploy: true, mint: true }, // All available via mint()
      runes: { send: false, mint: false, etch: false },
      atomicals: { transfer: false, mint: false },
      arc20: { transfer: false }
    };
  }

  isInstalled() {
    return !!this.walletInstance;
  }

  async connect() {
    this.requireInstalled();
    
    const result = await this.walletInstance.connect();
    this.address = result.address || result;
    this.publicKey = result.publicKey;
    this.isConnected = true;
    
    console.log('✅ OKX connected:', this.address);
    return result;
  }

  async getAddress() {
    this.requireConnected();
    // OKX doesn't have a getAddress() method - use getAccounts() instead
    const accounts = await this.walletInstance.getAccounts();
    return accounts && accounts.length > 0 ? accounts[0] : this.address;
  }

  async getPublicKey() {
    this.requireConnected();
    return await this.walletInstance.getPublicKey();
  }

  async getBalance() {
    this.requireConnected();
    const balance = await this.walletInstance.getBalance();
    return normalizers.balance(balance, 'OKX');
  }

  async getNetwork() {
    this.requireInstalled();
    const network = await this.walletInstance.getNetwork();
    return normalizers.network(network);
  }

  async signMessage(message, type = 'ecdsa') {
    this.requireConnected();
    return await this.walletInstance.signMessage(message, type);
  }

  async signPsbt(psbtHex, options = {}) {
    this.requireConnected();
    
    // OKX signPsbt default autoFinalized is true in v2.77.1+
    console.log('🔏 OKX: Signing PSBT...');
    const signedPsbt = await this.walletInstance.signPsbt(psbtHex, options);
    console.log('✅ OKX PSBT signed');
    return signedPsbt;
  }

  async signPsbts(psbtHexs, options = []) {
    this.requireConnected();
    
    console.log('🔏 OKX: Signing multiple PSBTs...');
    const signedPsbts = await this.walletInstance.signPsbts(psbtHexs, options);
    console.log('✅ OKX PSBTs signed');
    return signedPsbts;
  }

  async pushPsbt(psbtHex) {
    this.requireConnected();
    
    console.log('📤 OKX: Pushing PSBT...');
    const txid = await this.walletInstance.pushPsbt(psbtHex);
    console.log('✅ PSBT pushed:', txid);
    return txid;
  }

  async pushTx(rawTx) {
    this.requireConnected();
    
    console.log('📤 OKX: Pushing raw transaction...');
    const txid = await this.walletInstance.pushTx(rawTx);
    console.log('✅ Transaction pushed:', txid);
    return txid;
  }

  async sendBitcoin(toAddress, satoshis) {
    this.requireConnected();
    
    // Validate Bitcoin address format
    if (!toAddress || typeof toAddress !== 'string') {
      throw new Error('Invalid recipient address: must be a non-empty string');
    }
    
    // Basic Bitcoin address validation
    const addressRegex = /^(bc1|[13]|tb1|[mn2])[a-zA-HJ-NP-Z0-9]{25,87}$/;
    if (!addressRegex.test(toAddress)) {
      throw new Error('Invalid Bitcoin address format');
    }
    
    if (!satoshis || satoshis <= 0) {
      throw new Error('Invalid amount: must be positive number in satoshis');
    }
    
    const txid = await this.walletInstance.sendBitcoin(toAddress, satoshis);
    console.log('✅ Transaction sent:', txid);
    return txid;
  }

  async sendInscription(toAddress, inscriptionId, options = {}) {
    this.requireConnected();
    const txid = await this.walletInstance.sendInscription(toAddress, inscriptionId, options);
    console.log('✅ Inscription sent:', txid);
    return txid;
  }

  async getInscriptions(cursor = 0, size = 100) {
    this.requireConnected();
    
    const result = await this.walletInstance.getInscriptions(cursor, size);
    
    if (result && result.list) {
      return {
        list: result.list.map(i => normalizers.inscription(i, 'OKX')),
        total: result.total
      };
    }
    
    return { list: [], total: 0 };
  }

  async inscribe(content, options = {}) {
    this.requireConnected();

    // OKX has two different inscription methods:
    // 1. inscribe({ type, from, tick }) - Only for BRC-20 transfers
    // 2. mint({ type, from, inscriptions }) - For general inscriptions
    
    // If content is a simple string and looks like a BRC-20 ticker, use inscribe()
    if (typeof content === 'string' && content.length <= 5 && !options.contentType && !options.receiveAddress) {
      console.log('🎫 OKX: Creating BRC-20 transfer inscription for ticker:', content);
      // OKX inscribe() expects an OBJECT with type, from, and tick
      return await this.walletInstance.inscribe({
        type: 51, // Type 51 for BRC-20 transfer
        from: this.address,
        tick: content
      });
    }
    
    // Otherwise, use mint() for general inscriptions
    // OKX mint() expects: { type, from, inscriptions: [{ contentType, body }] }
    console.log('🎨 OKX: Creating general inscription via mint()');
    
    const inscription = {
      contentType: options.contentType || 'text/plain;charset=utf-8',
      body: content // OKX uses 'body' not 'content'
    };
    
    const mintPayload = {
      type: 61, // Type 61 for plain text (60=deploy, 50=mint, 51=transfer, 62=image)
      from: this.address, // Required parameter
      inscriptions: [inscription] // Array of inscriptions (supports batch)
    };
    
    console.log('🔍 OKX mint payload:', mintPayload);
    return await this.walletInstance.mint(mintPayload);
  }

  async inscribeTransfer(ticker, amount) {
    this.requireConnected();
    // OKX inscribe() method for BRC-20 transfers
    // Expects: { type: 51, from: address, tick: ticker }
    const result = await this.walletInstance.inscribe({
      type: 51, // Type 51 for BRC-20 transfer
      from: this.address,
      tick: ticker
    });
    console.log('✅ BRC-20 transfer inscribed:', result);
    return result;
  }

  async getAccounts() {
    this.requireInstalled();
    return await this.walletInstance.getAccounts();
  }

  async splitUtxo(options) {
    this.requireConnected();
    return await this.walletInstance.splitUtxo(options);
  }

  async transferNft(toAddress, inscriptionId) {
    this.requireConnected();
    return await this.walletInstance.transferNft(toAddress, inscriptionId);
  }

  async watchAsset(assetOptions) {
    this.requireInstalled();
    return await this.walletInstance.watchAsset(assetOptions);
  }

  async mint(options) {
    this.requireConnected();
    // Ensure 'from' parameter is set
    if (!options.from) {
      options.from = this.address;
    }
    return await this.walletInstance.mint(options);
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
      console.log(`👤 OKX accounts changed:`, accounts);
      
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
      console.log(`🌐 OKX network changed:`, network);
    });
    
    console.log(`✅ OKX event listeners set up`);
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

export default OKXProvider;
