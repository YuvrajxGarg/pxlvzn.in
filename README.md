# pxlvzn.in

The home of PXLVZN and of **PXL**, the app that installs, opens and updates every PXLVZN app (Dwn, Tag and whatever comes next). Same design language as the apps and as [dwn.pxlvzn.in](https://dwn.pxlvzn.in): near-black surfaces, hairline strokes, white primary actions and one lime accent.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

## Map

| Path | What |
|---|---|
| `index.html` | all content and copy |
| `src/style.css` | styles, shared with the Dwn site plus the PXL additions at the end |
| `src/main.js` | download buttons for the visitor's OS, latest PXL version, app list, screenshot switch, hero pixel wave |
| `public/shots/` | PXL screenshots (rendered from the app's `index.html?demo&still` UI preview) |

## The app list

The **Apps** section reads [`apps.json`](https://github.com/YuvrajxGarg/pxl/blob/main/apps.json) from the PXL repository, the same file the app reads. Adding an app there updates the site and every copy of PXL at once. The cards in `index.html` are only the fallback for when GitHub can't be reached.
