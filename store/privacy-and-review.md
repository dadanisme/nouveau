# App Privacy answers, age rating and App Review notes (#85)

App Store Connect answers for iOS 1.0.0, as entered on 2026-11-11. Facts come from the code and the published privacy policy
(https://www.nouveau.my.id/privacy) as of that date.

**Status (2026-11-11):** the App Privacy answers below are entered and published, the age rating (4+) is saved, and the review notes
(section 3) are saved on the version page with the review account's sign-in and the maintainer's contact details, which are not stored
here. The AI provider opt-out in "CHECK" item 1 shipped (moneymail PR #19, Cloud Run revision `moneymail-api-00006-lbk`), but the
privacy policy text was not changed. Items marked **CHECK** are the open points that stayed with the maintainer.

## 1. App Privacy ("nutrition label")

Tracking: **No.** `NSPrivacyTracking` is false in both privacy manifests, there is no ATT prompt and no ad or analytics SDK.
Every type below is **linked to the user** (the account id) and **not used for tracking**.

| Apple data type                      | Collected | What it is                                                                       | Purpose                      |
| ------------------------------------ | --------- | -------------------------------------------------------------------------------- | ---------------------------- |
| Contact Info: Email Address          | Yes       | Account email (and invitee emails on invites)                                    | App Functionality            |
| Contact Info: Name                   | Yes       | Display name, or the name from Apple/Google sign-in                              | App Functionality            |
| Financial Info: Other Financial Info | Yes       | Transactions: amount, type, date, currency, description, category                | App Functionality            |
| User Content: Photos or Videos       | Yes       | Receipt images (proofs, scans) kept in Cloudflare R2                             | App Functionality            |
| User Content: Other User Content     | Yes       | Category names, workspace names, members and invites                             | App Functionality            |
| Identifiers: User ID                 | Yes       | Supabase user id, also the RevenueCat app user id                                | App Functionality            |
| Purchases: Purchase History          | Yes       | Premium subscription snapshot (product, dates, renewal state)                    | App Functionality            |
| Usage Data: Other Usage Data         | Yes       | Per-account AI usage log (operation, model, tokens, cost; no content)            | App Functionality, Analytics |
| Identifiers: Device ID               | Yes       | Conservative entry for the Google Sign-In SDK's declaration (decided 2026-11-11) | Analytics                    |

Not collected: location, contacts, health, browsing or search history, advertising data, crash or performance data, sensitive info.
Decision 2026-11-11 (maintainer): take the conservative label, so Device ID and the Analytics purpose are declared for the Google
Sign-In SDK even though the app itself reads no IDFA or IDFV. Coarse location from the SDK's manifest is not declared (the app never
requests location).

Guest mode keeps everything on the device, so it adds nothing here.

### CHECK before entering

1. **AI provider data use.** Auto-categorize sends the description plus the workspace's category names, and Scan Receipt sends the
   image or PDF, to OpenRouter and on to Google Gemini (`google/gemini-3.1-flash-lite`). Before 2026-11-11 the code set no
   OpenRouter `provider` options, and the privacy policy is silent on training. **Done:** every OpenRouter request now sends
   `provider: { data_collection: "deny" }` (moneymail PR #19, deployed). Real text and image requests with it succeeded; a PDF was
   not tested. Still open: the policy does not say provider data collection is denied, and switching the model in
   `moneymail/src/lib/models.ts` needs the same check.
2. **Google Sign-In SDK.** GoogleSignIn 9.2.0 ships a manifest declaring name, email, phone, coarse location, user id, device id and
   other usage data (analytics purposes). **Decided:** the conservative label (Device ID, and the Analytics purpose on Other Usage
   Data), as in the table above.
3. **RevenueCat** declares only Purchase History in its own manifest. Whether it sends the IDFV or the IP address is not verified.
4. **Policy match.** The label has to agree with the policy: it lists the same data and says no ads, no tracking, no third-party
   analytics SDK in the app. The policy's age line says 18+ or with parental supervision.

## 2. Age rating

Answer "None" or "No" to every content question: no violence, sexual content, profanity, horror, drugs, gambling, contests, medical
content or loot boxes. No unrestricted web access (legal pages open in the system browser sheet), no messaging between strangers, no
public user-generated content (workspaces are private and invite-only), no age assurance. Expected rating: **4+**.
The policy says 18+ / parental supervision; the age rating is about content, so it can stay 4+, but the policy wording is a choice
for the maintainer (not "Made for Kids").

## 3. App Review notes (English, paste into Notes, under 4000 characters)

```
Nouveau is a family finance tracker for iPhone: people log income and expenses and share a workspace with a partner or family
member. Please use the Sign-In Information above. That account has Nouveau Premium (granted on our side, so no purchase is needed to
test it). The first time you use an AI feature a consent sheet appears: tap Allow.

HOW TO REACH EACH FEATURE
- Add a transaction: Transactions tab, "+" in the top right. Type a description such as "Indomaret groceries" and the category is
  filled in automatically (Premium, uses AI).
- Shared workspace: Settings > Workspaces > Create Workspace, then open it and tap Invite Member (an invite is a token the owner
  copies and sends; the other person pastes it under Settings > Workspaces > Invitations. There is no public user search).
- Insights tab: monthly and yearly summaries, spending by category.
- Scan Receipt: there is no in-app camera. Scanning works from the iOS share sheet: open Photos or Files, choose any receipt image
  or PDF, tap Share > Nouveau, then Scan Receipt.
- Premium: Settings > Premium shows the status, Manage Subscription and Restore Purchases. To see the purchase screen with the 7-day
  free trial, tap Sign Out, create a new account (Sign Up) and finish the currency step, or open Settings > Premium on a free account.
- Guest mode: from the welcome screen, "Get Started" works without an account; data stays on the device and nothing is sent.
- Delete account: Settings > Profile > Delete Account.

SUBSCRIPTIONS
nouveau_premium_monthly and nouveau_premium_yearly, one subscription group, each with a 7-day free trial for eligible accounts.
Premium unlocks AI auto-categorize, Scan Receipt and proof attachments. Shared workspaces are free. The paywall shows the renewal
terms, Restore Purchases, and links to the Terms of Use and Privacy Policy.

AI AND PRIVACY
The AI features run only after the user taps Allow on an in-app consent sheet (Settings > Premium > AI Processing turns it off).
Text descriptions and receipt images are sent to our server and processed by Google Gemini through OpenRouter. We do not use ads or
tracking, and there is no analytics SDK. Privacy Policy: https://www.nouveau.my.id/privacy

OTHER NOTES
- Sign-in methods: email and password, Sign in with Apple, and Google.
- Workspace members see each other's transactions, names and emails. Workspaces are private, invite-only and never public, so there
  is no public user-generated content to report or block.
- No location, camera, microphone or contacts access. Photo library access is write-only, used to save a receipt photo on request.
- The app uses only standard HTTPS encryption.
- Contact: hello@nouveau.my.id
```

## 4. Not entered by Claude

- **Sign-in information** (email and password for the review account): typed by the maintainer, not stored here.
- **Contact information** for App Review (name, phone, email): the maintainer's own.
- **Attachment:** none. A sample receipt was considered and not needed; the notes tell the reviewer to share any image or PDF.

## 5. Open decisions

- **Review account: `demo-simulator`** (maintainer said "whatever"; chosen because it already has the Premium comps, so no production
  data change is needed). `demo+arif` would show sharing with a populated workspace, but granting it comps and AI consent is a
  production data change that was not approved.
- The notes mention OpenRouter by name, in line with the policy.
- **OpenRouter opt-out:** deployed 2026-11-11. The privacy policy can now say provider data collection is denied; that edit lives in
  the `nouveau-website` repo and has not been made.
- **Before submitting:** reset the `demo-simulator` password after review, since it is a shared test login.
