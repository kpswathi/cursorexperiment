#!/usr/bin/env python3
"""Refresh generated news JSON from public RSS, blogs, GitHub and Hugging Face.

Designed to run locally or on a GitHub Actions schedule. Failures in a single
source never abort the rest of the pipeline. The React app only consumes JSON.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import ingest_blogs
import ingest_github
import ingest_huggingface
import ingest_rss
from generate_index import main as generate_index


def main() -> None:
    written = 0
    for name, fn in (
        ("rss", ingest_rss.ingest),
        ("blogs", ingest_blogs.ingest),
        ("github", ingest_github.ingest),
        ("huggingface", ingest_huggingface.ingest),
    ):
        try:
            count = fn()
            written += count
            print(f"[update] {name}: wrote {count} new items")
        except Exception as exc:  # noqa: BLE001 - keep the pipeline moving
            print(f"[update] {name} failed: {exc}")
    generate_index()
    print(f"[update] done, {written} new generated news files")


if __name__ == "__main__":
    main()
