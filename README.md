# 赛博记忆公墓 · Cyber Memory Cemetery

> 赛博记忆公墓保存的不是网页，而是人类曾经在互联网上活过的证据。

线上 Demo：[https://cyber-memory-cemetery.vercel.app](https://cyber-memory-cemetery.vercel.app)

**一句话**：Web2 巨头说关服就关服，几十年的数字青春和文化痕迹被一键抹去。赛博记忆公墓用 Gonka 去中心化 AI 交叉验真 + 去中心化存储，为这些死去的社区立一块**可验证、抹不掉**的链上墓碑——用去中心化网络，对抗中心化资本对人类集体记忆的"强拆"。

## 策展理念

人人网服务暂停那天，没有讣告，没有葬礼，只有一个「正在升级」的公告。虾米音乐关停那天，几十万条歌单、乐评和收藏一起消失在 404 背后。这些社区不是被谁宣判死亡的——它们只是被悄悄拔掉了电源，连一块墓碑都没有。

赛博记忆公墓是一座由 AI Agent 策展的黑暗博物馆，专门为这些消失的 Web2 社区立碑。每一件展品都有两层：

- **文学层**：墓志铭、展品叙述、纪念文案——这一层可以写得动情，因为哀悼本身需要语言。「这里曾经有人用歌单写日记，用长评确认一首歌真的击中过自己。播放器已经停止转动，但那些在深夜被收藏、被转发、被反复听见的声音，不该被 404 安静埋葬。」（虾米音乐墓志铭）
- **事实层**：每一个可以被验证的陈述——创立年份、用户规模、关停时间、公开报道来源——都必须绑定证据链，接受两个独立 Gonka 模型的交叉审讯。文学层可以自由，事实层必须诚实。系统不允许用煽情去掩盖一个不确定的事实：任何证据不够确定的字段都会被明确降分并标注「不确定」，而不是被悄悄美化。

AI Agent 在这里扮演双重角色：**数字考古员**负责从 Wayback Machine 快照、公开报道和用户留存的记忆碎片里挖出证据；**真相校验员**负责交叉审讯这些证据，拒绝被文学层的情绪说服。两个角色跑在两个不同的 Gonka 模型上，互相不知道对方的结论，最后的 Truth Score 是它们分歧与共识的结果，而不是任何一方的一面之词。

这也是为什么公墓的每一次「立碑」都会留下痕迹：证据摘要被封存、计算哈希、可选上传 IPFS，纪念凭证可以下载。悼词会说完，但证明不会消失。

## 是什么、不是什么

赛博记忆公墓是一个 Gonka-first 黑客松应用：以虾米音乐为主案例，整理公开的 Web2 遗址证据，调用 Gonka Router 的两个不同模型进行交叉验证，生成 Truth Score、分数差、共识置信度、Request ID、可验证档案和可下载的纪念凭证。

它**不是**链上铸造、不连接钱包、不发起支付——当前版本只生成文件形态的纪念凭证和「未来兼容」的 metadata，任何"认领"都还没有发生。这是一个刻意的克制：与其抢先造一个假的链上仪式，不如先把"这段记忆是真的"这件事做扎实。

虾米展品默认展示一份标注为"历史真实调用"的 Gonka 验证记录，包含两款模型、独立评分、两个真实 Request ID、聚合分数和证据 digest。该记录用于赛道审计，不会被描述为当前页面加载产生的新请求；当前实时会诊状态仍在下方独立展示。

这是一个原生 HTML、CSS、JavaScript 前端和 Python 本地代理组成的 MVP。前端不持有 Gonka 或 Pinata 密钥。

## 对应 Gonka 赛道三（AI for Society）

赛道三要求用去中心化 AI 解决现实社会问题。我们对号入座的是"**去中心化事实核查引擎**"这一推荐场景——只是把核查对象从新闻，换成了整个正在消失的 Web2 历史遗产。

| 赛道核心必备功能 | 本项目实现 |
| --- | --- |
| **信息提取**：输入链接 / 文本 / 素材 | 「新建墓碑」支持输入已消失的网址或关键词，Agent 抓取 Wayback 快照、公开报道和用户留存的记忆碎片 |
| **去中心化核验**：多模型交叉核验 | 数字考古员与真相校验员两个角色，分别跑在 Gonka Router 的模型上独立推理、互不知情地交叉审讯 |
| **结果输出**：0-100 Truth Score + 可溯源推理 | 生成 Truth Score、模型分数差、共识置信度；每条事实绑定证据链，不确定字段主动降分并标注 |
| **透明可视化**：展示每步推理的 Gonka Request ID | 每次会诊展示两个真实 Request ID（`devshard-*`）、模型名和验证状态；虾米展品默认展示可审计的"历史真实调用"记录 |

所有 AI 推理都通过 `gonkarouter.io` 在 Gonka 网络运行，由数字考古员与真相校验员两个角色交叉核验；模型可用性与实测细节见 [`docs/gonka-integration-report.md`](docs/gonka-integration-report.md)。

---

## 技术层：如何证明一段记忆是真的

### 事实状态

验证状态决定页面标签和档案资格：

| 状态 | 含义 | 档案资格 |
| --- | --- | --- |
| `live_consensus` | 本次请求由两个不同的 Gonka 模型成功返回，且具有真实 Request ID | `verified` |
| `cached_live` | 当前实时请求失败后，恢复之前成功的 `live_consensus` 缓存 | `verified`，但不代表当前实时验证 |
| `partial` | 只有一个真实 Gonka 模型成功 | `draft`，不宣称已达成共识 |
| `demo_fallback` | 未配置密钥，或实时请求失败且没有可用缓存时的本地演示结果 | `draft`，结果的 `source` 为 `mock`，Request ID 以 `mock_` 开头 |

服务端会把规范化证据包的 schema、版本和 SHA-256 digest 与模型集合、真实 Request ID、各模型分数、Truth Score、状态和验证时间一起写入 HMAC 验证回执。回执签名密钥只存在于当前服务进程；服务重启后旧回执失效。`/api/archive/seal` 只接受未过期且与冻结档案完全匹配的回执，档案资格由服务端重新计算。

实时共识缓存只在案例 ID、证据版本、证据 digest 和两个不同模型 ID 全部匹配时恢复。默认缓存 TTL 为 3600 秒，默认验证回执 TTL 为 900 秒；`cached_live` 响应会显示经过净化的 `cacheAgeSeconds`。可通过 `VERIFICATION_CACHE_TTL_SECONDS` 和 `VERIFICATION_RECEIPT_TTL_SECONDS` 覆盖默认值。

存储状态与验证状态是两件独立的事：

| provider | 含义 |
| --- | --- |
| `local-sealed` | 规范化 JSON 已计算 SHA-256，返回 `local://sha256/...` 标识并可下载。它只是本地封存，不是永久存储证明。 |
| `pinata-ipfs` | 只在配置 `PINATA_JWT` 且 Pinata 返回 CID 后出现。回执包含 `ipfs://<CID>` 和网关 URL。 |

Pinata 未配置或上传失败时，系统保留 SHA-256 和可下载 JSON，并明确显示 `local-sealed`。系统不会伪造 CID。

纪念凭证是基于封存回执生成的可下载 JSON。只有 `live_consensus` 或兼容的 `cached_live` 与 `verified` 封存资格组合会标记为未来认领兼容；`partial` 和 `demo_fallback` 只生成中性草稿。当前版本不连接钱包、不发起链上交易，也不铸造 NFT。

### 证据与隐私边界

- 可封存的证据只包含公开、简短、事实性的摘要和来源元数据，例如来源标题、公开 URL 和检索时间。
- 不将受版权保护的长文、私人内容或付费内容复制进档案。
- 纪念册访客姓名和留言仅保留在本地会话中。封存档案只包含献花、点灯和留言条数等聚合计数。

## 本地配置

本地流程使用 Python 3.9 或更高版本，Render 配置固定为 Python 3.11.9。Node.js 只用于 JavaScript 和 Playwright 测试。在仓库根目录创建 `.env`，可使用下列安全默认值：

```dotenv
GONKA_API_KEY=
GONKA_BASE_URL=https://api.gonkarouter.io/v1
GONKA_MODEL=auto
GONKA_ARCHAEOLOGIST_MODEL=MiniMaxAI/MiniMax-M2.7
GONKA_VERIFIER_MODEL=moonshotai/Kimi-K2.6
GONKA_MODEL_PREFERENCE=MiniMaxAI/MiniMax-M2.7,moonshotai/Kimi-K2.6
GONKA_TIMEOUT_SECONDS=35
GONKA_MAX_TOKENS=1024
VERIFICATION_CACHE_TTL_SECONDS=3600
VERIFICATION_RECEIPT_TTL_SECONDS=900
VERIFICATION_SIGNING_SECRET=
VERIFICATION_CACHE_DIR=

PINATA_JWT=
PINATA_PIN_JSON_URL=https://api.pinata.cloud/pinning/pinJSONToIPFS
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/

HOST=127.0.0.1
PORT=5177
```

保持 `GONKA_API_KEY=` 为空时，服务使用 `demo_fallback` 且不调用 Gonka。只有拿到真实 Gonka 凭据后，才将它粘贴到等号后。`PINATA_JWT` 是可选项，保持为空时不调用 Pinata，仍可完成本地封存、SHA-256 校验和凭证下载。只在拥有真实 Pinata JWT 时才填入该值。不要提交任何 `.env*` 文件（`.gitignore` 已按通配符忽略，`.env.example` 除外）。

安装测试依赖并启动服务：

```bash
npm install
python3 server.py
```

打开 `http://127.0.0.1:5177`。启动时会从 `.env` 读取配置，已存在的 shell 环境变量优先。未配置 `GONKA_API_KEY` 时，页面仍可以以 `DEMO FALLBACK` 完成演示。

## 逛一遍公墓：最短路径

界面只有两个主 tab：「展品详情」（逛墓碑、看验证结果与封存）和「新建墓碑」（Agent 建碑工作台）。

1. 点击「进入公墓」，默认停在「展品详情」，主案例虾米音乐已置顶。点左上角品牌可随时返回开屏页。
2. 在虾米 Truth Score 下方查看默认可见的"历史真实调用"记录——两款模型、独立评分、两个真实 Gonka Request ID、聚合分数和证据 digest。
3. 点顶部「一键演示」：Agent 自动选择虾米 → 抓公开证据 → 查 Wayback → 请求 Gonka 会诊 → 封存档案 → 生成凭证，六步一次跑完。
4. 或走手动路径：进「新建墓碑」，输入消失网址或关键词，点「启动 Agent 考古」，跑完后回「展品详情」看结果。
5. 在会诊结果里核对状态标签、模型名、Request ID、Truth Score、分数差、共识置信度。
6. 在墓碑详情点「封存档案」：若尚未验真会**先自动跑一次 Gonka 验真**，再把规范化证据封存（配置 Pinata 后上传 IPFS，否则本地 SHA-256 封存），并**自动生成可下载的纪念凭证**。全程有屏幕提示，成功/失败都看得见。凭证是文件，不是链上铸造记录。

## API 与状态端点

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| `GET` | `/api/status` | 返回 `gonka`、`ipfs` 和 `cache` 的能力状态，不返回密钥或 token |
| `POST` | `/api/gonka/verify` | 规范化公开证据包，返回证据 digest、冻结验证记录和短期 HMAC 回执 |
| `POST` | `/api/archive/seal` | 验证回执和证据绑定，计算档案 SHA-256，并在可用时尝试 Pinata IPFS 上传 |

状态检查：

```bash
curl -sS http://127.0.0.1:5177/api/status
```

预期键集是 `gonka`、`ipfs` 和 `cache`。状态端点只报告是否已配置，不暴露凭证值。

## 验证命令

从仓库根目录运行完整套件：

```bash
python3 -m unittest tests/test_cemetery_core.py tests/test_verification_trust.py tests/test_server.py -v
node --test tests/core.test.cjs
python3 -m py_compile server.py cemetery_core.py verification_cache.py verification_trust.py
node --check core.js
node --check app.js
npm run test:browser
```

`npm run test:browser` 故意设置 `reuseExistingServer: false`，运行前必须停止任何手动占用 5177 端口的服务，否则 Playwright 会拒绝启动。Playwright 使用隔离的 Chromium，所有 Wayback、Gonka 和 Pinata 相关浏览器请求均由测试路由接管，分别在桌面和移动端运行 18 个流程测试，共 36 个测试；真实 Gonka 探针是套件之外的单独人工验证。

## Render 部署配置

`render.yaml` 定义了一个 Python Web Service：

- 构建命令：`python3 -m py_compile server.py cemetery_core.py verification_cache.py verification_trust.py`
- 启动命令：`python3 server.py`
- 健康检查：`/api/status`
- 宿主绑定：`HOST=0.0.0.0`
- Python 版本：`3.11.9`
- 必需秘密环境变量：`GONKA_API_KEY`
- 可选秘密环境变量：`PINATA_JWT`

在 Render 创建 Blueprint 后，需要在服务设置中填入秘密值。当前公开版本部署在 Vercel，Render 配置保留为备用部署方式。

## Vercel 部署配置

仓库同时提供三个 Python Function 入口：`/api/status`、`/api/gonka/verify` 和 `/api/archive/seal`。静态前端仍从项目根目录直接发布，`vercel.json` 将会诊函数最大执行时间设为 60 秒。

Vercel 生产环境需要配置：

- `GONKA_API_KEY`：Gonka Router 密钥。
- `GONKA_BASE_URL=https://api.gonkarouter.io/v1`。
- `GONKA_ARCHAEOLOGIST_MODEL` 与 `GONKA_VERIFIER_MODEL`：两个不同的可用模型。
- `VERIFICATION_SIGNING_SECRET`：至少 16 字符的随机值，保证不同 Serverless 函数可以验证同一份短期回执。
- 可选 `PINATA_JWT`：配置后永久档案会尝试上传 IPFS；未配置时明确显示 `local-sealed`。

Vercel 的函数文件系统仅允许写入 `/tmp`，应用在 Vercel 环境下会自动把兼容性缓存写入 `/tmp/cyber-memory-cemetery-cache`。该缓存是临时缓存，不作为永久档案；永久档案仍以 Pinata 返回的 CID 为准。

## 故障排查

- `/api/status` 的 `gonka` 为 `demo_fallback`：检查 `.env` 中是否配置 `GONKA_API_KEY`，然后重启服务。
- 页面显示 `CACHED LIVE`：当前 Gonka 请求失败，系统恢复了之前的实时共识缓存。这不是当前实时验证。
- 缓存未恢复：检查案例、证据版本、证据 digest 和模型集合是否完全匹配，并确认记录未超过 `VERIFICATION_CACHE_TTL_SECONDS`。
- 服务端明确拒绝验证回执（缺失、格式错误、不匹配、过期或未授权）时，封存会停止，不会创建浏览器本地封存。已有的成功封存和纪念凭证会保留；重新运行 Gonka 会诊取得新回执后才能再次封存。
- 只有请求未收到任何 HTTP 响应（例如网络中断）时，浏览器才创建本地封存。收到 4xx、5xx 或格式错误的 2xx 响应都不会触发浏览器本地回退；临时 5xx 可使用同一份已验证 payload 和回执重试封存。
- 页面显示 `PARTIAL`：只有一个模型成功，检查模型可用性、超时和 Router 响应。
- 档案显示 `local-sealed`：当前没有可用的 Pinata CID。配置 `PINATA_JWT` 后重新封存，或继续使用本地 JSON 和 SHA-256 进行演示。
- 端口被占用：使用其他端口启动，例如 `PORT=5180 python3 server.py`。
- Playwright 缺少浏览器：运行 `npx playwright install chromium`。
- Playwright 报告 5177 端口占用：先停止手动运行的 `python3 server.py`，再执行 `npm run test:browser`。
- Pinata 返回错误或缺少 CID：档案会降级为 `local-sealed`，不会构造 CID。

## 明确排除的功能

- 钱包连接。
- 付费、付款授权和支付账本。
- 链上 NFT 铸造。当前仅生成可下载纪念凭证和未来兼容 metadata。
- 演示视频录制。

提交前状态见 [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md)。
