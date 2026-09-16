# -*- coding: utf-8 -*-
"""End-to-end interaction check: filters, drill-down, theme, task retry, alert workflow."""
import json
import os
import re
import subprocess

SEP = os.sep
CHROME = "C:/Users/jfchen/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe"
ROOT = r"D:\codex\2026-09-15\files-mentioned-by-the-user-b"
DEMO = os.path.join(ROOT, "outputs", "dashboard-demo")

PROBE = """
<script>
window.__errs = [];
window.addEventListener('error', function (e) { window.__errs.push(String(e.message) + ' @' + (e.lineno||0)); });
function q(sel) { return document.querySelector(sel); }
function qa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
function txt(sel) { var e = q(sel); return e ? e.textContent.trim() : null; }
function click(el) { if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
function setSel(sel, val) {
  var s = q(sel); if (!s) return;
  s.value = val; s.dispatchEvent(new Event('change', { bubbles: true }));
}
function numOf(sel) { var t = txt(sel); return t ? parseFloat(t.replace(/[^0-9.\\-]/g, '')) : null; }
function tableFooter() {
  var tds = qa('table.data tfoot td');
  return tds.length ? tds.map(function (td) { return td.textContent.trim(); }) : null;
}
var report = { steps: [] };
function log(name, extra) { report.steps.push(Object.assign({ step: name }, extra || {})); }
function next(fn) { setTimeout(fn, 220); }

window.addEventListener('DOMContentLoaded', function () {
  var flow = [
    function () {
      log('init', { kpi: numOf('.kpi-value'), dim: txt('#chart-rank') ? 'ok' : 'missing',
        consistency: consistency() });
      next(flow.shift());
    },
    function () {   // 时间口径切换
      var before = numOf('.kpi-value');
      click(qa('[data-act="period"]')[1]);
      next(function () {
        var after = numOf('.kpi-value');
        log('period->quarter', { before: before, after: after, changed: before !== after,
          title: txt('.card-head h3'), consistency: consistency() });
        click(qa('[data-act="period"]')[0]);
        next(flow.shift());
      });
    },
    function () {   // 地区筛选
      setSel('[data-filter="region"]', '华东');
      next(function () {
        log('filter region=华东', { kpi: numOf('.kpi-value'), footer: tableFooter(),
          crumb: txt('.crumb'), consistency: consistency() });
        setSel('[data-filter="region"]', '全部');
        next(flow.shift());
      });
    },
    function () {   // 下钻
      var bar = qa('#chart-rank rect')[3];
      click(bar);
      next(function () {
        log('drill from rank', { crumb: txt('.crumb'), dimButtons: qa('[data-act="dim"]').map(function (b) {
          return b.textContent + ':' + b.getAttribute('aria-pressed'); }).join(','),
          footer: tableFooter(), consistency: consistency() });
        click(q('[data-act="drill-reset"]'));
        next(flow.shift());
      });
    },
    function () {   // 维度切换
      click(qa('[data-act="dim"]')[1]);
      next(function () {
        log('dim->销售员', { tableHead: qa('table.data thead th').map(function (t) { return t.textContent; }).join('|'),
          footer: tableFooter(), consistency: consistency() });
        click(qa('[data-act="dim"]')[0]);
        next(flow.shift());
      });
    },
    function () {   // 主题切换
      var tp = q('#chart-trend path[stroke]');
      var darkStroke = tp ? getComputedStyle(tp).stroke : null;
      click(q('[data-act="theme"]'));
      next(function () {
        var theme = document.documentElement.getAttribute('data-theme');
        var tp2 = q('#chart-trend path[stroke]');
        var lightStroke = tp2 ? getComputedStyle(tp2).stroke : null;
        log('theme toggle', { theme: theme, background: getComputedStyle(document.body).backgroundColor,
          wrongTheme: theme === 'light' ? /rgb\\(11, 16, 38\\)/.test(getComputedStyle(document.body).backgroundColor) : false,
          strokeChanged: darkStroke ? darkStroke !== lightStroke : false });
        click(q('[data-act="theme"]'));
        next(flow.shift());
      });
    },
    function () {   // 数据中心重跑
      click(q('[data-act="nav"][data-val="datacenter"]'));
      next(function () {
        var before = q('.nav-badge');
        var badgeBefore = before ? before.textContent : '0';
        var bannerBefore = !q('#banner').hidden;
        click(q('[data-act="task-retry"]'));
        next(function () {
          log('task retry', { badge: badgeBefore + ' -> ' + (q('.nav-badge') ? q('.nav-badge').textContent : '0'),
            bannerBefore: bannerBefore, bannerAfter: !q('#banner').hidden,
            failedBadgeGone: !qa('.nav-badge').some(function (b) { return /^[0-9]+$/.test(b.textContent) && b.getAttribute('data-level') === 'warn'; }) });
          next(flow.shift());
        });
      });
    },
    function () {   // 预警状态流转
      click(q('[data-act="nav"][data-val="alerts"]'));
      next(function () {
        var badgeBefore = null;
        qa('.nav-badge').forEach(function (b) { if (b.getAttribute('data-level') === 'risk') badgeBefore = b.textContent; });
        setSel('[data-alert-status="A-3181"]', '已关闭');
        next(function () {
          var badgeAfter = null;
          qa('.nav-badge').forEach(function (b) { if (b.getAttribute('data-level') === 'risk') badgeAfter = b.textContent; });
          log('alert status', { before: badgeBefore, after: badgeAfter,
            statPending: txt('.stat-strip b'), ok: badgeBefore !== badgeAfter || badgeAfter === null });
          next(flow.shift());
        });
      });
    },
    function () {   // 多维分析
      click(q('[data-act="nav"][data-val="pivot"]'));
      next(function () {
        click(qa('[data-act="pivot-row"]')[2]);
        next(function () {
          log('pivot row dim', { head: qa('table.data thead th').slice(0, 3).map(function (t) { return t.textContent; }).join('|'),
            rows: qa('table.data tbody tr').length, footer: tableFooter() });
          next(flow.shift());
        });
      });
    },
    function () {   // 打印导出
      click(q('[data-act="nav"][data-val="overview"]'));
      next(function () {
        var before = window.print;
        var called = false;
        window.print = function () { called = true; };
        click(q('[data-act="export"]'));
        setTimeout(function () {
          log('export', { printCalled: called, watermark: !!q('.watermark'), watermarkText: txt('.watermark') ? txt('.watermark').slice(0, 40) : '' });
          window.print = before;
          finish();
        }, 600);
      });
    }
  ];
  function consistency() {
    var vals = qa('.kpi-value');
    var kpiSales = vals[2] ? parseFloat(vals[2].textContent.replace(/[^0-9]/g, '')) : null;
    var foot = tableFooter();
    var footSales = foot ? parseFloat(foot[1].replace(/[^0-9]/g, '')) : null;
    return { kpi: kpiSales, tableTotal: footSales, equal: kpiSales === footSales };
  }
  function finish() {
    report.errors = window.__errs;
    var pre = document.createElement('pre');
    pre.id = 'report';
    pre.textContent = JSON.stringify(report);
    try {
      var host = (window.parent && window.parent !== window) ? window.parent.document : document;
      host.body.appendChild(host.importNode ? host.importNode(pre, true) : pre);
      host.title = 'READY';
    } catch (e) { document.body.appendChild(pre); }
  }
  next(flow.shift());
});
</script>
"""

