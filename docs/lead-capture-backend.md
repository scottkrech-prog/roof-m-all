# Roof-M-All Website Lead Capture

The public estimate form now posts to the site backend instead of only saving a browser-local copy.

## Current storage

- Primary store: Railway Postgres in the `Roof-M-All (site)` project.
- Table: `website_leads`.
- API endpoint: `POST /api/leads`.
- Health endpoint: `GET /api/health`.

## Captured fields

- `lead_source`
- `form_name`
- `service_needed`
- `service_address`
- `name`
- `email`
- `phone`
- `consent`
- `page_url`
- `referrer`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`
- `user_agent`
- `ip_hash`
- `raw_payload`
- `ai_status`
- `automation_status`

## Why this comes before chat/AI

This gives the site an owned lead database before CRM/GHL is ready. Chat, AI summaries, spreadsheet exports, GHL sync, SMS/email follow-up, and dashboards can all read from this same lead table later.

## Safety notes

- Do not expose `DATABASE_URL`, `DATABASE_PUBLIC_URL`, Railway tokens, or connection strings.
- Test submissions should be deleted after verification.
- `ip_hash` stores a hash, not the raw IP.

## Future automation hooks

- AI intake summary: read rows where `ai_status = 'new'`, write summary fields or create follow-up tasks.
- Spreadsheet export: scheduled job can append new rows to Google Sheets and mark `automation_status`.
- CRM sync: later GHL/contact integration can read from `website_leads` and create contacts/opportunities.
