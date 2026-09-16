/* 轻量 SVG 图表库（零依赖）
 * 统一规则：坐标轴文字 12px 次文字色、网格线低对比、Tooltip 携带口径/截止时间/批次号。
 */
(function (global) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';

  function mk(tag, attrs, text) {
    var el = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] !== null && attrs[k] !== undefined) el.setAttribute(k, attrs[k]);
    });
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function px(v) { return Math.round(v * 100) / 100; }

  function fmtNum(v, digits) {
    var d = digits === undefined ? 0 : digits;
    return Number(v).toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function fmtCompact(v) {
    var a = Math.abs(v);
    if (a >= 100000000) return (v / 100000000).toFixed(2) + ' 亿';
    if (a >= 10000) return (v / 10000).toFixed(a >= 100000 ? 0 : 2) + ' 万';
    return fmtNum(v);
  }

  var TOKENS = ['--c-s1', '--c-s2', '--c-s3', '--c-ok', '--c-warn', '--c-risk',
    '--c-text', '--c-text2', '--c-text3', '--c-border', '--c-grid', '--c-surface', '--c-surface2'];
  function colors() {
    var cs = getComputedStyle(document.getElementById('app'));
    var out = {};
    TOKENS.forEach(function (t) {
      out[t.replace('--c-', '')] = cs.getPropertyValue(t).trim() || '#888';
    });
    out.series = [out.s1, out.s2, out.s3, out.ok, out.warn, out.risk];
    return out;
  }

  function svgOf(container) {
    var svg = container.querySelector('svg');
    if (!svg) {
      svg = mk('svg');
      container.appendChild(svg);
    }
    return svg;
  }
  function size(svg) {
    var w = Math.max(120, Math.round(svg.clientWidth || svg.parentNode.clientWidth || 320));
    var h = Math.max(90, Math.round(svg.clientHeight || svg.parentNode.clientHeight || 200));
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    return { w: w, h: h };
  }

  function tip(container, x, y, html) {
    var el = container.querySelector('.chart-tip');
    if (!el) {
      el = document.createElement('div');
      el.className = 'chart-tip';
      container.appendChild(el);
    }
    el.innerHTML = html;
    el.classList.add('is-on');
    var box = container.getBoundingClientRect();
    var w = el.offsetWidth || 200;
    var left = Math.min(Math.max(8, x - w / 2), box.width - w - 8);
    el.style.left = left + 'px';
    el.style.top = Math.max(8, y - el.offsetHeight - 12) + 'px';
  }
  function hideTip(container) {
    var el = container.querySelector('.chart-tip');
    if (el) el.classList.remove('is-on');
  }
  function tipHTML(title, value, meta) {
    return '<div class="chart-tip-t">' + title + '</div>' +
      '<div class="chart-tip-v">' + value + '</div>' +
      '<div class="chart-tip-m">' + meta + '</div>';
  }

  /* ------------------------------------------------------------------ 折线 / 面积 */
  function line(container, spec) {
    container.__spec = { fn: 'line', spec: spec };
    var c = colors(), svg = svgOf(container), s = size(svg);
    clear(svg); hideTip(container);
    var w = s.w, h = s.h;
    var hasRight = !!spec.rightAxis;
    var padL = 46, padR = hasRight ? 46 : 16, padT = 22, padB = 26;
    var plotW = Math.max(40, w - padL - padR), plotH = Math.max(40, h - padT - padB);
    var g = mk('g');

    var leftVals = [], rightVals = [];
    spec.series.forEach(function (ser) {
      (ser.axis === 'right' ? rightVals : leftVals).push.apply(ser.axis === 'right' ? rightVals : leftVals, ser.values);
    });
    var lMax = leftVals.length ? Math.max.apply(null, leftVals) : 1;
    var lMin = Math.min.apply(null, leftVals.concat([0]));
    if (lMin > 0) lMin = 0;
    lMax = lMax * 1.14 || 1;
    var rMax = rightVals.length ? Math.max.apply(null, rightVals) : 1;
    var rMin = rightVals.length ? Math.min.apply(null, rightVals) : 0;
    var rPad = (rMax - rMin) * 0.35 || 2;
    var rTop = rMax + rPad, rBottom = rMin - rPad;

    var n = spec.labels.length;
    var X = function (i) { return padL + (n <= 1 ? plotW / 2 : plotW * i / (n - 1)); };
    var Y = function (v) { return padT + plotH - plotH * (v - lMin) / (lMax - lMin); };
    var Y2 = function (v) { return padT + plotH - plotH * (v - rBottom) / (rTop - rBottom); };

    var ticks = 4;
    for (var t = 0; t < ticks; t++) {
      var vy = padT + plotH * t / (ticks - 1);
      g.appendChild(mk('line', { x1: padL, y1: px(vy), x2: px(padL + plotW), y2: px(vy), stroke: c.grid, 'stroke-width': 1 }));
      g.appendChild(mk('text', { x: padL - 8, y: px(vy + 4), 'text-anchor': 'end', fill: c.text3, 'font-size': 12 },
        fmtCompact(lMax - (lMax - lMin) * t / (ticks - 1))));
      if (hasRight) {
        g.appendChild(mk('text', { x: px(padL + plotW + 8), y: px(vy + 4), 'text-anchor': 'start', fill: c.text3, 'font-size': 12 },
          (rTop - (rTop - rBottom) * t / (ticks - 1)).toFixed(1) + '%'));
      }
    }
    if (spec.target !== undefined && spec.target !== null) {
      var ty = Y(spec.target);
      g.appendChild(mk('line', {
        x1: padL, y1: px(ty), x2: px(padL + plotW), y2: px(ty),
        stroke: c.s4 || c.warn, 'stroke-width': 1.5, 'stroke-dasharray': '6 5'
      }));
      g.appendChild(mk('text', { x: px(padL + plotW - 2), y: px(ty - 6), 'text-anchor': 'end', fill: c.warn, 'font-size': 12 },
        '目标 ' + fmtCompact(spec.target)));
    }
    (spec.thresholds || []).forEach(function (th) {
      var y = Y(th.value);
      g.appendChild(mk('line', { x1: padL, y1: px(y), x2: px(padL + plotW), y2: px(y), stroke: c.risk, 'stroke-width': 1.2, 'stroke-dasharray': '3 4' }));
      g.appendChild(mk('text', { x: padL + 4, y: px(y - 5), fill: c.risk, 'font-size': 12 }, th.label));
    });

    spec.series.forEach(function (ser) {
      var Yf = ser.axis === 'right' ? Y2 : Y;
      var d = '';
      ser.values.forEach(function (v, i) { d += (i ? ' L' : 'M') + px(X(i)) + ' ' + px(Yf(v)); });
      if (ser.type === 'area') {
        var gid = 'grad-' + Math.random().toString(36).slice(2, 8);
        var defs = mk('defs');
        var grad = mk('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
        grad.appendChild(mk('stop', { offset: '0%', 'stop-color': ser.color || c.s1, 'stop-opacity': '0.34' }));
        grad.appendChild(mk('stop', { offset: '100%', 'stop-color': ser.color || c.s1, 'stop-opacity': '0' }));
        defs.appendChild(grad); g.appendChild(defs);
        var area = d + ' L' + px(X(n - 1)) + ' ' + px(padT + plotH) + ' L' + px(X(0)) + ' ' + px(padT + plotH) + ' Z';
        g.appendChild(mk('path', { d: area, fill: 'url(#' + gid + ')' }));
      }
      g.appendChild(mk('path', {
        d: d, fill: 'none', stroke: ser.color || c.s1, 'stroke-width': 2,
        'stroke-linejoin': 'round', 'stroke-linecap': 'round',
        'stroke-dasharray': ser.dashed ? '6 5' : null
      }));
      ser.values.forEach(function (v, i) {
        var cx = X(i), cy = Yf(v);
        g.appendChild(mk('circle', { cx: px(cx), cy: px(cy), r: 2.6, fill: ser.color || c.s1 }));
      });
    });

    var step = Math.max(1, Math.ceil(n / (w < 420 ? 4 : 6)));
    spec.labels.forEach(function (lb, i) {
      if (i % step !== 0 && i !== n - 1) return;
      g.appendChild(mk('text', {
        x: px(Math.min(Math.max(X(i), padL + 12), padL + plotW - 12)), y: h - 8,
        'text-anchor': i === n - 1 ? 'end' : 'middle', fill: c.text3, 'font-size': 12
      }, lb));
    });

    var hit = mk('g');
    spec.labels.forEach(function (lb, i) {
      var bw = plotW / Math.max(1, n - 1) || 10;
      var rect = mk('rect', {
        x: px(X(i) - bw / 2), y: padT, width: px(bw), height: plotH, fill: 'transparent'
      });
      var rows = spec.series.map(function (ser) {
        var unit = ser.unit || '';
        return '<div class="tip-row"><i style="background:' + (ser.color || c.s1) + '"></i>' + ser.name +
          '<b>' + fmtNum(ser.values[i], ser.digits === undefined ? 0 : ser.digits) + unit + '</b></div>';
      }).join('');
      rect.addEventListener('mousemove', function (e) {
        tip(container, X(i), Math.max(20, e.offsetY || 20), tipHTML(lb, '', rows + '<div class="tip-meta">' + (spec.meta || '') + '</div>'));
      });
      rect.addEventListener('mouseleave', function () { hideTip(container); });
      hit.appendChild(rect);
    });
    svg.appendChild(g); svg.appendChild(hit);
  }

  /* ------------------------------------------------------------------ 柱形 / 直方 */
  function bars(container, spec) {
    container.__spec = { fn: 'bars', spec: spec };
    var c = colors(), svg = svgOf(container), s = size(svg);
    clear(svg); hideTip(container);
    var w = s.w, h = s.h;
    var padL = 40, padR = 10, padT = 24, padB = 26;
    var plotW = Math.max(30, w - padL - padR), plotH = Math.max(30, h - padT - padB);
    var maxV = Math.max.apply(null, spec.items.map(function (i) { return i.value; })) * 1.18 || 1;
    var peak = spec.items.reduce(function (a, it, i) { return it.value > spec.items[a].value ? i : a; }, 0);
    var g = mk('g');
    for (var t = 0; t < 3; t++) {
      var vy = padT + plotH * t / 2;
      g.appendChild(mk('line', { x1: padL, y1: px(vy), x2: px(padL + plotW), y2: px(vy), stroke: c.grid, 'stroke-width': 1 }));
      g.appendChild(mk('text', { x: padL - 8, y: px(vy + 4), 'text-anchor': 'end', fill: c.text3, 'font-size': 12 },
        fmtCompact(maxV * (1 - t / 2))));
    }
    var slot = plotW / spec.items.length;
    var bw = Math.min(spec.maxBarWidth || 40, slot * 0.56);
    spec.items.forEach(function (it, i) {
      var bh = Math.max(2, plotH * it.value / maxV);
      var x = padL + slot * i + (slot - bw) / 2, y = padT + plotH - bh;
      var isPeak = spec.highlightPeak !== false && i === peak;
      var rect = mk('rect', {
        x: px(x), y: px(y), width: px(bw), height: px(bh), rx: 4,
        fill: isPeak ? c.s2 : (it.color || c.s1), 'fill-opacity': isPeak ? 0.9 : 0.62
      });
      rect.style.cursor = 'crosshair';
      rect.addEventListener('mousemove', function (e) {
        tip(container, x + bw / 2, y, tipHTML(it.label, fmtNum(it.value) + (spec.unit || ''),
          (it.note ? it.note + '<br>' : '') + '<div class="tip-meta">' + (spec.meta || '') + '</div>'));
      });
      rect.addEventListener('mouseleave', function () { hideTip(container); });
      g.appendChild(rect);
      g.appendChild(mk('text', { x: px(x + bw / 2), y: px(y - 6), 'text-anchor': 'middle', fill: c.text, 'font-size': 12 }, fmtNum(it.value)));
      g.appendChild(mk('text', {
        x: px(Math.min(Math.max(padL + slot * i + slot / 2, padL + 16), padL + plotW - 16)), y: h - 8,
        'text-anchor': 'middle', fill: c.text3, 'font-size': 12
      }, it.label));
    });
    svg.appendChild(g);
  }

  /* ------------------------------------------------------------------ 横向排行 */
  function hbars(container, spec) {
    container.__spec = { fn: 'hbars', spec: spec };
    var c = colors(), svg = svgOf(container), s = size(svg);
    clear(svg); hideTip(container);
    var w = s.w, h = s.h;
    var items = spec.items;
    var labelW = Math.min(120, Math.max(64, w * 0.22));
    var valueW = 62, barX = labelW + 10;
    var barArea = Math.max(24, w - barX - valueW - 4);
    var rowH = Math.min(34, (h - 8) / items.length);
    var bh = Math.max(8, Math.min(16, rowH * 0.5));
    var maxV = Math.max.apply(null, items.map(function (i) { return i.value; })) || 1;
    var g = mk('g');
    items.forEach(function (it, i) {
      var cy = 4 + rowH * i + rowH / 2;
      var y = cy - bh / 2;
      var bad = it.status === 'bad';
      g.appendChild(mk('text', { x: labelW, y: px(cy + 4), 'text-anchor': 'end', fill: c.text2, 'font-size': 12 }, it.label));
      g.appendChild(mk('rect', { x: barX, y: px(y), width: px(barArea), height: px(bh), rx: px(bh / 2), fill: c.grid }));
      var rect = mk('rect', {
        x: barX, y: px(y), width: px(Math.max(3, barArea * it.value / maxV)), height: px(bh), rx: px(bh / 2),
        fill: bad ? c.warn : c.s1, 'fill-opacity': bad ? 0.92 : 0.8
      });
      rect.style.cursor = 'crosshair';
      if (spec.onSelect) {
        rect.style.cursor = 'pointer';
        rect.addEventListener('click', function () { spec.onSelect(it, i); });
      }
      rect.addEventListener('mousemove', function () {
        tip(container, barX + barArea * it.value / maxV, y, tipHTML(it.label,
          fmtNum(it.value) + (spec.unit || ''), (it.note || '') + '<div class="tip-meta">' + (spec.meta || '') + '</div>'));
      });
      rect.addEventListener('mouseleave', function () { hideTip(container); });
      g.appendChild(rect);
      g.appendChild(mk('text', { x: w - 4, y: px(cy + 4), 'text-anchor': 'end', fill: c.text, 'font-size': 12 }, fmtNum(it.value)));
      if (bad) {
        g.appendChild(mk('text', { x: w - 4, y: px(cy + 16), 'text-anchor': 'end', fill: c.warn, 'font-size': 11 }, '低于 90%'));
      }
    });
    svg.appendChild(g);
  }

  /* ------------------------------------------------------------------ 环形 */
  function donut(container, spec) {
    container.__spec = { fn: 'donut', spec: spec };
    var c = colors(), svg = svgOf(container), s = size(svg);
    clear(svg); hideTip(container);
    var w = s.w, h = s.h;
    var cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 4, rin = R * 0.62;
    var palette = [c.s1, c.s2, c.s3, c.ok, c.warn, c.text3];
    var total = spec.items.reduce(function (a, i) { return a + i.value; }, 0) || 1;
    var g = mk('g'), a0 = -Math.PI / 2;
    spec.items.forEach(function (it, i) {
      var sweep = (it.value / total) * Math.PI * 2;
      var a1 = a0 + Math.max(sweep - 0.04, 0.004);
      var large = (a1 - a0) > Math.PI ? 1 : 0;
      var path = mk('path', {
        d: 'M' + px(cx + R * Math.cos(a0)) + ' ' + px(cy + R * Math.sin(a0)) +
          ' A' + px(R) + ' ' + px(R) + ' 0 ' + large + ' 1 ' + px(cx + R * Math.cos(a1)) + ' ' + px(cy + R * Math.sin(a1)) +
          ' L' + px(cx + rin * Math.cos(a1)) + ' ' + px(cy + rin * Math.sin(a1)) +
          ' A' + px(rin) + ' ' + px(rin) + ' 0 ' + large + ' 0 ' + px(cx + rin * Math.cos(a0)) + ' ' + px(cy + rin * Math.sin(a0)) + ' Z',
        fill: it.color || palette[i % palette.length]
      });
      path.style.cursor = 'crosshair';
      var pct = (it.value / total * 100).toFixed(1) + '%';
      path.addEventListener('mousemove', function () {
        tip(container, cx, cy - R, tipHTML(it.name, fmtCompact(it.value) + ' · ' + pct,
          '<div class="tip-meta">' + (spec.meta || '') + '</div>'));
      });
      path.addEventListener('mouseleave', function () { hideTip(container); });
      g.appendChild(path);
      a0 += sweep;
    });
    g.appendChild(mk('text', { x: px(cx), y: px(cy - 1), 'text-anchor': 'middle', fill: c.text, 'font-size': 22, 'font-weight': 700 },
      spec.centerValue));
    g.appendChild(mk('text', { x: px(cx), y: px(cy + 17), 'text-anchor': 'middle', fill: c.text3, 'font-size': 12 }, spec.centerLabel || ''));
    svg.appendChild(g);
    return palette;
  }

  /* ------------------------------------------------------------------ 散点 */
  function scatter(container, spec) {
    container.__spec = { fn: 'scatter', spec: spec };
    var c = colors(), svg = svgOf(container), s = size(svg);
    clear(svg); hideTip(container);
    var w = s.w, h = s.h;
    var padL = 54, padR = 16, padT = 20, padB = 40;
    var plotW = Math.max(30, w - padL - padR), plotH = Math.max(30, h - padT - padB);
    var xs = spec.points.map(function (p) { return p.x; }), ys = spec.points.map(function (p) { return p.y; });
    var x0 = Math.min.apply(null, xs) * 0.92, x1 = Math.max.apply(null, xs) * 1.05;
    var y0 = 0, y1 = Math.max.apply(null, ys) * 1.15;
    var X = function (v) { return padL + plotW * (v - x0) / (x1 - x0); };
    var Y = function (v) { return padT + plotH - plotH * (v - y0) / (y1 - y0); };
    var g = mk('g');
    for (var t = 0; t < 4; t++) {
      var vy = padT + plotH * t / 3;
      g.appendChild(mk('line', { x1: padL, y1: px(vy), x2: px(padL + plotW), y2: px(vy), stroke: c.grid, 'stroke-width': 1 }));
      g.appendChild(mk('text', { x: padL - 8, y: px(vy + 4), 'text-anchor': 'end', fill: c.text3, 'font-size': 12 },
        fmtCompact(y1 * (1 - t / 3))));
    }
    var maxR = Math.max.apply(null, spec.points.map(function (p) { return p.r || 1; }));
    spec.points.forEach(function (p) {
      var r = 5 + 13 * Math.sqrt((p.r || 1) / maxR);
      var circle = mk('circle', { cx: px(X(p.x)), cy: px(Y(p.y)), r: px(r), fill: c.s1, 'fill-opacity': 0.42, stroke: c.s1, 'stroke-width': 1.4 });
      circle.style.cursor = 'crosshair';
      circle.addEventListener('mousemove', function () {
        tip(container, X(p.x), Y(p.y), tipHTML(p.name, fmtCompact(p.y) + ' · ' + p.r + ' 台',
          '车价 ' + p.x.toFixed(1) + ' 万元<div class="tip-meta">' + (spec.meta || '') + '</div>'));
      });
      circle.addEventListener('mouseleave', function () { hideTip(container); });
      g.appendChild(circle);
      g.appendChild(mk('text', { x: px(X(p.x)), y: px(Y(p.y) - r - 5), 'text-anchor': 'middle', fill: c.text2, 'font-size': 11 }, p.name));
    });
    g.appendChild(mk('text', { x: px(padL + plotW / 2), y: h - 8, 'text-anchor': 'middle', fill: c.text3, 'font-size': 12 }, spec.xLabel || ''));
    g.appendChild(mk('text', { x: 12, y: px(padT + plotH / 2), 'text-anchor': 'middle', fill: c.text3, 'font-size': 12, transform: 'rotate(-90 12 ' + px(padT + plotH / 2) + ')' }, spec.yLabel || ''));
    svg.appendChild(g);
  }

  /* ------------------------------------------------------------------ 漏斗 */
  function funnel(container, spec) {
    container.__spec = { fn: 'funnel', spec: spec };
    var c = colors(), svg = svgOf(container), s = size(svg);
    clear(svg); hideTip(container);
    var w = s.w, h = s.h;
    var stages = spec.stages;
    var top = 12, bottom = h - 16;
    var segH = (bottom - top) / stages.length;
    var maxV = stages[0].value || 1;
    var cx = w / 2 + 10;
    var g = mk('g');
    stages.forEach(function (st, i) {
      var wTop = Math.max(0.06, st.value / maxV) * (w - 96);
      var wBot = Math.max(0.06, (stages[i + 1] ? stages[i + 1].value : st.value * 0.92) / maxV) * (w - 96);
      var y = top + segH * i, y2 = y + segH * 0.86;
      var p = 'M' + px(cx - wTop / 2) + ' ' + px(y) + ' L' + px(cx + wTop / 2) + ' ' + px(y) +
        ' L' + px(cx + wBot / 2) + ' ' + px(y2) + ' L' + px(cx - wBot / 2) + ' ' + px(y2) + ' Z';
      var colorsArr = [c.s1, c.s1, c.s3, c.s2, c.ok];
      var shape = mk('path', { d: p, fill: colorsArr[i] || c.s1, 'fill-opacity': 0.72, style: 'cursor:crosshair' });
      shape.addEventListener('mousemove', function () {
        tip(container, cx, y, tipHTML(st.stage, fmtNum(st.value) + (spec.unit || ''),
          (i ? '转化率 ' + (st.value / stages[i - 1].value * 100).toFixed(1) + '%' : '起始阶段') +
          '<div class="tip-meta">' + (spec.meta || '') + '</div>'));
      });
      shape.addEventListener('mouseleave', function () { hideTip(container); });
      g.appendChild(shape);
      g.appendChild(mk('text', { x: px(cx), y: px(y + segH * 0.42), 'text-anchor': 'middle', fill: '#fff', 'font-size': 12, 'font-weight': 600 }, st.stage));
      g.appendChild(mk('text', { x: w - 4, y: px(y + segH * 0.42), 'text-anchor': 'end', fill: c.text2, 'font-size': 12 }, fmtCompact(st.value)));
    });
    svg.appendChild(g);
  }

  /* ------------------------------------------------------------------ 迷你趋势 */
  function spark(container, spec) {
    container.__spec = { fn: 'spark', spec: spec };
    var c = colors(), svg = svgOf(container), s = size(svg);
    clear(svg);
    var w = s.w, h = s.h, vals = spec.values;
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    var X = function (i) { return (w - 2) * i / (vals.length - 1) + 1; };
    var Y = function (v) { return h - 3 - (h - 8) * (v - min) / ((max - min) || 1); };
    var d = '', a = '';
    vals.forEach(function (v, i) { d += (i ? ' L' : 'M') + px(X(i)) + ' ' + px(Y(v)); });
    a = d + ' L' + px(X(vals.length - 1)) + ' ' + h + ' L' + px(X(0)) + ' ' + h + ' Z';
    var gid = 'spark-' + Math.random().toString(36).slice(2, 8);
    var defs = mk('defs');
    var grad = mk('linearGradient', { id: gid, x1: '0', y1: '0', x2: '0', y2: '1' });
    grad.appendChild(mk('stop', { offset: '0%', 'stop-color': c.s1, 'stop-opacity': '0.35' }));
    grad.appendChild(mk('stop', { offset: '100%', 'stop-color': c.s1, 'stop-opacity': '0' }));
    defs.appendChild(grad);
    var g = mk('g');
    g.appendChild(mk('path', { d: a, fill: 'url(#' + gid + ')' }));
    g.appendChild(mk('path', { d: d, fill: 'none', stroke: c.s1, 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
    svg.appendChild(defs); svg.appendChild(g);
  }

  global.Charts = {
    line: line, bars: bars, hbars: hbars, donut: donut,
    scatter: scatter, funnel: funnel, spark: spark,
    fmtNum: fmtNum, fmtCompact: fmtCompact,
    redraw: function (container) {
      if (container && container.__spec) {
        var s = container.__spec;
        if (s.fn === 'donut') { donut(container, s.spec); return; }
        global.Charts[s.fn](container, s.spec);
      }
    }
  };
})(window);
