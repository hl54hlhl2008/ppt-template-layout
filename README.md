# ppt模板化排版

PPT 模板化排版工程：模板资源、排版脚本与导出产物的统一版本管理仓库。

## 目录约定

| 路径 | 用途 |
| --- | --- |
| `templates/` | `.pptx` / `.potx` 母版与版式模板 |
| `assets/` | 图片、字体、图标等静态资源 |
| `scripts/` | 排版、批量导出、校验脚本 |
| `output/` | 生成结果（已在 `.gitignore` 中忽略） |

## 分支策略

- `main`：可发布状态，始终保持可导出。
- `feat/*`：单个版式或脚本改动。
- `fix/*`：缺陷修复。

提交信息采用 `type(scope): summary` 形式，例如
`feat(layout): 增加三栏图文版式`。

## 首次推送到 GitHub

仓库已初始化并完成本地首次提交，远端地址使用占位符 `GITHUB_USER`。
二选一：

### A. 一条命令创建远端并推送（Token 方式，无需安装 gh）

```bash
export GH_TOKEN=<你的 PAT，需 repo 权限>
export GITHUB_USER=<你的 GitHub 用户名>     # 可省略，脚本会自动获取
./scripts/create-github-repo.sh              # 默认创建 private 仓库
```

### B. 手动创建

1. 在 GitHub 网页 New repository，名称 `ppt-template-layout`，不要勾选初始化 README。
2. 本地执行：

```bash
git remote add origin https://github.com/GITHUB_USER/ppt-template-layout.git
git push -u origin main
```

### C. SSH 方式（需先把公钥加到 GitHub）

```bash
cat ~/.ssh/id_ed25519.pub          # 复制到 GitHub → Settings → SSH keys
git remote add origin git@github.com:GITHUB_USER/ppt-template-layout.git
git push -u origin main
```

## 日常操作

```bash
git status                 # 查看改动
git add -A && git commit -m "feat(layout): 说明"
git push                   # 推送到 origin/main
git pull --rebase          # 拉取并变基，保持线性历史
```

## 大文件说明

`.pptx` 等二进制模板会随历史增长。单个文件超过 50 MB 时改用 Git LFS：

```bash
git lfs install
git lfs track "*.pptx"
git add .gitattributes && git commit -m "chore: 启用 Git LFS 管理 pptx"
```
