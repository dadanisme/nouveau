# HIG compliance checklist (iOS)

Checklist for auditing the Nouveau iOS app against Apple's Human Interface Guidelines with `device-loop` screenshots and UI trees. Each row is a one-line paraphrase that points to a HIG section. The audit agent fetches and quotes the HIG text at review time, so this file holds no HIG prose.

## Source of truth

- **Primary:** Apple's live HIG JSON at `https://developer.apple.com/tutorials/data/design/human-interface-guidelines/<slug>.json`. A citation `slug#Anchor` names a heading `anchor` in that page's `primaryContentSections`. Before citing, confirm the page returns 200 and the anchor exists.
- **Secondary:** Xcode MCP `mcp__xcode__DocumentationSearch`, to find the right HIG page for a topic. Always cite the JSON page it points to, not the search result.
- **Not sources:** memory, sosumi, hig-doctor, blog posts, third-party summaries.
- **No per-version HIG.** The HIG has no editions per iOS release, so iOS 17, 18.5 and 27 are all judged against the same live principles. Where a rule depends on a system feature (Liquid Glass, the tab-bar search slot), judge it only on the OS that has the feature.
- **Where the HIG is silent,** compare against an Apple app (Calendar, Reminders, Photos) on the same OS and device. Label the finding "Apple-app reference", never "HIG violation".

**Verify by:** `screenshot` (light, default size), `ui-tree` (accessibility tree: labels, roles, frames), `variant:dark`, `variant:ax5` (Larger Accessibility Sizes at max), `variant:contrast` (Increase Contrast), `variant:bold` (Bold Text), `variant:motion` (Reduce Motion), `variant:shapes` (Button Shapes), `apple-app` (side-by-side with an Apple app), `iphone15` (physical device).

**Severity:** `blocker` = breaks a HIG accessibility minimum or misleads the user. `major` = clear HIG violation. `minor` = polish.

## Cross-cutting judgement rules

Apply these on every screen before the per-component rows.

| ID    | Rule                                                                                                                                                                                                           | Source                                                                                                             | Verify by             | Severity |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- | -------- |
| CC-01 | Each action is reachable from one place per screen: no duplicate between a header menu and content rows/buttons. Exception: context-menu items, which must also exist in the main UI                           | **Apple-app reference** (no HIG rule). Nearest: `pull-down-buttons#Best-practices`, `context-menus#Best-practices` | screenshot, apple-app | minor    |
| CC-02 | A symbol means one thing app-wide (`+` only ever adds a new item); common actions use the standard symbol                                                                                                      | `menus#Icons`, `icons#Standard-icons` (the strict "one glyph, one meaning" reading is **Apple-app reference**)     | screenshot            | major    |
| CC-03 | A global control shown on every screen (tab-bar Add slot) makes sense on each screen where it is visible. The HIG says tab bars are for navigation, not actions, so the Add slot needs Apple-app justification | `tab-bars#Best-practices` (per-screen relevance test is **Apple-app reference**)                                   | screenshot, apple-app | major    |
| CC-04 | Toolbar items grouped by function and frequency into visually distinct sections, at most about three groups                                                                                                    | `toolbars#Item-groupings`                                                                                          | screenshot            | major    |
| CC-05 | Toolbar symbols are bare system symbols, with no outlined circles or borders                                                                                                                                   | `toolbars#Actions`                                                                                                 | screenshot            | minor    |
| CC-06 | At most one prominent (tinted) primary action per toolbar, on the trailing side                                                                                                                                | `toolbars#Actions`                                                                                                 | screenshot            | major    |
| CC-07 | No Liquid Glass or custom glass in the content layer (rows, cards, chart, FAB-like overlays)                                                                                                                   | `materials#Liquid-Glass`                                                                                           | screenshot            | major    |

## Toolbars and navigation bar

`navigation-bars.json` is a 404. Nav-bar guidance now lives in `toolbars`.

