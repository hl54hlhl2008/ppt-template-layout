#!/usr/bin/env bash
# 在 GitHub 上创建仓库并将本地 main 分支推送上去。
# 用法：
#   export GH_TOKEN=<PAT，需 repo 权限>
#   export GITHUB_USER=<用户名>        # 可选，留空则通过 API 自动获取
#   ./scripts/create-github-repo.sh
# 可选环境变量：REPO_NAME（默认 ppt-template-layout）、VISIBILITY（private|public）
set -euo pipefail

REPO_NAME="${REPO_NAME:-ppt-template-layout}"
VISIBILITY="${VISIBILITY:-private}"
TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
USER="${GITHUB_USER:-hl54hlhl2008}"

die() { printf '错误: %s\n' "$1" >&2; exit 1; }

[ -n "$TOKEN" ] || die "未设置 GH_TOKEN（GitHub → Settings → Developer settings → Personal access tokens，勾选 repo 权限）"
command -v curl >/dev/null || die "缺少 curl"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "当前目录不是 git 仓库"

api() { curl -fsS -H "Authorization: Bearer $TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" "$@"; }

if [ -z "$USER" ]; then
  USER="$(api https://api.github.com/user | sed -n 's/.*"login": *"\([^"]*\)".*/\1/p' | head -1)"
  [ -n "$USER" ] || die "无法获取 GitHub 用户名，请显式设置 GITHUB_USER"
fi

echo "→ 账号: $USER  仓库: $REPO_NAME  可见性: $VISIBILITY"

# 仓库已存在时 API 返回 422，直接复用
if api "https://api.github.com/repos/$USER/$REPO_NAME" >/dev/null 2>&1; then
  echo "→ 远端仓库已存在，复用"
else
  if ! api -X POST https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"private\":$([ "$VISIBILITY" = private ] && echo true || echo false),\"description\":\"PPT 模板化排版工程\"}" \
    >/dev/null 2>/tmp/gh_create_err.txt; then
    printf '创建仓库失败: %s\n' "$(tr -d '\n' < /tmp/gh_create_err.txt)" >&2
    die "若提示 Resource not accessible by personal access token，请到 https://github.com/new 手动创建空仓库 $REPO_NAME 后重跑本脚本"
  fi
  echo "→ 已创建远端仓库"
fi

REMOTE_URL="https://github.com/$USER/$REPO_NAME.git"
git remote remove origin >/dev/null 2>&1 || true
git remote add origin "$REMOTE_URL"

# 用一次性 Authorization 头推送，不把 token 写进 .git/config
AUTH="$(printf 'x-access-token:%s' "$TOKEN" | base64 | tr -d '\n')"
GIT_TERMINAL_PROMPT=0 git -c http.extraheader="AUTHORIZATION: basic $AUTH" push -u origin main

echo "完成: $REMOTE_URL"
