# App Store media (#85)

Sources for the Nouveau App Store listing media: six screenshots, the Header and Search Results creative assets (Indonesian and
English) and the Indonesian app preview. The repo holds the sources and the copy only. Binaries (the rendered PNGs and MP4, the raw
simulator captures, the voiceover and music audio, `node_modules`) are not committed; the finished files were handed over locally and
upload to App Store Connect is done by hand. The copy and the Apple rules these files follow are in [`media-copy.md`](media-copy.md).
`store/` is outside the Expo app: tsconfig, ESLint and Prettier skip it, and it has its own `package.json` files.

| Output                                                    | Spec                                                         | Source                                                                                    | Command                                       |
| --------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | --------------------------------------------- |
| Screenshots `01-workspace` to `06-welcome`, `id` and `en` | iPhone 6.9", 1320x2868 PNG, RGB, no alpha                    | `art/` (`src/screens/`, `scripts/render-screenshots.mjs`) over the raw simulator captures | `node scripts/render-screenshots.mjs`         |
| `header.png`, `search-results.png`, `id` and `en`         | Header 21:9 3840x1646, Search Results 3:2 3000x2000, iOS 27+ | `art/` (`src/store/`, `svg/`, `scripts/gen-hero.mjs`), artwork variant `family`           | `VARIANTS=family node scripts/render-all.mjs` |
| `app-preview.mp4` (Indonesian)                            | 886x1920, 30 fps, H.264 + AAC stereo, 15-30 s (28 s)         | `video/` (Remotion composition `AppPreviewPortrait`)                                      | see below                                     |

## `art/` (Remotion stills)

One Remotion project renders all twelve screenshots and the Header and Search Results stills. It is the "header v2" project
(`261111-store-art-header-v2`, which has the `family` and `couple` artwork variants) with the final screenshot sources from the
`261111-store-art` project laid over it: `src/screens/spec.ts`, `src/screens/StoreScreenshot.tsx` and
`scripts/render-screenshots.mjs`. The header project's older screenshot spec had a deeper-crop variant that was dropped, so the
screenshot files here are the final ones. `src/kit/` is the product-video skill's Remotion kit (shared with `video/`, but each project
has its own edited copy, so the two kits differ); `src/example/` is the kit's starter, unused.

Re-render (checked 2026-11-11: both screenshot sets, and Header and Search Results for the `family` variant, came out byte-identical to the approved files):

```bash
cd store/art
npm ci
mkdir -p public/art raw/id raw/en
cp svg/mark.svg svg/hero.svg public/art/
node scripts/gen-hero.mjs                       # writes public/art/hero-couple.svg and hero-family.svg
# put the raw captures in raw/id/ and raw/en/ (see below): 01-workspace.png ... 06-welcome.png, 1320x2868
node scripts/render-screenshots.mjs             # -> out/screenshots/{id,en}/, review/screenshots-contact-*.png, review/screenshots-checks.json
VARIANTS=family node scripts/render-all.mjs     # -> out/store-art-variants/family/{id,en}/header.png, search-results.png
```

Both scripts measure the layout in a real browser and exit non-zero on a failure (text inside the safe area, contrast, exact size,
no alpha channel). `public/` and `raw/` are git-ignored.

Required tools: Node 22 and npm, `ffmpeg` and `ffprobe`, macOS `sips`, the "SF Pro Display" system font (the scripts fail if it is
missing), and a Chromium headless shell. The scripts and `remotion.config.ts` find that shell through the product-video skill
(`~/.claude/skills/product-video/scripts/browser-path.mjs`, a Playwright-cached `chromium_headless_shell`); Remotion's bundled
Chrome hangs on Darwin 27, so set `PV_BROWSER_EXECUTABLE` to a headless shell if the skill is not installed (`render-*.mjs` call
`browser-path.mjs` directly and need a one-line change in that case).

### Raw captures

