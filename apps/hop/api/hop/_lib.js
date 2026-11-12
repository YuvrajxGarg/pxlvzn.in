// Shared helpers for Hop's matchmaking + relay service.
//
// What lives here: a directory (Hop code -> public key + name), a per-code inbox, and
// encrypted transfer pieces on their way between two people on different networks.
// Everything a device uploads is end-to-end encrypted before it leaves the device; the
// service only sees ciphertext, sizes and Hop codes.
//
// A Hop code is the first 60 bits of sha256("hop-id" || ed25519 public key), in Crockford
// base32. Requests are signed with that key, so nobody can read someone else's inbox,
// accept their transfers or register a code they don't own.
import crypto from 'node:crypto';
import { del, get, head, issueSignedToken, list, presignUrl, put } from '@vercel/blob';

export const MAX_BYTES = Number(process.env.HOP_RELAY_MAX_BYTES || 2 * 1024 ** 3); // per transfer
export const PIECE = 8 << 20; // 8 MiB of file per relayed piece
export const PIECE_MAX = PIECE + 4096; // one sealed piece
export const KEEP_DAYS = 7;
const SKEW_MS = 10 * 60 * 1000;
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function codeOf(vk) {
  const h = crypto.createHash('sha256').update('hop-id').update(vk).digest();
  let n = h.readBigUInt64BE(0) >> 4n; // 60 bits
  let s = '';
  for (let i = 0; i < 12; i++) { s = B32[Number(n & 31n)] + s; n >>= 5n; }
  return s;
}

export function normCode(c) {
  const s = String(c || '').toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/[IL]/g, '1').replace(/O/g, '0');
  if (!/^[0-9A-HJKMNP-TV-Z]{12}$/.test(s)) throw new HttpError(400, 'That isn’t a Hop code');
  return s;
}

const b64d = (s) => Buffer.from(String(s || ''), 'base64url');
const DER_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

// Checks a signed request. Signed text: "hop/<op>\n<ts>\n<body.fields joined by \n>".
export function verify(op, body, fields) {
  const vk = b64d(body.vk);
  if (vk.length !== 32) throw new HttpError(400, 'bad key');
  const ts = Number(body.ts);
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > SKEW_MS) throw new HttpError(401, 'Your clock is off, or the request is stale');
  const msg = ['hop/' + op, String(body.ts), ...fields.map((f) => String(body[f] ?? ''))].join('\n');
  const key = crypto.createPublicKey({ key: Buffer.concat([DER_ED25519, vk]), format: 'der', type: 'spki' });
  if (!crypto.verify(null, Buffer.from(msg), key, b64d(body.sig))) throw new HttpError(401, 'bad signature');
  return codeOf(vk);
}

// One delegation per warm function instance; presigning a URL is then a local HMAC.
let tok = null;
async function signer() {
  if (!tok || tok.validUntil - Date.now() < 15 * 60 * 1000) {
    tok = await issueSignedToken({ pathname: '*', operations: ['get', 'head', 'put', 'delete'], validUntil: Date.now() + 60 * 60 * 1000 });
  }
  return tok;
}
export async function putUrl(pathname, max = PIECE_MAX) {
  const t = await signer();
  return (await presignUrl(t, { operation: 'put', pathname, access: 'private', maximumSizeInBytes: max, allowOverwrite: true,
    addRandomSuffix: false, validUntil: t.validUntil })).presignedUrl;
}
export async function getUrl(pathname, fresh = false) {
  const t = await signer();
  return (await presignUrl(t, { operation: 'get', pathname, access: 'private', useCache: !fresh, validUntil: t.validUntil })).presignedUrl;
}
export async function until() { return (await signer()).validUntil; }

export async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || r.statusCode === 404 || !r.stream) return null;
  const chunks = [];
  for await (const c of r.stream) chunks.push(Buffer.from(c));
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return null; }
}
export async function writeJson(pathname, obj) {
  await put(pathname, JSON.stringify(obj), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json' });
}
export async function exists(pathname) {
  try { await head(pathname); return true; } catch { return false; }
}
export async function listAll(prefix) {
  const out = [];
  let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    out.push(...r.blobs);
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  return out;
}
export async function removePrefix(prefix) {
  const blobs = await listAll(prefix);
  for (let i = 0; i < blobs.length; i += 500) await del(blobs.slice(i, i + 500).map((b) => b.url));
  return blobs.length;
}

export const TID = /^[0-9a-f]{32}$/;

// The doorbell is a push message on ntfy.sh to a topic derived from the recipient's code, so
// an idle Hop never polls this service. The message carries nothing but "check your inbox".
export function bellTopic(code) {
  return 'hop-' + crypto.createHash('sha256').update('hop-bell/' + code).digest('hex').slice(0, 32);
}
export async function ring(code) {
  try {
    await fetch(`${process.env.HOP_NTFY || 'https://ntfy.sh'}/${bellTopic(code)}`, { method: 'POST', body: 'hop', signal: AbortSignal.timeout(5000) });
  } catch { /* the recipient also checks its inbox at launch */ }
}
