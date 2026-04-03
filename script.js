/* ═══════════════════════════════════════════════════════
   DIAMOND PULLS — script.js
   Baseball card pack-opening experience with live MLB data.

   Architecture:
   1. Config & State
   2. Player Pool
   3. MLB API Integration
   4. Rarity & Pack System
   5. Card Generation & Rendering
   6. Collection (localStorage)
   7. Pack Opening Flow
   8. Collection UI
   9. Pack Stats UI
   10. Screen Navigation
   11. Utilities
   12. Initialization
   ═══════════════════════════════════════════════════════ */


/* ═══════════════════════════════════════
   1. CONFIG & STATE
   ═══════════════════════════════════════ */

const CONFIG = {
  PACK_TYPES: {
    standard: { size: 5, slots: [{ rarity: 'common', count: 3 }, { rarity: 'rare', count: 1 }, { rarity: 'epic_plus', count: 1 }] },
    premium:  { size: 5, slots: [{ rarity: 'common', count: 1 }, { rarity: 'rare', count: 2 }, { rarity: 'epic_plus', count: 2 }] },
    legendary:{ size: 3, slots: [{ rarity: 'rare', count: 1 }, { rarity: 'epic_plus', count: 2 }] },
  },
  LEGENDARY_RATE: 0.12,
  REVEAL_DELAY: 350,
  STORAGE_KEY: 'diamond_pulls_v2',
  STATS_KEY: 'diamond_pulls_stats_v2',
  MLB_API: 'https://statsapi.mlb.com/api/v1',
  API_TIMEOUT: 6000,
};

const STATE = {
  selectedPack: 'standard',
  enrichedPlayers: [],
  dataReady: false,
  currentPack: [],
  revealIndex: 0,
  packsOpened: 0,
};


/* ═══════════════════════════════════════
   2. PLAYER POOL
   ═══════════════════════════════════════ */

