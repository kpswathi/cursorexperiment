# AI Compass

Interactive intelligence map of frontier AI labs, models, founders, funding and launches.

**You do not need npm, Node, or any installer.** The runnable product is a static website in `app/`.

## GitHub Pages

After Pages is enabled (Settings → Pages → Source: **GitHub Actions**), the live site is:

**https://kpswathi.github.io/cursorexperiment/**

The workflow `.github/workflows/github-pages.yml` publishes the `app/` folder. No npm build.

## Open the app locally

From this folder, in a terminal:

```bash
python3 scripts/export_app.py
python3 serve.py
```

Then open **http://127.0.0.1:8000** in your browser.

`export_app.py` only needs to be run when JSON data changes. After that, `python3 serve.py` is enough.

If port 8000 is busy: `python3 serve.py --port 8080`

## What you get

- World map of labs (country shading + clustered markers)
- Company, model and founder dossiers
- Search (`/` or the search bar)
- Filters and compare (up to four labs)
- Timelines and news

Data lives in `data/` as normalized JSON. The browser reads `app/data.js`, which Python generates from those files.

Map tiles and fonts load from the public internet (OpenFreeMap + Google Fonts). Everything else is local.

## Optional: React/Vite source

`src/` is the same product as a React app for contributors who already have Node. It is **not required** to use AI Compass.
