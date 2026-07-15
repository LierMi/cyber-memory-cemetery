import json
import hashlib
import os
import re
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


def load_dotenv(path=".env"):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as file:
        for line in file:
            text = line.strip()
            if not text or text.startswith("#") or "=" not in text:
                continue
            key, value = text.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_dotenv()

GONKA_BASE_URL = os.getenv("GONKA_BASE_URL", "https://api.gonkascan.com/v1").rstrip("/")
GONKA_API_KEY = os.getenv("GONKA_API_KEY", "")
GONKA_MODEL = os.getenv("GONKA_MODEL", "deepseek-ai/DeepSeek-V3")
GONKA_ARCHAEOLOGIST_MODEL = os.getenv("GONKA_ARCHAEOLOGIST_MODEL", GONKA_MODEL)
GONKA_VERIFIER_MODEL = os.getenv("GONKA_VERIFIER_MODEL", GONKA_MODEL)
GONKA_MODEL_PREFERENCE = os.getenv(
    "GONKA_MODEL_PREFERENCE",
    "MiniMaxAI/MiniMax-M2.7,moonshotai/Kimi-K2.6",
)
GONKA_TIMEOUT_SECONDS = int(os.getenv("GONKA_TIMEOUT_SECONDS", "35"))
GONKA_MAX_TOKENS = int(os.getenv("GONKA_MAX_TOKENS", "180"))
PINATA_JWT = os.getenv("PINATA_JWT", "")
PINATA_PIN_JSON_URL = os.getenv(
    "PINATA_PIN_JSON_URL",
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
)
PINATA_GATEWAY_URL = os.getenv("PINATA_GATEWAY_URL", "https://gateway.pinata.cloud/ipfs/")
MODEL_CACHE = None


def clamp_score(value, fallback):
    try:
        score = int(value)
    except (TypeError, ValueError):
        return fallback
    return max(0, min(score, 100))


def normalize_model_score(value, fallback):
    try:
        score = float(value)
    except (TypeError, ValueError):
        return fallback
    if 0 < score <= 10:
        score *= 10
    return max(0, min(round(score), 100))


def make_mock_request_id(role, case_id):
    stamp = int(time.time() * 1000) % 100000
    return f"mock_gonka_{role}_{case_id}_{stamp}"


def request_json(url, method="GET", body=None, bearer_token=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    token = GONKA_API_KEY if bearer_token is None else bearer_token
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "CyberMemoryCemetery/0.1",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(
        url,
        data=data,
        headers=headers,
        method=method,
    )
    with urllib.request.urlopen(request, timeout=GONKA_TIMEOUT_SECONDS) as response:
        return json.loads(response.read().decode("utf-8"))


def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2)


