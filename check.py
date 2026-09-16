# -*- coding: utf-8 -*-
"""Headless layout assertions for the dashboard fragment."""
import json
import os
import re
import subprocess

SEP = os.sep
CHROME = "C:/Users/jfchen/AppData/Local/ms-playwright/chromium-1208/chrome-win64/chrome.exe"
WORK = os.path.dirname(os.path.abspath(__file__))

PROBE = """
<script>
window.__errors=[];
window.addEventListener('error',function(e){window.__errors.push(String(e.message));});
window.addEventListener('DOMContentLoaded',function(){
  setTimeout(function(){
    var out={errors:window.__errors};
    var root=document.getElementById('bd-dashboard');
    if(!root){document.title='NO_ROOT';return;}
    var shell=root.querySelector('.bd-shell');
    out.shellW=Math.round(shell.getBoundingClientRect().width);
    out.viewport=window.innerWidth;
    var kpis=root.querySelectorAll('.bd-kpi');
    out.kpiCount=kpis.length;
    var kg=root.querySelector('.bd-kpis');
    out.kpiCols=getComputedStyle(kg).gridTemplateColumns.split(' ').length;
    out.kpiH=Math.round(kpis[0].getBoundingClientRect().height);
    var kpiOverflow=[];
    kpis.forEach(function(k,i){
      k.querySelectorAll('*').forEach(function(el){
        if(el.clientWidth>0&&el.scrollWidth>el.clientWidth+1)
          kpiOverflow.push(i+':'+(el.className||el.tagName)+':'+el.scrollWidth+'>'+el.clientWidth);
      });
    });
    out.kpiOverflow=kpiOverflow;
    out.charts={};
    ['bd-trend','bd-dist','bd-donut','bd-rank'].forEach(function(id){
      var svg=document.getElementById(id);
      out.charts[id]={children:svg.childElementCount,texts:svg.querySelectorAll('text').length,
        w:Math.round(svg.getBoundingClientRect().width),h:Math.round(svg.getBoundingClientRect().height),
        viewBox:svg.getAttribute('viewBox')};
    });
    out.donutSlices=document.querySelectorAll('#bd-donut path').length;
    out.legendItems=document.querySelectorAll('#bd-donut-legend li').length;
    var overlaps=[];
    ['bd-trend','bd-dist','bd-rank'].forEach(function(id){
      var svg=document.getElementById(id);
      var texts=[].map.call(svg.querySelectorAll('text'),function(t){
        var r=t.getBoundingClientRect();
        return {t:t.textContent,l:r.left,r:r.right,tp:r.top,b:r.bottom};
      });
      for(var i=0;i<texts.length;i++)for(var j=i+1;j<texts.length;j++){
        var a=texts[i],c=texts[j];
        if(a.l<c.r-0.5&&c.l<a.r-0.5&&a.tp<c.b-0.5&&c.tp<a.b-0.5)
          overlaps.push(id+':"'+a.t+'"x"'+c.t+'"');
      }
    });
    out.textOverlap=overlaps;
    out.thead=document.querySelectorAll('#bd-thead th').length;
    out.tbody=document.querySelectorAll('#bd-tbody tr').length;
    out.tfoot=document.querySelectorAll('#bd-tfoot td').length;
    var shellLeft=shell.getBoundingClientRect().left, shellRight=shell.getBoundingClientRect().right;
    var outOfBounds=[];
    root.querySelectorAll('*').forEach(function(el){
      var r=el.getBoundingClientRect();
      if(r.width===0&&r.height===0)return;
      if(r.right>shellRight+1||r.left<shellLeft-1)
        outOfBounds.push((el.className||el.tagName)+'@'+Math.round(r.left)+'-'+Math.round(r.right));
    });
    out.outOfBounds=outOfBounds.slice(0,10);
    var clip=[];
    root.querySelectorAll('.bd-panel,.bd-kpi,.bd-detail,.bd-filters,.bd-chrome,.bd-foot').forEach(function(el){
      if(el.scrollHeight>el.clientHeight+1)clip.push(el.className+':'+el.scrollHeight+'>'+el.clientHeight);
    });
    out.clipped=clip;
    var tw=root.querySelector('.bd-tablewrap');
    out.tableScroll={scrollW:tw.scrollWidth,clientW:tw.clientWidth};
    var legOverflow=[];
    root.querySelectorAll('.bd-dl li').forEach(function(el){
      if(el.scrollWidth>el.clientWidth+1)legOverflow.push(el.textContent+':'+el.scrollWidth+'>'+el.clientWidth);
    });
    out.legendOverflow=legOverflow;
    var cr=root.querySelector('.bd-chrome-right');
    out.chromeRight={w:Math.round(cr.getBoundingClientRect().width),scrollW:cr.scrollWidth,clientW:cr.clientWidth};
    var fh=root.querySelector('.bd-detail-head');
    out.detailHead={scrollW:fh.scrollWidth,clientW:fh.clientWidth,h:Math.round(fh.getBoundingClientRect().height)};
    out.filtersH=Math.round(root.querySelector('.bd-filters').getBoundingClientRect().height);
    out.scope=document.getElementById('bd-scope').textContent;
    out.kpiValues=[].map.call(root.querySelectorAll('.bd-kpi strong'),function(e){return e.textContent;});
    out.kpiNames=[].map.call(root.querySelectorAll('.bd-kpi-name'),function(e){return e.textContent;});
    out.chips=[].map.call(root.querySelectorAll('.bd-chip'),function(e){return e.textContent;});
    out.trendTitle=document.getElementById('bd-trend-title').textContent;
    out.footRow=[].map.call(root.querySelectorAll('#bd-tfoot td'),function(e){return e.textContent;}).join('|');
    var pre=document.createElement('pre');
    pre.id='bd-report';
    pre.textContent=JSON.stringify(out);
    var host=document;
    try{ if(window.parent&&window.parent!==window)host=window.parent.document; }catch(e){host=document;}
    try{
      host.body.appendChild(host.importNode?host.importNode(pre,true):pre);
      host.title='REPORT_READY';
    }catch(e){
      document.body.appendChild(pre);
      document.title='REPORT_READY';
    }
  },500);
});
</script>
"""

