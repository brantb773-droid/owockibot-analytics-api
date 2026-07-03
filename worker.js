/**
 * owockibot bounty board analytics API
 * Cloudflare Worker — see README.md for deploy + data-wiring instructions
 */

// ---------------------------------------------------------------------------
// DATA LAYER
// ---------------------------------------------------------------------------
// Right now this returns SEED_DATA so the API works out of the box.
// To go live, replace loadBounties() with a fetch to:
//   - your GitHub Issues sync (owockibot bounties-as-issues repo), or
//   - a KV namespace you populate on a cron, or
//   - owockibot.xyz's own bounty API, if/when it exposes one.
// See README.md > "Wiring in real data" for a drop-in example of each.

const SEED_DATA = [
  { id: "b001", title: "Audit owockibot.xyz for broken guide pages", category: "bug-hunting", reward_usdc: 40, status: "completed", builder: "cyril.eth", created_at: "2026-03-02T10:00:00Z", completed_at: "2026-03-05T14:00:00Z" },
  { id: "b002", title: "Fix dashboard widget failing to load stats", category: "bug-hunting", reward_usdc: 60, status: "completed", builder: "0xmara", created_at: "2026-03-03T09:00:00Z", completed_at: "2026-03-08T11:00:00Z" },
  { id: "b003", title: "X thread: agent economy explainer", category: "content", reward_usdc: 25, status: "completed", builder: "cyril.eth", created_at: "2026-03-09T08:00:00Z", completed_at: "2026-03-10T20:00:00Z" },
  { id: "b004", title: "Interactive HTML manifesto page", category: "content", reward_usdc: 55, status: "completed", builder: "devsam", created_at: "2026-03-10T12:00:00Z", completed_at: "2026-03-14T18:00:00Z" },
  { id: "b005", title: "NEXUS reputation protocol — smart contract", category: "building", reward_usdc: 150, status: "completed", builder: "cyril.eth", created_at: "2026-03-12T09:00:00Z", completed_at: "2026-03-24T17:00:00Z" },
  { id: "b006", title: "NEXUS reputation protocol — API + demo UI", category: "building", reward_usdc: 120, status: "completed", builder: "cyril.eth", created_at: "2026-03-16T09:00:00Z", completed_at: "2026-03-25T17:00:00Z" },
  { id: "b007", title: "Farcaster treasury bot", category: "building", reward_usdc: 90, status: "completed", builder: "0xmara", created_at: "2026-03-18T09:00:00Z", completed_at: "2026-03-27T17:00:00Z" },
  { id: "b008", title: "GitHub Action: sync bounties as Issues", category: "deployment", reward_usdc: 70, status: "completed", builder: "devsam", created_at: "2026-03-20T09:00:00Z", completed_at: "2026-03-23T17:00:00Z" },
  { id: "b009", title: "Bug bash: quadratic funding calc off-by-one", category: "bug-hunting", reward_usdc: 45, status: "completed", builder: "lulu_builds", created_at: "2026-03-23T09:00:00Z", completed_at: "2026-03-30T17:00:00Z" },
  { id: "b010", title: "Substack post: how EAS attestations work", category: "content", reward_usdc: 35, status: "completed", builder: "cyril.eth", created_at: "2026-03-30T09:00:00Z", completed_at: "2026-04-03T17:00:00Z" },
  { id: "b011", title: "Deploy leaderboard page to GitHub Pages", category: "deployment", reward_usdc: 50, status: "completed", builder: "cyril.eth", created_at: "2026-04-02T09:00:00Z", completed_at: "2026-04-09T17:00:00Z" },
  { id: "b012", title: "Staking pool UI mockup", category: "design", reward_usdc: 40, status: "completed", builder: "lulu_builds", created_at: "2026-04-06T09:00:00Z", completed_at: "2026-04-11T17:00:00Z" },
  { id: "b013", title: "A2A protocol spec review", category: "building", reward_usdc: 65, status: "completed", builder: "0xmara", created_at: "2026-04-13T09:00:00Z", completed_at: "2026-04-18T17:00:00Z" },
  { id: "b014", title: "Onchain reputation dashboard bugfix", category: "bug-hunting", reward_usdc: 55, status: "completed", builder: "devsam", created_at: "2026-04-20T09:00:00Z", completed_at: "2026-04-30T17:00:00Z" },
  { id: "b015", title: "MCP integration guide", category: "content", reward_usdc: 30, status: "completed", builder: "lulu_builds", created_at: "2026-04-27T09:00:00Z", completed_at: "2026-05-01T17:00:00Z" },
  { id: "b016", title: "Base network USDC payout script", category: "building", reward_usdc: 100, status: "completed", builder: "cyril.eth", created_at: "2026-05-04T09:00:00Z", completed_at: "2026-05-10T17:00:00Z" },
  { id: "b017", title: "Field Ledger leaderboard live API wiring", category: "deployment", reward_usdc: 60, status: "in_progress", builder: "cyril.eth", created_at: "2026-06-25T09:00:00Z", completed_at: null },
  { id: "b018", title: "Bounty board redesign proposal", category: "design", reward_usdc: 45, status: "in_progress", builder: "0xmara", created_at: "2026-06-20T09:00:00Z", completed_at: null },
  { id: "b019", title: "Weekly bounty digest thread", category: "content", reward_usdc: 25, status: "open", builder: null, created_at: "2026-06-28T09:00:00Z", completed_at: null },
  { id: "b020", title: "Commitment pool slashing edge-case audit", category: "bug-hunting", reward_usdc: 50, status: "open", builder: null, created_at: "2026-06-29T09:00:00Z", completed_at: null },
  { id: "b021", title: "Broiler-study-style data viz template", category: "content", reward_usdc: 35, status: "completed", builder: "lulu_builds", created_at: "2026-05-11T09:00:00Z", completed_at: "2026-05-14T17:00:00Z" },
  { id: "b022", title: "Quadratic funding round dashboard", category: "building", reward_usdc: 110, status: "completed", builder: "devsam", created_at: "2026-05-18T09:00:00Z", completed_at: "2026-05-28T17:00:00Z" },
  { id: "b023", title: "Deploy staking UI to testnet", category: "deployment", reward_usdc: 55, status: "completed", builder: "0xmara", created_at: "2026-05-25T09:00:00Z", completed_at: "2026-05-30T17:00:00Z" },
  { id: "b024", title: "Bounty board mobile responsiveness fix", category: "bug-hunting", reward_usdc: 40, status: "completed", builder: "cyril.eth", created_at: "2026-06-01T09:00:00Z", completed_at: "2026-06-05T17:00:00Z" },
  { id: "b025", title: "Builder spotlight thread series", category: "content", reward_usdc: 30, status: "completed", builder: "cyril.eth", created_at: "2026-06-08T09:00:00Z", completed_at: "2026-06-10T17:00:00Z" },
  { id: "b026", title: "Reputation score API v2", category: "building", reward_usdc: 130, status: "completed", builder: "cyril.eth", created_at: "2026-06-12T09:00:00Z", completed_at: "2026-06-22T17:00:00Z" },
  { id: "b027", title: "Attestation explorer page", category: "design", reward_usdc: 50, status: "completed", builder: "devsam", created_at: "2026-06-15T09:00:00Z", completed_at: "2026-06-19T17:00:00Z" },
];

