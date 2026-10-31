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

/* ---------- 数据模型：方案模板 → 板块 → 页面 ---------- */

t("方案模板为三级结构", function(){
  var d = deckById("tpl-full");
  eq(d.sections.length, 5);
  eq(flatPages(d).length, 6);
  eq(d.sections[1].name, "行程亮点");
  eq(d.sections[1].pages.length, 2);
});

t("板块类型覆盖封面/亮点/行程/汇总/须知", function(){
  var types = deckById("tpl-full").sections.map(function(s){ return s.type; });
  ["封面", "亮点", "行程", "汇总", "须知"].forEach(function(x){
    ok(types.indexOf(x) >= 0, "缺少板块类型 " + x);
  });
});

t("新增/删除板块影响页面总数", function(){
  var d = deckById("tpl-sum");
  var before = flatPages(d).length;
  d.sections.push({ id:"tmp-1", name:"报名须知", type:"须知", pages:["p-note-1"] });
  eq(flatPages(d).length, before + 1);
  d.sections = d.sections.filter(function(s){ return s.id !== "tmp-1"; });
  eq(flatPages(d).length, before);
});

t("删除板块不会影响其他板块", function(){
  var d = deckById("tpl-hl");
  var keep = d.sections[0].pages.slice();
  d.sections.push({ id:"tmp-2", name:"x", type:"封面", pages:["p-cover-2"] });
  d.sections = d.sections.filter(function(s){ return s.id !== "tmp-2"; });
  eq(d.sections[0].pages.join(","), keep.join(","));
});

t("批量加页按顺序写入板块", function(){
  var d = deckById("tpl-sum");
  var sec = d.sections[0];
  var before = sec.pages.length;
  var added = addPagesToSection(d, sec.id, ["p-it-2", "p-hl-1"]);
  eq(added, 2);
  eq(sec.pages.length, before + 2);
  eq(sec.pages[sec.pages.length - 2], "p-it-2");
  eq(sec.pages[sec.pages.length - 1], "p-hl-1");
  sec.pages.splice(before, 2);
});

t("加页忽略非法页 id 与不存在的板块", function(){
  var d = deckById("tpl-sum");
  eq(addPagesToSection(d, "not-exist", ["p-hl-1"]), 0);
  var sec = d.sections[0];
  var before = sec.pages.length;
  eq(addPagesToSection(d, sec.id, ["nope", ""]), 0);
  eq(sec.pages.length, before);
});

t("页面模板选择区渲染全部页面并标注已用", function(){
  state.pickPages = [];
  state.pickFilter = "全部";
  var sec = deckById("tpl-full").sections[1];
  var html = pageLibraryHTML(sec);
  eq((html.match(/data-pick-page=/g) || []).length, DB.pages.length);
  has(html, "已在板块中");
  has(html, "data-quick-add");
  has(html, "已选 <b style=\"color:#cfe0ff\">0</b> 个页面");
});

t("选择区按页型筛选", function(){
  state.pickFilter = "行程";
  var html = pageLibraryHTML(deckById("tpl-full").sections[2]);
  var expected = DB.pages.filter(function(p){ return p.type === "行程"; }).length;
  eq((html.match(/data-pick-page=/g) || []).length, expected);
  state.pickFilter = "全部";
});

t("选择态标记选中卡片", function(){
  state.pickPages = ["p-hl-1"];
  var html = pageLibraryHTML(deckById("tpl-full").sections[1]);
  has(html, 'class="pick-card on" data-pick-page="p-hl-1"');
  state.pickPages = [];
});

/* ---------- 排版生成 ---------- */

t("生成 6 页且每页都是幻灯片", function(){
  var deck = buildDeck("tpl-full", fresh());
  eq(deck.pages.length, 6);
  deck.pages.forEach(function(p, i){
    has(p.html, 'class="slide"', "第 " + (i + 1) + " 页不是幻灯片");
    eq(p.html.indexOf("undefined"), -1, "第 " + (i + 1) + " 页出现 undefined");
  });
});

t("页面带板块归属", function(){
  var deck = buildDeck("tpl-full", fresh());
  eq(deck.pages[0].section.name, "封面");
  eq(deck.pages[3].section.name, "研学行程汇总");
});

t("封面页绑定标题与副标题", function(){
  var deck = buildDeck("tpl-full", fresh());
  has(deck.pages[0].html, "2026 春季 · 徽州研学营");
  has(deck.pages[0].html, "4 天 3 晚");
});

t("亮点页渲染三个卡片", function(){
  var deck = buildDeck("tpl-full", fresh());
  var html = deck.pages[1].html;
  has(html, "徽墨描金"); has(html, "古村测绘"); has(html, "家书写作");
  eq(deck.pages[1].slots.length, 3);
});

