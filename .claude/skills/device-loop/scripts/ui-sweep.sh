#!/usr/bin/env bash
# ui-sweep.sh <udid|matrix key> [out.json]   -> HIG accessibility sweep of the current iOS simulator screen
# Dumps the accessibility tree with `axe describe-ui` (raw JSON saved to out.json if given) and reports:
#   (a) interactive elements (button, link, tab, toggle/switch, checkbox, text/search field, slider, stepper,
#       pop-up/menu button, segmented control) with an empty or missing label
#   (b) interactive elements whose frame is smaller than 44x44 pt (HIG minimum hit target)
#   (c) a count summary
# Ignored: the Expo dev-client floating tools button (SF Symbol gearshape.fill, <=60 pt, and anything inside its
# frame), the status bar, scroll-bar sliders, duplicate nodes (same type+label+frame) and fully off-screen nodes.
# AXe frames are the accessibility frame, not the hit region: a 36 pt glass toolbar button may still be easy to hit,
# so treat (b) as "check", then grade it against references/hig-checklist.md.
# Never run on the iPhone Duo (AXe crash-loops SpringBoard there; see SKILL.md section 3).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
[ $# -ge 1 ] || { sed -n '2,12p' "$0"; exit 2; }
id="$1" out="${2:-}"
[[ "$id" =~ ^[0-9A-F-]{36}$ ]] || id="$("$HERE/matrix.sh" udid "$id")"
command -v axe >/dev/null || { echo "axe not installed (brew install cameroncooke/axe/axe); ui-sweep needs it" >&2; exit 3; }
if [ "$(xcrun simctl list devices | grep "$id" | grep -o 'iPhone Duo' || true)" ]; then
  echo "refusing: $id is an iPhone Duo (AXe crash-loops it)" >&2; exit 4
fi

tmp="$(mktemp -t ui-sweep)"; trap 'rm -f "$tmp"' EXIT
axe describe-ui --udid "$id" > "$tmp"
[ -z "$out" ] || { mkdir -p "$(dirname "$out")"; cp "$tmp" "$out"; }

python3 -I - "$tmp" <<'PY'
import json, re, sys
tree = json.load(open(sys.argv[1]))
INTERACTIVE = {"Button", "Link", "RadioButton", "Tab", "CheckBox", "Switch", "Toggle", "TextField",
               "SecureTextField", "TextArea", "SearchField", "ComboBox", "PopUpButton", "MenuButton",
               "Slider", "Incrementor", "Stepper", "SegmentedControl", "DisclosureTriangle"}
TRAITS = {"button", "link", "adjustable", "searchfield", "keyboardkey", "tabbar"}
MIN = 44 - 0.5  # tolerance for fractional point frames

def frame(n):
    f = n.get("frame") or {}
    return f.get("x", 0), f.get("y", 0), f.get("width", 0), f.get("height", 0)

def walk(n, acc):
    t = (n.get("type") or "") + " " + (n.get("role") or "") + " " + (n.get("subrole") or "")
    if "StatusBar" in t:
        return
    acc.append(n)
    for c in n.get("children") or []:
        walk(c, acc)

nodes = []
for root in (tree if isinstance(tree, list) else [tree]):
    walk(root, nodes)
app = next((n for n in nodes if n.get("type") == "Application"), None)
sx, sy, sw, sh = frame(app) if app else (0, 0, 10**4, 10**4)
devtools = [frame(n) for n in nodes if n.get("AXUniqueId") == "gearshape.fill" and max(frame(n)[2:]) <= 60]

def inside(f, box):
    return f[0] >= box[0] - 8 and f[1] >= box[1] - 8 and f[0] + f[2] <= box[0] + box[2] + 8 and f[1] + f[3] <= box[1] + box[3] + 8

def kind(n):
    ty, role = n.get("type") or "", (n.get("role") or "").removeprefix("AX")
    if ty in INTERACTIVE or role in INTERACTIVE:
        return "Tab" if n.get("subrole") == "AXTabButton" else (ty or role)
    tr = {str(x).lower() for x in n.get("traits") or []}
    return ty + "(trait)" if tr & TRAITS else None

seen, items, skipped = set(), [], {"dev-tools": 0, "scroll bar": 0, "off-screen": 0, "duplicate": 0}
for n in nodes:
    k = kind(n)
    if not k:
        continue
    f, label = frame(n), (n.get("AXLabel") or n.get("title") or "").strip()
    if any(inside(f, d) for d in devtools): skipped["dev-tools"] += 1; continue
    if re.match(r"(Vertical|Horizontal) scroll bar", label): skipped["scroll bar"] += 1; continue
    if f[0] >= sx + sw or f[1] >= sy + sh or f[0] + f[2] <= sx or f[1] + f[3] <= sy: skipped["off-screen"] += 1; continue
    key = (k, label, tuple(round(v, 1) for v in f))
    if key in seen: skipped["duplicate"] += 1; continue
    seen.add(key); items.append((k, label, f, n.get("AXUniqueId")))

def desc(k, label, f, uid):
    clip = " (partly off-screen)" if f[1] + f[3] > sy + sh or f[1] < sy else ""
    ident = f" id={uid}" if uid else ""
    return f'{k} "{label}"{ident} {f[2]:.0f}x{f[3]:.0f} @ ({f[0]:.0f},{f[1]:.0f}){clip}'

unlabeled = [i for i in items if not i[1]]
small = [i for i in items if i[2][2] < MIN or i[2][3] < MIN]
print(f"screen: {app.get('AXLabel') if app else '?'} {sw:.0f}x{sh:.0f} pt")
print(f"(a) unlabeled interactive: {len(unlabeled)}")
for i in unlabeled: print("   ", desc(*i))
print(f"(b) under 44x44 pt: {len(small)}")
for i in small: print("   ", desc(*i))
by = {}
for i in items: by[i[0]] = by.get(i[0], 0) + 1
print(f"(c) interactive: {len(items)} ({', '.join(f'{k} {v}' for k, v in sorted(by.items()))}); "
      f"unlabeled {len(unlabeled)}, small {len(small)}; ignored: "
      + (", ".join(f"{k} {v}" for k, v in skipped.items() if v) or "none") + f"; nodes scanned {len(nodes)}")
PY