def sha256_hex(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def archive_filename(payload, content_hash):
    case = payload.get("case") or {}
    case_id = re.sub(r"[^a-zA-Z0-9_-]+", "-", str(case.get("id") or "memorial")).strip("-")
    return f"cyber-memory-{case_id}-{content_hash[:10]}.json"


def gateway_url(cid):
    base = PINATA_GATEWAY_URL.rstrip("/") + "/"
    return base + cid


def upload_pinata_json(sealed_payload, filename, content_hash):
    archive = sealed_payload.get("archive") or {}
    case = archive.get("case") or {}
    body = {
        "pinataOptions": {"cidVersion": 1},
        "pinataMetadata": {
            "name": filename,
            "keyvalues": {
                "app": "cyber-memory-cemetery",
                "caseId": str(case.get("id") or "unknown"),
                "contentHash": content_hash,
            },
        },
        "pinataContent": sealed_payload,
    }
    return request_json(PINATA_PIN_JSON_URL, method="POST", body=body, bearer_token=PINATA_JWT)


def seal_archive(request_payload):
    payload = request_payload.get("payload") or {}
    if not isinstance(payload, dict) or not payload:
        raise ValueError("Missing archive payload")

    archive_json = canonical_json(payload)
    content_hash = sha256_hex(archive_json)
    content_hash_id = f"sha256:{content_hash}"
    filename = request_payload.get("filename") or archive_filename(payload, content_hash)
    sealed_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    provider = "pinata-ipfs" if PINATA_JWT else "demo-local"
    status = "upload-requested" if PINATA_JWT else "sealed-demo"
    notes = []
    sealed_payload = {
        "schema": "cyber-memory-cemetery/sealed/v0.1",
        "archive": payload,
        "receipt": {
            "provider": provider,
            "status": status,
            "contentHash": content_hash_id,
            "sealedAt": sealed_at,
        },
    }

    archive_id = f"ar://demo/{content_hash[:32]}"
    gateway = ""

    if PINATA_JWT:
        try:
            result = upload_pinata_json(sealed_payload, filename, content_hash_id)
            cid = result.get("IpfsHash") or result.get("cid")
            if cid:
                archive_id = f"ipfs://{cid}"
                gateway = gateway_url(cid)
                status = "uploaded"
            else:
                status = "pinata-response-missing-cid"
                notes.append("Pinata 已响应，但未返回 CID。")
        except Exception as error:
            provider = "demo-local"
            status = "sealed-demo-fallback"
            archive_id = f"ar://demo/{content_hash[:32]}"
            notes.append(f"Pinata 上传失败，已切换本地演示封存：{error}")

    sealed_payload["receipt"]["provider"] = provider
    sealed_payload["receipt"]["status"] = status
    sealed_payload["receipt"]["archiveId"] = archive_id
    if gateway:
        sealed_payload["receipt"]["gatewayUrl"] = gateway
    if notes:
        sealed_payload["receipt"]["notes"] = notes

    sealed_json = canonical_json(sealed_payload)
    case = payload.get("case") or {}
    verification = payload.get("verification") or {}
    preview = {
        "id": case.get("id"),
        "url": case.get("originalUrl"),
        "truthScore": verification.get("truthScore"),
        "provider": provider,
        "status": status,
        "contentHash": content_hash_id,
        "archiveId": archive_id,
    }
    if gateway:
        preview["gatewayUrl"] = gateway

    return {
        "provider": provider,
        "status": status,
        "contentHash": content_hash_id,
        "archiveId": archive_id,
        "gatewayUrl": gateway,
        "filename": filename,
        "json": sealed_json,
        "previewJson": json.dumps(preview, ensure_ascii=False, indent=2),
        "notes": notes,
    }


def list_gonka_models():
    global MODEL_CACHE
    if MODEL_CACHE is not None:
        return MODEL_CACHE
    if not GONKA_API_KEY:
        MODEL_CACHE = []
        return MODEL_CACHE

    result = request_json(f"{GONKA_BASE_URL}/models")
    MODEL_CACHE = [item.get("id") for item in result.get("data", []) if item.get("id")]
    return MODEL_CACHE


def ordered_models():
    available = list_gonka_models()
    if not available:
        return []

    preferred = [model.strip() for model in GONKA_MODEL_PREFERENCE.split(",") if model.strip()]
    ordered = [model for model in preferred if model in available]
    ordered.extend([model for model in available if model not in ordered])
    return ordered


def resolve_council_models():
    ordered = ordered_models()

    def pick(configured, used=None):
        used = used or set()
        if configured and configured.lower() != "auto":
            return configured
        for model in ordered:
            if model not in used:
                return model
        return ordered[0] if ordered else configured

    base = GONKA_MODEL
    archaeologist_config = GONKA_ARCHAEOLOGIST_MODEL if GONKA_ARCHAEOLOGIST_MODEL else base
    verifier_config = GONKA_VERIFIER_MODEL if GONKA_VERIFIER_MODEL else base
    if archaeologist_config.lower() == "auto":
        archaeologist_config = base
    if verifier_config.lower() == "auto":
        verifier_config = base

    archaeologist_model = pick(archaeologist_config)
    verifier_model = pick(verifier_config, used={archaeologist_model})
    return archaeologist_model, verifier_model, ordered


def mock_verification(payload, reason=None):
    case = payload.get("case", {})
    archive = payload.get("archive") or {}
    truth_score = clamp_score(case.get("truthScore"), 86)
    case_id = case.get("id", "case")
    archive_count = archive.get("count") or case.get("archiveCount") or 0
    source_note = "Wayback 实时证据" if archive.get("source") == "wayback" else "本地演示证据"

    notes = [
        reason or "未检测到 GONKA_API_KEY，已使用本地 mock 结果。",
        "mock fallback 会保留完整演示流程，但不会产生真实 Gonka Request ID。",
    ]

    return {
        "source": "mock",
        "truthScore": truth_score,
        "epitaph": case.get("epitaph", ""),
        "requests": [
            {
                "role": "digital_archaeologist",
                "model": "mock-archaeologist",
                "requestId": make_mock_request_id("archaeologist", case_id),
                "summary": (
                    f"{case.get('name', '该网站')} 的公开资料显示，它属于"
                    f"{case.get('type', 'Web2 社区')}。当前档案包含 {archive_count} 条快照或演示证据，"
                    f"证据来源为{source_note}。"
                ),
            },
            {
                "role": "truth_verifier",
                "model": "mock-verifier",
                "requestId": make_mock_request_id("verifier", case_id),
                "summary": (
                    "可验证事实包括平台名称、公开访问入口、社区类型和主要文化标签。"
                    "涉及用户个人内容的部分不直接保存，仅作为文化形态描述。"
                ),
            },
        ],
        "notes": notes,
    }


def parse_json_object(text):
    if not text:
        return {}
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    decoder = json.JSONDecoder()
    parsed = []
    for index, char in enumerate(text):
        if char != "{":
            continue
        try:
            value, _ = decoder.raw_decode(text[index:])
        except json.JSONDecodeError:
            continue
        if isinstance(value, dict):
            parsed.append(value)
    return parsed[-1] if parsed else {}


def clean_model_content(text):
    if not text:
        return ""
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", text).strip()
    if cleaned.startswith("<think>"):
        cleaned = ""
    return cleaned or text.strip()


def parse_partial_fields(text):
    fields = {}
    if not text:
        return fields

    summary_match = re.search(r'"summary"\s*:\s*"([^"]+)', text)
    if summary_match:
        fields["summary"] = summary_match.group(1)

    score_match = re.search(r'"truthScore"\s*:\s*(\d+)', text)
    if score_match:
        fields["truthScore"] = normalize_model_score(score_match.group(1), 86)

    return fields


def model_summary(parsed, content):
    if parsed.get("summary"):
        return parsed["summary"]
    if parsed.get("reasoning"):
        return parsed["reasoning"]
    if parsed.get("verdict"):
        return parsed["verdict"]

    cleaned = clean_model_content(content)
    if cleaned and not cleaned.startswith("<think>"):
        return cleaned[:180]
    return "模型已返回真实 Gonka Request ID，正文被 reasoning 或 token 限制截断。"


def evidence_line(item):
    if isinstance(item, dict):
        title = item.get("title", "")
        desc = item.get("desc", "")
        url = item.get("url", "")
    elif isinstance(item, list) and len(item) >= 2:
        title, desc = item[0], item[1]
        url = item[2] if len(item) > 2 else ""
    else:
        return ""
    source = f" 来源:{url}" if url else ""
    return f"- {title}: {desc}{source}"


def timeline_line(item):
    if not isinstance(item, dict):
        return ""
    return (
        f"- {item.get('date', '')}: {item.get('title', '')}。"
        f"{item.get('detail', '')} 来源:{item.get('source', '')}"
    )


def bullet_lines(items):
    if not items:
        return "- 无"
    return "\n".join([f"- {item}" for item in items])


def format_evidence_package(evidence_package):
    claims = (evidence_package or {}).get("claims") or []
    return "\n".join(
        f"- [{item.get('confidence')}] {item.get('claim')} 来源:{item.get('sourceUrl')}"
        for item in claims
    ) or "- 无独立策展证据包"


def format_case_for_prompt(case, archive, evidence_package=None):
    evidence_text = "\n".join(
        [line for line in [evidence_line(item) for item in case.get("evidence", [])] if line]
    )
    timeline_text = "\n".join(
        [line for line in [timeline_line(item) for item in case.get("timeline", [])] if line]
    )
    tags = "、".join(case.get("tags", []))

    return f"""
名称：{case.get("name")}
原始 URL：{case.get("originalUrl")}
状态：{case.get("status")}
类型：{case.get("type")}
文化标签：{tags}
本地存活时间：{case.get("lifespan")}
快照取样：{archive.get("count") or case.get("archiveCount")} 条
时间范围：{archive.get("firstYear") or case.get("firstSeen")}-{archive.get("lastYear") or case.get("lastSeen")}
摘要：{case.get("summary")}

时间线：
{timeline_text or "- 无"}

证据链：
{evidence_text or "- 无"}

可验证事实：
{bullet_lines(case.get("verifiableFacts"))}

不确定项：
{bullet_lines(case.get("uncertainClaims"))}

隐私边界：
{case.get("privacyBoundary") or "只处理公开元数据和用户主动提交材料。"}

独立策展证据包：
{format_evidence_package(evidence_package)}

Demo 讲法：
{case.get("demoAngle") or "展示证据到墓志铭的完整链路。"}
""".strip()


def chat_completion(model, messages, temperature=0.25):
    request_body = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": GONKA_MAX_TOKENS,
        "stream": False,
    }
    result = request_json(f"{GONKA_BASE_URL}/chat/completions", method="POST", body=request_body)

    choice = (result.get("choices") or [{}])[0]
    message = choice.get("message") or {}
    return {
        "requestId": result.get("id") or result.get("request_id") or "gonka_req_unknown",
        "content": message.get("content", ""),
        "raw": result,
    }


