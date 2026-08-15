# AI Compass

An interactive intelligence platform for the global frontier-AI ecosystem — closer to a Bloomberg terminal or CB Insights than a company directory.

The first release maps labs, foundation models, founders, funding, research groups and launches across the United States, Europe, China and India (with the schema already open for the Middle East, Japan, Korea, Southeast Asia and Latin America).

Everything runs in the browser from local JSON. There is no backend, database, Firebase, Supabase, or paid model API.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- MapLibre GL JS
- React Router
- Fuse.js
- Framer Motion
- Python ingest scripts (RSS, official blogs, GitHub Releases, Hugging Face)

## Quick start

```bash
npm install
python3 scripts/seed.py
python3 scripts/generate_index.py
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## How the data layer works

Normalized JSON lives at the repo root, not in one blob:

```
data/
  companies/     one file per lab
  models/        one file per foundation model
  founders/      one file per person
  countries/     ISO countries + regions.json
  news/          editorial items + news/generated/
  funding/       rounds
  benchmarks/    definitions + scores.json
  research/      areas and labs
  index.json     catalog the UI loads first
```

IDs are the joins. A company points at `founderIds` and `latestModelId`. A model points at `companyId` and `previousModelId`. Funding and news point at companies (and optionally models). Adding a 17th company does not require a React change:

1. Add `data/companies/<id>.json` (and any new models/founders/funding/news).
2. Run `python3 scripts/generate_index.py`.
3. The map, search, filters and compare views pick it up.

`scripts/validate.py` checks that those IDs actually exist.

Figures in the seed set are compiled from public reporting and labeled with as-of dates where we have them. They are for exploration, not an official cap table.

## Automatic updates

`scripts/update.py` reads `scripts/sources.yaml` and writes **new** files under `data/news/generated/` from:

- official RSS feeds
- official blog index pages (when RSS is missing)
- GitHub Releases
- Hugging Face model listings

It never calls OpenAI, Gemini, or other paid APIs. The frontend only fetches JSON.

GitHub Actions workflow: `.github/workflows/update-data.yml` (daily + `workflow_dispatch`). Enable it when you want scheduled refreshes.

```bash
pip install -r scripts/requirements.txt
python3 scripts/update.py
```

## UI

- Interactive world map, country choropleth by AI activity, clustered company markers
- Region presets: North America, Europe, China, India
- Company / model / founder dossiers, timelines, compare (up to four labs)
- Global search (`⌘K`) across companies, models, founders, countries, products and news
- Filters for region, country, company, model family, capabilities, open/closed, consumer/enterprise

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run data:seed` | Rewrite the editorial seed JSON + index |
| `npm run data:index` | Rebuild `data/index.json` only |
| `npm run data:update` | Ingest public feeds, then rebuild the index |
| `npm run data:validate` | Referential integrity |
