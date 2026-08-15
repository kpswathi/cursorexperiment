#!/usr/bin/env python3
"""Pull official RSS feeds into data/news/generated/."""

from __future__ import annotations

from typing import Any

import feedparser

from ingest_common import generated_id, iso_date, load_sources, write_news


def ingest() -> int:
    sources = load_sources().get("rss", [])
    written = 0
    for source in sources:
        parsed = feedparser.parse(source["url"])
        if getattr(parsed, "bozo", False) and not parsed.entries:
            print(f"[rss] skip {source['id']}: {getattr(parsed, 'bozo_exception', 'empty')}")
            continue
        for entry in parsed.entries[:12]:
            url = entry.get("link") or ""
            title = (entry.get("title") or "").strip()
            if not url or not title:
                continue
            summary = (entry.get("summary") or entry.get("description") or title)[:400]
            item: dict[str, Any] = {
                "id": generated_id("rss", url),
                "title": title,
                "date": iso_date(entry.get("published") or entry.get("updated")),
                "summary": summary,
                "url": url,
                "source": source.get("source", source["id"]),
                "companyIds": [source["companyId"]] if source.get("companyId") else [],
                "modelIds": [],
                "sourceType": "rss",
                "generated": True,
            }
            if write_news(item):
                written += 1
        print(f"[rss] {source['id']}: {len(parsed.entries)} entries")
    return written
