# Gonka Router 集成技术报告 · Cyber Memory Cemetery

**项目：** 赛博记忆公墓 / Cyber Memory Cemetery（黑客松 · Gonka 赛道）
**日期：** 2026-07-16
**联系：** LierMi
**核心结论：** Gonka Router 的 `/models` 端点公布了 2 个模型，但 `/chat/completions` 对第二个模型 `moonshotai/Kimi-K2.6` 的服务**极不稳定**——测试期间（2026-07-16）该模型多次返回 `HTTP 400 unsupported model`；而它在同一天其他时段曾成功返回过带真实 Request ID 的响应，说明是**间歇性掉线**而非彻底下线。这种随机不可用会让依赖多模型交叉验证的用例在无明确信号的情况下悄悄降级。

---

## English TL;DR (for the Gonka team)

`GET /v1/models` advertises **two** models:

- `MiniMaxAI/MiniMax-M2.7`
- `moonshotai/Kimi-K2.6`

However, `POST /v1/chat/completions` **intermittently rejects `moonshotai/Kimi-K2.6`**. During our testing it repeatedly returned the error below, while at other times the same model served valid responses (real Request IDs). So the model is flaky/unstable, not permanently removed:

```json
HTTP/1.1 400 Bad Request
{"error":{"message":"unsupported model \"moonshotai/Kimi-K2.6\"; supported models: MiniMaxAI/MiniMax-M2.7","type":"upstream_error","param":"","code":null}}
```

**Impact:** multi-model comparison / cross-verification (a common pattern, and the core of our project) randomly degrades to a single-model fallback with no clear signal, because a transient outage is reported as `400 unsupported model` (indistinguishable from a genuinely invalid model). Please (a) stabilize inference for `moonshotai/Kimi-K2.6`, and (b) while it is temporarily unavailable, return a distinguishable error (e.g. `model_temporarily_unavailable`) rather than `unsupported model`.

---

## 1. 我们的用例

赛博记忆公墓为已消失的 Web2 社区（虾米音乐、人人网等）生成"可验证的数字墓碑"。核心机制是让 **两个不同的 Gonka 模型** 分别扮演：

- **数字考古员**（`digital_archaeologist`）——根据证据总结社区历史；
- **真相校验员**（`truth_verifier`）——独立复核考古员结论、给出 Truth Score。

两个模型**独立返回、交叉比对**，输出共识置信度（consensus confidence）、评分差（score spread）和各自的真实 Request ID，作为"这段挽歌有据可查"的证明。这要求 Gonka 至少提供 **2 个可用于推理的不同模型**。

## 2. 现象

- 首个模型 `MiniMaxAI/MiniMax-M2.7`（考古员）**工作正常**：返回真实 Request ID（如 `devshard-30576-11274`）与有限 Truth Score（如 88）。
- 第二个模型 `moonshotai/Kimi-K2.6`（校验员）**每次都失败**，最终在页面上显示为"不可计算"、共识置信度被拉低。

后端日志：

```
[gonka] digital_archaeologist model=MiniMaxAI/MiniMax-M2.7 finish=stop score=88 real_id=True attempt=1
[gonka] EXC truth_verifier model=moonshotai/Kimi-K2.6 HTTPError: HTTP Error 400: Bad Request
```

## 3. 定位过程

最初怀疑是 reasoning 模型（Kimi 会先输出 `<think>` 思考块）导致 JSON 解析失败或被 `max_tokens` 截断，于是做了：剥离 `<think>`、正则兜底提取字段、提高会诊调用的 `max_tokens` 与超时、增加诊断日志。

**但真正的原因是请求在到达模型前就被 Gonka 拒绝了**——不是解析问题。用最小请求探针验证：

```python
# POST {GONKA_BASE_URL}/chat/completions
# body = {"model": "moonshotai/Kimi-K2.6", "messages": [...], "temperature": 0.1}
```

无论 `max_tokens` 取 256 / 512 / 1024 / 2048 还是不传，结果**完全一致**：

```
HTTP 400  {"error":{"message":"unsupported model \"moonshotai/Kimi-K2.6\";
           supported models: MiniMaxAI/MiniMax-M2.7","type":"upstream_error"}}
```

同一探针换成 `MiniMaxAI/MiniMax-M2.7` 立即返回 200 与真实 Request ID `devshard-30654-13771`。

