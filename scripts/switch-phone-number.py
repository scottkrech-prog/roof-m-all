#!/usr/bin/env python3
"""Rotate Roof-M-All website phone numbers between Number A and Number B.

Default mode is dry-run. Use --apply to write changes.

Examples:
  python3 scripts/switch-phone-number.py --to B
  python3 scripts/switch-phone-number.py --to B --apply
  python3 scripts/switch-phone-number.py --to A --apply
"""
from __future__ import annotations

import argparse
from pathlib import Path

NUMBER_A_DISPLAY = "704-631-9936"
NUMBER_A_TEL = "7046319936"
NUMBER_B_DISPLAY = "704-520-9299"
NUMBER_B_TEL = "7045209299"

ROOT = Path(__file__).resolve().parents[1]
TARGET_SUFFIXES = {".html", ".txt", ".xml", ".md"}
SKIP_DIRS = {".git", "node_modules", "dist", ".cache"}


def iter_target_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if path.is_dir():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        if path.suffix.lower() not in TARGET_SUFFIXES:
            continue
        # Keep the rotation instructions stable because they intentionally mention both numbers.
        if path.relative_to(ROOT).as_posix() == "docs/phone-number-rotation.md":
            continue
        files.append(path)
    return files


def replacement_pairs(target: str) -> list[tuple[str, str]]:
    if target == "A":
        return [(NUMBER_B_DISPLAY, NUMBER_A_DISPLAY), (NUMBER_B_TEL, NUMBER_A_TEL)]
    if target == "B":
        return [(NUMBER_A_DISPLAY, NUMBER_B_DISPLAY), (NUMBER_A_TEL, NUMBER_B_TEL)]
    raise ValueError(target)


def main() -> int:
    parser = argparse.ArgumentParser(description="Rotate RMA site phone numbers between Number A and Number B.")
    parser.add_argument("--to", choices=["A", "B"], required=True, help="Target active phone number.")
    parser.add_argument("--apply", action="store_true", help="Write changes. Without this, prints a dry-run.")
    args = parser.parse_args()

    pairs = replacement_pairs(args.to)
    touched: list[tuple[Path, int]] = []

    for path in iter_target_files():
        text = path.read_text(errors="ignore")
        new_text = text
        replacements = 0
        for old, new in pairs:
            count = new_text.count(old)
            if count:
                replacements += count
                new_text = new_text.replace(old, new)
        if replacements:
            touched.append((path, replacements))
            if args.apply:
                path.write_text(new_text)

    mode = "APPLIED" if args.apply else "DRY RUN"
    target_display = NUMBER_A_DISPLAY if args.to == "A" else NUMBER_B_DISPLAY
    print(f"{mode}: target Number {args.to} ({target_display})")
    print(f"files with replacements: {len(touched)}")
    for path, count in touched:
        print(f"{path.relative_to(ROOT)}: {count}")
    if not args.apply:
        print("No files changed. Re-run with --apply to switch.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
