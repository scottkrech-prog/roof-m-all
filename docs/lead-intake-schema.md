# Roof-M-All Lead Intake Schema

Use this as the first handoff contract between the website, CRM, automations, and reporting dashboard.

## Required fields

- `name`: homeowner or business contact name.
- `phone`: best callback number.
- `service_needed`: selected service category.
- `submitted_at`: ISO timestamp.
- `page_url`: page where the form was submitted.

## Recommended fields

- `email`.
- `city_or_zip`.
- `project_notes`.
- `referrer`.
- `utm_source`.
- `utm_medium`.
- `utm_campaign`.
- `utm_term`.
- `utm_content`.
- `lead_source`: default `website` unless overwritten by campaign/source logic.

## Initial service categories

- Roof repair / leak.
- Roof replacement.
- Storm damage.
- Commercial roofing.
- Gutters.

## Suggested routing rules

- Storm damage: mark priority and route to storm/insurance-capable rep.
- Commercial roofing: route to commercial estimator.
- Missing phone: flag incomplete and trigger email/SMS correction if possible.
- After-hours submission: trigger immediate confirmation and next-business-day callback task.

## Events to track

- `lead_form_submit`.
- `cta_call_click`.
- `cta_estimate_click`.
- `mobile_bar_click`.
- `service_card_click`.

## First reporting questions

- How many leads came from each source?
- Which service categories are converting?
- How fast was first response?
- How many leads booked inspections?
- Which campaigns generated revenue, not just form fills?
