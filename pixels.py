# -*- coding: utf-8 -*-
"""Pixel-level sanity check of the rendered mockups (no image viewer available)."""
import os
from PIL import Image

WORK = os.path.dirname(os.path.abspath(__file__))


def near(px, rgb, tol=10):
    return all(abs(px[i] - rgb[i]) <= tol for i in range(3))


def segments(row, rgb, tol=10, min_len=40):
    runs, start = [], None
    for x, px in enumerate(row):
        hit = near(px, rgb, tol)
        if hit and start is None:
            start = x
        elif not hit and start is not None:
            if x - start >= min_len:
                runs.append((start, x - 1))
            start = None
    if start is not None and len(row) - start >= min_len:
        runs.append((start, len(row) - 1))
    return runs


for name in ("shot-736", "shot-alt", "shot-narrow360", "shot-narrow320"):
    path = os.path.join(WORK, name + ".png")
    if not os.path.exists(path):
        print(name, "MISSING")
        continue
    im = Image.open(path).convert("RGB")
    w, h = im.size
    colors = im.getcolors(maxcolors=200000)
    distinct = len(colors) if colors else ">200000"
    px = im.load()
    # scan for card-background runs (#141C33) every 20 rows
    found = {}
    for y in range(20, h - 20, 20):
        row = [px[x, y] for x in range(w)]
        runs = segments(row, (20, 28, 51), tol=8, min_len=60)
        if len(runs) >= 2:
            found.setdefault(len(runs), (y, runs))
    print(name, "size=%dx%d" % (w, h), "distinct colors:", distinct)
    band = sorted(found.items(), reverse=True)[:2]
    for count, (y, runs) in band:
        print("   %d card runs at y=%d -> %s" % (count, y, runs[:7]))
    top = [px[x, 40] for x in range(0, w, max(1, w // 12))]
    print("   sample row y=40:", top[:6])