const PLAYER_POOL = [
  // Tier 4 — Elite superstars
  { id: 660670, name: 'Shohei Ohtani',      teamName: 'Los Angeles Dodgers',   teamAbbr: 'LAD', position: 'DH/P',  tier: 4 },
  { id: 592450, name: 'Mike Trout',          teamName: 'Los Angeles Angels',    teamAbbr: 'LAA', position: 'CF',    tier: 4 },
  { id: 605141, name: 'Mookie Betts',        teamName: 'Los Angeles Dodgers',   teamAbbr: 'LAD', position: 'SS/OF', tier: 4 },
  { id: 596019, name: 'Freddie Freeman',     teamName: 'Los Angeles Dodgers',   teamAbbr: 'LAD', position: '1B',    tier: 4 },
  { id: 641355, name: 'Juan Soto',           teamName: 'New York Mets',         teamAbbr: 'NYM', position: 'RF',    tier: 4 },
  { id: 665742, name: 'Ronald Acuna Jr.',    teamName: 'Atlanta Braves',        teamAbbr: 'ATL', position: 'RF',    tier: 4 },
  { id: 682998, name: 'Elly De La Cruz',     teamName: 'Cincinnati Reds',       teamAbbr: 'CIN', position: 'SS',    tier: 4 },
  { id: 545361, name: 'Aaron Judge',         teamName: 'New York Yankees',      teamAbbr: 'NYY', position: 'RF',    tier: 4 },

  // Tier 3 — Stars
  { id: 671096, name: 'Bobby Witt Jr.',      teamName: 'Kansas City Royals',    teamAbbr: 'KC',  position: 'SS',    tier: 3 },
  { id: 673357, name: 'Gunnar Henderson',    teamName: 'Baltimore Orioles',     teamAbbr: 'BAL', position: 'SS',    tier: 3 },
  { id: 669257, name: 'Julio Rodriguez',     teamName: 'Seattle Mariners',      teamAbbr: 'SEA', position: 'CF',    tier: 3 },
  { id: 694497, name: 'Jackson Chourio',     teamName: 'Milwaukee Brewers',     teamAbbr: 'MIL', position: 'LF',    tier: 3 },
  { id: 607043, name: 'Bryce Harper',        teamName: 'Philadelphia Phillies', teamAbbr: 'PHI', position: '1B',    tier: 3 },
  { id: 543760, name: 'Jose Ramirez',        teamName: 'Cleveland Guardians',   teamAbbr: 'CLE', position: '3B',    tier: 3 },
  { id: 624413, name: 'Rafael Devers',       teamName: 'Boston Red Sox',        teamAbbr: 'BOS', position: '3B',    tier: 3 },
  { id: 592518, name: 'Yordan Alvarez',      teamName: 'Houston Astros',        teamAbbr: 'HOU', position: 'DH',    tier: 3 },
  { id: 650402, name: 'Pete Alonso',         teamName: 'New York Mets',         teamAbbr: 'NYM', position: '1B',    tier: 3 },
  { id: 621439, name: 'Trea Turner',         teamName: 'Philadelphia Phillies', teamAbbr: 'PHI', position: 'SS',    tier: 3 },
  { id: 668939, name: 'Adley Rutschman',     teamName: 'Baltimore Orioles',     teamAbbr: 'BAL', position: 'C',     tier: 3 },
  { id: 666971, name: 'Corey Seager',        teamName: 'Texas Rangers',         teamAbbr: 'TEX', position: 'SS',    tier: 3 },

  // Tier 2 — Solid regulars
  { id: 641703, name: 'Vladimir Guerrero Jr.', teamName: 'Toronto Blue Jays',  teamAbbr: 'TOR', position: '1B',    tier: 2 },
  { id: 668804, name: 'Jeremy Pena',         teamName: 'Houston Astros',        teamAbbr: 'HOU', position: 'SS',    tier: 2 },
  { id: 660271, name: 'Anthony Volpe',       teamName: 'New York Yankees',      teamAbbr: 'NYY', position: 'SS',    tier: 2 },
  { id: 592696, name: 'Nolan Arenado',       teamName: 'Houston Astros',        teamAbbr: 'HOU', position: '3B',    tier: 2 },
  { id: 643217, name: 'Kyle Tucker',         teamName: 'Chicago Cubs',          teamAbbr: 'CHC', position: 'RF',    tier: 2 },
  { id: 663993, name: 'Austin Riley',        teamName: 'Atlanta Braves',        teamAbbr: 'ATL', position: '3B',    tier: 2 },
  { id: 670042, name: 'Spencer Strider',     teamName: 'Atlanta Braves',        teamAbbr: 'ATL', position: 'SP',    tier: 2 },
  { id: 669923, name: 'Logan Gilbert',       teamName: 'Seattle Mariners',      teamAbbr: 'SEA', position: 'SP',    tier: 2 },
  { id: 656302, name: 'Zack Wheeler',        teamName: 'Philadelphia Phillies', teamAbbr: 'PHI', position: 'SP',    tier: 2 },
  { id: 669373, name: 'Luis Robert Jr.',     teamName: 'Chicago White Sox',     teamAbbr: 'CWS', position: 'CF',    tier: 2 },

  // Tier 1 — Roster / Prospects
  { id: 687786, name: 'Jackson Merrill',     teamName: 'San Diego Padres',      teamAbbr: 'SD',  position: 'CF',    tier: 1 },
  { id: 676897, name: 'Michael Harris II',   teamName: 'Atlanta Braves',        teamAbbr: 'ATL', position: 'CF',    tier: 1 },
  { id: 686668, name: 'Jarren Duran',        teamName: 'Boston Red Sox',        teamAbbr: 'BOS', position: 'CF',    tier: 1 },
  { id: 687688, name: 'James Wood',          teamName: 'Washington Nationals',  teamAbbr: 'WSH', position: 'LF',    tier: 1 },
  { id: 697478, name: 'Jackson Holliday',    teamName: 'Baltimore Orioles',     teamAbbr: 'BAL', position: '2B',    tier: 1 },
  { id: 686679, name: 'Paul Skenes',         teamName: 'Pittsburgh Pirates',    teamAbbr: 'PIT', position: 'SP',    tier: 1 },
  { id: 672515, name: 'Nolan Jones',         teamName: 'Colorado Rockies',      teamAbbr: 'COL', position: 'RF',    tier: 1 },
  { id: 663656, name: 'CJ Abrams',           teamName: 'Washington Nationals',  teamAbbr: 'WSH', position: 'SS',    tier: 1 },
];


/* ═══════════════════════════════════════
   3. MLB API INTEGRATION
   ═══════════════════════════════════════ */

const PITCHER_POS = new Set(['P', 'SP', 'RP', 'CP']);

