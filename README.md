# owockibot Bounty Board Analytics API

A small, fast Cloudflare Worker that turns raw bounty data into dashboard-ready
JSON: completion rates, time-to-complete, top builders, reward distribution,
and trend lines.

Ships with realistic seed data so it works the moment you deploy it. Swap in
real bounty data whenever you're ready (see [Wiring in real data](#wiring-in-real-data)).

## Endpoints

Base URL after deploy: `https://owockibot-analytics.<your-subdomain>.workers.dev`

| Method | Path | What it returns |
|---|---|---|
| GET | `/` | List of available endpoints |
| GET | `/api/completion-rates?weeks=12` | % of bounties completed, per week |
| GET | `/api/time-to-complete` | Avg days to complete, overall + by category |
| GET | `/api/leaderboard?limit=10` | Top builders ranked by USDC earned |
| GET | `/api/rewards-by-category` | Total/avg reward per category, % share |
| GET | `/api/trends?weeks=12` | Weekly time series: completions + rewards paid |
| GET | `/api/overview` | All five of the above in a single response |

All endpoints are `GET`, return `application/json`, and allow CORS from any
origin (`access-control-allow-origin: *`) so you can hit them straight from a
browser-based dashboard.

### `GET /api/completion-rates`

Query params: `weeks` (default 12) — how many recent weeks to include.

```json
{
  "data": [
    { "week": "2026-W24", "total_bounties": 3, "completed": 3, "completion_rate_pct": 100 },
    { "week": "2026-W25", "total_bounties": 2, "completed": 1, "completion_rate_pct": 50 }
  ]
}
```

### `GET /api/time-to-complete`

```json
{
  "data": {
    "overall_avg_days": 6.42,
    "sample_size": 23,
    "by_category": [
      { "category": "content", "avg_days_to_complete": 2.75, "sample_size": 6 },
      { "category": "bug-hunting", "avg_days_to_complete": 4.1, "sample_size": 5 }
    ]
  }
}
```

### `GET /api/leaderboard`

Query params: `limit` (default 10).

```json
{
  "data": [
    { "rank": 1, "builder": "cyril.eth", "total_earned_usdc": 685, "bounties_completed": 9, "avg_reward_usdc": 76.11, "categories": ["bug-hunting", "content", "building", "deployment"] }
  ]
}
```

### `GET /api/rewards-by-category`

```json
{
  "data": [
    { "category": "building", "total_usdc": 765, "bounties_completed": 7, "avg_reward_usdc": 109.29, "pct_of_total_rewards": 42.1 }
  ]
}
```

### `GET /api/trends`

Query params: `weeks` (default 12). Groups by the week each bounty was
**completed** (not created) so it reflects payout activity over time.

```json
{
  "data": [
    { "week": "2026-W24", "bounties_completed": 2, "rewards_paid_usdc": 180, "avg_reward_usdc": 90 }
  ]
}
```

### `GET /api/overview`

Same shape as the four endpoints above, combined under one call — handy if
your dashboard wants to do a single fetch on load.

---

## Deploy it (Cloudflare Workers, free tier)

You've already done this kind of deploy for the leaderboard page, so this
will feel familiar.

1. **Get the files onto your machine or into a repo.** Either download the
   files I generated, or push them to a new GitHub repo (e.g.
   `owockibot-analytics-api`) under `cyrilawoyemi99-max`.

2. **Install wrangler and log in** (one-time):
   ```
   npm install -g wrangler
   wrangler login
   ```
   This opens a browser tab to authorize wrangler against your (free)
   Cloudflare account. Sign up at cloudflare.com first if you don't have one.

3. **From inside the project folder, deploy:**
   ```
   npm install
   wrangler deploy
   ```
   Wrangler will print a URL like
   `https://owockibot-analytics.<you>.workers.dev` — that's your live API.

4. **Test it:**
   ```
   curl https://owockibot-analytics.<you>.workers.dev/api/overview
   ```

That's it — no build step, no server to maintain, and Cloudflare's free tier
covers 100,000 requests/day.

### Local testing before you deploy

```
npm install
npm run dev
```
This runs the worker on `http://localhost:8787` so you can hit the same
endpoints locally first.

---

## Wiring in real data

Right now `loadBounties()` in `worker.js` just returns the seed array at the
top of the file. You have two easy upgrade paths — pick whichever matches
where your bounty data actually lives:

**Option A — Cloudflare KV (simplest, no external API)**

1. `wrangler kv namespace create BOUNTIES_KV`
2. Paste the id it prints into `wrangler.toml` (uncomment the `[[kv_namespaces]]` block)
3. Push your real bounty array into KV whenever it changes:
   ```
   wrangler kv key put --binding=BOUNTIES_KV bounties "$(cat bounties.json)"
   ```
   `bounties.json` should be an array of objects shaped exactly like the seed
   data (`id`, `title`, `category`, `reward_usdc`, `status`, `builder`,
   `created_at`, `completed_at`). The worker already checks for this KV
   binding first and falls back to seed data if it's empty — no code changes
   needed.

**Option B — Pull from your GitHub Issues bounty sync**

Since owockibot bounties already sync to GitHub Issues via your Action, you
can fetch them live instead of using KV. Replace `loadBounties()` with a
`fetch()` to the GitHub REST API (`/repos/{owner}/{repo}/issues?labels=bounty&state=all`),
then map each issue's labels/state to the same `{ id, title, category,
reward_usdc, status, builder, created_at, completed_at }` shape before
returning it. You'll want a GitHub token stored as a Worker secret
(`wrangler secret put GITHUB_TOKEN`) since issue APIs are rate-limited
for anonymous requests.

Either way, every analytics function (`computeCompletionRates`,
`computeTimeToComplete`, etc.) is pure — it just takes an array of bounty
objects and returns computed stats — so nothing downstream needs to change.

---

## Notes

- Weeks use ISO 8601 week numbering (`YYYY-Www`), Monday-start, matching how
  most charting libraries expect week buckets.
- `completion-rates` groups by when a bounty was **created**; `trends` groups
  by when it was **completed** — that split is intentional, since one answers
  "how are bounties opened that week doing" and the other answers "how much
  did we pay out that week."
- Responses are cached for 60s at the edge (`cache-control: public,
  max-age=60`) to keep it cheap and fast under dashboard polling.
