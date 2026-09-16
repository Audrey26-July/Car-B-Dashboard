/* 车企 B 端数据看板系统 - 高保真演示主程序 */
(function () {
  'use strict';
  var D = window.DashData, C = window.Charts;

  /* ------------------------------------------------------------------ 图标 */
  var P = {
    overview: '<path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z"/>',
    sales: '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-5 3 3 4-6"/>',
    delivery: '<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>',
    capacity: '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>',
    pivot: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16"/>',
    datacenter: '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3"/>',
    metrics: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 16V9M12 16v-4M16 16V7"/>',
    alerts: '<path d="M18 8a6 6 0 10-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.5 20a2 2 0 003 0"/>',
    subscribe: '<path d="M4 6h16v12H4z"/><path d="M4 7l8 6 8-6"/>',
    permissions: '<path d="M12 3l7 3v6c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V6z"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/>',
    audit: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    tenant: '<path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M10 21v-6h4v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    bell: '<path d="M18 8a6 6 0 10-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.5 20a2 2 0 003 0"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>',
    theme: '<circle cx="12" cy="12" r="4.2"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"/>',
    bigscreen: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    download: '<path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M5 20h14"/>',
    refresh: '<path d="M20 11a8 8 0 10-2.3 6.1"/><path d="M20 5v6h-6"/>',
    play: '<path d="M7 5l12 7-12 7z"/>',
    check: '<path d="M5 13l4 4 10-11"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
    chevron: '<path d="M9 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/>',
    car: '<path d="M4 15l1.6-4.4A2 2 0 017.5 9h9a2 2 0 011.9 1.6L20 15v4h-3v-2H7v2H4z"/><circle cx="7.5" cy="15" r="1"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/>',
    box: '<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4"/><path d="M12 12v8"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4.4l3 1.8"/>',
    info: '<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 8.2v.2"/>',
    user: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"/>',
    collapse: '<path d="M15 6l-6 6 6 6"/>',
    save: '<path d="M5 4h11l3 3v13H5z"/><path d="M9 4v5h6V4"/><path d="M9 20v-6h6v6"/>'
  };
  function icon(name, cls) {
    return '<span class="' + (cls || 'nav-ico') + '" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (P[name] || '') + '</svg></span>';
  }

  /* ------------------------------------------------------------------ 状态 */
  var ALL = '全部';
  var state = {
    page: 'overview',
    theme: 'dark',
    bigscreen: false,
    collapsed: false,
    period: 'month',
    dim: '地区',
    filters: { region: ALL, city: ALL, store: ALL, series: ALL, band: ALL, seller: ALL },
    drill: [],
    alertStatus: {},
    taskStatus: {},
    dictDone: {},
    pivotRows: ['地区'],
    pivotValues: ['sales', 'amount', 'completion', 'delivery'],
    saved: false
  };
  D.alerts.forEach(function (a) { state.alertStatus[a.id] = { status: a.status, note: a.note }; });
  D.tasks.forEach(function (t) { state.taskStatus[t.id] = t.status; });

  var VALUE_DEFS = [
    { key: 'sales', name: '销量', unit: '台' },
    { key: 'amount', name: '成交金额', unit: '万元' },
    { key: 'deals', name: '成交次数', unit: '笔' },
    { key: 'completion', name: '完成率', unit: '%' },
    { key: 'delivery', name: '即时交付率', unit: '%' },
    { key: 'complaints', name: '客诉', unit: '件' },
    { key: 'stockouts', name: '缺货次数', unit: '次' }
  ];

  function q() { return D.query({ period: state.period, dim: state.dim, filters: state.filters }); }

  /* ------------------------------------------------------------------ 工具 */
  function tipMeta(d) {
    return '数据截止 ' + d.batch.cutoff + ' · 批次 ' + d.batch.id + '<br>口径版本 ' + d.metricVersion;
  }
  function n(v, dg) { return C.fmtNum(v, dg === undefined ? 0 : dg); }
  function pct(v, dg) { return C.fmtNum(v, dg === undefined ? 1 : dg) + '%'; }
  function yi(v) { return (v / 10000).toFixed(2) + ' 亿'; }
  function delta(v, goodWhenDown) {
    var up = v >= 0;
    var cls = (goodWhenDown ? !up : up) ? 'up' : 'down';
    return '<span class="' + cls + '">' + (up ? '+' : '') + v.toFixed(1) + '%</span>';
  }
  function toneOf(ratio, bands) {
    var b = bands || [95, 90];
    if (ratio >= b[0]) return 'ok';
    if (ratio >= b[1]) return 'warn';
    return 'risk';
  }
  function chip(tone, text) { return '<span class="badge ' + tone + '"><i></i>' + text + '</span>'; }

  function toast(title, body) {
    var box = document.getElementById('toasts');
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<div>' + icon('info', '') + '</div><div><b>' + title + '</b><span>' + (body || '') + '</span></div>';
    box.appendChild(el);
    setTimeout(function () { el.remove(); }, 4200);
  }

  function modal(title, bodyHTML, footerHTML) {
    var mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.setAttribute('role', 'dialog');
    mask.setAttribute('aria-modal', 'true');
    mask.setAttribute('aria-label', title);
    mask.innerHTML = '<div class="modal"><header>' + icon('info', '') + '<h3>' + title + '</h3></header>' +
      '<div class="body">' + bodyHTML + '</div>' +
      (footerHTML ? '<footer>' + footerHTML + '</footer>' : '') + '</div>';
    mask.addEventListener('click', function (e) { if (e.target === mask) mask.remove(); });
    document.body.appendChild(mask);
    var close = mask.querySelector('[data-close]');
    if (close) close.addEventListener('click', function () { mask.remove(); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { mask.remove(); document.removeEventListener('keydown', esc); }
    });
    return mask;
  }

  /* ------------------------------------------------------------------ 导航 */
  var NAV = [
    { group: '总览', items: [
      { id: 'overview', name: '经营总览', icon: 'overview' },
      { id: 'sales', name: '销售分析', icon: 'sales' },
      { id: 'delivery', name: '交付与服务', icon: 'delivery' },
      { id: 'capacity', name: '产能分析', icon: 'capacity' },
      { id: 'pivot', name: '多维分析', icon: 'pivot' }
    ] },
    { group: '数据', items: [
      { id: 'datacenter', name: '数据中心', icon: 'datacenter', badge: 'tasks' },
      { id: 'metrics', name: '指标中心', icon: 'metrics' }
    ] },
    { group: '运营', items: [
      { id: 'alerts', name: '预警中心', icon: 'alerts', badge: 'alerts' },
      { id: 'subscriptions', name: '订阅管理', icon: 'subscribe' }
    ] },
    { group: '系统', items: [
      { id: 'permissions', name: '权限管理', icon: 'permissions' },
      { id: 'audit', name: '审计日志', icon: 'audit' },
      { id: 'tenant', name: '租户设置', icon: 'tenant' }
    ] }
  ];

  function failedTasks() { return D.tasks.filter(function (t) { return state.taskStatus[t.id] === '失败'; }).length; }
  function openAlerts() {
    return D.alerts.filter(function (a) { return (state.alertStatus[a.id] || {}).status === '待处理'; }).length;
  }
  function navHTML() {
    return NAV.map(function (g) {
      return '<div class="nav-group"><p>' + g.group + '</p>' + g.items.map(function (it) {
        var badge = '';
        if (it.badge === 'alerts' && openAlerts()) badge = '<span class="nav-badge" data-level="risk">' + openAlerts() + '</span>';
        if (it.badge === 'tasks' && failedTasks()) badge = '<span class="nav-badge" data-level="warn">' + failedTasks() + '</span>';
        return '<button class="nav-item" data-act="nav" data-val="' + it.id + '"' +
          (state.page === it.id ? ' aria-current="page"' : '') + ' aria-label="' + it.name + '">' +
          icon(it.icon) + '<span class="nav-label">' + it.name + '</span>' + badge + '</button>';
      }).join('') + '</div>';
    }).join('');
  }

  /* ------------------------------------------------------------------ 顶栏 */
  function topbarHTML(d) {
    return '<div class="search">' + icon('search', '') +
      '<input id="global-search" type="search" placeholder="搜索指标、大区、门店或销售员" aria-label="全局搜索">' +
      '</div>' +
      '<div class="trust">' +
      '<span class="trust-chip ok"><i class="dot"></i>数据截止 <b>' + d.batch.cutoff + '</b></span>' +
      '<span class="trust-chip">批次 <b>' + d.batch.id + '</b></span>' +
      '<span class="trust-chip">口径 <b>' + d.metricVersion + '</b></span>' +
      '<button class="icon-btn" data-act="notify" aria-label="消息通知，' + openAlerts() + ' 条未处理预警">' + icon('bell', '') + (openAlerts() ? '<span class="dot"></span>' : '') + '</button>' +
      '<button class="icon-btn" data-act="reset" aria-label="恢复最初状态">' + icon('reset', '') + '</button>' +
      '<button class="icon-btn" data-act="theme" aria-label="切换深色 / 浅色主题">' + icon('theme', '') + '</button>' +
      '<button class="icon-btn" data-act="bigscreen" aria-label="切换大屏模式">' + icon('bigscreen', '') + '</button>' +
      '<button class="account" data-act="account" aria-label="账户中心">' +
      '<span class="avatar" aria-hidden="true">王</span><span>王海 <em>· 集团管理层</em></span></button>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ 筛选区 */
  function optionsHTML(list, current, key) {
    return list.map(function (v) {
      return '<option value="' + v + '"' + (v === current ? ' selected' : '') + '>' + v + '</option>';
    }).join('');
  }
  function filterHTML(d) {
    var activeCount = Object.keys(state.filters).filter(function (k) { return state.filters[k] !== ALL; }).length;
    var crumb = state.drill.length
      ? '<div class="crumb">' + '<button data-act="drill-reset">全集团</button>' + state.drill.map(function (c, i) {
        return '<span>›</span><button data-act="drill-back" data-idx="' + i + '">' + c.label + '：' + c.value + '</button>';
      }).join('') + '</div>'
      : '';
    return '<div class="filter-bar" role="group" aria-label="筛选控制区">' +
      '<span class="filter-label">时间口径</span>' +
      '<div class="seg" role="group" aria-label="时间口径">' +
      '<button data-act="period" data-val="month" aria-pressed="' + (state.period === 'month') + '">本月</button>' +
      '<button data-act="period" data-val="quarter" aria-pressed="' + (state.period === 'quarter') + '">本季</button>' +
      '</div>' +
      '<span class="filter-label">地区</span><select class="select" data-filter="region" aria-label="地区筛选">' + optionsHTML([ALL].concat(D.REGIONS), state.filters.region) + '</select>' +
      '<span class="filter-label">车系</span><select class="select" data-filter="series" aria-label="车系筛选">' + optionsHTML([ALL].concat(D.SERIES), state.filters.series) + '</select>' +
      '<span class="filter-label">车价区间</span><select class="select" data-filter="band" aria-label="车价区间筛选">' + optionsHTML([ALL].concat(D.PRICE_BANDS), state.filters.band) + '</select>' +
      '<span class="filter-label">门店</span><select class="select" data-filter="store" aria-label="门店筛选">' + optionsHTML([ALL].concat(D.STORES), state.filters.store) + '</select>' +
      '<div class="filter-tail"><span>已选 ' + activeCount + ' 个条件</span><button data-act="filter-clear">清除全部</button></div>' +
      '</div>' + crumb;
  }

  /* ------------------------------------------------------------------ 组件块 */
  function card(o) {
    return '<section class="card ' + (o.cls || '') + '">' +
      '<div class="card-head"><h3>' + o.title + '</h3>' +
      (o.sub ? '<span class="sub">' + o.sub + '</span>' : '') +
      (o.tools ? '<div class="card-tools">' + o.tools + '</div>' : '') + '</div>' +
      '<div class="card-body">' + o.body + '</div></section>';
  }
  function chartBox(id, height) {
    return '<div class="chart" id="' + id + '" style="height:' + height + 'px"></div>';
  }
  function kpiCard(o) {
    var tone = o.tone || 'ok';
    return '<article class="kpi' + (o.big ? '' : ' kpi-sm') + '" style="--tint:var(--c-' + (o.tint || 's1') + ')">' +
      '<div class="kpi-top">' + icon(o.icon, 'kpi-ico') + '<span class="kpi-name" data-metric="' + (o.metricId || '') + '">' + o.name + '</span></div>' +
      '<div class="kpi-mid"><span class="kpi-value">' + o.value + (o.unit ? '<small>' + o.unit + '</small>' : '') + '</span>' +
      chip(tone, o.chipText) + '</div>' +
      '<div class="kpi-foot">' + o.foot + '</div>' +
      (o.spark ? '<div class="kpi-spark" id="' + o.spark + '"></div>' : '') +
      '<div class="kpi-bar"><i style="width:' + Math.max(4, Math.min(100, o.ratio)) + '%"></i></div>' +
      '</article>';
  }

  function overviewKpis(d) {
    var k = d.kpi;
    var comp = k.completion, del = k.delivery;
    var salesRatio = k.target ? k.sales / k.target * 100 : 0;
    var amountTarget = d.periodLabel === '本季累计' ? 234500 : 82000;
    var amountRatio = k.amount / amountTarget * 100;
    var limitStock = d.periodLabel === '本季累计' ? 90 : 30;
    var limitComp = d.periodLabel === '本季累计' ? 180 : 60;
    var out = [];
    out.push(kpiCard({
      name: '完成率', metricId: 'M04', icon: 'target', tint: 's1', big: true,
      value: pct(comp), ratio: comp, tone: toneOf(comp),
      chipText: comp >= 95 ? '达标' : comp >= 90 ? '接近' : '风险',
      foot: '环比 ' + delta(-1.4) + ' · 目标 ' + n(k.target) + ' 台 · 达成 ' + pct(comp),
      spark: 'spark-completion'
    }));
    out.push(kpiCard({
      name: '月成交金额', metricId: 'M11', icon: 'cash', tint: 's2', big: true,
      value: yi(k.amount), ratio: amountRatio, tone: toneOf(amountRatio),
      chipText: amountRatio >= 95 ? '达标' : amountRatio >= 90 ? '接近' : '风险',
      foot: '同比 ' + delta(k.salesYoy * 0.72) + ' · 目标 ' + yi(amountTarget)
    }));
    out.push(kpiCard({
      name: d.periodLabel === '本季累计' ? '季销量' : '月销量', metricId: 'M08', icon: 'car', tint: 's1',
      value: n(k.sales), unit: '台', ratio: salesRatio, tone: toneOf(salesRatio),
      chipText: salesRatio >= 95 ? '达标' : salesRatio >= 90 ? '接近' : '风险',
      foot: '同比 ' + delta(k.salesYoy) + ' · 环比 ' + delta(k.salesMom) + ' · 目标 ' + n(k.target)
    }));
    out.push(kpiCard({
      name: '即时交付率', metricId: 'M01', icon: 'delivery', tint: 's3',
      value: pct(del), ratio: del / 95 * 100, tone: toneOf(del / 95 * 100, [100, 98]),
      chipText: del >= 95 ? '达标' : del >= 93 ? '预警' : '风险',
      foot: '环比 ' + delta(del - 94.6, true) + ' · 目标 ≥ 95%'
    }));
    out.push(kpiCard({
      name: d.periodLabel === '本季累计' ? '当季缺货次数' : '当月缺货次数', metricId: 'M03', icon: 'box', tint: 'warn',
      value: n(k.stockouts), unit: '次', ratio: k.stockouts / limitStock * 100,
      tone: k.stockouts / limitStock <= 0.8 ? 'ok' : k.stockouts / limitStock <= 1.1 ? 'warn' : 'risk',
      chipText: k.stockouts / limitStock <= 0.8 ? '正常' : k.stockouts / limitStock <= 1.1 ? '预警' : '风险',
      foot: '环比 ' + delta(12.4, true) + ' · 阈值 ≤ ' + limitStock + ' 次'
    }));
    out.push(kpiCard({
      name: d.periodLabel === '本季累计' ? '当季客诉' : '当月客诉', metricId: 'M02', icon: 'bell', tint: 'risk',
      value: n(k.complaints), unit: '件', ratio: k.complaints / limitComp * 100,
      tone: k.complaints / limitComp <= 0.8 ? 'ok' : k.complaints / limitComp <= 1.1 ? 'warn' : 'risk',
      chipText: k.complaints / limitComp <= 0.8 ? '正常' : k.complaints / limitComp <= 1.1 ? '预警' : '风险',
      foot: '同比 ' + delta(-8.2, true) + ' · 阈值 ≤ ' + limitComp + ' 件'
    }));
    return '<div class="kpi-row">' + out.join('') + '</div>';
  }

  function detailTable(d) {
    var key = state.dim;
    var head = [key, '销量（台）', '成交金额（万元）', '完成率', '即时交付率', '客诉（件）', '缺货（次）'];
    var rows = d.rank.slice(0, 12).map(function (r) {
      var ratio = r.completion;
      var tone = ratio >= 100 ? 'var(--c-ok)' : ratio >= 90 ? 'var(--c-s1)' : 'var(--c-warn)';
      return '<tr><td>' + r.name + '</td><td>' + n(r.sales) + '</td><td>' + n(r.amount) + '</td>' +
        '<td><div class="cellbar"><span>' + pct(ratio) + '</span><span class="track"><i style="width:' + Math.min(100, ratio) + '%;background:' + tone + '"></i></span></div></td>' +
        '<td>' + pct(r.delivery) + '</td><td>' + n(r.complaints) + '</td><td>' + n(r.stockouts) + '</td></tr>';
    }).join('');
    var total = d.rank.reduce(function (a, r) {
      ['sales', 'amount', 'complaints', 'stockouts'].forEach(function (k) { a[k] += r[k]; });
      return a;
    }, { sales: 0, amount: 0, complaints: 0, stockouts: 0 });
    return '<div class="table-wrap"><table class="data"><caption class="sr-only">按当前分析维度展开的明细数据</caption>' +
      '<thead><tr>' + head.map(function (h) { return '<th scope="col">' + h + '</th>'; }).join('') + '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '<tfoot><tr><td>合计</td><td>' + n(total.sales) + '</td><td>' + n(total.amount) + '</td><td>' + pct(d.kpi.completion) + '</td>' +
      '<td>' + pct(d.kpi.delivery) + '</td><td>' + n(total.complaints) + '</td><td>' + n(total.stockouts) + '</td></tr></tfoot></table></div>';
  }

  /* ------------------------------------------------------------------ 页面：经营总览 */
  function pageOverview(d) {
    var dimSeg = ['地区', '销售员', '门店', '车系'].map(function (x) {
      return '<button data-act="dim" data-val="' + x + '" aria-pressed="' + (state.dim === x) + '">' + x + '</button>';
    }).join('');
    var deep = state.drill.length >= 3;
    return filterHTML(d) + overviewKpis(d) +
      '<div class="grid" style="margin-bottom:' + 'var(--gap)' + '">' +
      card({
        cls: 'span-6', title: '销量与交付率趋势',
        sub: (state.period === 'quarter' ? '近 12 个月' : '近 10 周') + ' · 预聚合',
        tools: '<button class="btn btn-sm" data-act="export">' + icon('download', '') + '导出</button>',
        body: chartBox('chart-trend', 262) +
          '<div class="legend" style="margin-top:10px"><span><i style="background:var(--c-s1)"></i>销量（台）</span>' +
          '<span><i style="background:var(--c-s2)"></i>即时交付率（右轴 %）</span>' +
          '<span><i style="background:var(--c-warn)"></i>销量目标</span></div>'
      }) +
      card({
        cls: 'span-6', title: '成交金额占比', sub: '按' + state.dim + ' · 单位 万元',
        body: '<div class="donut-wrap"><div class="donut-box"><div class="chart" id="chart-donut" style="height:150px"></div></div>' +
          '<ul class="donut-list" id="donut-list"></ul></div>'
      }) +
      card({
        cls: 'span-4', title: '成交价区间分布', sub: '横轴 万元 · 纵向 台',
        body: chartBox('chart-dist', 240) +
          '<div class="legend" style="margin-top:10px"><span><i class="sq" style="background:var(--c-s1)"></i>价格带销量</span>' +
          '<span><i class="sq" style="background:var(--c-s2)"></i>峰值价格带</span></div>'
      }) +
      card({
        cls: 'span-8', title: '销量排行 · 按' + state.dim, sub: 'Top 6 · 单位 台',
        tools: '<button class="btn btn-sm" data-act="order-detail">' + icon('pivot', '') + (deep ? '订单明细' : '下钻') + '</button>',
        body: chartBox('chart-rank', 240) +
          '<div class="legend" style="margin-top:10px"><span><i class="sq" style="background:var(--c-s1)"></i>完成率达标</span>' +
          '<span><i class="sq" style="background:var(--c-warn)"></i>完成率低于 90%</span>' +
          '<span style="color:var(--c-text3)">点击柱条可下钻</span></div>'
      }) +
      '</div>' +
      card({
        cls: 'span-12', title: '多维明细',
        sub: '同屏 KPI、图表与明细来自同一次查询 · 批次 ' + d.batch.id,
        tools: '<div class="seg" role="group" aria-label="明细行维度">' + dimSeg + '</div>' +
          '<button class="btn btn-sm" data-act="exportExcel">' + icon('download', '') + 'Excel</button>',
        body: detailTable(d)
      });
  }

  function mountOverview(d) {
    var trend = d.trend;
    C.line(document.getElementById('chart-trend'), {
      labels: trend.map(function (t) { return t.label; }),
      series: [
        { name: '销量', values: trend.map(function (t) { return t.sales; }), color: 'var(--c-s1)', type: 'area', unit: ' 台' },
        { name: '即时交付率', values: trend.map(function (t) { return t.delivery; }), color: 'var(--c-s2)', axis: 'right', digits: 1, unit: '%', dashed: true }
      ],
      rightAxis: true,
      target: d.kpi.target,
      meta: '口径 M08 月销量 · ' + d.batch.id
    });
    C.bars(document.getElementById('chart-dist'), {
      items: d.priceBins.map(function (b) { return { label: b.label, value: b.value }; }),
      unit: ' 台', meta: '口径 M08 销量 · 分箱边界可配置'
    });
    var palette = C.donut(document.getElementById('chart-donut'), {
      items: d.donut, centerValue: yi(d.kpi.amount).replace(' 亿', ''), centerLabel: '亿元成交',
      meta: '口径 M11 月成交金额'
    });
    var total = d.donut.reduce(function (a, x) { return a + x.value; }, 0);
    document.getElementById('donut-list').innerHTML = d.donut.map(function (x, i) {
      return '<li><i style="background:' + palette[i % palette.length] + '"></i><span>' + x.name + '</span>' +
        '<b>' + n(x.value) + '</b><u>' + (x.value / total * 100).toFixed(1) + '%</u></li>';
    }).join('');
    C.hbars(document.getElementById('chart-rank'), {
      items: d.rank.slice(0, 6).map(function (r) {
        return { label: r.name, value: r.sales, status: r.completion < 90 ? 'bad' : 'ok', note: '完成率 ' + r.completion.toFixed(1) + '%<br>' };
      }),
      unit: ' 台', meta: '口径 M08 月销量 · 点击柱条下钻',
      onSelect: function (it) { drillInto(it.label); }
    });
    var sparkEl = document.getElementById('spark-completion');
    if (sparkEl) C.spark(sparkEl, { values: trend.map(function (t) { return t.sales; }) });
  }

  /* ------------------------------------------------------------------ 下钻 */
  var DRILL = {
    '地区': { filter: 'region', label: '大区', next: '城市', level: 1 },
    '城市': { filter: 'city', label: '城市', next: '门店', level: 2 },
    '门店': { filter: 'store', label: '门店', next: '销售员', level: 3 },
    '销售员': { filter: 'seller', label: '销售员', next: '车系', level: 4 },
    '车系': { filter: 'series', label: '车系', next: '车系', level: 5 }
  };
  function drillInto(name) {
    var cfg = DRILL[state.dim];
    if (!cfg) return;
    if (cfg.level >= 5) { orderDetail(); return; }
    state.filters[cfg.filter] = name;
    state.drill.push({ label: cfg.label, value: name, filter: cfg.filter });
    state.dim = cfg.next;
    render();
    toast('已下钻到' + cfg.label + '：' + name,
      '分析维度切换为「' + cfg.next + '」；筛选只改变数据范围，维度只改变组织方式。');
  }
  function drillBack(idx) {
    var removed = state.drill.splice(idx);
    removed.forEach(function (r) { state.filters[r.filter] = ALL; });
    var dims = ['地区', '城市', '门店', '销售员', '车系'];
    state.dim = removed.length ? (DRILL[removed[0].label === '大区' ? '地区' : removed[0].label === '城市' ? '城市' : removed[0].label === '门店' ? '门店' : '销售员'].next) : '地区';
    if (state.drill.length === 0) state.dim = '地区';
    render();
  }

  function orderDetail() {
    var d = q();
    var rows = d.rows.slice().sort(function (a, b) { return b.amount - a.amount; }).slice(0, 10);
    var body = '<p style="margin:0 0 12px;color:var(--c-text2);font-size:13px">按当前筛选范围展示成交金额最高的 10 条订单。' +
      '手机号等敏感字段按角色脱敏（F7.2-03）。</p><div class="table-wrap"><table class="data" style="min-width:820px">' +
      '<thead><tr><th>订单号</th><th>门店</th><th>销售员</th><th>车系</th><th>车价（万元）</th><th>成交金额（万元）</th><th>交付状态</th><th>客户手机</th></tr></thead><tbody>' +
      rows.map(function (r, i) {
        return '<tr><td>SO-2026' + String(9100 + i) + '</td><td>' + r.store + '</td><td>' + r.seller + '</td><td>' + r.series +
          '</td><td>' + (r.amount / r.sales).toFixed(1) + '</td><td>' + n(r.amount) + '</td><td>' +
          (r.delivery >= 95 ? '<span class="badge ok">已交付</span>' : r.delivery >= 92 ? '<span class="badge info">交付中</span>' : '<span class="badge warn">延期</span>') +
          '</td><td>138****' + (5621 + i * 37).toString().slice(-4) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    modal('订单明细 · ' + (state.drill.length ? state.drill.map(function (x) { return x.value; }).join(' / ') : '全集团'),
      body, '<button class="btn" data-close>关闭</button>');
  }

  /* ------------------------------------------------------------------ 页面：销售分析 */
  function pageSales(d) {
    var k = d.kpi;
    var kpis = '<div class="kpi-row">' + [
      kpiCard({ name: '月销量', metricId: 'M08', icon: 'car', tint: 's1', big: true, value: n(k.sales), unit: '台',
        ratio: k.sales / k.target * 100, tone: toneOf(k.sales / k.target * 100), chipText: k.sales / k.target >= 0.95 ? '达标' : '接近',
        foot: '同比 ' + delta(k.salesYoy) + ' · 环比 ' + delta(k.salesMom), spark: 'spark-sales' }),
      kpiCard({ name: '月成交金额', metricId: 'M11', icon: 'cash', tint: 's2', big: true, value: yi(k.amount),
        ratio: k.amount / 82000 * 100, tone: toneOf(k.amount / 82000 * 100), chipText: k.amount / 82000 >= 0.95 ? '达标' : '接近',
        foot: '同比 ' + delta(k.salesYoy * 0.72) + ' · 目标 8.20 亿' }),
      kpiCard({ name: '当月成交次数', metricId: 'M10', icon: 'target', tint: 's3', value: n(k.deals), unit: '笔',
        ratio: 96, tone: 'ok', chipText: '达标', foot: '环比 ' + delta(2.6) + ' · 单均 ' + (k.amount / k.deals).toFixed(1) + ' 万元' }),
      kpiCard({ name: '完成率', metricId: 'M04', icon: 'target', tint: 'ok', value: pct(k.completion),
        ratio: k.completion, tone: toneOf(k.completion), chipText: k.completion >= 95 ? '达标' : '接近',
        foot: '环比 ' + delta(-1.4) + ' · 目标 ' + n(k.target) + ' 台' })
    ].join('') + '</div>';
    return filterHTML(d) + kpis +
      '<div class="grid">' +
      card({ cls: 'span-6', title: '销量与成交次数趋势', sub: '预聚合 · 单位 台 / 笔',
        body: chartBox('s-trend', 236) +
          '<div class="legend" style="margin-top:10px"><span><i style="background:var(--c-s1)"></i>销量</span>' +
          '<span><i style="background:var(--c-s3)"></i>成交次数</span></div>' }) +
      card({ cls: 'span-6', title: '线索到交付漏斗', sub: '单位 条 / 笔',
        body: chartBox('s-funnel', 236) }) +
      card({ cls: 'span-6', title: '车价与成交金额关系', sub: '气泡大小 = 销量',
        body: chartBox('s-scatter', 236) }) +
      card({ cls: 'span-6', title: '销售员销量排行', sub: 'Top 6 · 单位 台', tools: '<button class="btn btn-sm" data-act="export">Excel</button>',
        body: chartBox('s-rank', 236) }) +
      card({ cls: 'span-12', title: '销售明细 · 按' + state.dim, sub: '与上方图表同源同快照',
        tools: '<button class="btn btn-sm" data-act="exportExcel">' + icon('download', '') + '导出 Excel</button>',
        body: detailTable(d) }) +
      '</div>';
  }
  function mountSales(d) {
    C.line(document.getElementById('s-trend'), {
      labels: d.trend.map(function (t) { return t.label; }),
      series: [
        { name: '销量', values: d.trend.map(function (t) { return t.sales; }), color: 'var(--c-s1)', type: 'area', unit: ' 台' },
        { name: '成交次数', values: d.trend.map(function (t) { return Math.round(t.sales * 0.966); }), color: 'var(--c-s3)', unit: ' 笔' }
      ],
      target: d.kpi.target, meta: '口径 M08 / M10 · ' + d.batch.id
    });
    C.funnel(document.getElementById('s-funnel'), {
      stages: d.funnel, unit: ' 条', meta: '转化口径：线索→到店→试驾→成交→交付'
    });
    C.scatter(document.getElementById('s-scatter'), {
      points: d.scatter, xLabel: '车价（万元）', yLabel: '成交金额（万元）', meta: '口径 M11 · 气泡大小 = 销量'
    });
    C.hbars(document.getElementById('s-rank'), {
      items: d.byDim['销售员'].slice(0, 6).map(function (r) {
        return { label: r.name, value: r.sales, status: r.completion < 90 ? 'bad' : 'ok', note: '完成率 ' + r.completion.toFixed(1) + '%<br>' };
      }), unit: ' 台', meta: '口径 M08 月销量'
    });
  }

  /* ------------------------------------------------------------------ 页面：交付与服务 */
  function pageDelivery(d) {
    var k = d.kpi;
    var kpis = '<div class="kpi-row">' + [
      kpiCard({ name: '即时交付率', metricId: 'M01', icon: 'delivery', tint: 's1', big: true, value: pct(k.delivery),
        ratio: k.delivery / 95 * 100, tone: toneOf(k.delivery / 95 * 100, [100, 98]), chipText: k.delivery >= 95 ? '达标' : k.delivery >= 93 ? '预警' : '风险',
        foot: '环比 ' + delta(k.delivery - 94.6, true) + ' · 目标 ≥ 95%', spark: 'spark-delivery' }),
      kpiCard({ name: '发货成功率', metricId: 'M05', icon: 'box', tint: 's3', big: true, value: pct(k.shipSuccess),
        ratio: k.shipSuccess / 97 * 100, tone: toneOf(k.shipSuccess / 97 * 100, [100, 98]), chipText: k.shipSuccess >= 97 ? '达标' : '接近',
        foot: '环比 ' + delta(0.6) + ' · 目标 ≥ 97%' }),
      kpiCard({ name: '当月缺货次数', metricId: 'M03', icon: 'box', tint: 'warn', value: n(k.stockouts), unit: '次',
        ratio: k.stockouts / 30 * 100, tone: k.stockouts > 30 ? 'warn' : 'ok', chipText: k.stockouts > 30 ? '预警' : '正常',
        foot: '阈值 ≤ 30 次' }),
      kpiCard({ name: '当月客诉', metricId: 'M02', icon: 'bell', tint: 'risk', value: n(k.complaints), unit: '件',
        ratio: k.complaints / 60 * 100, tone: k.complaints > 60 ? 'warn' : 'ok', chipText: k.complaints > 60 ? '预警' : '正常',
        foot: '阈值 ≤ 60 件' }),
      kpiCard({ name: '客诉结案率', icon: 'check', tint: 'ok', value: pct(k.closedRate),
        ratio: k.closedRate, tone: toneOf(k.closedRate, [85, 75]), chipText: k.closedRate >= 85 ? '达标' : '待提升',
        foot: '超期未结 ' + n(k.overdueTickets) + ' 件' }),
      kpiCard({ name: '超期未结', icon: 'clock', tint: 'risk', value: n(k.overdueTickets), unit: '件',
        ratio: k.overdueTickets / Math.max(1, k.complaints) * 100, tone: 'warn',
        chipText: '需跟进', foot: '占总客诉 ' + (k.overdueTickets / Math.max(1, k.complaints) * 100).toFixed(1) + '%' })
    ].join('') + '</div>';
    return filterHTML(d) + kpis +
      '<div class="grid">' +
      card({ cls: 'span-6', title: '交付率与客诉趋势', sub: '预聚合',
        body: chartBox('d-trend', 236) +
          '<div class="legend" style="margin-top:10px"><span><i style="background:var(--c-s1)"></i>即时交付率（%）</span>' +
          '<span><i style="background:var(--c-s2)"></i>客诉件数</span><span><i style="background:var(--c-risk)"></i>交付率阈值 95%</span></div>' }) +
      card({ cls: 'span-6', title: '交付时长分布', sub: '单位 笔',
        body: chartBox('d-hist', 236) }) +
      card({ cls: 'span-6', title: '客诉原因分布', sub: '单位 件',
        body: chartBox('d-reason', 220) }) +
      card({ cls: 'span-6', title: '缺货次数 · 按大区', sub: '单位 次',
        body: chartBox('d-region', 220) }) +
      card({ cls: 'span-12', title: '交付明细 · 按' + state.dim, sub: '与 KPI、图表同源',
        body: detailTable(d) }) +
      '</div>';
  }
  function mountDelivery(d) {
    var t = d.trend;
    C.line(document.getElementById('d-trend'), {
      labels: t.map(function (x) { return x.label; }),
      series: [
        { name: '即时交付率', values: t.map(function (x) { return x.delivery; }), color: 'var(--c-s1)', digits: 1, unit: '%' },
        { name: '客诉件数', values: t.map(function (x, i) { return Math.max(1, Math.round(d.kpi.complaints * (0.7 + (i % 5) * 0.15))); }), color: 'var(--c-s2)', axis: 'right', unit: ' 件' }
      ],
      rightAxis: true, thresholds: [{ value: 95, label: '阈值 95%' }],
      meta: '口径 M01 / M02 · ' + d.batch.id
    });
    C.bars(document.getElementById('d-hist'), {
      items: d.leadBins, unit: ' 笔', meta: '交付时长 = 订单确认到交付完成的天数'
    });
    C.bars(document.getElementById('d-reason'), {
      items: d.complaintReasons, unit: ' 件', highlightPeak: true, meta: '口径 M02 客诉工单按原因分类'
    });
    C.hbars(document.getElementById('d-region'), {
      items: d.byDim['地区'].slice(0, 6).map(function (r) {
        return { label: r.name, value: r.stockouts, status: r.delivery < 93 ? 'bad' : 'ok', note: '交付率 ' + r.delivery.toFixed(1) + '%<br>' };
      }), unit: ' 次', meta: '口径 M03 缺货次数'
    });
    var sp = document.getElementById('spark-delivery');
    if (sp) C.spark(sp, { values: t.map(function (x) { return x.delivery; }) });
  }

  /* ------------------------------------------------------------------ 页面：产能分析 */
  function pageCapacity() {
    var scope = state.deviceScope || ALL;
    var list = scope === ALL ? D.devices : D.devices.filter(function (x) { return x.name === scope; });
    var util = list.reduce(function (a, x) { return a + x.util * x.count; }, 0) / list.reduce(function (a, x) { return a + x.count; }, 0);
    var hours = list.reduce(function (a, x) { return a + x.hours; }, 0);
    var count = list.reduce(function (a, x) { return a + x.count; }, 0);
    var seg = [ALL].concat(D.devices.map(function (x) { return x.name; })).map(function (x) {
      return '<button data-act="device-scope" data-val="' + x + '" aria-pressed="' + (scope === x) + '">' + x + '</button>';
    }).join('');
    var kpis = '<div class="kpi-row">' + [
      kpiCard({ name: '设备使用率', metricId: 'M06', icon: 'capacity', tint: 's1', big: true, value: pct(util * 100),
        ratio: util * 100 / 80 * 100, tone: util * 100 >= 75 ? 'ok' : util * 100 >= 70 ? 'warn' : 'risk',
        chipText: util * 100 >= 75 ? '达标' : util * 100 >= 70 ? '接近' : '风险',
        foot: '环比 ' + delta(1.8) + ' · 目标 ≥ 75%', spark: 'spark-device' }),
      kpiCard({ name: '可用时长', icon: 'clock', tint: 's3', big: true, value: n(hours), unit: 'h',
        ratio: 88, tone: 'ok', chipText: '正常', foot: '统计周期内累计可用时长' }),
      kpiCard({ name: '设备台数', icon: 'box', tint: 's2', value: n(count), unit: '台', ratio: 100, tone: 'ok', chipText: '已接入', foot: '覆盖 ' + list.length + ' 类设备' }),
      kpiCard({ name: '稼动台次', icon: 'target', tint: 'ok', value: n(Math.round(hours * 0.86)), unit: '次',
        ratio: 92, tone: 'ok', chipText: '正常', foot: '单台日均 4.2 次' })
    ].join('') + '</div>';
    return '<div class="filter-bar" role="group" aria-label="设备范围筛选">' +
      '<span class="filter-label">设备范围</span><div class="seg">' + seg + '</div>' +
      '<div class="filter-tail"><span>口径 M06 v1.0 · 待客户确认设备清单</span></div></div>' + kpis +
      '<div class="grid">' +
      card({ cls: 'span-6', title: '各设备类型使用率', sub: '单位 %', body: chartBox('c-bars', 236) }) +
      card({ cls: 'span-6', title: '使用率分布', sub: '按设备台数统计 · 单位 台', body: chartBox('c-hist', 236) }) +
      card({ cls: 'span-12', title: '设备清单', sub: '设备名称 / 台数 / 可用时长 / 使用率',
        body: '<div class="table-wrap"><table class="data" style="min-width:720px"><thead><tr><th>设备类型</th><th>台数</th><th>可用时长（h）</th><th>有效使用时长（h）</th><th>使用率</th><th>状态</th></tr></thead><tbody>' +
          list.map(function (x) {
            var u = x.util * 100;
            return '<tr><td>' + x.name + '</td><td>' + x.count + '</td><td>' + n(x.hours) + '</td><td>' + n(Math.round(x.hours * x.util)) +
              '</td><td><div class="cellbar"><span>' + u.toFixed(1) + '%</span><span class="track"><i style="width:' + u + '%;background:' + (u >= 75 ? 'var(--c-ok)' : u >= 70 ? 'var(--c-s1)' : 'var(--c-warn)') + '"></i></span></div></td>' +
              '<td>' + (u >= 75 ? '<span class="badge ok">达标</span>' : u >= 70 ? '<span class="badge info">接近目标</span>' : '<span class="badge warn">待提升</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' }) +
      '</div>';
  }
  function mountCapacity() {
    var scope = state.deviceScope || ALL;
    var list = scope === ALL ? D.devices : D.devices.filter(function (x) { return x.name === scope; });
    C.bars(document.getElementById('c-bars'), {
      items: list.map(function (x) { return { label: x.name, value: Math.round(x.util * 100), note: x.count + ' 台<br>' }; }),
      unit: '%', meta: '口径 M06 设备使用率'
    });
    var bins = [['<50%', 0], ['50–60%', 0], ['60–70%', 0], ['70–80%', 0], ['80–90%', 0], ['≥90%', 0]];
    list.forEach(function (x) {
      var u = x.util * 100;
      bins[u < 50 ? 0 : u < 60 ? 1 : u < 70 ? 2 : u < 80 ? 3 : u < 90 ? 4 : 5][1] += x.count;
    });
    C.bars(document.getElementById('c-hist'), {
      items: bins.map(function (b) { return { label: b[0], value: b[1] }; }), unit: ' 台', meta: '按设备台数分布'
    });
    var sp = document.getElementById('spark-device');
    if (sp) C.spark(sp, { values: [68, 70, 69, 72, 74, 73, 75, 76, 74, 77] });
  }

  /* ------------------------------------------------------------------ 页面：数据中心 */
  function pageDatacenter() {
    var tasks = D.tasks;
    var failed = tasks.filter(function (t) { return state.taskStatus[t.id] === '失败'; });
    var pending = D.dictPending.filter(function (_, i) { return !state.dictDone[i]; });
    return '<div class="grid" style="margin-bottom:var(--gap)">' +
      card({ cls: 'span-12', title: '数据接入概览', sub: '批次 ' + D.tasks[0].batch + ' · 数据截止 2026-09-13 23:59',
        body: '<div class="stat-strip">' +
          '<div><span>任务总数</span><b>' + tasks.length + '</b></div>' +
          '<div><span>成功</span><b style="color:var(--c-ok)">' + (tasks.length - failed.length) + '</b></div>' +
          '<div><span>失败</span><b style="color:' + (failed.length ? 'var(--c-risk)' : 'var(--c-ok)') + '">' + failed.length + '</b></div>' +
          '<div><span>字典待处理</span><b style="color:' + (pending.length ? 'var(--c-warn)' : 'var(--c-ok)') + '">' + pending.length + '</b></div>' +
          '<div><span>数据新鲜度</span><b style="font-size:16px">' + (failed.length ? '存在延迟' : '正常') + '</b></div>' +
          '</div>' }) +
      '</div>' +
      '<div class="grid">' +
      card({ cls: 'span-12', title: '任务运行列表', sub: '重跑后状态与左侧导航的失败数会立即更新',
        body: '<div class="table-wrap"><table class="data" style="min-width:1000px"><thead><tr><th>任务</th><th>数据源</th><th>调度</th><th>批次</th><th>抽取行数</th><th>耗时</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
          tasks.map(function (t) {
            var st = state.taskStatus[t.id];
            var badge = st === '成功' ? '<span class="badge ok">成功</span>' : st === '失败' ? '<span class="badge risk">失败</span>' : '<span class="badge info">重跑中</span>';
            return '<tr><td>' + t.name + '<div style="color:var(--c-text3);font-size:12px">' + t.id + '</div></td>' +
              '<td>' + t.source + '</td><td>' + t.schedule + '</td><td>' + t.batch + '</td>' +
              '<td>' + (st === '失败' ? '—' : n(t.rows)) + '</td><td>' + (st === '失败' ? '—' : t.cost) + '</td>' +
              '<td>' + badge + (t.error && st === '失败' ? '<div style="color:var(--c-risk);font-size:12px;white-space:normal;max-width:220px">' + t.error + '</div>' : '') + '</td>' +
              '<td>' + (st === '失败' ? '<button class="btn btn-sm btn-primary" data-act="task-retry" data-id="' + t.id + '">' + icon('refresh', '') + '重跑</button>' : '<span style="color:var(--c-text3)">—</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' }) +
      card({ cls: 'span-7', title: '数据量趋势', sub: '各数据源每周抽取行数 · 单位 行',
        body: chartBox('dc-trend', 236) }) +
      card({ cls: 'span-5', title: '字典待处理清单', sub: '未映射的地区 / 门店 / 车系 / 销售员',
        body: pending.length ? '<div class="table-wrap"><table class="data" style="min-width:520px"><thead><tr><th>源值</th><th>字段</th><th>建议映射</th><th>操作</th></tr></thead><tbody>' +
          D.dictPending.map(function (x, i) {
            if (state.dictDone[i]) return '';
            return '<tr><td>' + x.raw + '</td><td>' + x.field + '</td><td>' + x.suggest + '</td>' +
              '<td><button class="btn btn-sm" data-act="dict-resolve" data-idx="' + i + '">确认</button></td></tr>';
          }).join('') + '</tbody></table></div>' +
          '<div class="panel-note">确认后该值将写入标准字典，后续批次自动映射（F4.4-05）。</div>'
          : '<div class="empty" style="padding:32px 12px">' + icon('check', 'ico') + '<h3>字典已全部映射</h3><p>当前批次没有待处理的字典项。</p></div>' }) +
      '</div>';
  }
  function mountDatacenter() {
    C.line(document.getElementById('dc-trend'), {
      labels: ['W33', 'W34', 'W35', 'W36', 'W37'],
      series: [
        { name: 'DMS 订单', values: [121400, 124880, 126300, 127150, 128460], color: 'var(--c-s1)', type: 'area', unit: ' 行' },
        { name: 'CRM 客诉', values: [5820, 5940, 6020, 6088, 6128], color: 'var(--c-s2)', unit: ' 行' },
        { name: 'TMS 发运', values: [88600, 90120, 91540, 93010, 94217], color: 'var(--c-s3)', unit: ' 行' }
      ],
      meta: '数据量波动超过 20% 会触发质量告警'
    });
  }

  /* ------------------------------------------------------------------ 页面：指标中心 */
  function pageMetrics() {
    return '<div class="grid" style="margin-bottom:var(--gap)">' +
      card({ cls: 'span-12', title: '指标注册表', sub: '口径一经确认即冻结版本，历史看板按生效期解释',
        tools: '<button class="btn btn-sm" data-act="target-maintain">' + icon('target', '') + '目标值维护</button>' +
          '<button class="btn btn-sm" data-act="metric-new">' + icon('plus', '') + '新建指标</button>',
        body: '<div class="table-wrap"><table class="data" style="min-width:1080px"><thead><tr><th>编号</th><th>指标名称</th><th>单位</th><th>负责人</th><th>口径版本</th><th>数据血缘</th><th>可见性</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
          D.metrics.map(function (m) {
            return '<tr><td>' + m.id + '</td><td>' + m.name + '</td><td>' + m.unit + '</td><td>' + m.owner + '</td>' +
              '<td>' + m.version + '</td><td style="text-align:left;color:var(--c-text3);font-size:12px">' + m.lineage + '</td>' +
              '<td style="text-align:left;font-size:12px">' + m.visible + '</td>' +
              '<td>' + (m.status === '生效中' ? '<span class="badge ok">生效中</span>' : '<span class="badge warn">' + m.status + '</span>') + '</td>' +
              '<td><button class="btn btn-sm" data-act="metric-detail" data-id="' + m.id + '">查看口径</button></td></tr>';
          }).join('') + '</tbody></table></div>' }) +
      '</div>';
  }

  /* ------------------------------------------------------------------ 页面：预警中心 */
  function pageAlerts() {
    var rows = D.alerts.map(function (a) {
      var st = (state.alertStatus[a.id] || {}).status || '待处理';
      var note = (state.alertStatus[a.id] || {}).note || '';
      var badge = st === '待处理' ? '<span class="badge risk">待处理</span>' : st === '处理中' ? '<span class="badge warn">处理中</span>' : '<span class="badge ok">已关闭</span>';
      return '<tr><td>' + a.id + '</td><td>' + a.metric + '<div style="color:var(--c-text3);font-size:12px">' + a.scope + '</div></td>' +
        '<td>' + a.value + '</td><td style="text-align:left;font-size:12px">' + a.threshold + '</td><td>' + a.time + '</td>' +
        '<td>' + badge + (note ? '<div style="color:var(--c-text3);font-size:12px;white-space:normal;max-width:220px">' + note + '</div>' : '') + '</td>' +
        '<td><select class="select" style="min-width:110px;height:30px" data-alert-status="' + a.id + '" aria-label="处理状态">' +
        ['待处理', '处理中', '已关闭'].map(function (s) { return '<option' + (s === st ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
        '</select> <button class="btn btn-sm" data-act="alert-note" data-id="' + a.id + '">备注</button></td></tr>';
    }).join('');
    return '<div class="grid" style="margin-bottom:var(--gap)">' +
      card({ cls: 'span-12', title: '预警概览', sub: '未处理预警数实时同步到左侧导航',
        body: '<div class="stat-strip">' +
          '<div><span>待处理</span><b style="color:var(--c-risk)">' + openAlerts() + '</b></div>' +
          '<div><span>处理中</span><b style="color:var(--c-warn)">' + D.alerts.filter(function (a) { return (state.alertStatus[a.id] || {}).status === '处理中'; }).length + '</b></div>' +
          '<div><span>已关闭</span><b style="color:var(--c-ok)">' + D.alerts.filter(function (a) { return (state.alertStatus[a.id] || {}).status === '已关闭'; }).length + '</b></div>' +
          '<div><span>启用规则</span><b>' + D.alertRules.filter(function (r) { return r.enabled; }).length + '</b></div>' +
          '</div>' }) +
      '</div>' +
      '<div class="grid">' +
      card({ cls: 'span-12', title: '预警记录', sub: '处理状态变更后左侧导航角标立即更新',
        body: '<div class="table-wrap"><table class="data" style="min-width:1080px"><thead><tr><th>记录号</th><th>指标 / 范围</th><th>当前值</th><th>触发条件</th><th>触发时间</th><th>状态 / 备注</th><th>处理</th></tr></thead><tbody>' + rows + '</tbody></table></div>' }) +
      card({ cls: 'span-12', title: '预警规则', sub: '阈值 / 比较方向 / 周期 / 生效范围 · 同一异常 24 小时内只提醒一次',
        body: '<div class="table-wrap"><table class="data" style="min-width:880px"><thead><tr><th>规则</th><th>指标</th><th>触发条件</th><th>生效范围</th><th>通知渠道</th><th>去重窗口</th><th>状态</th></tr></thead><tbody>' +
          D.alertRules.map(function (r) {
            return '<tr><td>' + r.id + '</td><td>' + r.metric + '</td><td>' + r.cond + '</td><td>' + r.scope + '</td>' +
              '<td>' + r.channel + '</td><td>' + r.window + '</td><td>' +
              (r.enabled ? '<span class="badge ok"><i></i>启用</span>' : '<span class="badge neutral"><i></i>停用</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' }) +
      '</div>';
  }

  /* ------------------------------------------------------------------ 页面：订阅管理 */
  function pageSubscriptions() {
    return card({ cls: 'span-12', title: '订阅管理', sub: '邮件 / 企业微信 / 钉钉 · 短信为可选项',
      tools: '<button class="btn btn-sm btn-primary" data-act="sub-add">' + icon('plus', '') + '新建订阅</button>',
      body: '<div class="table-wrap"><table class="data" style="min-width:900px"><thead><tr><th>名称</th><th>订阅内容</th><th>频率</th><th>渠道</th><th>接收人</th><th>状态</th><th>操作</th></tr></thead><tbody>' +
        D.subscriptions.map(function (s) {
          return '<tr><td>' + s.name + '</td><td>' + s.target + '</td><td>' + s.freq + '</td><td>' + s.channel + '</td>' +
            '<td style="text-align:left">' + s.receivers + '</td>' +
            '<td>' + (s.status === '启用' ? '<span class="badge ok"><i></i>启用</span>' : '<span class="badge neutral"><i></i>停用</span>') + '</td>' +
            '<td><button class="btn btn-sm" data-act="sub-toggle" data-id="' + s.id + '">启用 / 停用</button></td></tr>';
        }).join('') + '</tbody></table></div>' });
  }

  /* ------------------------------------------------------------------ 页面：权限管理 */
  function pagePermissions() {
    var matrix = [
      ['经营总览', '全部', '所辖大区', '所辖团队', '全部'],
      ['销售分析', '全部', '所辖大区', '所辖团队', '全部'],
      ['交付与服务', '全部', '所辖大区', '所辖团队', '全部'],
      ['产能分析', '全部', '所辖大区', '不可见', '全部'],
      ['多维分析', '全部', '所辖大区', '所辖团队', '全部'],
      ['数据中心', '只读', '不可见', '不可见', '全部'],
      ['系统管理', '不可见', '不可见', '不可见', '配置'],
      ['数据导出', '允许', '允许（所辖）', '允许（所辖团队）', '允许']
    ];
    return '<div class="grid">' +
      card({ cls: 'span-12', title: '角色权限矩阵', sub: '与 PRD 7.1 一致',
        body: '<div class="table-wrap"><table class="data" style="min-width:760px"><thead><tr><th>页面 / 能力</th><th>集团管理层</th><th>大区总监</th><th>销售经理</th><th>数据运营</th></tr></thead><tbody>' +
          matrix.map(function (r) {
            return '<tr><td>' + r[0] + '</td>' + r.slice(1).map(function (c) {
              return '<td>' + (c === '不可见' ? '<span style="color:var(--c-text3)">不可见</span>' :
                c === '配置' || c === '允许' || c === '全部' ? '<span class="badge ok">' + c + '</span>' : c) + '</td>';
            }).join('') + '</tr>';
          }).join('') + '</tbody></table></div>' }) +
      card({ cls: 'span-7', title: '用户与角色', sub: '共 ' + D.users.length + ' 个演示账号',
        body: '<div class="table-wrap"><table class="data" style="min-width:640px"><thead><tr><th>姓名</th><th>账号</th><th>角色</th><th>数据范围</th><th>最近登录</th><th>状态</th></tr></thead><tbody>' +
          D.users.map(function (u) {
            return '<tr><td>' + u.name + '</td><td>' + u.account + '</td><td>' + u.role + '</td><td>' + u.scope + '</td><td>' + u.last + '</td>' +
              '<td>' + (u.status === '启用' ? '<span class="badge ok">启用</span>' : '<span class="badge neutral">停用</span>') + '</td></tr>';
          }).join('') + '</tbody></table></div>' }) +
      card({ cls: 'span-5', title: '安全策略', sub: '脱敏 / SSO / 导出管控',
        body: '<div class="state-row" style="flex-direction:column;gap:10px">' +
          [['多租户隔离', '已开启 · 数据与配置相互隔离'],
            ['行级权限', '按大区 / 城市 / 门店 / 销售员限定'],
            ['列级脱敏', '手机号、客户名称、车架号按角色脱敏'],
            ['单点登录', '企业微信 · 钉钉 · OAuth2 · SAML'],
            ['审计日志', '保留 12 个月 · 覆盖登录 / 查看 / 导出'],
            ['导出管控', '水印 + 数据截止时间 + 次数限制']].map(function (x) {
            return '<div style="display:flex;gap:10px;align-items:flex-start"><span class="badge ok"><i></i>启用</span>' +
              '<div><b style="font-size:13px">' + x[0] + '</b><div style="font-size:12px;color:var(--c-text3)">' + x[1] + '</div></div></div>';
          }).join('') + '</div>' }) +
      '</div>';
  }

  /* ------------------------------------------------------------------ 页面：审计日志 */
  function pageAudit() {
    return card({ cls: 'span-12', title: '审计日志', sub: '登录、查看、导出与配置变更全量留痕',
      tools: '<select class="select" aria-label="操作类型筛选"><option>全部操作</option><option>查看看板</option><option>导出 PDF</option><option>导出 Excel</option><option>重跑任务</option><option>修改指标口径</option></select>',
      body: '<div class="table-wrap"><table class="data" style="min-width:960px"><thead><tr><th>时间</th><th>用户</th><th>操作</th><th>对象</th><th>详情</th><th>IP</th></tr></thead><tbody>' +
        D.auditLogs.map(function (l) {
          return '<tr><td>' + l.time + '</td><td>' + l.user + '</td><td>' + l.action + '</td><td style="text-align:left">' + l.target +
            '</td><td style="text-align:left;font-size:12px;color:var(--c-text3)">' + l.detail + '</td><td>' + l.ip + '</td></tr>';
        }).join('') + '</tbody></table></div>' });
  }

  /* ------------------------------------------------------------------ 页面：租户设置（空态） */
  function pageTenant() {
    return card({ cls: 'span-12', title: '租户设置', sub: '多租户隔离与品牌配置',
      body: '<div class="empty">' + icon('tenant', 'ico') + '<h3>租户设置</h3>' +
        '<p>该模块尚未设计：计划提供租户信息、品牌主色、数据源归属与隔离策略的配置能力。</p>' +
        '<span class="badge neutral"><i></i>功能等待设计</span></div>' });
  }

  /* ------------------------------------------------------------------ 页面：多维分析 */
  function pagePivot(d) {
    var dims = ['地区', '城市', '门店', '销售员', '车系'];
    var rowSeg = dims.map(function (x) {
      return '<button data-act="pivot-row" data-val="' + x + '" aria-pressed="' + (state.pivotRows[0] === x) + '">' + x + '</button>';
    }).join('');
    var valSeg = VALUE_DEFS.map(function (v) {
      var on = state.pivotValues.indexOf(v.key) >= 0;
      return '<button data-act="pivot-value" data-val="' + v.key + '" aria-pressed="' + on + '">' + v.name + '</button>';
    }).join('');
    var groups = d.byDim[state.pivotRows[0]] || [];
    var cols = state.pivotValues.map(function (k) { return VALUE_DEFS.filter(function (v) { return v.key === k; })[0]; });
    return filterHTML(d) +
      '<div class="grid" style="margin-bottom:var(--gap)">' +
      card({ cls: 'span-12', title: '透视配置', sub: '行维度 / 值字段 · 拖拽能力由真实产品提供，演示中以选择器替代',
        body: '<div class="field"><label>行维度</label><div class="seg">' + rowSeg + '</div></div>' +
          '<div class="field" style="margin-bottom:6px"><label>值字段（可多选）</label><div class="seg">' + valSeg + '</div></div>' +
          '<div class="panel-note">筛选改变数据范围，维度只改变数据组织方式：切换行维度时合计金额与销量保持不变。</div>' }) +
      '</div>' +
      card({ cls: 'span-12', title: '交叉分析结果', sub: groups.length + ' 行 · 单位随字段',
        tools: '<button class="btn btn-sm" data-act="save-view">' + icon('save', '') + (state.saved ? '已保存为我的看板' : '保存为我的看板') + '</button>' +
          '<button class="btn btn-sm" data-act="export">' + icon('download', '') + '导出 PDF</button>',
        body: '<div class="table-wrap"><table class="data" style="min-width:' + (280 + cols.length * 140) + 'px"><thead><tr><th>' + state.pivotRows[0] + '</th>' +
          cols.map(function (c) { return '<th>' + c.name + (c.unit === '%' ? '（%）' : '（' + c.unit + '）') + '</th>'; }).join('') + '</tr></thead><tbody>' +
          groups.slice(0, 15).map(function (g) {
            return '<tr><td>' + g.name + '</td>' + cols.map(function (c) {
              var v = g[c.key];
              return '<td>' + (c.key === 'completion' || c.key === 'delivery' ? pct(v) : n(v)) + '</td>';
            }).join('') + '</tr>';
          }).join('') +
          '</tbody><tfoot><tr><td>合计</td>' + cols.map(function (c) {
            var v = c.key === 'completion' ? d.kpi.completion : c.key === 'delivery' ? d.kpi.delivery :
              c.key === 'sales' ? d.kpi.sales : c.key === 'amount' ? d.kpi.amount : c.key === 'deals' ? d.kpi.deals :
                c.key === 'complaints' ? d.kpi.complaints : d.kpi.stockouts;
            return '<td>' + (c.key === 'completion' || c.key === 'delivery' ? pct(v) : n(v)) + '</td>';
          }).join('') + '</tr></tfoot></table></div>' }) ;
  }

  /* ------------------------------------------------------------------ 路由与渲染 */
  var PAGES = {
    overview: { title: '经营总览', sub: '总—分—细五区布局 · 一屏内 9 个组件（KPI 卡片视为一组）', render: pageOverview, mount: mountOverview },
    sales: { title: '销售分析', sub: '销量、成交次数、成交金额与完成率 · 支持漏斗与散点分析', render: pageSales, mount: mountSales },
    delivery: { title: '交付与服务', sub: '即时交付率、发货成功率、缺货与客诉 · 含结案率与超期未结', render: pageDelivery, mount: mountDelivery },
    capacity: { title: '产能分析', sub: '设备使用率与可用时长 · 支持按设备范围筛选', render: pageCapacity, mount: mountCapacity },
    pivot: { title: '多维分析', sub: '行列维度与值字段自由组合 · 可保存为我的看板', render: pagePivot },
    datacenter: { title: '数据中心', sub: '任务运行、异常日志、数据新鲜度与字典待处理', render: pageDatacenter, mount: mountDatacenter },
    metrics: { title: '指标中心', sub: '指标注册、口径版本、血缘与目标值维护', render: pageMetrics },
    alerts: { title: '预警中心', sub: '规则、触发与去重、处理状态与备注', render: pageAlerts },
    subscriptions: { title: '订阅管理', sub: '按周 / 按日推送看板到邮件、企业微信与钉钉', render: pageSubscriptions },
    permissions: { title: '权限管理', sub: '角色权限矩阵、行级权限、列级脱敏与导出管控', render: pagePermissions },
    audit: { title: '审计日志', sub: '登录、查看、导出与配置变更全量留痕，保留 12 个月', render: pageAudit },
    tenant: { title: '租户设置', sub: '多租户隔离与品牌配置', render: pageTenant }
  };

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    redrawCharts();
  }
  function redrawCharts() {
    Array.prototype.forEach.call(document.querySelectorAll('.chart'), function (el) { C.redraw(el); });
  }
  function resetFilters() {
    state.filters = { region: ALL, city: ALL, store: ALL, series: ALL, band: ALL, seller: ALL };
    state.drill = [];
    state.dim = '地区';
    render();
  }
  function render() {
    var d = q();
    var app = document.getElementById('app');
    app.setAttribute('data-collapsed', String(state.collapsed));
    app.setAttribute('data-bigscreen', String(state.bigscreen));
    document.getElementById('nav').innerHTML = navHTML();
    document.getElementById('sidebar-foot').innerHTML =
      '<button class="nav-item" data-act="theme" aria-label="切换深色 / 浅色主题">' + icon('theme') +
      '<span class="nav-label">' + (state.theme === 'dark' ? '浅色打印主题' : '深色看板主题') + '</span></button>' +
      '<button class="nav-item" data-act="bigscreen"' + (state.bigscreen ? ' aria-current="page"' : '') + ' aria-label="大屏模式">' +
      icon('bigscreen') + '<span class="nav-label">大屏模式</span></button>' +
      '<button class="nav-item" data-act="account" aria-label="账户中心">' + icon('user') +
      '<span class="nav-label">账户中心</span></button>' +
      '<button class="nav-item" data-act="collapse" aria-label="' + (state.collapsed ? '展开导航' : '收起导航') + '">' +
      icon('collapse') + '<span class="nav-label">' + (state.collapsed ? '展开导航' : '收起导航') + '</span></button>';
    document.getElementById('topbar').innerHTML = topbarHTML(d);

    var banner = document.getElementById('banner');
    if (failedTasks()) {
      banner.hidden = false;
      banner.innerHTML = icon('info', '') + '<span><b>数据延迟提示：</b>「设备平台使用时长」任务失败（T-2052），产能分析展示的是上一成功批次；' +
        '预计恢复时间 2026-09-15 12:00。其余模块数据正常。</span>' +
        '<button class="btn btn-sm" style="margin-left:auto" data-act="nav" data-val="datacenter">查看详情</button>';
    } else {
      banner.hidden = true;
      banner.innerHTML = '';
    }

    var page = PAGES[state.page] || PAGES.overview;
    var html = '<div class="page-head"><div><h1>' + page.title + '</h1><p>' + page.sub + '</p></div>' +
      '<div class="spacer"></div><div class="state-row">' +
      '<button class="btn" data-act="export">' + icon('download', '') + '导出 PDF（浅色主题）</button>' +
      '<button class="btn" data-act="refresh">' + icon('refresh', '') + '刷新数据</button>' +
      '</div></div>' + page.render(d) +
      '<div class="watermark">导出水印 · 数据截止 ' + d.batch.cutoff + ' · 批次 ' + d.batch.id +
      ' · 口径版本 ' + d.metricVersion + ' · 导出于 ' + new Date().toLocaleString('zh-CN') + ' · 仅供内部使用</div>';
    var ws = document.getElementById('workspace');
    ws.innerHTML = html;
    if (page.mount) page.mount(d);
  }

  /* ------------------------------------------------------------------ 弹窗 */
  function metricDetail(id) {
    var m = D.metrics.filter(function (x) { return x.id === id; })[0];
    if (!m) return;
    var d = q();
    modal('指标口径 · ' + m.id + ' ' + m.name,
      '<dl class="kv"><dt>业务定义</dt><dd>' + m.name + '（' + m.unit + '）</dd>' +
      '<dt>计算口径</dt><dd>' + m.formula + '</dd>' +
      '<dt>指标负责人</dt><dd>' + m.owner + '</dd>' +
      '<dt>口径版本</dt><dd>' + m.version + '（历史看板按生效期解释）</dd>' +
      '<dt>数据血缘</dt><dd>' + m.lineage + '</dd>' +
      '<dt>可见性</dt><dd>' + m.visible + '</dd>' +
      '<dt>数据截止</dt><dd>' + d.batch.cutoff + ' · 批次 ' + d.batch.id + '</dd></dl>' +
      '<div class="panel-note">口径变更需生成新版本并留痕；变更时系统会提示受影响的看板清单（F5.3-02 / F5.3-03）。</div>',
      '<button class="btn" data-close>关闭</button>');
  }
  function targetMaintain() {
    var d = q();
    var rows = d.byDim['地区'].map(function (r) {
      return '<tr><td>' + r.name + '</td><td>' + n(r.target) + '</td><td>' + n(r.sales) + '</td><td>' + pct(r.completion) + '</td>' +
        '<td><input class="select" style="height:30px;min-width:96px" value="' + n(Math.round(r.target * 1.05)) + '" aria-label="' + r.name + ' 下期目标"></td></tr>';
    }).join('');
    modal('目标值维护 · 按大区 / 月份',
      '<p style="margin:0 0 12px;color:var(--c-text2);font-size:13px">目标值来源为目标表，粒度为大区 / 门店 / 销售员 / 月；导入后完成率自动重算。</p>' +
      '<div class="table-wrap"><table class="data" style="min-width:640px"><thead><tr><th>大区</th><th>本期目标（台）</th><th>本期实际（台）</th><th>完成率</th><th>下期目标</th></tr></thead><tbody>' + rows + '</tbody></table></div>',
      '<button class="btn" data-close>取消</button><button class="btn btn-primary" data-act="target-save">保存并重算</button>');
  }
  function subAdd() {
    modal('新建订阅',
      '<div class="field"><label for="sub-name">订阅名称</label><input id="sub-name" value="经营总览周报" aria-label="订阅名称"></div>' +
      '<div class="field"><label for="sub-target">订阅内容</label><select id="sub-target" class="select" style="width:100%"><option>经营总览</option><option>销售分析</option><option>交付与服务</option><option>产能分析</option></select></div>' +
      '<div class="field"><label for="sub-freq">推送频率</label><select id="sub-freq" class="select" style="width:100%"><option>每周一 08:30</option><option>每日 08:00</option><option>每月 1 日 09:00</option></select></div>' +
      '<div class="field"><label for="sub-ch">通知渠道</label><select id="sub-ch" class="select" style="width:100%"><option>邮件 · 企业微信</option><option>企业微信</option><option>钉钉</option><option>邮件</option></select></div>' +
      '<div class="panel-note">导出与推送内容自动使用浅色打印主题，并带数据截止时间、批次号与水印。</div>',
      '<button class="btn" data-close>取消</button><button class="btn btn-primary" data-act="sub-save">创建订阅</button>');
  }

  /* ------------------------------------------------------------------ 事件 */
  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    var act = t.getAttribute('data-act');
    var val = t.getAttribute('data-val');
    var id = t.getAttribute('data-id');
    var d = q();
    switch (act) {
      case 'nav':
        state.page = val; location.hash = '#/' + val;
        document.getElementById('workspace').scrollTop = 0; render(); break;
      case 'period': state.period = val; render(); break;
      case 'dim': state.dim = val; render(); break;
      case 'device-scope': state.deviceScope = val; render(); break;
      case 'pivot-row': state.pivotRows = [val]; render(); break;
      case 'pivot-value':
        var i = state.pivotValues.indexOf(val);
        if (i >= 0) { if (state.pivotValues.length > 1) state.pivotValues.splice(i, 1); }
        else state.pivotValues.push(val);
        render(); break;
      case 'filter-clear': case 'drill-reset': resetFilters(); break;
      case 'drill-back': drillBack(parseInt(t.getAttribute('data-idx'), 10)); break;
      case 'order-detail': orderDetail(); break;
      case 'export':
        toast('导出使用浅色打印主题', '屏幕保持深色；打印 / 导出自动切换浅色并添加水印、数据截止时间与批次号。');
        setTimeout(function () { window.print(); }, 400); break;
      case 'exportExcel':
        toast('已导出 Excel', '演示环境不生成真实文件；真实实现由后端生成带水印文件并写入审计日志。'); break;
      case 'refresh':
        toast('数据已刷新', '同一次查询快照 · 批次 ' + d.batch.id + ' · 截止 ' + d.batch.cutoff); render(); break;
      case 'reset':
        state.period = 'month'; state.dim = '地区'; state.pivotRows = ['地区'];
        state.pivotValues = ['sales', 'amount', 'completion', 'delivery'];
        resetFilters();
        toast('已恢复最初状态', '时间口径、筛选条件、分析维度与透视配置均已重置。'); break;
      case 'theme': setTheme(state.theme === 'dark' ? 'light' : 'dark');
        toast(state.theme === 'dark' ? '已切换为深色看板主题' : '已切换为浅色打印主题',
          state.theme === 'dark' ? '适用于会议室投屏与日常查看。' : '适用于导出 PDF / Excel 与纸面阅读。'); break;
      case 'collapse':
        state.collapsed = !state.collapsed;
        document.getElementById('app').setAttribute('data-collapsed', String(state.collapsed));
        render(); redrawCharts(); break;
      case 'bigscreen':
        state.bigscreen = !state.bigscreen;
        document.getElementById('app').setAttribute('data-bigscreen', String(state.bigscreen));
        render();
        toast(state.bigscreen ? '已进入大屏模式' : '已退出大屏模式',
          state.bigscreen ? '标题与数值放大 1.2 倍，支持免登录只读轮播。' : '恢复标准桌面密度。'); break;
      case 'notify':
        modal('消息通知', '<p style="margin:0 0 12px;color:var(--c-text2);font-size:13px">当前有 ' + openAlerts() + ' 条待处理预警。</p>' +
          '<div class="table-wrap"><table class="data" style="min-width:520px"><thead><tr><th>记录</th><th>指标</th><th>范围</th><th>状态</th></tr></thead><tbody>' +
          D.alerts.map(function (a) {
            var st = (state.alertStatus[a.id] || {}).status;
            return '<tr><td>' + a.id + '</td><td>' + a.metric + '</td><td>' + a.scope + '</td><td>' + st + '</td></tr>';
          }).join('') + '</tbody></table></div>',
          '<button class="btn" data-close>关闭</button><button class="btn btn-primary" data-act="nav" data-val="alerts">前往预警中心</button>'); break;
      case 'account':
        modal('账户中心', '<dl class="kv"><dt>姓名</dt><dd>王海</dd><dt>账号</dt><dd>wanghai</dd>' +
          '<dt>角色</dt><dd>集团管理层</dd><dt>数据范围</dt><dd>全集团（行级权限 RLS）</dd>' +
          '<dt>登录方式</dt><dd>企业微信单点登录</dd></dl>' +
          '<div class="panel-note">当前租户：XX 汽车集团 · 华南大区租户视图（SaaS 多租户隔离）。</div>',
          '<button class="btn" data-close>关闭</button>'); break;
      case 'task-retry':
        var task = D.tasks.filter(function (x) { return x.id === id; })[0];
        state.taskStatus[id] = '成功';
        render();
        toast('任务已重跑成功', task.name + '（' + id + '）已重新执行，失败任务数已更新。'); break;
      case 'dict-resolve':
        state.dictDone[t.getAttribute('data-idx')] = true; render();
        toast('字典已确认', '该值已写入标准字典，后续批次自动映射。'); break;
      case 'metric-detail': metricDetail(id); break;
      case 'metric-new':
        toast('新建指标', '演示中未开放创建流程，真实产品提供指标注册向导（F5.3-01）。'); break;
      case 'target-maintain': targetMaintain(); break;
      case 'target-save':
        var mask = t.closest('.modal-mask'); if (mask) mask.remove();
        toast('目标值已保存', '完成率将按新目标重算，口径版本与变更记录已写入指标中心。'); break;
      case 'alert-note':
        var cur = state.alertStatus[id] || { status: '待处理', note: '' };
        modal('处理备注 · ' + id,
          '<div class="field"><label for="alert-note-input">跟进备注</label>' +
          '<textarea id="alert-note-input" aria-label="跟进备注">' + (cur.note || '') + '</textarea></div>' +
          '<div class="panel-note">同一异常 24 小时内只提醒一次；关闭后不再重复推送。</div>',
          '<button class="btn" data-close>取消</button><button class="btn btn-primary" data-act="alert-note-save" data-id="' + id + '">保存备注</button>'); break;
      case 'alert-note-save':
        var box = document.getElementById('alert-note-input');
        state.alertStatus[id] = { status: (state.alertStatus[id] || {}).status || '待处理', note: box ? box.value : '' };
        var m2 = t.closest('.modal-mask'); if (m2) m2.remove();
        render(); toast('备注已保存', id + ' 的处理备注已更新。'); break;
      case 'sub-add': subAdd(); break;
      case 'sub-save':
        var m3 = t.closest('.modal-mask'); if (m3) m3.remove();
        toast('订阅已创建', '将在下一个推送周期生效，接收人按角色解析数据范围。'); break;
      case 'sub-toggle': toast('订阅状态已更新', '演示环境不修改真实订阅配置。'); break;
      case 'save-view':
        state.saved = true; render();
        toast('已保存为我的看板', '当前透视配置（行维度 + 值字段 + 筛选）已保存，可分享给指定角色。'); break;
      default: break;
    }
  });

  document.addEventListener('change', function (e) {
    var sel = e.target.closest ? e.target.closest('[data-filter]') : null;
    if (sel) {
      var key = sel.getAttribute('data-filter');
      state.filters[key] = sel.value;
      if (key === 'region') { state.filters.city = ALL; state.filters.store = ALL; state.filters.seller = ALL; state.drill = []; }
      if (key === 'store') { state.filters.seller = ALL; }
      render();
      return;
    }
    var a = e.target.closest ? e.target.closest('[data-alert-status]') : null;
    if (a) {
      var id = a.getAttribute('data-alert-status');
      state.alertStatus[id] = { status: a.value, note: (state.alertStatus[id] || {}).note || '' };
      render();
      toast('预警状态已更新', id + ' → ' + a.value + '；左侧导航的未处理数已同步。');
    }
  });

  var rafId = 0;
  window.addEventListener('resize', function () {
    if (rafId) return;
    rafId = window.requestAnimationFrame(function () { rafId = 0; redrawCharts(); });
  });
  window.addEventListener('hashchange', function () {
    var p = (location.hash || '').replace('#/', '');
    if (PAGES[p] && p !== state.page) { state.page = p; document.getElementById('workspace').scrollTop = 0; render(); }
  });

  /* ------------------------------------------------------------------ 启动 */
  function init() {
    var hash = (location.hash || '').replace('#/', '');
    if (PAGES[hash]) state.page = hash;
    document.documentElement.setAttribute('data-theme', state.theme);
    render();
    setTimeout(function () {
      toast('演示数据已加载', '批次 WB-202637-018 · 数据截止 2026-09-13 23:59 · 数值为设计评审用示例数据。');
    }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
