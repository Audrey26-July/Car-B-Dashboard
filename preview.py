# -*- coding: utf-8 -*-
"""Wrap the fragment as standalone HTML and capture Chromium screenshots."""
import os
import subprocess
import sys

CHROME = r"C:\Users\jfchen\AppData\Local\ms-playwright\chromium-1208\chrome-win64\chrome.exe"
WORK = os.path.dirname(os.path.abspath(__file__))
FRAGMENT = os.path.join(WORK, "automotive-dashboard-dark.html")

SHELL = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
html,body{margin:0;padding:0;background:#05070F}
body{padding:14px}
</style></head><body>
__FRAGMENT__
</body></html>
"""


def build(name, fragment_text, width, height, out_png):
    html_path = os.path.join(WORK, name + ".html")
    with open(html_path, "w", encoding="utf-8") as fh:
        fh.write(SHELL.replace("__FRAGMENT__", fragment_text))
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--force-device-scale-factor=1", "--no-sandbox",
        "--virtual-time-budget=4000",
        "--window-size=%d,%d" % (width, height),
        "--screenshot=" + out_png,
        "file:///" + html_path.replace("\\", "/"),
    ], check=False, capture_output=True)
    print("shot:", out_png, os.path.getsize(out_png) if os.path.exists(out_png) else "MISSING")


with open(FRAGMENT, encoding="utf-8") as fh:
    base = fh.read()

alt = base.replace("var state = { period: 'month', dim: '地区' };",
                   "var state = { period: 'quarter', dim: '销售员' };")
assert alt != base, "state override failed"

build("preview-736", base, 736, 1750, os.path.join(WORK, "shot-736.png"))
build("preview-360", base, 360, 2900, os.path.join(WORK, "shot-360.png"))
build("preview-alt-736", alt, 736, 1750, os.path.join(WORK, "shot-alt.png"))
