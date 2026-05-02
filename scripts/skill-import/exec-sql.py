import json, os, sys, time, hashlib, hmac, urllib.request, urllib.error

SECRET_ID = os.environ.get("CB_SECRET_ID")
SECRET_KEY = os.environ.get("CB_SECRET_KEY")
ENV_ID = "agora-8glrfnss7758021c"

def sign_request(payload_str):
    """Simple HMAC-SHA256 signature for CloudBase RDB API."""
    t = int(time.time())
    service = "tcb"
    action = "RunStatement"
    version = "2018-06-08"
    region = "ap-shanghai"

    # Canonical request
    http_request_method = "POST"
    canonical_uri = "/"
    canonical_querystring = ""
    content_type = "application/json"
    canonical_headers = f"content-type:{content_type}\nhost:tcb.api.tcloudbasegateway.com\nx-tc-action:{action.lower()}\n"
    signed_headers = "content-type;host;x-tc-action"
    hashed_payload = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
    canonical_request = f"{http_request_method}\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{hashed_payload}"

    # String to sign
    algorithm = "TC3-HMAC-SHA256"
    date = time.strftime("%Y-%m-%d", time.gmtime(t))
    credential_scope = f"{date}/{service}/tc3_request"
    hashed_request = hashlib.sha256(canonical_request.encode("utf-8")).hexdigest()
    string_to_sign = f"{algorithm}\n{t}\n{credential_scope}\n{hashed_request}"

    # Signing key
    def hmac_sha256(key, msg):
        return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

    secret_date = hmac_sha256(("TC3" + SECRET_KEY).encode("utf-8"), date)
    secret_service = hmac_sha256(secret_date, service)
    secret_signing = hmac_sha256(secret_service, "tc3_request")
    signature = hmac.new(secret_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

    authorization = f"{algorithm} Credential={SECRET_ID}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
    return {
        "Content-Type": content_type,
        "Host": "tcb.api.tcloudbasegateway.com",
        "X-TC-Action": action,
        "X-TC-Version": version,
        "X-TC-Region": region,
        "X-TC-Timestamp": str(t),
        "X-TC-Token": TOKEN,
        "Authorization": authorization,
    }


def exec_sql(sql):
    payload = json.dumps({"EnvId": ENV_ID, "Sql": sql})
    headers = sign_request(payload)
    url = "https://tcb.api.tcloudbasegateway.com"
    req = urllib.request.Request(url, data=payload.encode("utf-8"), headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            if result.get("Response", {}).get("Error"):
                return False, str(result["Response"]["Error"])
            return True, "OK"
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        return False, f"HTTP {e.code}: {body[:200]}"
    except Exception as e:
        return False, str(e)


def main():
    stmts_dir = os.path.join(os.path.dirname(__file__), "data", "stmts")
    files = sorted(f for f in os.listdir(stmts_dir) if f.endswith(".sql"))
    print(f"Executing {len(files)} SQL statements...")

    ok = 0
    fail = 0
    for i, fname in enumerate(files):
        path = os.path.join(stmts_dir, fname)
        with open(path, encoding="utf-8") as f:
            sql = f.read().strip()

        # Extract _id for display
        import re
        m = re.search(r"'([^']+/[^']+/[^']+)'", sql)
        skill_id = m.group(1) if m else fname

        print(f"[{i+1}/{len(files)}] {skill_id}...", end=" ", flush=True)
        success, msg = exec_sql(sql)
        if success:
            print("OK")
            ok += 1
        else:
            print(f"FAIL: {msg[:100]}")
            fail += 1

    print(f"\nDone: {ok} inserted, {fail} failed out of {len(files)}")


if __name__ == "__main__":
    main()
