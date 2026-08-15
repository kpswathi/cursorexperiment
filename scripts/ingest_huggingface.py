#!/usr/bin/env python3
"""Read public Hugging Face model listings for configured authors."""

from __future__ import annotations

from typing import Any

import requests

from ingest_common import generated_id, iso_date, load_sources, write_news

API = "https://huggingface.co/api/models"


def ingest() -> int:
    written = 0
    for source in load_sources().get("huggingface", []):
        author = source["author"]
        try:
            response = requests.get(
                API,
                params={"author": author, "sort": "createdAt", "direction": -1, "limit": 8},
                timeout=30,
                headers={"User-Agent": "ai-compass-ingest"},
            )
            response.raise_for_status()
            models = response.json()
        except requests.RequestException as exc:
            print(f"[huggingface] {author}: {exc}")
            continue

        for model in models:
            model_id = model.get("id") or model.get("modelId")
            if not model_id:
                continue
            url = f"https://huggingface.co/{model_id}"
            item: dict[str, Any] = {
                "id": generated_id("hf", url),
                "title": f"Hugging Face model: {model_id}",
                "date": iso_date(model.get("createdAt") or model.get("lastModified")),
                "summary": f"Public model card for {model_id} ({model.get('pipeline_tag') or 'model'}).",
                "url": url,
                "source": f"Hugging Face/{author}",
                "companyIds": [source["companyId"]] if source.get("companyId") else [],
                "modelIds": [],
                "sourceType": "huggingface",
                "generated": True,
            }
            if write_news(item):
                written += 1
        print(f"[huggingface] {author}: {len(models) if isinstance(models, list) else 0} models")
    return written
