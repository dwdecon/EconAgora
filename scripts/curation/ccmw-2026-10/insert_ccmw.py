#!/usr/bin/env python3
"""Insert the 16 curated CCMW skills into self-hosted RDB (run on server)."""
import json, os, time, hmac, hashlib, base64, urllib.request, urllib.parse, sys

REPO_ROOT = "/var/www/EconAgora"
secret = open(os.path.join(REPO_ROOT, ".env.production")).read()
for line in secret.splitlines():
    if line.startswith("JWT_SECRET="):
        secret = line.split("=", 1)[1].strip()
        break

def b64(b):
    return base64.urlsafe_b64encode(b).decode().rstrip("=")

now = int(time.time())
H = b64(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
P = b64(json.dumps({"role": "authenticated", "sub": "pedrohcgs", "iat": now, "exp": now + 7200},
                   separators=(",", ":")).encode())
SIG = b64(hmac.new(secret.encode(), f"{H}.{P}".encode(), hashlib.sha256).digest())
TOKEN = f"{H}.{P}.{SIG}"

rows = json.load(open("/tmp/ccmw-payload.json", encoding="utf-8"))
ok, fail = [], []
for r in rows:
    p = r["payload"]
    pid = urllib.parse.quote(p["_id"], safe="")
    data = json.dumps(p, ensure_ascii=False).encode()
    req = urllib.request.Request(
        "http://localhost:3100/skill",
        data=data,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json",
                 "Prefer": "return=representation"},
        method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode("utf-8", "replace")
            ok.append(p["_id"])
            print(f"OK   {resp.status}  {p['_id']}")
    except urllib.error.HTTPError as e:
        err = e.read().decode("utf-8", "replace")[:250]
        fail.append((p["_id"], e.code, err))
        print(f"FAIL {e.code}  {p['_id']}  {err}")
    except Exception as e:
        fail.append((p["_id"], 0, str(e)[:200]))
        print(f"FAIL net  {p['_id']}  {e}")

print(f"inserted={len(ok)} failed={len(fail)}")
with open("/tmp/ccmw-insert-result.json", "w") as f:
    json.dump({"ok": ok, "fail": fail}, f, ensure_ascii=False, indent=1)
sys.exit(0 if not fail else 1)