const LIVE_API_URL = "https://bounty.owockibot.xyz/bounties";

// Maps a raw record from the live owockibot API into the shape every
// compute function below expects.
function mapOwockiBounty(b) {
  const rewardUsdc = b.rewardFormatted
    ? parseFloat(b.rewardFormatted)
    : Number(b.reward || 0) / 1e6; // API returns reward in micro-USDC (6 decimals)

  return {
    id: String(b.id ?? b.uuid ?? crypto.randomUUID()),
    title: b.title || "untitled bounty",
    category: (Array.isArray(b.tags) && b.tags[0]) || "uncategorized",
    reward_usdc: rewardUsdc,
    status: b.status || "unknown", // completed / submitted / claimed / payment_pending / cancelled / open
    builder: b.claimedBy || null,
    created_at: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    completed_at: b.completedAt ? new Date(b.completedAt).toISOString() : null,
  };
}

async function loadBounties(env) {
  // 1. Try the live owockibot bounty board first.
  try {
    const res = await fetch(LIVE_API_URL, { headers: { accept: "application/json" } });
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.bounties || json.data || [];
      if (list.length) {
        return { bounties: list.map(mapOwockiBounty), source: "live:bounty.owockibot.xyz" };
      }
    }
  } catch (err) {
    // network hiccup — fall through to KV / seed below
  }

  // 2. Optional KV override, if you've set one up (see README).
  if (env && env.BOUNTIES_KV) {
    const stored = await env.BOUNTIES_KV.get("bounties", "json");
    if (stored) return { bounties: stored, source: "kv" };
  }

  // 3. Last resort: bundled seed data, so the API never hard-fails.
  return { bounties: SEED_DATA, source: "seed-fallback" };
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function isoWeekKey(dateStr) {
  const d = new Date(dateStr);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (target.getUTCDay() + 6) % 7; // Mon=0
  target.setUTCDate(target.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((target - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${target.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function daysBetween(a, b) {
  return (new Date(b) - new Date(a)) / 86400000;
}

function round(n, dp = 2) {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=60",
    },
  });
}

// ---------------------------------------------------------------------------
// ANALYTICS COMPUTATIONS
// ---------------------------------------------------------------------------

function computeCompletionRates(bounties, weeksBack = 12) {
  const byWeek = {};
  for (const b of bounties) {
    const wk = isoWeekKey(b.created_at);
    if (!byWeek[wk]) byWeek[wk] = { week: wk, total: 0, completed: 0 };
    byWeek[wk].total += 1;
    if (b.status === "completed") byWeek[wk].completed += 1;
  }
  const weeks = Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week));
  const sliced = weeks.slice(-weeksBack);
  return sliced.map((w) => ({
    week: w.week,
    total_bounties: w.total,
    completed: w.completed,
    completion_rate_pct: round((w.completed / w.total) * 100),
  }));
}

