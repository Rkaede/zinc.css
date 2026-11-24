#!/usr/bin/env python3
"""Write stdin HTML to a timestamped file in <temp>/html-zinc/ and optionally open it."""

from __future__ import annotations

import argparse
import os
import re
import sys
import tempfile
import webbrowser
from datetime import datetime
from pathlib import Path

ZINC_LINK = re.compile(r"""<link\b[^>]*\bhref=["'][^"']*zinc[^"']*\.css["'][^>]*>""", re.IGNORECASE)


def temp_dir() -> Path:
    for key in ("TMPDIR", "TEMP", "TMP"):
        value = os.environ.get(key)
        if value:
            return Path(value).expanduser().resolve()
    return Path(tempfile.gettempdir()).resolve()


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9._-]+", "-", value.strip().lower()).strip("-._")
    return slug or "html-report"


def inline_css(html: str, css: str) -> str:
    """Swap the Zinc <link> for an inline <style>, or add one before </head>."""
    tag = f"<style>\n{css}</style>"
    html, count = ZINC_LINK.subn(lambda _: tag, html, count=1)
    if count:
        return html
    index = html.lower().find("</head>")
    return html[:index] + tag + "\n" + html[index:] if index != -1 else tag + "\n" + html


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Write a complete HTML document from stdin to a temp file."
    )
    parser.add_argument("--slug", required=True, help="Short name used in the output filename.")
    parser.add_argument("--no-open", action="store_true", help="Write the file without opening it.")
    parser.add_argument(
        "--questions",
        action="store_true",
        help='Inline zinc-questions.js (copy answers, drafts) for a <form data-form="questions"> page.',
    )
    parser.add_argument(
        "--zinc-css",
        type=Path,
        metavar="PATH",
        help="Inline this zinc.css in place of the CDN <link>, e.g. a local build with unreleased styles.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    html = sys.stdin.read()
    if not html.strip():
        print("error: expected HTML on stdin", file=sys.stderr)
        return 1

    if args.zinc_css:
        try:
            css = args.zinc_css.expanduser().read_text(encoding="utf-8")
        except OSError as error:
            print(f"error: cannot read --zinc-css: {error}", file=sys.stderr)
            return 1
        html = inline_css(html, css)

    if args.questions:
        script = (Path(__file__).resolve().parent / "zinc-questions.js").read_text(encoding="utf-8")
        tag = f"<script>\n{script}</script>\n"
        index = html.lower().rfind("</body>")
        html = html[:index] + tag + html[index:] if index != -1 else html + tag

    directory = temp_dir() / "html-zinc"
    directory.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    path = directory / f"{slugify(args.slug)}-{timestamp}.html"
    path.write_text(html, encoding="utf-8")

    if not args.no_open:
        opened = webbrowser.open(path.as_uri())
        if not opened:
            print(f"warning: could not open browser for {path}", file=sys.stderr)

    print(path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
