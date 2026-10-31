#!/usr/bin/env bash
# 仓库基础校验：文档齐备、规则落地、无冲突残留。
# 用法: ./tests/test_repo.sh   （全部用例通过时退出码为 0）
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 1

pass=0
fail=0
ok()   { printf '  ok   %s\n' "$1"; pass=$((pass + 1)); }
bad()  { printf '  FAIL %s\n' "$1"; fail=$((fail + 1)); }
case_() { if eval "$2"; then ok "$1"; else bad "$1"; fi; }

echo "== 1. 仓库结构 =="
case_ "是 git 仓库"            "[ -d .git ]"
case_ "AGENTS.md 存在"         "[ -s AGENTS.md ]"
case_ "README.md 存在"         "[ -s README.md ]"
case_ ".gitignore 存在"        "[ -s .gitignore ]"
case_ "templates/ 存在"        "[ -d templates ]"
case_ "assets/ 存在"           "[ -d assets ]"

echo "== 2. AGENTS.md 规则 =="
case_ "包含提交规则"           "grep -q 'Git commit' AGENTS.md"
case_ "包含测试规则"           "grep -q '测试' AGENTS.md"
case_ "两条规则均为列表项"     "[ \"\$(grep -c '^- ' AGENTS.md)\" -ge 2 ]"

echo "== 2b. 产品设计文档 =="
case_ "docs/PRD.md 存在"       "[ -s docs/PRD.md ]"
case_ "含核心概念章节"         "grep -q '^## 3. 核心概念' docs/PRD.md"
case_ "含功能模块章节"         "grep -q '^## 5. 功能模块' docs/PRD.md"
case_ "含 MVP 里程碑"          "grep -q '^## 7. MVP 范围与里程碑' docs/PRD.md"
case_ "M1/M2/M3 均定义"        "[ \"\$(grep -cE '^\| M[123] ' docs/PRD.md)\" -ge 3 ]"
case_ "配图优先级链完整"       "grep -q '手动指定 > 图库命中 > 待配图清单' docs/PRD.md"

echo "== 3. 卫生检查 =="
case_ "脚本可执行"             "[ -x scripts/create-github-repo.sh ]"
case_ "脚本语法正确"           "bash -n scripts/create-github-repo.sh"
case_ "无合并冲突残留"         "! grep -rIl -E '^(<<<<<<< |>>>>>>> )' --include='*.md' --include='*.sh' --include='*.py' . 2>/dev/null | grep -q ."
case_ "无 .DS_Store 入库"      "! git ls-files | grep -q '.DS_Store'"
case_ "无 Office 临时文件入库" "! git ls-files | grep -qE '~\\\$'"

echo "== 4. 提交与远端 =="
case_ "存在至少一个提交"       "git rev-parse --verify HEAD >/dev/null 2>&1"
case_ "已配置远端 origin"      "git remote get-url origin >/dev/null 2>&1"

printf '\n通过 %d 项，失败 %d 项\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
