import React from 'react';
import '../styles/InscriptionItem.css';

const InscriptionItem = ({ inscription, onSelect }) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(inscription);
    }
  };

  return (
    <div className="inscription-item" onClick={handleClick}>
      <div className="inscription-header">
        {inscription.inscriptionNumber && (
          <span className="inscription-badge">
            #{inscription.inscriptionNumber}
          </span>
        )}
        {inscription.contentType && (
          <span className="content-type-pill">
            {inscription.contentType}
          </span>
        )}
      </div>
      <div className="inscription-id-display monospace">
        {inscription.inscriptionId ? `${inscription.inscriptionId.slice(0, 12)}...` : 'Unknown ID'}
      </div>
      <div className="inscription-arrow">→</div>
    </div>
  );
};

export default InscriptionItem;
