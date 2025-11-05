// Card image utility functions
const CARD_IMAGES_BASE = '../assets/cards/'

// Get the actual image ID to use (cycles through 0-10 for any card ID)
export const getImageId = (cardId: number): number => {
  // Cycle through available images (0-10)
  return ((cardId % 11) + 11) % 11 // Ensures positive result
}

// Check if card image exists (for cards 0-10 that are available)
export const hasCardImage = (cardId: number): boolean => {
  return cardId >= 0 // All cards now have images through cycling
}

// Get the image path for a card (with cycling fallback)
export const getCardImagePath = (cardId: number): string => {
  const imageId = getImageId(cardId)
  return `${CARD_IMAGES_BASE}${imageId}.png`
}

// Get card image import (for static imports)
export const getCardImageImport = (cardId: number) => {
  // This will be used for dynamic imports
  const imageId = getImageId(cardId)
  return import(`../assets/cards/${imageId}.png`)
}

// Get fallback display for cards without images
export const getCardFallback = (card: any) => {
  return {
    name: card.card_name_kr || 'Unknown Card',
    direction: card.direction === 'reversed' ? '역방향' : ''
  }
}
