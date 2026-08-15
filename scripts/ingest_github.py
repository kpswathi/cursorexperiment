#!/usr/bin/env python3
"""Read GitHub Releases for configured public repositories."""

from __future__ import annotations

import os
from typing import Any

import requests

from ingest_common import generated_id, iso_date, load_sources, write_news

API = "https://api.github.com"


def ingest() -> int:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "ai-compass-ingest"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    written = 0
    for source in load_sources().get("github", []):
        repo = source["repo"]
        url = f"{API}/repos/{repo}/releases"
        try:
            response = requests.get(url, headers=headers, timeout=30)
            if response.status_code == 404:
                print(f"[github] {repo}: no releases")
                continue
            response.raise_for_status()
            releases = response.json()
        except requests.RequestException as exc:
            print(f"[github] {repo}: {exc}")
            continue

        for release in releases[:8]:
            html_url = release.get("html_url") or ""
            title = release.get("name") or release.get("tag_name") or "Release"
            if not html_url:
                continue
            item: dict[str, Any] = {
                "id": generated_id("gh", html_url),
                "title": f"{repo} {title}",
                "date": iso_date(release.get("published_at") or release.get("created_at")),
                "summary": (release.get("body") or title).strip()[:400],
                "url": html_url,
                "source": f"GitHub/{repo}",
                "companyIds": [source["companyId"]] if source.get("companyId") else [],
                "modelIds": [],
                "sourceType": "github",
                "generated": True,
            }
            if write_news(item):
                written += 1
        print(f"[github] {repo}: {len(releases) if isinstance(releases, list) else 0} releases")
    return written