| ID    | Rule                                                                                                         | Source                    | Verify by                   | Severity |
| ----- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | --------------------------- | -------- |
| TB-01 | Each screen has a short, useful title, not the app name                                                      | `toolbars#Titles`         | screenshot                  | major    |
| TB-02 | Top-level screens use a large title that collapses to inline on scroll and returns at the top                | `toolbars#iOS`            | screenshot (scrolled + top) | minor    |
| TB-03 | Back is the standard system Back and modals use the standard Close/Done. No custom or text-only replacements | `toolbars#Navigation`     | ui-tree                     | major    |
| TB-04 | Only the essential actions go in the bar; the rest go in a More menu                                         | `toolbars#iOS`            | screenshot                  | major    |
| TB-05 | No custom toolbar backgrounds or tinted controls beyond the one primary action; use standard components      | `toolbars#Best-practices` | screenshot, variant:dark    | major    |
| TB-06 | A text-labelled action is not placed directly beside a symbol action, so the two don't read as one control   | `toolbars#Item-groupings` | screenshot                  | minor    |
| TB-07 | Leading edge holds back/navigation (period chevrons, Cancel); trailing edge holds actions and Done/Save      | `toolbars#Item-groupings` | screenshot                  | major    |

## Tab bars

| ID     | Rule                                                                                                                                            | Source                                          | Verify by                       | Severity |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------- | -------- |
| TAB-01 | The tab bar navigates between sections and does not host actions. The Add slot is an exception that must hold up against Apple apps (see CC-03) | `tab-bars#Best-practices`                       | screenshot, apple-app           | major    |
| TAB-02 | The tab bar stays visible on all top-level sections and is hidden only under modals                                                             | `tab-bars#Best-practices`                       | screenshot                      | major    |
| TAB-03 | No tab item looks disabled or is hidden. The `disabled` Add slot must not render dimmed                                                         | `tab-bars#Best-practices`                       | screenshot, ui-tree             | major    |
| TAB-04 | Every tab has a text label and an SF Symbol icon                                                                                                | `tab-bars#Best-practices`                       | screenshot                      | major    |
| TAB-05 | iOS 26+: the tab bar floats on Liquid Glass and content scrolls under it without the last row being cut off                                     | `tab-bars#iOS`                                  | screenshot (scrolled to bottom) | major    |
| TAB-06 | The trailing tab-bar slot is documented for a search tab. Check that repurposing it for Add matches Apple-app practice on iOS 26.1+             | `tab-bars#iOS`, `search-fields#Search-as-a-tab` | apple-app                       | major    |

## Lists and forms

| ID    | Rule                                                                                   | Source                            | Verify by   | Severity |
| ----- | -------------------------------------------------------------------------------------- | --------------------------------- | ----------- | -------- |
| LF-01 | Forms and settings use the grouped (inset) list style with section headers and footers | `lists-and-tables#Style`          | screenshot  | minor    |
| LF-02 | Row text is short and wraps instead of clipping at large text sizes                    | `lists-and-tables#Content`        | variant:ax5 | major    |
| LF-03 | The row style fits the data (value, subtitle, disclosure)                              | `lists-and-tables#Style`          | screenshot  | minor    |
| LF-04 | Selecting a row gives feedback: nav rows show a chevron and briefly highlight          | `lists-and-tables#Best-practices` | screenshot  | minor    |

## Sheets

| ID    | Rule                                                                                         | Source                  | Verify by              | Severity |
| ----- | -------------------------------------------------------------------------------------------- | ----------------------- | ---------------------- | -------- |
| SH-01 | Single-view sheet: Cancel on the leading edge, Done/Save on the trailing edge of the top bar | `sheets#iOS-iPadOS`     | screenshot             | major    |
| SH-02 | Done is always paired with Cancel (or Back). Cancel, Done and Back never appear together     | `sheets#Best-practices` | screenshot             | major    |
| SH-03 | Back in a sheet only moves between steps and never dismisses the sheet                       | `sheets#Anatomy`        | ui-tree                | major    |
| SH-04 | Resizable sheets show a grabber                                                              | `sheets#iOS-iPadOS`     | screenshot             | minor    |
| SH-05 | Swipe-down dismisses. With unsaved changes, an action sheet asks for confirmation first      | `sheets#iOS-iPadOS`     | screenshot (mid-swipe) | major    |
| SH-06 | Short pickers on iPhone consider the medium detent                                           | `sheets#iOS-iPadOS`     | screenshot             | minor    |

## Menus, pull-down and context menus

