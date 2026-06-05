const crypto = require('crypto');
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const MAX_JSON_BYTES = '64kb';
const SITE_PASSWORD = process.env.SITE_PASSWORD || '';
const SITE_AUTH_COOKIE = 'rma_site_auth';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: MAX_JSON_BYTES }));
app.use(express.urlencoded({ extended: false, limit: MAX_JSON_BYTES }));

function siteAuthToken() {
  return crypto.createHash('sha256').update(`roof-m-all:${SITE_PASSWORD}`).digest('hex');
}

function parseCookies(req) {
  return Object.fromEntries((req.get('cookie') || '').split(';').map((part) => {
    const index = part.indexOf('=');
    if (index === -1) return ['', ''];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function isPasswordAuthed(req) {
  if (!SITE_PASSWORD) return true;
  const token = parseCookies(req)[SITE_AUTH_COOKIE] || '';
  return token === siteAuthToken();
}

function passwordPage(message = '', next = '/') {
  const safeMessage = message ? `<p class="error">${message}</p>` : '';
  const safeNext = next && next.startsWith('/') ? next : '/';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow">
  <title>Password Required | Roof-M-All</title>
  <style>
    :root{color-scheme:dark;--blue:#1f69da;--ink:#0b1220;--card:#111827;--muted:#b8c2d2;--white:#fff;}
    *{box-sizing:border-box}body{min-height:100vh;margin:0;display:grid;place-items:center;padding:24px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at top,#204a8f 0,#0b1220 44%,#060913 100%);color:var(--white)}
    .card{width:min(430px,100%);background:rgba(17,24,39,.94);border:1px solid rgba(255,255,255,.14);border-radius:24px;padding:30px;box-shadow:0 28px 90px rgba(0,0,0,.42)}
    h1{margin:0 0 10px;font-size:28px;letter-spacing:-.04em}p{margin:0 0 20px;color:var(--muted);line-height:1.5}.error{color:#fecaca;background:rgba(220,38,38,.16);border:1px solid rgba(248,113,113,.35);padding:10px 12px;border-radius:12px}
    label{display:block;margin:0 0 8px;font-weight:800}input{width:100%;height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.22);background:#fff;color:#0b1220;padding:0 14px;font:inherit;font-size:20px}button{width:100%;height:52px;margin-top:14px;border:0;border-radius:14px;background:var(--blue);color:#fff;font-weight:900;font-size:16px;cursor:pointer}button:hover{filter:brightness(1.06)}
  </style>
</head>
<body>
  <main class="card" aria-label="Password required">
    <h1>Password required</h1>
    <p>Enter the site password to view this page.</p>
    ${safeMessage}
    <form method="post" action="/__site-login">
      <input type="hidden" name="next" value="${safeNext.replace(/"/g, '&quot;')}">
      <label for="password">Password</label>
      <input id="password" name="password" type="password" inputmode="numeric" autocomplete="current-password" autofocus required>
      <button type="submit">Unlock Site</button>
    </form>
  </main>
</body>
</html>`;
}

function setAuthCookie(req, res) {
  const isHttps = req.secure || req.get('x-forwarded-proto') === 'https';
  res.cookie(SITE_AUTH_COOKIE, siteAuthToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    maxAge: 1000 * 60 * 60 * 12
  });
}

app.get('/__site-login', (req, res) => {
  res.status(401).send(passwordPage('', cleanString(req.query.next || '/', 500)));
});

app.post('/__site-login', (req, res) => {
  const next = cleanString(req.body.next || '/', 500);
  if (req.body.password === SITE_PASSWORD) {
    setAuthCookie(req, res);
    return res.redirect(next.startsWith('/') ? next : '/');
  }
  res.status(401).send(passwordPage('That password did not match. Try again.', next));
});

function requireSitePassword(req, res, next) {
  if (isPasswordAuthed(req)) return next();
  if (req.path === '/api/health') return next();
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(401).json({ ok: false, errors: ['Password required.'] });
  }
  res.status(401).send(passwordPage('', req.originalUrl || '/'));
}

let pool = null;
let dbReady = false;
let dbInitPromise = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000
  });
}

function cleanString(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanUrl(value) {
  const s = cleanString(value, 1200);
  if (!s) return '';
  try {
    const url = new URL(s);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    return url.toString().slice(0, 1200);
  } catch {
    return s.slice(0, 1200);
  }
}

function normalizeLead(body = {}, req) {
  const lead = {
    id: crypto.randomUUID(),
    lead_source: cleanString(body.lead_source || 'website', 80) || 'website',
    form_name: cleanString(body.form_name || 'homepage_estimate', 120) || 'homepage_estimate',
    service_needed: cleanString(body.service_needed, 200),
    service_address: cleanString(body.service_address, 500),
    name: cleanString(body.name, 180),
    email: cleanString(body.email, 254),
    phone: cleanString(body.phone, 80),
    consent: body.consent === true || body.consent === 'on' || body.consent === 'true' || body.consent === '1',
    page_url: cleanUrl(body.page_url),
    referrer: cleanUrl(body.referrer),
    utm_source: cleanString(body.utm_source, 200),
    utm_medium: cleanString(body.utm_medium, 200),
    utm_campaign: cleanString(body.utm_campaign, 200),
    utm_term: cleanString(body.utm_term, 200),
    utm_content: cleanString(body.utm_content, 200),
    user_agent: cleanString(req.get('user-agent') || '', 500),
    ip_hash: crypto.createHash('sha256').update(`${req.ip || ''}:${process.env.IP_HASH_SALT || 'rma-lead-capture-v1'}`).digest('hex'),
    raw_payload: body
  };

  const errors = [];
  if (!lead.service_needed) errors.push('service_needed is required');
  if (!lead.service_address) errors.push('service_address is required');
  if (!lead.name) errors.push('name is required');
  if (!lead.phone) errors.push('phone is required');
  if (!lead.consent) errors.push('consent is required');
  if (lead.email && !/^\S+@\S+\.\S+$/.test(lead.email)) errors.push('email must be valid');
  return { lead, errors };
}

async function initDb() {
  if (!pool) return false;
  if (dbReady) return true;
  if (dbInitPromise) return dbInitPromise;
  dbInitPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS website_leads (
        id uuid PRIMARY KEY,
        created_at timestamptz NOT NULL DEFAULT now(),
        lead_source text NOT NULL DEFAULT 'website',
        form_name text NOT NULL DEFAULT 'homepage_estimate',
        service_needed text NOT NULL,
        service_address text NOT NULL,
        name text NOT NULL,
        email text,
        phone text NOT NULL,
        consent boolean NOT NULL DEFAULT false,
        page_url text,
        referrer text,
        utm_source text,
        utm_medium text,
        utm_campaign text,
        utm_term text,
        utm_content text,
        user_agent text,
        ip_hash text,
        raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
        ai_status text NOT NULL DEFAULT 'new',
        automation_status text NOT NULL DEFAULT 'pending'
      );
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS website_leads_created_at_idx ON website_leads (created_at DESC);');
    await pool.query('CREATE INDEX IF NOT EXISTS website_leads_phone_idx ON website_leads (phone);');
    await pool.query('CREATE INDEX IF NOT EXISTS website_leads_ai_status_idx ON website_leads (ai_status);');
    dbReady = true;
    return true;
  })().catch((error) => {
    dbInitPromise = null;
    dbReady = false;
    throw error;
  });
  return dbInitPromise;
}

app.get('/api/health', async (_req, res) => {
  try {
    const connected = await initDb();
    if (connected && pool) await pool.query('SELECT 1');
    res.json({ ok: true, database: connected ? 'connected' : 'not_configured' });
  } catch (error) {
    res.status(503).json({ ok: false, database: 'error' });
  }
});

app.use(requireSitePassword);

app.post('/api/leads', async (req, res) => {
  const { lead, errors } = normalizeLead(req.body, req);
  if (errors.length) {
    return res.status(400).json({ ok: false, errors });
  }
  if (!pool) {
    return res.status(503).json({ ok: false, errors: ['Lead database is not configured yet.'] });
  }

  try {
    await initDb();
    await pool.query(
      `INSERT INTO website_leads (
        id, lead_source, form_name, service_needed, service_address, name, email, phone, consent,
        page_url, referrer, utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        user_agent, ip_hash, raw_payload
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      )`,
      [
        lead.id, lead.lead_source, lead.form_name, lead.service_needed, lead.service_address, lead.name,
        lead.email || null, lead.phone, lead.consent, lead.page_url || null, lead.referrer || null,
        lead.utm_source || null, lead.utm_medium || null, lead.utm_campaign || null, lead.utm_term || null,
        lead.utm_content || null, lead.user_agent || null, lead.ip_hash, JSON.stringify(lead.raw_payload)
      ]
    );
    res.status(201).json({ ok: true, lead_id: lead.id });
  } catch (error) {
    console.error('Lead capture failed:', error.message);
    res.status(500).json({ ok: false, errors: ['Lead capture failed. Please call Roof-M-All directly.'] });
  }
});

app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  setHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Roof-M-All site listening on port ${PORT}`);
});
