// Hop's matchmaking + relay API: https://hop.pxlvzn.in/api/hop/<op>
// See _lib.js for what's stored and why the service only ever sees ciphertext.
import { del } from '@vercel/blob';
import {
  HttpError, KEEP_DAYS, MAX_BYTES, PIECE, TID, exists, getUrl, listAll, normCode, putUrl, readJson,
  removePrefix, ring, verify, writeJson,
} from './_lib.js';

const MAX_BATCH = 256;
const maxPieces = Math.ceil(MAX_BYTES / PIECE) + 2000; // + one piece per empty or small file

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw new HttpError(400, 'bad json'); }
}
const int = (v, lo, hi, what) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < lo || n > hi) throw new HttpError(400, 'bad ' + what);
  return n;
};
const tidOf = (v) => { if (!TID.test(String(v))) throw new HttpError(400, 'bad transfer id'); return String(v); };

async function meta(tid) {
  const m = await readJson(`x/${tid}/meta.json`);
  if (!m) throw new HttpError(404, 'That transfer has expired');
  return m;
}
async function batch(prefix, start, count, total, fn) {
  if (start >= total) return [];
  const n = Math.min(count, total - start);
  return Promise.all(Array.from({ length: n }, (_, i) => fn(`${prefix}${start + i}`)));
}

const ops = {
  // Publish this device's code, key and name (the app calls this only when they change).
  async register(b) {
    const code = verify('register', b, ['name']);
    const name = String(b.name || '').slice(0, 40);
    await writeJson(`dir/${code}.json`, { vk: b.vk, name, at: Date.now() });
    return { code, max_bytes: MAX_BYTES, piece: PIECE };
  },

  // Who is this code? The app checks the key against the code itself.
  async lookup(b, q) {
    const code = normCode(q.code || b.code);
    const d = await readJson(`dir/${code}.json`);
    if (!d) throw new HttpError(404, 'No one has that Hop code yet');
    return { code, vk: d.vk, name: d.name };
  },

  // Start a transfer to someone's code. Returns where to upload the sealed offer.
  async send(b) {
    const from = verify('send', b, ['to', 'tid', 'size', 'pieces']);
    const to = normCode(b.to);
    const tid = tidOf(b.tid);
    const size = int(b.size, 0, MAX_BYTES, 'size');
    const pieces = int(b.pieces, 0, maxPieces, 'piece count');
    if (!(await exists(`dir/${to}.json`))) throw new HttpError(404, 'No one has that Hop code yet');
    const m = await readJson(`x/${tid}/meta.json`);
    if (m && m.from !== from) throw new HttpError(409, 'transfer id in use');
    if (!m) await writeJson(`x/${tid}/meta.json`, { from, to, size, pieces, at: Date.now() });
    return { offer: await putUrl(`x/${tid}/offer`, 1 << 20) };
  },

  // Upload URLs for a range of pieces (sender only).
  async urls(b) {
    const from = verify('urls', b, ['tid', 'start', 'count']);
    const tid = tidOf(b.tid);
    const m = await meta(tid);
    if (m.from !== from) throw new HttpError(403, 'not your transfer');
    const start = int(b.start, 0, maxPieces, 'start'), count = int(b.count, 1, MAX_BATCH, 'count');
    return { urls: await batch(`x/${tid}/p/`, start, count, m.pieces, (p) => putUrl(p)) };
  },

  // Everything is uploaded: put it in their inbox and ring their doorbell.
  async sent(b) {
    const from = verify('sent', b, ['tid']);
    const tid = tidOf(b.tid);
    const m = await meta(tid);
    if (m.from !== from) throw new HttpError(403, 'not your transfer');
    if (!(await exists(`x/${tid}/offer`))) throw new HttpError(409, 'offer missing');
    await writeJson(`inbox/${m.to}/${tid}.json`, { tid, from, at: Date.now() });
    await ring(m.to);
    return { ok: true };
  },

  // What's waiting for me.
  async inbox(b) {
    const code = verify('inbox', b, []);
    const blobs = await listAll(`inbox/${code}/`);
    const items = await Promise.all(blobs.map(async (bl) => {
      const tid = bl.pathname.split('/').pop().replace(/\.json$/, '');
      if (!TID.test(tid)) return null;
      return { tid, at: new Date(bl.uploadedAt).getTime(), offer: await getUrl(`x/${tid}/offer`) };
    }));
    return { items: items.filter(Boolean) };
  },

  // Download URLs for a range of pieces (recipient only).
  async pull(b) {
    const code = verify('pull', b, ['tid', 'start', 'count']);
    const tid = tidOf(b.tid);
    if (!(await exists(`inbox/${code}/${tid}.json`))) throw new HttpError(404, 'That transfer has expired');
    const m = await meta(tid);
    const start = int(b.start, 0, maxPieces, 'start'), count = int(b.count, 1, MAX_BATCH, 'count');
    return { urls: await batch(`x/${tid}/p/`, start, count, m.pieces, (p) => getUrl(p)) };
  },

  // Received, declined or cancelled: delete it all.
  async done(b) {
    const code = verify('done', b, ['tid']);
    const tid = tidOf(b.tid);
    const m = await readJson(`x/${tid}/meta.json`);
    const mine = (m && (m.from === code || m.to === code)) || (await exists(`inbox/${code}/${tid}.json`));
    if (!mine) throw new HttpError(403, 'not your transfer');
    await removePrefix(`x/${tid}/`);
    const to = m ? m.to : code;
    try { await del(`inbox/${to}/${tid}.json`); } catch { /* already gone */ }
    return { ok: true };
  },

  // Daily: anything not picked up within KEEP_DAYS is deleted.
  async sweep() {
    const cutoff = Date.now() - KEEP_DAYS * 24 * 3600 * 1000;
    let n = 0;
    for (const prefix of ['x/', 'inbox/']) {
      const old = (await listAll(prefix)).filter((bl) => new Date(bl.uploadedAt).getTime() < cutoff);
      for (let i = 0; i < old.length; i += 500) await del(old.slice(i, i + 500).map((bl) => bl.url));
      n += old.length;
    }
    return { deleted: n };
  },
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const op = String((req.query && req.query.op) || '');
    if (!Object.prototype.hasOwnProperty.call(ops, op)) throw new HttpError(404, 'unknown op');
    if (op === 'sweep') {
      const auth = req.headers.authorization || '';
      if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) throw new HttpError(401, 'no');
    } else if (op !== 'lookup' && req.method !== 'POST') throw new HttpError(405, 'POST only');
    const b = req.method === 'POST' ? await body(req) : {};
    res.status(200).json(await ops[op](b, req.query || {}));
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    res.status(status).json({ error: status === 500 ? 'Hop’s server had a problem. Try again.' : e.message });
  }
}

