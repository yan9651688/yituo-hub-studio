# YI TUO HUB GZH CLI

给 Agent 的微信公众号排版与存稿能力。

它接收已经写好的 Markdown（可以带本地图片或远程图片），调用 YI TUO HUB STUDIO 的排版引擎生成公众号正文；用户明确要求存稿时，CLI 直接调用微信公众号接口上传图片、创建草稿，并回读核对标题与封面。

## 安装

需要 Node.js 20 或更高版本：

```bash
curl -fsSL https://cli.yituohub.com/install.sh | bash
```

安装完成后运行：

```bash
yituo-hub-gzh --help
```

发布包同时包含 `agent-skill/yituo-hub-gzh`。在支持技能的 Agent 中，把这个目录按其技能安装方式装入 skills 目录；安装后，Agent 才会在用户明确提出公众号排版或存稿时自动引导配置并调用 CLI。

以 Codex 为例，在解压后的发布目录执行：

```bash
mkdir -p ~/.codex/skills
cp -R agent-skill/yituo-hub-gzh ~/.codex/skills/
```

## 常用命令

```bash
# 查看风格
yituo-hub-gzh styles

# 只排版，不请求微信接口
yituo-hub-gzh layout article.md \
  --style violet-studio \
  --level L4 \
  --out article_gzh.html

# 只检查，不创建草稿
yituo-hub-gzh draft article.md \
  --style violet-studio \
  --level L4 \
  --dry-run \
  --json

# 创建并核对草稿
yituo-hub-gzh draft article.md \
  --style violet-studio \
  --level L4 \
  --cover assets/cover.jpg \
  --author '作者名' \
  --json
```

## 微信配置

CLI 直接请求微信公众号接口，不经过 `cli.yituohub.com` 或其他中心服务器。

```bash
export WECHAT_APPID='你的 AppID'
export WECHAT_APPSECRET='你的 AppSecret'
yituo-hub-gzh doctor --json
```

如果返回 `40164`，把错误中微信给出的实际出口 IP 加入目标公众号的 IP 白名单。AppSecret 应只存在于调用 CLI 的本机环境，不要放进 Markdown、前端页面或 Git 仓库。

也可以运行 `yituo-hub-gzh setup`，把配置保存到本机权限为 0600 的配置文件。

## 风格选择

基础主题不需要视觉等级；高级主题支持 L1–L6。常用选择包括：

- `violet-studio`：紫灰工作室
- `deep-sea`：深海终端
- `blueprint`：蓝图网格
- `swiss-signal`：瑞士信号
- `mono-gold`：黑金刊读
- `pine-soot`：松烟刊读

运行 `styles --json` 可以拿到完整列表，适合由 Agent 展示给用户选择。

## 图片处理

- `layout` 会把图片内嵌进输出 HTML，避免依赖原始本地路径。
- `draft` 只在 CLI 进程内存/临时处理中读取图片，必要时压缩为微信支持的 JPG/PNG；上传完成后不在 YI TUO 服务器长期保存。
- 没有正文图片时必须用 `--cover` 指定封面。
- `placeholder://` 只是排版占位符，不能直接推稿。

## 安全边界

- `draft` 只创建草稿，不调用发布接口。
- Agent 只有在用户明确说“存稿”“推稿”时才调用 `draft`。
- `--json` 的 `ok`、`verified` 和 `published` 字段是结果判断依据。
- 创建成功的标准是 `ok: true`、`verified: true`、`published: false`。

本项目复用 [YI TUO HUB STUDIO](https://github.com/yan9651688/yituo-hub-studio) 的排版代码，遵循仓库现有 AGPL-3.0-or-later 许可与署名要求。
