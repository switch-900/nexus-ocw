/**
 * BaseWalletProvider - Foundation Module
 * Inscription Module #1 - Foundation Layer
 * 
 * Purpose: Base class for all Bitcoin wallet providers
 * Dependencies: None (foundation)
 * Exports: BaseWalletProvider class
 * Size: ~450 lines, ~10KB brotli
 * 
 * Update this module to add new helper methods or features available to all wallets
 */

export class BaseWalletProvider {
  constructor(name) {
    this.name = name;
    this.isConnected = false;
    this.address = null;
    this.publicKey = null;
    this.walletInstance = null;
    
    // Feature flags - override in subclasses
    this.features = {
      connect: true,
      getAddress: true,
      getPublicKey: false,
      getBalance: true,
      getNetwork: false,
      switchNetwork: false,
      signMessage: true,
      signPsbt: true,
      signPsbts: false,
      pushPsbt: false,
      pushTx: false,
      sendBitcoin: true,
      sendInscription: false,
      getInscriptions: true,
      getAllInscriptions: true,
      inscribe: false,
      brc20: {
        transfer: false,
        deploy: false,
        mint: false
      },
      runes: {
        send: false,
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

  /**
   * Helper: Check if wallet is installed
   * @throws {Error} If wallet not installed
   */
  requireInstalled() {
    if (!this.walletInstance) {
      throw new Error(`${this.name} wallet not installed or not detected`);
    }
  }

  /**
   * Helper: Check if wallet is connected
   * @throws {Error} If wallet not connected
   */
  requireConnected() {
    if (!this.isConnected || !this.address) {
      throw new Error(`${this.name} wallet not connected. Please connect first.`);
    }
  }

  /**
   * Helper: Check if method is supported
   * @param {string} methodPath - Dot notation path (e.g., 'brc20.transfer')
   * @returns {boolean}
   */
  supportsMethod(methodPath) {
    const parts = methodPath.split('.');
    let current = this.features;
    
    for (const part of parts) {
      if (typeof current === 'object' && current !== null) {
        current = current[part];
      } else {
        return current === true;
      }
    }
    
    return current === true;
  }

  /**
   * Helper: Safe method call with feature detection
   * @param {string} methodPath - Feature path to check
   * @param {Function} callback - Function to execute if supported
   * @param {string} errorMsg - Custom error message
   * @returns {Promise<*>}
   */
  async safeCall(methodPath, callback, errorMsg) {
    if (!this.supportsMethod(methodPath)) {
      throw new Error(errorMsg || `${this.name} does not support ${methodPath}`);
    }
    return await callback();
  }

  /**
   * Generic connect implementation
   * Override in subclass if wallet has custom connect flow
   */
  async connect() {
    this.requireInstalled();
    
    if (this.walletInstance.connect) {
      const result = await this.walletInstance.connect();
      this.isConnected = true;
      this.address = result.address || result;
      return result;
    }
    
    // Fallback for wallets without explicit connect
    const address = await this.getAddress();
    this.isConnected = true;
    this.address = address;
    return { address };
  }

  /**
   * Generic disconnect implementation
   */
  async disconnect() {
    if (this.walletInstance?.disconnect) {
      await this.walletInstance.disconnect();
    }
    this.isConnected = false;
    this.address = null;
    this.publicKey = null;
  }

  /**
   * Generic getAddress implementation
   */
  async getAddress() {
    this.requireInstalled();
    this.requireConnected();
    
    if (this.walletInstance.getAddress) {
      return await this.walletInstance.getAddress();
    }
    if (this.walletInstance.requestAccounts) {
      const accounts = await this.walletInstance.requestAccounts();
      return accounts[0];
    }
    
    throw new Error(`${this.name}: No method available to get address`);
  }

  /**
   * Generic getPublicKey implementation
   */
  async getPublicKey() {
    this.requireInstalled();
    this.requireConnected();
    
    return await this.safeCall('getPublicKey', async () => {
      if (this.walletInstance.getPublicKey) {
        return await this.walletInstance.getPublicKey();
      }
      throw new Error(`${this.name}: getPublicKey not implemented`);
    });
  }

  /**
   * Generic getBalance implementation
   */
  async getBalance() {
    this.requireInstalled();
    this.requireConnected();
    
    if (this.walletInstance.getBalance) {
      const result = await this.walletInstance.getBalance();
      // Handle different return formats
      if (typeof result === 'object') {
        return result.total || result.confirmed || result.balance || 0;
      }
      return result;
    }
    
    throw new Error(`${this.name}: getBalance not implemented`);
  }

  /**
   * Generic getNetwork implementation
   */
  async getNetwork() {
    this.requireInstalled();
    
    return await this.safeCall('getNetwork', async () => {
      if (this.walletInstance.getNetwork) {
        return await this.walletInstance.getNetwork();
      }
      throw new Error(`${this.name}: getNetwork not implemented`);
    });
  }

  /**
   * Generic switchNetwork implementation
   */
  async switchNetwork(network) {
    this.requireInstalled();
    
    return await this.safeCall('switchNetwork', async () => {
      if (this.walletInstance.switchNetwork) {
        return await this.walletInstance.switchNetwork(network);
      }
      throw new Error(`${this.name}: switchNetwork not implemented`);
    });
  }

  /**
   * Generic signMessage implementation
   */
  async signMessage(message, type = 'ecdsa') {
    this.requireInstalled();
    this.requireConnected();
    
    if (this.walletInstance.signMessage) {
      return await this.walletInstance.signMessage(message, type);
    }
    
    throw new Error(`${this.name}: signMessage not implemented`);
  }

  /**
   * Generic signPsbt implementation
   */
  async signPsbt(psbtHex, options = {}) {
    this.requireInstalled();
    this.requireConnected();
    
    if (this.walletInstance.signPsbt) {
      return await this.walletInstance.signPsbt(psbtHex, options);
    }
    
    throw new Error(`${this.name}: signPsbt not implemented`);
  }

  /**
   * Generic signPsbts (batch) implementation
   */
  async signPsbts(psbtHexs, options = {}) {
    this.requireInstalled();
    this.requireConnected();
    
    return await this.safeCall('signPsbts', async () => {
      if (this.walletInstance.signPsbts) {
        return await this.walletInstance.signPsbts(psbtHexs, options);
      }
      // Fallback: sign one by one
      const results = [];
      for (const psbt of psbtHexs) {
        results.push(await this.signPsbt(psbt, options));
      }
      return results;
    });
  }

  /**
   * Generic pushPsbt implementation
   */
  async pushPsbt(psbtHex) {
    this.requireInstalled();
    this.requireConnected();
    
    return await this.safeCall('pushPsbt', async () => {
      if (this.walletInstance.pushPsbt) {
        return await this.walletInstance.pushPsbt(psbtHex);
      }
      throw new Error(`${this.name}: pushPsbt not implemented`);
    });
  }

  /**
   * Generic pushTx implementation
   */
  async pushTx(rawTx) {
    this.requireInstalled();
    this.requireConnected();
    
    return await this.safeCall('pushTx', async () => {
      if (this.walletInstance.pushTx) {
        return await this.walletInstance.pushTx(rawTx);
      }
      throw new Error(`${this.name}: pushTx not implemented`);
    });
  }

  /**
   * Generic sendBitcoin implementation
   */
  async sendBitcoin(toAddress, satoshis, options = {}) {
    this.requireInstalled();
    this.requireConnected();
    
    if (this.walletInstance.sendBitcoin) {
      return await this.walletInstance.sendBitcoin(toAddress, satoshis, options);
    }
    
    throw new Error(`${this.name}: sendBitcoin not implemented`);
  }

  /**
   * Generic sendInscription implementation
   */
  async sendInscription(toAddress, inscriptionId, options = {}) {
    this.requireInstalled();
    this.requireConnected();
    
    return await this.safeCall('sendInscription', async () => {
      if (this.walletInstance.sendInscription) {
        return await this.walletInstance.sendInscription(toAddress, inscriptionId, options);
      }
      throw new Error(`${this.name}: sendInscription not implemented`);
    });
  }

  /**
   * Generic getInscriptions implementation
   */
  async getInscriptions(cursor = 0, size = 100) {
    this.requireInstalled();
    this.requireConnected();
    
    if (this.walletInstance.getInscriptions) {
      return await this.walletInstance.getInscriptions(cursor, size);
    }
    
    throw new Error(`${this.name}: getInscriptions not implemented`);
  }

  /**
   * Generic getAllInscriptions with automatic pagination
   * This is a universal helper that works across all wallets
   */
  async getAllInscriptions() {
    this.requireInstalled();
    this.requireConnected();
    
    const allInscriptions = [];
    let cursor = 0;
    const pageSize = 100;
    const maxPages = 100; // Safety limit: max 10,000 inscriptions
    let pageCount = 0;
    
    while (pageCount < maxPages) {
      const result = await this.getInscriptions(cursor, pageSize);
      
      // Handle different response formats
      const inscriptions = result.list || result.inscriptions || result;
      
      if (!Array.isArray(inscriptions) || inscriptions.length === 0) {
        break; // No more inscriptions
      }
      
      allInscriptions.push(...inscriptions);
      
      // Check if we got fewer than requested (last page)
      if (inscriptions.length < pageSize) {
        break;
      }
      
      cursor += pageSize;
      pageCount++;
    }
    
    if (pageCount >= maxPages) {
      console.warn(`⚠️ ${this.name}: Reached pagination safety limit (${maxPages * pageSize} inscriptions)`);
    }
    
    return allInscriptions;
  }

  /**
   * Generic inscribe implementation
   */
  async inscribe(content, options = {}) {
    this.requireInstalled();
    this.requireConnected();
    
    return await this.safeCall('inscribe', async () => {
      if (this.walletInstance.inscribe) {
        return await this.walletInstance.inscribe(content, options);
      }
      throw new Error(`${this.name}: inscribe not implemented`);
    });
  }

  /**
   * Get wallet info
   */
  getInfo() {
    return {
      name: this.name,
      isInstalled: !!this.walletInstance,
      isConnected: this.isConnected,
      address: this.address,
      publicKey: this.publicKey,
      features: this.features
    };
  }
}

export default BaseWalletProvider;
