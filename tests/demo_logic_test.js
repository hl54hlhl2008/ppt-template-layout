/* Demo 逻辑测试：在无 DOM 环境下直接调用 demo/index.html 里的纯函数。
   由 tests/run_demo_tests.py 拼装并执行（shim + demo 脚本 + 本文件）。 */

var __results = [];

function t(name, fn){
  try { fn(); __results.push("ok   " + name); }
  catch (e) { __results.push("FAIL " + name + " :: " + e.message); }
}
function eq(a, b, msg){
  if (a !== b) throw new Error((msg || "值不一致") + "：期望 " + b + "，实际 " + a);
}
function ok(cond, msg){ if (!cond) throw new Error(msg || "断言失败"); }
function has(hay, needle, msg){
  if (String(hay).indexOf(needle) < 0) throw new Error((msg || "缺少内容") + "：" + needle);
}
function fresh(){ return JSON.parse(JSON.stringify(CONTENT_SAMPLE)); }

t("方案模板页数正确", function(){
  eq(deckById("tpl-full").pages.length, 6);
  eq(deckById("tpl-sum").pages.length, 2);
});

t("生成 6 页且每页都是幻灯片", function(){
  var deck = buildDeck("tpl-full", fresh());
  eq(deck.pages.length, 6);
  deck.pages.forEach(function(p, i){
    has(p.html, 'class="slide"', "第 " + (i + 1) + " 页不是幻灯片");
    eq(p.html.indexOf("undefined"), -1, "第 " + (i + 1) + " 页出现 undefined");
  });
});

t("封面页绑定标题与副标题", function(){
  var deck = buildDeck("tpl-full", fresh());
  has(deck.pages[0].html, "2026 春季 · 徽州研学营");
  has(deck.pages[0].html, "4 天 3 晚");
});

t("亮点页渲染三个卡片与序号", function(){
  var deck = buildDeck("tpl-full", fresh());
  var html = deck.pages[1].html;
  has(html, "徽墨描金");
  has(html, "古村测绘");
  has(html, "家书写作");
  has(html, ">01<");
  eq(deck.pages[1].slots.length, 3);
});

t("行程页渲染 D1–D4 与内容", function(){
  var deck = buildDeck("tpl-full", fresh());
  var html = deck.pages[3].html;
  has(html, "D1"); has(html, "D4");
  has(html, "合肥 → 屯溪");
  has(html, "研学行程汇总");
});

t("汇总页渲染四个指标", function(){
  var deck = buildDeck("tpl-full", fresh());
  var html = deck.pages[4].html;
  ["行程天数", "核心课程", "师生配比", "成营规模"].forEach(function(k){ has(html, k); });
});

t("默认图片走图库命中", function(){
  var d = decisionFor("p-hl-1:0");
  eq(d.source, "gallery");
  ok(!!galleryById(d.galleryId), "图库 id 不存在");
});

t("手动指定优先于图库", function(){
  state.wizard.images["p-hl-1:1"] = { source:"manual", galleryId:"g5" };
  var d = decisionFor("p-hl-1:1");
  eq(d.source, "manual");
  eq(d.galleryId, "g5");
  var deck = buildDeck("tpl-full", fresh());
  has(deck.pages[1].html, "手动指定");
  has(deck.pages[1].html, "窑址考察");
});

t("标记待配图后渲染占位色块", function(){
  state.wizard.images["p-hl-1:2"] = { source:"todo", galleryId:null };
  var deck = buildDeck("tpl-full", fresh());
  has(deck.pages[1].html, "待配图");
  ok(deck.pages[1].issues.some(function(x){ return x.text.indexOf("待配图槽位") >= 0; }), "缺图未进入问题列表");
});

t("超长文案触发字数预算告警", function(){
  var c = fresh();
  c.cover.title = "这是一个明显超过预算的超长封面标题用于验证溢出检测逻辑是否生效且可提示";
  var deck = buildDeck("tpl-full", c);
  ok(deck.pages[0].issues.length > 0, "未检出溢出");
  ok(deck.pages[0].issues[0].text.indexOf("字数预算") >= 0, "告警文案不含字数预算");
});

t("图片标签映射正确", function(){
  eq(imageLabel({ source:"manual" }), "手动指定");
  eq(imageLabel({ source:"gallery" }), "图库命中");
  eq(imageLabel({ source:"todo" }), "待配图");
  eq(imageLabel(null), "待配图");
});

t("内页页型渲染不报错", function(){
  ["p-cover-2", "p-it-2"].forEach(function(id){
    var p = pageById(id);
    var html = slideHTML(p, fresh(), { index:0 });
    has(html, 'class="slide"', id + " 渲染失败");
    eq(html.indexOf("undefined"), -1, id + " 出现 undefined");
  });
});

t("清理：还原图片决策", function(){
  state.wizard.images = {};
  var d = decisionFor("p-hl-1:1");
  eq(d.source, "gallery");
});

__results.join("\n");
