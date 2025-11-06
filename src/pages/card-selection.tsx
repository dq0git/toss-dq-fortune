import React from 'react';
import TarotCardApp from '../components/tarot_card_ex';

const CardSelectionPage = () => {
  // Render TarotCardApp without the narrow .screen-container wrapper.
  // The component expects a full-height/full-width layout and uses
  // utility classes (min-h-screen, bg-*) that were being overridden
  // by the app wrapper, causing layout breakage.
  return (
    <div className="card-selection">
      <TarotCardApp />
    </div>
  );
};

export default CardSelectionPage;
