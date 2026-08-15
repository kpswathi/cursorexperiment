#!/usr/bin/env python3
"""Best-effort scrape of official blog/news index pages that lack a reliable RSS feed."""

from __future__ import annotations

from typing import Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

from ingest_common import generated_id, iso_date, load_sources, write_news


def ingest() -> int:
    written = 0
    headers = {"User-Agent": "ai-compass-ingest"}
    for source in load_sources().get("blogs", []):
        url = source["url"]
        needle = source.get("link_contains", "")
        try:
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            print(f"[blog] {source['id']}: {exc}")
            continue

        soup = BeautifulSoup(response.text, "lxml")
        seen: set[str] = set()
        count = 0
        for anchor in soup.find_all("a", href=True):
            href = urljoin(url, anchor["href"])
            if needle and needle not in href:
                continue
            if href in seen or href.rstrip("/") == url.rstrip("/"):
                continue
            title = " ".join(anchor.get_text(" ", strip=True).split())
            if len(title) < 12:
                continue
            seen.add(href)
            item: dict[str, Any] = {
                "id": generated_id("blog", href),
                "title": title[:180],
                "date": iso_date(None),
                "summary": f"Discovered on {source.get('source', source['id'])} ({url}).",
                "url": href,
                "source": source.get("source", source["id"]),
                "companyIds": [source["companyId"]] if source.get("companyId") else [],
                "modelIds": [],
                "sourceType": "blog",
                "generated": True,
            }
            if write_news(item):
                written += 1
            count += 1
            if count >= 8:
                break
        print(f"[blog] {source['id']}: {count} candidate links")
    return written
