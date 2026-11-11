# Nouveau app-store-preview — production brief (2026-11-11)

Deliverable: one video, 15-30 s (target 28 s), 886x1920 portrait, 30 fps, H.264 MP4 (iPhone with Dynamic Island / Face ID class),
frameless (no device frame), stereo AAC 256 kbps, captions burned in. Zipped alone as `Nouveau_261111.zip` (zip contains ONLY the video).
For the App Store listing of the iOS app Nouveau, Indonesian (id) localisation (Ramdan). Due: not set.
Ramdan uploads it himself in App Store Connect; never upload anything anywhere.

Project: `../nouveau-videos/261111-app-preview-id/`
  - `audio/vo/`      voiceover, voice TBD at Gate 2 (soniox), Bahasa Indonesia, female voice, one file per beat
  - `audio/demo/`    not used (no demo speech in this preview)
  - `rec/ios/`       raw takes (iPhone simulator, light mode, status bar 9:41)
  - `out/`           renders

## Hard rules
- App Review Guideline 2.3.4: only video screen captures of the app itself. No device frame, no hands, no home screen, no Photos app or iOS share sheet, nothing from outside Nouveau. Every frame is filled with app UI; the camera may push in. Narration, captions and label pills are allowed.
- No call to action and no text pointing outside the app (no URL, no store name, no "download").
- Frameless full-bleed screen captures, continuous live recordings, virtual camera following the action, label pills over footage. No closing wordmark card (a full-frame card is not app footage); end on the app.
- Open with what Nouveau IS: a shared household workspace for couples and families who manage money transparently (made by a couple). The shared workspace is beat 1, not a platform feature.
- Burned-in word-timed captions for all VO (Bahasa Indonesia). No dead silence (music bed always, UI sound optional).
- Cut all loading/waiting; no fast scrolling (beat 6 is a slow scroll).
- Light mode only. Status bar 9:41, full battery, full signal, no notifications or permission prompts.
- Test accounts demo+arif (owner) and demo+sinta of workspace "Keluarga Arif". Credentials live ONLY in the memory file `reference_showcase_accounts.md`; never copy passwords into this brief or any project file. Never real user data. Read-only checks except where the beats need a write; clean up written rows afterwards.
- Pre-grant everything: the AI consent sheet appears on the first scan, so accept it in a rehearsal take and keep it off-frame (or trim it). No sign-in, paywall or consent sheet on screen.
- Vendor names never on screen (audience is Apple): Supabase, RevenueCat, Soniox, Google, moneymail. Keep sign-in provider rows (Settings, Login) off-frame.
- Not shown (not live / internal / not part of this story): Premium and the paywall, guest mode and its sign-in prompt, proofs, email and WhatsApp ingestion (internal), Android.

## Live state (checked 2026-11-11, from the repo and the demo accounts' setup)
| Feature | Flag / config | State | How it's framed |
|---|---|---|---|
| Workspaces, members, invites | free (no gate) | on | beats 1-2, "Undang anggota" |
| Auto-categorize (AI) | `description_classification` | on for dummy accounts (admin grant in `feature_subscriptions`) | beat 3, "Kategori otomatis" |
| Scan Receipt (AI) | `receipt_scanning` | on for dummy accounts (admin grant) | beat 4, "Pindai struk"; first scan shows the AI consent sheet |
| Insights headline | `utils/insights-summary.ts` | on | beat 5, October 2026 vs September |
| Premium purchase flow | RevenueCat | not shown | cut |

Re-verify before capture: both grants are active and the AI consent is already granted for demo+arif, so no sheet appears mid-take.

## Palette
accent `#E24A00` · background white `#FFFFFF` and grouped gray `#F2F2F7` · text near-black `#1C1C1E` · font system (SF Pro, no custom font) · icon `public/brand/icon.png` (from `nouveau/assets/images/icon.png`)

Captions and label pills: near-black text on white or translucent white, accent only as a tint or small marker (never a fill behind small text). Captions sit above the bottom safe zone; pills below the top 220 px.

## Beats (one continuous scenario, iOS, light mode)
| # | Time | Footage (iOS: what happens on screen) | VO line | Label pill |
|---|---|---|---|---|
| 1 | 0-5s | Transactions list with the category bar, workspace Keluarga Arif | beat_1 | Keluarga Arif · Bersama |
| 2 | 5-10s | Workspace Settings: members Arif (Pemilik) and Sinta (Anggota), tap Undang anggota | beat_2 | Undang anggota |
| 3 | 10-15s | Add Transaction: type "Bakso Cuanki", category fills itself, Simpan | beat_3 | Kategori otomatis |
| 4 | 15-19s | Share a receipt photo into Nouveau, Pindai Struk, the transaction appears | beat_4 | Pindai struk |
| 5 | 19-24s | Insights for October 2026: "Pengeluaran Anda Rp18,4 jt, 4% lebih rendah dari September" | beat_5 | Ringkasan bulanan |
| 6 | 24-28s | Back on the Transactions list, slow scroll | beat_6 | none |

Notes for capture and edit:
- Beat 4: Guideline 2.3.4 forbids the Photos app and the iOS share sheet on screen. Start the clip on Nouveau's own share-intent screen (Pindai Struk) and cut or crop away any frame from outside the app.
- Poster frame is the 5 s frame (default): it falls on the start of beat 2; make it a clean Workspace Settings frame with both members visible.
- Beat 5 needs seeded October 2026 data that yields exactly the headline above (spent Rp18,4 jt, 4% below September); verify the figures on the device before recording.
- Beat 6 has the densest VO (10 words in 4 s): start the VO as beat 6 begins, or let the line run into the end of beat 5's tail if the edit allows; keep 1 s of footage-only ending.

Estimated VO: 50 words (8 + 10 + 8 + 5 + 9 + 10) = about 20 s at 2.5 w/s; target total 28 s. Beat 6 and beat 2 run tight, so the TTS speed must stay at 1.0 or below.

## Call to action
None (App Store preview, Guideline 2.3.4). Not said in VO.

## Demo content (fed to the app / seeded)
- No demo speech.
- Seeded data: workspace "Keluarga Arif" with owner Arif (Pemilik) and member Sinta (Anggota), a populated October 2026 so Insights shows Rp18,4 jt and a 4% decrease vs September, and the receipt photo in the simulator photo library (a plain, readable Indonesian receipt with no real shop or personal data).

## Music
MUSIC TBD: a separate agent is sourcing 3 candidates (no vocals, soft, steady, licence logged in MUSIC_LICENSE.txt). Do not mix until the user picks one at Gate 2. The `mix.json` track from the starter kit is a stand-in only.