const TEAM_ABBR_MAP = {
  'Arizona Diamondbacks': 'ARI', 'Atlanta Braves': 'ATL', 'Baltimore Orioles': 'BAL',
  'Boston Red Sox': 'BOS', 'Chicago Cubs': 'CHC', 'Chicago White Sox': 'CWS',
  'Cincinnati Reds': 'CIN', 'Cleveland Guardians': 'CLE', 'Colorado Rockies': 'COL',
  'Detroit Tigers': 'DET', 'Houston Astros': 'HOU', 'Kansas City Royals': 'KC',
  'Los Angeles Angels': 'LAA', 'Los Angeles Dodgers': 'LAD', 'Miami Marlins': 'MIA',
  'Milwaukee Brewers': 'MIL', 'Minnesota Twins': 'MIN', 'New York Mets': 'NYM',
  'New York Yankees': 'NYY', 'Oakland Athletics': 'OAK', 'Philadelphia Phillies': 'PHI',
  'Pittsburgh Pirates': 'PIT', 'San Diego Padres': 'SD', 'San Francisco Giants': 'SF',
  'Seattle Mariners': 'SEA', 'St. Louis Cardinals': 'STL', 'Tampa Bay Rays': 'TB',
  'Texas Rangers': 'TEX', 'Toronto Blue Jays': 'TOR', 'Washington Nationals': 'WSH',
};

const FALLBACK_STATS = {
  'SP':    { stat1: 12, stat2: 3.45, stat3: 188, labels: ['W', 'ERA', 'K'] },
  'RP':    { stat1: 3,  stat2: 2.85, stat3: 65,  labels: ['W', 'ERA', 'K'] },
  'C':     { stat1: .265, stat2: 18, stat3: 64,   labels: ['AVG', 'HR', 'RBI'] },
  '1B':    { stat1: .278, stat2: 28, stat3: 88,   labels: ['AVG', 'HR', 'RBI'] },
  '2B':    { stat1: .268, stat2: 16, stat3: 62,   labels: ['AVG', 'HR', 'RBI'] },
  '3B':    { stat1: .272, stat2: 22, stat3: 80,   labels: ['AVG', 'HR', 'RBI'] },
  'SS':    { stat1: .265, stat2: 18, stat3: 66,   labels: ['AVG', 'HR', 'RBI'] },
  'LF':    { stat1: .270, stat2: 20, stat3: 74,   labels: ['AVG', 'HR', 'RBI'] },
  'CF':    { stat1: .268, stat2: 19, stat3: 68,   labels: ['AVG', 'HR', 'RBI'] },
  'RF':    { stat1: .275, stat2: 25, stat3: 82,   labels: ['AVG', 'HR', 'RBI'] },
  'DH':    { stat1: .280, stat2: 32, stat3: 98,   labels: ['AVG', 'HR', 'RBI'] },
  'DH/P':  { stat1: .310, stat2: 44, stat3: 101,  labels: ['AVG', 'HR', 'RBI'] },
  'SS/OF': { stat1: .293, stat2: 35, stat3: 95,   labels: ['AVG', 'HR', 'RBI'] },
};

function generateFallbackStats(player) {
  const base = FALLBACK_STATS[player.position] || FALLBACK_STATS['CF'];
  const mult = 0.85 + (player.tier - 1) * 0.08;
  return {
    stat1: typeof base.stat1 === 'number' && base.stat1 < 1
      ? parseFloat((base.stat1 * (0.95 + player.tier * 0.01) + (Math.random() - 0.5) * 0.02).toFixed(3))
      : Math.round(base.stat1 * mult + (Math.random() - 0.5) * 4),
    stat2: typeof base.stat2 === 'number' && base.stat2 < 1
      ? parseFloat((base.stat2 * mult).toFixed(3))
      : Math.round(base.stat2 * mult + (Math.random() - 0.5) * 3),
    stat3: Math.round(base.stat3 * mult + (Math.random() - 0.5) * 8),
    labels: base.labels,
  };
}

function headshotUrl(playerId) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

