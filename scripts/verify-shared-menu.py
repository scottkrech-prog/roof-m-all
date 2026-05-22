#!/usr/bin/env python3
"""Verify Roof-M-All static HTML pages use the shared index-style menu/footer.

This intentionally checks behavior/structure instead of byte-for-byte equality,
because root pages and nested service-area pages need different relative href/src paths.
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class Parser(HTMLParser):
    pass


def section_for(html: str, tag: str) -> str:
    start = html.find(f"<{tag}")
    end = html.find(f"</{tag}>")
    if start == -1 or end == -1:
        return ""
    return html[start : end + len(f"</{tag}>")]


def desktop_nav_for(header: str) -> str:
    start = header.find('<nav class="links nav-menu"')
    end = header.find("</nav>", start)
    if start == -1 or end == -1:
        return ""
    return header[start : end + len("</nav>")]


def main() -> int:
    html_files = sorted(ROOT.glob("*.html")) + sorted((ROOT / "service-areas").glob("*.html"))
    failures: list[str] = []

    for path in html_files:
        rel = path.relative_to(ROOT)
        html = path.read_text(errors="ignore")

        try:
            Parser().feed(html)
        except Exception as exc:  # pragma: no cover - parser errors are human-facing
            failures.append(f"{rel}: HTML parser error: {exc}")
            continue

        header = section_for(html, "header")
        nav = desktop_nav_for(header)
        mobile = header[header.find("mobile-drawer-inner") :] if "mobile-drawer-inner" in header else ""

        required_menu_markers = [
            'class="site-header"',
            'class="links nav-menu"',
            "Calculator",
            "Services",
            "Roof Types",
            "Service Areas",
            "Why Roof-M-All",
            "Gallery",
            "FAQs",
            "data-mobile-menu",
        ]
        missing_menu = [marker for marker in required_menu_markers if marker not in header]
        if missing_menu:
            failures.append(f"{rel}: missing shared-menu markers: {', '.join(missing_menu)}")
        else:
            if nav.find("Calculator") == -1 or nav.find("Services") == -1 or nav.find("Calculator") > nav.find("Services"):
                failures.append(f"{rel}: desktop Calculator link must appear before Services")
            if "Calculator" not in mobile[:240]:
                failures.append(f"{rel}: mobile Calculator link must be first/near top of drawer")

        footer = section_for(html, "footer")
        required_footer_markers = [
            'class="footer"',
            'id="footer"',
            "footer-shell",
            "footer-main",
            "footer-license",
            "Services",
            "Locations",
            "Charlotte, NC",
            "Mint Hill, NC",
            "Roof-M-All Google Maps location",
            "Terms &amp; Conditions",
            "Privacy Policy",
            "Sitemap",
            "Accessibility Statement",
            "data-year",
        ]
        missing_footer = [marker for marker in required_footer_markers if marker not in footer]
        if missing_footer:
            failures.append(f"{rel}: missing shared-footer markers: {', '.join(missing_footer)}")
        if "getFullYear" not in html:
            failures.append(f"{rel}: missing footer year script")

    if failures:
        print("Shared menu/footer check FAILED:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"Shared menu/footer check OK: {len(html_files)} HTML files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