def build_archaeologist_prompt(payload):
    case = payload.get("case", {})
    archive = payload.get("archive") or {}
    evidence_package = payload.get("evidencePackage") or {}

    return f"""
你是赛博记忆公墓的数字考古员。你的任务是根据证据总结一个消失或衰退的 Web2 社区。

请严格遵守：
1. 不虚构没有证据支持的事实。
2. 可以写文化价值，但必须说明依据。
3. 必须直接输出 JSON，不要输出 Markdown，不要解释，不要输出 <think>。

案例：
{format_case_for_prompt(case, archive, evidence_package)}

字段要求：summary, verifiedFacts, uncertainClaims, culturalTags, suggestedTruthScore。
""".strip()


def build_verifier_prompt(payload, archaeologist_json):
    case = payload.get("case", {})
    archive = payload.get("archive") or {}
    evidence_package = payload.get("evidencePackage") or {}

    return f"""
你是赛博记忆公墓的真相校验员。请审查数字考古员的结论是否被证据支撑。

评分标准：
- 快照证据完整度 30%
- 多模型一致性 25%
- 来源可信度 20%
- 内容可解释性 15%
- 用户补充材料质量 10%

请严格遵守：
1. 不要因为文字好听就给高分。
2. 如果涉及个人隐私、版权内容、无法验证叙述，必须降分或标注不确定。
3. 必须直接输出 JSON，不要输出 Markdown，不要解释，不要输出 <think>。

原案例：
{json.dumps(case, ensure_ascii=False)}

实时档案：
{json.dumps(archive, ensure_ascii=False)}

独立策展证据包：
{format_evidence_package(evidence_package)}

数字考古员结论：
{json.dumps(archaeologist_json, ensure_ascii=False)}

字段要求：truthScore, verdict, supportedFacts, riskFlags, reasoning。
""".strip()


