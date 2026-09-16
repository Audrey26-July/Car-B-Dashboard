global.window = global;
require("D:/codex/2026-09-15/files-mentioned-by-the-user-b/outputs/dashboard-demo/js/data.js");

var D = global.DashData;
var base = { region: "全部", city: "全部", store: "全部", series: "全部", band: "全部" };

function show(label, state) {
  var q = D.query(state);
  console.log("--- " + label + " ---");
  console.log("  batch", q.batch.id, "cutoff", q.batch.cutoff, "| period", q.periodLabel, "| dim", q.dimLabel);
  console.log("  销量", q.kpi.sales, "目标", q.kpi.target, "完成率", q.kpi.completion.toFixed(2) + "%",
    "交付率", q.kpi.delivery.toFixed(2) + "%", "金额(万)", q.kpi.amount, "成交", q.kpi.deals,
    "客诉", q.kpi.complaints, "缺货", q.kpi.stockouts);
  console.log("  同比", q.kpi.salesYoy.toFixed(2) + "%", "环比", q.kpi.salesMom.toFixed(2) + "%");
  var trendTail = q.trend.slice(-(state.period === "quarter" ? 3 : 4)).reduce(function (a, t) { return a + t.sales; }, 0);
  console.log("  趋势尾段合计", trendTail, trendTail === q.kpi.sales ? "(与销量一致 OK)" : "(不一致)");
  var binSum = q.priceBins.reduce(function (a, b) { return a + b.value; }, 0);
  console.log("  价格分布合计", binSum, binSum === q.kpi.sales ? "(OK)" : "(不一致)");
  var donutSum = q.donut.reduce(function (a, b) { return a + b.value; }, 0);
  console.log("  环形合计", donutSum, donutSum === q.kpi.amount ? "(OK)" : "(不一致 " + q.kpi.amount + ")");
  var tableSum = q.rank.reduce(function (a, b) { return a + b.sales; }, 0);
  console.log("  明细合计", tableSum, tableSum === q.kpi.sales ? "(OK)" : "(不一致)");
  console.log("  维度项数", q.rank.length, "Top3", q.rank.slice(0, 3).map(function (r) {
    return r.name + ":" + r.sales + "/" + r.completion.toFixed(1) + "%";
  }).join(" "));
  console.log("  设备", q.devices.length, "漏斗", q.funnel.map(function (f) { return f.stage + ":" + f.value; }).join(" > "));
}

show("本月 / 全集团 / 地区", { period: "month", dim: "地区", filters: base });
show("本季 / 全集团 / 销售员", { period: "quarter", dim: "销售员", filters: base });
show("本月 / 华东 / 地区", { period: "month", dim: "地区", filters: Object.assign({}, base, { region: "华东" }) });
show("本月 / 全集团 / 车系", { period: "month", dim: "车系", filters: base });
show("本季 / 30-45万 / 门店", { period: "quarter", dim: "门店", filters: Object.assign({}, base, { band: "30–45万" }) });

var sellers = D.query({ period: "month", dim: "销售员", filters: base }).rank;
var names = {};
var dup = 0;
sellers.forEach(function (s) { if (names[s.name]) dup++; names[s.name] = 1; });
console.log("销售员去重检查：", sellers.length, "个分组，重复", dup);
console.log("事实行数：", D.FACTS.length, "门店", D.STORES.length, "车系", D.SERIES.length);