function computeTimeToComplete(bounties) {
  const completed = bounties.filter((b) => b.status === "completed" && b.completed_at);
  const overallDays = completed.map((b) => daysBetween(b.created_at, b.completed_at));
  const overallAvg = overallDays.length ? overallDays.reduce((a, c) => a + c, 0) / overallDays.length : 0;

  const byCategory = {};
  for (const b of completed) {
    const d = daysBetween(b.created_at, b.completed_at);
    if (!byCategory[b.category]) byCategory[b.category] = [];
    byCategory[b.category].push(d);
  }
  const categoryBreakdown = Object.entries(byCategory).map(([category, days]) => ({
    category,
    avg_days_to_complete: round(days.reduce((a, c) => a + c, 0) / days.length),
    sample_size: days.length,
  }));

  return {
    overall_avg_days: round(overallAvg),
    sample_size: completed.length,
    by_category: categoryBreakdown.sort((a, b) => a.avg_days_to_complete - b.avg_days_to_complete),
  };
}

function computeLeaderboard(bounties, limit = 10) {
  const byBuilder = {};
  for (const b of bounties) {
    if (b.status !== "completed" || !b.builder) continue;
    if (!byBuilder[b.builder]) byBuilder[b.builder] = { builder: b.builder, total_earned_usdc: 0, bounties_completed: 0, categories: new Set() };
    byBuilder[b.builder].total_earned_usdc += b.reward_usdc;
    byBuilder[b.builder].bounties_completed += 1;
    byBuilder[b.builder].categories.add(b.category);
  }
  const ranked = Object.values(byBuilder)
    .map((r) => ({
      builder: r.builder,
      total_earned_usdc: round(r.total_earned_usdc),
      bounties_completed: r.bounties_completed,
      avg_reward_usdc: round(r.total_earned_usdc / r.bounties_completed),
      categories: [...r.categories],
    }))
    .sort((a, b) => b.total_earned_usdc - a.total_earned_usdc)
    .slice(0, limit)
    .map((r, i) => ({ rank: i + 1, ...r }));
  return ranked;
}

