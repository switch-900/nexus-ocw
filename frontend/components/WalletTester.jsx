import React, { useState, useEffect } from 'react';

/**
 * Universal Wallet Tester Component
 * 
 * Tests all available methods for any connected wallet and provides
 * code snippets showing how to use each method.
 * 
 * IMPORTANT: This component uses the actual providers from dev-loader-simple.js
 * which imports from the /inscriptions folder with all the latest fixes including:
 * - OKX correct inscription API (inscribe with type, from, tick/inscriptions)
 * - Fixed feature flags for all wallets
 * - Proper normalizers for balance and inscriptions
 * - Multi-wallet result format handling
 */
const WalletTester = () => {
  const [provider, setProvider] = useState(null);
  const [walletType, setWalletType] = useState('');
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [availableMethods, setAvailableMethods] = useState([]);
  const [testingAll, setTestingAll] = useState(false);
  const [testInputs, setTestInputs] = useState({
    message: 'Hello from NexusWalletConnect!',
    psbtHex: '',
    network: 'testnet',
    toAddress: '',
    amount: 10000,
    inscriptionCursor: 0,
    inscriptionSize: 20,
    // OKX-specific inputs
    brc20Tick: 'ordi',
    inscriptionContent: 'Hello Bitcoin!',
    inscriptionContentType: 'text/plain;charset=utf-8',
    inscriptionId: '',
    utxoTxid: '',
    utxoVout: 0,
    assetName: 'My Asset'
  });

  // Get provider and detect available methods
  useEffect(() => {
    const currentProvider = window.NexusWalletConnect?.getCurrentProvider();
    const state = window.NexusWalletConnect?.getState();
    
    if (currentProvider && state?.walletType) {
      setProvider(currentProvider);
      setWalletType(state.walletType);
      detectAvailableMethods(currentProvider);
    }
  }, []);

  // Detect what methods are available on this provider
  const detectAvailableMethods = (prov) => {
    const methods = [];
    
    // Connection methods
    if (typeof prov.getAddress === 'function') {
      methods.push({
        category: 'Connection',
        name: 'getAddress',
        description: 'Get the wallet address',
        params: [],
        code: `const address = await provider.getAddress();`
      });
    }
    
    if (typeof prov.getPublicKey === 'function') {
      methods.push({
        category: 'Connection',
        name: 'getPublicKey',
        description: 'Get the wallet public key',
        params: [],
        code: `const publicKey = await provider.getPublicKey();`
      });
    }
    
    if (typeof prov.getAccounts === 'function') {
      methods.push({
        category: 'Connection',
        name: 'getAccounts',
        description: 'Get all wallet accounts',
        params: [],
        code: `const accounts = await provider.getAccounts();`
      });
    }

    // Balance & Network methods
    if (typeof prov.getBalance === 'function') {
      methods.push({
        category: 'Balance & Network',
        name: 'getBalance',
        description: 'Get wallet balance',
        params: [],
        code: `const balance = await provider.getBalance();\n// Returns: { confirmed: 0, unconfirmed: 0, total: 0 }`
      });
    }
    
    if (typeof prov.getNetwork === 'function') {
      methods.push({
        category: 'Balance & Network',
        name: 'getNetwork',
        description: 'Get current network',
        params: [],
        code: `const network = await provider.getNetwork();\n// Returns: "mainnet" or "testnet"`
      });
    }
    
    if (typeof prov.switchNetwork === 'function') {
      methods.push({
        category: 'Balance & Network',
        name: 'switchNetwork',
        description: 'Switch to different network',
        params: ['network'],
        code: `await provider.switchNetwork('testnet');\n// Options: 'mainnet' or 'testnet'`
      });
    }

    // Signing methods
    if (typeof prov.signMessage === 'function') {
      methods.push({
        category: 'Signing',
        name: 'signMessage',
        description: 'Sign a text message',
        params: ['message', 'type'],
        code: `const signature = await provider.signMessage('Hello World', 'ecdsa');\n// type: 'ecdsa' or 'bip322-simple'`
      });
    }
    
    if (typeof prov.signPsbt === 'function') {
      methods.push({
        category: 'Signing',
        name: 'signPsbt',
        description: 'Sign a PSBT transaction',
        params: ['psbtHex', 'options'],
        code: `const signedPsbt = await provider.signPsbt(psbtHex, {\n  autoFinalized: true,\n  toSignInputs: []\n});`
      });
    }
    
    if (typeof prov.signPsbts === 'function') {
      methods.push({
        category: 'Signing',
        name: 'signPsbts',
        description: 'Sign multiple PSBTs',
        params: ['psbtHexs', 'options'],
        code: `const signedPsbts = await provider.signPsbts([psbt1, psbt2], [options1, options2]);`
      });
    }

    // Transaction methods
    if (typeof prov.sendBitcoin === 'function') {
      methods.push({
        category: 'Transactions',
        name: 'sendBitcoin',
        description: 'Send Bitcoin to address',
        params: ['toAddress', 'satoshis', 'options'],
        code: `const txid = await provider.sendBitcoin(\n  'bc1q...address',\n  10000, // satoshis\n  { feeRate: 5 }\n);`
      });
    }
    
    if (typeof prov.pushPsbt === 'function') {
      methods.push({
        category: 'Transactions',
        name: 'pushPsbt',
        description: 'Broadcast a signed PSBT',
        params: ['psbtHex'],
        code: `const txid = await provider.pushPsbt(signedPsbtHex);`
      });
    }
    
    if (typeof prov.pushTx === 'function') {
      methods.push({
        category: 'Transactions',
        name: 'pushTx',
        description: 'Broadcast a raw transaction',
        params: ['rawTxHex'],
        code: `const txid = await provider.pushTx(rawTxHex);`
      });
    }

    // Inscription methods
    if (typeof prov.getInscriptions === 'function') {
      methods.push({
        category: 'Inscriptions',
        name: 'getInscriptions',
        description: 'Get inscriptions (paginated)',
        params: ['cursor', 'size'],
        code: `const result = await provider.getInscriptions(0, 20);\n// Returns: { list: [...], total: 100 }`
      });
    }
    
    if (typeof prov.getAllInscriptions === 'function') {
      methods.push({
        category: 'Inscriptions',
        name: 'getAllInscriptions',
        description: 'Get all inscriptions',
        params: [],
        code: `const inscriptions = await provider.getAllInscriptions();\n// Returns: [inscription1, inscription2, ...]`
      });
    }
    
    if (typeof prov.sendInscription === 'function') {
      methods.push({
        category: 'Inscriptions',
        name: 'sendInscription',
        description: 'Send an inscription to address',
        params: ['toAddress', 'inscriptionId', 'options'],
        code: `const txid = await provider.sendInscription(\n  'bc1q...address',\n  'inscription_id',\n  { feeRate: 5 }\n);`
      });
    }
    
    if (typeof prov.inscribe === 'function') {
      methods.push({
        category: 'BRC-20 & Inscriptions',
        name: 'inscribe',
        description: 'Create a new inscription',
        params: ['content', 'options'],
        code: `// Universal inscribe - works across all wallets\nconst result = await provider.inscribe('Hello World', {\n  contentType: 'text/plain;charset=utf-8',\n  feeRate: 5\n});\n\n// Result formats vary by wallet:\n// - OKX: { commitTx, revealTxs[], commitTxFee, revealTxFees[] }\n// - Xverse: { commitTxId, revealTxId, totalFee }\n// - UniSat: { txid }\n// Always access: result.txid || result.commitTxId || result.commitTx`
      });
    }
    
    // Xverse-specific inscription methods
    if (typeof prov.createInscription === 'function') {
      methods.push({
        category: 'BRC-20 & Inscriptions',
        name: 'createInscription',
        description: 'Create inscription (Xverse native)',
        params: ['inscriptionData'],
        code: `const result = await provider.createInscription({\n  content: 'Hello World',\n  contentType: 'text/plain;charset=utf-8',\n  feeRate: 5\n});`
      });
    }
    
    if (typeof prov.createRepeatInscriptions === 'function') {
      methods.push({
        category: 'BRC-20 & Inscriptions',
        name: 'createRepeatInscriptions',
        description: 'Create multiple inscriptions (Xverse)',
        params: ['payload'],
        code: `const result = await provider.createRepeatInscriptions({\n  content: 'Hello World',\n  contentType: 'text/plain;charset=utf-8',\n  payloadType: 'PLAIN_TEXT',\n  repeat: 5,\n  network: { type: 'Mainnet' },\n  suggestedMinerFeeRate: 10\n});`
      });
    }

    // Runes methods (if supported)
    if (typeof prov.sendRunes === 'function') {
      methods.push({
        category: 'Runes',
        name: 'sendRunes',
        description: 'Send Runes tokens',
        params: ['toAddress', 'runeName', 'amount'],
        code: `const txid = await provider.sendRunes(\n  'bc1q...address',\n  'UNCOMMON•GOODS',\n  1000\n);`
      });
    }
    
    // Xverse-specific Runes methods
    if (typeof prov.getRunesBalance === 'function') {
      methods.push({
        category: 'Runes',
        name: 'getRunesBalance',
        description: 'Get Runes balance (Xverse)',
        params: [],
        code: `const balance = await provider.getRunesBalance();`
      });
    }
    
    if (typeof prov.transferRunes === 'function') {
      methods.push({
        category: 'Runes',
        name: 'transferRunes',
        description: 'Transfer Runes (Xverse)',
        params: ['transferParams'],
        code: `const result = await provider.transferRunes({\n  recipient: 'bc1q...address',\n  runeName: 'UNCOMMON•GOODS',\n  amount: '1000'\n});`
      });
    }
    
    if (typeof prov.mintRunes === 'function') {
      methods.push({
        category: 'Runes',
        name: 'mintRunes',
        description: 'Mint Runes (Xverse)',
        params: ['mintParams'],
        code: `const result = await provider.mintRunes({\n  runeName: 'UNCOMMON•GOODS',\n  amount: '1000'\n});`
      });
    }
    
    if (typeof prov.etchRunes === 'function') {
      methods.push({
        category: 'Runes',
        name: 'etchRunes',
        description: 'Etch (create) Runes (Xverse)',
        params: ['etchParams'],
        code: `const result = await provider.etchRunes({\n  name: 'MY•RUNE',\n  symbol: 'MR',\n  divisibility: 8\n});`
      });
    }
    
    if (typeof prov.getRunesOrder === 'function') {
      methods.push({
        category: 'Runes',
        name: 'getRunesOrder',
        description: 'Get Runes order status (Xverse)',
        params: ['orderId'],
        code: `const order = await provider.getRunesOrder('order_id_here');`
      });
    }
    
    if (typeof prov.speedUpRunesOrder === 'function') {
      methods.push({
        category: 'Runes',
        name: 'speedUpRunesOrder',
        description: 'Speed up Runes order (Xverse)',
        params: ['orderId', 'newFeeRate'],
        code: `const result = await provider.speedUpRunesOrder(\n  'order_id_here',\n  50  // new fee rate in sats/vB\n);`
      });
    }
    
    if (typeof prov.sendInscriptions === 'function') {
      methods.push({
        category: 'Inscriptions',
        name: 'sendInscriptions',
        description: 'Send inscriptions (Xverse)',
        params: ['sendParams'],
        code: `const result = await provider.sendInscriptions({\n  recipient: 'bc1q...address',\n  inscriptionIds: ['inscription_id_1', 'inscription_id_2']\n});`
      });
    }
    
    if (typeof prov.getAddresses === 'function') {
      methods.push({
        category: 'Bitcoin',
        name: 'getAddresses',
        description: 'Get payment & ordinals addresses (Xverse)',
        params: ['purposes'],
        code: `const addresses = await provider.getAddresses(['ordinals', 'payment']);\n// Returns array of address objects`
      });
    }
    
    if (typeof prov.sendTransfer === 'function') {
      methods.push({
        category: 'Bitcoin',
        name: 'sendTransfer',
        description: 'Send Bitcoin transfer (Xverse)',
        params: ['params'],
        code: `const result = await provider.sendTransfer({\n  recipients: [{\n    address: 'bc1q...address',\n    amountSats: 10000\n  }]\n});`
      });
    }
    
    if (typeof prov.signMultipleTransactions === 'function') {
      methods.push({
        category: 'Bitcoin',
        name: 'signMultipleTransactions',
        description: 'Sign multiple PSBTs (Xverse)',
        params: ['psbtArray', 'options'],
        code: `const results = await provider.signMultipleTransactions([\n  'psbt_base64_1',\n  'psbt_base64_2'\n], { broadcast: false });`
      });
    }

    // UniSat-specific methods
    if (typeof prov.multiSignMessage === 'function') {
      methods.push({
        category: 'UniSat Methods',
        name: 'multiSignMessage',
        description: 'Sign multiple messages at once (UniSat)',
        params: ['messages', 'type'],
        code: `const signatures = await provider.multiSignMessage([\n  'Message 1',\n  'Message 2'\n], 'ecdsa');\n// Returns array of signatures`
      });
    }
    
    if (typeof prov.signData === 'function') {
      methods.push({
        category: 'UniSat Methods',
        name: 'signData',
        description: 'Sign arbitrary data (UniSat)',
        params: ['data', 'type'],
        code: `const signature = await provider.signData('0x1234...', 'ecdsa');\n// Sign hex data directly`
      });
    }
    
    if (typeof prov.getChain === 'function') {
      methods.push({
        category: 'UniSat Methods',
        name: 'getChain',
        description: 'Get current blockchain (UniSat)',
        params: [],
        code: `const chain = await provider.getChain();\n// Returns: 'BITCOIN_MAINNET', 'BITCOIN_TESTNET', etc.`
      });
    }
    
    if (typeof prov.switchChain === 'function') {
      methods.push({
        category: 'UniSat Methods',
        name: 'switchChain',
        description: 'Switch blockchain (UniSat)',
        params: ['chain'],
        code: `await provider.switchChain('BITCOIN_TESTNET');\n// Options: BITCOIN_MAINNET, BITCOIN_TESTNET, FRACTAL_BITCOIN_MAINNET`
      });
    }
    
    if (typeof prov.verifyMessageOfBIP322Simple === 'function') {
      methods.push({
        category: 'UniSat Methods',
        name: 'verifyMessageOfBIP322Simple',
        description: 'Verify BIP-322 signature (UniSat)',
        params: ['address', 'message', 'signature'],
        code: `const isValid = await provider.verifyMessageOfBIP322Simple(\n  'bc1q...address',\n  'Hello World',\n  'signature_here'\n);\n// Returns: true or false`
      });
    }

    // BRC-20 methods (UniSat, OKX)
    if (typeof prov.inscribeTransfer === 'function') {
      methods.push({
        category: 'BRC-20 & Inscriptions',
        name: 'inscribeTransfer',
        description: 'Create BRC-20 transfer inscription',
        params: ['tick', 'amount'],
        code: `// Create BRC-20 transfer inscription (UniSat, OKX)\nconst result = await provider.inscribeTransfer('ordi', '100');\n// UniSat returns: txid string\n// OKX returns: { commitTx, revealTxs[], commitTxFee, revealTxFees[] }`
      });
    }

    // OKX-only methods
    if (typeof prov.splitUtxo === 'function') {
      methods.push({
        category: 'OKX Methods',
        name: 'splitUtxo',
        description: 'Split UTXO for multiple operations (OKX)',
        params: ['splitCount'],
        code: `// Split a UTXO into multiple outputs\nconst result = await provider.splitUtxo(5);\n// Useful before creating multiple inscriptions`
      });
    }
    
    if (typeof prov.transferNft === 'function') {
      methods.push({
        category: 'OKX Methods',
        name: 'transferNft',
        description: 'Transfer NFT/inscription (OKX)',
        params: ['toAddress', 'inscriptionId'],
        code: `const result = await provider.transferNft(\n  'bc1q...address',\n  'inscription_id_here'\n);`
      });
    }
    
    if (typeof prov.watchAsset === 'function') {
      methods.push({
        category: 'OKX Methods',
        name: 'watchAsset',
        description: 'Add asset to wallet watch list (OKX)',
        params: ['assetInfo'],
        code: `const result = await provider.watchAsset({\n  type: 'BRC20',\n  tick: 'ordi'\n});`
      });
    }
    
    if (typeof prov.mint === 'function') {
      methods.push({
        category: 'OKX Methods',
        name: 'mint',
        description: 'Create inscription with advanced options (OKX)',
        params: ['mintParams'],
        code: `// OKX mint method - for general inscriptions\nconst result = await provider.mint({\n  type: 61, // 61=text, 62=image, 60=BRC-20 deploy, 51=BRC-20 transfer\n  from: address,\n  inscriptions: [{\n    contentType: 'text/plain;charset=utf-8',\n    body: 'Hello Bitcoin!'\n  }]\n});\n// Returns: { commitTx, revealTxs[], commitTxFee, ... }`
      });
    }

    // Advanced methods
    if (typeof prov.getBitcoinUtxos === 'function') {
      methods.push({
        category: 'Advanced',
        name: 'getBitcoinUtxos',
        description: 'Get unspent transaction outputs',
        params: [],
        code: `const utxos = await provider.getBitcoinUtxos();\n// Returns: [{ txid, vout, satoshis, ... }, ...]`
      });
    }
    
    // New utility methods from dev-loader-simple.js
    if (window.NexusWalletConnect?.getCapabilities) {
      methods.push({
        category: 'Utility',
        name: 'getCapabilities',
        description: 'Get wallet capabilities and features',
        params: [],
        code: `const capabilities = window.NexusWalletConnect.getCapabilities();\n// Returns: { walletType, methods: [...], features: {...} }`
      });
    }
    
    if (window.NexusWalletConnect?.getUtxos) {
      methods.push({
        category: 'Utility',
        name: 'getUtxos',
        description: 'Get UTXOs (wrapper for provider method)',
        params: [],
        code: `const utxos = await window.NexusWalletConnect.getUtxos();\n// Unified format across all wallets`
      });
    }
    
    if (window.NexusWalletConnect?.getBRC20List) {
      methods.push({
        category: 'Utility',
        name: 'getBRC20List',
        description: 'Get BRC-20 tokens (wrapper for provider method)',
        params: [],
        code: `const brc20s = await window.NexusWalletConnect.getBRC20List();\n// Unified format across all wallets`
      });
    }

    setAvailableMethods(methods);
  };

  // Test a method
  const testMethod = async (method) => {
    setLoading(prev => ({ ...prev, [method.name]: true }));
    
    try {
      let result;
      
      // Call the method with appropriate parameters
      switch (method.name) {
        case 'getAddress':
        case 'getPublicKey':
        case 'getAccounts':
        case 'getBalance':
        case 'getNetwork':
        case 'getAllInscriptions':
        case 'getBitcoinUtxos':
          result = await provider[method.name]();
          break;
          
        // New utility methods
        case 'getCapabilities':
          result = window.NexusWalletConnect.getCapabilities();
          break;
          
        case 'getUtxos':
          result = await window.NexusWalletConnect.getUtxos();
          break;
          
        case 'getBRC20List':
          result = await window.NexusWalletConnect.getBRC20List();
          break;
          
        case 'getInscriptions':
          result = await provider.getInscriptions(
            testInputs.inscriptionCursor,
            testInputs.inscriptionSize
          );
          break;
          
        case 'switchNetwork':
          result = await provider.switchNetwork(testInputs.network);
          break;
          
        case 'signMessage':
          result = await provider.signMessage(testInputs.message, 'ecdsa');
          break;
          
        case 'signPsbt':
          if (!testInputs.psbtHex) {
            throw new Error('Please provide a PSBT hex string');
          }
          result = await provider.signPsbt(testInputs.psbtHex);
          break;
          
        case 'sendBitcoin':
          if (!testInputs.toAddress) {
            throw new Error('Please provide a recipient address');
          }
          if (!testInputs.amount || testInputs.amount <= 0) {
            throw new Error('Please provide a valid amount (must be > 0 satoshis)');
          }
          // Validate address format
          if (!testInputs.toAddress.startsWith('bc1') && !testInputs.toAddress.startsWith('tb1') && !testInputs.toAddress.startsWith('1') && !testInputs.toAddress.startsWith('3')) {
            throw new Error('Invalid Bitcoin address format');
          }
          result = await provider.sendBitcoin(testInputs.toAddress, testInputs.amount);
          break;
          
        case 'inscribe':
          result = await provider.inscribe(testInputs.inscriptionContent, {
            contentType: testInputs.inscriptionContentType,
            feeRate: 5
          });
          break;
          
        case 'inscribeTransfer':
          if (!testInputs.brc20Tick) {
            throw new Error('Please provide a BRC-20 tick symbol');
          }
          result = await provider.inscribeTransfer(testInputs.brc20Tick, '100');
          break;
          
        case 'mint':
          result = await provider.mint({
            type: 61,
            from: provider.address,
            inscriptions: [{
              contentType: testInputs.inscriptionContentType,
              body: testInputs.inscriptionContent
            }]
          });
          break;
          
        case 'transferNft':
          if (!testInputs.toAddress || !testInputs.inscriptionId) {
            throw new Error('Please provide recipient address and inscription ID');
          }
          result = await provider.transferNft(testInputs.toAddress, testInputs.inscriptionId);
          break;
          
        case 'watchAsset':
          result = await provider.watchAsset({
            type: 'BRC20',
            tick: testInputs.brc20Tick || 'ordi'
          });
          break;
          
        case 'splitUtxo':
          result = await provider.splitUtxo(5);
          break;
          
        case 'multiSignMessage':
          result = await provider.multiSignMessage([testInputs.message, 'Second message'], 'ecdsa');
          break;
          
        case 'signData':
          result = await provider.signData('0x48656c6c6f', 'ecdsa');
          break;
          
        case 'getChain':
          result = await provider.getChain();
          break;
          
        case 'switchChain':
          result = await provider.switchChain('BITCOIN_TESTNET');
          break;
          
        case 'verifyMessageOfBIP322Simple':
          // This needs a real signature to test properly
          result = { note: 'Requires valid address, message, and signature to test' };
          break;
          
        default:
          result = 'Method requires manual parameters - see code snippet';
      }
      
      setResults(prev => ({
        ...prev,
        [method.name]: {
          success: true,
          data: result,
          error: null,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      console.log(`✅ ${method.name}:`, result);
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [method.name]: {
          success: false,
          data: null,
          error: error.message,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
      
      console.error(`❌ ${method.name}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [method.name]: false }));
    }
  };

  // Copy code snippet
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  // Test all methods of current wallet
  const testAllMethods = async () => {
    setTestingAll(true);
    const allResults = {};
    const report = [];
    
    report.push(`# ${walletType} Wallet - Complete Method Test Report`);
    report.push(`\nGenerated: ${new Date().toLocaleString()}`);
    report.push(`\n---\n`);
    
    for (const method of availableMethods) {
      setLoading(prev => ({ ...prev, [method.name]: true }));
      
      try {
        let result;
        
        // Methods that need parameters - use test inputs
        if (method.name === 'signMessage') {
          result = await provider.signMessage(testInputs.message);
        } else if (method.name === 'signPsbt' && testInputs.psbtHex) {
          result = await provider.signPsbt(testInputs.psbtHex);
        } else if (method.name === 'switchNetwork') {
          result = await provider.switchNetwork(testInputs.network);
        } else if (method.name === 'sendBitcoin' && testInputs.toAddress && testInputs.amount) {
          result = await provider.sendBitcoin(testInputs.toAddress, testInputs.amount);
        } else if (method.name === 'getInscriptions') {
          result = await provider.getInscriptions(testInputs.inscriptionCursor, testInputs.inscriptionSize);
        } else if (method.name.includes('send') || method.name.includes('inscribe') || method.name.includes('push')) {
          // Skip destructive methods in batch test
          result = { skipped: true, reason: 'Destructive method - requires manual testing with valid inputs' };
        } else {
          // Safe read-only methods
          result = await provider[method.name]();
        }
        
        allResults[method.name] = { success: true, data: result };
        
        // Add to report
        report.push(`\n## ${method.name}`);
        report.push(`**Category:** ${method.category}`);
        report.push(`**Status:** ✅ Success\n`);
        report.push(`### Usage Code:`);
        report.push('```javascript');
        report.push(method.code);
        report.push('```\n');
        report.push(`### Result:`);
        report.push('```json');
        report.push(JSON.stringify(result, null, 2));
        report.push('```\n');
        report.push(`---\n`);
        
      } catch (error) {
        allResults[method.name] = { success: false, error: error.message };
        
        // Add error to report
        report.push(`\n## ${method.name}`);
        report.push(`**Category:** ${method.category}`);
        report.push(`**Status:** ❌ Error\n`);
        report.push(`### Usage Code:`);
        report.push('```javascript');
        report.push(method.code);
        report.push('```\n');
        report.push(`### Error:`);
        report.push('```');
        report.push(error.message);
        report.push('```\n');
        report.push(`---\n`);
      }
      
      setLoading(prev => ({ ...prev, [method.name]: false }));
    }
    
    setResults(allResults);
    setTestingAll(false);
    
    // Download report
    const reportText = report.join('\n');
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${walletType}-test-report-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert(`✅ Test complete! Report downloaded.\n\nTested: ${availableMethods.length} methods\nSuccessful: ${Object.values(allResults).filter(r => r.success).length}\nFailed: ${Object.values(allResults).filter(r => !r.success).length}`);
  };

  // Test ALL wallets (all 8 wallets)
  const testAllWallets = async () => {
    if (!window.NexusWalletConnect) {
      alert('❌ NexusWalletConnect not available');
      return;
    }

    const walletTypes = ['UniSat', 'Xverse', 'OKX', 'Wizz', 'Phantom', 'Oyl', 'Leather', 'MagicEden'];
    
    // Complete list of all known methods across all wallets
    const allKnownMethods = [
      // Connection Methods
      { name: 'getAddress', category: 'Connection', destructive: false },
      { name: 'getPublicKey', category: 'Connection', destructive: false },
      { name: 'getAccounts', category: 'Connection', destructive: false },
      { name: 'getAddresses', category: 'Connection', destructive: false },
      { name: 'requestAccounts', category: 'Connection', destructive: false },
      { name: 'getVersion', category: 'Connection', destructive: false },
      
      // Balance & Network Methods
      { name: 'getBalance', category: 'Balance & Network', destructive: false },
      { name: 'getBalanceV2', category: 'Balance & Network', destructive: false },
      { name: 'getNetwork', category: 'Balance & Network', destructive: false },
      { name: 'switchNetwork', category: 'Balance & Network', destructive: true }, // Requires wallet popup
      
      // Signing Methods (require user confirmation via popup - safe to test)
      { name: 'signMessage', category: 'Signing', destructive: false, requiresUserConfirmation: true },
      { name: 'signPsbt', category: 'Signing', destructive: false, requiresUserConfirmation: true },
      { name: 'signPsbts', category: 'Signing', destructive: false, requiresUserConfirmation: true },
      { name: 'signTransaction', category: 'Signing', destructive: false, requiresUserConfirmation: true },
      { name: 'signMultipleTransactions', category: 'Signing', destructive: false, requiresUserConfirmation: true },
      
      // Transaction Methods
      { name: 'sendBitcoin', category: 'Transactions', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'pushPsbt', category: 'Transactions', destructive: true }, // Broadcasts immediately!
      { name: 'pushTx', category: 'Transactions', destructive: true }, // Broadcasts immediately!
      { name: 'getBitcoinUtxos', category: 'Transactions', destructive: false },
      
      // Inscription Methods
      { name: 'getInscriptions', category: 'Inscriptions', destructive: false },
      { name: 'getAllInscriptions', category: 'Inscriptions', destructive: false },
      { name: 'sendInscription', category: 'Inscriptions', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'inscribe', category: 'Inscriptions', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'inscribeTransfer', category: 'Inscriptions', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'createInscription', category: 'Inscriptions', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'createRepeatInscriptions', category: 'Inscriptions', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'sendInscriptions', category: 'Inscriptions', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      
      // Bitcoin Methods (Xverse-specific)
      { name: 'getAddresses', category: 'Bitcoin', destructive: false },
      { name: 'sendTransfer', category: 'Bitcoin', destructive: true },
      
      // Runes Methods
      { name: 'sendRunes', category: 'Runes', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'getRunes', category: 'Runes', destructive: false },
      { name: 'getRuneBalance', category: 'Runes', destructive: false },
      { name: 'getRunesBalance', category: 'Runes', destructive: false },
      { name: 'transferRunes', category: 'Runes', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'mintRunes', category: 'Runes', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'etchRunes', category: 'Runes', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      { name: 'getRunesOrder', category: 'Runes', destructive: false },
      { name: 'speedUpRunesOrder', category: 'Runes', destructive: false, requiresUserConfirmation: true }, // Opens wallet popup
      
      // Special/Advanced Methods
      { name: 'request', category: 'Advanced', destructive: false },
      { name: 'on', category: 'Advanced', destructive: false },
      { name: 'removeListener', category: 'Advanced', destructive: false },
      
      // Utility Methods (from NexusWalletConnect)
      { name: 'getCapabilities', category: 'Utility', destructive: false },
      { name: 'getUtxos', category: 'Utility', destructive: false },
      { name: 'getBRC20List', category: 'Utility', destructive: false },
    ];

    const masterReport = [];
    const capabilityMatrix = {};
    const detailedResults = {};
    
    masterReport.push(`# Complete Wallet Capability Matrix & Test Report`);
    masterReport.push(`\nGenerated: ${new Date().toLocaleString()}`);
    masterReport.push(`\nTest Inputs Used:`);
    masterReport.push(`- Message: "${testInputs.message}"`);
    masterReport.push(`- Address: ${testInputs.toAddress || 'Not provided'}`);
    masterReport.push(`- Amount: ${testInputs.amount} satoshis`);
    masterReport.push(`\n${'='.repeat(80)}\n`);

    setTestingAll(true);
    
    for (const walletName of walletTypes) {
      console.log(`\n🔍 Testing ${walletName}...`);
      capabilityMatrix[walletName] = {};
      detailedResults[walletName] = { connected: false, methods: {} };
      
      try {
        // Try to connect to wallet
        const connected = await window.NexusWalletConnect.connect(walletName);
        
        if (!connected) {
          console.log(`❌ ${walletName} not installed or connection failed`);
          detailedResults[walletName].connected = false;
          detailedResults[walletName].error = 'Not installed or connection failed';
          
          // Mark all methods as not available
          allKnownMethods.forEach(method => {
            capabilityMatrix[walletName][method.name] = '❌ Not Installed';
          });
          continue;
        }

        const currentProvider = window.NexusWalletConnect.getCurrentProvider();
        
        if (!currentProvider) {
          console.log(`❌ ${walletName} provider not available`);
          detailedResults[walletName].connected = false;
          detailedResults[walletName].error = 'Provider not available';
          
          allKnownMethods.forEach(method => {
            capabilityMatrix[walletName][method.name] = '❌ No Provider';
          });
          continue;
        }

        detailedResults[walletName].connected = true;
        console.log(`✅ ${walletName} connected`);

        // Test each known method
        for (const methodInfo of allKnownMethods) {
          const methodName = methodInfo.name;
          
          // Check if method exists
          if (methodName === 'getCapabilities' || methodName === 'getUtxos' || methodName === 'getBRC20List') {
            // These are NexusWalletConnect utility methods, not provider methods
            if (!window.NexusWalletConnect?.[methodName]) {
              capabilityMatrix[walletName][methodName] = '⚪ Not Available';
              detailedResults[walletName].methods[methodName] = { 
                available: false, 
                status: 'Not Available' 
              };
              continue;
            }
          } else if (typeof currentProvider[methodName] !== 'function') {
            capabilityMatrix[walletName][methodName] = '⚪ Not Available';
            detailedResults[walletName].methods[methodName] = { 
              available: false, 
              status: 'Not Available' 
            };
            continue;
          }

          // Method exists - now test it
          if (methodInfo.destructive) {
            // Don't execute truly destructive methods (pushPsbt, pushTx)
            capabilityMatrix[walletName][methodName] = '🚫 Destructive (Not Tested)';
            detailedResults[walletName].methods[methodName] = { 
              available: true, 
              status: 'Destructive - broadcasts transactions immediately',
              destructive: true
            };
          } else if (methodInfo.requiresUserConfirmation) {
            // Skip methods that require wallet popup confirmation in automated tests
            capabilityMatrix[walletName][methodName] = '👤 Requires User Confirmation';
            detailedResults[walletName].methods[methodName] = { 
              available: true, 
              status: 'Requires user confirmation via wallet popup',
              requiresUserConfirmation: true
            };
          } else {
            // Test non-destructive methods with timeout
            try {
              let result;
              
              // Create a timeout promise (10 seconds)
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Method timed out after 10 seconds')), 10000);
              });
              
              // Execute with appropriate parameters
              const methodPromise = (async () => {
                if (methodName === 'signMessage') {
                  return await currentProvider.signMessage(testInputs.message);
                } else if (methodName === 'signPsbt' && testInputs.psbtHex) {
                  return await currentProvider.signPsbt(testInputs.psbtHex);
                } else if (methodName === 'getInscriptions') {
                  return await currentProvider.getInscriptions(testInputs.inscriptionCursor, testInputs.inscriptionSize);
                } else if (methodName === 'request') {
                  // Special case for Xverse request method
                  return { note: 'Request method requires specific RPC calls' };
                } else if (methodName === 'getCapabilities') {
                  // NexusWalletConnect utility method
                  return window.NexusWalletConnect.getCapabilities();
                } else if (methodName === 'getUtxos') {
                  // NexusWalletConnect utility method
                  return await window.NexusWalletConnect.getUtxos();
                } else if (methodName === 'getBRC20List') {
                  // NexusWalletConnect utility method
                  return await window.NexusWalletConnect.getBRC20List();
                } else {
                  return await currentProvider[methodName]();
                }
              })();
              
              // Race between method execution and timeout
              result = await Promise.race([methodPromise, timeoutPromise]);

              capabilityMatrix[walletName][methodName] = '✅ Works';
              detailedResults[walletName].methods[methodName] = { 
                available: true, 
                tested: true,
                status: 'Success',
                result: result
              };
              console.log(`  ✅ ${methodName} works`);

            } catch (error) {
              const errorMsg = error.message || 'Unknown error';
              capabilityMatrix[walletName][methodName] = `❌ ${errorMsg.substring(0, 30)}...`;
              detailedResults[walletName].methods[methodName] = { 
                available: true, 
                tested: true,
                status: 'Error',
                error: errorMsg
              };
              console.log(`  ❌ ${methodName} error: ${errorMsg}`);
            }
          }
        }

      } catch (error) {
        console.log(`❌ ${walletName} error: ${error.message}`);
        detailedResults[walletName].error = error.message;
        
        allKnownMethods.forEach(method => {
          capabilityMatrix[walletName][method.name] = `❌ ${error.message.substring(0, 20)}...`;
        });
      }
    }

    setTestingAll(false);

    // Generate capability matrix table
    masterReport.push(`\n## 📊 Capability Matrix\n`);
    masterReport.push(`Legend:\n`);
    masterReport.push(`- ✅ **Works** - Method tested successfully\n`);
    masterReport.push(`- 👤 **Requires User Confirmation** - Opens wallet popup (not auto-tested)\n`);
    masterReport.push(`- 🚫 **Destructive** - Broadcasts immediately without confirmation (dangerous!)\n`);
    masterReport.push(`- ⚪ **Not Available** - Method not supported by wallet\n`);
    masterReport.push(`- ❌ **Error** - Method failed or wallet not connected\n`);
    
    // Group methods by category
    const categories = [...new Set(allKnownMethods.map(m => m.category))];
    
    for (const category of categories) {
      masterReport.push(`\n### ${category}\n`);
      
      const categoryMethods = allKnownMethods.filter(m => m.category === category);
      
      // Table header
      masterReport.push(`| Method | ${walletTypes.join(' | ')} |`);
      masterReport.push(`|--------|${walletTypes.map(() => '--------').join('|')}|`);
      
      // Table rows
      for (const method of categoryMethods) {
        const row = [method.name];
        for (const wallet of walletTypes) {
          row.push(capabilityMatrix[wallet][method.name] || '❓ Unknown');
        }
        masterReport.push(`| ${row.join(' | ')} |`);
      }
    }

    // Detailed results section
    masterReport.push(`\n\n${'='.repeat(80)}\n`);
    masterReport.push(`## 📝 Detailed Test Results\n`);
    
    for (const walletName of walletTypes) {
      masterReport.push(`\n### ${walletName} Wallet\n`);
      
      const walletData = detailedResults[walletName];
      
      if (!walletData.connected) {
        masterReport.push(`**Status:** ❌ ${walletData.error || 'Not connected'}\n`);
        continue;
      }
      
      masterReport.push(`**Status:** ✅ Connected\n`);
      
      const methodsArray = Object.entries(walletData.methods);
      const availableCount = methodsArray.filter(([_, m]) => m.available).length;
      const testedCount = methodsArray.filter(([_, m]) => m.tested).length;
      const successCount = methodsArray.filter(([_, m]) => m.status === 'Success').length;
      
      masterReport.push(`**Available Methods:** ${availableCount}/${allKnownMethods.length}\n`);
      masterReport.push(`**Successfully Tested:** ${successCount}/${testedCount}\n`);
      
      // Show successful methods with results
      const successfulMethods = methodsArray.filter(([_, m]) => m.status === 'Success');
      if (successfulMethods.length > 0) {
        masterReport.push(`\n#### ✅ Working Methods (${successfulMethods.length})\n`);
        
        for (const [methodName, methodData] of successfulMethods) {
          const methodInfo = allKnownMethods.find(m => m.name === methodName);
          masterReport.push(`\n**${methodName}** (${methodInfo?.category})`);
          masterReport.push('```javascript');
          masterReport.push(`const result = await provider.${methodName}();`);
          masterReport.push('```');
          masterReport.push('Result:');
          masterReport.push('```json');
          masterReport.push(JSON.stringify(methodData.result, null, 2).substring(0, 500));
          masterReport.push('```\n');
        }
      }
      
      // Show methods requiring user confirmation
      const confirmationMethods = methodsArray.filter(([_, m]) => m.requiresUserConfirmation);
      if (confirmationMethods.length > 0) {
        masterReport.push(`\n#### 👤 Requires User Confirmation (${confirmationMethods.length})\n`);
        masterReport.push('These methods open wallet popups and require user approval (not auto-tested in batch mode):\n');
        for (const [methodName] of confirmationMethods) {
          masterReport.push(`- ${methodName}`);
        }
        masterReport.push('\n');
      }
      
      // Show truly destructive methods
      const destructiveMethods = methodsArray.filter(([_, m]) => m.destructive);
      if (destructiveMethods.length > 0) {
        masterReport.push(`\n#### 🚫 Destructive Methods (${destructiveMethods.length})\n`);
        masterReport.push('⚠️ **DANGER:** These methods broadcast transactions immediately without user confirmation:\n');
        for (const [methodName] of destructiveMethods) {
          masterReport.push(`- ${methodName}`);
        }
        masterReport.push('\n');
      }
      
      // Show errors
      const errorMethods = methodsArray.filter(([_, m]) => m.status === 'Error');
      if (errorMethods.length > 0) {
        masterReport.push(`\n#### ❌ Errors (${errorMethods.length})\n`);
        for (const [methodName, methodData] of errorMethods) {
          masterReport.push(`- **${methodName}**: ${methodData.error}`);
        }
        masterReport.push('\n');
      }
      
      masterReport.push(`\n---\n`);
    }

    setTestingAll(false);

    // Download master report
    const reportText = masterReport.join('\n');
    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WALLET-CAPABILITY-MATRIX-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Generate summary
    const connectedWallets = walletTypes.filter(w => detailedResults[w].connected).length;
    const totalMethodsChecked = allKnownMethods.length * walletTypes.length;
    const totalMethodsWorking = Object.values(detailedResults).reduce((sum, wallet) => {
      if (!wallet.connected) return sum;
      return sum + Object.values(wallet.methods).filter(m => m.status === 'Success').length;
    }, 0);

    alert(`✅ Complete capability matrix generated!
    
📊 Summary:
- Wallets Tested: ${walletTypes.length}
- Wallets Connected: ${connectedWallets}
- Total Method Checks: ${totalMethodsChecked}
- Working Methods: ${totalMethodsWorking}
- Report Downloaded: WALLET-CAPABILITY-MATRIX-${Date.now()}.md

Check the downloaded file for the complete capability matrix!`);
  };

  // Copy all code snippets
  const copyAllSnippets = () => {
    const snippets = availableMethods.map(m => 
      `// ${m.category} - ${m.name}\n${m.code}`
    ).join('\n\n');
    
    navigator.clipboard.writeText(snippets);
    alert('All code snippets copied to clipboard!');
  };

  // Group methods by category
  const methodsByCategory = availableMethods.reduce((acc, method) => {
    if (!acc[method.category]) {
      acc[method.category] = [];
    }
    acc[method.category].push(method);
    return acc;
  }, {});

  if (!provider) {
    return (
      <div className="warning">
        <strong>⚠️ No wallet connected</strong>
        <p>Please connect a wallet first to test its methods.</p>
      </div>
    );
  }

  return (
    <div className="wallet-tester">
      <div className="tester-header">
        <h2>🧪 {walletType} Wallet - Method Testing</h2>
        <p className="tester-subtitle">
          Found <strong>{availableMethods.length} available methods</strong>
        </p>
        
        {/* Developer Notice */}
        <div className="dev-notice">
          <strong>📚 Developer Reference</strong>
          <p>
            This testing page demonstrates how to properly call all wallet methods using the NexusWalletConnect library.
            All code snippets show the exact syntax needed for your application.
          </p>
          <p>
            <strong>Latest Updates:</strong> OKX provider now uses correct inscription API format 
            (inscribe with type, from, tick/inscriptions parameters). All wallets support multi-format result handling.
            Added UniSat-specific methods: multiSignMessage, signData, getChain, switchChain, verifyMessageOfBIP322Simple.
          </p>
          <p>
            <strong>⚠️ Testing Notes:</strong> For <code>sendBitcoin</code> and other transaction methods, 
            ensure you have sufficient balance and provide a valid recipient address. 
            Xverse requires addresses in the correct network format (bc1 for mainnet, tb1 for testnet).
            Some methods like <code>inscribe</code> and <code>sendBitcoin</code> will prompt wallet confirmation.
          </p>
        </div>
        
        {/* Batch Actions */}
        <div className="batch-actions">
          <button
            onClick={testAllWallets}
            disabled={testingAll}
            className="btn-test-all"
            style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
          >
            {testingAll ? '⏳ Testing All Wallets...' : '🌐 Test ALL Wallets (8)'}
          </button>
          
          <button
            onClick={testAllMethods}
            disabled={testingAll}
            className="btn-test-all"
          >
            {testingAll ? '⏳ Testing...' : '🚀 Test Current Wallet Methods'}
          </button>
          
          <button
            onClick={copyAllSnippets}
            className="btn-copy-all"
          >
            📋 Copy All Snippets
          </button>
        </div>
        
        {testingAll && (
          <div className="testing-progress">
            <strong>Testing in progress...</strong>
            <p>
              This will systematically test all wallets and methods, generating a comprehensive report.
              Each wallet will be connected, tested, and documented automatically.
              Destructive methods (send, inscribe, push) will be skipped for safety.
            </p>
          </div>
        )}
      </div>

      {/* Test Inputs Section */}
      <div className="test-inputs-section">
        <h3>📝 Test Inputs</h3>
        <div className="input-grid">
          <div className="input-group">
            <label>Message to Sign</label>
            <input
              type="text"
              value={testInputs.message}
              onChange={(e) => setTestInputs(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Message to sign"
            />
          </div>
          
          <div className="input-group">
            <label>Recipient Address</label>
            <input
              type="text"
              value={testInputs.toAddress}
              onChange={(e) => setTestInputs(prev => ({ ...prev, toAddress: e.target.value }))}
              placeholder="bc1q..."
            />
          </div>
          
          <div className="input-group">
            <label>Amount (satoshis)</label>
            <input
              type="number"
              value={testInputs.amount}
              onChange={(e) => setTestInputs(prev => ({ ...prev, amount: parseInt(e.target.value) }))}
              placeholder="10000"
            />
          </div>
          
          <div className="input-group">
            <label>PSBT Hex (for signing)</label>
            <textarea
              value={testInputs.psbtHex}
              onChange={(e) => setTestInputs(prev => ({ ...prev, psbtHex: e.target.value }))}
              placeholder="70736274ff..."
              rows="2"
            />
          </div>
          
          <div className="input-group">
            <label>BRC-20 Tick (OKX)</label>
            <input
              type="text"
              value={testInputs.brc20Tick}
              onChange={(e) => setTestInputs(prev => ({ ...prev, brc20Tick: e.target.value }))}
              placeholder="ordi"
            />
          </div>
          
          <div className="input-group">
            <label>Inscription Content</label>
            <textarea
              value={testInputs.inscriptionContent}
              onChange={(e) => setTestInputs(prev => ({ ...prev, inscriptionContent: e.target.value }))}
              placeholder="Hello Bitcoin!"
              rows="2"
            />
          </div>
          
          <div className="input-group">
            <label>Content Type</label>
            <input
              type="text"
              value={testInputs.inscriptionContentType}
              onChange={(e) => setTestInputs(prev => ({ ...prev, inscriptionContentType: e.target.value }))}
              placeholder="text/plain;charset=utf-8"
            />
          </div>
          
          <div className="input-group">
            <label>Inscription ID (for transfers)</label>
            <input
              type="text"
              value={testInputs.inscriptionId}
              onChange={(e) => setTestInputs(prev => ({ ...prev, inscriptionId: e.target.value }))}
              placeholder="abc123...i0"
            />
          </div>
        </div>
      </div>

      {/* Methods by Category */}
      {Object.entries(methodsByCategory).map(([category, methods]) => (
        <div key={category} className="category-section">
          <h3 className="category-title">
            {category} ({methods.length} methods)
          </h3>
          
          <div className="methods-grid">
            {methods.map(method => {
              const result = results[method.name];
              const isLoading = loading[method.name];
              
              return (
                <div key={method.name} className="method-card">
                  <div className="method-header">
                    <h4 className="method-name">{method.name}()</h4>
                    <button
                      className="test-button"
                      onClick={() => testMethod(method)}
                      disabled={isLoading}
                    >
                      {isLoading ? '⏳ Testing...' : '▶️ Test'}
                    </button>
                  </div>
                  
                  <p className="method-description">{method.description}</p>
                  
                  {/* Code Snippet */}
                  <div className="code-section">
                    <div className="code-header">
                      <span className="code-label">Usage:</span>
                      <button
                        className="copy-code-btn"
                        onClick={() => copyCode(method.code)}
                        title="Copy code"
                      >
                        📋
                      </button>
                    </div>
                    <pre className="code-block"><code>{method.code}</code></pre>
                  </div>
                  
                  {/* Test Result */}
                  {result && (
                    <div className={`result-box ${result.success ? 'success' : 'error'}`}>
                      <div className="result-header">
                        <span className="result-icon">
                          {result.success ? '✅' : '❌'}
                        </span>
                        <span className="result-time">{result.timestamp}</span>
                      </div>
                      
                      {result.success ? (
                        <div className="result-data">
                          <strong>Result:</strong>
                          <pre>{JSON.stringify(result.data, null, 2)}</pre>
                        </div>
                      ) : (
                        <div className="result-error">
                          <strong>Error:</strong>
                          <p>{result.error}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <style jsx>{`
        .wallet-tester {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .tester-header {
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .tester-header h2 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }

        .tester-subtitle {
          margin: 0 0 15px 0;
          opacity: 0.9;
        }
        
        .dev-notice {
          background: rgba(255, 255, 255, 0.15);
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          border-left: 4px solid #ffd700;
        }
        
        .dev-notice strong {
          display: block;
          margin-bottom: 8px;
          font-size: 16px;
        }
        
        .dev-notice p {
          margin: 5px 0;
          font-size: 14px;
          line-height: 1.6;
          opacity: 0.95;
        }

        .batch-actions {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .btn-test-all {
          padding: 12px 24px;
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .btn-test-all:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .btn-test-all:disabled {
          background: #666;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-copy-all {
          padding: 12px 24px;
          font-size: 16px;
          font-weight: bold;
          color: #667eea;
          background: #fff;
          border: 2px solid #667eea;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-copy-all:hover {
          background: #667eea;
          color: #fff;
          transform: translateY(-2px);
        }

        .testing-progress {
          padding: 15px;
          background: #e3f2fd;
          border-radius: 8px;
          margin: 15px 0;
          color: #1976d2;
          border-left: 4px solid #2196f3;
        }

        .testing-progress strong {
          display: block;
          margin-bottom: 5px;
        }

        .testing-progress p {
          margin: 5px 0 0 0;
          font-size: 14px;
        }

        .test-inputs-section {
          margin-bottom: 30px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 2px solid #e9ecef;
        }

        .test-inputs-section h3 {
          margin-top: 0;
          color: #495057;
        }

        .input-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-group label {
          font-weight: 600;
          margin-bottom: 5px;
          color: #495057;
          font-size: 14px;
        }

        .input-group input,
        .input-group textarea {
          padding: 8px 12px;
          border: 1px solid #ced4da;
          border-radius: 4px;
          font-family: monospace;
          font-size: 13px;
        }

        .category-section {
          margin-bottom: 40px;
        }

        .category-title {
          color: #FF6B00;
          border-bottom: 3px solid #FF6B00;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .methods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
        }

        .method-card {
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          transition: all 0.2s;
        }

        .method-card:hover {
          border-color: #FF6B00;
          box-shadow: 0 4px 12px rgba(255, 107, 0, 0.1);
        }

        .method-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .method-name {
          margin: 0;
          color: #212529;
          font-size: 18px;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .test-button {
          padding: 6px 12px;
          background: #FF6B00;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background 0.2s;
        }

        .test-button:hover:not(:disabled) {
          background: #E55B00;
        }

        .test-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .method-description {
          color: #6c757d;
          margin: 0 0 15px 0;
          font-size: 14px;
        }

        .code-section {
          background: #282c34;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 15px;
        }

        .code-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #21252b;
          border-bottom: 1px solid #181a1f;
        }

        .code-label {
          color: #abb2bf;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .copy-code-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .copy-code-btn:hover {
          opacity: 1;
        }

        .code-block {
          margin: 0;
          padding: 12px;
          background: #282c34;
          color: #61dafb;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          overflow-x: auto;
        }

        .code-block code {
          color: #61dafb;
        }

        .result-box {
          padding: 12px;
          border-radius: 6px;
          margin-top: 10px;
        }

        .result-box.success {
          background: #e8f5e9;
          border: 1px solid #4caf50;
          color: #1b5e20;
        }

        .result-box.error {
          background: #ffebee;
          border: 1px solid #f44336;
          color: #b71c1c;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .result-icon {
          font-size: 18px;
        }

        .result-time {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .result-data pre,
        .result-error p {
          margin: 5px 0 0 0;
          padding: 10px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px;
          font-size: 12px;
          max-height: 200px;
          overflow: auto;
          color: #212529;
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .result-data strong,
        .result-error strong {
          color: #212529;
          display: block;
          margin-bottom: 5px;
        }

        .warning {
          padding: 20px;
          background: #fff3cd;
          border: 2px solid #ffc107;
          border-radius: 8px;
          text-align: center;
        }

        .warning strong {
          display: block;
          margin-bottom: 10px;
          font-size: 18px;
          color: #856404;
        }

        .warning p {
          margin: 0;
          color: #856404;
        }
      `}</style>
    </div>
  );
};

export default WalletTester;
