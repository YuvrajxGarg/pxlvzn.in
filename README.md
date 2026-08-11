# PXLVZN — a vision for pixels

The home of everything PXLVZN ships: tools, toys, games, experiments.
Currently in larval stage. It bites anyway.

## Stack

- [Vite](https://vitejs.dev) — dev server + build
- [three.js](https://threejs.org) — the hero voxel wordmark (one InstancedMesh, one draw call)
- Vanilla JS + Canvas 2D for everything else. No UI framework, no template.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Map

| Path | What |
|---|---|
| `index.html` | all content + copy |
| `src/styles/main.css` | design system — the pixel (8px) is the unit |
| `src/modules/hero3d.js` | 3D voxel wordmark, cursor repulsion |
| `src/modules/boot.js` | fake BIOS boot (once per session, any key skips) |
| `src/modules/lab.js` | live experiments: Game of Life, pixel rain, dither field |
| `src/modules/thumbs.js` | procedural thumbnails per tool — no stock art, ever |
| `src/modules/footer.js` | giant pixel wordmark, ripples under the cursor |
| `src/modules/crt.js` | CRT mode — nav button or ↑↑↓↓←→←→BA |
| `src/modules/*` | cursor, scramble text, reveals, tilt/magnetic, statusbar, marquee |

## Adding a tool to the registry

1. Copy a `<article class="pkg">` block in `index.html`.
2. Give its `<canvas class="pkg__thumb">` a new `data-gen` name.
3. Add a matching generator in `src/modules/thumbs.js`.
4. Bump `#pkg-count`.

## House rules

- Every pixel on purpose.
- 60fps or we riot (all canvases pause off-screen via IntersectionObserver).
- `prefers-reduced-motion` is respected.