| ID    | Rule                                                                                                        | Source                             | Verify by  | Severity |
| ----- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------- | -------- |
| MN-01 | Item labels are short, in title case, with no articles, and end in an ellipsis when more input follows      | `menus#Labels`                     | screenshot | minor    |
| MN-02 | Item icons are used sparingly, are standard for common actions, and are uniform within a group              | `menus#Icons`                      | screenshot | minor    |
| MN-03 | Frequent items come first, related items are grouped, and the menu stays short (submenus one level at most) | `menus#Organization`               | screenshot | minor    |
| MN-04 | The current choice is shown with a checkmark (period, workspace)                                            | `menus#Toggled-items`              | screenshot | minor    |
| MN-05 | A pull-down doesn't hold every action of the view; primary actions stay visible                             | `pull-down-buttons#Best-practices` | screenshot | major    |
| MN-06 | Destructive items are marked destructive (red) and confirmed before they run                                | `pull-down-buttons#Best-practices` | screenshot | major    |
| MN-07 | Context-menu items also exist in the main UI, and context menus are offered consistently on similar rows    | `context-menus#Best-practices`     | screenshot | major    |
| MN-08 | Unavailable context-menu items are hidden, not dimmed                                                       | `context-menus#Best-practices`     | screenshot | minor    |

## Alerts, action sheets and destructive actions

| ID    | Rule                                                                                                              | Source                         | Verify by  | Severity |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- | -------- |
| AL-01 | Alerts are rare: not for plain information and not for common undoable actions                                    | `alerts#Best-practices`        | screenshot | major    |
| AL-02 | The title states the situation; the message only adds value; buttons aren't explained                             | `alerts#Content`               | screenshot | minor    |
| AL-03 | Button titles are short verbs, with no "OK" unless the alert is purely informational                              | `alerts#Buttons`               | screenshot | minor    |
| AL-04 | The destructive style marks an action the user didn't deliberately choose, and every destructive alert has Cancel | `alerts#Buttons`               | screenshot | major    |
| AL-05 | Choices that follow an intentional action use an action sheet, not an alert or a menu                             | `action-sheets#iOS-iPadOS`     | screenshot | major    |
| AL-06 | Action sheet: short title, message only if needed, Cancel present, destructive choice in red, no scrolling        | `action-sheets#Best-practices` | screenshot | major    |

## Buttons

| ID    | Rule                                                                                                 | Source               | Verify by           | Severity |
| ----- | ---------------------------------------------------------------------------------------------------- | -------------------- | ------------------- | -------- |
| BT-01 | Prominent style goes only on the most likely action, and style (not size) marks the preferred choice | `buttons#Style`      | screenshot          | minor    |
| BT-02 | A destructive button is never given the primary role                                                 | `buttons#Role`       | ui-tree             | major    |
| BT-03 | Every button's purpose is clear, using a familiar icon or a short verb label                         | `buttons#Content`    | screenshot, ui-tree | major    |
| BT-04 | Actions that don't complete instantly (Save, Scan, Sign in) show an activity indicator               | `buttons#iOS-iPadOS` | screenshot          | minor    |

## Text fields and entering data

| ID    | Rule                                                                                                           | Source                         | Verify by  | Severity |
| ----- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- | -------- |
| TF-01 | Every field has a placeholder hint that states its purpose                                                     | `text-fields#Best-practices`   | screenshot | minor    |
| TF-02 | Fields use the matching keyboard type (decimal for amount, email for email) and a number formatter for amounts | `text-fields#Best-practices`   | screenshot | major    |
| TF-03 | Passwords use secure fields and are never prefilled                                                            | `entering-data#Best-practices` | screenshot | major    |
| TF-04 | Values are checked as people type, and required data is clear before Save/Continue                             | `entering-data#Best-practices` | screenshot | major    |
| TF-05 | Text fields show a trailing Clear button                                                                       | `text-fields#iOS-iPadOS`       | screenshot | minor    |

## Pickers and date picking

`date-pickers.json` is a 404. Date picking is covered by `pickers`.

| ID    | Rule                                                                              | Source                   | Verify by  | Severity |
| ----- | --------------------------------------------------------------------------------- | ------------------------ | ---------- | -------- |
| PK-01 | Form date rows use the compact date picker inline, without moving to another view | `pickers#iOS-iPadOS`     | screenshot | minor    |
| PK-02 | Picker values are predictable and logically ordered (categories, months)          | `pickers#Best-practices` | screenshot | minor    |

## Segmented controls and toggles