SHELL = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>check</title>
<style>html,body{margin:0;padding:0;background:#05070F}body{padding:14px}</style>
</head><body>
__FRAGMENT__
__PROBE__
</body></html>
"""


def run(tag, fragment, width):
    html = os.path.join(WORK, "check-" + tag + ".html")
    body = SHELL.replace("__FRAGMENT__", fragment).replace("__PROBE__", PROBE)
    with open(html, "w", encoding="utf-8") as fh:
        fh.write(body)
    proc = subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
        "--force-device-scale-factor=1", "--virtual-time-budget=8000",
        "--window-size=%d,1200" % width,
        "--dump-dom", "file:///" + html.replace(SEP, "/"),
    ], capture_output=True, text=True, encoding="utf-8", errors="replace")
    dom = proc.stdout or ""
    match = re.search(r'<pre id="bd-report">(.*?)</pre>', dom, re.S)
    print("=" * 18, tag, "=" * 18)
    if not match:
        print("NO REPORT; dom char count:", len(dom))
        print((proc.stderr or "")[:800])
        return
    raw = match.group(1)
    for a, b in (("&quot;", '"'), ("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">")):
        raw = raw.replace(a, b)
    print(json.dumps(json.loads(raw), ensure_ascii=False, indent=1))


def run_iframe(tag, fragment, inner_width, outer_height=2600):
    """True narrow-viewport test: render the fragment inside a fixed-width iframe."""
    inner = os.path.join(WORK, "inner-" + tag + ".html")
    with open(inner, "w", encoding="utf-8") as fh:
        fh.write(SHELL.replace("__FRAGMENT__", fragment).replace("__PROBE__", PROBE))
    outer = os.path.join(WORK, "outer-" + tag + ".html")
    with open(outer, "w", encoding="utf-8") as fh:
        fh.write(
            '<!doctype html><html><head><meta charset="utf-8"><style>'
            "html,body{margin:0;background:#05070F}"
            "iframe{width:%dpx;height:%dpx;border:0;display:block;margin:0 auto}"
            "</style></head><body><iframe src=\"%s\"></iframe></body></html>"
            % (inner_width, outer_height, inner.replace(SEP, "/"))
        )
    png = os.path.join(WORK, "shot-%s.png" % tag)
    common = [
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-sandbox",
        "--allow-file-access-from-files", "--force-device-scale-factor=1",
        "--virtual-time-budget=8000",
        "--window-size=%d,%d" % (inner_width + 2, outer_height),
    ]
    url = "file:///" + outer.replace(SEP, "/")
    subprocess.run(common + ["--screenshot=" + png, url], capture_output=True)
    proc = subprocess.run(common + ["--dump-dom", url],
                          capture_output=True, text=True, encoding="utf-8", errors="replace")
    dom = proc.stdout or ""
    match = re.search(r'<pre id="bd-report">(.*?)</pre>', dom, re.S)
    print("iframe shot:", tag, os.path.getsize(png) if os.path.exists(png) else "MISSING")
    print("=" * 18, tag, "=" * 18)
    if not match:
        print("NO IFRAME REPORT; dom chars:", len(dom))
        print((proc.stderr or "")[:500])
        return
    raw = match.group(1)
    for a, b in (("&quot;", '"'), ("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">")):
        raw = raw.replace(a, b)
    print(json.dumps(json.loads(raw), ensure_ascii=False, indent=1))


with open(os.path.join(WORK, "automotive-dashboard-dark.html"), encoding="utf-8") as fh:
    base = fh.read()
alt = base.replace("var state = { period: 'month', dim: '\u5730\u533a' };",
                   "var state = { period: 'quarter', dim: '\u9500\u552e\u5458' };")
assert alt != base, "state override failed"

run("736", base, 736)
run("alt", alt, 736)
run_iframe("narrow360", base, 360, 2600)
run_iframe("narrow320", base, 320, 2900)
