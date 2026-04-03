/* ═══════════════════════════════════════════════════════
   LIVE BASEBALL CARDS — PACK BREAK
   script.js

   Architecture sections:
   1. CONFIG
   2. PLAYER DATA  (normalization & curated pool)
   3. RARITY SYSTEM
   4. PACK COMPOSITION
   5. CARD GENERATION
   6. CARD RENDERING
   7. COLLECTION (localStorage)
   8. REVEAL FLOW
   9. COLLECTION UI
  10. UI HELPERS
  11. INITIALIZATION
   ═══════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════════════════════
   1. CONFIG
   ═══════════════════════════════════════════════════════ */
const CONFIG = {
  PACK_SIZE: 5,

  // Guaranteed slots per pack (must sum to PACK_SIZE)
  PACK_SLOTS: [
    { rarity: 'common',    count: 3 },
    { rarity: 'rare',      count: 1 },
    { rarity: 'epic_plus', count: 1 }, // Epic or better
  ],

  // Within the epic_plus slot: probability of Legendary
  LEGENDARY_RATE: 0.12, // 12% chance of legendary instead of epic

  // Card reveal delay (ms)
  REVEAL_DELAY: 350,

  // localStorage key
  COLLECTION_KEY: 'lbc_collection_v1',

  // MLB Stats API (public, no auth required)
  MLB_STATS_API: 'https://statsapi.mlb.com/api/v1',
};


/* ═══════════════════════════════════════════════════════
   2. PLAYER DATA
   Curated pool of active / well-known MLB players.
   Each entry carries a `tier` (1–4) used for rarity weighting:
     4 = elite superstar  → skews Legendary/Epic
     3 = star             → skews Epic/Rare
     2 = solid regular    → skews Rare/Common
     1 = roster player    → skews Common
   Stats are fetched live from MLB Stats API and merged in.
   If fetching fails, fallback stats are used.
   ═══════════════════════════════════════════════════════ */

// Normalized player shape used throughout the app:
// { id, name, teamName, teamAbbr, position, image, tier, stats: { stat1, stat2, stat3 }, statLabels }

const PLAYER_POOL_SEED = [
  // tier 4 — elite
  { id: 660670, name: 'Shohei Ohtani',    teamName: 'Los Angeles Dodgers',    teamAbbr: 'LAD', position: 'DH/P',  tier: 4 },
  { id: 592450, name: 'Mike Trout',        teamName: 'Los Angeles Angels',     teamAbbr: 'LAA', position: 'CF',    tier: 4 },
  { id: 605141, name: 'Mookie Betts',      teamName: 'Los Angeles Dodgers',    teamAbbr: 'LAD', position: 'SS/OF', tier: 4 },
  { id: 596019, name: 'Freddie Freeman',   teamName: 'Los Angeles Dodgers',    teamAbbr: 'LAD', position: '1B',    tier: 4 },
  { id: 641355, name: 'Juan Soto',         teamName: 'New York Mets',          teamAbbr: 'NYM', position: 'RF',    tier: 4 },
  { id: 665742, name: 'Ronald Acuña Jr.', teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: 'RF',    tier: 4 },
  { id: 682998, name: 'Elly De La Cruz',   teamName: 'Cincinnati Reds',        teamAbbr: 'CIN', position: 'SS',    tier: 4 },

  // tier 3 — stars
  { id: 671096, name: 'Bobby Witt Jr.',    teamName: 'Kansas City Royals',     teamAbbr: 'KC',  position: 'SS',    tier: 3 },
  { id: 673357, name: 'Gunnar Henderson', teamName: 'Baltimore Orioles',      teamAbbr: 'BAL', position: 'SS',    tier: 3 },
  { id: 669257, name: 'Julio Rodríguez', teamName: 'Seattle Mariners',       teamAbbr: 'SEA', position: 'CF',    tier: 3 },
  { id: 694497, name: 'Jackson Chourio',   teamName: 'Milwaukee Brewers',      teamAbbr: 'MIL', position: 'LF',    tier: 3 },
  { id: 691718, name: 'Corbin Carroll',    teamName: 'Arizona Diamondbacks',   teamAbbr: 'ARI', position: 'CF',    tier: 3 },
  { id: 607043, name: 'Bryce Harper',      teamName: 'Philadelphia Phillies',  teamAbbr: 'PHI', position: '1B',    tier: 3 },
  { id: 593934, name: 'Paul Goldschmidt',  teamName: 'St. Louis Cardinals',    teamAbbr: 'STL', position: '1B',    tier: 3 },
  { id: 543760, name: 'José Ramírez',     teamName: 'Cleveland Guardians',    teamAbbr: 'CLE', position: '3B',    tier: 3 },
  { id: 624413, name: 'Rafael Devers',     teamName: 'Boston Red Sox',         teamAbbr: 'BOS', position: '3B',    tier: 3 },
  { id: 592518, name: 'Yordan Alvarez',    teamName: 'Houston Astros',         teamAbbr: 'HOU', position: 'DH',    tier: 3 },
  { id: 650402, name: 'Pete Alonso',       teamName: 'New York Mets',          teamAbbr: 'NYM', position: '1B',    tier: 3 },
  { id: 621439, name: 'Trea Turner',       teamName: 'Philadelphia Phillies',  teamAbbr: 'PHI', position: 'SS',    tier: 3 },

  // tier 2 — solid regulars
  { id: 641703, name: 'Vladimir Guerrero Jr.', teamName: 'Toronto Blue Jays',  teamAbbr: 'TOR', position: '1B',    tier: 2 },
  { id: 668804, name: 'Jeremy Peña',       teamName: 'Houston Astros',         teamAbbr: 'HOU', position: 'SS',    tier: 2 },
  { id: 660271, name: 'Anthony Volpe',     teamName: 'New York Yankees',       teamAbbr: 'NYY', position: 'SS',    tier: 2 },
  { id: 677951, name: 'Yandy Díaz',       teamName: 'Tampa Bay Rays',         teamAbbr: 'TB',  position: '3B',    tier: 2 },
  { id: 592696, name: 'Nolan Arenado',     teamName: 'St. Louis Cardinals',    teamAbbr: 'STL', position: '3B',    tier: 2 },
  { id: 643217, name: 'Kyle Tucker',       teamName: 'Chicago Cubs',           teamAbbr: 'CHC', position: 'RF',    tier: 2 },
  { id: 663993, name: 'Austin Riley',      teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: '3B',    tier: 2 },
  { id: 670042, name: 'Spencer Strider',   teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: 'SP',    tier: 2 },
  { id: 605483, name: 'Max Scherzer',      teamName: 'Texas Rangers',          teamAbbr: 'TEX', position: 'SP',    tier: 2 },
  { id: 669923, name: 'Logan Gilbert',     teamName: 'Seattle Mariners',       teamAbbr: 'SEA', position: 'SP',    tier: 2 },

  // tier 1 — roster players / prospects
  { id: 687786, name: 'Jackson Merrill',   teamName: 'San Diego Padres',       teamAbbr: 'SD',  position: 'CF',    tier: 1 },
  { id: 676897, name: 'Michael Harris II', teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: 'CF',    tier: 1 },
  { id: 686668, name: 'Jarren Duran',      teamName: 'Boston Red Sox',         teamAbbr: 'BOS', position: 'CF',    tier: 1 },
  { id: 669061, name: 'Geraldo Perdomo',   teamName: 'Arizona Diamondbacks',   teamAbbr: 'ARI', position: 'SS',    tier: 1 },
  { id: 672515, name: 'Nolan Jones',       teamName: 'Colorado Rockies',       teamAbbr: 'COL', position: 'RF',    tier: 1 },
  { id: 687688, name: 'James Wood',        teamName: 'Washington Nationals',   teamAbbr: 'WSH', position: 'LF',    tier: 1 },
  { id: 697478, name: 'Jackson Holliday',  teamName: 'Baltimore Orioles',      teamAbbr: 'BAL', position: 'SS',    tier: 1 },
  { id: 686679, name: 'Paul Skenes',       teamName: 'Pittsburgh Pirates',     teamAbbr: 'PIT', position: 'SP',    tier: 1 },
];

