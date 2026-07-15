import json
import os
from pathlib import Path


class VerificationCache:
    def __init__(self, directory):
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)

    def read(self, key):
        path = self.directory / f"{key}.json"
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def write(self, key, value):
        path = self.directory / f"{key}.json"
        temporary = path.with_suffix(".tmp")
        temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(temporary, path)

    def latest_for_case(self, case_id):
        candidates = []
        for path in self.directory.glob("*.json"):
            payload = json.loads(path.read_text(encoding="utf-8"))
            if payload.get("caseId") == case_id and payload.get("verificationState") == "live_consensus":
                candidates.append((payload.get("verifiedAt", ""), payload))
        return max(candidates, default=(None, None))[1]
