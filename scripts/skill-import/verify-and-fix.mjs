import { readFileSync, readdirSync } from 'fs';
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
      port: 443,
      path: '/',
      method: 'POST',
      headers,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          const error = result?.Response?.Error;
          if (error) {
            resolve({ ok: false, msg: `${error.Code}: ${error.Message}`, raw: result });
          } else {
            resolve({ ok: true, data: result?.Response, raw: result });
          }
        } catch {
          resolve({ ok: false, msg: `Parse error: ${data.substring(0, 300)}`, raw: data });
        }
      });
    });
    req.on('error', (e) => resolve({ ok: false, msg: e.message }));
    req.setTimeout(60000, () => { req.destroy(); resolve({ ok: false, msg: 'timeout' }); });
    req.write(payload);
    req.end();
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const stmtsDir = join(import.meta.dirname, 'data', 'stmts');
  const files = readdirSync(stmtsDir).filter(f => f.endsWith('.sql')).sort();
  console.log(`Checking ${files.length} SQL statements...\n`);

  // First, get all existing IDs
  const existing = new Set();
  {
    const res = await callApi("SELECT _id FROM skill", 'RunStatement');
    if (res.ok && res.data?.Records) {
      for (const row of res.data.Records) {
        existing.add(row[0]?.Value || row[0]);
      }
    }
  }
  console.log(`Found ${existing.size} existing records in DB\n`);

  // Find missing records
  const missing = [];
  for (const fname of files) {
    const sql = readFileSync(join(stmtsDir, fname), 'utf8').trim();
    const m = sql.match(/'([^']+\/[^']+\/[^']+)'/);
    const skillId = m ? m[1] : fname;
    if (!existing.has(skillId)) {
      missing.push({ fname, skillId, sql });
    }
  }

  console.log(`Missing: ${missing.length} out of ${files.length}\n`);

  if (missing.length === 0) {
    console.log('All records present!');
    return;
  }

  // Try inserting missing ones one by one with verification
  let inserted = 0, stillMissing = 0;
  for (const { fname, skillId, sql } of missing) {
    process.stdout.write(`Inserting ${skillId}... `);

    // Try insert
    const res = await callApi(sql);
    if (!res.ok) {
      console.log(`API ERROR: ${res.msg}`);
      stillMissing++;
      continue;
    }

    // Wait a moment, then verify
    await sleep(500);
    const checkId = skillId.replace(/'/g, "''");
    const verify = await callApi(`SELECT _id FROM skill WHERE _id = '${checkId}'`);
    if (verify.ok && verify.data?.Records?.length > 0) {
      console.log('OK (verified)');
      inserted++;
    } else {
      console.log(`NOT FOUND after insert!`);
      // Show raw response for debugging
      console.log(`  Insert response: ${JSON.stringify(res.raw).substring(0, 300)}`);
      stillMissing++;
    }
  }

  console.log(`\nDone: ${inserted} newly inserted, ${stillMissing} still missing`);
}

main().catch(console.error);
