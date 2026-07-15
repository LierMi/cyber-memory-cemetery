# 赛博记忆公墓

逛一座链上公墓，吊唁死去的 Web2 社区。

这是一个黑客松 MVP：用户输入消失网站 URL，Agent 搜索网页残骸，通过本地代理调用 Gonka Router 做多模型交叉验真，生成 Truth Score、Request ID、证据链和数字墓志铭。

## 当前版本

- 原生前端 + Python 本地代理，无 npm 依赖
- 深度案例：人人网 / 校内网、虾米音乐
- 备用入口：网易博客、天涯社区、猫扑网
- 虾米音乐预置了本地实测 Gonka Request ID：`devshard-23538-19653`、`devshard-23542-679`
- Wayback Machine CDX API 实时查询尝试
- Gonka API 未配置时自动使用本地演示数据兜底，保证现场可跑
- 墓碑详情页、时间线、证据链、隐私边界、Gonka Request ID、永久档案 JSON
- 开屏页、遗物清单、纪念册献花点灯、访客留言
- Digital Pompeii 风格 UI：左侧遗址列表、右侧墓碑详情、调查控制台、封存计划
- 墓碑元素配置：碑名、墓志铭、证据火漆、见证凭证、纪念热度、商业入口
- Gonka 专家会诊面板：数字考古员和真相校验员双模型交叉验证
- 纪念 NFT 认领演示：生成 token id、mint receipt 和 metadata JSON
- 安葬套餐演示：见证席、永久安葬、守墓人账单，后续可接 Kite Agent Passport
- Kite 支付账本演示：展示 Agent 授权额度、支出、余额和链上 trace
- 档案就绪清单：公开证据、模型会诊、纪念册、NFT、账单、永久封存状态
- 服务端封存动作：生成 SHA-256 内容哈希、存储 ID，并下载包含纪念册、NFT、账单、墓碑设计和商业闭环的 JSON
- 可选真实 IPFS：配置 `PINATA_JWT` 后，封存按钮会通过 Pinata 上传 JSON 并返回 `ipfs://` CID

## 本地运行

先从 Gonka Dashboard 获取 API Key，然后设置环境变量：

```bash
export GONKA_API_KEY="你的 Gonka API Key"
export GONKA_BASE_URL="https://api.gonkascan.com/v1"
export GONKA_MODEL="auto"
export GONKA_ARCHAEOLOGIST_MODEL="auto"
export GONKA_VERIFIER_MODEL="auto"
export GONKA_MODEL_PREFERENCE="MiniMaxAI/MiniMax-M2.7,moonshotai/Kimi-K2.6"
```

可选：如果要把墓碑 JSON 真实上传到 IPFS，继续设置：

```bash
export PINATA_JWT="你的 Pinata JWT"
export PINATA_GATEWAY_URL="https://gateway.pinata.cloud/ipfs/"
```

启动本地代理服务：

```bash
python3 server.py
```

然后打开：

```text
http://127.0.0.1:5177
```

如果不设置 `GONKA_API_KEY`，服务会自动切到 mock fallback，页面仍然可以完整演示。

## 3 分钟演示路径

1. 点击开屏页的「进入公墓」，先展示左侧 Web2 遗址列表和右侧墓碑。
2. 选择「虾米音乐」或「人人网」，展示 Truth Score、墓志铭、遗物清单和证据链。
3. 切到「调查控制台」，展示 Gonka 专家会诊、Request ID 和 Agent 工作流。
4. 切到「封存计划」，点击「生成账单」和「生成档案」。
5. 展示 Kite 支付账本、档案就绪清单、SHA-256 内容哈希和永久档案 JSON。
6. 回到墓碑详情，认领纪念 NFT，说明它可以升级成 SBT 或测试网合约。

## API 接入

前端调用两个本地接口：

```text
POST /api/gonka/verify
POST /api/archive/seal
```

本地服务端再分别转发到：

```text
POST https://api.gonkascan.com/v1/chat/completions
POST https://api.pinata.cloud/pinning/pinJSONToIPFS
```

这样 Gonka API Key 和 Pinata JWT 都不会暴露在浏览器里。

## 下一步接入

1. 从 dashboard 确认最终使用的模型池。当前支持 `auto` 模式，会从 `/models` 自动发现模型并选择两个不同模型做会诊。实测 `moonshotai/Kimi-K2.6` 可返回真实 Request ID，`MiniMaxAI/MiniMax-M2.7` 偶发 429，系统会记录失败原因并保留可用模型结果。
2. 补强虾米音乐的公开证据截图和演示解说词。
3. 录制一条虾米音乐完整 Demo：Gonka 会诊，生成墓志铭，封存 JSON，展示 CID。
4. 接入 Kite Agent Passport，用授权额度真实支付永久安葬费。
5. 将纪念 NFT 从前端 metadata 演示升级为测试网合约或 SBT。