def build_council_prompt(payload, role_name):
    case = payload.get("case", {})
    archive = payload.get("archive") or {}
    evidence_package = payload.get("evidencePackage") or {}

    return f"""
你是{role_name}。只根据证据评估 Web2 数字遗产。
{format_case_for_prompt(case, archive, evidence_package)}
只输出极短 JSON: {{"summary":"40字内","truthScore":0,"verifiedFacts":["1条"],"uncertainClaims":["1条"],"riskFlags":["1条"]}}
truthScore 必须是 0 到 100 的整数，不要使用 0 到 10。
""".strip()


def fallback_request(role, model, case, reason):
    return {
        "role": role,
        "model": model,
        "requestId": make_mock_request_id(role, case.get("id", "case")),
        "summary": reason,
        "details": {"fallback": True, "reason": reason},
    }


def run_council_member(role, model, payload, temperature):
    role_name = "数字考古员" if role == "digital_archaeologist" else "真相校验员"
    completion = chat_completion(
        model,
        [
            {"role": "system", "content": f"你是{role_name}。只根据证据直接输出 JSON。"},
            {"role": "user", "content": build_council_prompt(payload, role_name)},
        ],
        temperature=temperature,
    )
    parsed = parse_json_object(completion["content"])
    if not parsed:
        parsed = parse_partial_fields(completion["content"])
    return {
        "role": role,
        "model": model,
        "requestId": completion["requestId"],
        "summary": model_summary(parsed, completion["content"]),
        "details": parsed,
    }


