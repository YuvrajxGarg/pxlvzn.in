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

## App sites (stm, lut, hop)

`apps/` holds the websites for the newer apps, one static site per subdomain, in the same design as [dwn.pxlvzn.in](https://dwn.pxlvzn.in):

| Folder | Site | Vercel project |
|---|---|---|
| `apps/stm/` | [stm.pxlvzn.in](https://stm.pxlvzn.in) | `stm-site` |
| `apps/lut/` | [lut.pxlvzn.in](https://lut.pxlvzn.in) | `lut-site` |
| `apps/hop/` | [hop.pxlvzn.in](https://hop.pxlvzn.in) | `hop-site` |

Each folder is a Vercel project's root directory and deploys as plain files (no build step) on every push to `main`. DNS is a CNAME per subdomain in the Hostinger zone for pxlvzn.in, the same as `dwn`.

```bash
python3 apps/build.py               # writes apps/<id>/ from the copy in build.py and apps/_shared/
node apps/render_images.cjs         # re-renders icon.png, apple-touch-icon.png and og.png (needs Playwright)
```

Edit the copy in `apps/build.py` and the shared look in `apps/_shared/`, then run the build and commit the output. Download buttons read each app's latest GitHub release (YuvrajxGarg/stm, /lut, /hop); until the first release exists they say "Coming soon".
