import React, { useState, useRef } from 'react';

const InscriptionCreator = ({ walletState, onClose, onInscriptionCreated }) => {
  // Guard clause for missing walletState
  if (!walletState) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-zinc-900 to-black border-2 border-purple-700 rounded-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-white mb-2">Wallet Not Connected</h3>
            <p className="text-zinc-400 mb-4">Please connect a wallet before creating inscriptions.</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [inscriptionType, setInscriptionType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [fileContent, setFileContent] = useState(null);
  const [fileName, setFileName] = useState('');
  const [contentType, setContentType] = useState('text/plain');
  const [feeRate, setFeeRate] = useState(10);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceFee, setServiceFee] = useState(0);
  const [repeatCount, setRepeatCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const [brc20Operation, setBrc20Operation] = useState('deploy');
  const [brc20Ticker, setBrc20Ticker] = useState('');
  const [brc20Amount, setBrc20Amount] = useState('');
  const [brc20MaxSupply, setBrc20MaxSupply] = useState('');
  const [brc20Limit, setBrc20Limit] = useState('');

  const inscriptionTypes = [
    { value: 'text', label: 'Text', icon: '📝', contentType: 'text/plain' },
    { value: 'json', label: 'JSON', icon: '📋', contentType: 'application/json' },
    { value: 'html', label: 'HTML', icon: '🌐', contentType: 'text/html' },
    { value: 'brc20', label: 'BRC-20', icon: '🪙', contentType: 'text/plain' },
    { value: 'image', label: 'Image', icon: '🖼️', contentType: 'image/*' },
    { value: 'file', label: 'Custom File', icon: '📄', contentType: '*/*' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setContentType(file.type || 'application/octet-stream');

    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTypeChange = (type) => {
    setInscriptionType(type);
    setError(null);
    setSuccess(null);
    
    const typeConfig = inscriptionTypes.find(t => t.value === type);
    if (typeConfig) {
      setContentType(typeConfig.contentType);
    }
  };

  const generateBRC20Content = () => {
    const brc20Data = {
      p: 'brc-20',
      op: brc20Operation
    };

    if (brc20Operation === 'deploy') {
      brc20Data.tick = brc20Ticker.toLowerCase();
      brc20Data.max = brc20MaxSupply;
      brc20Data.lim = brc20Limit || brc20MaxSupply;
    } else if (brc20Operation === 'mint') {
      brc20Data.tick = brc20Ticker.toLowerCase();
      brc20Data.amt = brc20Amount;
    } else if (brc20Operation === 'transfer') {
      brc20Data.tick = brc20Ticker.toLowerCase();
      brc20Data.amt = brc20Amount;
    }

    return JSON.stringify(brc20Data);
  };

  const validateInscription = () => {
    if (inscriptionType === 'text' && !textContent.trim()) {
      throw new Error('Text content cannot be empty');
    }
    
    if (inscriptionType === 'brc20') {
      if (!brc20Ticker.trim()) {
        throw new Error('BRC-20 ticker is required');
      }
      if (brc20Operation === 'deploy' && (!brc20MaxSupply || parseFloat(brc20MaxSupply) <= 0)) {
        throw new Error('Max supply must be greater than 0');
      }
      if ((brc20Operation === 'mint' || brc20Operation === 'transfer') && (!brc20Amount || parseFloat(brc20Amount) <= 0)) {
        throw new Error('Amount must be greater than 0');
      }
    }
    
    if ((inscriptionType === 'image' || inscriptionType === 'file') && !fileContent) {
      throw new Error('Please select a file');
    }

    if (feeRate < 1) {
      throw new Error('Fee rate must be at least 1 sat/vB');
    }
  };

  const createInscription = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      validateInscription();

      // Check if wallet is connected
      if (!walletState.isConnected) {
        throw new Error('No wallet connected');
      }

      let content;
      let finalContentType = contentType;

      if (inscriptionType === 'text') {
        content = textContent;
        finalContentType = 'text/plain;charset=utf-8';
      } else if (inscriptionType === 'json') {
        content = textContent;
        finalContentType = 'application/json';
      } else if (inscriptionType === 'html') {
        content = textContent;
        finalContentType = 'text/html;charset=utf-8';
      } else if (inscriptionType === 'brc20') {
        content = generateBRC20Content();
        finalContentType = 'text/plain;charset=utf-8';
      } else if (inscriptionType === 'image' || inscriptionType === 'file') {
        content = fileContent;
      }

      const options = {
        contentType: finalContentType,
        feeRate: parseInt(feeRate)
      };

      if (recipientAddress.trim()) {
        options.receiverAddress = recipientAddress.trim();
      }

      if (serviceAddress.trim() && serviceFee > 0) {
        options.devAddress = serviceAddress.trim();
        options.devFee = parseInt(serviceFee);
      }

      // Check if we should use repeat inscriptions (Xverse only)
      const shouldUseRepeat = repeatCount > 1 && walletState.walletType === 'Xverse';
      
      let result;
      if (shouldUseRepeat) {
        // Use createRepeatInscriptions for batch creation
        options.repeat = parseInt(repeatCount);
        result = await window.NexusWalletConnect.createRepeatInscriptions(content, options);
      } else {
        // Use regular inscribe for single inscription
        result = await window.NexusWalletConnect.inscribe(content, options);
      }

      setSuccess({
        message: shouldUseRepeat 
          ? `${repeatCount} inscriptions created successfully!` 
          : 'Inscription created successfully!',
        // Support multiple wallet formats:
        // - OKX: commitTx, revealTxs (array)
        // - Xverse: commitTxId, revealTxId
        // - Others: txid, txId
        txid: result.txid || result.commitTxId || result.commitTx || result.txId,
        inscriptionId: result.inscriptionId,
        revealTxId: result.revealTxId || (result.revealTxs && result.revealTxs[0]),
        repeatCount: shouldUseRepeat ? repeatCount : 1,
        ...result
      });

      if (onInscriptionCreated) {
        onInscriptionCreated(result);
      }

    } catch (err) {
      setError(err.message || 'Failed to create inscription');
      console.error('Inscription creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const estimatedCost = () => {
    let contentSize = 0;
    if (inscriptionType === 'text' || inscriptionType === 'json' || inscriptionType === 'html') {
      contentSize = new Blob([textContent]).size;
    } else if (inscriptionType === 'brc20') {
      contentSize = new Blob([generateBRC20Content()]).size;
    } else if (fileContent) {
      contentSize = fileContent.byteLength || 0;
    }

    const baseSize = 200;
    const totalSize = baseSize + contentSize;
    const singleInscriptionSats = Math.ceil(totalSize * feeRate * 1.5);
    const multiplier = repeatCount > 1 ? repeatCount : 1;
    const estimatedSats = singleInscriptionSats * multiplier;

    return {
      size: contentSize,
      estimatedSats,
      estimatedBTC: (estimatedSats / 100000000).toFixed(8),
      perInscription: singleInscriptionSats,
      count: multiplier
    };
  };

  const cost = estimatedCost();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Create Inscription</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Wallet Info */}
          <div className="card mb-lg">
            <div className="text-sm mb-xs">Connected Wallet</div>
            <div className="text-lg font-bold mb-xs">{walletState?.walletType?.toUpperCase() || 'Unknown'}</div>
            <div className="monospace text-xs address-display">{walletState?.address || 'No address'}</div>
          </div>

          {/* Type Selection */}
          <div className="form-group">
            <label className="form-label">Inscription Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--spacing-sm)' }}>
              {inscriptionTypes.map(type => (
                <button
                  key={type.value}
                  onClick={() => handleTypeChange(type.value)}
                  className={`btn ${inscriptionType === type.value ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ 
                    padding: 'var(--spacing-md)', 
                    height: 'auto',
                    flexDirection: 'column',
                    gap: 'var(--spacing-xs)'
                  }}
                >
                  <div style={{ fontSize: '1.5rem' }}>{type.icon}</div>
                  <div style={{ fontSize: '0.875rem' }}>{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* BRC-20 Specific Fields */}
          {inscriptionType === 'brc20' && (
            <div className="card mb-lg">
              <div className="form-group">
                <label className="form-label">Operation</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-xs)' }}>
                  {['deploy', 'mint', 'transfer'].map(op => (
                    <button
                      key={op}
                      onClick={() => setBrc20Operation(op)}
                      className={`btn ${brc20Operation === op ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {op.charAt(0).toUpperCase() + op.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Ticker (4 letters)</label>
                <input
                  type="text"
                  value={brc20Ticker}
                  onChange={(e) => setBrc20Ticker(e.target.value.toLowerCase().slice(0, 4))}
                  maxLength={4}
                  placeholder="ordi"
                  className="form-input"
                />
              </div>

              {brc20Operation === 'deploy' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Max Supply</label>
                    <input
                      type="text"
                      value={brc20MaxSupply}
                      onChange={(e) => setBrc20MaxSupply(e.target.value)}
                      placeholder="21000000"
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mint Limit (optional)</label>
                    <input
                      type="text"
                      value={brc20Limit}
                      onChange={(e) => setBrc20Limit(e.target.value)}
                      placeholder="1000"
                      className="form-input"
                    />
                  </div>
                </>
              )}

              {(brc20Operation === 'mint' || brc20Operation === 'transfer') && (
                <div className="form-group">
                  <label className="form-label">Amount</label>
                  <input
                    type="text"
                    value={brc20Amount}
                    onChange={(e) => setBrc20Amount(e.target.value)}
                    placeholder="1000"
                    className="form-input"
                  />
                </div>
              )}

              <div className="card">
                <div className="text-xs mb-xs">Preview:</div>
                <pre className="monospace text-xs" style={{ overflow: 'auto' }}>
                  {brc20Ticker ? generateBRC20Content() : '{}'}
                </pre>
              </div>
            </div>
          )}

          {/* Text/JSON/HTML Content */}
          {(inscriptionType === 'text' || inscriptionType === 'json' || inscriptionType === 'html') && (
            <div className="form-group">
              <label className="form-label">
                Content {inscriptionType === 'json' && '(JSON format)'}
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={10}
                placeholder={
                  inscriptionType === 'json' 
                    ? '{"name": "My Inscription", "description": "..."}'
                    : inscriptionType === 'html'
                    ? '<html><body>Your content here</body></html>'
                    : 'Enter your text content here...'
                }
                className="form-textarea monospace"
              />
              <div className="text-xs mt-xs" style={{ opacity: 0.6 }}>
                Size: {new Blob([textContent]).size} bytes
              </div>
            </div>
          )}

          {/* File Upload */}
          {(inscriptionType === 'image' || inscriptionType === 'file') && (
            <div className="form-group">
              <label className="form-label">
                Select {inscriptionType === 'image' ? 'Image' : 'File'}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept={inscriptionType === 'image' ? 'image/*' : '*/*'}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary"
                style={{ 
                  width: '100%', 
                  padding: 'var(--spacing-xl)',
                  flexDirection: 'column',
                  gap: 'var(--spacing-sm)'
                }}
              >
                <div style={{ fontSize: '2rem' }}>📁</div>
                <div>
                  {fileName || `Click to select ${inscriptionType === 'image' ? 'an image' : 'a file'}`}
                </div>
                {fileContent && (
                  <div className="text-xs" style={{ opacity: 0.6 }}>
                    Size: {fileContent.byteLength} bytes ({contentType})
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Advanced Options */}
          <div style={{ borderTop: '1px solid var(--color-border-dark)', paddingTop: 'var(--spacing-lg)' }}>
            <details>
              <summary className="form-label" style={{ cursor: 'pointer', marginBottom: 'var(--spacing-lg)' }}>
                ⚙️ Advanced Options
              </summary>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div className="form-group">
                  <label className="form-label">
                    Fee Rate (sat/vB)
                  </label>
                  <input
                    type="number"
                    value={feeRate}
                    onChange={(e) => setFeeRate(Math.max(1, parseInt(e.target.value) || 1))}
                    min="1"
                    className="form-input"
                  />
                  <div className="text-xs mt-xs" style={{ opacity: 0.6 }}>
                    Higher fee rates = faster confirmation
                  </div>
                </div>

                {walletState.walletType === 'Xverse' && (
                  <div className="form-group">
                    <label className="form-label">
                      🔄 Repeat Count (Batch Inscriptions)
                    </label>
                    <input
                      type="number"
                      value={repeatCount}
                      onChange={(e) => setRepeatCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                      min="1"
                      max="100"
                      className="form-input"
                    />
                    <div className="text-xs mt-xs" style={{ opacity: 0.6 }}>
                      Create multiple identical inscriptions in one transaction (Xverse only, max 100)
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    Recipient Address (optional)
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="Leave empty to inscribe to your own address"
                    className="form-input monospace"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Service Fee Address (optional)
                  </label>
                  <input
                    type="text"
                    value={serviceAddress}
                    onChange={(e) => setServiceAddress(e.target.value)}
                    placeholder="Address to receive service fee"
                    className="form-input monospace"
                  />
                </div>

                {serviceAddress && (
                  <div className="form-group">
                    <label className="form-label">
                      Service Fee (sats)
                    </label>
                    <input
                      type="number"
                      value={serviceFee}
                      onChange={(e) => setServiceFee(Math.max(0, parseInt(e.target.value) || 0))}
                      min="0"
                      className="w-full bg-black border-2 border-purple-900/50 rounded-xl px-4 py-3 text-white focus:border-purple-600 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </details>
          </div>

          {/* Cost Estimation */}
          <div className="card">
            <h3 className="form-label mb-md">💰 Estimated Cost</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', fontSize: '0.875rem' }}>
              <div>
                <div style={{ opacity: 0.6, marginBottom: 'var(--spacing-xs)' }}>Content Size</div>
                <div style={{ fontWeight: 600 }}>{cost.size} bytes</div>
              </div>
              <div>
                <div style={{ opacity: 0.6, marginBottom: 'var(--spacing-xs)' }}>Estimated Fee</div>
                <div style={{ fontWeight: 600 }}>
                  ~{cost.estimatedSats} sats ({cost.estimatedBTC} BTC)
                </div>
              </div>
              {cost.count > 1 && (
                <>
                  <div>
                    <div style={{ opacity: 0.6, marginBottom: 'var(--spacing-xs)' }}>Per Inscription</div>
                    <div style={{ fontWeight: 600 }}>~{cost.perInscription} sats</div>
                  </div>
                  <div>
                    <div style={{ opacity: 0.6, marginBottom: 'var(--spacing-xs)' }}>Total Count</div>
                    <div style={{ fontWeight: 600 }}>{cost.count} inscriptions</div>
                  </div>
                </>
              )}
            </div>
            <div className="text-xs mt-md" style={{ opacity: 0.5 }}>
              * This is a rough estimate. Actual cost may vary.
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                ✅ {success.message}
              </div>
              {success.txid && (
                <div className="text-xs monospace" style={{ marginTop: 'var(--spacing-xs)' }}>
                  <span style={{ opacity: 0.6 }}>TX ID: </span>
                  <span>{success.txid}</span>
                </div>
              )}
              {success.inscriptionId && (
                <div className="text-xs monospace" style={{ marginTop: 'var(--spacing-xs)' }}>
                  <span style={{ opacity: 0.6 }}>Inscription ID: </span>
                  <span>{success.inscriptionId}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
            <button
              onClick={createInscription}
              disabled={loading || !!success}
              className="btn btn-primary btn-large"
              style={{ flex: 1 }}
            >
              {loading ? '⏳ Creating...' : success ? '✅ Created!' : '✍️ Create Inscription'}
            </button>
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              {success ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InscriptionCreator;