async function fetchPlayerStats(playerId) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

    const res = await fetch(
      `${CONFIG.MLB_API}/people/${playerId}?hydrate=currentTeam,stats(group=[hitting,pitching],type=yearByYear,season=2024)`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) return null;
    const json = await res.json();
    const person = json.people?.[0];
    if (!person) return null;

    const statsGroups = person.stats || [];
    const hitting  = statsGroups.find(g => g.group?.displayName === 'hitting');
    const pitching = statsGroups.find(g => g.group?.displayName === 'pitching');
    const hSplits = hitting?.splits || [];
    const pSplits = pitching?.splits || [];
    const lastH = hSplits.filter(s => s.season === '2024').pop();
    const lastP = pSplits.filter(s => s.season === '2024').pop();

    return {
      name: person.fullName || null,
      position: person.primaryPosition?.abbreviation || null,
      teamName: person.currentTeam?.name || null,
      teamAbbr: person.currentTeam?.abbreviation || null,
      hitting: lastH?.stat || null,
      pitching: lastP?.stat || null,
    };
  } catch (e) {
    console.warn(`API fetch failed for player ${playerId}:`, e.message);
    return null;
  }
}

async function loadAllPlayerData() {
  showLoading(true);

  const results = await Promise.allSettled(
    PLAYER_POOL.map(p => fetchPlayerStats(p.id))
  );

  let loadedCount = 0;

  STATE.enrichedPlayers = PLAYER_POOL.map((seed, i) => {
    const api = results[i].status === 'fulfilled' ? results[i].value : null;

    // Use seed as base, override with API where available
    const name     = api?.name || seed.name;
    const position = api?.position || seed.position;
    const teamName = api?.teamName || seed.teamName;
    const teamAbbr = api?.teamAbbr || TEAM_ABBR_MAP[teamName] || seed.teamAbbr;

    // Stats
    let stats;
    if (api) {
      loadedCount++;
      const isPitcher = PITCHER_POS.has(position);
      if (isPitcher && api.pitching) {
        stats = {
          stat1: api.pitching.wins ?? 0,
          stat2: api.pitching.era ?? '--',
          stat3: api.pitching.strikeOuts ?? 0,
          labels: ['W', 'ERA', 'K'],
        };
      } else if (!isPitcher && api.hitting) {
        stats = {
          stat1: api.hitting.avg ?? '--',
          stat2: api.hitting.homeRuns ?? 0,
          stat3: api.hitting.rbi ?? 0,
          labels: ['AVG', 'HR', 'RBI'],
        };
      } else {
        stats = generateFallbackStats({ ...seed, position });
      }
    } else {
      stats = generateFallbackStats(seed);
    }

    return {
      id: seed.id,
      name, teamName, teamAbbr, position,
      image: headshotUrl(seed.id),
      tier: seed.tier,
      stats,
    };
  });

  STATE.dataReady = true;
  showLoading(false);

  const pct = Math.round((loadedCount / PLAYER_POOL.length) * 100);
  if (loadedCount < PLAYER_POOL.length) {
    showToast(`Loaded ${loadedCount}/${PLAYER_POOL.length} players from MLB API (${pct}%). Some using fallback stats.`);
  }
}


/* ═══════════════════════════════════════
   4. RARITY & PACK SYSTEM
   ═══════════════════════════════════════ */

const RARITY_WEIGHTS = {
  common: {
    1: { common: 100 },
    2: { common: 95, rare: 5 },
    3: { common: 80, rare: 20 },
    4: { common: 60, rare: 40 },
  },
  rare: {
    1: { common: 20, rare: 80 },
    2: { common: 5, rare: 90, epic: 5 },
    3: { rare: 70, epic: 30 },
    4: { rare: 40, epic: 55, legendary: 5 },
  },
  epic_plus: {
    1: { rare: 40, epic: 60 },
    2: { epic: 80, legendary: 20 },
    3: { epic: 55, legendary: 45 },
    4: { epic: 20, legendary: 80 },
  },
};

function pickWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [key, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function assignRarity(player, slotType) {
  const table = RARITY_WEIGHTS[slotType]?.[player.tier] || { common: 100 };
  return pickWeighted(table);
}

function pickPlayerForSlot(slotType, usedIds) {
  const tierWeights = {
    common:    { 1: 45, 2: 35, 3: 15, 4: 5 },
    rare:      { 1: 10, 2: 30, 3: 40, 4: 20 },
    epic_plus: { 1: 2,  2: 15, 3: 40, 4: 43 },
  };
  const weights = tierWeights[slotType] || tierWeights.common;
  const tier = parseInt(pickWeighted(weights), 10);

  const pool = STATE.enrichedPlayers.filter(p => p.tier === tier && !usedIds.includes(p.id));
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];

  // Fallback: any player not used
  const fallback = STATE.enrichedPlayers.filter(p => !usedIds.includes(p.id));
  if (fallback.length) return fallback[Math.floor(Math.random() * fallback.length)];

  // Last resort: allow duplicates
  return STATE.enrichedPlayers[Math.floor(Math.random() * STATE.enrichedPlayers.length)];
}

