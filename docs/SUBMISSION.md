## Title

**FoodRescue AI — the rescue desk for surplus food**

## One line

Every surplus-food donation runs against a safe-eating clock. When a partner goes
quiet, the desk escalates instead of letting the food rot.

## Short summary (60 words)

Restaurants and canteens do not stop donating because nobody wants the food. They stop
because a partner says yes and never arrives, the food spoils, and the manager is
burned once. FoodRescue AI runs each donation as a timed rescue: rank the partners,
send a link that needs no account, escalate on a fixed ladder, and close with a signed
proof-of-rescue receipt.

## The problem, in one paragraph

A college canteen in Mysuru over-prepares, and by 9 pm there are 46 portions of rice
and sambar with two hours of safe window left. The manager has no way to know which
nearby organisation will actually turn up. One failed pickup is enough to make the
next evening's surplus go straight into the bin. The loss is not caused by a lack of
willing recipients — it is caused by an unanswered phone.

## What is different

1. **The clock is the product.** Discovery is solved by WhatsApp groups. Reliability
   is not. Every rescue has a hard cutoff and a four-step escalation ladder.
2. **A partner needs no account.** They receive one link with two buttons. This is how
   volunteers actually behave.
3. **The desk refuses impossible promises.** A standby is only invited if it can cover
   75% of the portions and reach the donor before the cutoff.
4. **Every rescue leaves a receipt.** A timestamped proof-of-rescue with a proof ID is
   what makes a manager say yes again next week.
5. **Losses stay on the ledger.** The impact page counts what was lost, not only what
   was saved.

## How it works, in three steps

1. The manager photographs the trays. The listing is drafted from the photo; the safe
   window comes from a written handling rule, never from the model.
2. The desk ranks nearby partners by pickup reliability, distance and capacity, then
   sends each of the top three a link with two buttons.
3. If the first declines and the second stays silent, the radius widens and a standby
   takes it. The handover is signed at the door and becomes a receipt.

## Try it (30 seconds)

- Open the **Rescue desk** → press **Play the day at 60×**.
- Watch `FR-1041` go from live → escalating → accepted by a standby.
- Open **Open partner link** to see the volunteer's phone view, accept, then sign the
  handover and inspect the receipt.

## What is synthetic

The donors, partners, phone number and pickup history are seeded demo data, labelled as
such in the header, on the partner page and on the impact ledger. No real donation is
claimed anywhere in the app.

## What we would validate next

1. Two weeks of listings with one college canteen, counting declines and no-shows.
2. Whether a partner accepts a WhatsApp link with no account.
3. Whether a signed receipt changes whether the manager donates again.

## Built with

React + Vite + Tailwind, Leaflet/OpenStreetMap, one serverless vision endpoint
(Gemini) with a rule-based fallback. No database and no login in this build: state is
local, which keeps the link openable by a judge and removes every failure mode except
the demo itself.
