#!/usr/bin/env python3
"""Serve the static AI Compass app. No npm/Node required."""

from __future__ import annotations

import argparse
import http.server
import os
import socketserver
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / "app"


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve AI Compass from ./app")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()
    if not (APP / "index.html").exists():
        raise SystemExit("app/index.html is missing. Run: python3 scripts/export_app.py")
    os.chdir(APP)
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer((args.host, args.port), handler) as httpd:
        print(f"AI Compass → http://{args.host}:{args.port}")
        print("Press Ctrl+C to stop.")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
