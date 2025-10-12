/**
 * Wizz Wallet Provider
 * Inscription Module #9 - Wizz Wallet
 * 
 * Purpose: Wizz wallet with multi-protocol support (BRC-20, ARC-20, Atomicals, Runes)
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers)
 * Exports: WizzProvider class
 * Size: ~600 lines, ~12KB brotli
 * 
 * Documentation: https://wizzwallet.io/docs
 * 
 * Update this module to add new Wizz-specific features
 */

// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js';
import { normalizers } from './02-normalizers.js';


export class WizzProvider extends BaseWalletProvider {
  constructor() {
    super('Wizz');
    
    this.walletInstance = typeof window !== 'undefined' ? window.wizz : null;
    
    // Feature flags - Wizz capabilities (most advanced multi-protocol)
    this.features = {
      connect: true,
      getAddress: true,
      getPublicKey: true,
      getBalance: true,
      getNetwork: true,
      switchNetwork: true,
      signMessage: true,
      signPsbt: true,
      signPsbts: false,
      pushPsbt: true,
      pushTx: false,
      sendBitcoin: true,
      sendInscription: false,
      getInscriptions: true,
      getAllInscriptions: true,
      inscribe: true,
      brc20: { transfer: true, deploy: true, mint: true },
      runes: { send: true, mint: false, etch: false },
      atomicals: { transfer: true, mint: true },
      arc20: { transfer: true },
      biHelix: true,            // BiHelix support (UNIQUE to Wizz)
      cpfp: true,               // CPFP support (requestCPFP)
      mempoolInjection: true,   // injectMempool() (UNIQUE to Wizz)
      bip322: true              // BIP322 message verification
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
      console.log('🔍 Connecting to Wizz wallet...');
      const provider = this.walletInstance;
      
      // Wizz returns simple array of address strings OR object with address + publicKey
      let result = null;
      
      if (typeof provider.connect === 'function') {
        console.log('🔍 Using connect() method...');
        result = await provider.connect();
      }
      else if (typeof provider.requestAccounts === 'function') {
        console.log('🔍 Using requestAccounts() method...');
        result = await provider.requestAccounts();
      }
      else if (typeof provider.getAccounts === 'function') {
        console.log('🔍 Using getAccounts() method...');
        result = await provider.getAccounts();
      }
      else {
        throw new Error('Wizz wallet has no connection methods available');
      }
      
      console.log('🔍 Wizz result:', result);
      
      if (!result) {
        throw new Error('No response from Wizz wallet');
      }
      
      // Handle response format
      if (typeof result === 'object' && result.address) {
        // Object format: {address: "...", publicKey: "..."}
        this.address = result.address;
        this.publicKey = result.publicKey;
      } else if (Array.isArray(result) && result.length > 0) {
        // Array format: ["bc1q..."]
        this.address = result[0];
      } else if (typeof result === 'string') {
        // String format: "bc1q..."
        this.address = result;
      } else {
        throw new Error('Unexpected response format from Wizz wallet');
      }
      
      if (!this.address) {
        throw new Error('Could not extract address from Wizz response');
      }
      
      // Try to get publicKey if not already set
      if (!this.publicKey && typeof provider.getPublicKey === 'function') {
        try {
          this.publicKey = await provider.getPublicKey();
          console.log('   📝 Retrieved Public Key:', this.publicKey);
        } catch (e) {
          console.warn('⚠️ Could not get public key:', e.message);
        }
      }
      
      this.isConnected = true;
      
      console.log('✅ Wizz connected:', this.address);
      if (this.publicKey) console.log('   Public Key:', this.publicKey);
      
      return { 
        address: this.address,
        publicKey: this.publicKey
      };
    } catch (error) {
      console.error('❌ Wizz connection failed:', error);
      
      // Provide helpful error messages
      if (error.code === -32603) {
        throw new Error('Wizz wallet error: Please unlock your wallet and refresh the page');
      }
      
      if (error.message?.includes('User rejected')) {
        throw new Error('Connection request was rejected');
      }
      
      throw error;
    }
  }

  async getAddress() {
    this.requireConnected();
    const accounts = await this.walletInstance.getAccounts();
    return accounts[0];
  }

  async getPublicKey() {
    this.requireConnected();
    return await this.walletInstance.getPublicKey();
  }

  async getAccounts() {
    this.requireInstalled();
    return await this.walletInstance.getAccounts();
  }

  async getBalance() {
    this.requireConnected();

    const balance = await this.walletInstance.getBalance();
    return normalizers.balance(balance, 'Wizz');
  }