| ID    | Rule                                                                         | Source                              | Verify by  | Severity |
| ----- | ---------------------------------------------------------------------------- | ----------------------------------- | ---------- | -------- |
| SG-01 | Segments are few, closely related, and the same size, with noun labels       | `segmented-controls#Best-practices` | screenshot | minor    |
| SG-02 | A segmented control uses text or images, not a mix                           | `segmented-controls#Content`        | screenshot | minor    |
| TG-01 | Switches appear only in list rows; outside a list, use a button that toggles | `toggles#iOS-iPadOS`                | screenshot | major    |
| TG-02 | The switch keeps its default color unless there's a reason to change it      | `toggles#iOS-iPadOS`                | screenshot | minor    |

## Search

| ID    | Rule                                                                                      | Source                     | Verify by  | Severity |
| ----- | ----------------------------------------------------------------------------------------- | -------------------------- | ---------- | -------- |
| SR-01 | If search is added, there is one search location for the whole app, with placeholder text | `searching#Best-practices` | screenshot | minor    |

## Loading and progress

| ID    | Rule                                                                                                     | Source                                         | Verify by  | Severity |
| ----- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------- | -------- |
| LD-01 | Something appears right away (placeholder rows), and people can use other parts of the app while loading | `loading#Best-practices`                       | screenshot | minor    |
| LD-02 | Loading is clearly indicated, determinate when possible (proof upload, receipt scan)                     | `progress-indicators#Best-practices`           | screenshot | minor    |
| LD-03 | Pull to refresh adds a title only when it helps; prefer automatic updates                                | `progress-indicators#Refresh-content-controls` | screenshot | minor    |

## Charts (#37)

| ID    | Rule                                                                                                              | Source                                          | Verify by                | Severity |
| ----- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------ | -------- |
| CH-01 | The mark type fits the data, and the axis range and lower bound are meaningful (bars start at zero)               | `charts#Axes`                                   | screenshot               | minor    |
| CH-02 | Series aren't told apart by color alone, and adjacent color areas are visually separated                          | `charts#Color`                                  | screenshot, variant:dark | major    |
| CH-03 | The chart has accessibility labels and a summary; Audio Graphs are considered                                     | `charts#Enhancing-the-accessibility-of-a-chart` | ui-tree                  | major    |
| CH-04 | Critical values don't require interaction; in compact width the plot uses the full width and aligns with the form | `charts#Best-practices`                         | screenshot               | major    |

## SF Symbols and icons

| ID    | Rule                                                                                        | Source                       | Verify by                | Severity |
| ----- | ------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------ | -------- |
| IC-01 | Common actions (add, share, delete, edit) use the standard SF Symbol                        | `icons#Standard-icons`       | ui-tree                  | minor    |
| IC-02 | Symbol rendering mode (category icons, row glyphs) works in light, dark and selected states | `sf-symbols#Rendering-modes` | screenshot, variant:dark | minor    |
| IC-03 | Interface icons are consistent in style and weight and match the weight of adjacent text    | `icons#Best-practices`       | screenshot               | minor    |

## Color

| ID    | Rule                                                                                                 | Source                     | Verify by                      | Severity |
| ----- | ---------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------ | -------- |
| CL-01 | A color never means two things (accent tint vs expense/income color vs destructive red)              | `color#Best-practices`     | screenshot                     | major    |
| CL-02 | All colors work in light, dark and Increase Contrast, including category palette colors              | `color#Best-practices`     | variant:dark, variant:contrast | major    |
| CL-03 | Nothing relies on color alone (income vs expense has a sign or label; selection has a checkmark)     | `color#Inclusive-color`    | screenshot                     | blocker  |
| CL-04 | No hardcoded system color values; semantic colors only                                               | `color#System-colors`      | ui-tree, variant:dark          | major    |
| CL-05 | Color on Liquid Glass bars and their symbols is sparing: accent only on the primary action or status | `color#Liquid-Glass-color` | screenshot                     | major    |

## Typography

