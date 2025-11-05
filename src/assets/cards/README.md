# Tarot Card Images

This folder contains all tarot card images numbered from 0 to 77.

## Naming Convention

- `0.png` to `10.png` (available card images)
- `back.png` (card back image)
- **Cycling Logic**: Any card ID (0-77) cycles through available images (0-10)

## Card Mapping

- **Available Images**: Cards 0-10 have actual images
- **Cycling System**: Cards 11+ use images 0-10 in rotation
  - Card 11 → Image 0.png
  - Card 12 → Image 1.png
  - Card 13 → Image 2.png
  - ... and so on
- **Formula**: `imageId = cardId % 11`

## Supported Formats

- JPG/JPEG
- PNG
- WebP (recommended for better compression)

## Image Specifications

- **Resolution:** Minimum 300x500px, recommended 600x1000px
- **Aspect Ratio:** 3:5 (standard tarot card ratio)
- **File Size:** Keep under 500KB per image for optimal loading
- **Quality:** High quality with good contrast for readability

## Usage in Code

```typescript
// Import card images
import card0 from '../assets/cards/0.jpg';
import card1 from '../assets/cards/1.jpg';

// Dynamic import example
const cardImage = await import(`../assets/cards/${cardId}.jpg`);

// Use in components
<img src={card0} alt="Card 0" />
```

## Notes

- All card images should have transparent or white backgrounds
- Images should be optimized for web use
- Consider both upright and reversed versions if needed for the app's visual design
