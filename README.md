# FoodRescue AI — rescue desk

A dispatcher for surplus prepared food that treats every donation as a race against a
safe-eating clock. When a partner goes quiet, the desk widens the search instead of
letting the food rot.

> Most rescued food is lost to no-shows, not to a lack of willing recipients.

## What is in here

| Route | What it is |
| --- | --- |
| `/` | Rescue desk — live queue, map, partner ranking, escalation ladder |
| `/new` | New rescue — photo → listing, safety window from a written rule |
| `/rescue/:id` | Rescue file — timeline, partners, handover, proof-of-rescue receipt |
| `/accept/:id?p=partner` | The partner's phone view — one link, two buttons, no account |
| `/impact` | Impact ledger — rescued vs lost, no-shows absorbed, signed receipts |

## Run it

```sh
npm install
npm run dev
```

The demo seeds four rescues on first load: one mid-escalation, one fresh, one closed
with a signed receipt, and one that was lost. **Reset** in the header reseeds them.

The desk clock control (`1× / 60× / 300×`) accelerates simulated time so a 90-minute
safe window plays in 90 seconds. The seed data ages with it.

## Vision (optional)

The photo reader is a single serverless function that keeps the provider key off the
client.

```sh
cp .env.example .env.local
# GEMINI_API_KEY=...
```

`vite dev` does not run `api/`, so use `vercel dev` if you want the photo reader
locally. Without a key — or if the provider fails — `/api/vision` returns 501/502 and
the desk falls back to a rule-based listing. The rescue workflow never depends on the
model.

## Deploy

Vercel: import the repo, add `GEMINI_API_KEY`, deploy. `vercel.json` rewrites
non-API paths to `index.html` so the partner links resolve.

```sh
npm run build
```

## The rules the desk runs on

These are deliberately plain rules, not model output:

| Rule | Value |
| --- | --- |
| Safe window | 120 min from preparation (vegetarian), 90 (non-vegetarian), 480 (bakery) |
| First decline | 5 min after broadcast |
| Silent partner | 12 min |
| Widen radius | 18 min, 5 km → 9 km |
| Standby accepts | 26 min, only if ≥ 15 min of window remains |
| Capacity gate | a standby must cover ≥ 75% of the portions |
| Feasibility gate | the desk never promises a pickup it cannot reach before the cutoff |

Food safety is never asserted by the model. The window comes from the rule above and
the manager's confirmation.

## Data model

`Rescue` holds the donor, the food, `safeUntil`, the current radius, a list of
`broadcasts` (partner, time, status), an append-only `events` log and an optional
`handover`. State lives in `localStorage`; `metrics()` derives every number on the
impact page from the same records.

## What is on the server

Exactly one function: `api/vision.ts`. It exists so the provider key never reaches the
browser.

There is no database, no auth and no rescue API. Rescues live in `localStorage` on the
device that opened the desk. That is a deliberate trade for a one-week build, and it
has a real cost:

- The four seeded invitations open on any device, because every device seeds the same
  day. A link to a rescue created during the demo only opens on the device that created
  it — an accept there does **not** reach the desk on another machine.
- Two people cannot work the same rescue at the same time.
- Receipts are proof-shaped, not proof: nothing is signed server-side.

What a real deployment adds: one table (`rescue`, `broadcast`, `event`), a
`GET/POST /api/rescue/:id` route, a three-second poll on the desk and on the partner
page, and a signed single-use token per broadcast instead of `?p=partnerId`. About a
day of work, and the first thing to build next.

## Honest limits

- No real canteen or NGO has used this yet. Partners and donors are synthetic.
- The numbers on `/impact` describe the seeded demo, not Mysuru.
- This is not a food-safety authority and not a validated pilot.

See `docs/SUBMISSION.md` for the judge-facing copy and `docs/DEMO.md` for the
40-second recording script.
