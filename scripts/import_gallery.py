#!/usr/bin/env python3
"""Import Roof-M-All gallery images from the current WordPress gallery page.

Targets only the real gallery anchors (`a.gallery-layout__image`) so logos,
thumbnails, and CTA/background art are not mixed into the site gallery.
"""
from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from html import unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

import requests
from PIL import Image, ImageOps

SOURCE_PAGE = "https://www.roof-m-all.com/gallery/"
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "gallery"
ORIGINALS = OUT / "originals"
OPTIMIZED = OUT / "optimized"
THUMBS = OUT / "thumbs"
RAW_MANIFEST = OUT / "manifest.raw.json"
MANIFEST = OUT / "manifest.json"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; Roof-M-All gallery import for site owner project)",
}

@dataclass
class GalleryItem:
    href: str
    thumb: str
    alt: str
    caption: str

class GalleryParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.items: list[GalleryItem] = []
        self._in_gallery_anchor = False
        self._current: dict[str, str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {k: v or "" for k, v in attrs}
        classes = attrs_dict.get("class", "")
        if tag == "a" and "gallery-layout__image" in classes and attrs_dict.get("href"):
            self._in_gallery_anchor = True
            self._current = {
                "href": unescape(attrs_dict.get("href", "")).strip(),
                "caption": unescape(attrs_dict.get("data-caption", "")).strip(),
                "thumb": "",
                "alt": "Roof-M-All roofing project",
            }
            return

        if self._in_gallery_anchor and self._current is not None:
            if tag == "div" and "gallery__background" in classes and attrs_dict.get("data-bkg"):
                self._current["thumb"] = unescape(attrs_dict.get("data-bkg", "")).strip()
            elif tag == "img" and attrs_dict.get("alt"):
                self._current["alt"] = unescape(attrs_dict.get("alt", "")).strip() or "Roof-M-All roofing project"

    def handle_endtag(self, tag: str) -> None:
        if tag == "a" and self._in_gallery_anchor and self._current is not None:
            href = self._current["href"]
            if re.search(r"\.(jpe?g|png|webp)(\?.*)?$", href, re.I):
                self.items.append(GalleryItem(**self._current))
            self._in_gallery_anchor = False
            self._current = None

def clean_alt(alt: str) -> str:
    alt = " ".join((alt or "").split())
    if not alt or alt.lower() in {"image", "photo", "big house", "roof"}:
        return "Roof-M-All roofing project"
    # Make generic WordPress alts a little more brand/context useful.
    generic_map = {
        "big house with roofing": "Roof-M-All residential roofing project",
        "big house and a car parked": "Residential roofing project by Roof-M-All",
        "big house with chimney": "Roof-M-All home roofing project with chimney",
        "roof of a house": "Roof-M-All residential roof installation",
        "big house": "Roof-M-All residential roofing project",
    }
    return generic_map.get(alt.lower(), alt)

def ext_for_content_type(content_type: str, fallback_url: str) -> str:
    content_type = (content_type or "").lower()
    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"
    if "jpeg" in content_type or "jpg" in content_type:
        return ".jpg"
    suffix = Path(urlparse(fallback_url).path).suffix.lower()
    return suffix if suffix in {".jpg", ".jpeg", ".png", ".webp"} else ".jpg"

def fetch_items() -> list[GalleryItem]:
    response = requests.get(SOURCE_PAGE, headers=HEADERS, timeout=30)
    response.raise_for_status()
    parser = GalleryParser()
    parser.feed(response.text)
    deduped: list[GalleryItem] = []
    seen: set[str] = set()
    for item in parser.items:
        key = re.sub(r"-\d+x\d+(?=\.(?:jpe?g|png|webp)$)", "", urlparse(item.href).path, flags=re.I)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(item)
    return deduped

def download(url: str, path: Path) -> None:
    if path.exists() and path.stat().st_size > 0:
        return
    response = requests.get(url, headers=HEADERS, timeout=60)
    response.raise_for_status()
    path.write_bytes(response.content)
    time.sleep(0.08)

def save_webp(source: Path, dest: Path, width: int, square: bool = False) -> tuple[int, int]:
    with Image.open(source) as img:
        img = ImageOps.exif_transpose(img).convert("RGB")
        if square:
            side = min(img.size)
            left = (img.width - side) // 2
            top = (img.height - side) // 2
            img = img.crop((left, top, left + side, top + side))
            img = img.resize((width, width), Image.Resampling.LANCZOS)
        elif img.width > width:
            height = round(img.height * (width / img.width))
            img = img.resize((width, height), Image.Resampling.LANCZOS)
        dest.parent.mkdir(parents=True, exist_ok=True)
        img.save(dest, "WEBP", quality=82, method=6)
        return img.size

def main() -> None:
    ORIGINALS.mkdir(parents=True, exist_ok=True)
    OPTIMIZED.mkdir(parents=True, exist_ok=True)
    THUMBS.mkdir(parents=True, exist_ok=True)

    items = fetch_items()
    if not items:
        raise SystemExit("No gallery items found")

    raw_manifest = []
    manifest = []
    for idx, item in enumerate(items, start=1):
        source_name = Path(urlparse(item.href).path).name
        ext = Path(source_name).suffix.lower() or ".jpg"
        local_id = f"gallery-{idx:03d}"
        original_path = ORIGINALS / f"{local_id}{ext}"
        download(item.href, original_path)
        web_path = OPTIMIZED / f"{local_id}.webp"
        thumb_path = THUMBS / f"{local_id}.webp"
        web_size = save_webp(original_path, web_path, 1600, square=False)
        thumb_size = save_webp(original_path, thumb_path, 620, square=True)
        alt = clean_alt(item.alt)
        raw_manifest.append({
            "id": local_id,
            "source_url": item.href,
            "source_thumb_url": item.thumb,
            "source_filename": source_name,
            "source_alt": item.alt,
            "source_caption": item.caption,
        })
        manifest.append({
            "id": local_id,
            "src": f"assets/gallery/optimized/{local_id}.webp",
            "thumb": f"assets/gallery/thumbs/{local_id}.webp",
            "original": f"assets/gallery/originals/{local_id}{ext}",
            "alt": alt,
            "caption": item.caption,
            "category": "roofing-project",
            "source_page": SOURCE_PAGE,
            "source_url": item.href,
            "width": web_size[0],
            "height": web_size[1],
            "thumb_width": thumb_size[0],
            "thumb_height": thumb_size[1],
        })

    RAW_MANIFEST.write_text(json.dumps(raw_manifest, indent=2) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {len(manifest)} gallery images")
    print(f"Manifest: {MANIFEST.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
