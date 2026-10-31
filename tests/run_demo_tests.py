#!/usr/bin/env python3
"""运行 demo 逻辑测试。

做法：从 demo/index.html 抽出内联脚本，前面补一层最小 DOM shim，
后面接 tests/demo_logic_test.js，在 QuickJS(dukpy) 里执行。

依赖：pip install dukpy（仅测试用）。缺失时跳过并返回 0，同时打印提示，
以便没有 Python 依赖的环境（如纯浏览器用户）也能提交。
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEMO = ROOT / "demo" / "index.html"
TESTS = ROOT / "tests" / "demo_logic_test.js"

SHIM = r"""
var __noop = function(){};
function mkEl(){
  return {
    innerHTML:"", textContent:"", style:{}, dataset:{},
    classList:{ toggle:__noop, add:__noop, remove:__noop },
    querySelector:function(){ return null; },
    querySelectorAll:function(){ return []; },
    appendChild:__noop, remove:__noop, addEventListener:__noop, focus:__noop,
    closest:function(){ return null; }
  };
}
var document = {
  querySelector:function(){ return mkEl(); },
  querySelectorAll:function(){ return []; },
  getElementById:function(){ return mkEl(); },
  createElement:function(){ return mkEl(); },
  addEventListener:__noop, body:mkEl()
};
var window = { addEventListener:__noop, scrollTo:__noop };
var location = { hash:"" };
var history = { replaceState:__noop };
var setTimeout = function(){ return 0; };
var console = { log:function(){}, warn:function(){}, error:function(){} };
"""


def main() -> int:
    html = DEMO.read_text(encoding="utf-8")
    m = re.search(r"<script>(.*?)</script>", html, re.S)
    if not m:
        print("demo/index.html 中未找到内联脚本")
        return 1
    script = m.group(1)

    try:
        import dukpy
    except ImportError:
        print("跳过：未安装 dukpy（pip install dukpy 后重跑）")
        return 0

    program = SHIM + "\n" + script + "\n;\n" + TESTS.read_text(encoding="utf-8")
    try:
        out = dukpy.evaljs(program)
    except Exception as exc:  # 脚本自身异常（语法或运行期）
        print("Demo 脚本执行失败：%s" % exc)
        return 1

    lines = str(out).splitlines()
    failed = [ln for ln in lines if ln.startswith("FAIL")]
    for ln in lines:
        print("  " + ln)
    print("\n通过 %d 项，失败 %d 项" % (len(lines) - len(failed), len(failed)))
    return 0 if not failed else 1


if __name__ == "__main__":
    sys.exit(main())
