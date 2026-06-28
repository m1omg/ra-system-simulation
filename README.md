# The Ra Planetary System — Interactive 3D Simulation

A self-contained, browser-based 3D orrery of the **Ra (10 Tauri)** system from the
*Satis* worldbuilding document — the star, its eight planets, their moons, and the
brown-dwarf companion **Horus** with its own four worlds.

## How to run

**Just double-click `index.html`** (or open it in any modern browser — Chrome,
Firefox, Edge). No server, no internet, no installation required. Everything runs
locally.

### Two editions

- **`index.html`** — the **summary** edition (short, readable write-ups).
- **`index-verbatim.html`** — the **author's-text** edition: descriptions are your
  *exact* words from the source document, with no paraphrasing.

Either way you can flip between the two with the **📖** button in the bottom bar, and
the two pages link to each other from the top-left title. (Worlds the document hasn't
described yet — Shu, Horus, Khonsu, Nut, Osiris — show a short note in author's-text mode.)

## What's inside

- **Every body from the document**, placed on Keplerian elliptical orbits with
  physically-scaled *relative* orbital speeds (inner worlds race, outer worlds crawl).
- **Procedurally textured worlds** generated in the browser: banded gas giants, the
  blue-marble ocean of Uat-Ur, Satis's violet-forested continents, the rusty deserts
  of Set, molten Sekhmet, the brown-dwarf glow of Horus, and more.
- **Click any world** (or use the list on the left, or click its label) to fly the
  camera to it and open a data panel with its real figures, a description, and the
  AI-rendered concept art from the document.

## Controls

| Action | How |
| --- | --- |
| Orbit camera | Left-drag |
| Zoom | Scroll wheel |
| Pan | Right-drag |
| Focus a world | Click it / pick from the list / click its label |
| Play / pause | Bottom bar |
| Time speed | "Speed" slider (0.05× – 40×, logarithmic) |
| Exaggerate sizes | "Size" slider |
| Real ↔ Compressed orbits | "Scale" button, bottom bar |
| Author's text ↔ Summary | "📖" button, bottom bar |
| Toggle orbits / labels | Bottom bar |
| Reset view | Bottom bar |
| Help & glossary | **?** button, top-right |
| Deep-link a world | open `index.html#satis` (any body key) |

## A note on scale

The system spans from a hot Neptune at **0.05 AU** to a brown dwarf at **46 AU** — a
~950× range — and body diameters range from ~2,500 km moons to a 126,000 km brown dwarf.
Two view modes (toggle in the bottom bar):

- **Real scale** (default) — orbits sit at their true distance in AU, so Amunet hugs the
  star and Horus is far out at 46 AU. Zoom out to find Shu and Horus.
- **Compressed** — a non-linear law squeezes the range so the whole system fits on screen
  at once.

Body sizes are exaggerated in both modes (true sizes would be invisible dots). The *real*
figures are always shown in each world's data panel, and relative orbital *speeds* remain
physically correct (Kepler's third law).

## Files

```
index.html                       — summary edition (page shell + UI)
index-verbatim.html              — author's-text edition (same app, verbatim default)
assets/app.js                    — 3D engine (Three.js scene, textures, orbits, interaction)
assets/data.js                   — body data, stats, summary descriptions
assets/descriptions-verbatim.js  — the author's word-for-word descriptions
assets/img/                      — concept art extracted from the Satis document
assets/lib/                      — Three.js r132 + OrbitControls (bundled for offline use)
```

To update a world's numbers or summary text, edit `assets/data.js`; to update the
verbatim text, edit `assets/descriptions-verbatim.js`.

---
*Planetary classification follows the ArcBuilder PCL. Built from “Satis v10”.*