with open(os.path.join(DEMO, "index.html"), encoding="utf-8") as fh:
    html = fh.read()
probe_path = os.path.join(DEMO, "_interact.html")
with open(probe_path, "w", encoding="utf-8") as fh:
    fh.write(html.replace("</body>", PROBE + "\n</body>"))
outer = os.path.join(DEMO, "_outer_interact.html")
with open(outer, "w", encoding="utf-8") as fh:
    fh.write('<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0}iframe{border:0}</style>'
             '</head><body><iframe src="_interact.html" width="1600" height="1200"></iframe></body></html>')

proc = subprocess.run([
    CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
    "--allow-file-access-from-files", "--force-device-scale-factor=1",
    "--virtual-time-budget=30000", "--window-size=1000,1200",
    "--dump-dom", "file:///" + outer.replace(SEP, "/"),
], capture_output=True, text=True, encoding="utf-8", errors="replace")

dom = proc.stdout or ""
m = re.search(r'<pre id="report">(.*?)</pre>', dom, re.S)
if not m:
    print("NO REPORT; dom chars", len(dom))
    print((proc.stderr or "")[:800])
    raise SystemExit(1)
raw = m.group(1)
for a, b in (("&quot;", '"'), ("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">")):
    raw = raw.replace(a, b)
data = json.loads(raw)
print("errors:", data["errors"])
for s in data["steps"]:
    print("-", s["step"])
    for k, v in s.items():
        if k != "step":
            print("     %s = %s" % (k, v))
os.remove(probe_path)
os.remove(outer)