| ID    | Rule                                                                                             | Source                               | Verify by   | Severity |
| ----- | ------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------- | -------- |
| TY-01 | Only built-in system text styles are used; no fixed font sizes                                   | `typography#Using-system-fonts`      | variant:ax5 | major    |
| TY-02 | The layout adapts to every size up to AX5, with no clipped or overlapping text                   | `typography#Supporting-Dynamic-Type` | variant:ax5 | blocker  |
| TY-03 | At large sizes, truncation stays minimal, rows restack, and meaningful icons scale with the text | `typography#Supporting-Dynamic-Type` | variant:ax5 | major    |
| TY-04 | No light, thin or ultralight weights; nothing below 11 pt at default size                        | `typography#Ensuring-legibility`     | screenshot  | major    |

## Dark mode

| ID    | Rule                                                                            | Source                     | Verify by                      | Severity |
| ----- | ------------------------------------------------------------------------------- | -------------------------- | ------------------------------ | -------- |
| DM-01 | No in-app appearance setting; the app follows the system                        | `dark-mode#Best-practices` | screenshot                     | major    |
| DM-02 | Legible in both modes, including Dark + Increase Contrast + Reduce Transparency | `dark-mode#Best-practices` | variant:dark, variant:contrast | major    |
| DM-03 | Uses system background colors and system label colors for text                  | `dark-mode#iOS-iPadOS`     | variant:dark                   | major    |

## Materials

| ID    | Rule                                                                                                          | Source                   | Verify by  | Severity |
| ----- | ------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------- | -------- |
| MT-01 | Liquid Glass is used sparingly and only on standard controls. Clear glass only over visually rich backgrounds | `materials#Liquid-Glass` | screenshot | major    |

## Layout

| ID    | Rule                                                                                                             | Source                         | Verify by             | Severity |
| ----- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------ | --------------------- | -------- |
| LY-01 | Content respects safe areas and system margins: nothing under the status bar, home indicator, tab bar or toolbar | `layout#Guides-and-safe-areas` | screenshot, iphone15  | major    |
| LY-02 | Content is ordered by importance, related items grouped, and controls visually distinct from content             | `layout#Visual-hierarchy`      | screenshot            | minor    |
| LY-03 | The layout holds up across text sizes, devices and localizations (Bahasa Indonesia is longer)                    | `layout#Adaptability`          | variant:ax5, iphone15 | major    |

## Accessibility

| ID    | Rule                                                                                                                          | Source                                                        | Verify by                 | Severity |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------- | -------- |
| AX-01 | Tap targets are 44x44 pt by default and never below 28x28 pt                                                                  | `accessibility#Mobility`                                      | ui-tree                   | blocker  |
| AX-02 | Spacing between controls prevents mis-taps (about 12 pt around bezeled controls, 24 pt around bare ones)                      | `accessibility#Mobility`                                      | ui-tree                   | major    |
| AX-03 | Text contrast is at least 4.5:1 up to 17 pt and 3:1 at 18 pt or bold, in light and dark                                       | `accessibility#Vision`                                        | screenshot, variant:dark  | blocker  |
| AX-04 | Where default contrast falls short, Increase Contrast brings it up to the minimum                                             | `accessibility#Vision`                                        | variant:contrast          | blocker  |
| AX-05 | Text can grow to at least 200% (Dynamic Type through AX5)                                                                     | `accessibility#Vision`                                        | variant:ax5               | blocker  |
| AX-06 | Every key element has a VoiceOver label; decorative images are hidden                                                         | `voiceover#Descriptions`                                      | ui-tree                   | blocker  |
| AX-07 | Titles and headings mark the hierarchy; grouping and reading order are correct; content changes (period switch) are announced | `voiceover#Navigation`                                        | ui-tree                   | major    |
| AX-08 | Every gesture has an on-screen alternative (swipe-to-delete also in a menu; sheet swipe also has Cancel)                      | `accessibility#Mobility`                                      | screenshot                | major    |
| AX-09 | Motion is never the only way information is conveyed; with Reduce Motion on, nothing fast or blinking remains                 | `motion#Best-practices`                                       | variant:motion            | major    |
| AX-10 | Text responds to Bold Text (automatic with system fonts; required for any custom font)                                        | `typography#Using-custom-fonts`                               | variant:bold              | major    |
| AX-11 | With Button Shapes on, custom-drawn tappable text (RN-hosted rows, links) still reads as a button                             | **Apple-app reference** (no HIG section covers Button Shapes) | variant:shapes, apple-app | minor    |

## Feedback and modality