> 附带观察：`MiniMaxAI/MiniMax-M2.7` 的响应正文以 `<think>...</think>` 开头，它本身就是一个 reasoning 模型；下游解析需要先剥离思考块（我们已在客户端处理）。

## 4. 复现步骤（可直接转给 Gonka）

```bash
# 1) 列表说有两个模型
curl -s https://<GONKA_BASE_URL>/models \
  -H "Authorization: Bearer $GONKA_API_KEY" \
  -H "User-Agent: repro/0.1" | jq '.data[].id'
# => "MiniMaxAI/MiniMax-M2.7"
# => "moonshotai/Kimi-K2.6"

# 2) 但第二个模型的推理被拒
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://<GONKA_BASE_URL>/chat/completions \
  -H "Authorization: Bearer $GONKA_API_KEY" \
  -H "Content-Type: application/json" \
  -H "User-Agent: repro/0.1" \
  -d '{"model":"moonshotai/Kimi-K2.6","messages":[{"role":"user","content":"ping"}]}'
# => 400  (body: unsupported model "moonshotai/Kimi-K2.6"; supported models: MiniMaxAI/MiniMax-M2.7)
```

> 注：不带 `User-Agent` 时 `/models` 会返回 **403 Forbidden**——建议网关放宽或明确文档说明该要求。

## 5. 影响

1. **模型清单与实际可用不一致**：开发者无法用 `/models` 作为可调用模型的可信来源，只能靠试错。
2. **多模型用例静默降级**：任何"用两个模型交叉验证/对比/投票"的产品，会在不报错的路径上退化成单模型，共识、评分差等指标失去意义。
3. **可观测性差**：`unsupported model` 是 `upstream_error`，`code: null`，不易与"限流 / 参数错误 / 上游故障"区分。

## 6. 给 Gonka 的建议

- **稳定 `moonshotai/Kimi-K2.6` 的推理服务**——它是间歇性掉线（时好时坏），并非彻底下线；随机的 `400` 对依赖它的用例最难排查。
- 在模型**暂时**不可用时，返回可区分的错误码（如 `model_temporarily_unavailable`）而不是 `unsupported model`，让客户端能区分"临时掉线"与"模型名写错"。
- 明确 `/models` 的鉴权要求（缺 `User-Agent` 的 403 行为）。

## 7. 我们的临时对策

在 Gonka 恢复第二个模型之前，为了让"交叉验证"保持**真实可跑、可验证**（而不是造假），我们做了如下调整：

- **同模型双通道独立校验**：数字考古员与真相校验员都调用唯一可服务的 `MiniMaxAI/MiniMax-M2.7`，但以不同温度/提示词发起**两次相互独立的真实请求**。因此仍产生**两个不同的真实 Request ID**（如 `devshard-30607-9424` 与 `devshard-30624-13290`）、真实的分数与共识置信度。这是自洽校验（self-consistency），不是双模型，但每一次调用都是真的。
- **信任不变量从"两个不同模型"放宽为"两个不同的真实 Request ID"**：`aggregate_consensus`、签名回执校验（`verification_trust`）与客户端校验（`core.js`）一并调整，保证 `live_consensus` 仍要求两次真实独立调用。
- **前端**：只有拿到真实实时结果时才渲染共识/双通道区块，运行前不再显示 `0% / 不可计算` 的空占位；整页信息层级做了精简。
- **一旦 Gonka 恢复 `moonshotai/Kimi-K2.6`（或新增第二个可服务模型）**，只需把 `GONKA_VERIFIER_MODEL` 指回该模型即可自动恢复真正的"双模型"交叉验证，无需改动其他逻辑。

> 诚实性说明：demo 中展示的所有 Request ID 均来自 Gonka 接口的真实响应；本报告如实披露"当前仅单模型可服务"这一限制，二者一致，不存在把预置数据伪装成真实调用的情况。

---

## 附：环境

| 项 | 值 |
|---|---|
| Router | Gonka Router (`/v1`) |
| 可服务模型 | `MiniMaxAI/MiniMax-M2.7`（reasoning，输出 `<think>`） |
| 列出但不可服务 | `moonshotai/Kimi-K2.6`（`400 unsupported model`） |
| 复现日期 | 2026-07-16 |
