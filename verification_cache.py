import json
import os
import tempfile
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
        descriptor, temporary_name = tempfile.mkstemp(
            dir=self.directory,
            prefix=f".{key}.",
            suffix=".tmp",
        )
        temporary = Path(temporary_name)
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as file:
                json.dump(value, file, ensure_ascii=False, indent=2)
                file.flush()
                os.fsync(file.fileno())
            os.replace(temporary, path)
        except Exception:
            try:
                temporary.unlink()
            except FileNotFoundError:
                pass
            raise

    def latest_for_case(self, case_id):
        candidates = []
        for path in self.directory.glob("*.json"):
            try:
                payload = json.loads(path.read_text(encoding="utf-8"))
            except (OSError, UnicodeDecodeError, json.JSONDecodeError):
                continue
            if (
                not isinstance(payload, dict)
                or not isinstance(payload.get("caseId"), str)
                or payload.get("caseId") != case_id
                or payload.get("verificationState") != "live_consensus"
                or not isinstance(payload.get("requests"), list)
            ):
                continue

            verified_at = payload.get("verifiedAt")
            timestamp_key = (1, verified_at) if isinstance(verified_at, str) else (0, "")
            candidates.append((timestamp_key, path.name, payload))

        return max(candidates, default=(None, None, None), key=lambda item: item[:2])[2]
