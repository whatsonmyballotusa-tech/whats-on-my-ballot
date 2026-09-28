# Account & API-Key Checklist — Zero-Budget Voter-Info App
**Pilot:** Philadelphia, PA · **Budget:** $0/month (+ ~$10/year for a custom domain, the only planned cost)
**How to read this:** Do the "TODAY" section in order, top to bottom — each step unblocks the next. "LATER" steps wait for their milestone. Every step is marked **🧍 HUMAN** (only you can do it: identity checks, button clicks, card entry) or **🤖 AGENT-ABLE** (Luna's crew can do it once you hand over the login/API key).

> URL note: every link below was verified live on 2026-09-28. If a page looks different, use the site's search for the named item rather than guessing a new address.

---

## 🟢 DO TODAY (in this order)

### 1. Create the dedicated project Google account — the master key 🧍 HUMAN
**Why first:** nearly everything below offers "Continue with Google." One clean project account keeps the venture separate from your personal life and becomes the recovery identity for all services.
**URL:** https://accounts.google.com/signup
**Click-by-click:**
1. Open the link → enter first/last name (use the project name or your name — your call).
2. Pick a Gmail address like `phillyballotguide@gmail.com` (or your chosen project name). Write it down — this is the **project email**.
3. Create a strong password, save it in a password manager (or written somewhere safe).
4. Google **may ask for a phone number** for verification — that's normal; enter it, type the code they text you.
5. Done. Stay signed in to this account in one browser profile for all steps below.
**Provide:** name, birthdate, phone number (possibly).
**Card:** none. **Cost:** $0.
**Unblocks:** steps 2 (GitHub social login), 6 (Google Cloud), 12 (AdSense later), Brevo sender identity.

### 2. GitHub account + project repository 🧍 HUMAN (+ 🤖 AGENT-ABLE after)
**Why:** the code lives here; GitHub Actions runs the free data pipeline (fetch → verify → publish).
**URL:** https://github.com/signup
**Click-by-click:**
1. Open the link → **Continue with Google** (use the project account from step 1) *or* type the project email manually.
2. Create a password, pick a username (e.g. `philly-ballot-guide` — public, so keep it professional).
3. Solve the puzzle check, then type the **launch code** emailed to you.
4. Choose the **Free** plan ("Skip personalization" if it asks setup questions).
5. Click **+ → New repository** → name it (e.g. `voter-info-app`), add a README, create it.
**Provide:** email, password, username; solve a puzzle + email code.
**Card:** none — free plan cannot be charged. **Cost:** $0.
**Decision:** make the repo **Public** — public repos get unlimited free Actions minutes (private repos get 2,000/mo, still plenty, but public also signals transparency for a civic project). Never put API keys in the repo — those go in GitHub Secrets / env vars, which the agent crew handles.
**Unblocks:** step 4 (Supabase "sign in with GitHub" is fastest), all agent build work.
**🤖 After:** agents can create Actions workflows, manage secrets, and deploy from this repo.

### 3. Cloudflare account (Pages + Workers + R2) 🧍 HUMAN
**Why:** free website hosting (Pages), free API layer (Workers), free photo storage (R2) — unlimited bandwidth, no card for the core services.
**URL:** https://dash.cloudflare.com/sign-up
**Click-by-click:**
1. Open the link → enter the **project email** + a password → verify your email (click the link they send).
2. Skip "Add a website" — you don't need a domain yet; the app will live at a free `*.pages.dev` address.
3. **R2 photo storage — the one card touchpoint:** in the left sidebar open **R2** → click **Enable R2**. Cloudflare **requires a credit/debit card or PayPal on file to activate R2, even on the free tier.** Entering the card costs **$0.00** and you are never charged while inside the free tier (10 GB storage, zero egress fees). ⚠️ **If you'd rather not enter a card today, SKIP R2 for now** — candidate photos can start from free public-domain sources and R2 can be enabled later when the photo pipeline is built. Pages + Workers need no card at all.
**Provide:** email, password (+ card *only* if you enable R2 now).
**Card:** only for R2 activation; Pages/Workers = no card, cannot be charged. **Cost:** $0.
**Unblocks:** hosting the site, the API, and (once enabled) photo storage.
**🤖 After:** agents can create Pages projects, Workers, and R2 buckets via API token (you'll create one token for them in the dashboard: **My Profile → API Tokens**).

### 4. Supabase account + database project 🧍 HUMAN (+ 🤖 AGENT-ABLE after)
**Why:** free Postgres database + free user login system (50,000 users/month on free).
**URL:** https://supabase.com → click **Start your project**
**Click-by-click:**
1. **Sign in with GitHub** (the account from step 2 — fastest) or the project email.
2. Click **New Project** → name it (e.g. `voter-info`), click **Generate a password** for the database and **save it somewhere you won't lose it**.
3. Region: pick the one nearest Philadelphia (US East).
4. Wait ~1 minute while it provisions.
5. Go to **Project Settings (gear icon) → API** and note the **Project URL** and **anon public key** — hand these to the agent crew; they go into the app's settings, never into the repo.
**Provide:** nothing beyond the GitHub/email login. **Card:** none — no card on the free plan, cannot be charged. **Cost:** $0.
**Gotcha:** free projects **pause after 7 days of inactivity** (10–30s cold start on wake). The agent crew sets up a free scheduled ping to prevent this — nothing for you to do.
**Unblocks:** database, user accounts, review queues.
**🤖 After:** agents can create tables and wire the app to it.

### 5. Brevo account (email sending) 🧍 HUMAN
**Why:** free transactional email (300/day forever) — verification emails, candidate correction notices, election reminders.
**URL:** https://www.brevo.com → click **Sign up free**
**Click-by-click:**
1. Enter the project email, a password, and a company name (your project name is fine) → verify your email.
2. Complete the short onboarding questionnaire honestly (it's a non-partisan civic information project sending transactional/notification emails). Brevo sometimes does a quick manual review of new accounts before sending activates — usually under a day.
3. **Get the API key:** click your name (top right) → **SMTP & API** → **Create a new API key** → name it (e.g. `voter-app`) → **copy it immediately** (it shows only once). Hand it to the agent crew.
4. **Verify a sender:** **Senders → Add a sender** → add the project Gmail for now (works immediately, no domain needed). When the custom domain is bought (step 10), switch the sender to `noreply@yourdomain.com` and add the SPF/DKIM records Brevo shows you.
**Provide:** email, password, company name. **Card:** none. **Cost:** $0.
**Unblocks:** all app email.
**🤖 After:** agents send mail through the Brevo API using the key.

### 6. Google Cloud project + Civic Information API key 🧍 HUMAN
**Why:** the free ballot backbone — address in, full ballot out (~25,000 lookups/day free).
**URL:** https://console.cloud.google.com (sign in with the project Google account)
**Click-by-click:**
1. If it's your first visit, check the Terms box → **Agree and continue**.
2. Top bar project dropdown → **New Project** → name it (e.g. `voter-info-app`) → **Create**. Wait for the bell notification, then **SELECT PROJECT**.
3. Top search bar → type **Civic Information API** → open it → click **Enable**.
4. Left menu → **APIs & Services → Credentials** → **+ Create Credentials → API key** → copy the key (starts with `AIza...`). Hand it to the agent crew.
5. (Recommended, agent can do it:) restrict the key to the Civic Information API so it can't be abused if leaked.
**Provide:** just the Google login + ToS acceptance. **Card:** **NONE — do not start the free trial, do not link a billing account.** An API key by itself *cannot* charge you; charges are impossible unless you manually attach billing. If Google ever prompts for billing "verification," stop and ask Luna before proceeding.
**Cost:** $0. **Unblocks:** ballot lookups (the core feature).
**🤖 After:** agents use the key server-side only (never in public web pages).

### 7. api.data.gov key — covers FEC + Congress.gov 🧍 HUMAN (1 minute)
**Why:** one free key unlocks federal campaign-finance data (FEC) and federal bios/votes/photos (Congress.gov).
**URL:** https://api.data.gov/signup/
**Click-by-click:**
1. Fill in name + project email → **Submit**.
2. Watch the inbox for the welcome email from `noreply@api.data.gov` — the key is in the email body (check spam if it's slow). Done — active immediately.
3. (Optional, same thing via Congress.gov's own page: https://api.congress.gov/sign-up/ — either route works; one key is enough.)
**Provide:** name + email. **Card:** none. **Cost:** $0.
**Unblocks:** money-in-politics data + federal voting records.
**🤖 After:** agents plug the key into the data pipeline.

### 8. OpenStates (Plural) API key — state legislator data 🧍 HUMAN
**Why:** free voting records and bios for Pennsylvania state legislators.
**URL:** https://open.pluralpolicy.com → sign up (email + password), verify email.
**Then:** sign in and open https://open.pluralpolicy.com/accounts/login/?next=/accounts/profile/#apikey → your profile page shows **Generate API key** → copy it for the agent crew.
**Provide:** email + password. **Card:** none. **Cost:** $0 (free tier: ~500 requests/day — plenty with caching).
**Note:** OpenStates is mid-migration into Plural's main app; key registration still works at the address above today. If the page has moved, use the site's search for "API key."
**Unblocks:** PA state-house/state-senate voting records.
**Do later alternative:** if signup is ever awkward, their bulk CSV downloads need no key at all.

### 9. PostHog account — analytics 🧍 HUMAN (5 minutes, can be today)
**Why:** free product analytics (1M events/month) — see which ZIPs people search, where they drop off.
**URL:** https://us.posthog.com/signup (US cloud — pick this one)
**Click-by-click:**
1. Sign up with the project email → organization name (project name) → project name (e.g. `voter-app`).
2. **Project settings → Project API key** → copy the `phc_...` key for the agent crew (it's a write-only public key, safe for the website).
**Provide:** email. **Card:** none for the free tier. **Cost:** $0.
**Unblocks:** analytics — only useful once the site is live, so this can also slide to launch week.

---

## 🟡 DO LATER (milestone-gated)

### 10. Buy the custom domain — the ONE planned cost 🧍 HUMAN (do when the MVP site is live)
**Why:** a real domain (`yourname.com`) instead of `yourapp.pages.dev`. **Required before applying to AdSense** (approval is materially easier on a custom domain) and needed for professional Brevo sender email.
**URL:** https://www.cloudflare.com/products/registrar/ (or straight in your Cloudflare dashboard: **Domain Registration → Register Domains**)
**Click-by-click:**
1. In the Cloudflare dashboard → **Domain Registration → Register Domains** → search your chosen name.
2. Pick a `.com` (~$9–12/year at Cloudflare's at-cost, no-markup pricing — no renewal price jumps).
3. Check out with a credit/debit card. Domain lands in the same Cloudflare account — **zero DNS setup needed**.
**Provide:** card + registrant details. **Card:** YES — ~$10/year charged. This is the single planned purchase in the whole project.
**Timing:** buy it once the MVP is live on `*.pages.dev` and Philadelphia data is flowing — ideally a few weeks before the AdSense application so the domain has some age.
**🤖 After:** agents point the domain at the site and set up Brevo sender authentication (SPF/DKIM).

### 11. Vote Smart API access — attempt, non-blocking 🧍 HUMAN (do after MVP; may need a call)
**Why:** the deepest free candidate-bio/ratings database. **Not required for launch** — Wikipedia + official sites cover MVP bios.
**Reality check:** their public page (https://www.votesmart.org/votesmart-api) currently shows only a **"BOOK DEMO"** button — no self-serve signup, no published pricing. Their own API terms (https://api.votesmart.org/docs/terms.html) say *individual use is restricted to members* and *business/organizational use is subject to fees*, and bar any use "in any campaign activity."
**Click-by-click:**
1. First try the legacy register path: http://votesmart.org/share/api/register — if it still works, register as an individual member (free).
2. If it funnels you to the demo form, submit **Book Demo** describing a non-partisan voter-education project, and email them asking about free organizational access for a civic nonprofit-style project.
3. **Do not pay anything and do not sign anything without checking with Luna first.** If they quote fees, we proceed without Vote Smart — the MVP doesn't need it.
**Provide:** email / demo form details. **Card:** none. **Cost:** $0 if granted; walk away if they charge.
**Unblocks:** richer candidate bios later. **Safe to skip.**

### 12. Google AdSense — monetization 🧍 HUMAN (do LAST: needs a live, content-rich site)
**Why:** ad revenue. No traffic minimum to start; upgrade to Mediavine Journey at 1,000 sessions/month later.
**URL:** https://adsense.google.com (sign in with the project Google account)
**Do NOT apply until ALL of these are true:**
- [ ] Site live on the **custom domain** (step 10), HTTPS on (Cloudflare gives this free)
- [ ] Real content: ballot lookup working for Philadelphia + informational pages (About, Contact, Privacy Policy — required; methodology/how-we-verify page strongly recommended)
- [ ] Clean navigation, mobile-friendly, no broken links
- [ ] You are 18+ (or a parent/guardian applies)
**Click-by-click:**
1. Sign up → enter the site URL → verify ownership (paste their code snippet into the site's `<head>`, or add their `ads.txt` line — the agent crew does this part).
2. Enter contact/payment details. **Payouts only start at the $100 threshold**, and tax info is collected before the first payout — that's months away; nothing to do now.
3. Wait for review: typically days to 2–4 weeks.
**Provide:** Google login, site URL, contact info (tax info only at payout time). **Card:** none. **Cost:** $0.
**Policy red lines for this project:** AdSense *allows* non-partisan political content, but bans "unreliable claims" that could undermine trust in elections (false voting-procedure info, false eligibility claims). **A hallucinated candidate bio is both a product failure and an AdSense policy violation** — this is why the verification layer exists. Also: no political-ad targeting, and per the master plan we accept **no candidate/party ads** in v1.

### 13. Social media handles — reserve after the name/domain is final 🧍 HUMAN
**Why:** the user asked about engagement/growth. These are free, take minutes, and should all match the project name.
**When:** right after step 10 (domain/name locked). Create: **X (Twitter), Instagram, Facebook Page, TikTok, YouTube** — same handle everywhere if possible. Use the project email for all of them.
**Cost:** $0. **Card:** none.
**Note:** accounts are just the start — the growth plan (content calendar, posting cadence, what to post) is a separate workstream for launch week, not an account-setup task.

---

## Quick-reference: who does what

| # | Account / Key | Human-only? | Card? | Cost | When |
|---|---|---|---|---|---|
| 1 | Project Google account | ✅ Yes (identity/phone) | No | $0 | Today, first |
| 2 | GitHub + repo | ✅ Yes (puzzle, email code) | No | $0 | Today |
| 3 | Cloudflare | ✅ Yes (signup; card only if enabling R2 now) | Only R2 | $0 | Today |
| 4 | Supabase | ✅ Yes (1 click via GitHub) | No | $0 | Today |
| 5 | Brevo | ✅ Yes (signup, API key copy, sender verify) | No | $0 | Today |
| 6 | Google Cloud + Civic API key | ✅ Yes (ToS, project, key creation) | **No — never add billing** | $0 | Today |
| 7 | api.data.gov key | ✅ Yes (email form) | No | $0 | Today |
| 8 | OpenStates API key | ✅ Yes (signup) | No | $0 | Today |
| 9 | PostHog | ✅ Yes (signup) | No | $0 | Today |
| 10 | Custom domain | ✅ Yes (purchase) | **Yes — ~$10/yr** | ~$10/yr | Later (MVP live) |
| 11 | Vote Smart | ✅ Yes (demo/negotiation) | No | $0 or skip | Later (optional) |
| 12 | AdSense | ✅ Yes (application, 18+) | No | $0 | Last (site + content ready) |
| 13 | Social handles | ✅ Yes | No | $0 | Later (name locked) |

**Rule of thumb:** anything involving *identity, a phone, a puzzle/verification code, a card, or accepting Terms* is human-only. Everything after the login — creating projects, tables, API tokens, wiring keys into the app, deploying — is agent work. When in doubt, do the signup yourself and hand Luna the resulting API key or login; the crew takes it from there.

**Secrets hygiene (for the human):** API keys go to the agent crew through secure handoff (they live in server settings, never in the public repo or chat screenshots). The `service_role` Supabase key and Brevo key are the crown jewels — treat like passwords.
