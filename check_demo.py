# -*- coding: utf-8 -*-
"""Run the demo inside fixed-width iframes so each target breakpoint is exact."""
import json
import os
import re
import subprocess

SEP = os.sep
CHROME = "C:/Users/jfchen/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe"
ROOT = r"D:\codex\2026-09-15\files-mentioned-by-the-user-b"
DEMO = os.path.join(ROOT, "outputs", "dashboard-demo")
PAGES = ["overview", "sales", "delivery", "capacity", "pivot", "datacenter",
         "metrics", "alerts", "subscriptions", "permissions", "audit", "tenant"]

PROBE = """
<script>
window.__errs = [];
window.addEventListener('error', function (e) {
  window.__errs.push(String(e.message) + ' @' + (e.filename || '').split('/').pop() + ':' + (e.lineno || 0));
});
window.addEventListener('DOMContentLoaded', function () {
  var pages = __PAGES__;
  var out = [], i = 0;
  function snap(p) {
    var ws = document.getElementById('workspace');
    var rec = {
      page: p, vw: window.innerWidth,
      h1: (ws.querySelector('h1') || {}).textContent || '',
      cards: ws.querySelectorAll('.card').length,
      kpis: ws.querySelectorAll('.kpi').length,
      chartSvg: ws.querySelectorAll('.chart svg').length,
      marks: ws.querySelectorAll('.chart svg path, .chart svg rect, .chart svg circle').length,
      tables: ws.querySelectorAll('table.data').length,
      empty: ws.querySelectorAll('.empty').length
    };
    var bad = [], zero = [];
    ws.querySelectorAll('*').forEach(function (el) {
      if (el.namespaceURI && el.namespaceURI.indexOf('svg') >= 0) return;
      if (el.closest('.table-wrap') || el.classList.contains('kpi-name')) return;
      if (el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 2) {
        bad.push((typeof el.className === 'string' ? el.className : el.tagName) + ':' + el.scrollWidth + '>' + el.clientWidth);
      }
    });
    rec.overflow = bad.slice(0, 6);
    ws.querySelectorAll('.chart svg').forEach(function (svg) {
      if (svg.childElementCount === 0) zero.push(svg.parentNode.id || 'chart');
    });
    rec.emptyCharts = zero;
    var kpiRow = document.querySelector('.kpi-row');
    rec.kpiCols = kpiRow ? getComputedStyle(kpiRow).gridTemplateColumns.split(' ').length : 0;
    out.push(rec);
  }
  function step() {
    if (i >= pages.length) { done(); return; }
    var p = pages[i++];
    location.hash = '#/' + p;
    setTimeout(function () { snap(p); step(); }, 240);
  }
  function done() {
    location.hash = '#/overview';
    setTimeout(function () {
      var summary = {
        vw: window.innerWidth,
        errors: window.__errs,
        pages: out,
        navItems: document.querySelectorAll('#nav .nav-item').length,
        navGroups: document.querySelectorAll('#nav .nav-group').length,
        navBadges: [].map.call(document.querySelectorAll('.nav-badge'), function (b) { return b.textContent; }),
        footItems: document.querySelectorAll('#sidebar-foot .nav-item').length,
        trustChips: document.querySelectorAll('.trust-chip').length,
        firstKpi: (document.querySelector('.kpi-value') || {}).textContent || '',
        tableRows: document.querySelectorAll('table.data tbody tr').length,
        docHeight: document.documentElement.scrollHeight
      };
      var pre = document.createElement('pre');
      pre.id = 'report';
      pre.textContent = JSON.stringify(summary);
      try {
        var host = (window.parent && window.parent !== window) ? window.parent.document : document;
        host.body.appendChild(host.importNode ? host.importNode(pre, true) : pre);
        host.title = 'READY';
      } catch (e) {
        document.body.appendChild(pre);
        document.title = 'READY';
      }
    }, 400);
  }
  step();
});
</script>
"""

with open(os.path.join(DEMO, "index.html"), encoding="utf-8") as fh:
    html = fh.read()
probe = PROBE.replace("__PAGES__", json.dumps(PAGES))
probe_path = os.path.join(DEMO, "_probe.html")
with open(probe_path, "w", encoding="utf-8") as fh:
    fh.write(html.replace("</body>", probe + "\n</body>"))


def run(width, height, tag):
    outer = os.path.join(DEMO, "_outer_%s.html" % tag)
    with open(outer, "w", encoding="utf-8") as fh:
        fh.write(
            '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#05070F}'
            'iframe{border:0;display:block}</style></head><body>'
            '<iframe src="_probe.html" width="%d" height="%d"></iframe></body></html>' % (width, height)
        )
    proc = subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
        "--allow-file-access-from-files", "--force-device-scale-factor=1",
        "--virtual-time-budget=20000",
        "--window-size=%d,%d" % (min(width + 40, 1000), min(height + 40, 1400)),
        "--dump-dom", "file:///" + outer.replace(SEP, "/"),
    ], capture_output=True, text=True, encoding="utf-8", errors="replace")
    dom = proc.stdout or ""
    match = re.search(r'<pre id="report">(.*?)</pre>', dom, re.S)
    os.remove(outer)
    if not match:
        print("[%s] NO REPORT; dom chars %d %s" % (tag, len(dom), (proc.stderr or "")[:300]))
        return None
    raw = match.group(1)
    for a, b in (("&quot;", '"'), ("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">")):
        raw = raw.replace(a, b)
    return json.loads(raw)


def report(tag, data):
    if not data:
        return 1
    print("=" * 66)
    print("[%s] viewport=%s  errors=%s" % (tag, data["vw"], data["errors"]))
    print("      nav=%d/%d foot=%d trust=%d firstKPI=%s rows=%d docH=%d badges=%s"
          % (data["navItems"], data["navGroups"], data["footItems"], data["trustChips"],
             data["firstKpi"], data["tableRows"], data["docHeight"], data["navBadges"]))
    print("      %-13s %-6s %4s %4s %4s %6s %4s %4s %4s  %s"
          % ("page", "h1", "card", "kpi", "svg", "marks", "tab", "emp", "cols", "issues"))
    bad = 0
    for p in data["pages"]:
        issues = []
        if p["overflow"]:
            issues.append("OVERFLOW " + "; ".join(p["overflow"]))
        if p["emptyCharts"]:
            issues.append("EMPTY " + ",".join(p["emptyCharts"]))
        if not p["h1"]:
            issues.append("NO-H1")
        if issues:
            bad += 1
        print("      %-13s %-6s %4d %4d %4d %6d %4d %4d %4d  %s"
              % (p["page"], p["h1"][:6], p["cards"], p["kpis"], p["chartSvg"],
                 p["marks"], p["tables"], p["empty"], p["kpiCols"],
                 " | ".join(issues) if issues else "ok"))
    print("      pages with issues: %d" % bad)
    return bad


total = 0
for w, h, tag in ((1920, 1400, "1920"), (1440, 1200, "1440"), (1024, 1000, "1024"), (390, 1400, "390")):
    total += report(tag, run(w, h, tag))
print()
print("TOTAL pages with issues:", total)
os.remove(probe_path)
