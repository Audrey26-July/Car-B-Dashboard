/* 车企 B 端数据看板系统 - 演示数据层
 * 单一数据源：同一次查询返回全屏所需数据，保证 KPI / 图表 / 表格口径一致。
 * 真实项目中这一层由预聚合查询接口替换，前端契约不变。
 */
(function (global) {
  'use strict';

  var MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
  var MONTH_TARGET = { '2026-04': 3720, '2026-05': 3860, '2026-06': 3980, '2026-07': 4348, '2026-08': 4620, '2026-09': 4671 };
  var CURRENT_MONTH = '2026-09';
  var PREV_MONTH = '2026-08';
  var QUARTER_MONTHS = ['2026-07', '2026-08', '2026-09'];
  var PREV_QUARTER_MONTHS = ['2026-04', '2026-05', '2026-06'];

  var BATCH = {
    month: { id: 'WB-202637-018', cutoff: '2026-09-13 23:59', source: 'DMS 订单库 · CRM 客诉工单 · TMS 发运记录' },
    quarter: { id: 'WB-202637-018', cutoff: '2026-09-13 23:59', source: 'DMS 订单库 · CRM 客诉工单 · TMS 发运记录' }
  };
  var METRIC_VERSION = 'M01–M11 v1.2';

  var REGIONS = [
    { name: '华东', cities: ['上海', '杭州', '南京'], size: 1.40, delivery: 96.4, completion: 1.039, complaint: 0.0093, stockout: 0.0039, device: 0.86 },
    { name: '华南', cities: ['广州', '深圳', '佛山'], size: 1.00, delivery: 92.1, completion: 0.900, complaint: 0.0186, stockout: 0.0093, device: 0.79 },
    { name: '华北', cities: ['北京', '天津', '石家庄'], size: 0.92, delivery: 95.2, completion: 0.984, complaint: 0.0107, stockout: 0.0048, device: 0.83 },
    { name: '华中', cities: ['武汉', '长沙', '郑州'], size: 0.78, delivery: 94.7, completion: 0.927, complaint: 0.0110, stockout: 0.0094, device: 0.74 },
    { name: '西南', cities: ['成都', '重庆', '昆明'], size: 0.66, delivery: 93.5, completion: 0.863, complaint: 0.0208, stockout: 0.0133, device: 0.71 },
    { name: '东北', cities: ['沈阳', '大连', '长春'], size: 0.50, delivery: 91.8, completion: 0.807, complaint: 0.0194, stockout: 0.0121, device: 0.62 }
  ];

  var SERIES = [
    { name: '帝豪', price: 9.8, hot: 0.95, band: '<10万' },
    { name: '星瑞', price: 13.2, hot: 1.10, band: '10–15万' },
    { name: '博越', price: 14.6, hot: 0.88, band: '10–15万' },
    { name: '嘉际', price: 17.8, hot: 0.55, band: '15–20万' },
    { name: '星越 L', price: 18.4, hot: 1.25, band: '15–20万' },
    { name: '银河 E8', price: 22.6, hot: 0.42, band: '20–30万' },
    { name: '极氪 001', price: 32.8, hot: 0.26, band: '30–45万' },
    { name: '极氪 009', price: 55.8, hot: 0.08, band: '>45万' }
  ];
  var PRICE_BANDS = ['<10万', '10–15万', '15–20万', '20–30万', '30–45万', '>45万'];
  var SURNAMES = ['李', '陈', '周', '王', '赵', '孙', '吴', '郑', '冯', '许', '何', '邓', '张', '刘', '杨', '黄', '徐', '朱', '高', '林'];
  var GIVENS = ['昊', '嘉', '敏', '倩', '鹏', '博', '迪', '楠', '磊', '婧', '鑫', '超', '婷', '宇', '悦', '晨', '杰', '琳', '航', '婉'];
  var DEVICE_TYPES = [
    { name: '举升机', count: 46, util: 0.74, hours: 402 },
    { name: '诊断设备', count: 28, util: 0.68, hours: 306 },
    { name: '充电桩', count: 64, util: 0.52, hours: 512 },
    { name: '试驾车', count: 52, util: 0.81, hours: 468 },
    { name: '喷漆房', count: 12, util: 0.63, hours: 264 }
  ];
  var COMPLAINT_REASONS = [
    { name: '交付延期', weight: 0.30 },
    { name: '车机与软件故障', weight: 0.22 },
    { name: '售前承诺不一致', weight: 0.18 },
    { name: '售后维修等待', weight: 0.16 },
    { name: '配件供应不足', weight: 0.14 }
  ];

  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20260915);
  function jitter(span) { return 1 - span / 2 + rnd() * span; }
  /* 随机取整：保留期望值，避免小样本被四舍五入抹平 */
  function sround(x) { var f = Math.floor(x); return f + (rnd() < x - f ? 1 : 0); }

  /* ---------------------------------------------------------------- 事实表 */
  var STORES = [];
  var SELLERS = [];
  REGIONS.forEach(function (region) {
    region.cities.forEach(function (city, ci) {
      for (var s = 0; s < 2; s++) {
        var store = { name: city + (s === 0 ? '中心店' : '旗舰店'), city: city, region: region.name, weight: jitter(0.42) };
        STORES.push(store);
        for (var k = 0; k < 4; k++) {
          var idx = SELLERS.length;
          SELLERS.push({
            name: SURNAMES[idx % SURNAMES.length] + GIVENS[Math.floor(idx / SURNAMES.length) % GIVENS.length],
            store: store.name, region: region.name, weight: jitter(0.55)
          });
        }
      }
    });
  });

  function buildFacts() {
    var rows = [];
    MONTHS.forEach(function (month) {
      var monthIndex = MONTHS.indexOf(month);
      var monthFactor = 0.84 + monthIndex * 0.032;
      var bucket = [];
      SELLERS.forEach(function (seller) {
        var region = REGIONS.filter(function (r) { return r.name === seller.region; })[0];
        var store = STORES.filter(function (st) { return st.name === seller.store; })[0];
        SERIES.forEach(function (series) {
          var raw = 10 * seller.weight * store.weight * region.size * series.hot * monthFactor * jitter(0.5);
          bucket.push({ month: month, region: region.name, city: store.city, store: store.name, seller: seller.name, series: series, raw: raw });
        });
      });
      var rawSum = bucket.reduce(function (a, b) { return a + b.raw; }, 0);
      var scale = MONTH_TARGET[month] / rawSum;
      var running = 0;
      bucket.forEach(function (item, i) {
        var sales = i === bucket.length - 1 ? MONTH_TARGET[month] - running : Math.round(item.raw * scale);
        running += sales;
        var series = item.series;
        var region = REGIONS.filter(function (r) { return r.name === item.region; })[0];
        var price = series.price * jitter(0.10);
        var amount = Math.round(sales * price * jitter(0.06));
        var delivery = Math.min(99.2, Math.max(84, region.delivery + (rnd() - 0.5) * 5));
        var complaints = sround(sales * region.complaint * jitter(1.6));
        var stockouts = sround(sales * region.stockout * jitter(1.8));
        var target = Math.max(1, Math.round(sales / Math.max(0.6, region.completion * jitter(0.16))));
        rows.push({
          month: item.month, region: item.region, city: item.city, store: item.store,
          seller: item.seller, series: series.name, band: series.band,
          sales: sales, amount: amount, delivery: delivery,
          complaints: complaints, stockouts: stockouts, target: target,
          deals: Math.max(1, Math.round(sales * (0.9 + rnd() * 0.1))),
          leadTime: Math.round(6 + (1 - delivery / 100) * 90 + rnd() * 5)
        });
      });
    });
    return rows;
  }
  var FACTS = buildFacts();

  /* ------------------------------------------------------------ 预聚合趋势 */
  var WEEK_BASE = [1042, 1088, 997, 1156, 1203, 1097, 1096, 1178, 1176, 1221];
  var MONTH_BASE = [3980, 4210, 4460, 3870, 3210, 3620, 4050, 4280, 4510, 4348, 4620, 4671];
  var DELIVERY_BASE = [93.6, 93.9, 94.4, 93.1, 92.4, 92.9, 93.8, 94.1, 94.6, 94.3];
  var WEEK_LABELS = ['W28', 'W29', 'W30', 'W31', 'W32', 'W33', 'W34', 'W35', 'W36', 'W37'];
  var MONTH_LABELS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

  function normalizePattern(base, target, lastN) {
    var tail = base.slice(base.length - lastN);
    var tailSum = tail.reduce(function (a, b) { return a + b; }, 0);
    var k = target / tailSum;
    return base.map(function (v) { return Math.round(v * k); });
  }

  /* ---------------------------------------------------------------- 筛选 */
  function periodMonths(period) { return period === 'quarter' ? QUARTER_MONTHS.slice() : [CURRENT_MONTH]; }

  function matchFilters(row, filters) {
    if (filters.region !== '全部' && row.region !== filters.region) return false;
    if (filters.city !== '全部' && row.city !== filters.city) return false;
    if (filters.store !== '全部' && row.store !== filters.store) return false;
    if (filters.series !== '全部' && row.series !== filters.series) return false;
    if (filters.band !== '全部' && row.band !== filters.band) return false;
    return true;
  }

  function sum(rows, key) { return rows.reduce(function (a, r) { return a + r[key]; }, 0); }

  function groupBy(rows, key) {
    var map = {};
    rows.forEach(function (r) {
      var k = r[key];
      if (!map[k]) map[k] = { name: k, sales: 0, amount: 0, deals: 0, complaints: 0, stockouts: 0, target: 0, deliveryWeighted: 0 };
      var g = map[k];
      g.sales += r.sales; g.amount += r.amount; g.deals += r.deals;
      g.complaints += r.complaints; g.stockouts += r.stockouts; g.target += r.target;
      g.deliveryWeighted += r.sales * r.delivery;
    });
    return Object.keys(map).map(function (k) {
      var g = map[k];
      g.delivery = g.sales ? g.deliveryWeighted / g.sales : 0;
      g.completion = g.target ? (g.sales / g.target) * 100 : 0;
      return g;
    });
  }

  function sortDesc(list, key) { return list.slice().sort(function (a, b) { return b[key] - a[key]; }); }

  /* 单一入口：返回整屏所需数据，保证同屏同源同快照 */
  function query(state) {
    var months = periodMonths(state.period);
    var filters = state.filters;
    var rows = FACTS.filter(function (r) {
      return months.indexOf(r.month) >= 0 && matchFilters(r, filters);
    });
    var prevMonths = state.period === 'quarter' ? PREV_QUARTER_MONTHS : [PREV_MONTH];
    var prevRows = FACTS.filter(function (r) {
      return prevMonths.indexOf(r.month) >= 0 && matchFilters(r, filters);
    });
    var sameLastYear = FACTS.filter(function (r) {
      return months.indexOf(r.month) >= 0 && matchFilters(r, filters);
    }).map(function (r) { return Object.assign({}, r, { sales: Math.round(r.sales * 0.876) }); });

    var sales = sum(rows, 'sales');
    var target = sum(rows, 'target');
    var delivery = sales ? rows.reduce(function (a, r) { return a + r.sales * r.delivery; }, 0) / sales : 0;
    var prevSales = sum(prevRows, 'sales');
    var lySales = sum(sameLastYear, 'sales');

    var tickets = sum(rows, 'complaints');
    var overdueTickets = Math.max(0, Math.round(tickets * 0.216));
    var kpi = {
      sales: sales,
      amount: sum(rows, 'amount'),
      deals: sum(rows, 'deals'),
      complaints: tickets,
      stockouts: sum(rows, 'stockouts'),
      target: target,
      completion: target ? (sales / target) * 100 : 0,
      delivery: delivery,
      shipSuccess: Math.min(99.4, delivery + 1.9),
      closedRate: tickets ? ((tickets - overdueTickets) / tickets) * 100 : 100,
      overdueTickets: overdueTickets,
      salesYoy: lySales ? ((sales - lySales) / lySales) * 100 : 0,
      salesMom: prevSales ? ((sales - prevSales) / prevSales) * 100 : 0
    };

    var dims = ['地区', '城市', '门店', '销售员', '车系'];
    var byDim = {};
    dims.forEach(function (d) {
      var key = d === '地区' ? 'region' : d === '城市' ? 'city' : d === '销售员' ? 'seller' : d === '门店' ? 'store' : 'series';
      byDim[d] = sortDesc(groupBy(rows, key), 'sales');
    });

    var trendPattern = state.period === 'quarter' ? MONTH_BASE : WEEK_BASE;
    var trendLabels = state.period === 'quarter' ? MONTH_LABELS : WEEK_LABELS;
    var lastN = state.period === 'quarter' ? 3 : 4;
    var trendSales = normalizePattern(trendPattern, sales, lastN);
    var trend = trendLabels.map(function (label, i) {
      return { label: label, sales: trendSales[i], delivery: DELIVERY_BASE[i % DELIVERY_BASE.length] };
    });

    var priceBins = PRICE_BANDS.map(function (band) {
      return { label: band, value: rows.filter(function (r) { return r.band === band; }).reduce(function (a, r) { return a + r.sales; }, 0) };
    });

    var currentGroup = byDim[state.dim];
    var donutTop = currentGroup.slice(0, 4);
    var rest = currentGroup.slice(4);
    var donut = donutTop.map(function (g) { return { name: g.name, value: g.amount }; });
    if (rest.length) {
      donut.push({ name: '其他 ' + rest.length + ' 项', value: rest.reduce(function (a, g) { return a + g.amount; }, 0) });
    }

    var funnelBase = kpi.deals;
    var funnel = [
      { stage: '线索', value: Math.round(funnelBase / 0.097) },
      { stage: '到店', value: Math.round(funnelBase / 0.232) },
      { stage: '试驾', value: Math.round(funnelBase / 0.418) },
      { stage: '成交', value: funnelBase },
      { stage: '交付', value: Math.round(funnelBase * (kpi.delivery / 100)) }
    ];

    var scatter = groupBy(rows, 'series').map(function (g) {
      var series = SERIES.filter(function (s) { return s.name === g.name; })[0] || { price: 0 };
      return { name: g.name, x: series.price, y: g.amount, r: g.sales };
    });

    var complaintReasons = COMPLAINT_REASONS.map(function (c) {
      return { name: c.name, value: Math.max(1, Math.round(kpi.complaints * c.weight)) };
    });
    var complaintDiff = kpi.complaints - complaintReasons.reduce(function (a, c) { return a + c.value; }, 0);
    complaintReasons[0].value += complaintDiff;

    var leadBins = [['≤3 天', 0], ['4–7 天', 0], ['8–14 天', 0], ['15–21 天', 0], ['22–30 天', 0], ['>30 天', 0]];
    rows.forEach(function (r) {
      var d = r.leadTime;
      var idx = d <= 3 ? 0 : d <= 7 ? 1 : d <= 14 ? 2 : d <= 21 ? 3 : d <= 30 ? 4 : 5;
      leadBins[idx][1] += r.deals;
    });

    return {
      rows: rows,
      prevRows: prevRows,
      kpi: kpi,
      byDim: byDim,
      trend: trend,
      priceBins: priceBins,
      donut: donut,
      rank: currentGroup,
      funnel: funnel,
      scatter: scatter,
      complaintReasons: complaintReasons,
      leadBins: leadBins.map(function (b) { return { label: b[0], value: b[1] }; }),
      devices: DEVICE_TYPES,
      batch: BATCH[state.period === 'quarter' ? 'quarter' : 'month'],
      metricVersion: METRIC_VERSION,
      periodLabel: state.period === 'quarter' ? '本季累计' : '本月累计',
      dimLabel: state.dim
    };
  }

  /* ------------------------------------------------------------ 运营类数据 */
  var tasks = [
    { id: 'T-2048', name: 'DMS 订单明细抽取', source: 'MySQL · dms_order', schedule: '每周一 00:10', batch: 'WB-202637-018', rows: 128460, cost: '3 分 12 秒', status: '成功', time: '2026-09-14 00:13' },
    { id: 'T-2049', name: 'CRM 客诉工单抽取', source: 'API · crm/tickets', schedule: '每周一 00:10', batch: 'WB-202637-018', rows: 6128, cost: '48 秒', status: '成功', time: '2026-09-14 00:11' },
    { id: 'T-2050', name: 'TMS 发运记录抽取', source: 'SQL Server · tms_ship', schedule: '每周一 00:15', batch: 'WB-202637-018', rows: 94217, cost: '2 分 06 秒', status: '成功', time: '2026-09-14 00:17' },
    { id: 'T-2051', name: '月度目标值导入', source: 'SFTP · /inbound/target/*.xlsx', schedule: '每月 1 日 08:00', batch: 'WB-202637-018', rows: 486, cost: '11 秒', status: '成功', time: '2026-09-14 00:18' },
    { id: 'T-2052', name: '设备平台使用时长', source: 'API · iot/usage', schedule: '每周一 00:20', batch: '—', rows: 0, cost: '—', status: '失败', time: '2026-09-14 00:26', error: '凭据过期（401）：请更新设备平台 AccessKey' },
    { id: 'T-2053', name: '指标层预聚合刷新', source: '内部 · metric_cube', schedule: '依赖上游', batch: 'WB-202637-018', rows: 7420, cost: '1 分 34 秒', status: '成功', time: '2026-09-14 00:40' }
  ];
  var dictPending = [
    { field: '门店', raw: '广州天源路店', suggest: '广州中心店', source: 'DMS 订单库', batch: 'WB-202637-018' },
    { field: '销售员', raw: '李昊(离职)', suggest: '归入原门店', source: 'DMS 订单库', batch: 'WB-202637-018' },
    { field: '车系', raw: '银河E8 四驱', suggest: '银河 E8', source: 'SFTP 台账', batch: 'WB-202637-018' }
  ];
  var metrics = [
    { id: 'M01', name: '即时交付率', unit: '%', formula: '按期交付订单数 ÷ 应交付订单总数 × 100%', owner: '交付运营组', version: 'v1.2', lineage: 'dms_order → fact_delivery → metric_otd', visible: '全部角色', status: '生效中' },
    { id: 'M02', name: '当月客诉', unit: '件', formula: '本月受理且按工单号去重后的工单数', owner: '售后服务组', version: 'v1.2', lineage: 'crm_ticket → fact_complaint → metric_complaint', visible: '管理层 / 售后 / 数据运营', status: '生效中' },
    { id: 'M03', name: '当月缺货次数', unit: '次', formula: '本月因库存不足被拒单或延期的订单行数', owner: '供应链组', version: 'v1.1', lineage: 'dms_order → fact_stockout → metric_oos', visible: '管理层 / 数据运营', status: '生效中' },
    { id: 'M04', name: '完成率', unit: '%', formula: '实际值 ÷ 目标值 × 100%（目标按大区/门店/销售员/月维护）', owner: '经营分析组', version: 'v1.3', lineage: 'fact_sales + dim_target → metric_completion', visible: '全部角色', status: '生效中' },
    { id: 'M05', name: '发货成功率', unit: '%', formula: '成功发货订单数 ÷ 计划发货订单数 × 100%', owner: '交付运营组', version: 'v1.1', lineage: 'tms_ship → fact_ship → metric_ship_success', visible: '管理层 / 交付 / 数据运营', status: '生效中' },
    { id: 'M06', name: '设备使用率', unit: '%', formula: '有效使用时长 ÷ 可用时长 × 100%', owner: '设备运营组', version: 'v1.0', lineage: 'iot_usage → fact_device → metric_utilization', visible: '管理层 / 设备运营', status: '待确认口径' },
    { id: 'M07', name: '日销量', unit: '台', formula: '当日确认订单中的车辆台数', owner: '经营分析组', version: 'v1.2', lineage: 'dms_order → fact_sales → metric_daily_sales', visible: '全部角色', status: '生效中' },
    { id: 'M08', name: '月销量', unit: '台', formula: '本月累计车辆台数', owner: '经营分析组', version: 'v1.2', lineage: 'fact_sales → metric_month_sales', visible: '全部角色', status: '生效中' },
    { id: 'M09', name: '单日成交次数', unit: '笔', formula: '当日状态流转为已成交的订单笔数', owner: '经营分析组', version: 'v1.2', lineage: 'fact_deal → metric_daily_deal', visible: '全部角色', status: '生效中' },
    { id: 'M10', name: '当月成交次数', unit: '笔', formula: '本月累计状态为已成交的订单笔数', owner: '经营分析组', version: 'v1.2', lineage: 'fact_deal → metric_month_deal', visible: '全部角色', status: '生效中' },
    { id: 'M11', name: '月成交金额', unit: '万元', formula: '本月成交订单金额合计（含税并含衍生收入）', owner: '经营分析组', version: 'v1.2', lineage: 'fact_amount → metric_month_amount', visible: '管理层 / 数据运营', status: '生效中' }
  ];
  var alertRules = [
    { id: 'R-01', metric: 'M01 即时交付率', cond: '低于 95%', scope: '全集团', channel: '站内 · 企业微信', window: '24 小时', enabled: true },
    { id: 'R-02', metric: 'M03 当月缺货次数', cond: '高于 30 次', scope: '全集团', channel: '站内 · 邮件', window: '24 小时', enabled: true },
    { id: 'R-03', metric: 'M02 当月客诉', cond: '环比上升超过 15%', scope: '大区', channel: '站内', window: '24 小时', enabled: true },
    { id: 'R-04', metric: 'M06 设备使用率', cond: '低于 70%', scope: '全集团', channel: '站内 · 钉钉', window: '48 小时', enabled: false }
  ];
  var alerts = [
    { id: 'A-3181', rule: 'R-01', metric: '即时交付率', scope: '华南大区', value: '92.1%', threshold: '低于 95%', level: '风险', time: '2026-09-14 00:41', status: '待处理', note: '' },
    { id: 'A-3180', rule: 'R-02', metric: '当月缺货次数', scope: '西南大区', value: '7 次', threshold: '高于 30 次（大区阈值 5 次）', level: '预警', time: '2026-09-14 00:41', status: '待处理', note: '' },
    { id: 'A-3179', rule: 'R-01', metric: '即时交付率', scope: '东北大区', value: '91.8%', threshold: '低于 95%', level: '风险', time: '2026-09-14 00:41', status: '处理中', note: '已联系大区交付负责人，等待排产反馈' },
    { id: 'A-3176', rule: 'R-03', metric: '当月客诉', scope: '西南大区', value: '环比 +18.2%', threshold: '环比上升超过 15%', level: '预警', time: '2026-09-07 00:40', status: '已关闭', note: '客诉集中在交付延期，已补充排产计划' }
  ];
  var users = [
    { name: '王海', account: 'wanghai', role: '集团管理层', scope: '全集团', last: '2026-09-15 09:12', status: '启用' },
    { name: '陈嘉', account: 'chenjia', role: '大区总监', scope: '华南大区', last: '2026-09-15 08:44', status: '启用' },
    { name: '周敏', account: 'zhoumin', role: '销售经理', scope: '上海中心店', last: '2026-09-14 19:02', status: '启用' },
    { name: '赵鹏', account: 'zhaopeng', role: '设备运营负责人', scope: '华东大区', last: '2026-09-14 17:26', status: '启用' },
    { name: '刘一宁', account: 'liuyining', role: '只读访客', scope: '授权范围', last: '2026-09-11 10:05', status: '停用' }
  ];
  var auditLogs = [
    { time: '2026-09-15 09:12', user: '王海', action: '查看看板', target: '经营总览', detail: '筛选：本月 / 全集团', ip: '10.20.31.11' },
    { time: '2026-09-15 08:47', user: '陈嘉', action: '导出 PDF', target: '华南大区交付与服务', detail: '浅色打印主题 · 含水印', ip: '10.20.44.7' },
    { time: '2026-09-14 19:04', user: '周敏', action: '导出 Excel', target: '销售分析明细', detail: '486 行 · 未脱敏字段已屏蔽', ip: '10.20.51.36' },
    { time: '2026-09-14 16:20', user: '张涛（数据运营）', action: '重跑任务', target: 'T-2052 设备平台使用时长', detail: '原因：凭据过期', ip: '10.20.10.8' },
    { time: '2026-09-14 15:02', user: '李娜（数据运营）', action: '修改指标口径', target: 'M04 完成率', detail: 'v1.2 → v1.3，生效日 2026-09-15', ip: '10.20.10.9' }
  ];
  var subscriptions = [
    { id: 'S-01', name: '经营总览周报', target: '经营总览', freq: '每周一 08:30', channel: '邮件 · 企业微信', receivers: '集团管理层（6 人）', status: '启用' },
    { id: 'S-02', name: '交付异常日报', target: '交付与服务', freq: '每日 08:00', channel: '企业微信', receivers: '售后负责人（12 人）', status: '启用' },
    { id: 'S-03', name: '门店销量排行周报', target: '销售分析', freq: '每周一 09:00', channel: '邮件', receivers: '大区总监（6 人）', status: '停用' }
  ];

  global.DashData = {
    MONTHS: MONTHS,
    PRICE_BANDS: PRICE_BANDS,
    SERIES: SERIES.map(function (s) { return s.name; }),
    REGIONS: REGIONS.map(function (r) { return r.name; }),
    STORES: STORES.map(function (s) { return s.name; }),
    FACTS: FACTS,
    devices: DEVICE_TYPES,
    query: query,
    tasks: tasks,
    dictPending: dictPending,
    metrics: metrics,
    alertRules: alertRules,
    alerts: alerts,
    users: users,
    auditLogs: auditLogs,
    subscriptions: subscriptions,
    CURRENT_MONTH: CURRENT_MONTH,
    periods: { month: '本月', quarter: '本季' }
  };
})(window);
