# 赛博记忆公墓

赛博记忆公墓是一个 Gonka-first 黑客松应用。它以虾米音乐为主案例，整理公开的 Web2 遗址证据，调用 Gonka Router 的两个不同模型进行交叉验证，并生成 Truth Score、分数差、共识置信度、Request ID、可验证档案和可下载的纪念凭证。

这是一个原生 HTML、CSS、JavaScript 前端和 Python 本地代理组成的 MVP。前端不持有 Gonka 或 Pinata 密钥。

## 事实状态

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

## 证据与隐私边界

- 可封存的证据只包含公开、简短、事实性的摘要和来源元数据，例如来源标题、公开 URL 和检索时间。
- 不将受版权保护的长文、私人内容或付费内容复制进档案。
- 纪念册访客姓名和留言仅保留在本地会话中。封存档案只包含献花、点灯和留言条数等聚合计数。

## 本地配置

本地流程使用 Python 3.9 或更高版本，Render 配置固定为 Python 3.11.9。Node.js 只用于 JavaScript 和 Playwright 测试。在仓库根目录创建 `.env`，可使用下列安全默认值：

```dotenv
GONKA_API_KEY=
GONKA_BASE_URL=https://api.gonkascan.com/v1
GONKA_MODEL=auto
GONKA_ARCHAEOLOGIST_MODEL=auto
GONKA_VERIFIER_MODEL=auto
GONKA_MODEL_PREFERENCE=MiniMaxAI/MiniMax-M2.7,moonshotai/Kimi-K2.6
GONKA_TIMEOUT_SECONDS=35
GONKA_MAX_TOKENS=180
VERIFICATION_CACHE_TTL_SECONDS=3600
VERIFICATION_RECEIPT_TTL_SECONDS=900

PINATA_JWT=
PINATA_PIN_JSON_URL=https://api.pinata.cloud/pinning/pinJSONToIPFS
PINATA_GATEWAY_URL=https://gateway.pinata.cloud/ipfs/

HOST=127.0.0.1
PORT=5177
```

保持 `GONKA_API_KEY=` 为空时，服务使用 `demo_fallback` 且不调用 Gonka。只有拿到真实 Gonka 凭据后，才将它粘贴到等号后。`PINATA_JWT` 是可选项，保持为空时不调用 Pinata，仍可完成本地封存、SHA-256 校验和凭证下载。只在拥有真实 Pinata JWT 时才填入该值。不要提交 `.env`。

安装测试依赖并启动服务：

```bash
npm install
python3 server.py
```

打开 `http://127.0.0.1:5177`。启动时会从 `.env` 读取配置，已存在的 shell 环境变量优先。未配置 `GONKA_API_KEY` 时，页面仍可以以 `DEMO FALLBACK` 完成演示。

## 一键虾米流程

1. 点击「进入公墓」。
2. 在「调查控制台」点击「一键演示」。
3. 流程自动选择虾米音乐，收集公开证据，并请求两个 Gonka 模型。
4. 检查状态标签、模型名、Request ID、Truth Score、分数差和共识置信度。
5. 流程自动封存当前验证 payload。未配置 Pinata 时应显示本地封存和 SHA-256，不应显示 CID。
6. 生成并下载纪念凭证或 NFT-ready metadata。这些都是文件，不是链上铸造记录。

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

`npm run test:browser` 故意设置 `reuseExistingServer: false`，运行前必须停止任何手动占用 5177 端口的服务，否则 Playwright 会拒绝启动。Playwright 使用隔离的 Chromium，所有 Wayback、Gonka 和 Pinata 相关浏览器请求均由测试路由接管，分别在桌面和移动端运行 10 个流程测试，共 20 个测试；真实 Gonka 探针是套件之外的单独人工验证。

## Render 部署配置

`render.yaml` 定义了一个 Python Web Service：

- 构建命令：`python3 -m py_compile server.py cemetery_core.py verification_cache.py verification_trust.py`
- 启动命令：`python3 server.py`
- 健康检查：`/api/status`
- 宿主绑定：`HOST=0.0.0.0`
- Python 版本：`3.11.9`
- 必需秘密环境变量：`GONKA_API_KEY`
- 可选秘密环境变量：`PINATA_JWT`

在 Render 创建 Blueprint 后，需要在服务设置中填入秘密值。本仓库不包含公开部署凭证或已部署 URL，因此提交清单中的公开 URL 项保持未勾选。

## 故障排查

- `/api/status` 的 `gonka` 为 `demo_fallback`：检查 `.env` 中是否配置 `GONKA_API_KEY`，然后重启服务。
- 页面显示 `CACHED LIVE`：当前 Gonka 请求失败，系统恢复了之前的实时共识缓存。这不是当前实时验证。
- 缓存未恢复：检查案例、证据版本、证据 digest 和模型集合是否完全匹配，并确认记录未超过 `VERIFICATION_CACHE_TTL_SECONDS`。
- 服务端封存回退到浏览器本地封存：验证回执可能缺失、与证据不匹配、已过期，或因服务重启变得不可识别。重新运行 Gonka 会诊可取得新回执。
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