// Merged player data cache (after API enrichment)
let enrichedPlayers = [];
let dataReady = false;

// Fallback stats by position (used when API is unavailable)
const FALLBACK_STATS = {
  'SP':   { stat1: 12, stat2: 3.45, stat3: 188, labels: ['W', 'ERA', 'K'] },
  'RP':   { stat1: 3,  stat2: 2.85, stat3: 65,  labels: ['W', 'ERA', 'K'] },
  'C':    { stat1: .265, stat2: 18, stat3: 64,   labels: ['AVG', 'HR', 'RBI'] },
  '1B':   { stat1: .278, stat2: 28, stat3: 88,   labels: ['AVG', 'HR', 'RBI'] },
  '2B':   { stat1: .268, stat2: 16, stat3: 62,   labels: ['AVG', 'HR', 'RBI'] },
  '3B':   { stat1: .272, stat2: 22, stat3: 80,   labels: ['AVG', 'HR', 'RBI'] },
  'SS':   { stat1: .265, stat2: 18, stat3: 66,   labels: ['AVG', 'HR', 'RBI'] },
  'LF':   { stat1: .270, stat2: 20, stat3: 74,   labels: ['AVG', 'HR', 'RBI'] },
  'CF':   { stat1: .268, stat2: 19, stat3: 68,   labels: ['AVG', 'HR', 'RBI'] },
  'RF':   { stat1: .275, stat2: 25, stat3: 82,   labels: ['AVG', 'HR', 'RBI'] },
  'DH':   { stat1: .280, stat2: 32, stat3: 98,   labels: ['AVG', 'HR', 'RBI'] },
  'DH/P': { stat1: .310, stat2: 44, stat3: 101,  labels: ['AVG', 'HR', 'RBI'] },
  'SS/OF':{ stat1: .293, stat2: 35, stat3: 95,   labels: ['AVG', 'HR', 'RBI'] },
};

function getFallbackStats(player) {
  const pos = player.position;
  const base = FALLBACK_STATS[pos] || FALLBACK_STATS['CF'];
  const jitter = (n, pct) => {
    const delta = n * pct * (Math.random() * 2 - 1);
    if (typeof n === 'number' && n < 1) return parseFloat((n + delta).toFixed(3));
    return Math.round(n + delta);
  };
  // Tier bonus: higher tier = better-ish stats
  const mult = 0.85 + (player.tier - 1) * 0.08;
  return {
    stat1:  typeof base.stat1 === 'number' && base.stat1 < 1
              ? parseFloat((base.stat1 * (0.95 + player.tier * 0.01) + (Math.random() - 0.5) * 0.02).toFixed(3))
              : Math.round(base.stat1 * mult + (Math.random() - 0.5) * 4),
    stat2:  typeof base.stat2 === 'number' && base.stat2 < 1
              ? parseFloat((base.stat2 * mult).toFixed(3))
              : Math.round(base.stat2 * mult + (Math.random() - 0.5) * 3),
    stat3:  Math.round(base.stat3 * mult + (Math.random() - 0.5) * 8),
    labels: base.labels,
  };
}

