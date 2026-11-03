# Pinball Maker

**[日本語の README](README.md)**

Build **your own pinball game** in the browser and export it as **a single HTML file**.
Exported games run on phones and desktops — just open the file. No install, no server.

Copyright © 2026 FUJIYAMA2236 — [MIT License](LICENSE)

## Getting started

1. Open `index.html` (Chrome / Edge / Safari / Firefox)
2. Pick a **template**
3. Drag **parts** from the left panel onto the table; move, reshape or delete them
4. Try it with **▶ Test play**
5. **Export HTML** when you're done

Your work is autosaved in the browser. Use **Save** to keep a `.pinball.json` file you can take elsewhere.

## Languages

- **Editor**: switch with the "English / 日本語" button at the top right. The first time, it follows your browser language; your choice is remembered.
- **Exported games**: choose **Auto (the player's browser language)**, Japanese or English under *Game language* in the table settings. In test play, "Auto" uses the editor's current language.

## Samples

| File | What it is |
|---|---|
| `samples/galaxy-drive.html` | A finished sample game — open it and play |
| `samples/galaxy-drive.pinball.json` | Its project file — open it in the editor to remix |
| `samples/standard.html` / `.pinball.json` | The "Standard" template, exported as-is |

## Editor controls

| Action | How |
|---|---|
| Place a part | Drag it from the left panel (click to add it in the middle) |
| Move | Drag the part (hold `Alt` to move without snapping) |
| Reshape / resize / rotate | Drag the white **●■◆** handles of the selected part |
| Fine-tune | Right panel (color, points, strength…). With nothing selected: table settings |
| Symmetry | `M` or "Mirror copy" — the pink dotted line is the mirror axis |
| Move / reshape straight | Hold `Shift` while dragging (moving or handles; flipper and hole directions snap to 45°) |
| Box select | Drag on empty space; `Shift` (or `Ctrl`)+click to add/remove |
| Pick an overlapped part | Click the same spot again |
| Menu | Right-click (long-press on touch) |
| Zoom / pan | Wheel or pinch; `Space`+drag or right-drag |
| Delete / duplicate | `Delete`, `Ctrl+D` |
| Undo / redo | `Ctrl+Z`, `Ctrl+Y` |
| Copy / paste | `Ctrl+C`, `Ctrl+V` |
| Test play | `Ctrl+Enter` (switch between phone and desktop view) |

## Parts

| Part | What it does |
|---|---|
| Wall / Curved wall | Walls the ball bounces off. Drag the ends (and the ◆ for curves) |
| Post | A small round rubber post |
| One-way gate | Lets the ball through in the arrow direction only |
| Bumper | Kicks the ball away hard |
| Slingshot | Triangular kicker; the white rubber side kicks |
| Target | Lights up when hit; light a whole group for a bonus |
| Drop target | Drops when hit; knock down a group for a bonus, then it resets |
| Rollover | Lights up when rolled over; light a group to raise the **multiplier** (up to ×5) |
| Kickout hole | Catches the ball and shoots it out along the arrow |
| Flipper | Player-controlled paddle; choose Left or Right control (upper flippers are fine too) |
| Plunger | Where the ball comes out (one per table) |
| Text / Decoration light | Visual only (no collision) |

**Background image**: choose one in the table settings or drop an image file onto the window. By default it is shown only *inside the frame* (the area enclosed by walls, curves and flippers is detected automatically) and anything outside is trimmed. Use *Adjust by dragging on the table* to move/zoom it, and *Image opacity* to make parts stand out.

**Nudge & TILT**: players can nudge the table (flick up, shake the phone, or `X` / `.` / `↑`). Nudge too often and you get WARNING → DANGER → **TILT**: flippers stop, no points, and the ball is lost.

## Playing an exported game

| | Phone | Desktop |
|---|---|---|
| Left flipper | Tap the left half | `Z` / `←` / left `Shift` |
| Right flipper | Tap the right half | `/` / `→` / right `Shift` |
| Launch | Hold, then release (longer = stronger) | Hold and release `Space` / `↓` |
| Nudge | Flick up / shake the phone | `X` (up-left) / `.` (up-right) / `↑` (up) |
| Pause | ❚❚ at the top right | `P` / `Esc` |

On iPhone, allow "Motion & Orientation access" at the start to nudge by shaking (flicking works either way).

The desktop keys above are the defaults. In the editor, *Keyboard controls (PC)* in the table settings lets you assign up to four keys per action (click "+ Key", then press the key). Pause is always `P` / `Esc`.

## Sharing your game

- Put the exported `.html` on the web (GitHub Pages, Netlify Drop, etc.) and anyone can play from the URL
- You can also send the file to a phone and open it in the browser
- Exported HTML can be opened again in the editor with "Open" for further editing

## License & rights

- **Copyright**: © 2026 FUJIYAMA2236
- **License**: [MIT](LICENSE) — use, modify, redistribute and use commercially, as long as the copyright notice and license text are kept
- **Your games**: tables you make (layout, text, images) are yours. You may publish, share or sell exported games. The engine inside the HTML is MIT-licensed and its notice is added automatically — please keep it
- **Background images**: only use images you have the right to use
- **Third-party code/assets**: none bundled. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)
  - Text uses fonts already installed on the viewer's device (referenced by name only; no font files are distributed)
  - Sound effects are synthesized at run time with the Web Audio API
  - The scripts in `tools/` use only Node.js built-in modules (they are not needed to run the tool)

## Files

```
index.html              The editor (open this)
css/editor.css          Editor styles
js/engine.js            Game engine (physics, rendering, touch input, sound)
js/editor.js            Editor (parts, handles, inspector, export)
js/templates.js         Templates and sample data
samples/                Sample games and projects
tools/build-samples.js  Rebuilds samples/ (node tools/build-samples.js)
tools/build-single.js   Bundles the editor into one HTML file (node tools/build-single.js → dist/pinball-maker.html)
LICENSE                 MIT License
THIRD-PARTY-NOTICES.md  Notes on third-party code and assets (none bundled)
```