function computeRewardsByCategory(bounties) {
  const byCategory = {};
  let totalPaid = 0;
  for (const b of bounties) {
    if (b.status !== "completed") continue;
    if (!byCategory[b.category]) byCategory[b.category] = { category: b.category, total_usdc: 0, count: 0 };
    byCategory[b.category].total_usdc += b.reward_usdc;
    byCategory[b.category].count += 1;
    totalPaid += b.reward_usdc;
  }
  return Object.values(byCategory)
    .map((c) => ({
      category: c.category,
      total_usdc: round(c.total_usdc),
      bounties_completed: c.count,
      avg_reward_usdc: round(c.total_usdc / c.count),
      pct_of_total_rewards: round((c.total_usdc / totalPaid) * 100),
    }))
    .sort((a, b) => b.total_usdc - a.total_usdc);
}

function computeTrends(bounties, weeksBack = 12) {
  const byWeek = {};
  for (const b of bounties) {
    if (b.status !== "completed" || !b.completed_at) continue;
    const wk = isoWeekKey(b.completed_at);
    if (!byWeek[wk]) byWeek[wk] = { week: wk, bounties_completed: 0, rewards_paid_usdc: 0 };
    byWeek[wk].bounties_completed += 1;
    byWeek[wk].rewards_paid_usdc += b.reward_usdc;
  }
  const weeks = Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week));
  const sliced = weeks.slice(-weeksBack);
  return sliced.map((w) => ({
    week: w.week,
    bounties_completed: w.bounties_completed,
    rewards_paid_usdc: round(w.rewards_paid_usdc),
    avg_reward_usdc: round(w.rewards_paid_usdc / w.bounties_completed),
  }));
}

// ---------------------------------------------------------------------------
// ROUTES
// ---------------------------------------------------------------------------

const ROUTES = {
  "/": () => ({
    name: "owockibot bounty board analytics API",
    endpoints: [
      "GET /api/completion-rates?weeks=12",
      "GET /api/time-to-complete",
      "GET /api/leaderboard?limit=10",
      "GET /api/rewards-by-category",
      "GET /api/trends?weeks=12",
      "GET /api/overview  (all of the above combined, one call)",
    ],
    docs: "See README.md in the repo for full response shapes.",
  }),
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, OPTIONS",
        },
      });
    }

    if (path === "/" || path === "/api") {
      return jsonResponse(ROUTES["/"]());
    }

    const { bounties, source } = await loadBounties(env);
    const weeks = Number(url.searchParams.get("weeks")) || 12;
    const limit = Number(url.searchParams.get("limit")) || 10;

    switch (path) {
      case "/api/completion-rates":
        return jsonResponse({ data: computeCompletionRates(bounties, weeks), source });

      case "/api/time-to-complete":
        return jsonResponse({ data: computeTimeToComplete(bounties), source });

      case "/api/leaderboard":
        return jsonResponse({ data: computeLeaderboard(bounties, limit), source });

      case "/api/rewards-by-category":
        return jsonResponse({ data: computeRewardsByCategory(bounties), source });

      case "/api/trends":
        return jsonResponse({ data: computeTrends(bounties, weeks), source });

      case "/api/overview":
        return jsonResponse({
          generated_at: new Date().toISOString(),
          source,
          completion_rates: computeCompletionRates(bounties, weeks),
          time_to_complete: computeTimeToComplete(bounties),
          leaderboard: computeLeaderboard(bounties, limit),
          rewards_by_category: computeRewardsByCategory(bounties),
          trends: computeTrends(bounties, weeks),
        });

      default:
        return jsonResponse({ error: "not found", available: ROUTES["/"]().endpoints }, 404);
    }
  },
};
