const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'parenting_entries';

async function redis(cmd, ...args) {
  const res = await fetch(`${REDIS_URL}/${cmd}/${args.map(a => encodeURIComponent(a)).join('/')}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const result = await redis('get', KEY);
    const entries = result.result ? JSON.parse(result.result) : [];
    return res.status(200).json(entries);
  }

  if (req.method === 'POST') {
    const entry = req.body;
    const existing = await redis('get', KEY);
    const entries = existing.result ? JSON.parse(existing.result) : [];
    entries.unshift(entry);
    await redis('set', KEY, JSON.stringify(entries));
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { index } = req.query;
    const existing = await redis('get', KEY);
    const entries = existing.result ? JSON.parse(existing.result) : [];
    entries.splice(Number(index), 1);
    await redis('set', KEY, JSON.stringify(entries));
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
