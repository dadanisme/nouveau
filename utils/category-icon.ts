import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbols5_0 } from 'sf-symbols-typescript';

import { k } from '@/locales/keys';
import { parseIcon } from '@/utils/icon';

/**
 * Native symbols for a category icon. `categories.icon` stays an Ionicon name (`"Ionicons/<name>"`,
 * shared with the web app); the app only maps it for display. `sf` is typed against SF Symbols 5.0,
 * so every name exists on iOS 17 (the deployment target).
 */
export interface CategorySymbol {
  /** SF Symbol name (iOS). */
  sf: SFSymbols5_0;
  /** Material Symbol name (Android), drawn from the Material Symbols font. */
  material: AndroidSymbol;
}

/** Shown for a category without an icon, or with an Ionicon that has no mapping. */
export const FALLBACK_CATEGORY_SYMBOL: CategorySymbol = {
  sf: 'square.grid.2x2',
  material: 'category',
};

/**
 * Every Ionicon the mobile and web pickers have offered (`web/src/lib/category-icon-groups.ts`),
 * so rows already in the DB keep a matching glyph.
 */
const IONICON_SYMBOLS = {
  // Food & drink
  restaurant: { sf: 'fork.knife', material: 'restaurant' },
  'fast-food': { sf: 'takeoutbag.and.cup.and.straw', material: 'fastfood' },
  cafe: { sf: 'cup.and.saucer', material: 'local_cafe' },
  beer: { sf: 'mug', material: 'sports_bar' },
  wine: { sf: 'wineglass', material: 'wine_bar' },
  pizza: { sf: 'fork.knife', material: 'local_pizza' },
  'ice-cream': { sf: 'birthday.cake', material: 'icecream' },
  nutrition: { sf: 'carrot', material: 'nutrition' },
  fish: { sf: 'fish', material: 'set_meal' },
  // Shopping
  cart: { sf: 'cart', material: 'shopping_cart' },
  bag: { sf: 'bag', material: 'shopping_bag' },
  pricetag: { sf: 'tag', material: 'sell' },
  pricetags: { sf: 'tag', material: 'sell' },
  gift: { sf: 'gift', material: 'redeem' },
  shirt: { sf: 'tshirt', material: 'apparel' },
  storefront: { sf: 'storefront', material: 'storefront' },
  basket: { sf: 'basket', material: 'shopping_basket' },
  barcode: { sf: 'barcode', material: 'barcode' },
  receipt: { sf: 'list.bullet.rectangle.portrait', material: 'receipt_long' },
  // Transport
  car: { sf: 'car', material: 'directions_car' },
  'car-sport': { sf: 'car.side', material: 'sports_motorsports' },
  bus: { sf: 'bus', material: 'directions_bus' },
  train: { sf: 'tram', material: 'train' },
  airplane: { sf: 'airplane', material: 'flight' },
  bicycle: { sf: 'bicycle', material: 'pedal_bike' },
  boat: { sf: 'ferry', material: 'directions_boat' },
  rocket: { sf: 'paperplane', material: 'rocket_launch' },
  subway: { sf: 'tram.fill.tunnel', material: 'subway' },
  navigate: { sf: 'location', material: 'navigation' },
  // Home
  home: { sf: 'house', material: 'home' },
  bed: { sf: 'bed.double', material: 'bed' },
  bulb: { sf: 'lightbulb', material: 'lightbulb' },
  water: { sf: 'drop', material: 'water_drop' },
  flame: { sf: 'flame', material: 'local_fire_department' },
  construct: { sf: 'wrench.and.screwdriver', material: 'construction' },
  hammer: { sf: 'hammer', material: 'handyman' },
  trash: { sf: 'trash', material: 'delete' },
  snow: { sf: 'snowflake', material: 'ac_unit' },
  thermometer: { sf: 'thermometer.medium', material: 'thermostat' },
  sunny: { sf: 'sun.max', material: 'sunny' },
  // Health & fitness
  heart: { sf: 'heart', material: 'favorite' },
  medkit: { sf: 'cross.case', material: 'medical_services' },
  fitness: { sf: 'dumbbell', material: 'fitness_center' },
  bandage: { sf: 'bandage', material: 'healing' },
  pulse: { sf: 'waveform.path.ecg', material: 'monitor_heart' },
  body: { sf: 'figure.stand', material: 'emoji_people' },
  medical: { sf: 'staroflife', material: 'emergency' },
  eye: { sf: 'eye', material: 'visibility' },
  ear: { sf: 'ear', material: 'hearing' },
  'hand-left': { sf: 'hand.raised', material: 'back_hand' },
  accessibility: { sf: 'accessibility', material: 'accessibility_new' },
  // Entertainment
  'game-controller': { sf: 'gamecontroller', material: 'sports_esports' },
  'musical-notes': { sf: 'music.note.list', material: 'library_music' },
  'musical-note': { sf: 'music.note', material: 'music_note' },
  film: { sf: 'film', material: 'movie' },
  tv: { sf: 'tv', material: 'tv' },
  headset: { sf: 'headphones', material: 'headphones' },
  ticket: { sf: 'ticket', material: 'confirmation_number' },
  football: { sf: 'soccerball', material: 'sports_soccer' },
  trophy: { sf: 'trophy', material: 'trophy' },
  dice: { sf: 'dice', material: 'casino' },
  'bowling-ball': { sf: 'figure.bowling', material: 'sports' },
  golf: { sf: 'figure.golf', material: 'golf_course' },
  tennisball: { sf: 'tennisball', material: 'sports_tennis' },
  basketball: { sf: 'basketball', material: 'sports_basketball' },
  // Education & work
  school: { sf: 'graduationcap', material: 'school' },
  book: { sf: 'book', material: 'menu_book' },
  library: { sf: 'books.vertical', material: 'local_library' },
  briefcase: { sf: 'briefcase', material: 'work' },
  laptop: { sf: 'laptopcomputer', material: 'laptop' },
  desktop: { sf: 'desktopcomputer', material: 'desktop_windows' },
  'document-text': { sf: 'doc.text', material: 'description' },
  pencil: { sf: 'pencil', material: 'edit' },
  newspaper: { sf: 'newspaper', material: 'newspaper' },
  calculator: { sf: 'plus.forwardslash.minus', material: 'calculate' },
  'code-slash': { sf: 'chevron.left.forwardslash.chevron.right', material: 'code' },
  // Finance
  wallet: { sf: 'wallet.pass', material: 'account_balance_wallet' },
  cash: { sf: 'banknote', material: 'payments' },
  card: { sf: 'creditcard', material: 'credit_card' },
  'trending-up': { sf: 'chart.line.uptrend.xyaxis', material: 'trending_up' },
  'trending-down': { sf: 'chart.line.downtrend.xyaxis', material: 'trending_down' },
  'stats-chart': { sf: 'chart.bar.xaxis', material: 'insert_chart' },
  'pie-chart': { sf: 'chart.pie', material: 'pie_chart' },
  'bar-chart': { sf: 'chart.bar', material: 'bar_chart' },
  'logo-usd': { sf: 'dollarsign', material: 'attach_money' },
  'logo-bitcoin': { sf: 'bitcoinsign', material: 'currency_bitcoin' },
  diamond: { sf: 'diamond', material: 'diamond' },
  // The default "Transfer" category's icon (not offered by the pickers).
  'swap-horizontal': { sf: 'arrow.left.arrow.right', material: 'swap_horiz' },
  // People & social
  people: { sf: 'person.2', material: 'group' },
  person: { sf: 'person', material: 'person' },
  'person-add': { sf: 'person.badge.plus', material: 'person_add' },
  happy: { sf: 'face.smiling', material: 'mood' },
  sad: { sf: 'face.dashed', material: 'sentiment_dissatisfied' },
  chatbubble: { sf: 'bubble.left', material: 'chat_bubble' },
  chatbubbles: { sf: 'bubble.left.and.bubble.right', material: 'forum' },
  call: { sf: 'phone', material: 'call' },
  mail: { sf: 'envelope', material: 'mail' },
  at: { sf: 'at', material: 'alternate_email' },
  notifications: { sf: 'bell', material: 'notifications' },
  megaphone: { sf: 'megaphone', material: 'campaign' },
  // Nature & travel
  leaf: { sf: 'leaf', material: 'eco' },
  flower: { sf: 'camera.macro', material: 'local_florist' },
  earth: { sf: 'globe.americas', material: 'public' },
  globe: { sf: 'globe', material: 'language' },
  map: { sf: 'map', material: 'map' },
  compass: { sf: 'safari', material: 'explore' },
  'trail-sign': { sf: 'signpost.right', material: 'signpost' },
  bonfire: { sf: 'tent', material: 'camping' },
  cloudy: { sf: 'cloud.sun', material: 'partly_cloudy_day' },
  rainy: { sf: 'cloud.rain', material: 'rainy' },
  moon: { sf: 'moon', material: 'dark_mode' },
  paw: { sf: 'pawprint', material: 'pets' },
  bug: { sf: 'ladybug', material: 'bug_report' },
  // Misc
  star: { sf: 'star', material: 'star' },
  sparkles: { sf: 'sparkles', material: 'auto_awesome' },
  flash: { sf: 'bolt', material: 'bolt' },
  camera: { sf: 'camera', material: 'photo_camera' },
  'color-palette': { sf: 'paintpalette', material: 'palette' },
  brush: { sf: 'paintbrush', material: 'brush' },
  cut: { sf: 'scissors', material: 'content_cut' },
  key: { sf: 'key', material: 'key' },
  shield: { sf: 'shield', material: 'shield' },
  flag: { sf: 'flag', material: 'flag' },
  bookmark: { sf: 'bookmark', material: 'bookmark' },
  time: { sf: 'clock', material: 'schedule' },
  alarm: { sf: 'alarm', material: 'alarm' },
  hourglass: { sf: 'hourglass', material: 'hourglass_empty' },
  'lock-closed': { sf: 'lock', material: 'lock' },
  settings: { sf: 'gearshape', material: 'settings' },
  link: { sf: 'link', material: 'link' },
  cloud: { sf: 'cloud', material: 'cloud' },
  download: { sf: 'arrow.down.circle', material: 'download' },
  share: { sf: 'square.and.arrow.up', material: 'share' },
  'qr-code': { sf: 'qrcode', material: 'qr_code' },
  // "Other": `ellipsis` / `more_horiz` mean More (an action), so a neutral grid instead.
  'ellipsis-horizontal': { sf: 'square.grid.2x2', material: 'category' },
} as const satisfies Record<string, CategorySymbol>;

