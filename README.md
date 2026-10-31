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

提交信息采用 `type(scope): summary`，例如 `feat(layout): 增加三栏图文版式`。

## 远端配置

```text
origin  https://github.com/hl54hlhl2008/ppt-template-layout.git
```

本地仓库已初始化（`main`）、完成首次提交，并已指向该地址。远端仓库尚未创建，
创建后即可推送：

1. 打开 <https://github.com/new>，仓库名填 `ppt-template-layout`，**不要**勾选
   "Add a README file"（避免与本地首次提交冲突），建议选 Private。
2. 在本地仓库目录执行：

```bash
git push -u origin main
```

## 未完成的推送与排错记录

当前环境实测结论（详见下表）：网络到 GitHub 正常，阻塞点在**认证与远端仓库是否存在**。

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| `remote: Repository not found.` | 远端仓库 `hl54hlhl2008/ppt-template-layout` 尚未创建 | 按上面第 1 步在网页创建空仓库 |
| `fatal: failed to get: 100001` + `could not read Username` | macOS 钥匙串条目需人工确认，非交互 shell 读不到 token | 在终端里手动 `git push`，弹窗选"始终允许"；或改用 PAT |
| `Permission denied (publickey)` | `~/.ssh/id_ed25519.pub` 未添加到 GitHub | 粘贴公钥到 Settings → SSH keys |
| `Host key verification failed` | `github.com` 不在 `known_hosts` 且当前会话无法写入 `~/.ssh` | 在终端执行一次 `ssh -T git@github.com` 接受指纹 |
| API 创建仓库返回 `403 Resource not accessible by personal access token` | 已存的 PAT 无仓库创建权限 | 网页创建仓库，或给 PAT 勾选 Administration 写权限 |
| `src refspec # does not match any` | 把行内 `#` 注释一起粘进了 zsh；交互式 zsh 默认不解析 `#` | 命令与注释分行，或执行 `setopt interactive_comments` |
| `Permission to <user>/<repo>.git denied to <user>` + `403` | 细粒度 PAT 只有该仓库的 Contents 只读权限 | 编辑 token：Repository access 选中该仓库，Permissions → Contents → Read and write |

### 用 PAT 推送（绕过钥匙串）

```bash
export GH_TOKEN=<PAT，需 repo 权限>
REPO_NAME=ppt-template-layout ./scripts/create-github-repo.sh
```

脚本用一次性 `Authorization` 头推送，不会把 token 写进 `.git/config`。

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
