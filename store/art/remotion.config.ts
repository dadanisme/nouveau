import { Config } from '@remotion/cli/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

Config.setEntryPoint('./src/index.ts');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');

// MARK: - Browser: Remotion 4.0.539's bundled Chrome Headless Shell 157 hangs on Darwin 27 ("delayRender ... Waiting
// for root component") and is re-downloaded per project. Prefer $PV_BROWSER_EXECUTABLE ("bundled" = Remotion's own),
// else the newest Playwright-cached chromium_headless_shell (same order as the skill's scripts/lib/browser.mjs).
// A --browser-executable flag on the command line still wins.
const findBrowser = (): string | null => {
  const env = (process.env.PV_BROWSER_EXECUTABLE || '').trim();
  if (env === 'bundled') return null;
  if (env) return env;
  const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright');
  let dirs: string[] = [];
  try {
    dirs = fs.readdirSync(cache).filter((d) => /^chromium_headless_shell-\d+$/.test(d));
  } catch {
    return null;
  }
  dirs.sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]));
  for (const d of dirs) {
    for (const s of fs.readdirSync(path.join(cache, d)).filter((x) => x.startsWith('chrome-headless-shell'))) {
      const exe = path.join(cache, d, s, 'chrome-headless-shell');
      if (fs.existsSync(exe)) return exe;
    }
  }
  return null;
};
const browser = findBrowser();
if (browser) Config.setBrowserExecutable(browser);