/** An Ionicon name the app can draw natively. */
export type CategoryIconName = keyof typeof IONICON_SYMBOLS;

export interface CategoryIconGroup {
  /** Section title, a `k.categories.iconGroups.*` key. */
  labelKey: string;
  icons: readonly CategoryIconName[];
}

/**
 * What the native icon picker offers, by section. A subset of the mapped icons: Ionicons whose
 * native glyph would repeat another one or miss the meaning on a platform (`pizza`, `pricetags`,
 * `sad`, `bowling-ball`, `rocket`, the duplicate `bulb`) still render, but aren't offered.
 */
export const CATEGORY_ICON_GROUPS: readonly CategoryIconGroup[] = [
  {
    labelKey: k.categories.iconGroups.foodDrink,
    icons: ['restaurant', 'fast-food', 'cafe', 'beer', 'wine', 'ice-cream', 'nutrition', 'fish'],
  },
  {
    labelKey: k.categories.iconGroups.shopping,
    icons: [
      'cart',
      'bag',
      'pricetag',
      'gift',
      'shirt',
      'storefront',
      'basket',
      'barcode',
      'receipt',
    ],
  },
  {
    labelKey: k.categories.iconGroups.transport,
    icons: [
      'car',
      'car-sport',
      'bus',
      'train',
      'airplane',
      'bicycle',
      'boat',
      'subway',
      'navigate',
    ],
  },
  {
    labelKey: k.categories.iconGroups.home,
    icons: [
      'home',
      'bed',
      'bulb',
      'water',
      'flame',
      'construct',
      'hammer',
      'trash',
      'snow',
      'thermometer',
      'sunny',
    ],
  },
  {
    labelKey: k.categories.iconGroups.health,
    icons: [
      'heart',
      'medkit',
      'fitness',
      'bandage',
      'pulse',
      'body',
      'medical',
      'eye',
      'ear',
      'hand-left',
      'accessibility',
    ],
  },
  {
    labelKey: k.categories.iconGroups.entertainment,
    icons: [
      'game-controller',
      'musical-notes',
      'musical-note',
      'film',
      'tv',
      'headset',
      'ticket',
      'football',
      'trophy',
      'dice',
      'golf',
      'tennisball',
      'basketball',
    ],
  },
  {
    labelKey: k.categories.iconGroups.educationWork,
    icons: [
      'school',
      'book',
      'library',
      'briefcase',
      'laptop',
      'desktop',
      'document-text',
      'pencil',
      'newspaper',
      'calculator',
      'code-slash',
    ],
  },
  {
    labelKey: k.categories.iconGroups.finance,
    icons: [
      'wallet',
      'cash',
      'card',
      'trending-up',
      'trending-down',
      'stats-chart',
      'pie-chart',
      'bar-chart',
      'logo-usd',
      'logo-bitcoin',
      'diamond',
    ],
  },
  {
    labelKey: k.categories.iconGroups.people,
    icons: [
      'people',
      'person',
      'person-add',
      'happy',
      'chatbubble',
      'chatbubbles',
      'call',
      'mail',
      'at',
      'notifications',
      'megaphone',
    ],
  },
  {
    labelKey: k.categories.iconGroups.natureTravel,
    icons: [
      'leaf',
      'flower',
      'earth',
      'globe',
      'map',
      'compass',
      'trail-sign',
      'bonfire',
      'cloudy',
      'rainy',
      'moon',
      'paw',
      'bug',
    ],
  },
  {
    labelKey: k.categories.iconGroups.misc,
    icons: [
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
      'bookmark',
      'time',
      'alarm',
      'hourglass',
      'lock-closed',
      'settings',
      'link',
      'cloud',
      'download',
      'share',
      'qr-code',
      'ellipsis-horizontal',
    ],
  },
];