The screenshots are simulator screenshots at native size (1320x2868), light mode, status bar overridden to 9:41 with a full battery and
signal, no prompts on screen. They came from the **iPhone 18 Pro Max simulator (iOS 27.2)** running a **Release build of `main` at
`b0a49b5`** (which includes the month-end fixes #134/#135 and the co-member names fix #136), the app in Bahasa Indonesia for the
`id` set and English for the `en` set, workspace "Keluarga Arif". The six scenes: workspace settings, the Transactions list with the
category bar, Add Transaction, the shared-receipt Scan Receipt screen, the October 2026 Insights, and Welcome.

The data is dummy: the workspace "Keluarga Arif" has two dummy demo accounts (an owner, Arif, and a member, Sinta; addresses like
`demo+arif@nouveau.my.id` and `demo+sinta`), with seeded October and November 2026 transactions. **Their credentials are not in this
repo**; they live only in the maintainer's local memory. Never add them here.

## `video/` (Remotion app preview)

The app preview is one Remotion composition, `AppPreviewPortrait` (`src/appPreview/`: `timeline.ts` has the cuts, VO placement and
label pills, `camera.ts` the shared push, `AppPreview.tsx` and `SoftScreen.tsx` the layers). `BRIEF.md` is the approved brief,
`audio/vo/vo_lines.txt` the six voiceover lines, `asr_aliases.txt` the speech-recognition aliases used when aligning captions,
`mix.json` the audio mix and `MUSIC_LICENSE.txt` the music licence. The `src/kit/` is this project's copy of the product-video kit and
`src/generated/captionWords.ts` the word timings the burned-in captions use.

Not in the repo, and needed to render:

- `rec/ios/take_<beat>_<n>.mov`: raw iPhone 18 Pro Max simulator recordings (1320x2868, variable frame rate), Release build of `main`
  at `b0a49b5`, Bahasa Indonesia, light mode, 9:41 status bar, same dummy accounts and data as above. The cut uses `take_1_1`,
  `take_2_3`, `take_3_1`, `take_4_1`, `take_5_2` and `take_6_1`.
- `public/clips/*.mp4`: those takes normalised to 886x1920, 30 fps CFR, no audio: `prep-clips.sh <in> <out> --fps 30 --max 1926`, then
  a crop to 886x1920 (`crop=886:1920:0:3`; `--max 1926` gives 886x1926).
- `public/brand/icon.png`: the app icon (`assets/images/icon.png`).
- `audio/vo/beat_<n>.wav` (Soniox TTS, voice "Sari", Indonesian: `build-vo.sh`), `audio/music/` (the Pixabay track in
  `MUSIC_LICENSE.txt`), `audio/room/roomtone.wav`, and `public/mix.wav` (from `mix.sh`).

The helper scripts (`prep-clips.sh`, `build-vo.sh`, `align-captions.sh`, `export-timeline.mjs`, `mix.sh`, `check.sh`, `package.sh`) are in
the product-video skill (`~/.claude/skills/product-video/scripts/`, `$SK` below). With those in place:

```bash
cd store/video
npm ci
node $SK/scripts/export-timeline.mjs .          # -> review/AppPreviewPortrait.timeline.json
$SK/scripts/mix.sh .                            # -> public/mix.wav (-16 LUFS, <= -1 dBTP)
npx remotion render AppPreviewPortrait out/app-preview-id.mp4 --codec=h264 --crf=16 --pixel-format=yuv420p
$SK/scripts/check.sh out/app-preview-id.mp4 --type app-store-preview --script audio/vo/vo_lines.txt \
  --orientation portrait --timeline review/AppPreviewPortrait.timeline.json --aliases audio/vo/asr_aliases.txt
$SK/scripts/package.sh out/app-preview-id.mp4 Nouveau   # zip + copy in ~/Downloads, never overwrites
```

Beat 1 and beat 4 were synthesised from the respelling "Nuvou" because the TTS reads "Nouveau" as "nufo"; the captions use the real
spelling (see the first line of `vo_lines.txt`). The published preview is the cut "v4".

## Notes from capture

- App fixes found while capturing, shipped separately: the month-end range (#134 / #135, the last day of the month was missing from
  signed-in and web transaction queries) and co-members' names in Workspace settings (#136, a member without a display name read
  "Unknown").
- Localisation observation, not fixed here: compact amounts use a dot decimal in Indonesian ("Rp18.4Jt"), where Indonesian would use a
  comma ("Rp18,4 jt"); and with the system region en-US the date picker row reads "Nov 11, 2026" inside the Indonesian UI.
- Technical note: the preview's video stream is full-range (`yuvj420p`, `color_range=pc`) although the render asked for
  `yuv420p`; check that App Store Connect accepts and plays it when uploading (it was not tested against App Store Connect).
