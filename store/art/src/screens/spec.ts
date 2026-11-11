// App Store screenshots: copy, geometry and colours (all numbers in canvas px; canvas is the 6.9" iPhone class).
import { ART, Lang } from '../store/tokens';

export type ShotNo = '01' | '02' | '03' | '04' | '05' | '06';
export const SHOT_NOS: ShotNo[] = ['01', '02', '03', '04', '05', '06'];
export const RAW_NAMES: Record<ShotNo, string> = {
  '01': '01-workspace',
  '02': '02-transactions',
  '03': '03-add-transaction',
  '04': '04-scan-receipt',
  '05': '05-insights',
  '06': '06-welcome',
};

// Headlines exactly as briefed. No prices, URLs, awards or other platforms.
export const HEADLINES: Record<ShotNo, Record<Lang, string>> = {
  '01': { id: 'Keuangan keluarga, terbuka bersama', en: 'Family finance, out in the open' },
  '02': { id: 'Semua transaksi, satu tampilan', en: 'Every transaction, one view' },
  '03': { id: 'Catat dalam hitungan detik', en: 'Log it in seconds' },
  '04': { id: 'Foto struk, tak perlu mengetik', en: 'Snap a receipt, skip the typing' },
  '05': { id: 'Tahu ke mana uang pergi', en: 'Know where your money goes' },
  '06': { id: 'Mulai tanpa akun', en: 'Start without an account' },
};

export const CANVAS = { width: 1320, height: 2868 };
export const RAW = { width: 1320, height: 2868 };

const SCREEN_W = 1100; // 83.3% of the canvas width
export const LAYOUT = {
  screenW: SCREEN_W,
  screenH: (SCREEN_W * RAW.height) / RAW.width, // exact aspect of the raw capture, never stretched
  bezel: 16, // slim
  screenRadius: 150, // iPhone 6.9" display corner radius scaled to this width
  phoneTop: 480, // the phone bleeds off the bottom edge
  headlineSize: 116,
  headlineLineHeight: 1.08,
  headlineMaxW: 1180, // 70 px side margins
  zoneH: 440, // headline block lives in y 0..440, then the phone
  minMargin: 60,
  minGapToPhone: 60,
};

export const BG = { top: ART.grouped, bottom: ART.white, tint: ART.tint };
