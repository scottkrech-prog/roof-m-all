# Roof-M-All Phone Number Rotation

This repo is prepared to rotate the public website phone number when Scott says to switch.

## Current active number

- **Number A:** `704-631-9936`
- Tel format: `7046319936`
- Status: **active / public-facing**

## Alternate number ready for later

- **Number B:** `704-520-9299`
- Tel format: `7045209299`
- Status: **ready, not active yet**

## Important

Do **not** switch to Number B until Scott explicitly says something like:

> switch to number B

## Switch commands

Dry-run first:

```bash
python3 scripts/switch-phone-number.py --to B
```

Apply switch to Number B:

```bash
python3 scripts/switch-phone-number.py --to B --apply
```

Switch back to Number A:

```bash
python3 scripts/switch-phone-number.py --to A --apply
```

After applying, verify with:

```bash
python3 - <<'PY'
from pathlib import Path
for term in ['704-631-9936','7046319936','704-520-9299','7045209299']:
    hits=[]
    for p in Path('.').rglob('*'):
        if p.is_dir() or any(part in {'.git','node_modules','dist'} for part in p.parts):
            continue
        try:
            txt=p.read_text(errors='ignore')
        except Exception:
            continue
        if term in txt:
            hits.append(str(p))
    print(term, len(hits), hits[:20])
PY

git diff --check
```

Then commit and push the switch.
