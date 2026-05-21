# Roof-M-All Sample Homepage

Conversion-first sample homepage for Roof-M-All, based on the $50M home-service website playbook and inspired by the Neal Roofing structure.

## What is included

- Static `index.html` homepage
- Local brand/image assets from the existing Roof-M-All site
- Sticky phone CTA
- Above-the-fold free estimate form placeholder
- Trust/proof blocks
- Services section
- Review excerpts
- FAQ section
- Railway-friendly `package.json` using `serve`
- Interactive four-phase growth Kanban board in `kanban.html`
- Phase 1–3 migration starter docs in `docs/`
- CRM-ready lead form names, hidden attribution fields, and CTA tracking hooks
- `/api/leads` backend capture into Railway Postgres for website form submissions

## Local preview

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Notes

This is a sample concept, not production-final. Before launch, confirm:

- final phone/tracking number
- form destination, such as HighLevel, email, Railway backend, or CRM
- license/insurance details
- warranty language
- verified review sources
- priority service areas and SEO pages

## Migration planning docs

- `docs/phase-1-3-migration.md` — starter execution plan for phases one through three.
- `docs/lead-capture-backend.md` — current website form capture API and Railway Postgres lead table notes.
- `docs/lead-intake-schema.md` — first website-to-CRM field contract and routing notes.
