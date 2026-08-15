#!/usr/bin/env python3
"""Referential integrity checks for the normalized JSON dataset."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def load_dir(path: Path, skip: set[str] | None = None) -> list:
    skip = skip or set()
    items = []
    for file in sorted(path.glob("*.json")):
        if file.name in skip:
            continue
        payload = json.loads(file.read_text(encoding="utf-8"))
        items.extend(payload if isinstance(payload, list) else [payload])
    generated = path / "generated"
    if generated.exists():
        for file in generated.glob("*.json"):
            payload = json.loads(file.read_text(encoding="utf-8"))
            items.extend(payload if isinstance(payload, list) else [payload])
    return items


def main() -> int:
    errors: list[str] = []
    companies = {c["id"]: c for c in load_dir(DATA / "companies")}
    models = {m["id"]: m for m in load_dir(DATA / "models")}
    founders = {f["id"]: f for f in load_dir(DATA / "founders")}
    countries = {c["id"]: c for c in load_dir(DATA / "countries", {"regions.json"})}

    for company in companies.values():
        if company["countryId"] not in countries:
            errors.append(f"company {company['id']} unknown country {company['countryId']}")
        for fid in company.get("founderIds", []):
            if fid not in founders:
                errors.append(f"company {company['id']} unknown founder {fid}")
        if company.get("ceoId") and company["ceoId"] not in founders:
            errors.append(f"company {company['id']} unknown ceo {company['ceoId']}")
        if company.get("latestModelId") and company["latestModelId"] not in models:
            errors.append(f"company {company['id']} unknown latestModel {company['latestModelId']}")

    for model in models.values():
        if model["companyId"] not in companies:
            errors.append(f"model {model['id']} unknown company {model['companyId']}")
        prev = model.get("previousModelId")
        if prev and prev not in models:
            errors.append(f"model {model['id']} unknown previous {prev}")

    for founder in founders.values():
        for cid in founder.get("companyIds", []):
            if cid not in companies:
                errors.append(f"founder {founder['id']} unknown company {cid}")

    if errors:
        print("Validation failed:")
        for error in errors:
            print(f"  - {error}")
        return 1
    print(
        f"OK — {len(companies)} companies, {len(models)} models, "
        f"{len(founders)} founders, {len(countries)} countries."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
