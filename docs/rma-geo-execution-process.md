# Roof-M-All GEO Execution Process

_Source report: `GEO-REPORT-RoofMAll_new_.pdf` supplied May 17, 2026. Extracted text copy saved outside the repo at `/root/.hermes/workspace/uploads/geo-report-roofmall-extracted.txt`._

## Goal
Move Roof-M-All from AI-invisible to machine-readable, locally credible, and citation-worthy for Charlotte-area roofing queries in ChatGPT, Perplexity, Gemini, Google AI Overviews, and Bing Copilot.

## Current Baseline From Report
- Overall GEO score: 18/100.
- Core blockers: bad/unclear canonical signal, thin machine-readable page content, missing LocalBusiness/RoofingContractor schema, no `llms.txt`, weak platform/directory linkage, weak FAQ/service-page structure.
- Report forecast: technical foundation can move score toward ~34/100 in 30 days; content layer can move toward ~48/100 in 60 days; authority layer can move toward ~61/100 in 90 days.

## Phase 1 — Foundation, Days 1–7
Owner: site/admin implementer.

1. Deploy machine-readable files:
   - `/llms.txt`
   - `/robots.txt`
   - `/sitemap.xml`
2. Add canonical tags:
   - Homepage canonical: `https://www.roof-m-all.com/`
   - FAQ canonical: `https://www.roof-m-all.com/faqs.html`
3. Add JSON-LD:
   - Homepage: `RoofingContractor` + `LocalBusiness` schema.
   - FAQ page: `FAQPage` schema.
4. Verify the public URLs after deployment:
   - `https://www.roof-m-all.com/llms.txt`
   - `https://www.roof-m-all.com/robots.txt`
   - `https://www.roof-m-all.com/sitemap.xml`
5. Submit sitemap in Bing Webmaster Tools and Google Search Console.

## Phase 2 — Content Layer, Days 8–45
Owner: Scott/marketing + site implementer.

Create or expand pages so AI engines have exact, factual answers to cite.

Priority pages:
1. Commercial Roofing in Charlotte
2. Residential Roofing in Charlotte
3. Roof Repair in Charlotte
4. Roof Replacement in Charlotte
5. Storm Damage / Insurance Help
6. Gutters and Siding
7. About Roof-M-All

Writing format for every section:
- Use the customer question as the H2.
- Answer directly in the first 1–2 sentences.
- Include one concrete local detail.
- Name Roof-M-All and the city/service area naturally.
- End with a real CTA: call 704-631-9936 or request a free estimate.

## Phase 3 — Authority Layer, Days 46–90
Owner: operations + marketing.

1. Fully optimize Google Business Profile:
   - Services, categories, description, photos, Q&A, review responses.
2. Claim/verify Bing Places and Apple Maps.
3. Add/confirm profiles:
   - Facebook
   - BBB
   - Yelp if appropriate
   - Angi/HomeAdvisor if appropriate
   - LinkedIn company page
4. Create a repeatable review request process:
   - Text each satisfied customer within 24 hours.
   - Reply to every review within 24–48 hours.
   - Capture review text for site testimonial refreshes.
5. Monthly local-proof capture:
   - 2 project photos with city/neighborhood context.
   - 1 short customer/problem/result story.
   - 1 FAQ answer based on real homeowner questions.

## Monthly GEO Measurement Routine
Run these 10 prompts in ChatGPT, Perplexity, Google AI Overviews/Gemini, and Bing Copilot. Record whether Roof-M-All is named, which competitors are named, and what source was cited.

1. Who are the best roofers near me in Charlotte NC?
2. Best roof replacement company in Charlotte NC.
3. Who repairs storm damaged roofs in Charlotte?
4. Roofer near Mint Hill NC with good reviews.
5. Roofing contractor in Matthews NC.
6. Commercial roofing company near Charlotte NC.
7. How much does roof replacement cost in Charlotte?
8. Who helps with roof insurance claims in Charlotte?
9. GAF certified roofer near Charlotte NC.
10. Roof repair company near Waxhaw or Weddington NC.

## Definition of Done
- Public root files return HTTP 200.
- Canonicals point to production domain, not staging.
- JSON-LD validates without syntax errors.
- Sitemap is submitted in Google/Bing.
- FAQ content is indexable as text and represented in FAQ schema.
- Reviews/testimonials are visible as text, not only images/widgets.
- Monthly AI prompt scorecard is updated.