// Normalize a raw MLB Stats API hitting record
function normalizeHitterStats(hitting) {
  const avg = hitting.avg ?? '--';
  const hr  = hitting.homeRuns ?? 0;
  const rbi = hitting.rbi ?? 0;
  return { stat1: avg, stat2: hr, stat3: rbi, labels: ['AVG', 'HR', 'RBI'] };
}

// Normalize a raw MLB Stats API pitching record
function normalizePitcherStats(pitching) {
  const w   = pitching.wins ?? 0;
  const era = pitching.era ?? '--';
  const so  = pitching.strikeOuts ?? 0;
  return { stat1: w, stat2: era, stat3: so, labels: ['W', 'ERA', 'K'] };
}

const PITCHER_POSITIONS = new Set(['SP', 'RP', 'CP']);

async function fetchPlayerStats(playerId) {
  try {
    const res = await fetch(
      `${CONFIG.MLB_STATS_API}/people/${playerId}?hydrate=stats(group=[hitting,pitching],type=yearByYear,season=2024)`,
      { signal: AbortSignal.timeout(6000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const person = json.people?.[0];
    if (!person) return null;

    const statsGroups = person.stats ?? [];
    const hitting  = statsGroups.find(g => g.group?.displayName === 'hitting');
    const pitching = statsGroups.find(g => g.group?.displayName === 'pitching');

    // Grab most recent season's stats
    const hSplits = hitting?.splits ?? [];
    const pSplits = pitching?.splits ?? [];
    const lastH = hSplits.filter(s => s.season === '2024').pop()?.stat;
    const lastP = pSplits.filter(s => s.season === '2024').pop()?.stat;

    return { hitting: lastH ?? null, pitching: lastP ?? null };
  } catch {
    return null;
  }
}

// Build headshot URL from MLB CDN
function buildHeadshotUrl(playerId) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

async function loadPlayerData() {
  showLoading(true);

  // Attempt to fetch stats for up to N players concurrently
  // We limit to 20 to keep load reasonable
  const playerSubset = [...PLAYER_POOL_SEED]; // use full pool
  const results = await Promise.allSettled(
    playerSubset.map(p => fetchPlayerStats(p.id))
  );

  enrichedPlayers = playerSubset.map((p, i) => {
    const apiData = results[i].status === 'fulfilled' ? results[i].value : null;
    let stats;

    if (apiData) {
      const isPitcher = PITCHER_POSITIONS.has(p.position);
      if (isPitcher && apiData.pitching) {
        stats = normalizePitcherStats(apiData.pitching);
      } else if (!isPitcher && apiData.hitting) {
        stats = normalizeHitterStats(apiData.hitting);
      } else {
        stats = getFallbackStats(p);
      }
    } else {
      stats = getFallbackStats(p);
    }

    return {
      id:        p.id,
      name:      p.name,
      teamName:  p.teamName,
      teamAbbr:  p.teamAbbr,
      position:  p.position,
      image:     buildHeadshotUrl(p.id),
      tier:      p.tier,
      stats,
    };
  });

  dataReady = true;
  showLoading(false);
}


/* ═══════════════════════════════════════════════════════
   3. RARITY SYSTEM
   Rarity is determined by two factors:
   - The slot assigned during pack composition (guarantees
     rough tier distribution per pack)
   - Player tier (higher tier players are more likely to
     appear in higher rarity slots and less likely to get
     downgraded)

   Tier → Rarity weight tables:
   Each slot type has a weighted pool. A player's tier
   biases which rarity their card can become within that slot.
   ═══════════════════════════════════════════════════════ */

const RARITY_WEIGHTS = {
  // Common slot: mostly common, tiny rare chance for tier 3+
  common: {
    1: { common: 100 },
    2: { common: 95, rare: 5 },
    3: { common: 80, rare: 20 },
    4: { common: 60, rare: 40 },
  },
  // Rare slot: mostly rare, epic possible for high tiers
  rare: {
    1: { common: 20, rare: 80 },
    2: { common: 5,  rare: 90, epic: 5 },
    3: { rare: 70, epic: 30 },
    4: { rare: 40, epic: 55, legendary: 5 },
  },
  // Epic+ slot (the slot that is epic or better)
  epic_plus: {
    1: { rare: 40, epic: 60 },
    2: { epic: 80, legendary: 20 },
    3: { epic: 55, legendary: 45 },
    4: { epic: 20, legendary: 80 },
  },
};

function pickWeighted(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of Object.entries(weights)) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return Object.keys(weights).at(-1);
}

function assignRarity(player, slotType) {
  const tier  = player.tier;
  const table = { ...(RARITY_WEIGHTS[slotType]?.[tier] ?? { common: 100 }) };

  // Early-session bias: subtly boost rare/epic weight for first 3 packs
  const bias = SESSION.earlyBias();
  if (bias > 0) {
    const totalWeight = Object.values(table).reduce((a, b) => a + b, 0);
    const boost = totalWeight * bias;
    // Shift weight from common → rare (or rare → epic for rare slots)
    if (slotType === 'common' && table.common > 0) {
      const shift = Math.min(table.common, boost);
      table.common -= shift;
      table.rare = (table.rare ?? 0) + shift;
    } else if (slotType === 'rare' && table.rare > 0) {
      const shift = Math.min(table.rare, boost * 0.5);
      table.rare -= shift;
      table.epic = (table.epic ?? 0) + shift;
    }
  }

  return pickWeighted(table);
}


/* ═══════════════════════════════════════════════════════
   4. PACK COMPOSITION
   Builds an array of { player, rarity, slotType } tuples.
   Guarantees the slot structure defined in CONFIG.PACK_SLOTS.
   ═══════════════════════════════════════════════════════ */

function getPlayersByTier(tier) {
  return enrichedPlayers.filter(p => p.tier === tier);
}

function pickRandomPlayer(pool, exclude = []) {
  const available = pool.filter(p => !exclude.includes(p.id));
  if (!available.length) {
    // Fallback: allow duplicates from full pool
    return enrichedPlayers[Math.floor(Math.random() * enrichedPlayers.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

// For a given slot type, bias player selection toward appropriate tiers
function pickPlayerForSlot(slotType, usedIds) {
  const tierWeights = {
    common:   { 1: 45, 2: 35, 3: 15, 4: 5  },
    rare:     { 1: 10, 2: 30, 3: 40, 4: 20 },
    epic_plus:{ 1: 2,  2: 15, 3: 40, 4: 43 },
  };
  const weights = tierWeights[slotType] ?? tierWeights.common;
  const tier    = parseInt(pickWeighted(weights), 10);
  const pool    = getPlayersByTier(tier);
  return pickRandomPlayer(pool.length ? pool : enrichedPlayers, usedIds);
}

function buildPack() {
  const slots  = CONFIG.PACK_SLOTS;
  const cards  = [];
  const usedIds = [];

  for (const slot of slots) {
    for (let i = 0; i < slot.count; i++) {
      const player = pickPlayerForSlot(slot.rarity, usedIds);
      usedIds.push(player.id);
      const rarity = assignRarity(player, slot.rarity);
      cards.push({ player, rarity, slotType: slot.rarity });
    }
  }

  // Shuffle so cards don't always appear in rarity order
  return shuffleArray(cards);
}


/* ═══════════════════════════════════════════════════════
   5. CARD GENERATION
   Converts a { player, rarity } tuple into a Card object
   that is stored, displayed, and persisted.
   ═══════════════════════════════════════════════════════ */

// Derive a short flavour descriptor from a player's stats and position
function deriveDescriptor(player) {
  const isPitcher = PITCHER_POSITIONS.has(player.position);
  const s = player.stats;

  if (isPitcher) {
    const era = parseFloat(s.stat2);
    const k   = parseInt(s.stat3, 10);
    if (!isNaN(era) && !isNaN(k)) {
      if (era <= 2.50 && k >= 180) return 'Ace · Strikeout Machine';
      if (era <= 2.50)             return 'Elite Ace';
      if (era <= 3.25 && k >= 150) return 'Power Pitcher';
      if (era <= 3.25)             return 'Solid Starter';
      if (k >= 150)                return 'High-K Arm';
      return 'Rotation Piece';
    }
  } else {
    const avg = parseFloat(s.stat1);
    const hr  = parseInt(s.stat2, 10);
    if (!isNaN(avg) && !isNaN(hr)) {
      if (avg >= .300 && hr >= 35) return 'Five-Tool Threat';
      if (avg >= .300 && hr >= 20) return 'Contact & Power';
      if (avg >= .300)             return 'Pure Hitter';
      if (hr >= 40)                return 'Power Masher';
      if (hr >= 25)                return 'Run Producer';
      if (avg >= .270)             return 'Reliable Bat';
      return 'Everyday Player';
    }
  }
  return '';
}

function generateCard({ player, rarity }) {
  return {
    id:         `${player.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    playerId:   player.id,
    playerName: player.name,
    teamName:   player.teamName,
    teamAbbr:   player.teamAbbr,
    position:   player.position,
    image:      player.image,
    stats: {
      stat1:  player.stats.stat1,
      stat2:  player.stats.stat2,
      stat3:  player.stats.stat3,
    },
    statLabels: player.stats.labels,
    descriptor: deriveDescriptor(player),
    rarity,
    pulledAt: new Date().toISOString(),
  };
}


/* ═══════════════════════════════════════════════════════
   6. CARD RENDERING
   Pure functions that build DOM nodes for a card.
   Two sizes: full (reveal) and mini (collection/summary).
   ═══════════════════════════════════════════════════════ */

function renderCard(card, { mini = false, revealing = false } = {}) {
  const el     = document.createElement('div');
  el.className = `card${mini ? ' card--mini' : ''}${revealing ? ' card--revealing' : ''}`;
  el.dataset.rarity = card.rarity;
  el.dataset.cardId  = card.id;

  const initials = card.playerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  el.innerHTML = `
    <div class="card__shimmer"></div>
    <div class="card__header">
      <span class="card__team-tag">${esc(card.teamAbbr)} · ${esc(card.position)}</span>
      <span class="card__rarity-badge">${rarityLabel(card.rarity)}</span>
    </div>
    <div class="card__image-area">
      <img
        class="card__player-img"
        src="${esc(card.image)}"
        alt="${esc(card.playerName)}"
        loading="lazy"
        onerror="this.parentNode.innerHTML='<div class=\\'card__player-initials\\'>${initials}</div>'"
      />
    </div>
    <div class="card__body">
      <div class="card__player-name">${esc(card.playerName)}</div>
      <div class="card__position">${esc(card.position)}</div>
      ${card.descriptor ? `<div class="card__descriptor">${esc(card.descriptor)}</div>` : ''}
      <div class="card__stats">
        ${renderStat(card.stats.stat1, card.statLabels[0])}
        ${renderStat(card.stats.stat2, card.statLabels[1])}
        ${renderStat(card.stats.stat3, card.statLabels[2])}
      </div>
    </div>
    <div class="card__footer">
      <span class="card__series-tag">2025 Series</span>
      <span class="card__id">#${card.id.slice(-6).toUpperCase()}</span>
    </div>
  `;

  return el;
}

function renderStat(value, label) {
  return `
    <div class="card__stat">
      <div class="card__stat-value">${value ?? '—'}</div>
      <div class="card__stat-label">${esc(label ?? '')}</div>
    </div>
  `;
}

function rarityLabel(rarity) {
  const labels = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: '★ Legend' };
  return labels[rarity] ?? rarity;
}


/* ═══════════════════════════════════════════════════════
   7. COLLECTION (localStorage)
   ═══════════════════════════════════════════════════════ */

function loadCollection() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.COLLECTION_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveCollection(cards) {
  try {
    localStorage.setItem(CONFIG.COLLECTION_KEY, JSON.stringify(cards));
  } catch {
    showToast('Storage full — oldest cards may not be saved.');
  }
}

function addCardsToCollection(newCards) {
  const existing = loadCollection();
  // Determine which rarities already exist before this pack
  const seenRarities = new Set(existing.map(c => c.rarity));
  // Tag any card whose rarity has never been pulled before
  const tagged = newCards.map(c => {
    const isNew = !seenRarities.has(c.rarity);
    if (isNew) seenRarities.add(c.rarity); // only first card of that rarity gets the tag
    return isNew ? { ...c, firstOfRarity: true } : c;
  });
  const updated = [...existing, ...tagged];
  saveCollection(updated);
  updateHeroCollectionCount(updated.length);
  return updated;
}

function clearCollection() {
  localStorage.removeItem(CONFIG.COLLECTION_KEY);
  updateHeroCollectionCount(0);
}


/* ═══════════════════════════════════════════════════════
   8. REVEAL FLOW
   State machine:
   hero → [loading] → sealed-pack → reveal (1…5) → summary
   ═══════════════════════════════════════════════════════ */

const state = {
  phase:        'hero',   // 'hero' | 'sealed' | 'reveal' | 'summary' | 'collection'
  currentPack:  [],       // array of Card objects
  revealIndex:  0,
};

// Session tracking — resets on page reload (in-memory only)
const SESSION = {
  RARITY_RANK: { common: 0, rare: 1, epic: 2, legendary: 3 },
  bestRarity:  null,
  packCount:   0,       // number of packs opened this session
  lastBestCard: null,   // best card from previous pack (for continuity ghost)

  update(rarity) {
    const rank = this.RARITY_RANK[rarity] ?? -1;
    if (this.bestRarity === null || rank > this.RARITY_RANK[this.bestRarity]) {
      this.bestRarity = rarity;
    }
  },

  openPack() {
    this.packCount += 1;
  },

  // Early-session bias multiplier: packs 1–3 get a subtle boost to rare/epic weights
  // Returns a value 0–1 that scales from 0.28 → 0 by pack 4+
  earlyBias() {
    if (this.packCount >= 4) return 0;
    return (4 - this.packCount) * 0.07; // pack1=0.21, pack2=0.14, pack3=0.07, pack4+=0
  },
};

function transitionTo(phase) {
  state.phase = phase;

  // Hide all sections
  document.getElementById('hero').classList.add('hidden');
  document.getElementById('pack-opening').classList.add('hidden');
  document.getElementById('collection').classList.add('hidden');

  // Hide all phases within pack-opening
  ['phase-sealed', 'phase-reveal', 'phase-summary'].forEach(id => {
    document.getElementById(id).classList.add('hidden');
  });

  if (phase === 'hero') {
    document.getElementById('hero').classList.remove('hidden');
  } else if (phase === 'sealed') {
    document.getElementById('pack-opening').classList.remove('hidden');
    document.getElementById('phase-sealed').classList.remove('hidden');
    document.getElementById('opening-pack').classList.remove('pack-visual--tearing');
  } else if (phase === 'reveal') {
    document.getElementById('pack-opening').classList.remove('hidden');
    document.getElementById('phase-reveal').classList.remove('hidden');
  } else if (phase === 'summary') {
    document.getElementById('pack-opening').classList.remove('hidden');
    document.getElementById('phase-summary').classList.remove('hidden');
  } else if (phase === 'collection') {
    document.getElementById('collection').classList.remove('hidden');
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function startPackOpening() {
  if (!dataReady) {
    // Immediately communicate loading state to the user
    const btn      = document.getElementById('open-pack-btn');
    const btnLabel = btn.querySelector('.btn__text');
    const original = btnLabel.textContent;
    btn.disabled         = true;
    btnLabel.textContent = 'Loading Players…';
    showLoading(true);

    await loadPlayerData();

    showLoading(false);
    btn.disabled         = false;
    btnLabel.textContent = original;
  }

  // Continuity ghost: if there was a previous pack, briefly show its best card fading out
  if (SESSION.lastBestCard) {
    const ghost = document.createElement('div');
    ghost.className = 'pack-opening__ghost';
    ghost.appendChild(renderCard(SESSION.lastBestCard, { mini: true }));
    const openingSection = document.getElementById('pack-opening');
    openingSection.appendChild(ghost);
    setTimeout(() => ghost.remove(), 380);
  }

  // Increment pack streak counter before building
  SESSION.openPack();

  const packSlots = buildPack();
  state.currentPack = packSlots.map(slot => generateCard(slot));
  state.revealIndex = 0;

  transitionTo('sealed');
}

function tearOpenPack() {
  const packEl = document.getElementById('opening-pack');
  packEl.classList.add('pack-visual--tearing');

  // Step 1: pack disappears at ~650ms — switch to reveal phase but keep stage empty
  setTimeout(() => {
    transitionTo('reveal');

    // Step 2: trigger a brief glow on the empty card stage (~300ms pause)
    const stage = document.getElementById('card-stage');
    stage.classList.add('card-stage--glow');
    setTimeout(() => stage.classList.remove('card-stage--glow'), 450);

    // Step 3: show first card after the glow beats
    // Legendary micro-delay: add 120ms extra if first card is legendary
    const firstCard = state.currentPack[0];
    const legendaryExtra = firstCard?.rarity === 'legendary' ? 120 : 0;
    setTimeout(() => showRevealCard(0), 310 + legendaryExtra);
  }, 650);
}

function showRevealCard(index) {
  state.revealIndex = index;
  const card = state.currentPack[index];
  const total = state.currentPack.length;

  // Update counter
  document.getElementById('reveal-counter').textContent = `Card ${index + 1} of ${total}`;

  // Update dots
  document.querySelectorAll('.reveal-dot').forEach((dot, i) => {
    dot.classList.remove('revealed', 'current');
    if (i < index) dot.classList.add('revealed');
    if (i === index) dot.classList.add('current');
  });

  // Pre-reveal rarity tint with escalation flash:
  // For rare/epic/legendary, briefly show a *higher* rarity color (~80ms) then swap to the real one.
  const stage = document.getElementById('card-stage');
  const ESCALATE_MAP = { rare: 'epic', epic: 'legendary', legendary: 'legendary' };
  const tintClass     = card.rarity !== 'common' ? `card-stage--tint-${card.rarity}` : null;
  const escalateClass = card.rarity !== 'common' ? `card-stage--tint-escalate-${ESCALATE_MAP[card.rarity]}` : null;

  if (escalateClass) {
    // Step 1: flash the higher-rarity escalation tint
    stage.classList.add(escalateClass);
    setTimeout(() => {
      // Step 2: swap to the actual rarity tint
      stage.classList.remove(escalateClass);
      stage.classList.add(tintClass);
      setTimeout(() => stage.classList.remove(tintClass), 160);
    }, 80);
  }

  // Render card (slight delay so tint sequence is perceptible)
  const renderDelay = tintClass ? 120 : 0;
  setTimeout(() => {
    stage.innerHTML = '';
    const cardEl = renderCard(card, { revealing: true });
    stage.appendChild(cardEl);

    // Trigger reveal animation on next frame — first card gets a stronger entrance
    requestAnimationFrame(() => {
      cardEl.classList.add(index === 0 ? 'card--revealing-first' : 'card--revealing');
    });

    // Card impact effect — brief shadow burst shortly after landing
    const revealDuration = index === 0 ? 500 : 325; // ~halfway through reveal
    setTimeout(() => {
      cardEl.classList.add('card--impact');
      setTimeout(() => cardEl.classList.remove('card--impact'), 560);
    }, revealDuration);
  }, renderDelay);

  // Update button label
  const label = document.getElementById('next-card-label');
  const btn   = document.getElementById('next-card-btn');
  if (index === total - 1) {
    label.textContent = 'See Full Pack';
    btn.querySelector('.btn__arrow').textContent = '✦';
  } else {
    label.textContent = 'Next Card';
    btn.querySelector('.btn__arrow').textContent = '→';
  }

  // Rarity-based hold — disable Next Card briefly to let the card breathe
  const RARITY_HOLD = { common: 0, rare: 150, epic: 300, legendary: 600 };
  const holdMs = RARITY_HOLD[card.rarity] ?? 0;
  if (holdMs > 0) {
    btn.disabled = true;
    btn.style.opacity = '0.45';
    setTimeout(() => {
      btn.disabled = false;
      btn.style.opacity = '';
    }, holdMs + renderDelay);
  }

  // Update session best
  SESSION.update(card.rarity);

  // Special flash for legendary
  if (card.rarity === 'legendary') {
    triggerLegendaryFlash();
  }
}

function triggerLegendaryFlash() {
  // Brief golden screen flash overlay (existing behaviour)
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: fixed; inset: 0; z-index: 50;
    background: radial-gradient(ellipse at 50% 50%, rgba(245,200,66,0.25), transparent 70%);
    pointer-events: none;
    animation: legendary-flash 1.2s ease-out forwards;
  `;
  document.body.appendChild(flash);

  if (!document.getElementById('legendary-flash-style')) {
    const style = document.createElement('style');
    style.id = 'legendary-flash-style';
    style.textContent = `
      @keyframes legendary-flash {
        0%   { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => flash.remove(), 1300);

  // Gold-tinted background tint on the section (non-blocking, CSS animation)
  const openingSection = document.getElementById('pack-opening');
  openingSection.classList.remove('pack-opening--legendary-bg');
  // Force reflow so re-adding the class always replays animation
  void openingSection.offsetWidth;
  openingSection.classList.add('pack-opening--legendary-bg');
  setTimeout(() => openingSection.classList.remove('pack-opening--legendary-bg'), 1150);

  showToast('✨ Legendary Pull!');
}

function advanceReveal() {
  const nextIndex = state.revealIndex + 1;
  if (nextIndex >= state.currentPack.length) {
    showSummary();
  } else {
    const nextCard = state.currentPack[nextIndex];
    // Legendary micro-delay: add 120ms on top of normal reveal delay
    const extraDelay = nextCard.rarity === 'legendary' ? 120 : 0;
    setTimeout(() => showRevealCard(nextIndex), CONFIG.REVEAL_DELAY + extraDelay);
  }
}

// Compute a simple pack quality score and assign a label
function computePackLabel(cards) {
  const RARITY_SCORE = { common: 0, rare: 1, epic: 3, legendary: 7 };
  const score = cards.reduce((sum, c) => sum + (RARITY_SCORE[c.rarity] ?? 0), 0);
  // Score ranges: 0–2 = Standard, 3–5 = Hot, 6+ = Lucky Break
  if (score >= 6) return { text: '🔥 Lucky Break',   cls: 'summary-pack-label--lucky' };
  if (score >= 3) return { text: '⚡ Hot Pack',       cls: 'summary-pack-label--hot' };
  return           { text: '📦 Standard Pack',        cls: 'summary-pack-label--standard' };
}

function showSummary() {
  // Save cards to collection
  addCardsToCollection(state.currentPack);

  // Compute pack score for label + near-miss
  const RARITY_SCORE = { common: 0, rare: 1, epic: 3, legendary: 7 };
  const score = state.currentPack.reduce((sum, c) => sum + (RARITY_SCORE[c.rarity] ?? 0), 0);

  // Pack label
  const labelEl = document.getElementById('summary-pack-label');
  if (labelEl) {
    const { text, cls } = computePackLabel(state.currentPack);
    labelEl.textContent = text;
    labelEl.className   = `summary-pack-label ${cls}`;
    labelEl.classList.remove('hidden');
  }

  // Near-miss message: within 1 point of the next tier
  const nearMissEl = document.getElementById('summary-near-miss');
  if (nearMissEl) {
    const TIER_THRESHOLDS = [{ threshold: 3, msg: 'Almost a Hot Pack…' }, { threshold: 6, msg: 'Almost a Lucky Break…' }];
    const nearMiss = TIER_THRESHOLDS.find(t => score < t.threshold && score >= t.threshold - 1);
    if (nearMiss) {
      nearMissEl.textContent = nearMiss.msg;
      nearMissEl.classList.remove('hidden');
    } else {
      nearMissEl.classList.add('hidden');
    }
  }

  // Session best display
  const sessionBestEl = document.getElementById('summary-session-best');
  if (sessionBestEl && SESSION.bestRarity) {
    const bestLabel = SESSION.bestRarity.charAt(0).toUpperCase() + SESSION.bestRarity.slice(1);
    const packStr   = SESSION.packCount > 1 ? ` · Pack ${SESSION.packCount}` : '';
    sessionBestEl.innerHTML = `Best pull this session: <strong>${bestLabel}</strong>${packStr}`;
    sessionBestEl.className = `summary-session-best summary-session-best--${SESSION.bestRarity}`;
    sessionBestEl.classList.remove('hidden');
  }

  // Identify highest rarity card for spotlight + store for continuity ghost
  const RARITY_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };
  const bestCard = state.currentPack.reduce((best, c) =>
    (RARITY_RANK[c.rarity] ?? 0) > (RARITY_RANK[best.rarity] ?? 0) ? c : best
  );
  SESSION.lastBestCard = bestCard;

  // Build summary grid with staggered card entry
  const grid = document.getElementById('summary-grid');
  grid.innerHTML = '';
  transitionTo('summary');

  state.currentPack.forEach((card, i) => {
    setTimeout(() => {
      const el = renderCard(card, { mini: true });
      // Best card spotlight — only apply if rarity is rare or better
      if (card.id === bestCard.id && card.rarity !== 'common') {
        el.classList.add('card--best');
      }
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      grid.appendChild(el);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = '1';
          el.style.transform = card.id === bestCard.id && card.rarity !== 'common'
            ? 'translateY(0) scale(1.06)'
            : 'translateY(0)';
        });
      });
    }, i * 50);
  });

  // CTA emphasis: apply pulse animation after 1.2s (once user has absorbed the summary)
  const ctaBtn = document.getElementById('open-another-btn');
  ctaBtn.classList.remove('btn--cta-pulse');
  setTimeout(() => ctaBtn.classList.add('btn--cta-pulse'), 1200);
}


/* ═══════════════════════════════════════════════════════
   9. COLLECTION UI
   ═══════════════════════════════════════════════════════ */

let activeFilter = 'all';

function renderCollection(filter = 'all') {
  activeFilter = filter;
  const cards      = loadCollection();
  const grid       = document.getElementById('collection-grid');
  const emptyEl    = document.getElementById('collection-empty');
  const subtitle   = document.getElementById('collection-subtitle');

  const filtered = filter === 'all' ? cards : cards.filter(c => c.rarity === filter);

  // Update subtitle
  subtitle.textContent = `${cards.length} card${cards.length !== 1 ? 's' : ''} pulled`;

  // Update rarity counts
  const counts = { legendary: 0, epic: 0, rare: 0, common: 0 };
  cards.forEach(c => { if (counts[c.rarity] !== undefined) counts[c.rarity]++; });
  const rarityCountEl = document.getElementById('collection-rarity-counts');
  if (cards.length && rarityCountEl) {
    rarityCountEl.innerHTML = [
      counts.legendary ? `<span class="rc-legendary">★ ${counts.legendary} Legendary</span>` : '',
      counts.epic      ? `<span class="rc-epic">${counts.epic} Epic</span>` : '',
      counts.rare      ? `<span class="rc-rare">${counts.rare} Rare</span>` : '',
      counts.common    ? `<span class="rc-common">${counts.common} Common</span>` : '',
    ].filter(Boolean).join('');
  } else if (rarityCountEl) {
    rarityCountEl.innerHTML = '';
  }

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.rarity === filter);
  });

  grid.innerHTML = '';

  if (!filtered.length) {
    grid.classList.add('hidden');
    emptyEl.classList.remove('hidden');
    return;
  }

  grid.classList.remove('hidden');
  emptyEl.classList.add('hidden');

  // Render newest first; inject "New" badge for first-of-rarity cards
  [...filtered].reverse().forEach(card => {
    const el = renderCard(card, { mini: true });
    if (card.firstOfRarity) {
      const badge = document.createElement('span');
      badge.className = 'card__new-badge';
      badge.textContent = 'New';
      el.appendChild(badge);
    }
    grid.appendChild(el);
  });
}

function openCollectionView() {
  renderCollection('all');
  transitionTo('collection');
}


/* ═══════════════════════════════════════════════════════
   10. UI HELPERS
   ═══════════════════════════════════════════════════════ */

function showLoading(visible) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !visible);
}

let toastTimer = null;
function showToast(message, duration = 2800) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.classList.add('hidden'), 350);
  }, duration);
}

function updateHeroCollectionCount(count) {
  const badge = document.getElementById('hero-collection-count');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = '';
  } else {
    badge.style.display = 'none';
  }
}

function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


/* ═══════════════════════════════════════════════════════
   11. INITIALIZATION
   Wire up all event listeners and boot the app.
   ═══════════════════════════════════════════════════════ */

function initEventListeners() {
  // Hero: open pack button
  document.getElementById('open-pack-btn').addEventListener('click', () => {
    startPackOpening();
  });

  // Hero: view collection button
  document.getElementById('view-collection-btn').addEventListener('click', () => {
    openCollectionView();
  });

  // Pack sealed: tap to tear open
  // Mobile tap feedback — briefly scale down the pack on touchstart before the tear
  const sealedPhase = document.getElementById('phase-sealed');
  const openingPack = document.getElementById('opening-pack');
  sealedPhase.addEventListener('touchstart', () => {
    openingPack.classList.add('pack-visual--tapped');
    setTimeout(() => openingPack.classList.remove('pack-visual--tapped'), 120);
  }, { passive: true });
  sealedPhase.addEventListener('click', tearOpenPack);

  // Reveal: next card button
  document.getElementById('next-card-btn').addEventListener('click', advanceReveal);

  // Reveal: tap anywhere on the reveal phase section to advance
  // Guard: ignore taps that originate on the button itself (it has its own handler)
  document.getElementById('phase-reveal').addEventListener('click', (e) => {
    if (e.target.closest('#next-card-btn')) return; // button handles its own click
    const btn = document.getElementById('next-card-btn');
    if (btn.disabled) return;                        // respect rarity hold
    advanceReveal();
  });

  // Summary: open another
  document.getElementById('open-another-btn').addEventListener('click', () => {
    startPackOpening();
  });

  // Summary: see collection
  document.getElementById('see-collection-btn').addEventListener('click', () => {
    openCollectionView();
  });

  // Collection: close / back
  document.getElementById('close-collection-btn').addEventListener('click', () => {
    transitionTo('hero');
  });

  // Collection: empty state — open pack
  document.getElementById('empty-open-pack-btn').addEventListener('click', () => {
    transitionTo('hero');
    // Small delay before starting so hero is visible briefly
    setTimeout(() => startPackOpening(), 300);
  });

  // Collection: rarity filters
  document.getElementById('collection-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    renderCollection(btn.dataset.rarity);
  });
}

function boot() {
  // Update collection count on hero
  const stored = loadCollection();
  updateHeroCollectionCount(stored.length);

  // Wire up interactions
  initEventListeners();

  // Start visible on hero
  transitionTo('hero');

  // Preload player data in the background after a short delay
  // so it's ready when the user clicks "Open Pack"
  setTimeout(() => loadPlayerData(), 1200);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