def aggregate_truth_score(requests, fallback_score):
    scores = []
    for request in requests:
        details = request.get("details") or {}
        if details.get("fallback"):
            continue
        score = details.get("truthScore") or details.get("suggestedTruthScore")
        if score is not None:
            scores.append(normalize_model_score(score, fallback_score))
    if not scores:
        return fallback_score
    return round(sum(scores) / len(scores))


def run_gonka_verification(payload):
    if not GONKA_API_KEY:
        return mock_verification(payload)

    case = payload.get("case", {})
    fallback_score = clamp_score(case.get("truthScore"), 86)

    requests = []
    notes = []
    archaeologist_model, verifier_model, model_pool = resolve_council_models()
    council_jobs = [
        ("digital_archaeologist", archaeologist_model, 0.2),
        ("truth_verifier", verifier_model, 0.1),
    ]

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            executor.submit(run_council_member, role, model, payload, temperature): (role, model)
            for role, model, temperature in council_jobs
        }
        for future in as_completed(futures):
            role, model = futures[future]
            try:
                requests.append(future.result())
            except Exception as error:
                reason = f"{role} 模型超时或失败：{error}"
                notes.append(reason)
                requests.append(fallback_request(role, model, case, reason))

    role_order = {"digital_archaeologist": 0, "truth_verifier": 1}
    requests.sort(key=lambda request: role_order.get(request.get("role"), 99))
    truth_score = aggregate_truth_score(requests, fallback_score)
    notes.append("模型池：" + ", ".join(model_pool))
    for request in requests:
        details = request.get("details") or {}
        for flag in details.get("riskFlags") or []:
            if flag not in notes:
                notes.append(flag)

    return {
        "source": "gonka",
        "truthScore": truth_score,
        "epitaph": case.get("epitaph", ""),
        "requests": requests,
        "notes": notes,
    }


class Handler(SimpleHTTPRequestHandler):
    def send_json(self, status, payload):
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path == "/api/archive/seal":
            length = int(self.headers.get("Content-Length", "0"))
            try:
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                result = seal_archive(payload)
                self.send_json(200, result)
            except json.JSONDecodeError:
                self.send_json(400, {"error": "Invalid JSON"})
            except ValueError as error:
                self.send_json(400, {"error": str(error)})
            except Exception as error:
                self.send_json(
                    502,
                    {
                        "error": "Archive seal failed",
                        "message": str(error),
                    },
                )
            return

        if self.path != "/api/gonka/verify":
            self.send_json(404, {"error": "Not found"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid JSON"})
            return

        try:
            result = run_gonka_verification(payload)
            self.send_json(200, result)
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            self.send_json(
                502,
                {
                    "error": "Gonka API HTTP error",
                    "status": error.code,
                    "body": body[:1200],
                    "fallback": mock_verification(
                        payload,
                        reason=f"Gonka API 返回 HTTP {error.code}，已自动切换到 mock fallback。",
                    ),
                },
            )
        except Exception as error:
            self.send_json(
                502,
                {
                    "error": "Gonka API request failed",
                    "message": str(error),
                    "fallback": mock_verification(
                        payload,
                        reason="Gonka API 请求失败，已自动切换到 mock fallback。",
                    ),
                },
            )


def main():
    port = int(os.getenv("PORT", "5177"))
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Cyber Memory Cemetery running at http://127.0.0.1:{port}")
    print(f"Gonka base URL: {GONKA_BASE_URL}")
    print("Gonka mode:", "live" if GONKA_API_KEY else "mock fallback")
    server.serve_forever()


if __name__ == "__main__":
    main()