  async getNetwork() {
    this.requireInstalled();

    try {
      const network = await this.walletInstance.getNetwork();
      return normalizers.network(network);
    } catch (error) {
      console.error('❌ Failed to get network:', error);
      return 'livenet';
    }
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

  async verifyMessage(message, signature, address) {
    this.requireInstalled();
    return await this.walletInstance.verifyMessage(message, signature, address);
  }

  async verifyMessageOfBIP322Simple(address, message, signature) {
    this.requireInstalled();
    return await this.walletInstance.verifyMessageOfBIP322Simple(address, message, signature);
  }

  async signPsbt(psbtHex, options = {}) {
    this.requireConnected();
    return await this.walletInstance.signPsbt(psbtHex, options);
  }

  async pushPsbt(psbtHex) {
    this.requireConnected();
    const txid = await this.walletInstance.pushPsbt(psbtHex);
    console.log('✅ PSBT broadcasted:', txid);
    return txid;
  }

  // ========================================
  // TRANSACTION METHODS
  // ========================================

  async sendBitcoin(toAddress, amount, options = {}) {
    this.requireConnected();
    const txid = await this.walletInstance.sendBitcoin(toAddress, amount, options);
    console.log('✅ Transaction sent:', txid);
    return txid;
  }

  async getBitcoinUtxos() {
    this.requireConnected();
    return await this.walletInstance.getBitcoinUtxos();
  }

  async injectMempool(txHex) {
    this.requireConnected();
    return await this.walletInstance.injectMempool(txHex);
  }

  async requestCPFP(txid) {
    this.requireConnected();
    const newTxid = await this.walletInstance.requestCPFP(txid);
    console.log('✅ CPFP transaction created:', newTxid);
    return newTxid;
  }

  // ========================================
  // INSCRIPTION METHODS
  // ========================================

  async getInscriptions(offset = 0, limit = 100) {
    this.requireConnected();

    try {
      const provider = this.walletInstance;
      let inscriptions = [];
      
      // Try different methods to get inscriptions
      if (typeof provider.getInscriptions === 'function') {
        console.log('📦 Using getInscriptions method...');
        const response = await provider.getInscriptions(offset, limit);
        
        // Handle different response formats
        if (Array.isArray(response)) {
          inscriptions = response;
        } else if (response && response.list) {
          inscriptions = response.list;
        } else if (response && response.inscriptions) {
          inscriptions = response.inscriptions;
        } else if (response && response.result) {
          inscriptions = response.result.inscriptions || response.result.list || [];
        }
      }
      else if (typeof provider.getOrdinals === 'function') {
        console.log('📦 Using getOrdinals method...');
        const response = await provider.getOrdinals(offset, limit);
        inscriptions = Array.isArray(response) ? response : (response.list || response.inscriptions || []);
      }
      else {
        console.warn('⚠️ Wizz does not support inscription fetching');
        return { list: [], total: 0 };
      }

      console.log(`📦 Wizz returned ${inscriptions.length} inscriptions`);

      return {
        list: inscriptions.map(i => normalizers.inscription(i, 'Wizz')),
        total: inscriptions.length
      };
    } catch (error) {
      console.error('❌ Failed to fetch Wizz inscriptions:', error);
      return { list: [], total: 0 };
    }
  }

  async getInscriptionsByAddress(address, offset = 0, limit = 100) {
    this.requireInstalled();
    return await this.walletInstance.getInscriptionsByAddress(address, offset, limit);
  }

  async getAssets() {
    this.requireConnected();
    return await this.walletInstance.getAssets();
  }

  async inscribe(content, options = {}) {
    this.requireConnected();

    try {
      const {
        contentType = 'text/plain;charset=utf-8',
        encoding = 'utf8',
        feeRate,
        receiveAddress,
        serviceFee = 0,
        metadata
      } = options;

      const inscriptionOptions = {
        type: 61, // Default to plain text/general
        from: this.address,
        inscriptions: [{
          contentType,
          body: content
        }]
      };

      // Add fee rate if specified
      if (feeRate) {
        inscriptionOptions.feeRate = feeRate;
      }

      // For BRC-20, use appropriate type
      if (contentType.includes('brc-20') || (metadata && metadata.brc20)) {
        inscriptionOptions.type = 51; // BRC-20 transfer
        const brc20Data = metadata.brc20 || JSON.parse(content);
        inscriptionOptions.tick = brc20Data.tick;
      }

      // For images, use image type
      if (contentType.startsWith('image/')) {
        inscriptionOptions.type = 62;
      }

      const result = await this.walletInstance.inscribe(inscriptionOptions);
      console.log('✅ Wizz inscription created:', result);
      
      return {
        inscriptionId: result.inscriptionId || result.revealTxs?.[0],
        txId: result.commitTx || result.txId,
        revealTxIds: result.revealTxs,
        commitTxFee: result.commitTxFee,
        revealTxFees: result.revealTxFees
      };
    } catch (error) {
      console.error('❌ Wizz inscribe error:', error);
      throw new Error(`Inscription failed: ${error.message}`);
    }
  }

  async requestMint(mintData) {
    this.requireConnected();
    return await this.walletInstance.requestMint(mintData);
  }

  // ========================================
  // PROTOCOL-SPECIFIC METHODS
  // ========================================

  // ARC-20 Methods
  async sendARC20(toAddress, ticker, amount) {
    this.requireConnected();
    const txid = await this.walletInstance.sendARC20(toAddress, ticker, amount);
    console.log('✅ ARC-20 sent:', txid);
    return txid;
  }

  // Atomicals Methods
  async sendAtomicals(atomicalsData) {
    this.requireConnected();
    const txid = await this.walletInstance.sendAtomicals(atomicalsData);
    console.log('✅ Atomicals sent:', txid);
    return txid;
  }

  async isAtomicalsEnabled() {
    this.requireInstalled();
    return await this.walletInstance.isAtomicalsEnabled();
  }

  // BiHelix Methods
  async isBiHelixAddress(address) {
    this.requireInstalled();
    return await this.walletInstance.isBiHelixAddress(address);
  }

  async getBiHelixDescriptor() {
    this.requireConnected();
    return await this.walletInstance.getBiHelixDescriptor();
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async viewAddress(address) {
    this.requireInstalled();
    await this.walletInstance.viewAddress(address);
  }

  async getVersion() {
    this.requireInstalled();
    return await this.walletInstance.getVersion();
  }

  // ========================================
  // EVENT LISTENERS
  // ========================================
  // ========================================

  setupEventListeners() {
    if (!this.isInstalled()) return;
    
    const wallet = this.walletInstance;
    if (!wallet || !wallet.on) return;
    
    // Account changes
    wallet.on('accountsChanged', (accounts) => {
      console.log(`👤 Wizz accounts changed:`, accounts);
      
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
      console.log(`🌐 Wizz network changed:`, network);
    });
    
    console.log(`✅ Wizz event listeners set up`);
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

export default WizzProvider;
