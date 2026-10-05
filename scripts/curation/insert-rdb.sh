#!/usr/bin/env bash
# Self-hosted PostgREST asset insertion helper (2026-10-05+).
# Usage: insert-rdb.sh <table> <payload.json>
# Signs an `authenticated` JWT whose sub = payload.author_id (satisfies RLS *_write_own),
# POSTs the payload to the local PostgREST, prints HTTP code, reads back via psql.
# Schema-cache note: after DDL changes run
#   docker exec econagora-db psql -U econagora_app -d econagora -c "NOTIFY pgrst, 'reload schema';"
set -euo pipefail
TABLE="$1"; PAYLOAD="$2"
ENVF="/var/www/EconAgora/.env.production"
SECRET=$(grep "^JWT_SECRET=" "$ENVF" | cut -d= -f2-)
SUB=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['author_id'])" "$PAYLOAD")
NOW=$(date +%s)
B64() { openssl base64 -A | tr -d '=\n' | tr '+/' '-_'; }
HEADER=$(printf '{"alg":"HS256","typ":"JWT"}' | B64)
PAYLOAD_JWT=$(printf '{"role":"authenticated","sub":"%s","iat":%s,"exp":%s}' "$SUB" "$NOW" "$((NOW+3600))" | B64)
SIG=$(printf '%s.%s' "$HEADER" "$PAYLOAD_JWT" | openssl dgst -sha256 -hmac "$SECRET" -binary | B64)
TOKEN="${HEADER}.${PAYLOAD_JWT}.${SIG}"
CODE=$(curl -s -o /tmp/insert-rdb-resp.txt -w '%{http_code}' -X POST "http://localhost:3100/$TABLE" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -H "Prefer: return=representation" --data-binary @"$PAYLOAD")
echo "POST /$TABLE -> HTTP $CODE"
head -c 300 /tmp/insert-rdb-resp.txt; echo
rm -f /tmp/insert-rdb-resp.txt
[ "$CODE" = "201" ] || exit 1