function buildPack(packType) {
  const config = CONFIG.PACK_TYPES[packType];
  if (!config) return [];

  const cards = [];
  const usedIds = [];

  for (const slot of config.slots) {
    for (let i = 0; i < slot.count; i++) {
      const player = pickPlayerForSlot(slot.rarity, usedIds);
      usedIds.push(player.id);
      const rarity = assignRarity(player, slot.rarity);
      cards.push({ player, rarity });
    }
  }

  return shuffle(cards);
}


/* ═══════════════════════════════════════
   5. CARD GENERATION & RENDERING
   ═══════════════════════════════════════ */

function deriveDescriptor(player) {
  const isPitcher = PITCHER_POS.has(player.position);
  const s = player.stats;

  if (isPitcher) {
    const era = parseFloat(s.stat2);
    const k = parseInt(s.stat3, 10);
    if (!isNaN(era) && !isNaN(k)) {
      if (era <= 2.50 && k >= 180) return 'Ace · Strikeout Machine';
      if (era <= 2.50) return 'Elite Ace';
      if (era <= 3.25 && k >= 150) return 'Power Pitcher';
      if (era <= 3.25) return 'Solid Starter';
      if (k >= 150) return 'High-K Arm';
      return 'Rotation Piece';
    }
  } else {
    const avg = parseFloat(s.stat1);
    const hr = parseInt(s.stat2, 10);
    if (!isNaN(avg) && !isNaN(hr)) {
      if (avg >= .300 && hr >= 35) return 'Five-Tool Threat';
      if (avg >= .300 && hr >= 20) return 'Contact & Power';
      if (avg >= .300) return 'Pure Hitter';
      if (hr >= 40) return 'Power Masher';
      if (hr >= 25) return 'Run Producer';
      if (avg >= .270) return 'Reliable Bat';
      return 'Everyday Player';
    }
  }
  return '';
}

