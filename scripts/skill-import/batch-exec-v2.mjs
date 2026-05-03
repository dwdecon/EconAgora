import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import https from 'https';
import crypto from 'crypto';

const SECRET_ID = process.env.CB_SECRET_ID;
const SECRET_KEY = process.env.CB_SECRET_KEY;
const TOKEN = process.env.CB_TOKEN;
const ENV_ID = process.env.CB_ENV_ID || "agora-8glrfnss7758021c";

if (!SECRET_ID || !SECRET_KEY || !TOKEN) {
  console.error("ERROR: CB_SECRET_ID, CB_SECRET_KEY, CB_TOKEN env vars required.");
  process.exit(1);
}

if (!TOKEN) {
  console.error("ERROR: CB_TOKEN env var required. Get it from MCP auth get_temp_credentials.");
  process.exit(1);
}

function hmac256(key, msg) {
  return crypto.createHmac('sha256', key).update(msg).digest();
}

function signRequest(payloadStr, action = 'RunStatement') {
  const t = Math.floor(Date.now() / 1000);
  const date = new Date(t * 1000).toISOString().slice(0, 10);
  const contentType = 'application/json';
  const hashedPayload = crypto.createHash('sha256').update(payloadStr).digest('hex');
  const canonicalHeaders = `content-type:${contentType}\nhost:tcb.api.tcloudbasegateway.com\nx-tc-action:${action.toLowerCase()}\n`;
  const signedHeaders = 'content-type;host;x-tc-action';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${hashedPayload}`;
  const algorithm = 'TC3-HMAC-SHA256';
  const credentialScope = `${date}/tcb/tc3_request`;
  const hashedRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = `${algorithm}\n${t}\n${credentialScope}\n${hashedRequest}`;
  const secretDate = hmac256(`TC3${SECRET_KEY}`, date);
  const secretService = hmac256(secretDate, 'tcb');
  const secretSigning = hmac256(secretService, 'tc3_request');
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign).digest('hex');
  return {
    'Content-Type': contentType,
    'Host': 'tcb.api.tcloudbasegateway.com',
    'X-TC-Action': action,
    'X-TC-Version': '2018-06-08',
    'X-TC-Region': 'ap-shanghai',
    'X-TC-Timestamp': String(t),
    'X-TC-Token': TOKEN,
    'Authorization': `${algorithm} Credential=${SECRET_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

function callApi(sql, action = 'RunStatement') {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ EnvId: ENV_ID, Sql: sql });
    const headers = signRequest(payload, action);
    const req = https.request({
      hostname: 'tcb.api.tcloudbasegateway.com',
      port: 443, path: '/', method: 'POST', headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result?.code === 'INVALID_CREDENTIALS') {
            resolve({ ok: false, expired: true, msg: 'Token expired' });
          } else if (result?.Response?.Error) {
            resolve({ ok: false, msg: `${result.Response.Error.Code}: ${result.Response.Error.Message}` });
          } else {
            resolve({ ok: true });
          }
        } catch {
          resolve({ ok: false, msg: `Parse: ${data.substring(0, 200)}` });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, msg: e.message }));
    req.setTimeout(60000, () => { req.destroy(); resolve({ ok: false, msg: 'timeout' }); });
    req.write(payload);
    req.end();
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
  const stmtsDir = join(import.meta.dirname, 'data', 'stmts');
  const files = readdirSync(stmtsDir).filter(f => f.endsWith('.sql')).sort();

  // Check which records already exist
  console.log("Checking existing records...");
  const checkRes = await callApi("SELECT _id FROM skill WHERE _id LIKE '%/%'", 'RunStatement');
  if (checkRes.expired) {
    console.error("TOKEN EXPIRED at start. Get fresh credentials.");
    process.exit(1);
  }
  // RunStatement may not return SELECT results, so proceed with INSERT IGNORE anyway

  console.log(`Processing ${files.length} statements with INSERT IGNORE...\n`);

  let ok = 0, fail = 0, skipped = 0;
  for (let i = 0; i < files.length; i++) {
    const sql = readFileSync(join(stmtsDir, files[i]), 'utf8').trim();
    const m = sql.match(/'([^']+\/[^']+\/[^']+)'/);
    const skillId = m ? m[1] : files[i];

    process.stdout.write(`[${i + 1}/${files.length}] ${skillId}... `);
    const result = await callApi(sql);

    if (result.expired) {
      console.log(`TOKEN EXPIRED at record ${i + 1}. Restart with fresh credentials.`);
      // Save progress
      writeFileSync(join(import.meta.dirname, 'data', 'progress.json'), JSON.stringify({ lastCompleted: i - 1, total: files.length }));
      process.exit(2);
    }

    if (result.ok) {
      console.log('OK');
      ok++;
    } else {
      console.log(`FAIL: ${result.msg.substring(0, 150)}`);
      fail++;
    }
  }

  console.log(`\nDone: ${ok} OK, ${fail} failed out of ${files.length}`);
}

main().catch(console.error);
