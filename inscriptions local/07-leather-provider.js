/**
 * Leather Wallet Provider (formerly Hiro Wallet)
 * Inscription Module #7 - Leather Wallet
 * 
 * Purpose: Leather wallet with Stacks integration and Bitcoin support
 * Dependencies: Module #1 (BaseWalletProvider), Module #2 (Normalizers)
 * Exports: LeatherProvider class
 * Size: ~400 lines, ~9KB brotli
 * 
 * Documentation: https://leather.gitbook.io/developers/
 * Bitcoin Methods: https://leather.gitbook.io/developers/bitcoin/sign-transactions
 * 
 * IMPORTANT: Leather uses Stacks-specific request methods, NOT standard Bitcoin wallet methods!
 * 
 * Actual API Methods (from wallet diagnostic):
 * - getURL() - Get wallet URL
 * - structuredDataSignatureRequest() - Sign structured data
 * - signatureRequest() - Sign messages (NOT signMessage!)
 * - authenticationRequest() - Authenticate user
 * - transactionRequest() - Stacks transactions
 * - psbtRequest() - Bitcoin PSBT signing (NOT signPsbt!)
 * - profileUpdateRequest() - Update profile
 * - getProductInfo() - Get wallet info
 * - request() - Generic request gateway
 * 
 * Update this module to add new Leather-specific features
 */

// Import from ordinal inscriptions (update sat numbers after inscribing)
import { BaseWalletProvider } from './01-base-provider.js';


export class LeatherProvider extends BaseWalletProvider {
  constructor() {
    super('Leather');
    
    this.walletInstance = this.getProvider();
    
    // Feature flags - Leather capabilities (TESTED from diagnostic)
    // Leather is a Stacks wallet with Bitcoin support using Stacks-specific methods
    this.features = {
      connect: true,                    // ✅ Via request('getAddresses')
      getAddress: true,                 // ✅ Via request('getAddresses')
      getPublicKey: false,              // ❌ Not available
      getBalance: false,                // ❌ Not available
      getNetwork: false,                // ❌ Not available
      switchNetwork: false,             // ❌ Not available
      signMessage: true,                // ✅ Via signatureRequest() (NOT signMessage!)
      signPsbt: true,                   // ✅ Via psbtRequest() (NOT signPsbt!)
      signPsbts: false,                 // ❌ No batch signing
      pushPsbt: false,                  // ❌ Not available
      pushTx: false,                    // ❌ Not available
      sendBitcoin: false,               // ❌ Not available
      sendInscription: false,           // ❌ Not available
      getInscriptions: false,           // ❌ Not available
      getAllInscriptions: false,        // ❌ Not available
      inscribe: false,                  // ❌ Not available
      brc20: false,                     // ❌ No BRC-20
      runes: false,                     // ❌ No Runes
      atomicals: false,                 // ❌ No Atomicals
      arc20: false,                     // ❌ No ARC-20
      stacksSupport: true,              // ✅ Full Stacks blockchain support
      structuredData: true,             // ✅ structuredDataSignatureRequest()
      authentication: true,             // ✅ authenticationRequest()
      stacksTransaction: true,          // ✅ transactionRequest()
      profileUpdate: true,              // ✅ profileUpdateRequest()
      getProductInfo: true,             // ✅ getProductInfo()
      getURL: true                      // ✅ getURL()
    };
  }

  getProvider() {
    if (typeof window === 'undefined') return null;
    
    // Leather provides the actual API at window.LeatherProvider
    // The btc_providers array only contains metadata/registration info
    if (window.LeatherProvider) {
      console.log('🔍 Found Leather at window.LeatherProvider');
      return window.LeatherProvider;
    }
    
    // Fallback to Hiro name (old name for Leather)
    if (window.HiroWalletProvider) {
      console.log('🔍 Found Hiro Wallet at window.HiroWalletProvider');
      return window.HiroWalletProvider;
    }
    
    // Last resort: check btc_providers array
    // (Note: this usually contains metadata, not the actual provider)
    if (window.btc_providers && Array.isArray(window.btc_providers)) {
      for (const entry of window.btc_providers) {
        if (entry.id === 'LeatherProvider' || entry.name === 'Leather') {
          // Only use if it has the request method (actual provider, not just metadata)
          if (typeof entry.request === 'function') {
            console.log('🔍 Found Leather provider in btc_providers:', entry);
            return entry;
          }
        }
      }
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

    try {
      const provider = this.getProvider();
      
      if (!provider || typeof provider.request !== 'function') {
        throw new Error('Leather provider.request method not available');
      }

      console.log('🔍 Calling Leather provider.request("getAddresses")...');
      const response = await provider.request('getAddresses');

      console.log('🔍 Leather raw response:', response);

      // Handle nested response structure
      const addresses = response.result?.addresses || response.addresses;
      
      if (!addresses || addresses.length === 0) {
        throw new Error('No addresses returned from Leather');
      }

      const bitcoinAddress = addresses.find(addr => addr.type === 'p2wpkh') || addresses[0];
      this.address = bitcoinAddress?.address;
      this.isConnected = true;
      
      console.log('✅ Leather connected:', this.address);
      return { address: this.address, allAddresses: addresses };
    } catch (error) {
      console.error('❌ Leather connection failed:', error);
      throw error;
    }
  }

  async getAddress() {
    this.requireConnected();
    return this.address;
  }

  async getAccounts() {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      const response = await provider.request('getAddresses');

      // Handle nested response structure
      return response.result?.addresses || response.addresses;
    } catch (error) {
      console.error('❌ Failed to get accounts:', error);
      throw error;
    }
  }

