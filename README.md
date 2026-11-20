# Coy · Discover

A swipe-based **Discover** tab built for the Coy SDE Intern assignment. Next.js 14 (App Router) with API routes, JSON-file persistence, no external services.

The app has a bottom tab bar with a blank **Home** placeholder and the **Discover** tab. Inside Discover you can toggle between **Swipe** and **Matches**.

## Run it

```bash
npm install
npm run seed     # (optional) regenerates data/profiles.json + placeholder avatars
npm run dev      # http://localhost:3000  (open in a phone-sized window)
npm test         # backend unit tests
```

Swipes and matches are saved to `data/state.json` (git-ignored), so they survive page reloads and server restarts. Use **Reset demo data** on the empty state (or `POST /api/reset`) to replay the demo.

## Demo tips

- 32 seeded profiles; **11 have already liked you** (Aarav, Ananya, Ishita, Meera, Arjun, Navya, Ishaan, Myra, Neil, Anika, Sia). Liking any of them shows "It's a match!".
- Swipe by dragging the card (touch or mouse), using the ✕ / ♥ buttons, or the ← / → keys.

## API

| Method | Route | Description |
| --- | --- | --- |
| GET | `/api/feed` | Profiles not yet swiped on |
| POST | `/api/swipe` | Body `{ "profileId": "u01", "direction": "like" \| "pass" }` → `{ recorded, direction, match, profile }` (`profile` only when `match` is true) |
| GET | `/api/matches` | Mutual matches, newest first |
| POST | `/api/reset` | Demo helper: clears swipes and matches |

## Design decisions

- **Privacy is the core promise.** Whether a profile has liked the user (`likesYou`) lives only in the server-side seed data. It is stripped from every response (`publicProfile` in `lib/store.js`). The client only learns about it at the moment of a mutual match, and a pass never reveals anything. No endpoint lists "people who liked you".
- **A match needs both sides**: it is created only when the user likes a profile that already liked them.
- **Swipes are one-way and idempotent.** A profile can be swiped once. A repeat request (double tap, retry) returns the original outcome and cannot turn a pass into a like or duplicate a match. Swiped profiles are excluded from `/api/feed` on the server, so they never return after a reload.
- **Input validation** returns 400 for a bad `direction` or missing `profileId`, and 404 for an unknown profile.
- **Safe persistence.** State is written to a temp file and renamed, so it never ends up half-written.
- **Resilient UI.** If a swipe fails to save, the card snaps back with an error toast instead of silently losing the swipe. The UI locks while a swipe is in flight to prevent double swipes.
- Business logic lives in `lib/store.js` (framework-free, dependency-injected file paths) so it is easy to test. Routes are thin wrappers.

Tests (`tests/store.test.js`, 12 cases) cover: no `likesYou` leaks, match only when mutual, pass never matches, swiped profiles never reappear, empty feed, idempotency, no duplicate matches, persistence across store instances, validation, and reset.

## Project structure

```
app/            page, layout, styles, API routes (feed, swipe, matches, reset)
components/     Discover.js (swipe cards, match overlay, matches grid)
lib/store.js    all backend logic
scripts/seed.js generates the 32 profiles and SVG avatars
tests/          node:test unit tests
data/           profiles.json (seed), state.json (runtime)
```

---

# Part A: Two core feature suggestions

> Note: these are written from the product concept (add a crush, mutual-only reveal, email verification, invite link, extra slots). Before submitting, add one or two lines from your own walkthrough of app.getcoy.com so it reads as first-hand.

## 1. Mutual-match icebreaker (a safe first conversation)

**What:** When a mutual match happens, both people get a prompt-based first step: a few anonymous-feeling, low-pressure icebreaker questions (for example "pick a movie for a first coffee"), and a short window where both can answer before the conversation opens up.

**Why it is needed:** Coy's value is taking away the fear of rejection. But a match on its own is a dead end: two people who each admitted a crush still face an awkward "who messages first?" moment, which brings back exactly the anxiety Coy removes. Without a next step, matches are less likely to turn into real interactions, and the product's emotional payoff stays incomplete. A guided first step raises the match-to-conversation rate (a key retention metric) and gives users a reason to come back after the match.

## 2. Privacy shield: block list and "hide me from" controls

**What:** Let users pick contacts or people (an ex, family, a coworker, a stalker) who can never be matched with them, and let them pause or hide their profile and remove a crush at any time. Also an optional "cool-down": a crush expires after N days unless refreshed.

**Why it is needed:** A product built on secret crushes is only as trustworthy as the control it gives people over who can connect with them. Without it, users will hesitate to add anyone sensitive, sign-up and invite-link sharing become riskier, and a single unwanted match can destroy trust. Strong controls also reduce harassment and support load, and make users more willing to invite friends, which drives organic growth.
