#!/usr/bin/env python3
"""Build data/index.json from the normalized JSON tree.

The frontend reads this catalog first. Adding a company is: drop a JSON file
in data/companies/, then re-run this script. No React changes required.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_dir(path: Path, skip_names: set[str] | None = None) -> list:
    skip_names = skip_names or set()
    items: list = []
    if not path.exists():
        return items
    files = list(path.glob("*.json"))
    generated = path / "generated"
    if generated.exists():
        files.extend(generated.glob("*.json"))
    for file in sorted(files):
        if file.name in skip_names:
            continue
        payload = load(file)
        if isinstance(payload, list):
            items.extend(payload)
        else:
            items.append(payload)
    return items


def activity_score(company_count: int, model_count: int, funding: float) -> int:
    fund_pts = 0
    if funding > 0:
        fund_pts = min(40, int(funding ** 0.25))
    return company_count * 12 + model_count * 3 + fund_pts


def main() -> None:
    companies = load_dir(DATA / "companies")
    models = load_dir(DATA / "models")
    founders = load_dir(DATA / "founders")
    countries = load_dir(DATA / "countries", skip_names={"regions.json"})
    regions = load(DATA / "countries" / "regions.json")
    news = load_dir(DATA / "news")
    funding = load_dir(DATA / "funding")
    benchmarks = load_dir(DATA / "benchmarks", skip_names={"scores.json"})
    scores = load(DATA / "benchmarks" / "scores.json")
    research_files = load_dir(DATA / "research")
    research_areas = [item for item in research_files if "companyId" not in item]
    research_labs = [item for item in research_files if "companyId" in item]

    models_by_company: dict[str, int] = {}
    for model in models:
        models_by_company[model["companyId"]] = models_by_company.get(model["companyId"], 0) + 1

    funding_by_company: dict[str, float] = {}
    for round_ in funding:
        if round_.get("amountUsd"):
            funding_by_company[round_["companyId"]] = funding_by_company.get(round_["companyId"], 0) + round_["amountUsd"]

    country_companies: dict[str, int] = {}
    country_models: dict[str, int] = {}
    country_funding: dict[str, float] = {}
    for company in companies:
        cid = company["countryId"]
        country_companies[cid] = country_companies.get(cid, 0) + 1
        country_models[cid] = country_models.get(cid, 0) + models_by_company.get(company["id"], 0)
        country_funding[cid] = country_funding.get(cid, 0) + (company.get("totalFundingUsd") or 0)

    for country in countries:
        cid = country["id"]
        country["companyCount"] = country_companies.get(cid, 0)
        country["modelCount"] = country_models.get(cid, 0)
        country["activityScore"] = activity_score(
            country["companyCount"],
            country["modelCount"],
            country_funding.get(cid, 0),
        )
        write_path = DATA / "countries" / f"{cid.lower()}.json"
        write_path.write_text(json.dumps(country, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    index = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "companies": [
            {
                "id": c["id"],
                "name": c["name"],
                "slug": c["slug"],
                "logo": c["logo"],
                "countryId": c["countryId"],
                "regionId": c["regionId"],
                "coordinates": c["coordinates"],
                "tags": c.get("tags", []),
                "latestModelId": c.get("latestModelId"),
                "color": c["color"],
                "openSource": c["openSource"],
                "closedSource": c["closedSource"],
                "consumer": c["consumer"],
                "enterprise": c["enterprise"],
                "valuationUsd": c.get("valuationUsd"),
                "totalFundingUsd": c.get("totalFundingUsd"),
                "employees": c.get("employees"),
                "founded": c["founded"],
                "status": c["status"],
            }
            for c in sorted(companies, key=lambda x: x["name"])
        ],
        "models": [
            {
                "id": m["id"],
                "name": m["name"],
                "slug": m["slug"],
                "companyId": m["companyId"],
                "family": m["family"],
                "releaseDate": m["releaseDate"],
                "openClosed": m["openClosed"],
                "capabilities": m["capabilities"],
                "apiAvailable": m["apiAvailable"],
            }
            for m in sorted(models, key=lambda x: x["releaseDate"], reverse=True)
        ],
        "founders": [
            {
                "id": f["id"],
                "name": f["name"],
                "slug": f["slug"],
                "photo": f["photo"],
                "companyIds": f["companyIds"],
                "title": f.get("title"),
            }
            for f in sorted(founders, key=lambda x: x["name"])
        ],
        "countries": countries,
        "regions": regions,
        "news": [
            {
                "id": n["id"],
                "title": n["title"],
                "date": n["date"],
                "source": n["source"],
                "companyIds": n.get("companyIds", []),
                "generated": n.get("generated", False),
            }
            for n in sorted(news, key=lambda x: x["date"], reverse=True)
        ],
        "funding": sorted(funding, key=lambda x: x["date"], reverse=True),
        "benchmarks": benchmarks,
        "benchmarkScores": scores,
        "researchAreas": research_areas,
        "researchLabs": research_labs,
    }

    out = DATA / "index.json"
    out.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(
        f"Wrote {out.relative_to(ROOT)} "
        f"({len(companies)} companies, {len(models)} models, {len(news)} news)."
    )


if __name__ == "__main__":
    main()
