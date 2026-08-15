#!/usr/bin/env python3
"""Export the normalized JSON tree into a browser bundle under app/.

No Node/npm required. The UI reads window.AI_COMPASS from app/data.js.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
PUBLIC = ROOT / "public"
APP = ROOT / "app"


def load_dir(path: Path, skip: set[str] | None = None) -> list:
    skip = skip or set()
    items: list = []
    files = list(path.glob("*.json"))
    generated = path / "generated"
    if generated.exists():
        files.extend(generated.glob("*.json"))
    for file in sorted(files):
        if file.name in skip:
            continue
        payload = json.loads(file.read_text(encoding="utf-8"))
        items.extend(payload if isinstance(payload, list) else [payload])
    return items


def rel(url: str) -> str:
    if url.startswith("/"):
        return url[1:]
    return url


def rewrite_entity(item: dict) -> dict:
    out = json.loads(json.dumps(item))
    for key in ("logo", "photo"):
        if key in out and isinstance(out[key], str):
            out[key] = rel(out[key])
    return out


def main() -> None:
    from generate_index import main as generate_index

    generate_index()

    companies = [rewrite_entity(c) for c in load_dir(DATA / "companies")]
    models = load_dir(DATA / "models")
    founders = [rewrite_entity(f) for f in load_dir(DATA / "founders")]
    news = load_dir(DATA / "news")
    index = json.loads((DATA / "index.json").read_text(encoding="utf-8"))
    for row in index.get("companies", []):
        if "logo" in row:
            row["logo"] = rel(row["logo"])
    for row in index.get("founders", []):
        if "photo" in row:
            row["photo"] = rel(row["photo"])

    geo_path = PUBLIC / "geo" / "countries.geojson"
    geo = json.loads(geo_path.read_text(encoding="utf-8")) if geo_path.exists() else None

    APP.mkdir(parents=True, exist_ok=True)
    for folder in ("logos", "avatars", "geo"):
        src = PUBLIC / folder
        dest = APP / folder
        if dest.exists():
            shutil.rmtree(dest)
        if src.exists():
            shutil.copytree(src, dest)

    favicon = PUBLIC / "favicon.svg"
    if favicon.exists():
        shutil.copy2(favicon, APP / "favicon.svg")

    bundle = {
        "index": index,
        "companies": companies,
        "models": models,
        "founders": founders,
        "news": news,
        "geo": geo,
    }
    payload = json.dumps(bundle, ensure_ascii=False)
    (APP / "data.js").write_text(
        "window.AI_COMPASS = " + payload + ";\n",
        encoding="utf-8",
    )
    print(f"Wrote {APP / 'data.js'} ({len(payload) // 1024} KB) and copied static assets.")


if __name__ == "__main__":
    import sys

    sys.path.insert(0, str(Path(__file__).resolve().parent))
    main()