function isMappedIconName(name: string): name is CategoryIconName {
  return Object.prototype.hasOwnProperty.call(IONICON_SYMBOLS, name);
}

/**
 * Native symbols for a bare Ionicon name (`"fast-food"`). `-outline` / `-sharp` variants map like
 * the base icon; anything else unmapped gets {@link FALLBACK_CATEGORY_SYMBOL}.
 */
export function getIoniconSymbol(name: string | null | undefined): CategorySymbol {
  if (!name) return FALLBACK_CATEGORY_SYMBOL;
  const base = name.replace(/-(outline|sharp)$/, '');
  return isMappedIconName(base) ? IONICON_SYMBOLS[base] : FALLBACK_CATEGORY_SYMBOL;
}

/**
 * Native symbols for a stored `categories.icon` value (`"Ionicons/fast-food"` or null). Other
 * libraries, malformed values and unmapped names get {@link FALLBACK_CATEGORY_SYMBOL}.
 */
export function getCategorySymbol(icon: string | null | undefined): CategorySymbol {
  const parsed = icon ? parseIcon(icon) : null;
  if (!parsed || parsed.library !== 'Ionicons') return FALLBACK_CATEGORY_SYMBOL;
  return getIoniconSymbol(parsed.name);
}

/** The `categories.icon` value to store for an Ionicon name picked in the app. */
export function toCategoryIconValue(name: string | null): string | null {
  return name ? `Ionicons/${name}` : null;
}