| ID    | Rule                                                                                                                                                    | Source                    | Verify by           | Severity |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------- | -------- |
| FM-01 | Modals have a clear benefit, stay short, and don't feel like an app within the app                                                                      | `modality#Best-practices` | screenshot          | minor    |
| FM-02 | Every modal has an obvious dismiss and a title that names its task (proof viewer, share intent)                                                         | `modality#Best-practices` | screenshot          | major    |
| FM-03 | One modal is dismissed before another opens. Check sheet-over-sheet chains (category picker over Add Transaction, icon/color picker over category form) | `modality#Best-practices` | screenshot          | major    |
| FM-04 | Closing a modal with unsaved data asks for confirmation                                                                                                 | `modality#Best-practices` | screenshot          | major    |
| FM-05 | Feedback is accessible; status is shown in the UI; failed commands explain why; unexpected, irreversible data loss is warned about                      | `feedback#Best-practices` | screenshot, ui-tree | major    |

## Onboarding and sign-in

| ID    | Rule                                                                                                    | Source                                             | Verify by           | Severity |
| ----- | ------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------- | -------- |
| SI-01 | The Sign in with Apple button is no smaller than other sign-in buttons and is visible without scrolling | `sign-in-with-apple#Displaying-buttons`            | screenshot          | major    |
| SI-02 | The system SIWA button keeps its minimum size and margin; its corner radius matches the other buttons   | `sign-in-with-apple#Button-size-and-corner-radius` | screenshot, ui-tree | major    |
| SI-03 | After SIWA, no password and no personal email are requested; required vs optional data is clear         | `sign-in-with-apple#Collecting-data`               | screenshot          | major    |
| SI-04 | Account benefits and auth methods are identified; only methods available on this device are shown       | `managing-accounts#Best-practices`                 | screenshot          | minor    |
| SI-05 | Account deletion can be started clearly from inside the app                                             | `managing-accounts#Deleting-accounts`              | screenshot          | major    |

## Finding format

One block per finding. **If there is no verbatim HIG quote, the verdict is `opinion`.**

```
- ID:               <checklist ID>-F<n>            e.g. TB-03-F1
- Screen / route:   <name> (`app/...` route)
- OS + device:      iOS <ver>, <device>             e.g. iOS 27, iPhone 17 sim
- Variant:          light | dark | ax5 | contrast | bold | motion | shapes
- Screenshot:       <absolute path>
- Checklist item:   <ID> — <rule line>
- Verdict:          HIG violation | Apple-app reference | opinion
- HIG quote:        "<verbatim, fetched at review time>"
- Source:           <slug>#<Anchor>
- Fetched:          <YYYY-MM-DD>
- Page last change: <first date in the page's change log, or "no change log">
- Code location:    <file:line>
- Proposed fix:     <one or two lines>
```

## Page freshness (as of 2026-11-03)

Most recent change-log date in each page's JSON.

| Slug              | Last change   | Slug                          | Last change   |
| ----------------- | ------------- | ----------------------------- | ------------- |
| accessibility     | 2025-06-09    | menus                         | 2026-06-08    |
| action-sheets     | no change log | modality                      | 2023-12-05    |
| alerts            | 2024-02-02    | motion                        | 2025-09-09    |
| buttons           | 2025-12-16    | onboarding                    | 2024-06-10    |
| charts            | 2022-09-23    | pickers                       | 2023-06-05    |
| color             | 2025-12-16    | progress-indicators           | 2023-09-12    |
| context-menus     | 2023-12-05    | pull-down-buttons             | 2022-09-14    |
| dark-mode         | 2024-08-06    | search-fields                 | 2026-06-08    |
| entering-data     | 2023-06-21    | searching                     | 2026-06-08    |
| feedback          | no change log | segmented-controls            | 2023-06-21    |
| icons             | 2025-06-09    | sf-symbols                    | 2025-07-28    |
| layout            | 2026-09-09    | sheets                        | 2026-03-24    |
| lists-and-tables  | 2023-06-21    | sign-in-with-apple            | 2022-09-14    |
| loading           | 2025-06-09    | tab-bars                      | 2026-06-08    |
| managing-accounts | no change log | text-fields                   | 2023-06-05    |
| materials         | 2025-09-09    | toggles                       | 2024-03-29    |
| toolbars          | 2025-12-16    | typography                    | 2025-12-16    |
| voiceover         | 2025-03-07    | navigation-bars, date-pickers | 404 (removed) |
