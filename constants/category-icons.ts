// Curated Ionicons names for category icon selection
// Grouped by theme for easy browsing

export const CATEGORY_ICONS = [
  // Food & Drink
  'restaurant',
  'fast-food',
  'cafe',
  'beer',
  'wine',
  'pizza',
  'ice-cream',
  'nutrition',

  // Shopping
  'cart',
  'bag',
  'pricetag',
  'gift',
  'shirt',
  'storefront',

  // Transport
  'car',
  'bus',
  'train',
  'airplane',
  'bicycle',
  'boat',
  'rocket',

  // Home
  'home',
  'bed',
  'bulb',
  'water',
  'flame',
  'construct',
  'hammer',

  // Health & Fitness
  'heart',
  'medkit',
  'fitness',
  'bandage',
  'pulse',
  'body',

  // Entertainment
  'game-controller',
  'musical-notes',
  'film',
  'tv',
  'headset',
  'ticket',
  'football',
  'trophy',

  // Education & Work
  'school',
  'book',
  'library',
  'briefcase',
  'laptop',
  'desktop',
  'document-text',

  // Finance
  'wallet',
  'cash',
  'card',
  'trending-up',
  'trending-down',
  'stats-chart',
  'pie-chart',

  // People & Social
  'people',
  'person',
  'happy',
  'chatbubble',
  'call',
  'mail',

  // Nature & Travel
  'leaf',
  'flower',
  'earth',
  'globe',
  'map',
  'compass',
  'trail-sign',

  // Misc
  'star',
  'sparkles',
  'flash',
  'camera',
  'color-palette',
  'brush',
  'cut',
  'key',
  'shield',
  'flag',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICONS)[number];