t("行程页渲染 D1–D4", function(){
  var deck = buildDeck("tpl-full", fresh());
  var html = deck.pages[3].html;
  has(html, "D1"); has(html, "D4"); has(html, "合肥 → 屯溪");
});

/* ---------- Markdown 文案模板 ---------- */

t("文案模板按板块生成标题行", function(){
  var md = deckMarkdownTemplate("tpl-full");
  has(md, "# ");
  has(md, "## 行程亮点");
  has(md, "## 研学行程汇总");
  has(md, "## 关键数据");
  has(md, "## 报名须知");
  has(md, "| 日程 | 行程 | 内容 |");
});

t("模板只包含所选方案已有的板块", function(){
  var md = deckMarkdownTemplate("tpl-cover");
  has(md, "# ");
  eq(md.indexOf("## 行程亮点"), -1, "封面模板不应出现亮点板块");
  eq(md.indexOf("## 报名须知"), -1, "封面模板不应出现须知板块");
});

t("示例文案可序列化为 Markdown", function(){
  var md = contentToMarkdown("tpl-full", fresh());
  has(md, "2026 春季 · 徽州研学营");
  has(md, "徽墨描金");
  has(md, "| D1 | 合肥 → 屯溪 | 开营仪式 · 徽文化导论 |");
  has(md, "- 4 天 | 行程天数");
});

t("Markdown 往返解析字段一致", function(){
  var c = fresh();
  var md = contentToMarkdown("tpl-full", c);
  var r = parseMarkdownContent(md);
  eq(r.content.cover.title, c.cover.title);
  eq(r.content.cover.subtitle, c.cover.subtitle);
  eq(r.content.cover.tag, c.cover.tag);
  eq(r.content.highlights.length, c.highlights.length);
  eq(r.content.highlights[0].title, c.highlights[0].title);
  eq(r.content.highlights[0].text, c.highlights[0].text);
  eq(r.content.itinerary.length, c.itinerary.length);
  eq(r.content.itinerary[2].route, c.itinerary[2].route);
  eq(r.content.summary.length, c.summary.length);
  eq(r.content.summary[0].value, c.summary[0].value);
  eq(r.content.summary[0].unit, c.summary[0].unit);
  eq(r.content.summary[0].label, c.summary[0].label);
  eq(r.content.note.length, c.note.length);
  eq(r.warnings.length, 0, "往返解析不应有提醒");
});

t("解析空文档会给出全部缺失提醒", function(){
  var r = parseMarkdownContent("");
  ok(r.warnings.length >= 4, "缺失提醒太少：" + r.warnings.length);
  eq(r.content.highlights.length, 0);
});

t("解析结果可直接用于排版", function(){
  var md = contentToMarkdown("tpl-full", fresh());
  var parsed = parseMarkdownContent(md);
  var deck = buildDeck("tpl-full", parsed.content);
  eq(deck.pages.length, 6);
  has(deck.pages[0].html, "2026 春季 · 徽州研学营");
  eq(deck.pages[0].issues.length, 0, "正常文案不应触发问题");
});

/* ---------- 配图 ---------- */

t("默认图片走图库命中", function(){
  state.wizard.images = {};
  var d = decisionFor("p-hl-1:0");
  eq(d.source, "gallery");
  ok(!!galleryById(d.galleryId), "图库 id 不存在");
});

t("手动指定优先于图库", function(){
  state.wizard.images = {};
  state.wizard.images["p-hl-1:1"] = { source:"manual", galleryId:"g5" };
  var deck = buildDeck("tpl-full", fresh());
  has(deck.pages[1].html, "手动指定");
  has(deck.pages[1].html, "窑址考察");
});

t("标记待配图后渲染占位色块", function(){
  state.wizard.images = {};
  state.wizard.images["p-hl-1:2"] = { source:"todo", galleryId:null };
  var deck = buildDeck("tpl-full", fresh());
  has(deck.pages[1].html, "待配图");
  ok(deck.pages[1].issues.some(function(x){ return x.text.indexOf("待配图槽位") >= 0; }), "缺图未进入问题列表");
  state.wizard.images = {};
});

t("图片标签映射正确", function(){
  eq(imageLabel({ source:"manual" }), "手动指定");
  eq(imageLabel({ source:"gallery" }), "图库命中");
  eq(imageLabel({ source:"todo" }), "待配图");
  eq(imageLabel(null), "待配图");
});

t("超长文案触发字数预算告警", function(){
  var c = fresh();
  c.cover.title = "这是一个明显超过预算的超长封面标题用于验证溢出检测逻辑是否生效且可提示";
  var deck = buildDeck("tpl-full", c);
  ok(deck.pages[0].issues.length > 0, "未检出溢出");
  has(deck.pages[0].issues[0].text, "字数预算");
});

__results.join("\n");
