const crypto = require('crypto');
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const MAX_JSON_BYTES = '64kb';

app.disable('x-powered-by');
app.use(express.json({ limit: MAX_JSON_BYTES }));
app.use(express.urlencoded({ extended: false, limit: MAX_JSON_BYTES }));

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