  // ========================================
  // LEATHER-SPECIFIC METHODS (Stacks API)
  // ========================================

  /**
   * Get Leather wallet product info
   * Uses Leather's getProductInfo() method
   * @returns {Promise<Object>} Product information
   */
  async getProductInfo() {
    this.requireInstalled();

    try {
      const provider = this.getProvider();
      const info = await provider.getProductInfo();
      console.log('✅ Leather product info:', info);
      return info;
    } catch (error) {
      console.error('❌ Failed to get product info:', error);
      throw error;
    }
  }

  /**
   * Get Leather wallet URL
   * Uses Leather's getURL() method
   * @returns {Promise<string>} Wallet URL
   */
  async getURL() {
    this.requireInstalled();

    try {
      const provider = this.getProvider();
      const url = await provider.getURL();
      return url;
    } catch (error) {
      console.error('❌ Failed to get URL:', error);
      throw error;
    }
  }

  // ========================================
  // SIGNING METHODS (Stacks-specific)
  // ========================================

  /**
   * Sign a message using Leather's signatureRequest (NOT signMessage!)
   * Docs: https://leather.gitbook.io/developers/bitcoin/sign-messages
   * @param {string} message - Message to sign
   * @param {Object} options - Signing options
   * @returns {Promise<Object>} Signature response
   */
  async signMessage(message, options = {}) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔏 Leather: Signing message via signatureRequest...');
      
      // Use Leather's actual method: signatureRequest (NOT signMessage!)
      const response = await provider.signatureRequest({
        message,
        ...options
      });

      console.log('✅ Leather message signed');
      return response;
    } catch (error) {
      console.error('❌ Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Sign structured data using Leather's structuredDataSignatureRequest
   * @param {Object} structuredData - Structured data to sign
   * @returns {Promise<Object>} Signature response
   */
  async signStructuredData(structuredData) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔏 Leather: Signing structured data...');
      const response = await provider.structuredDataSignatureRequest(structuredData);
      
      console.log('✅ Leather structured data signed');
      return response;
    } catch (error) {
      console.error('❌ Failed to sign structured data:', error);
      throw error;
    }
  }

  /**
   * Sign a PSBT using Leather's psbtRequest (NOT signPsbt!)
   * Docs: https://leather.gitbook.io/developers/bitcoin/sign-transactions
   * @param {string} psbtHex - PSBT in hex format
   * @param {Object} options - Signing options
   * @returns {Promise<Object>} Signed PSBT response
   */
  async signPsbt(psbtHex, options = {}) {
    this.requireConnected();

    if (!psbtHex || typeof psbtHex !== 'string') {
      throw new Error('Invalid PSBT: must be a non-empty string');
    }

    try {
      const provider = this.getProvider();
      if (!provider) {
        throw new Error('Leather provider not available');
      }

      console.log('🔏 Leather: Signing PSBT via psbtRequest...');

      // Use Leather's actual method: psbtRequest (NOT signPsbt!)
      const response = await provider.psbtRequest({
        hex: psbtHex,
        ...options
      });

      if (!response) {
        throw new Error('No response from Leather wallet');
      }

      console.log('✅ Leather PSBT signed successfully');
      return response;
    } catch (error) {
      console.error('❌ Leather PSBT signing failed:', error);
      const errorMessage = error?.message || 'Unknown Leather signing error';
      throw new Error(`Leather signing failed: ${errorMessage}`);
    }
  }

  // ========================================
  // STACKS BLOCKCHAIN METHODS
  // ========================================

  /**
   * Authenticate user with Leather
   * Uses Leather's authenticationRequest method
   * @param {Object} authOptions - Authentication options
   * @returns {Promise<Object>} Authentication response
   */
  async authenticate(authOptions = {}) {
    this.requireInstalled();

    try {
      const provider = this.getProvider();
      
      console.log('🔏 Leather: Requesting authentication...');
      const response = await provider.authenticationRequest(authOptions);
      
      console.log('✅ Leather authentication complete');
      return response;
    } catch (error) {
      console.error('❌ Authentication failed:', error);
      throw error;
    }
  }

  /**
   * Send a Stacks transaction
   * Uses Leather's transactionRequest method
   * @param {Object} txOptions - Transaction options
   * @returns {Promise<Object>} Transaction response
   */
  async sendStacksTransaction(txOptions) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔏 Leather: Sending Stacks transaction...');
      const response = await provider.transactionRequest(txOptions);
      
      console.log('✅ Stacks transaction sent');
      return response;
    } catch (error) {
      console.error('❌ Stacks transaction failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * Uses Leather's profileUpdateRequest method
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Profile update response
   */
  async updateProfile(profileData) {
    this.requireConnected();

    try {
      const provider = this.getProvider();
      
      console.log('🔏 Leather: Updating profile...');
      const response = await provider.profileUpdateRequest(profileData);
      
      console.log('✅ Profile updated');
      return response;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  // Note: Methods like sendBitcoin, getInscriptions, getBalance are NOT supported by Leather
  // Leather is primarily a Stacks wallet with Bitcoin signing capabilities
  // Use external APIs for balance and inscription data
}

export default LeatherProvider;
