"""Optional font rebuild: python -m pip install fonttools brotli

Keep Latin, Latin Extended, combining accents, punctuation, currency and arrows.
Rename subset families to respect reserved font names. Originals are retained.
Fonts marked subset=false keep their original upstream WOFF2 unchanged.
Normal theme builds use the committed WOFF2 files and require no Python.
"""
import json
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1] / "assets" / "fonts"
ranges = [(0, 0x24F), (0x300, 0x36F), (0x2000, 0x206F), (0x20A0, 0x20CF), (0x2190, 0x21FF), (0xFFFD, 0xFFFD)]
unicodes = [c for lo, hi in ranges for c in range(lo, hi + 1)]
for item in json.loads((root / "fonts.json").read_text()):
    if item.get("subset") is False:
        print(item["name"], "original WOFF2 retained", (root / item["file"]).stat().st_size)
        continue
    font = TTFont(root / item["source"], recalcTimestamp=False)
    options = subset.Options()
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    options.name_legacy = True
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=unicodes)
    sub.subset(font)
    style = "Bold" if item["weight"] == "700" else "Regular"
    for record in font["name"].names:
        if record.nameID in (1, 3, 4, 6, 16):
            value = item["family"]
            if record.nameID in (3, 4, 6):
                value += " " + style
            if record.nameID == 6:
                value = value.replace(" ", "-")
            record.string = value.encode(record.getEncoding())
    font.flavor = "woff2"
    target = root / item["file"]
    font.save(target)
    print(item["name"], target.stat().st_size)
