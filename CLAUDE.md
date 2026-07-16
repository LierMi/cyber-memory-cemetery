# 赛博记忆公墓 · Cyber Memory Cemetery

黑客松项目（Gonka 赛道）。为已经关停/消失的 Web2 社区（人人网、虾米音乐等）生成可验证的"数字墓碑"：AI Agent 扮演数字考古员 + 真相校验员两个角色，跑在两个不同的 Gonka 模型上交叉验证事实，生成 Truth Score、Request ID、可下载纪念凭证。**不连接钱包、不上链、不铸造 NFT**——这是刻意的克制。

完整的策展理念 + 技术细节看根目录 [`README.md`](README.md)，那份文档本身写得比较完整，不要在这里重复。

## 现状（2026-07-16）

- **已提交 / 已部署**：代码干净，`main` 分支和 `origin/main` 同步，线上 https://cyber-memory-cemetery.vercel.app 已验证是最新代码。
- 视觉风格照搬 Emily 另一个夺冠项目 [`Digital Pompeii`](../../Desktop/Web3%20x%20AI%20共学营/AI%20x%20Web3%20Hackathon/digital-pompeii)（同一套配色 `#c4882a` 早就复用了，这次补了 Playfair Display + IBM Plex Mono 字体、加大卡片圆角、入口页背景改成"纯黑+琥珀光晕+建筑摄影"的克制处理）。
- 封存计划（`封存计划` tab）原来把同一组状态信息重复讲了 3 遍，已精简成单列：操作卡 + Evidence Chain 时间线，去掉了冗余的 readiness 清单和通用营销卡片。

## 谁在改这个仓库

Emily（真名 Lier Mi）经常**同时用另一个工具/session 并发改这个仓库**（比如"历史 Gonka Request ID"那个功能就是这样加进来的）。开始改动前后都 `git status` / `git diff --stat` 确认没有覆盖对方的工作，不要假设工作区是你上次离开时的样子。

## 代码里的坑，踩过的不要再踩

- **`styles.css` 有两层设计系统**：很多类名（`.topbar`、`.hero`、`.case-card`……）在文件里被定义了两次，后面那次（大概从行 1380 往后的"主题 v2"区块）才是实际生效的。改样式前先 `grep -n` 确认改的是哪一处，改完一定截图验证，只看第一处定义会白改。
- **`aspect-ratio` + HTML `height` 属性冲突**：`<img>` 标签如果同时带了 HTML `height` 属性和 CSS `aspect-ratio`，`height` 属性会赢（除非显式写 `height:auto`），图片会被拉伸变形。之前 `.hero-visual img` 就踩过这个坑。
- 根目录有个 `.gitignore` 用 `.env*`（配 `!.env.example` 白名单）而不是字面量 `.env`——之前真的在工作区里发现过一个手误命名的 `.envy` 文件带着真实 API key。以后任何项目都按这个模式写 `.gitignore`。
- `styles.css` 里还留着 `.entry-ghost` 一段漂浮小鬼装饰的 keyframes，写了但**没接到 HTML 里**，是死代码，不影响任何显示。如果要做小鬼装饰可以直接用这段。

## 本地跑起来

```bash
npm install
python3 server.py     # http://127.0.0.1:5177
```

`.env` 留空 `GONKA_API_KEY` 时用 `DEMO FALLBACK`，不会真的调用 Gonka。测试命令、部署配置、故障排查全在 README 里。

## 还没做完 / 可以继续打磨的方向

- 移动端没有针对最新视觉改动逐页复查过（字体/圆角/入口背景改动后只看过桌面端）。
- `调查控制台`、`展品详情` 两个 tab 除了修 bug 外没有像"封存计划"那样做过精简审查。
- `.entry-ghost` 装饰没有实际接入。
