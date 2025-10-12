import React, { useState, useEffect } from 'react';
import InscriptionItem from './components/InscriptionItem.jsx';
import InscriptionCreator from './components/InscriptionCreator.jsx';
import XversePanel from './components/XversePanel.jsx';
import WalletTester from './components/WalletTester.jsx';
import { checkWalletCapability, supportsInscriptionCreation } from './components/walletCapabilities.js';
import './styles/App.css';

const NexusWalletApp = () => {
  const [coreLibraryLoaded, setCoreLibraryLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [walletState, setWalletState] = useState({
    isConnected: false,
    walletType: null,
    address: null,
    balance: 0
  });
  const [inscriptions, setInscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(null);
  const [error, setError] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showInscriptionCreator, setShowInscriptionCreator] = useState(false);
  const [installedWallets, setInstalledWallets] = useState([]);
  const [demos, setDemos] = useState({
    signedPSBT: '',
    sentTxId: '',
    messageSignature: ''
  });

  const wallets = [
    { 
      id: 'unisat', 
      name: 'UniSat', 
      capabilities: ['balance', 'inscriptions', 'signPsbt', 'sendBitcoin', 'signMessage', 'pushPsbt', 'getPublicKey'],
      color: 'orange' 
    },
    { 
      id: 'xverse', 
      name: 'Xverse', 
      capabilities: ['balance', 'inscriptions', 'signPsbt', 'sendBitcoin', 'signMessage', 'createInscription', 'getPublicKey'],
      color: 'blue' 
    },
    { 
      id: 'okx', 
      name: 'OKX', 
      capabilities: ['balance', 'inscriptions', 'signPsbt', 'sendBitcoin', 'signMessage', 'pushPsbt', 'getPublicKey'],
      color: 'black' 
    },
    { 
      id: 'leather', 
      name: 'Leather', 
      capabilities: ['signPsbt', 'sendBitcoin', 'signMessage', 'pushPsbt'],
      color: 'brown' 
    },
    { 
      id: 'phantom', 
      name: 'Phantom', 
      capabilities: ['balance', 'inscriptions', 'signPsbt', 'sendBitcoin', 'signMessage', 'getPublicKey'],
      color: 'purple' 
    },
    { 
      id: 'wizz', 
      name: 'Wizz', 
      capabilities: ['balance', 'inscriptions', 'signPsbt', 'sendBitcoin', 'signMessage', 'createInscription', 'pushPsbt', 'getPublicKey'],
      color: 'green' 
    },
    { 
      id: 'oyl', 
      name: 'Oyl', 
      capabilities: ['balance', 'inscriptions', 'signPsbt', 'sendBitcoin', 'signMessage'],
      color: 'red' 
    },
    { 
      id: 'magiceden', 
      name: 'Magic Eden', 
      capabilities: ['signPsbt', 'sendBitcoin', 'signMessage'],
      color: 'violet' 
    }
  ];

  useEffect(() => {
    const checkCoreLibrary = () => {
      if (window.NexusWalletConnect) {
        setCoreLibraryLoaded(true);
        setWalletState(window.NexusWalletConnect.getState());
        
        // Detect installed wallets
        try {
          const detected = window.NexusWalletConnect.detectWallets();
          console.log('🔍 Detected wallets:', detected);
          console.log('🔍 Number of wallets found:', detected.length);
          if (detected.length > 0) {
            console.log('🔍 First wallet:', JSON.stringify(detected[0]));
          }
          setInstalledWallets(detected);
        } catch (e) {
          console.warn('Failed to detect wallets:', e);
          setInstalledWallets([]);
        }
        
        const unsubscribe = window.NexusWalletConnect.subscribe((state) => {
          setWalletState(state);
        });
        
        return unsubscribe;
      } else {
        setCoreLibraryLoaded(true);
        setTimeout(checkCoreLibrary, 100);
      }
    };
    
    return checkCoreLibrary();
  }, []);

  // Auto-load inscriptions when wallet connects
  useEffect(() => {
    if (walletState.isConnected && walletState.walletType) {
      // Check if the wallet supports inscriptions before trying to load them
      // Need case-insensitive comparison since walletType is capitalized (UniSat) but wallet.id is lowercase (unisat)
      const walletData = wallets.find(w => w.id.toLowerCase() === walletState.walletType.toLowerCase());
      const supportsInscriptions = walletData?.capabilities.includes('inscriptions');
      
      if (supportsInscriptions) {
        refreshInscriptions();
      } else {
        // Clear inscriptions for wallets that don't support them
        setInscriptions([]);
        console.log(`ℹ️ ${walletState.walletType} wallet does not support inscription viewing`);
      }
    } else {
      // Clear inscriptions when disconnected
      setInscriptions([]);
    }
  }, [walletState.isConnected, walletState.walletType]);

  const handleConnect = async (walletType) => {
    setShowWalletModal(false);
    setLoading(true);
    setConnectingWallet(walletType);
    setError(null);
    
    try {
      await window.NexusWalletConnect.connect(walletType);
    } catch (err) {
      setError(`Failed to connect to ${walletType}: ${err.message}`);
    } finally {
      setLoading(false);
      setConnectingWallet(null);
    }
  };

  const openWalletModal = () => {
    setShowWalletModal(true);
  };

  const closeWalletModal = () => {
    setShowWalletModal(false);
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showWalletModal) {
        closeWalletModal();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showWalletModal]);

  const handleDisconnect = async () => {
    try {
      await window.NexusWalletConnect.disconnect();
      setInscriptions([]);
      setError(null);
      setDemos({ signedPSBT: '', sentTxId: '', messageSignature: '' });
    } catch (error) {
      setError(error.message);
    }
  };

  const refreshInscriptions = async () => {
    if (!walletState.isConnected) return;
    
    // Check if wallet supports inscriptions (case-insensitive comparison)
    const walletData = wallets.find(w => w.id.toLowerCase() === walletState.walletType.toLowerCase());
    const supportsInscriptions = walletData?.capabilities.includes('inscriptions');
    
    if (!supportsInscriptions) {
      console.log(`ℹ️ ${walletState.walletType} wallet does not support inscription viewing`);
      setInscriptions([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const userInscriptions = await window.NexusWalletConnect.getInscriptions();
      
      if (Array.isArray(userInscriptions)) {
        setInscriptions(userInscriptions);
        console.log(`✅ Loaded ${userInscriptions.length} inscriptions`);
      } else {
        setInscriptions([]);
        console.warn('⚠️ getInscriptions did not return an array:', userInscriptions);
      }
    } catch (error) {
      console.error('❌ Failed to load inscriptions:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('not supported')) {
        setError(`${walletState.walletType} wallet does not support inscription viewing`);
      } else {
        setError(`Failed to load inscriptions: ${errorMessage}`);
      }
      
      setInscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const openInscriptionCreator = () => {
    if (!walletState.isConnected) {
      setError('Please connect a wallet first');
      return;
    }
    setShowInscriptionCreator(true);
  };

  const closeInscriptionCreator = () => {
    setShowInscriptionCreator(false);
  };

  const handleInscriptionCreated = (result) => {
    console.log('Inscription created:', result);
    setTimeout(() => {
      refreshInscriptions();
    }, 2000);
  };

  const hasCapability = (capability) => {
    if (!walletState.isConnected || !walletState.walletType) return false;
    
    // Check local wallets array first (case-insensitive comparison)
    const walletData = wallets.find(w => w.id.toLowerCase() === walletState.walletType.toLowerCase());
    if (walletData && walletData.capabilities.includes(capability)) {
      return true;
    }
    
    // Fallback to walletCapabilities utility
    const hasFeature = checkWalletCapability(walletState.walletType, capability);
    
    if (typeof hasFeature === 'string') {
      return true;
    }
    
    return hasFeature === true;
  };

  const canCreateInscription = () => {
    if (!walletState.isConnected || !walletState.walletType) return false;
    return supportsInscriptionCreation(walletState.walletType);
  };

  const handleSignMessagePrompt = async () => {
    const message = prompt('Enter message to sign:', 'Hello from NexusWalletConnect!');
    if (!message) return;
    
    setLoading(true);
    try {
      const signature = await window.NexusWalletConnect.signMessage(message);
      setDemos(prev => ({ ...prev, messageSignature: signature }));
      setError(null);
    } catch (error) {
      setError('Message signing failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBTCPrompt = async () => {
    const recipient = prompt('Enter recipient address:');
    if (!recipient) return;
    
    const amount = prompt('Enter amount in BTC:', '0.001');
    if (!amount || isNaN(parseFloat(amount))) return;
    
    setLoading(true);
    try {
      const txid = await window.NexusWalletConnect.sendBTC(recipient, parseFloat(amount));
      setDemos(prev => ({ ...prev, sentTxId: txid }));
      setError(null);
    } catch (error) {
      setError('Send failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignPSBTPrompt = async () => {
    const psbtHex = prompt('Enter PSBT hex to sign:');
    if (!psbtHex) return;
    
    setLoading(true);
    try {
      const signedPsbt = await window.NexusWalletConnect.signPSBT(psbtHex);
      setDemos(prev => ({ ...prev, signedPSBT: signedPsbt }));
      setError(null);
    } catch (error) {
      setError('PSBT signing failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const showWalletInfo = () => {
    const state = window.NexusWalletConnect.getState();
    const info = {
      connected: state.isConnected,
      walletType: state.walletType,
      address: state.address,
      balance: `${state.balance} BTC`,
      coreLibraryVersion: window.NexusWalletConnect.version || '1.0.0'
    };
    alert(JSON.stringify(info, null, 2));
  };

  if (!coreLibraryLoaded) {
    return (
      <div className={`nexus-wallet-app ${darkMode ? 'dark-theme' : 'light-theme'}`}>
        <div className="loading-state" style={{ minHeight: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`nexus-wallet-app ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      {/* Fixed Top Navigation */}
      <nav className="top-navigation">
        <div className="nav-left">
                 <div className="nav-title-group">
            <div className="nav-title">Nexus</div>
            <div className="nav-subtitle">OCW</div>
          </div>
        </div>
        <div className="nav-right">
          <button 
            className="btn btn-icon btn-secondary" 
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          {walletState.isConnected ? (
            <button className="btn btn-secondary" onClick={handleDisconnect}>
              Disconnect
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openWalletModal}>
              Connect Wallet
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {!walletState.isConnected ? (
          // Welcome Screen (Disconnected State)
          <div className="welcome-screen">
            <div className="welcome-card">
               <h1 className="welcome-heading">Welcome to Nexus OCW</h1>
              <p className="welcome-description">
                Connect your Bitcoin wallet to manage inscriptions, sign transactions, 
                and interact with the Bitcoin blockchain. Supports multiple wallet providers 
                with a unified interface.
              </p>
              <button 
                className="btn btn-primary btn-large"
                onClick={openWalletModal}
              >
                Connect Your Wallet →
              </button>
            </div>
          </div>
        ) : (
          // Connected State with Tabs
          <>
            <div className="tab-navigation">
              <div className="tab-navigation-left">
                <button 
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`tab-button ${activeTab === 'inscriptions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('inscriptions')}
                >
                  Inscriptions
                </button>
                <button 
                  className={`tab-button ${activeTab === 'testing' ? 'active' : ''}`}
                  onClick={() => setActiveTab('testing')}
                >
                  🧪 Testing
                </button>
                {walletState.walletType?.toLowerCase() === 'xverse' && (
                  <button 
                    className={`tab-button ${activeTab === 'xverse' ? 'active' : ''}`}
                    onClick={() => setActiveTab('xverse')}
                  >
                    🟣 Xverse Advanced
                  </button>
                )}
                <button 
                  className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
                </button>
              </div>
              <div className="tab-navigation-right">
                {hasCapability('sendBitcoin') && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleSendBTCPrompt}
                    disabled={loading}
                  >
                    {loading ? '⏳ ' : ''}Send BTC
                  </button>
                )}
                {hasCapability('signMessage') && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleSignMessagePrompt}
                    disabled={loading}
                  >
                    {loading ? '⏳ ' : ''}Sign Message
                  </button>
                )}
                {hasCapability('signPsbt') && (
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={handleSignPSBTPrompt}
                    disabled={loading}
                  >
                    {loading ? '⏳ ' : ''}Sign PSBT
                  </button>
                )}
                {canCreateInscription() && (
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={openInscriptionCreator}
                    disabled={loading}
                  >
                    {loading ? '⏳ ' : ''}+ Create Inscription
                  </button>
                )}
              </div>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid-2col">
                {/* Wallet Information Card */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Wallet Information</h2>
                    <p className="card-subtitle">Connected: {walletState.walletType}</p>
                  </div>
                  
                  {/* Display addresses based on wallet type (case-insensitive) */}
                  {(walletState.walletType?.toLowerCase() === 'xverse' || walletState.walletType?.toLowerCase() === 'magiceden') && walletState.paymentAddress ? (
                    <>
                      <div className="address-section">
                        <div className="address-label">Payment Address</div>
                        <div className="address-display">
                          {walletState.paymentAddress}
                        </div>
                      </div>
                      {walletState.ordinalsAddress && (
                        <div className="address-section mt-sm">
                          <div className="address-label">Ordinals Address</div>
                          <div className="address-display">
                            {walletState.ordinalsAddress}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="address-display">
                      {walletState.address}
                    </div>
                  )}

                  {hasCapability('balance') && (
                    <>
                      <div className="balance-label">Total Balance</div>
                      <div className="balance-display">
                        {walletState.balance !== null && walletState.balance !== undefined 
                          ? (
                              <>
                                <div className="balance-amount">{walletState.balance.toFixed(8)} BTC</div>
                                {walletState.balance === 0 && (
                                  <div className="balance-note">Wallet has no balance</div>
                                )}
                              </>
                            )
                          : <span className="balance-unavailable">Balance fetch failed</span>}
                      </div>
                    </>
                  )}

                </div>

                {/* Wallet Capabilities Card */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Wallet Capabilities</h2>
                    <p className="card-subtitle">Supported features & quick actions</p>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Balance API</span>
                    <span className="stat-value">{hasCapability('balance') ? '✓ Available' : '✗ Not Available'}</span>
                  </div>
                  {hasCapability('balance') && (
                    <button 
                      className="btn btn-secondary btn-sm mt-xs"
                      onClick={async () => {
                        try {
                          const balance = await window.NexusWalletConnect.getBalance();
                          alert(`Balance: ${balance} BTC`);
                        } catch (e) {
                          alert(`Error: ${e.message}`);
                        }
                      }}
                    >
                      🔄 Refresh Balance
                    </button>
                  )}
                  
                  <div className="stat-item">
                    <span className="stat-label">Send Bitcoin</span>
                    <span className="stat-value">{hasCapability('sendBitcoin') ? '✓ Supported' : '✗ Not Supported'}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Sign Messages</span>
                    <span className="stat-value">{hasCapability('signMessage') ? '✓ Supported' : '✗ Not Supported'}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">PSBT Signing</span>
                    <span className="stat-value">{hasCapability('signPsbt') ? '✓ Supported' : '✗ Not Supported'}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">View Inscriptions</span>
                    <span className="stat-value">{hasCapability('inscriptions') ? '✓ Supported' : '✗ Not Supported'}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Create Inscriptions</span>
                    <span className="stat-value">{hasCapability('createInscription') ? '✓ Supported' : '✗ Not Supported'}</span>
                  </div>
                  
                  <div className="stat-item">
                    <span className="stat-label">Public Key Access</span>
                    <span className="stat-value">{hasCapability('getPublicKey') ? '✓ Supported' : '✗ Not Supported'}</span>
                  </div>
                  {hasCapability('getPublicKey') && (
                    <button 
                      className="btn btn-secondary btn-sm mt-xs"
                      onClick={async () => {
                        try {
                          const provider = window.NexusWalletConnect.getCurrentProvider();
                          const pubKey = await provider.getPublicKey();
                          alert(`Public Key: ${pubKey}`);
                        } catch (e) {
                          alert(`Error: ${e.message}`);
                        }
                      }}
                    >
                      🔑 Get Public Key
                    </button>
                  )}
                  
                  <div className="stat-item">
                    <span className="stat-label">Push PSBT</span>
                    <span className="stat-value">{hasCapability('pushPsbt') ? '✓ Supported' : '✗ Not Supported'}</span>
                  </div>
                  
                  {/* New Utility Capabilities */}
                  <div className="stat-item mt-sm">
                    <span className="stat-label">🛠️ Utility Functions</span>
                    <span className="stat-value">✓ Available</span>
                  </div>
                  
                  {window.NexusWalletConnect?.getCapabilities && (
                    <button 
                      className="btn btn-secondary btn-sm mt-xs"
                      onClick={async () => {
                        try {
                          const capabilities = window.NexusWalletConnect.getCapabilities();
                          alert(`Wallet Capabilities:\n\n${JSON.stringify(capabilities, null, 2)}`);
                        } catch (e) {
                          alert(`Error: ${e.message}`);
                        }
                      }}
                    >
                      🔍 Get Capabilities
                    </button>
                  )}
                  
                  {window.NexusWalletConnect?.getUtxos && (
                    <button 
                      className="btn btn-secondary btn-sm mt-xs"
                      onClick={async () => {
                        try {
                          const utxos = await window.NexusWalletConnect.getUtxos();
                          alert(`UTXOs (${utxos?.length || 0} found):\n\n${JSON.stringify(utxos?.slice(0, 3) || [], null, 2)}${utxos?.length > 3 ? '\n\n... and more' : ''}`);
                        } catch (e) {
                          alert(`Error: ${e.message}`);
                        }
                      }}
                    >
                      📦 Get UTXOs
                    </button>
                  )}
                  
                  {window.NexusWalletConnect?.getBRC20List && (
                    <button 
                      className="btn btn-secondary btn-sm mt-xs"
                      onClick={async () => {
                        try {
                          const brc20s = await window.NexusWalletConnect.getBRC20List();
                          alert(`BRC-20 Tokens (${brc20s?.length || 0} found):\n\n${JSON.stringify(brc20s?.slice(0, 5) || [], null, 2)}${brc20s?.length > 5 ? '\n\n... and more' : ''}`);
                        } catch (e) {
                          alert(`Error: ${e.message}`);
                        }
                      }}
                    >
                      🪙 Get BRC-20 List
                    </button>
                  )}
                  
                  {/* Xverse-specific capabilities */}
                  {walletState.walletType?.toLowerCase() === 'xverse' && (
                    <>
                      <div className="stat-item mt-sm">
                        <span className="stat-label">🪙 Runes Support</span>
                        <span className="stat-value">✓ Full Support</span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          try {
                            const balance = await window.NexusWalletConnect.getRunesBalance();
                            alert(`Runes Balance:\n\n${JSON.stringify(balance, null, 2)}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        🪙 Check Runes Balance
                      </button>
                      
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          const runeName = prompt('Enter Rune name:');
                          if (!runeName) return;
                          
                          const recipient = prompt('Enter recipient address:');
                          if (!recipient) return;
                          
                          const amount = prompt('Enter amount:');
                          if (!amount) return;
                          
                          try {
                            const result = await window.NexusWalletConnect.transferRunes({
                              runeName,
                              recipient,
                              amount
                            });
                            alert(`✅ Runes transferred! TX: ${JSON.stringify(result)}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        💸 Transfer Runes
                      </button>
                      
                      <div className="stat-item">
                        <span className="stat-label">Multiple PSBTs</span>
                        <span className="stat-value">✓ Supported</span>
                      </div>
                      
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          const psbts = prompt('Enter PSBTs to sign (one per line):');
                          if (!psbts) return;
                          
                          try {
                            const psbtArray = psbts.split('\n').filter(p => p.trim());
                            const results = await window.NexusWalletConnect.signMultipleTransactions(psbtArray);
                            alert(`✅ Signed ${results.length} PSBTs!\n\n${JSON.stringify(results, null, 2)}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        📝 Sign Multiple PSBTs
                      </button>
                      
                      <div className="stat-item">
                        <span className="stat-label">Native Inscription</span>
                        <span className="stat-value">✓ createInscription()</span>
                      </div>
                    </>
                  )}

                  {/* Leather-specific capabilities */}
                  {walletState.walletType?.toLowerCase() === 'leather' && (
                    <>
                      <div className="stat-item mt-sm">
                        <span className="stat-label">🔷 Stacks Support</span>
                        <span className="stat-value">✓ Full Stack</span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          try {
                            const info = await window.NexusWalletConnect.getProductInfo();
                            alert(`Product Info:\n\n${JSON.stringify(info, null, 2)}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        ℹ️ Get Product Info
                      </button>
                      
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          try {
                            const url = await window.NexusWalletConnect.getURL();
                            alert(`Leather URL: ${url}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        🔗 Get Wallet URL
                      </button>
                      
                      <div className="stat-item">
                        <span className="stat-label">Structured Data</span>
                        <span className="stat-value">✓ Signing</span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">Authentication</span>
                        <span className="stat-value">✓ Supported</span>
                      </div>
                    </>
                  )}

                  {/* MagicEden-specific capabilities */}
                  {walletState.walletType?.toLowerCase() === 'magiceden' && (
                    <>
                      <div className="stat-item mt-sm">
                        <span className="stat-label">🎴 Magic Eden API</span>
                        <span className="stat-value">✓ JWT-based</span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          try {
                            const isHw = await window.NexusWalletConnect.isHardware();
                            alert(`Is Hardware Wallet: ${isHw}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        🔐 Check Hardware Status
                      </button>
                      
                      <div className="stat-item">
                        <span className="stat-label">RPC Call Method</span>
                        <span className="stat-value">✓ Available</span>
                      </div>
                    </>
                  )}

                  {/* OKX-specific capabilities */}
                  {walletState.walletType?.toLowerCase() === 'okx' && (
                    <>
                      <div className="stat-item mt-sm">
                        <span className="stat-label">📝 Inscription Tools</span>
                        <span className="stat-value">✓ Advanced</span>
                      </div>
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          const ticker = prompt('Enter BRC-20 ticker:', 'ordi');
                          if (!ticker) return;
                          
                          const amount = prompt('Enter amount:', '100');
                          if (!amount) return;
                          
                          try {
                            const result = await window.NexusWalletConnect.inscribeTransfer(ticker, amount);
                            alert(`✅ Transfer inscribed! ${JSON.stringify(result)}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        📝 Inscribe Transfer
                      </button>
                      
                      <button 
                        className="btn btn-secondary btn-sm mt-xs"
                        onClick={async () => {
                          const count = prompt('Split UTXO into how many outputs?', '5');
                          if (!count) return;
                          
                          try {
                            const result = await window.NexusWalletConnect.splitUtxo({
                              count: parseInt(count)
                            });
                            alert(`✅ UTXO split! TX: ${result}`);
                          } catch (e) {
                            alert(`Error: ${e.message}`);
                          }
                        }}
                      >
                        ✂️ Split UTXO
                      </button>
                      
                      <div className="stat-item">
                        <span className="stat-label">NFT Transfer</span>
                        <span className="stat-value">✓ Supported</span>
                      </div>
                      
                      <div className="stat-item">
                        <span className="stat-label">Asset Watching</span>
                        <span className="stat-value">✓ Supported</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}


            {/* Inscriptions Tab */}
            {activeTab === 'inscriptions' && (
              <>
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Inscriptions</h2>
                    <p className="card-subtitle">Your Bitcoin inscriptions</p>
                  </div>

                  {!hasCapability('inscriptions') ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">ℹ️</div>
                      <h3 className="empty-state-title">Inscriptions Not Supported</h3>
                      <p className="empty-state-description">
                        {walletState.walletType} wallet does not support inscription viewing.
                        <br />
                        Try connecting with UniSat, Xverse, OKX, Wizz, or Oyl for full inscription support.
                      </p>
                    </div>
                  ) : inscriptions.length === 0 ? (
                    <div className="empty-state">
                      {loading ? (
                        <>
                          <div className="empty-state-icon">⏳</div>
                          <h3 className="empty-state-title">Loading Inscriptions...</h3>
                        </>
                      ) : (
                        <>
                          <div className="empty-state-icon">📭</div>
                          <h3 className="empty-state-title">No Inscriptions Found</h3>
                          <p className="empty-state-description">You don't have any inscriptions yet.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="inscriptions-list">
                      {inscriptions.map((inscription, index) => (
                        <InscriptionItem 
                          key={inscription.inscriptionId || index} 
                          inscription={inscription}
                        />
                      ))}
                    </div>
                  )}

                  {hasCapability('inscriptions') && (
                    <div className="action-buttons mt-lg">
                      <button 
                        className="btn btn-primary"
                        onClick={refreshInscriptions}
                        disabled={loading}
                      >
                        {loading ? '⏳ Loading...' : '🔄 Refresh Inscriptions'}
                      </button>

                      {/* Xverse-specific inscription features */}
                      {walletState.walletType?.toLowerCase() === 'xverse' && (
                        <>
                          <button 
                            className="btn btn-secondary"
                            onClick={async () => {
                              const inscriptionIds = prompt('Enter inscription IDs to send (comma-separated):');
                              if (!inscriptionIds) return;
                              
                              const recipient = prompt('Enter recipient address:');
                              if (!recipient) return;
                              
                              setLoading(true);
                              try {
                                const result = await window.NexusWalletConnect.sendInscriptions({
                                  inscriptionIds: inscriptionIds.split(',').map(id => id.trim()),
                                  recipient: recipient
                                });
                                alert(`✅ Inscriptions sent! TX: ${JSON.stringify(result)}`);
                              } catch (e) {
                                setError(`Failed to send inscriptions: ${e.message}`);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                          >
                            📤 Send Inscriptions
                          </button>

                          <button 
                            className="btn btn-secondary"
                            onClick={async () => {
                              const content = prompt('Enter content for repeat inscriptions:', 'Hello World');
                              if (!content) return;
                              
                              const repeat = prompt('How many copies?', '5');
                              if (!repeat) return;
                              
                              setLoading(true);
                              try {
                                const payload = {
                                  content: content,
                                  contentType: 'text/plain;charset=utf-8',
                                  payloadType: 'PLAIN_TEXT',
                                  repeat: parseInt(repeat),
                                  network: { type: 'Mainnet' },
                                  suggestedMinerFeeRate: 10
                                };
                                const result = await window.NexusWalletConnect.createRepeatInscriptions(payload);
                                alert(`✅ Created ${repeat} inscriptions! Result: ${JSON.stringify(result)}`);
                                await refreshInscriptions();
                              } catch (e) {
                                setError(`Failed to create repeat inscriptions: ${e.message}`);
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                          >
                            🔄 Create Repeat Inscriptions
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* BRC-20 Tokens Card */}
                {hasCapability('inscriptions') && window.NexusWalletConnect?.getBRC20List && (
                  <div className="card mt-lg">
                    <div className="card-header">
                      <h2 className="card-title">🪙 BRC-20 Tokens</h2>
                      <p className="card-subtitle">Your Bitcoin BRC-20 token holdings</p>
                    </div>
                    
                    <div className="action-buttons">
                      <button 
                        className="btn btn-primary"
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const brc20s = await window.NexusWalletConnect.getBRC20List();
                            
                            if (!brc20s || brc20s.length === 0) {
                              alert('📭 No BRC-20 tokens found in this wallet.');
                              return;
                            }
                            
                            // Create a more user-friendly display
                            const tokenSummary = brc20s.map(token => {
                              const tick = token.tick || token.ticker || 'Unknown';
                              const balance = token.balance || token.amount || '0';
                              const transferable = token.transferable || token.transferableBalance || '0';
                              
                              return `${tick}: ${balance} (Transferable: ${transferable})`;
                            }).join('\n');
                            
                            alert(`🪙 BRC-20 Tokens Found (${brc20s.length}):\n\n${tokenSummary}`);
                            
                            // Log full details to console for developers
                            console.log('🪙 Complete BRC-20 token data:', brc20s);
                          } catch (e) {
                            alert(`Error loading BRC-20 tokens: ${e.message}`);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? '⏳ Loading...' : '🪙 Load BRC-20 Tokens'}
                      </button>
                      
                      {/* Transfer BRC-20 button for supported wallets */}
                      {(walletState.walletType?.toLowerCase() === 'okx' || walletState.walletType?.toLowerCase() === 'unisat') && (
                        <button 
                          className="btn btn-secondary"
                          onClick={async () => {
                            const tick = prompt('Enter BRC-20 ticker to transfer:', 'ordi');
                            if (!tick) return;
                            
                            const amount = prompt('Enter amount to transfer:', '100');
                            if (!amount) return;
                            
                            setLoading(true);
                            try {
                              // Use inscribeTransfer for BRC-20 transfer inscriptions
                              const result = await window.NexusWalletConnect.inscribeTransfer(tick, amount);
                              alert(`✅ BRC-20 transfer inscription created!\n\nTicker: ${tick}\nAmount: ${amount}\n\nTransaction: ${JSON.stringify(result)}`);
                            } catch (e) {
                              setError(`Failed to create BRC-20 transfer: ${e.message}`);
                            } finally {
                              setLoading(false);
                            }
                          }}
                          disabled={loading}
                        >
                          {loading ? '⏳ Creating...' : '📝 Create Transfer Inscription'}
                        </button>
                      )}
                      
                      <button 
                        className="btn btn-secondary"
                        onClick={async () => {
                          try {
                            const utxos = await window.NexusWalletConnect.getUtxos();
                            
                            if (!utxos || utxos.length === 0) {
                              alert('📭 No UTXOs found in this wallet.');
                              return;
                            }
                            
                            // Show UTXO summary
                            const utxoSummary = utxos.slice(0, 10).map((utxo, i) => {
                              const value = utxo.satoshis || utxo.value || '0';
                              const txid = (utxo.txid || utxo.txId || '').substring(0, 8);
                              const vout = utxo.vout !== undefined ? utxo.vout : (utxo.outputIndex || 0);
                              
                              return `${i + 1}. ${value} sats (${txid}...#${vout})`;
                            }).join('\n');
                            
                            const totalValue = utxos.reduce((sum, utxo) => sum + (utxo.satoshis || utxo.value || 0), 0);
                            
                            alert(`📦 UTXOs Found (${utxos.length} total):\n\nTotal Value: ${totalValue} satoshis\n\n${utxoSummary}${utxos.length > 10 ? '\n\n... and more' : ''}`);
                            
                            // Log full details to console for developers
                            console.log('📦 Complete UTXO data:', utxos);
                          } catch (e) {
                            alert(`Error loading UTXOs: ${e.message}`);
                          }
                        }}
                        disabled={loading}
                      >
                        📦 View UTXOs
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

              {/* Testing Tab */}
              {activeTab === 'testing' && (
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">🧪 Wallet Testing</h2>
                    <p className="card-subtitle">Test all {walletState.walletType} methods with code snippets</p>
                  </div>
                  
                  <WalletTester />
                </div>
              )}

              {/* Xverse Advanced Tab */}
              {activeTab === 'xverse' && walletState.walletType?.toLowerCase() === 'xverse' && (
                <XversePanel 
                  isConnected={walletState.isConnected} 
                  walletState={walletState}
                />
              )}

              {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Settings</h2>
                  <p className="card-subtitle">Application preferences</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Theme</label>
                  <select className="form-select" value={darkMode ? 'dark' : 'light'} onChange={(e) => setDarkMode(e.target.value === 'dark')}>
                    <option value="dark">Dark Mode</option>
                    <option value="light">Light Mode</option>
                  </select>
                  <small className="form-hint">Choose your preferred color theme</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Network</label>
                  <select className="form-select" disabled>
                    <option>Bitcoin Mainnet</option>
                    <option>Bitcoin Testnet</option>
                  </select>
                  <small className="form-hint">Network selection is controlled by your wallet</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Default Fee Rate (sat/vB)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    defaultValue="10"
                    min="1"
                    placeholder="10"
                  />
                  <small className="form-hint">Suggested fee rate for transactions (1-100 sat/vB)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Connected Wallet</label>
                  <div className="info-display">
                    <strong>{walletState.walletType}</strong>
                  </div>
                  <small className="form-hint">Currently connected wallet provider</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Wallet Address</label>
                  <div className="info-display code">
                    {walletState.address}
                  </div>
                  <small className="form-hint">Your Bitcoin address</small>
                </div>

                <hr className="divider" />

                <div className="action-buttons">
                  <button className="btn btn-secondary" onClick={showWalletInfo}>
                    View Wallet Info
                  </button>
                  <button className="btn btn-danger" onClick={handleDisconnect}>
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {(error || demos.sentTxId || demos.messageSignature || demos.signedPSBT) && (
              <div className="mt-lg">
                {error && (
                  <div className="error-message mb-md">{error}</div>
                )}
                {demos.sentTxId && (
                  <div className="success-message mb-md">
                    Transaction sent! TX ID: {demos.sentTxId.slice(0, 20)}...
                  </div>
                )}
                {demos.messageSignature && (
                  <div className="success-message mb-md">
                    ✅ Message signed! Signature: {typeof demos.messageSignature === 'string' 
                      ? demos.messageSignature.slice(0, 20) + '...'
                      : demos.messageSignature.signature?.slice(0, 20) + '...' || 'Success'}
                  </div>
                )}
                {demos.signedPSBT && (
                  <div className="success-message mb-md">
                    PSBT signed successfully!
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div className="modal-overlay" onClick={closeWalletModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Select Wallet</h2>
              <button className="modal-close" onClick={closeWalletModal}>✕</button>
            </div>
            <div className="modal-body">
              {installedWallets.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔍</div>
                  <h3 className="empty-state-title">No Wallets Found</h3>
                  <p className="empty-state-description">
                    Please install a Bitcoin wallet extension to continue.
                    <br /><br />
                    Supported wallets:
                    <br />
                    UniSat, Xverse, OKX, Leather, Phantom, Wizz, Magic Eden, Oyl
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  {installedWallets.map(wallet => {
                    // Find matching wallet from our config for the id
                    const walletConfig = wallets.find(w => w.name === wallet.name);
                    return (
                      <button
                        key={wallet.name}
                        onClick={() => handleConnect(wallet.name)}
                        disabled={loading}
                        className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'flex-start' }}
                      >
                        {connectingWallet === walletConfig?.id ? '⏳ Connecting... ' : ''}
                        {wallet.name}
                        {wallet.features && wallet.features.length > 0 && (
                          <span style={{ marginLeft: 'auto', fontSize: '0.8em', opacity: 0.7 }}>
                            {wallet.features.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inscription Creator Modal */}
      {showInscriptionCreator && walletState.isConnected && (
        <InscriptionCreator
          walletState={walletState}
          onClose={closeInscriptionCreator}
          onInscriptionCreated={handleInscriptionCreated}
        />
      )}

      {/* Wallet Documentation Modal */}
      {/* Loading Overlay */}
      {connectingWallet && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner-icon">⏳</div>
            <h3>Connecting to {wallets.find(w => w.id === connectingWallet)?.name}...</h3>
            <p>Please approve the connection in your wallet</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NexusWalletApp;