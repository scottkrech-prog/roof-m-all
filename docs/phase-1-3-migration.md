# Roof-M-All Site Migration — Phases 1–3 Starter Plan

This document turns the first three growth phases from the Kanban board into site-migration work we can execute without waiting on every external system.

## Phase 1 — Stop the Revenue Leaks

**Goal:** make sure the new site captures real buyer intent and exposes the gaps we need to fix before sending more traffic.

### Site audit items

- Confirm primary phone number and whether it should be a tracking number.
- Confirm form destination: HighLevel, email, Railway backend, CRM, or temporary inbox.
- Confirm service-area language for Charlotte plus surrounding NC/SC markets.
- Confirm claims before launch:
  - License number.
  - Insurance language.
  - Warranty terms.
  - GAF Master Elite usage.
  - 4,811+ roofs serviced claim.
  - Review excerpts and attribution.
- Verify every major CTA is visible on mobile:
  - Header phone CTA.
  - Header estimate CTA.
  - Hero form.
  - Sticky mobile call / estimate bar.
- Inventory missing trust assets:
  - Project photos.
  - Crew photos.
  - Before/after photos.
  - Badges/certifications.
  - Owner/team bios.

### Revenue-leak checks

- Missed call path: what happens if a homeowner calls after hours?
- Form response SLA: who gets notified and how quickly?
- Follow-up path: what sequence happens after form submission?
- Review path: how are happy customers asked for reviews?
- Re-engagement path: where do old customers/leads live today?

## Phase 2 — Build the Revenue Infrastructure

**Goal:** make the site ready to connect into the operating stack.

### Tracking infrastructure

- Add final analytics stack when accounts are available:
  - Google Analytics 4.
  - Google Tag Manager if preferred.
  - Google Ads conversion tags.
  - Call tracking if using a dynamic number provider.
  - LSA conversion tracking if available.
- Track these minimum events:
  - `cta_call_click`.
  - `cta_estimate_click`.
  - `lead_form_submit`.
  - `service_card_click`.
  - `mobile_bar_click`.

### CRM / database visibility

Recommended lead fields for the first production connection:

- `first_name` / `name`.
- `phone`.
- `email`.
- `city_or_zip`.
- `service_needed`.
- `project_notes`.
- `page_url`.
- `referrer`.
- `utm_source`.
- `utm_medium`.
- `utm_campaign`.
- `utm_term`.
- `utm_content`.
- `submitted_at`.

### Site upgrades started in repo

- The form has been made CRM-ready with stable field names and hidden attribution fields.
- CTA clicks have data attributes so we can attach analytics without rewriting markup later.
- A small attribution script captures UTM/referrer/page data and prepares a normalized lead payload.

## Phase 3 — Turn On Scalable Demand

**Goal:** make the site ready for paid demand only after capture, tracking, and follow-up are working.

### Demand channels to prepare

- Google Local Services Ads:
  - Confirm business profile, licensing, insurance, service categories, service area, reviews.
- Google Search Ads:
  - Build high-intent ad groups around roofing repair, roof replacement, storm damage, commercial roofing, and local modifiers.
- Re-engagement:
  - Past customers.
  - Old unsold estimates.
  - Storm-season checkup list.
- AI intake / response:
  - Voice AI for missed calls and after-hours intake.
  - Chat AI for website triage.
  - Email/SMS follow-up automations.

### Pre-traffic gate

Do not scale paid traffic until these are true:

- Calls and form submissions are tracked.
- A real person or automation responds quickly.
- Every lead lands in one visible place.
- The follow-up sequence is approved.
- The dashboard can separate source, campaign, service requested, and booked appointment.

## Unknowns to confirm with Scott / Roof-M-All

- Final domain and canonical URLs.
- Final production phone number or tracking-number provider.
- Preferred CRM / HighLevel setup.
- Google Workspace admin account for the business.
- Google Business Profile access.
- Google Ads / LSA access.
- Review-source permission and exact attribution language.
- Approved warranty, financing, insurance, and license copy.