function generateCard({ player, rarity }) {
  return {
    id: `${player.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    playerId: player.id,
    playerName: player.name,
    teamName: player.teamName,
    teamAbbr: player.teamAbbr,
    position: player.position,
    image: player.image,
    stats: { stat1: player.stats.stat1, stat2: player.stats.stat2, stat3: player.stats.stat3 },
    statLabels: player.stats.labels,
    descriptor: deriveDescriptor(player),
    rarity,
    pulledAt: new Date().toISOString(),
  };
}

const RARITY_LABELS = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: '★ Legend' };
const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

function renderCard(card, { mini = false, animate = false } = {}) {
  const el = document.createElement('div');
  el.className = `card${mini ? ' card--mini' : ''}${animate ? ' card--reveal-enter' : ''}`;
  el.dataset.rarity = card.rarity;
  el.dataset.cardId = card.id;

  const initials = card.playerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const teamPos = [card.teamAbbr, card.position].filter(Boolean).join(' · ');

  el.innerHTML = `
    <div class="card-shimmer"></div>
    <div class="card-header">
      <span class="card-team-tag">${esc(teamPos)}</span>
      <span class="card-rarity-badge">${RARITY_LABELS[card.rarity] || card.rarity}</span>
    </div>
    <div class="card-image-area">
      <img class="card-player-img" src="${esc(card.image)}" alt="${esc(card.playerName)}" loading="lazy"
        onerror="this.parentNode.innerHTML='<div class=\\'card-player-initials\\'>${initials}</div>'" />
    </div>
    <div class="card-body">
      <div class="card-player-name">${esc(card.playerName)}</div>
      <div class="card-position">${esc(card.position)}</div>
      ${card.descriptor ? `<div class="card-descriptor">${esc(card.descriptor)}</div>` : ''}
      <div class="card-stats">
        <div class="card-stat"><div class="card-stat-value">${card.stats.stat1 ?? '—'}</div><div class="card-stat-label">${esc(card.statLabels[0] || '')}</div></div>
        <div class="card-stat"><div class="card-stat-value">${card.stats.stat2 ?? '—'}</div><div class="card-stat-label">${esc(card.statLabels[1] || '')}</div></div>
        <div class="card-stat"><div class="card-stat-value">${card.stats.stat3 ?? '—'}</div><div class="card-stat-label">${esc(card.statLabels[2] || '')}</div></div>
      </div>
    </div>
    <div class="card-footer">
      <span class="card-series-tag">2024 Stats</span>
      <span class="card-id">#${card.id.slice(-6).toUpperCase()}</span>
    </div>
  `;

  // Click handler for mini cards — open detail modal
  if (mini) {
    el.addEventListener('click', () => openCardModal(card));
  }

  return el;
}


/* ═══════════════════════════════════════
   6. COLLECTION (localStorage)
   ═══════════════════════════════════════ */

function loadCollection() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCollection(collection) {
  try {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(collection));
  } catch (e) {
    console.warn('Could not save collection:', e);
  }
}

function addCardsToCollection(cards) {
  const collection = loadCollection();
  collection.push(...cards);
  saveCollection(collection);
  updateCollectionBadge();
}

function loadStats() {
  try {
    const raw = localStorage.getItem(CONFIG.STATS_KEY);
    return raw ? JSON.parse(raw) : { packsOpened: 0 };
  } catch {
    return { packsOpened: 0 };
  }
}

function saveStats(stats) {
  try {
    localStorage.setItem(CONFIG.STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.warn('Could not save stats:', e);
  }
}

function recordPackOpened() {
  const stats = loadStats();
  stats.packsOpened = (stats.packsOpened || 0) + 1;
  saveStats(stats);
}

function updateCollectionBadge() {
  const count = loadCollection().length;
  const badge = $('collection-count');
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}


/* ═══════════════════════════════════════
   7. PACK OPENING FLOW
   ═══════════════════════════════════════ */

function startPackOpening() {
  if (!STATE.dataReady) {
    showToast('Still loading player data — try again in a moment.');
    return;
  }

  const packType = STATE.selectedPack;
  const packConfig = CONFIG.PACK_TYPES[packType];

  // Build pack
  const packTuples = buildPack(packType);
  STATE.currentPack = packTuples.map(t => generateCard(t));
  STATE.revealIndex = 0;

  // Update sealed pack label
  $('sealed-pack-type').textContent = packType.toUpperCase();

  // Show pack opening screen
  navigateTo('pack-opening');

  // Show sealed phase
  showPhase('sealed');
  const sealedPack = $('sealed-pack');
  sealedPack.classList.remove('tearing');

  // Build pips
  const pipsContainer = $('reveal-pips');
  pipsContainer.innerHTML = '';
  for (let i = 0; i < STATE.currentPack.length; i++) {
    const pip = document.createElement('span');
    pip.className = 'reveal-pip';
    pip.dataset.idx = i;
    pipsContainer.appendChild(pip);
  }
}

function tearPack() {
  const sealedPack = $('sealed-pack');
  sealedPack.classList.add('tearing');

  setTimeout(() => {
    showPhase('reveal');
    revealCurrentCard();
  }, 600);
}

function revealCurrentCard() {
  const card = STATE.currentPack[STATE.revealIndex];
  if (!card) return;

  const total = STATE.currentPack.length;
  $('reveal-counter').textContent = `Card ${STATE.revealIndex + 1} of ${total}`;

  // Update pips
  document.querySelectorAll('.reveal-pip').forEach((pip, i) => {
    pip.classList.remove('active', 'seen');
    if (i < STATE.revealIndex) pip.classList.add('seen');
    if (i === STATE.revealIndex) pip.classList.add('active');
  });

  // Render card
  const stage = $('card-stage');
  stage.innerHTML = '';

  // Legendary burst effect
  if (card.rarity === 'legendary') {
    spawnLegendaryBurst();
  }

  const cardEl = renderCard(card, { mini: false, animate: true });
  stage.appendChild(cardEl);

  // Update button label
  const isLast = STATE.revealIndex >= total - 1;
  $('next-card-label').textContent = isLast ? 'See Results' : 'Next Card';
}

function advanceReveal() {
  STATE.revealIndex++;
  if (STATE.revealIndex >= STATE.currentPack.length) {
    showPackSummary();
  } else {
    revealCurrentCard();
  }
}

function showPackSummary() {
  showPhase('summary');

  // Add cards to collection
  addCardsToCollection(STATE.currentPack);
  recordPackOpened();

  // Build subtitle
  const rarities = STATE.currentPack.map(c => c.rarity);
  const legCount = rarities.filter(r => r === 'legendary').length;
  const epicCount = rarities.filter(r => r === 'epic').length;
  const subtitleParts = [];
  if (legCount > 0) subtitleParts.push(`${legCount} Legendary!`);
  if (epicCount > 0) subtitleParts.push(`${epicCount} Epic`);
  $('summary-subtitle').textContent = subtitleParts.length > 0
    ? subtitleParts.join(' · ')
    : "Here's what you pulled";

  // Build summary grid
  const grid = $('summary-grid');
  grid.innerHTML = '';
  // Sort by rarity for display
  const sorted = [...STATE.currentPack].sort((a, b) => (RARITY_ORDER[a.rarity] || 3) - (RARITY_ORDER[b.rarity] || 3));
  sorted.forEach(card => {
    grid.appendChild(renderCard(card, { mini: true }));
  });
}

function spawnLegendaryBurst() {
  // Background flash
  const burst = document.createElement('div');
  burst.className = 'legendary-burst';
  document.body.appendChild(burst);
  setTimeout(() => burst.remove(), 800);

  // Particles
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const angle = (Math.PI * 2 * i) / 20;
    const dist = 100 + Math.random() * 200;
    particle.style.left = '50%';
    particle.style.top = '40%';
    particle.style.setProperty('--px', `${Math.cos(angle) * dist}px`);
    particle.style.setProperty('--py', `${Math.sin(angle) * dist}px`);
    particle.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1500);
  }
}


/* ═══════════════════════════════════════
   8. COLLECTION UI
   ═══════════════════════════════════════ */

function showCollection() {
  navigateTo('collection');
  renderCollectionView();
}

function renderCollectionView(filterRarity = 'all', sortBy = 'newest') {
  let collection = loadCollection();

  // Filter
  if (filterRarity !== 'all') {
    collection = collection.filter(c => c.rarity === filterRarity);
  }

  // Sort
  switch (sortBy) {
    case 'rarity':
      collection.sort((a, b) => (RARITY_ORDER[a.rarity] || 3) - (RARITY_ORDER[b.rarity] || 3));
      break;
    case 'team':
      collection.sort((a, b) => (a.teamAbbr || '').localeCompare(b.teamAbbr || ''));
      break;
    case 'name':
      collection.sort((a, b) => a.playerName.localeCompare(b.playerName));
      break;
    case 'newest':
    default:
      collection.sort((a, b) => new Date(b.pulledAt) - new Date(a.pulledAt));
  }

  // Update subtitle
  const allCards = loadCollection();
  $('collection-subtitle').textContent = `${allCards.length} cards`;

  // Render
  const grid = $('collection-grid');
  const empty = $('collection-empty');

  grid.innerHTML = '';

  if (collection.length === 0) {
    grid.classList.add('hidden');
    empty.classList.remove('hidden');
  } else {
    grid.classList.remove('hidden');
    empty.classList.add('hidden');
    collection.forEach(card => {
      grid.appendChild(renderCard(card, { mini: true }));
    });
  }
}


/* ═══════════════════════════════════════
   9. PACK STATS UI
   ═══════════════════════════════════════ */

function showPackStats() {
  navigateTo('pack-stats');
  renderPackStatsView();
}

function renderPackStatsView() {
  const collection = loadCollection();
  const stats = loadStats();

  $('stat-packs-opened').textContent = stats.packsOpened || 0;
  $('stat-total-cards').textContent = collection.length;

  const legendaries = collection.filter(c => c.rarity === 'legendary').length;
  $('stat-legendaries').textContent = legendaries;

  const uniquePlayers = new Set(collection.map(c => c.playerId)).size;
  $('stat-unique').textContent = uniquePlayers;

  // Rarity breakdown chart
  const rarityCounts = { legendary: 0, epic: 0, rare: 0, common: 0 };
  collection.forEach(c => { if (rarityCounts[c.rarity] !== undefined) rarityCounts[c.rarity]++; });
  const maxCount = Math.max(...Object.values(rarityCounts), 1);

  const chart = $('rarity-chart');
  chart.innerHTML = '';
  const rarityColors = { common: 'common', rare: 'rare', epic: 'epic', legendary: 'legendary' };

  for (const [rarity, count] of Object.entries(rarityCounts)) {
    const pct = (count / maxCount) * 100;
    const row = document.createElement('div');
    row.className = 'rarity-bar-row';
    row.innerHTML = `
      <span class="rarity-bar-label" style="color: var(--${rarityColors[rarity]})">${RARITY_LABELS[rarity]}</span>
      <div class="rarity-bar-track">
        <div class="rarity-bar-fill ${rarityColors[rarity]}" style="width: ${pct}%"></div>
      </div>
      <span class="rarity-bar-count">${count}</span>
    `;
    chart.appendChild(row);
  }

  // Best pulls
  const bestArea = $('stats-best');
  const legs = collection.filter(c => c.rarity === 'legendary');
  if (legs.length > 0) {
    bestArea.innerHTML = `<h3 style="font-size:16px;color:var(--text-secondary);margin-bottom:16px;">Best Pulls</h3>`;
    const bestGrid = document.createElement('div');
    bestGrid.style.display = 'flex';
    bestGrid.style.flexWrap = 'wrap';
    bestGrid.style.gap = '12px';
    legs.forEach(card => bestGrid.appendChild(renderCard(card, { mini: true })));
    bestArea.appendChild(bestGrid);
  } else {
    bestArea.innerHTML = '<p style="color:var(--text-muted);font-size:14px;">No legendary pulls yet — keep opening packs!</p>';
  }
}


/* ═══════════════════════════════════════
   10. SCREEN NAVIGATION
   ═══════════════════════════════════════ */

function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = $(screenId);
  if (target) target.classList.add('active');
}

function showPhase(phaseName) {
  document.querySelectorAll('.phase').forEach(p => p.classList.add('hidden'));
  const target = $(`phase-${phaseName}`);
  if (target) target.classList.remove('hidden');
}

function openCardModal(card) {
  const modal = $('card-modal');
  const area = $('modal-card-area');
  area.innerHTML = '';
  area.appendChild(renderCard(card, { mini: false }));
  modal.classList.remove('hidden');
}

function closeCardModal() {
  $('card-modal').classList.add('hidden');
}


/* ═══════════════════════════════════════
   11. UTILITIES
   ═══════════════════════════════════════ */

function $(id) { return document.getElementById(id); }

function esc(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showLoading(show) {
  const el = $('loading-overlay');
  if (show) el.classList.remove('hidden');
  else el.classList.add('hidden');
}

let toastTimer = null;
function showToast(msg, duration = 3500) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), duration);
}


/* ═══════════════════════════════════════
   12. INITIALIZATION
   ═══════════════════════════════════════ */

function initEventListeners() {
  // Pack type selector
  document.querySelectorAll('.pack-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pack-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      STATE.selectedPack = btn.dataset.pack;
    });
  });

  // Open pack
  $('open-pack-btn').addEventListener('click', startPackOpening);

  // Sealed pack click → tear
  $('sealed-pack').addEventListener('click', tearPack);

  // Next card
  $('next-card-btn').addEventListener('click', advanceReveal);

  // Summary actions
  $('open-another-btn').addEventListener('click', () => navigateTo('hero'));
  $('see-collection-btn').addEventListener('click', showCollection);

  // Hero nav
  $('view-collection-btn').addEventListener('click', showCollection);
  $('view-stats-btn').addEventListener('click', showPackStats);

  // Collection
  $('close-collection-btn').addEventListener('click', () => navigateTo('hero'));

  // Collection filters
  document.querySelectorAll('#rarity-filters .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#rarity-filters .filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sort = $('sort-select').value;
      renderCollectionView(btn.dataset.filter, sort);
    });
  });

  // Collection sort
  $('sort-select').addEventListener('change', (e) => {
    const activeFilter = document.querySelector('#rarity-filters .filter-btn.active');
    renderCollectionView(activeFilter?.dataset.filter || 'all', e.target.value);
  });

  // Empty collection open pack
  $('empty-open-btn').addEventListener('click', () => navigateTo('hero'));

  // Stats
  $('close-stats-btn').addEventListener('click', () => navigateTo('hero'));

  // Modal
  $('modal-close').addEventListener('click', closeCardModal);
  $('card-modal').addEventListener('click', (e) => {
    if (e.target === $('card-modal')) closeCardModal();
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('card-modal').classList.contains('hidden')) {
        closeCardModal();
      }
    }
  });
}

async function init() {
  initEventListeners();
  updateCollectionBadge();
  await loadAllPlayerData();
}

// Go!
init();
