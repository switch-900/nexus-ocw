import React, { useState, useEffect } from 'react';
import '../styles/XversePanel.css';

/**
 * XversePanel - Comprehensive UI for all 16 Xverse Bitcoin methods
 * Organized by category: Bitcoin, Inscriptions, and Runes
 */
const XversePanel = ({ isConnected, walletState }) => {
  const [activeTab, setActiveTab] = useState('bitcoin');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Bitcoin tab state
  const [psbtHex, setPsbtHex] = useState('');
  const [multiplePsbts, setMultiplePsbts] = useState('');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [messageToSign, setMessageToSign] = useState('Hello from Xverse!');

  // Inscriptions tab state
  const [inscriptionContent, setInscriptionContent] = useState('');
  const [inscriptionContentType, setInscriptionContentType] = useState('text/plain;charset=utf-8');
  const [inscriptionFeeRate, setInscriptionFeeRate] = useState('10');
  const [repeatCount, setRepeatCount] = useState('5');
  const [inscriptionsToSend, setInscriptionsToSend] = useState('');
  const [inscriptionRecipient, setInscriptionRecipient] = useState('');

  // Runes tab state
  const [runesBalance, setRunesBalance] = useState(null);
  const [runesRecipient, setRunesRecipient] = useState('');
  const [runeName, setRuneName] = useState('');
  const [runesAmount, setRunesAmount] = useState('');
  const [orderId, setOrderId] = useState('');
  
  // Etch-specific state
  const [etchSymbol, setEtchSymbol] = useState('');
  const [etchDivisibility, setEtchDivisibility] = useState('8');
  const [etchPremine, setEtchPremine] = useState('');
  const [etchTurbo, setEtchTurbo] = useState(false);

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  // Validation helpers
  const validateRuneName = (name) => {
    // Runes must be uppercase letters with • separator
    const runePattern = /^[A-Z]+(?:•[A-Z]+)*$/;
    return runePattern.test(name);
  };

  const validateBitcoinAddress = (address) => {
    // Basic validation for Bitcoin addresses
    return address && (
      address.startsWith('bc1') || // Bech32
      address.startsWith('tb1') || // Testnet Bech32
      address.startsWith('1') ||   // P2PKH
      address.startsWith('3')      // P2SH
    ) && address.length >= 26 && address.length <= 90;
  };

  const formatRuneName = (name) => {
    // Convert to uppercase and ensure proper • separator format
    return name.toUpperCase().replace(/[.\s]/g, '•');
  };

  // ============ BITCOIN METHODS ============

  const handleGetAddresses = async () => {
    clearResults();
    setLoading(true);
    try {
      const addresses = await window.NexusWalletConnect.getAddresses(['ordinals', 'payment']);
      setResult({ type: 'addresses', data: addresses });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignMessage = async () => {
    if (!messageToSign) {
      setError('Please enter a message to sign');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const signature = await window.NexusWalletConnect.signMessage(messageToSign);
      setResult({ type: 'signature', data: signature });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignPsbt = async () => {
    if (!psbtHex) {
      setError('Please enter a PSBT hex string');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const signedPsbt = await window.NexusWalletConnect.signPSBT(psbtHex);
      setResult({ type: 'signedPsbt', data: signedPsbt });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTransfer = async () => {
    if (!recipient || !amount) {
      setError('Please enter recipient address and amount');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const amountSats = Math.floor(parseFloat(amount) * 100000000);
      const txid = await window.NexusWalletConnect.sendBitcoin(recipient, amountSats);
      setResult({ type: 'txid', data: txid });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignMultiple = async () => {
    if (!multiplePsbts) {
      setError('Please enter PSBTs (one per line)');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const psbtArray = multiplePsbts.split('\n').filter(p => p.trim());
      const provider = window.NexusWalletConnect.getCurrentProvider();
      const results = await provider.signMultipleTransactions(psbtArray);
      setResult({ type: 'multipleSigned', data: results });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetBalance = async () => {
    clearResults();
    setLoading(true);
    try {
      const balance = await window.NexusWalletConnect.getBalance();
      setResult({ type: 'balance', data: balance });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============ INSCRIPTION METHODS ============

  const handleCreateInscription = async () => {
    if (!inscriptionContent) {
      setError('Please enter inscription content');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const result = await window.NexusWalletConnect.inscribe(inscriptionContent, {
        contentType: inscriptionContentType,
        feeRate: parseInt(inscriptionFeeRate)
      });
      setResult({ type: 'inscription', data: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepeatInscriptions = async () => {
    if (!inscriptionContent || !repeatCount) {
      setError('Please enter inscription content and repeat count');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const payload = {
        content: inscriptionContent,
        contentType: inscriptionContentType,
        payloadType: 'PLAIN_TEXT',
        repeat: parseInt(repeatCount),
        network: { type: 'Mainnet' },
        suggestedMinerFeeRate: parseInt(inscriptionFeeRate)
      };
      const provider = window.NexusWalletConnect.getCurrentProvider();
      const result = await provider.createRepeatInscriptions(payload);
      setResult({ type: 'repeatInscriptions', data: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetInscriptions = async () => {
    clearResults();
    setLoading(true);
    try {
      const inscriptions = await window.NexusWalletConnect.getInscriptions();
      setResult({ type: 'inscriptions', data: inscriptions });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInscriptions = async () => {
    if (!inscriptionsToSend || !inscriptionRecipient) {
      setError('Please enter inscription IDs and recipient address');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const inscriptionIds = inscriptionsToSend.split(',').map(id => id.trim());
      const provider = window.NexusWalletConnect.getCurrentProvider();
      const result = await provider.sendInscriptions({
        recipient: inscriptionRecipient,
        inscriptionIds: inscriptionIds
      });
      setResult({ type: 'inscriptionsSent', data: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ============ RUNES METHODS ============

  const handleGetRunesBalance = async () => {
    clearResults();
    setLoading(true);
    try {
      const provider = window.NexusWalletConnect.getCurrentProvider();
      const balance = await provider.getRunesBalance();
      setRunesBalance(balance);
      setResult({ type: 'runesBalance', data: balance });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferRunes = async () => {
    // Validation
    if (!runeName.trim()) {
      setError('❌ Rune name is required');
      return;
    }
    
    if (!validateRuneName(runeName)) {
      setError('❌ Invalid rune name format. Use uppercase letters with • separator (e.g., UNCOMMON•GOODS)');
      return;
    }
    
    if (!runesRecipient.trim()) {
      setError('❌ Recipient address is required');
      return;
    }
    
    if (!validateBitcoinAddress(runesRecipient)) {
      setError('❌ Invalid Bitcoin address format');
      return;
    }
    
    if (!runesAmount || parseFloat(runesAmount) <= 0) {
      setError('❌ Amount must be greater than 0');
      return;
    }
    
    clearResults();
    setLoading(true);
    try {
      const provider = window.NexusWalletConnect.getCurrentProvider();
      const result = await provider.transferRunes({
        recipient: runesRecipient,
        runeName: runeName,
        amount: runesAmount
      });
      setResult({ type: 'runesTransfer', data: result });
      // Clear form on success
      setRunesRecipient('');
      setRuneName('');
      setRunesAmount('');
    } catch (err) {
      const errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('insufficient')) {
        setError('❌ Insufficient rune balance');
      } else if (errorMsg.includes('not found')) {
        setError('❌ Rune not found in your wallet');
      } else if (errorMsg.includes('cancel')) {
        setError('⚠️ Transaction cancelled by user');
      } else {
        setError(`❌ Transfer failed: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMintRunes = async () => {
    // Validation
    if (!runeName.trim()) {
      setError('❌ Rune name is required');
      return;
    }
    
    if (!validateRuneName(runeName)) {
      setError('❌ Invalid rune name format. Use uppercase letters with • separator (e.g., UNCOMMON•GOODS)');
      return;
    }
    
    clearResults();
    setLoading(true);
    try {
      const provider = window.NexusWalletConnect.getCurrentProvider();
      const result = await provider.mintRunes({ runeName });
      setResult({ type: 'runesMint', data: result });
      setRuneName('');
    } catch (err) {
      const errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('not mintable')) {
        setError('❌ This rune is not mintable or minting has ended');
      } else if (errorMsg.includes('not found')) {
        setError('❌ Rune not found. Check the name and try again');
      } else if (errorMsg.includes('cancel')) {
        setError('⚠️ Minting cancelled by user');
      } else {
        setError(`❌ Minting failed: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEtchRunes = async () => {
    // Validation
    if (!runeName.trim()) {
      setError('❌ Rune name is required');
      return;
    }
    
    const formattedName = formatRuneName(runeName);
    if (!validateRuneName(formattedName)) {
      setError('❌ Invalid rune name. Use letters only (will be converted to UPPERCASE•FORMAT)');
      return;
    }
    
    if (formattedName.length < 3) {
      setError('❌ Rune name must be at least 3 characters');
      return;
    }
    
    if (formattedName.length > 28) {
      setError('❌ Rune name must be 28 characters or less');
      return;
    }
    
    const divisibility = parseInt(etchDivisibility);
    if (isNaN(divisibility) || divisibility < 0 || divisibility > 38) {
      setError('❌ Divisibility must be between 0 and 38');
      return;
    }
    
    clearResults();
    setLoading(true);
    try {
      const provider = window.NexusWalletConnect.getCurrentProvider();
      
      const etchParams = {
        runeName: formattedName,
        symbol: etchSymbol || '⚡',
        divisibility: divisibility
      };
      
      // Add premine if specified
      if (etchPremine && parseFloat(etchPremine) > 0) {
        etchParams.premine = etchPremine;
      }
      
      // Add turbo flag if enabled
      if (etchTurbo) {
        etchParams.turbo = true;
      }
      
      const result = await provider.etchRunes(etchParams);
      setResult({ type: 'runesEtch', data: result });
      
      // Clear form on success
      setRuneName('');
      setEtchSymbol('');
      setEtchDivisibility('8');
      setEtchPremine('');
      setEtchTurbo(false);
    } catch (err) {
      const errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('already exists')) {
        setError('❌ This rune name already exists');
      } else if (errorMsg.includes('invalid name')) {
        setError('❌ Invalid rune name format');
      } else if (errorMsg.includes('cancel')) {
        setError('⚠️ Etching cancelled by user');
      } else if (errorMsg.includes('fee')) {
        setError('❌ Insufficient funds for etching fee');
      } else {
        setError(`❌ Etching failed: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGetRunesOrder = async () => {
    if (!orderId) {
      setError('Please enter order ID');
      return;
    }
    clearResults();
    setLoading(true);
    try {
      const provider = window.NexusWalletConnect.getCurrentProvider();
      const result = await provider.getRunesOrder(orderId);
      setResult({ type: 'runesOrder', data: result });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Debug logging
  console.log('XversePanel render:', { 
    isConnected, 
    walletType: walletState?.walletType,
    walletTypeLower: walletState?.walletType?.toLowerCase(),
    shouldRender: isConnected && walletState?.walletType?.toLowerCase() === 'xverse'
  });

  if (!isConnected || walletState?.walletType?.toLowerCase() !== 'xverse') {
    console.log('XversePanel: Not rendering - conditions not met');
    return null;
  }

  return (
    <div className="xverse-panel">
      <div className="xverse-header">
        <h2>🟣 Xverse Wallet Features</h2>
        <p>Access all 16 Xverse Bitcoin methods</p>
      </div>

      <div className="xverse-tabs">
        <button 
          className={`xverse-tab ${activeTab === 'bitcoin' ? 'active' : ''}`}
          onClick={() => setActiveTab('bitcoin')}
        >
          ₿ Bitcoin Methods (6)
        </button>
        <button 
          className={`xverse-tab ${activeTab === 'inscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('inscriptions')}
        >
          🎨 Inscription Methods (4)
        </button>
        <button 
          className={`xverse-tab ${activeTab === 'runes' ? 'active' : ''}`}
          onClick={() => setActiveTab('runes')}
        >
          🔲 Runes Methods (5)
        </button>
      </div>

      {/* Results/Error Display */}
      {error && (
        <div className="xverse-error">
          ❌ {error}
          <button onClick={clearResults}>✕</button>
        </div>
      )}

      {result && (
        <div className="xverse-result">
          <h3>✅ Result ({result.type})</h3>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
          <button onClick={clearResults}>Clear</button>
        </div>
      )}

      {/* BITCOIN TAB */}
      {activeTab === 'bitcoin' && (
        <div className="xverse-content">
          <div className="xverse-section">
            <h3>1. Get Addresses</h3>
            <p>Retrieve payment and ordinals addresses</p>
            <button onClick={handleGetAddresses} disabled={loading}>
              {loading ? 'Loading...' : 'Get Addresses'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>2. Sign Message</h3>
            <input
              type="text"
              placeholder="Message to sign"
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
            />
            <button onClick={handleSignMessage} disabled={loading}>
              {loading ? 'Signing...' : 'Sign Message'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>3. Sign PSBT</h3>
            <textarea
              placeholder="Enter PSBT hex string"
              value={psbtHex}
              onChange={(e) => setPsbtHex(e.target.value)}
              rows={4}
            />
            <button onClick={handleSignPsbt} disabled={loading}>
              {loading ? 'Signing...' : 'Sign PSBT'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>4. Send Transfer (sendTransfer)</h3>
            <input
              type="text"
              placeholder="Recipient address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount in BTC"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.00000001"
            />
            <button onClick={handleSendTransfer} disabled={loading}>
              {loading ? 'Sending...' : 'Send Bitcoin'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>5. Sign Multiple Transactions</h3>
            <textarea
              placeholder="Enter PSBTs (one per line)"
              value={multiplePsbts}
              onChange={(e) => setMultiplePsbts(e.target.value)}
              rows={6}
            />
            <button onClick={handleSignMultiple} disabled={loading}>
              {loading ? 'Signing...' : 'Sign Multiple PSBTs'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>6. Get Balance</h3>
            <p>Retrieve wallet balance</p>
            <button onClick={handleGetBalance} disabled={loading}>
              {loading ? 'Loading...' : 'Get Balance'}
            </button>
          </div>
        </div>
      )}

      {/* INSCRIPTIONS TAB */}
      {activeTab === 'inscriptions' && (
        <div className="xverse-content">
          <div className="xverse-section">
            <h3>1. Create Inscription</h3>
            <textarea
              placeholder="Inscription content"
              value={inscriptionContent}
              onChange={(e) => setInscriptionContent(e.target.value)}
              rows={4}
            />
            <input
              type="text"
              placeholder="Content type"
              value={inscriptionContentType}
              onChange={(e) => setInscriptionContentType(e.target.value)}
            />
            <input
              type="number"
              placeholder="Fee rate (sats/vB)"
              value={inscriptionFeeRate}
              onChange={(e) => setInscriptionFeeRate(e.target.value)}
            />
            <button onClick={handleCreateInscription} disabled={loading}>
              {loading ? 'Creating...' : 'Create Inscription'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>2. Create Repeat Inscriptions (Batch)</h3>
            <p>Create multiple identical inscriptions</p>
            <textarea
              placeholder="Inscription content"
              value={inscriptionContent}
              onChange={(e) => setInscriptionContent(e.target.value)}
              rows={3}
            />
            <input
              type="number"
              placeholder="Repeat count"
              value={repeatCount}
              onChange={(e) => setRepeatCount(e.target.value)}
              min="1"
              max="50"
            />
            <button onClick={handleCreateRepeatInscriptions} disabled={loading}>
              {loading ? 'Creating...' : `Create ${repeatCount} Inscriptions`}
            </button>
          </div>

          <div className="xverse-section">
            <h3>3. Get Inscriptions (ord_getInscriptions)</h3>
            <p>Retrieve all inscriptions in your wallet</p>
            <button onClick={handleGetInscriptions} disabled={loading}>
              {loading ? 'Loading...' : 'Get Inscriptions'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>4. Send Inscriptions (ord_sendInscriptions)</h3>
            <input
              type="text"
              placeholder="Inscription IDs (comma-separated)"
              value={inscriptionsToSend}
              onChange={(e) => setInscriptionsToSend(e.target.value)}
            />
            <input
              type="text"
              placeholder="Recipient address"
              value={inscriptionRecipient}
              onChange={(e) => setInscriptionRecipient(e.target.value)}
            />
            <button onClick={handleSendInscriptions} disabled={loading}>
              {loading ? 'Sending...' : 'Send Inscriptions'}
            </button>
          </div>
        </div>
      )}

      {/* RUNES TAB */}
      {activeTab === 'runes' && (
        <div className="xverse-content">
          <div className="xverse-section">
            <h3>1. Get Runes Balance (runes_getBalance)</h3>
            <p>Check your Runes holdings</p>
            <button onClick={handleGetRunesBalance} disabled={loading}>
              {loading ? 'Loading...' : 'Get Runes Balance'}
            </button>
            {runesBalance && (
              <div className="runes-balance-display">
                <pre>{JSON.stringify(runesBalance, null, 2)}</pre>
              </div>
            )}
          </div>

          <div className="xverse-section">
            <h3>2. Transfer Runes (runes_transfer)</h3>
            <div className="xverse-helper-box">
              <p>📝 <strong>Format Requirements:</strong></p>
              <ul>
                <li>Rune name: <strong>UPPERCASE•LETTERS</strong> (e.g., UNCOMMON•GOODS)</li>
                <li>Address: Valid Bitcoin address (bc1, tb1, 1, or 3 prefix)</li>
                <li>Amount: Must be greater than 0</li>
              </ul>
              <p className="xverse-example">✅ Example: UNCOMMON•GOODS</p>
            </div>
            
            <div className="xverse-input-group">
              <label>Rune Name</label>
              <input
                type="text"
                placeholder="e.g., UNCOMMON•GOODS"
                value={runeName}
                onChange={(e) => setRuneName(e.target.value)}
                className={runeName && !validateRuneName(runeName) ? 'xverse-input-invalid' : ''}
              />
              {runeName && !validateRuneName(runeName) && (
                <span className="xverse-validation-error">
                  ❌ Use UPPERCASE letters with • separator
                </span>
              )}
              {runeName && validateRuneName(runeName) && (
                <span className="xverse-validation-success">✅ Valid format</span>
              )}
            </div>

            <div className="xverse-input-group">
              <label>Recipient Address</label>
              <input
                type="text"
                placeholder="bc1q... or tb1q..."
                value={runesRecipient}
                onChange={(e) => setRunesRecipient(e.target.value)}
                className={runesRecipient && !validateBitcoinAddress(runesRecipient) ? 'xverse-input-invalid' : ''}
              />
              {runesRecipient && !validateBitcoinAddress(runesRecipient) && (
                <span className="xverse-validation-error">
                  ❌ Invalid Bitcoin address
                </span>
              )}
              {runesRecipient && validateBitcoinAddress(runesRecipient) && (
                <span className="xverse-validation-success">✅ Valid address</span>
              )}
            </div>

            <div className="xverse-input-group">
              <label>Amount</label>
              <input
                type="text"
                placeholder="Amount to transfer"
                value={runesAmount}
                onChange={(e) => setRunesAmount(e.target.value)}
                className={runesAmount && (isNaN(runesAmount) || parseFloat(runesAmount) <= 0) ? 'xverse-input-invalid' : ''}
              />
              {runesAmount && (isNaN(runesAmount) || parseFloat(runesAmount) <= 0) && (
                <span className="xverse-validation-error">
                  ❌ Amount must be greater than 0
                </span>
              )}
            </div>

            <button 
              onClick={handleTransferRunes} 
              disabled={loading || !runeName || !runesRecipient || !runesAmount}
              className={!runeName || !runesRecipient || !runesAmount ? 'xverse-button-disabled' : ''}
            >
              {loading ? 'Transferring...' : 'Transfer Runes'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>3. Mint Runes</h3>
            <div className="xverse-helper-box">
              <p>📝 <strong>Format Requirements:</strong></p>
              <ul>
                <li>Rune name: <strong>UPPERCASE•LETTERS</strong> (e.g., UNCOMMON•GOODS)</li>
                <li>Note: Only mintable runes can be minted (check runes_getBalance)</li>
              </ul>
              <p className="xverse-example">✅ Example: UNCOMMON•GOODS</p>
            </div>

            <div className="xverse-input-group">
              <label>Rune Name to Mint</label>
              <input
                type="text"
                placeholder="e.g., UNCOMMON•GOODS"
                value={runeName}
                onChange={(e) => setRuneName(e.target.value)}
                className={runeName && !validateRuneName(runeName) ? 'xverse-input-invalid' : ''}
              />
              {runeName && !validateRuneName(runeName) && (
                <span className="xverse-validation-error">
                  ❌ Use UPPERCASE letters with • separator
                </span>
              )}
              {runeName && validateRuneName(runeName) && (
                <span className="xverse-validation-success">✅ Valid format</span>
              )}
            </div>

            <button 
              onClick={handleMintRunes} 
              disabled={loading || !runeName}
              className={!runeName ? 'xverse-button-disabled' : ''}
            >
              {loading ? 'Minting...' : 'Mint Runes'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>4. Etch Runes (Create New Rune)</h3>
            <div className="xverse-helper-box">
              <p>📝 <strong>Format Requirements:</strong></p>
              <ul>
                <li>Rune name: <strong>UPPERCASE•LETTERS</strong> (e.g., UNCOMMON•GOODS)</li>
                <li>Length: 3-28 characters (including • separators)</li>
                <li>Symbol: Single character (optional, e.g., $, ¢, ₿)</li>
                <li>Divisibility: 0-38 (0 = no decimals, 8 = like Bitcoin)</li>
                <li>Premine: Number of runes to mint immediately (optional)</li>
                <li>Turbo: Enable turbo mode for faster etching (optional)</li>
              </ul>
              <p className="xverse-example">✅ Examples: UNCOMMON•GOODS, MY•NEW•RUNE, SATOSHI•NAKAMOTO</p>
            </div>

            <div className="xverse-input-group">
              <label>Rune Name (Required)</label>
              <input
                type="text"
                placeholder="e.g., UNCOMMON•GOODS"
                value={runeName}
                onChange={(e) => setRuneName(e.target.value)}
                className={runeName && !validateRuneName(runeName) ? 'xverse-input-invalid' : ''}
              />
              {runeName && !validateRuneName(runeName) && (
                <span className="xverse-validation-error">
                  ❌ Use UPPERCASE letters with • separator
                </span>
              )}
              {runeName && validateRuneName(runeName) && runeName.length < 3 && (
                <span className="xverse-validation-error">
                  ❌ Name must be at least 3 characters
                </span>
              )}
              {runeName && validateRuneName(runeName) && runeName.length > 28 && (
                <span className="xverse-validation-error">
                  ❌ Name must be 28 characters or less
                </span>
              )}
              {runeName && validateRuneName(runeName) && runeName.length >= 3 && runeName.length <= 28 && (
                <span className="xverse-validation-success">✅ Valid format ({runeName.length} characters)</span>
              )}
            </div>

            <div className="xverse-input-group">
              <label>Symbol (Optional)</label>
              <input
                type="text"
                placeholder="e.g., $ or ¢ or ₿"
                value={etchSymbol}
                onChange={(e) => setEtchSymbol(e.target.value.slice(0, 1))}
                maxLength="1"
              />
              <span className="xverse-help-text">Single character symbol for display</span>
            </div>

            <div className="xverse-input-group">
              <label>Divisibility (Optional)</label>
              <input
                type="number"
                placeholder="0-38 (default: 8)"
                value={etchDivisibility}
                onChange={(e) => setEtchDivisibility(e.target.value)}
                min="0"
                max="38"
                className={etchDivisibility && (parseInt(etchDivisibility) < 0 || parseInt(etchDivisibility) > 38) ? 'xverse-input-invalid' : ''}
              />
              {etchDivisibility && (parseInt(etchDivisibility) < 0 || parseInt(etchDivisibility) > 38) && (
                <span className="xverse-validation-error">
                  ❌ Divisibility must be between 0 and 38
                </span>
              )}
              <span className="xverse-help-text">0 = no decimals, 8 = like Bitcoin (default)</span>
            </div>

            <div className="xverse-input-group">
              <label>Premine Amount (Optional)</label>
              <input
                type="text"
                placeholder="e.g., 1000000"
                value={etchPremine}
                onChange={(e) => setEtchPremine(e.target.value)}
              />
              <span className="xverse-help-text">Number of runes to mint immediately to your address</span>
            </div>

            <div className="xverse-input-group xverse-checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={etchTurbo}
                  onChange={(e) => setEtchTurbo(e.target.checked)}
                />
                <span>Enable Turbo Mode</span>
              </label>
              <span className="xverse-help-text">Faster etching with higher fees</span>
            </div>

            <button 
              onClick={handleEtchRunes} 
              disabled={loading || !runeName}
              className={!runeName ? 'xverse-button-disabled' : ''}
            >
              {loading ? 'Etching...' : 'Etch Runes'}
            </button>
          </div>

          <div className="xverse-section">
            <h3>5. Get Runes Order (runes_getOrder)</h3>
            <p>Check status of a rune mint/etch order</p>
            <div className="xverse-input-group">
              <label>Order ID</label>
              <input
                type="text"
                placeholder="Order ID from mint or etch operation"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
            </div>
            <button 
              onClick={handleGetRunesOrder} 
              disabled={loading || !orderId}
              className={!orderId ? 'xverse-button-disabled' : ''}
            >
              {loading ? 'Checking...' : 'Get Order Status'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="xverse-loading">
          <div className="spinner"></div>
          <p>Processing...</p>
        </div>
      )}
    </div>
  );
};

export default XversePanel;
