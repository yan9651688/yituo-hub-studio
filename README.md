> 🤝 **本项目由 [颜](https://github.com/yan9651688) × 蓝梦（[lanmengSakura](https://github.com/lanmengSakura)）联合打造** —— 排版引擎与产品体验来自颜，原创视觉与动效组件库来自蓝梦的 wechat-motion-layout-studio。

<div align="center">

# Yi Tuo Hub · 公众号排版工坊

**把 Markdown 一键排成可直接粘贴进微信公众号编辑器的精致 HTML**

18 套基础主题 · 15 套高级排版 · 76 种分级组合 · 74 组动静态组件 · 一键复制

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Themes](https://img.shields.io/badge/themes-18%2B15-1D4ED8)](#-两个主题库18--15)
[![Advanced](https://img.shields.io/badge/高级排版-76-705B8C)](#-高级排版分级视觉)
[![No Build](https://img.shields.io/badge/构建-零依赖-success)](#-快速开始)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-作者)

</div>

---

打开网页，粘贴 Markdown，选一套主题，点「复制到公众号」——粘贴进编辑器，**样式纹丝不丢**。每段自动标关键词下划线、章节自动编号配英文小标、引言卡与导读目录自动生成、文末签名自动合并、中英标点自动全角化，并在你点击复制前用合规校验器把公众号编辑器的所有红线兜一遍。

## 🌐 在线体验

- **<https://studio.yituohub.com>** —— 打开首页，点「开始排版」即可

## ✨ 核心特性

- **两个并列主题库**：18 套基础主题与 15 套高级排版（蓝梦原创视觉）在工具栏独立选择，不使用“全部 33 套”的混合视图。
- **六档高级排版**：“高级排版”库提供 L1 黑白极简单例，以及 15 套主题各自的 L2–L6；静态简约、静态标题栏、静态主题场景、标题动效和完整主题动效都在原 Studio 内切换。
- **动态 / 静态成对**：L5、L6 可直接切换为几何一致的静态回退；正文、章节文字始终保持普通可编辑 HTML。
- **终稿结构不重造**：L4–L6 直接以冻结的 V24 静态终稿和其 V6 动态派生模板为结构源；标题、导读框、目录、章节装饰与尾部 `content_anchor` 原样保留，只替换 Markdown 文本槽。
- **不掉格式**：样式全部内联、文字一律 `<span leaf="">` 包裹；基础主题继续规避脆弱布局，高级排版仅保留终稿透明叠层所必需的 `display:grid`，不使用 absolute/fixed/sticky 定位。
- **智能排版**：每段第一个 `**加粗**` 自动升级为主题色关键词下划线；`==荧光笔==`、`++下划线++` 扩展语法；章节自动编号（01/02…）+ 英文小标（实战→PRACTICE、总结→SUMMARY）。
- **杂志级封面**：`# 标题 / 副标题` 一行生成编辑部风杂志卡——刊头小字、双色大标题、关键词行、彩色底栏。
- **按需内联资产**：只加载当前主题所需的 Production V6 组件或最终模板；复制结果仍是没有本地路径依赖的自包含正文。
- **双关卡质量校验**：产物实时过平台红线检查（禁用标签/属性、`span leaf` 覆盖率、中英混排半角标点提醒），ERROR 清零才建议交付。
- **一键复制 / 下载**：富文本直接进剪贴板，公众号编辑器 ⌘V 即达；另提供 .html 下载兜底。
- **零构建零后端**：纯静态文件，无依赖无框架，任何一台 nginx 都能跑。

## 👀 产品预览

<table>
<tr>
<td width="50%" align="center"><img src="assets/landing-preview.png" width="100%"><br><sub><b>电影感首页 · 照片级雪山 + 云雾漂移 + 鼠标视差</b></sub></td>
<td width="50%" align="center"><img src="assets/studio-preview.png" width="100%"><br><sub><b>排版工坊 · 粘贴即所得，右侧实时预览</b></sub></td>
</tr>
</table>

## 🎨 两个主题库（18 + 15）

| 分组 | 主题 |
|------|------|
| **杂志编辑部**（原创 6 套） | 深海蓝 `#1D4ED8` · 曙光橙 `#EA580C` · 星穹紫 `#7C3AED` · 鎏金黑 `#111827` · 青瓷 `#0F766E` · 绯樱 `#DB2777` |
| **经典复刻**（致敬 [gzh-design-skill](https://github.com/isjiamu/gzh-design-skill)） | 摸鱼绿 · 红白风 · 石墨极简 · 留白禅意 · 摸鱼票据 · 橄榄手记 |
| **新锐系列** | 摩卡 · 勃艮第 · 午夜靛蓝 · 芒果琥珀 · 湖水青 · 燕麦拿铁 |
| **高级排版**（蓝梦原创视觉，来自 [wechat-motion-layout-studio](https://github.com/lanmengSakura/wechat-motion-layout-studio)，15 套） | 墨红社论 · 黑金刊读 · 珊瑚杂志 · 瑞士信号 · 柑橘报告 · 蓝图网格 · 稻纸朱砂 · 植物手记 · 柔和陶土 · 深海终端 · 雾蓝研究 · 紫灰工作室 · 新粗野 · 暗夜编辑 · 档案棕褐 |

> 基础主题仍由 `themes.js` 的参数化 spec 管理；“高级排版”使用蓝梦原创的独立注册表与 Production V6 组件，避免和基础换色模板混为一类。

## ✨ 高级排版分级视觉

完整矩阵为 **1 个黑白极简单例 + 15 套主题 × 5 个主题等级 = 76 种组合**：

| 等级 | 输出 |
|------|------|
| L1 黑白极简 | 唯一单例，无主题色、SVG 与动效 |
| L2 静态简约 | 15 套定稿静态结构 |
| L3 静态装饰标题栏 | 静态标题引导线 + 章节路径装饰 |
| L4 静态主题场景 | 冻结 V24 完整静态模板，含标题、导读、目录、章节与尾部锚点 |
| L5 标题场景动效 | V6 动态标题 + V24 其余静态终稿结构 |
| L6 完整主题动效 | 由 V24 静态终稿派生的完整 V6 动态模板 |

L5、L6 右侧会出现「动态 / 静态回退」切换。两份输出使用同一组 viewBox 与锚点几何；自动测试同时锁定 30 份最终模板哈希及尾部 `content_anchor`。浏览器通过只能证明本地结构正确；正式发布前仍需在目标公众号编辑器中完成粘贴、保存、重开与真机预览。

## ✅ 适合 / ❌ 不适合

**✅ 适合**：教程 · 测评 · 观点长文 · 知识清单 · 数据复盘 · 生活随笔 · 品牌专栏 —— 凡是要发公众号的 Markdown / 纯文本，选主题一键排成合规 HTML。

**❌ 不适合**：普通网页 / 落地页 · PPT · 纯图片海报 · **代写文章**（本工具只排版、不写作——先有稿子再用它）。

## 🚀 快速开始

```bash
git clone https://github.com/yan9651688/yituo-hub.git
cd yituo-hub
python3 -m http.server 8123
# 打开 http://localhost:8123 —— 首页
# 打开 http://localhost:8123/studio.html —— 排版工坊
```

运行开发校验（Node.js 20.19+ / 22.13+ / 24+）：

```bash
npm install
npm test
```

运行站点本身不需要 Node.js 依赖或构建步骤；npm 依赖仅用于自动化测试。

部署到服务器（任选）：

```bash
./deploy.sh root@你的服务器IP                          # rsync + nginx reload
docker build -t yituo-hub . && docker run -d -p 80:80 yituo-hub
```

## ⌨️ 输入语法速览

````markdown
# 标题 / 副标题        ← 自动生成杂志封面（刊头 + 双色标题 + 彩色底栏）
## 章节标题            ← 自动编号 + 英文小标（01 PART · PRACTICE）
**加粗**               ← 每段第一个自动升级为主题色关键词下划线
==荧光笔==  ++下划线++  ← 扩展标记语法
> 引用                 ← 文首自动转引言卡，正文为左竖条引用
```bash … ```           ← macOS 红绿灯代码块，粘贴后缩进不乱
文末「我是 XX，…点赞在看转发」 ← 自动识别并合并进统一签名区
````

## 🗂 项目结构

```
├── index.html        电影感首页（雪山云雾 + 鼠标视差）
├── studio.html       排版工坊
├── themes.js         基础主题引擎与通用排版组件
├── original-visuals-data.js  15 套原创主题与 6 档等级注册表
├── original-visuals.js       原创完整文章组合与动静态回退渲染器
├── converter.js      Markdown → 语义 token（含智能标记策略）
├── validator.js      公众号平台红线校验器
├── app.js            工坊前端（并列主题库 + 原创等级选择）
├── motion/           Production V6（74 组 / 148 个 SVG + 30 份最终静态/动态模板）
└── deploy.sh / Dockerfile / nginx.conf
```

## 🤝 作者

<div align="center">

<table>
<tr>
<td width="50%" align="center"><img src="assets/qr-yan.jpg" width="200" height="200"><br><sub><b>颜</b> · <a href="https://github.com/yan9651688">yan9651688</a> · 排版引擎与产品</sub></td>
<td width="50%" align="center"><img src="assets/qr-lanmeng.jpg" width="200" height="200"><br><sub><b>蓝梦</b> · <a href="https://github.com/lanmengSakura">lanmengSakura</a> · 原创分级视觉与动静态组件</sub></td>
</tr>
</table>

欢迎扫码交流公众号排版与 AI 写作工作流，PR 与 Issue 同样欢迎。

</div>

## 🙏 致谢

- [gzh-design-skill](https://github.com/isjiamu/gzh-design-skill)（AGPL-3.0，甲木 × 摸鱼小李）——本项目的排版工作流、平台红线标准与「经典复刻」组主题的配色来源
- [wechat-motion-layout-studio](https://github.com/lanmengSakura/wechat-motion-layout-studio)（蓝梦）——15 套原创视觉与 Production V6 动效组件的来源
- 首页雪山摄影来自 [Pexels](https://www.pexels.com/)（免费商用许可）

## 📄 License

[AGPL-3.0](LICENSE)。基于 gzh-design-skill 二次开发，修改与分发须遵循同一协议并保留原项目署名；`motion/` 动效库版权归蓝梦所有。
