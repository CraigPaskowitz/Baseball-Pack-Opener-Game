/* ═══════════════════════════════════════════════════════════════════
   DIAMOND PULLS v2 — game.js
   Stadium-night cinematic baseball card experience.
   Bebas Neue + Nunito · Real MLB data · 38 verified players · 2024 stats
   ═══════════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────────────────────
   1. SAFE STORAGE WRAPPER  (pure in-memory)
   ───────────────────────────────────────────────────────────────── */
const safeStorage = (() => {
  const mem = {};
  return {
    getItem:    k     => (k in mem ? mem[k] : null),
    setItem:    (k, v) => { mem[k] = String(v); },
    removeItem: k     => { delete mem[k]; },
  };
})();


/* ─────────────────────────────────────────────────────────────────
   2. CONFIG
   ───────────────────────────────────────────────────────────────── */
const CONFIG = {
  PACK_TYPES: {
    standard:  {
      size: 5,
      slots: [{ rarity: 'common', count: 3 }, { rarity: 'rare', count: 1 }, { rarity: 'epic_plus', count: 1 }],
    },
    premium:   {
      size: 5,
      slots: [{ rarity: 'common', count: 1 }, { rarity: 'rare', count: 2 }, { rarity: 'epic_plus', count: 2 }],
    },
    legendary: {
      size: 3,
      slots: [{ rarity: 'rare', count: 1 }, { rarity: 'epic_plus', count: 1 }, { rarity: 'guaranteed_legendary', count: 1 }],
    },
  },
  STORAGE_KEY:  'diamond_pulls_v3',
  STATS_KEY:    'diamond_pulls_stats_v3',
  MLB_API:      'https://statsapi.mlb.com/api/v1',
  API_TIMEOUT:  7000,
  SEASON:       '2024',
};

const STATE = {
  selectedPack:    'standard',
  enrichedPlayers: [],
  dataReady:       false,
  currentPack:     [],
  revealIndex:     0,
  currentScreen:   'screen-hero',
  transitioning:   false,
};


/* ─────────────────────────────────────────────────────────────────
   3. PLAYER POOL  (38 verified players · 2025-26 teams)
   ───────────────────────────────────────────────────────────────── */
const PLAYER_POOL = [
  // ── Tier 4: All-time elite ────────────────────────────────────
  { id: 660670, name: 'Shohei Ohtani',        teamName: 'Los Angeles Dodgers',    teamAbbr: 'LAD', position: 'DH',    tier: 4 },
  { id: 592450, name: 'Mike Trout',            teamName: 'Los Angeles Angels',     teamAbbr: 'LAA', position: 'CF',    tier: 4 },
  { id: 605141, name: 'Mookie Betts',          teamName: 'Los Angeles Dodgers',    teamAbbr: 'LAD', position: 'SS/OF', tier: 4 },
  { id: 596019, name: 'Freddie Freeman',       teamName: 'Los Angeles Dodgers',    teamAbbr: 'LAD', position: '1B',    tier: 4 },
  { id: 641355, name: 'Juan Soto',             teamName: 'New York Mets',          teamAbbr: 'NYM', position: 'RF',    tier: 4 },
  { id: 665742, name: 'Ronald Acuna Jr.',      teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: 'RF',    tier: 4 },
  { id: 682998, name: 'Elly De La Cruz',       teamName: 'Cincinnati Reds',        teamAbbr: 'CIN', position: 'SS',    tier: 4 },
  { id: 545361, name: 'Aaron Judge',           teamName: 'New York Yankees',       teamAbbr: 'NYY', position: 'RF',    tier: 4 },
  { id: 686679, name: 'Paul Skenes',           teamName: 'Pittsburgh Pirates',     teamAbbr: 'PIT', position: 'SP',    tier: 4 },

  // ── Tier 3: Stars ─────────────────────────────────────────────
  { id: 671096, name: 'Bobby Witt Jr.',        teamName: 'Kansas City Royals',     teamAbbr: 'KC',  position: 'SS',    tier: 3 },
  { id: 673357, name: 'Gunnar Henderson',      teamName: 'Baltimore Orioles',      teamAbbr: 'BAL', position: 'SS',    tier: 3 },
  { id: 669257, name: 'Julio Rodriguez',       teamName: 'Seattle Mariners',       teamAbbr: 'SEA', position: 'CF',    tier: 3 },
  { id: 694497, name: 'Jackson Chourio',       teamName: 'Milwaukee Brewers',      teamAbbr: 'MIL', position: 'LF',    tier: 3 },
  { id: 607043, name: 'Bryce Harper',          teamName: 'Philadelphia Phillies',  teamAbbr: 'PHI', position: '1B',    tier: 3 },
  { id: 543760, name: 'Jose Ramirez',          teamName: 'Cleveland Guardians',    teamAbbr: 'CLE', position: '3B',    tier: 3 },
  { id: 624413, name: 'Rafael Devers',         teamName: 'Boston Red Sox',         teamAbbr: 'BOS', position: '3B',    tier: 3 },
  { id: 592518, name: 'Yordan Alvarez',        teamName: 'Houston Astros',         teamAbbr: 'HOU', position: 'DH',    tier: 3 },
  { id: 650402, name: 'Pete Alonso',           teamName: 'New York Mets',          teamAbbr: 'NYM', position: '1B',    tier: 3 },
  { id: 621439, name: 'Trea Turner',           teamName: 'Philadelphia Phillies',  teamAbbr: 'PHI', position: 'SS',    tier: 3 },
  { id: 668939, name: 'Adley Rutschman',       teamName: 'Baltimore Orioles',      teamAbbr: 'BAL', position: 'C',     tier: 3 },
  { id: 666971, name: 'Corey Seager',          teamName: 'Texas Rangers',          teamAbbr: 'TEX', position: 'SS',    tier: 3 },
  { id: 641703, name: 'Vladimir Guerrero Jr.', teamName: 'Toronto Blue Jays',      teamAbbr: 'TOR', position: '1B',    tier: 3 },

  // ── Tier 2: Solid regulars ────────────────────────────────────
  { id: 660271, name: 'Anthony Volpe',         teamName: 'New York Yankees',       teamAbbr: 'NYY', position: 'SS',    tier: 2 },
  { id: 592696, name: 'Nolan Arenado',         teamName: 'Arizona Diamondbacks',   teamAbbr: 'ARI', position: '3B',    tier: 2 },
  { id: 643217, name: 'Kyle Tucker',           teamName: 'Chicago Cubs',           teamAbbr: 'CHC', position: 'RF',    tier: 2 },
  { id: 663993, name: 'Austin Riley',          teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: '3B',    tier: 2 },
  { id: 670042, name: 'Spencer Strider',       teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: 'SP',    tier: 2 },
  { id: 669923, name: 'Logan Gilbert',         teamName: 'Seattle Mariners',       teamAbbr: 'SEA', position: 'SP',    tier: 2 },
  { id: 656302, name: 'Zack Wheeler',          teamName: 'Philadelphia Phillies',  teamAbbr: 'PHI', position: 'SP',    tier: 2 },
  { id: 686668, name: 'Jarren Duran',          teamName: 'Boston Red Sox',         teamAbbr: 'BOS', position: 'CF',    tier: 2 },
  { id: 668804, name: 'Jeremy Pena',           teamName: 'Houston Astros',         teamAbbr: 'HOU', position: 'SS',    tier: 2 },

  // ── Tier 1: Rising stars / prospects ─────────────────────────
  { id: 687786, name: 'Jackson Merrill',       teamName: 'San Diego Padres',       teamAbbr: 'SD',  position: 'CF',    tier: 1 },
  { id: 676897, name: 'Michael Harris II',     teamName: 'Atlanta Braves',         teamAbbr: 'ATL', position: 'CF',    tier: 1 },
  { id: 687688, name: 'James Wood',            teamName: 'Washington Nationals',   teamAbbr: 'WSH', position: 'LF',    tier: 1 },
  { id: 697478, name: 'Jackson Holliday',      teamName: 'Baltimore Orioles',      teamAbbr: 'BAL', position: '2B',    tier: 1 },
  { id: 663656, name: 'CJ Abrams',             teamName: 'Washington Nationals',   teamAbbr: 'WSH', position: 'SS',    tier: 1 },
  { id: 672515, name: 'Nolan Jones',           teamName: 'Colorado Rockies',       teamAbbr: 'COL', position: 'RF',    tier: 1 },
  { id: 669373, name: 'Luis Robert Jr.',       teamName: 'New York Mets',          teamAbbr: 'NYM', position: 'CF',    tier: 1 },
  { id: 694851, name: 'Wyatt Langford',        teamName: 'Texas Rangers',          teamAbbr: 'TEX', position: 'LF',    tier: 1 },
];


/* ─────────────────────────────────────────────────────────────────
   4. TEAM COLORS  (all 30 teams)
   ───────────────────────────────────────────────────────────────── */
const TEAM_COLORS = {
  LAD: { primary: '#005A9C', secondary: '#EF3E42' },
  LAA: { primary: '#BA0021', secondary: '#003263' },
  NYY: { primary: '#003087', secondary: '#C4CED4' },
  NYM: { primary: '#002D72', secondary: '#FF5910' },
  ATL: { primary: '#CE1141', secondary: '#13274F' },
  BOS: { primary: '#BD3039', secondary: '#0C2340' },
  CHC: { primary: '#0E3386', secondary: '#CC3433' },
  CWS: { primary: '#27251F', secondary: '#C4CED4' },
  CIN: { primary: '#C6011F', secondary: '#000000' },
  CLE: { primary: '#E31937', secondary: '#002B5C' },
  COL: { primary: '#33006F', secondary: '#C4CED4' },
  DET: { primary: '#0C2340', secondary: '#FA4616' },
  HOU: { primary: '#EB6E1F', secondary: '#002D62' },
  KC:  { primary: '#004687', secondary: '#BD9B60' },
  MIA: { primary: '#00A3E0', secondary: '#EF3340' },
  MIL: { primary: '#FFC52F', secondary: '#12284B' },
  MIN: { primary: '#002B5C', secondary: '#D31145' },
  OAK: { primary: '#003831', secondary: '#EFB21E' },
  PHI: { primary: '#E81828', secondary: '#002D72' },
  PIT: { primary: '#FDB827', secondary: '#27251F' },
  SD:  { primary: '#2F241D', secondary: '#FFC425' },
  SF:  { primary: '#FD5A1E', secondary: '#27251F' },
  SEA: { primary: '#0C2C56', secondary: '#005C5C' },
  STL: { primary: '#C41E3A', secondary: '#0C2340' },
  TB:  { primary: '#092C5C', secondary: '#8FBCE6' },
  TEX: { primary: '#003278', secondary: '#C0111F' },
  TOR: { primary: '#134A8E', secondary: '#E8291C' },
  WSH: { primary: '#AB0003', secondary: '#14225A' },
  BAL: { primary: '#DF4601', secondary: '#000000' },
  ARI: { primary: '#A71930', secondary: '#E3D4AD' },
};

const TEAM_ABBR_MAP = {
  'Arizona Diamondbacks':   'ARI', 'Atlanta Braves':          'ATL', 'Baltimore Orioles':       'BAL',
  'Boston Red Sox':         'BOS', 'Chicago Cubs':            'CHC', 'Chicago White Sox':       'CWS',
  'Cincinnati Reds':        'CIN', 'Cleveland Guardians':     'CLE', 'Colorado Rockies':        'COL',
  'Detroit Tigers':         'DET', 'Houston Astros':          'HOU', 'Kansas City Royals':      'KC',
  'Los Angeles Angels':     'LAA', 'Los Angeles Dodgers':     'LAD', 'Miami Marlins':           'MIA',
  'Milwaukee Brewers':      'MIL', 'Minnesota Twins':         'MIN', 'New York Mets':           'NYM',
  'New York Yankees':       'NYY', 'Oakland Athletics':       'OAK', 'Philadelphia Phillies':   'PHI',
  'Pittsburgh Pirates':     'PIT', 'San Diego Padres':        'SD',  'San Francisco Giants':    'SF',
  'Seattle Mariners':       'SEA', 'St. Louis Cardinals':     'STL', 'Tampa Bay Rays':          'TB',
  'Texas Rangers':          'TEX', 'Toronto Blue Jays':       'TOR', 'Washington Nationals':    'WSH',
  'Athletics':              'OAK',
};


/* ─────────────────────────────────────────────────────────────────
   5. FALLBACK STATS
   ───────────────────────────────────────────────────────────────── */
const PITCHER_POS = new Set(['P', 'SP', 'RP', 'CP']);

const FALLBACK_STATS = {
  'SP':    { stat1: 12,   stat2: 3.45, stat3: 185, labels: ['W', 'ERA', 'K'] },
  'RP':    { stat1: 3,    stat2: 2.85, stat3: 65,  labels: ['W', 'ERA', 'K'] },
  'C':     { stat1: .265, stat2: 18,   stat3: 64,  labels: ['AVG', 'HR', 'RBI'] },
  '1B':    { stat1: .278, stat2: 28,   stat3: 88,  labels: ['AVG', 'HR', 'RBI'] },
  '2B':    { stat1: .268, stat2: 16,   stat3: 62,  labels: ['AVG', 'HR', 'RBI'] },
  '3B':    { stat1: .272, stat2: 22,   stat3: 80,  labels: ['AVG', 'HR', 'RBI'] },
  'SS':    { stat1: .265, stat2: 18,   stat3: 66,  labels: ['AVG', 'HR', 'RBI'] },
  'SS/OF': { stat1: .293, stat2: 35,   stat3: 95,  labels: ['AVG', 'HR', 'RBI'] },
  'LF':    { stat1: .270, stat2: 20,   stat3: 74,  labels: ['AVG', 'HR', 'RBI'] },
  'CF':    { stat1: .268, stat2: 19,   stat3: 68,  labels: ['AVG', 'HR', 'RBI'] },
  'RF':    { stat1: .275, stat2: 25,   stat3: 82,  labels: ['AVG', 'HR', 'RBI'] },
  'DH':    { stat1: .280, stat2: 32,   stat3: 98,  labels: ['AVG', 'HR', 'RBI'] },
  'DH/P':  { stat1: .310, stat2: 44,   stat3: 101, labels: ['AVG', 'HR', 'RBI'] },
};

function generateFallbackStats(player) {
  const base = FALLBACK_STATS[player.position] || FALLBACK_STATS['CF'];
  const mult = 0.82 + (player.tier - 1) * 0.09;
  return {
    stat1: typeof base.stat1 === 'number' && base.stat1 < 1
      ? parseFloat((base.stat1 * (0.96 + player.tier * 0.01) + (Math.random() - 0.5) * 0.018).toFixed(3))
      : Math.round(base.stat1 * mult + (Math.random() - 0.5) * 5),
    stat2: typeof base.stat2 === 'number' && base.stat2 < 1
      ? parseFloat((base.stat2 * mult).toFixed(2))
      : parseFloat((base.stat2 * mult + (Math.random() - 0.5) * 0.3).toFixed(2)),
    stat3: Math.round(base.stat3 * mult + (Math.random() - 0.5) * 10),
    labels: base.labels,
  };
}


/* ─────────────────────────────────────────────────────────────────
   6. MLB API  (headshot + stats fetch)
   ───────────────────────────────────────────────────────────────── */
function headshotUrl(id) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;
}

async function fetchPlayerStats(playerId) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    const res = await fetch(
      `${CONFIG.MLB_API}/people/${playerId}?hydrate=currentTeam,stats(group=[hitting,pitching],type=yearByYear)`,
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
    const lastH = (hitting?.splits  || []).filter(s => s.season === CONFIG.SEASON).pop();
    const lastP = (pitching?.splits || []).filter(s => s.season === CONFIG.SEASON).pop();

    return {
      name:     person.fullName         || null,
      position: person.primaryPosition?.abbreviation || null,
      teamName: person.currentTeam?.name || null,
      teamAbbr: person.currentTeam?.abbreviation || null,
      hitting:  lastH?.stat  || null,
      pitching: lastP?.stat  || null,
    };
  } catch (_) {
    return null;
  }
}

async function loadAllPlayerData() {
  showLoading(true);
  const results = await Promise.allSettled(PLAYER_POOL.map(p => fetchPlayerStats(p.id)));

  STATE.enrichedPlayers = PLAYER_POOL.map((seed, i) => {
    const api = results[i].status === 'fulfilled' ? results[i].value : null;

    const name     = api?.name     || seed.name;
    const position = api?.position || seed.position;
    const teamName = api?.teamName || seed.teamName;
    const teamAbbr = TEAM_ABBR_MAP[teamName] || api?.teamAbbr || seed.teamAbbr;

    let stats;
    const isPitcher = PITCHER_POS.has(position);
    if (api) {
      if (isPitcher && api.pitching) {
        const era = parseFloat(api.pitching.era ?? '--');
        stats = {
          stat1: api.pitching.wins ?? 0,
          stat2: isNaN(era) ? '--' : era.toFixed(2),
          stat3: api.pitching.strikeOuts ?? 0,
          labels: ['W', 'ERA', 'K'],
        };
      } else if (!isPitcher && api.hitting) {
        const avg = parseFloat(api.hitting.avg ?? '--');
        stats = {
          stat1: isNaN(avg) ? '--' : avg.toFixed(3).replace(/^0/, ''),
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
      id: seed.id, name, teamName, teamAbbr, position,
      image: headshotUrl(seed.id), tier: seed.tier, stats,
    };
  });

  STATE.dataReady = true;
  showLoading(false);
  updateCollectionBadge();
}


/* ─────────────────────────────────────────────────────────────────
   7. RARITY SYSTEM
   ───────────────────────────────────────────────────────────────── */
const RARITY_WEIGHTS = {
  common: {
    1: { common: 100 },
    2: { common: 90, rare: 10 },
    3: { common: 75, rare: 25 },
    4: { common: 55, rare: 45 },
  },
  rare: {
    1: { common: 15, rare: 85 },
    2: { rare: 88, epic: 12 },
    3: { rare: 60, epic: 40 },
    4: { rare: 30, epic: 65, legendary: 5 },
  },
  epic_plus: {
    1: { rare: 35, epic: 65 },
    2: { epic: 78, legendary: 22 },
    3: { epic: 50, legendary: 50 },
    4: { epic: 15, legendary: 85 },
  },
  guaranteed_legendary: {
    1: { legendary: 100 },
    2: { legendary: 100 },
    3: { legendary: 100 },
    4: { legendary: 100 },
  },
};

function pickWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
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
    common:               { 1: 45, 2: 35, 3: 15, 4: 5 },
    rare:                 { 1: 10, 2: 30, 3: 40, 4: 20 },
    epic_plus:            { 1: 2,  2: 15, 3: 38, 4: 45 },
    guaranteed_legendary: { 1: 0,  2: 5,  3: 35, 4: 60 },
  };
  const weights = tierWeights[slotType] || tierWeights.common;
  const tier = parseInt(pickWeighted(weights), 10);
  const pool = STATE.enrichedPlayers.filter(p => p.tier === tier && !usedIds.includes(p.id));
  if (pool.length) return pool[Math.floor(Math.random() * pool.length)];
  const fallback = STATE.enrichedPlayers.filter(p => !usedIds.includes(p.id));
  if (fallback.length) return fallback[Math.floor(Math.random() * fallback.length)];
  return STATE.enrichedPlayers[Math.floor(Math.random() * STATE.enrichedPlayers.length)];
}

function buildPack(packType) {
  const config = CONFIG.PACK_TYPES[packType];
  if (!config) return [];
  const cards = [], usedIds = [];
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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


/* ─────────────────────────────────────────────────────────────────
   8. CARD DESCRIPTORS & FUN FACTS
   ───────────────────────────────────────────────────────────────── */
function deriveDescriptor(player) {
  const isPitcher = PITCHER_POS.has(player.position);
  const s = player.stats;
  if (isPitcher) {
    const era = parseFloat(s.stat2);
    const k   = parseInt(s.stat3, 10);
    if (!isNaN(era) && !isNaN(k)) {
      if (era <= 2.50 && k >= 180) return '🔥 Ace · Strikeout Machine';
      if (era <= 2.50)             return '⚡ Dominant Ace';
      if (era <= 3.25 && k >= 150) return '💨 Power Pitcher';
      if (era <= 3.25)             return '🎯 Solid Starter';
      if (k >= 150)                return '💪 High-K Arm';
      return '⚾ Rotation Piece';
    }
  } else {
    const avg = parseFloat(s.stat1);
    const hr  = parseInt(s.stat2, 10);
    if (!isNaN(avg) && !isNaN(hr)) {
      if (avg >= .300 && hr >= 40)  return '🌟 Five-Tool Superstar';
      if (avg >= .300 && hr >= 25)  return '💥 Contact & Power';
      if (avg >= .300)              return '🎯 Pure Hitter';
      if (hr >= 45)                 return '💣 Home Run Machine';
      if (hr >= 30)                 return '🔨 Run Producer';
      if (avg >= .275)              return '⚾ Reliable Bat';
      return '🏃 Everyday Player';
    }
  }
  return '⚾ Ball Player';
}

const PLAYER_FUN_FACTS = {
  660670: 'Shohei can pitch AND hit — only 2nd player in MLB history to do both at this level!',
  592450: 'Mike Trout has won 3 MVP awards — he\'s been one of the best players ever!',
  605141: 'Mookie Betts played shortstop AND outfield — he can do it all!',
  596019: 'Freddie Freeman hit a walk-off grand slam in the 2024 World Series!',
  641355: 'Juan Soto draws so many walks, pitchers are scared to throw him strikes!',
  665742: 'Ronald Acuña Jr. hit 40 homers AND stole 70 bases in the same season — insane!',
  682998: 'Elly De La Cruz stands 6\'5\" and throws pitches off the ground at 97 mph!',
  545361: 'Aaron Judge hit 62 home runs in 2022 — the American League ALL-TIME record!',
  686679: 'Paul Skenes had a 1.97 ERA in 2024 — arguably the best Pirates pitcher ever!',
  671096: 'Bobby Witt Jr. hits, fields, and steals like a superhero at shortstop!',
  673357: 'Gunnar Henderson was the #1 baseball prospect in the entire country!',
  694497: 'Jackson Chourio became one of the best outfielders at just 20 years old!',
  607043: 'Bryce Harper switched to first base after injury and became even better!',
  543760: 'Jose Ramirez was once told he was too small for baseball — look at him now!',
  641703: 'Vlad Guerrero Jr. is 250 lbs and STILL hits for a .300 average — pure power!',
  641355: 'Juan Soto got paid $765 million — the biggest contract in baseball history!',
  650402: 'Pete Alonso is known as the Polar Bear — he hits the ball REALLY far!',
};

function getFunFact(player, rarity) {
  if (rarity === 'legendary' || rarity === 'epic') {
    if (PLAYER_FUN_FACTS[player.id]) return PLAYER_FUN_FACTS[player.id];
    const facts = {
      'SP':  'Starting pitchers throw around 100 pitches per game at over 90 mph!',
      'RP':  'Relief pitchers can throw fastballs over 100 mph — faster than a car on the highway!',
      'C':   'Catchers squat down and stand up over 100 times per game. Total leg workout!',
      '1B':  'First basemen catch thousands of throws from infielders every single season!',
      '2B':  'Second basemen have to turn double plays in less than a second!',
      'SS':  'Shortstop is the hardest position on the field — you have to cover SO much ground!',
      '3B':  'Third base is called the "hot corner" — screaming line drives come at you fast!',
      'CF':  'Center fielders run more miles per game than any other position!',
      'RF':  'Right fielders have the strongest throwing arm in the outfield!',
      'LF':  'Left fielders hit some of the most home runs in all of baseball!',
      'DH':  'The Designated Hitter gets to focus on ONE thing: hitting the baseball HARD!',
      'DH/P': 'Two-way players pitch AND hit — the rarest skill in all of baseball!',
    };
    return facts[player.position] || 'One of the very best players in all of Major League Baseball!';
  }
  return null;
}


/* ─────────────────────────────────────────────────────────────────
   9. CARD GENERATION & RENDERING
   ───────────────────────────────────────────────────────────────── */
const RARITY_LABELS = {
  common:    'Common',
  rare:      'Rare',
  epic:      '✦ Epic',
  legendary: '★ Legendary',
};
const RARITY_ORDER = { legendary: 0, epic: 1, rare: 2, common: 3 };

function generateCard({ player, rarity }) {
  return {
    id:         `${player.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    playerId:   player.id,
    playerName: player.name,
    teamName:   player.teamName,
    teamAbbr:   player.teamAbbr,
    position:   player.position,
    image:      player.image,
    stats:      { stat1: player.stats.stat1, stat2: player.stats.stat2, stat3: player.stats.stat3 },
    statLabels: player.stats.labels,
    descriptor: deriveDescriptor(player),
    funFact:    getFunFact(player, rarity),
    rarity,
    pulledAt:   new Date().toISOString(),
  };
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatStatValue(val, labelIdx, labels) {
  if (val === null || val === undefined || val === '--') return '—';
  const label = labels?.[labelIdx];
  if (label === 'ERA') return parseFloat(val).toFixed(2);
  if (label === 'AVG') {
    const n = parseFloat(val);
    if (isNaN(n)) return val;
    return n.toFixed(3).replace(/^0/, '');
  }
  return val;
}

function renderCard(card, { mini = false, animate = false } = {}) {
  const el = document.createElement('div');
  el.className = ['card', mini ? 'mini' : '', animate ? 'reveal-enter' : ''].filter(Boolean).join(' ');
  el.dataset.rarity = card.rarity;
  el.dataset.cardId = card.id;

  const colors = TEAM_COLORS[card.teamAbbr] || { primary: '#1a2235', secondary: '#2d3a52' };
  const initials = card.playerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const teamPos = [card.teamAbbr, card.position].filter(Boolean).join(' · ');

  const s1 = formatStatValue(card.stats.stat1, 0, card.statLabels);
  const s2 = formatStatValue(card.stats.stat2, 1, card.statLabels);
  const s3 = formatStatValue(card.stats.stat3, 2, card.statLabels);

  const funFactHtml = (!mini && card.funFact)
    ? `<div class="card-fun-fact">${esc(card.funFact)}</div>` : '';

  el.innerHTML = `
    <div class="card-team-band" style="background:linear-gradient(180deg,${colors.primary}88 0%,${colors.secondary}33 100%)"></div>
    <div class="card-shimmer"></div>
    <div class="card-header">
      <span class="card-team-pos">${esc(teamPos)}</span>
      <span class="card-rarity-label">${RARITY_LABELS[card.rarity] || card.rarity}</span>
    </div>
    <div class="card-photo-area">
      <img class="card-player-photo"
        src="${esc(card.image)}"
        alt="${esc(card.playerName)}"
        loading="lazy"
        onerror="this.parentNode.innerHTML='<div class=\\'card-initials\\'>${initials}</div>'" />
    </div>
    <div class="card-body">
      <div class="card-player-name">${esc(card.playerName)}</div>
      <div class="card-position-badge">${esc(card.position)}</div>
      ${card.descriptor ? `<div class="card-descriptor">${esc(card.descriptor)}</div>` : ''}
      <div class="card-stats">
        <div class="card-stat">
          <div class="stat-val">${esc(String(s1))}</div>
          <div class="stat-label">${esc(card.statLabels[0] || '')}</div>
        </div>
        <div class="card-stat">
          <div class="stat-val">${esc(String(s2))}</div>
          <div class="stat-label">${esc(card.statLabels[1] || '')}</div>
        </div>
        <div class="card-stat">
          <div class="stat-val">${esc(String(s3))}</div>
          <div class="stat-label">${esc(card.statLabels[2] || '')}</div>
        </div>
      </div>
    </div>
    ${funFactHtml}
    <div class="card-footer">
      <span class="card-series">2024 STATS</span>
      <span class="card-serial">#${card.id.slice(-6).toUpperCase()}</span>
    </div>
  `;

  if (mini) el.addEventListener('click', () => openCardModal(card));
  return el;
}


/* ─────────────────────────────────────────────────────────────────
   10. COLLECTION  (safeStorage)
   ───────────────────────────────────────────────────────────────── */
function loadCollection() {
  try { return JSON.parse(safeStorage.getItem(CONFIG.STORAGE_KEY) || '[]'); }
  catch (_) { return []; }
}
function saveCollection(c) {
  try { safeStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(c)); } catch (_) {}
}
function addCardsToCollection(cards) {
  const c = loadCollection();
  c.push(...cards);
  saveCollection(c);
  updateCollectionBadge();
}
function loadStats() {
  try { return JSON.parse(safeStorage.getItem(CONFIG.STATS_KEY) || '{"packsOpened":0}'); }
  catch (_) { return { packsOpened: 0 }; }
}
function saveStats(s) {
  try { safeStorage.setItem(CONFIG.STATS_KEY, JSON.stringify(s)); } catch (_) {}
}
function recordPackOpened() {
  const s = loadStats();
  s.packsOpened = (s.packsOpened || 0) + 1;
  saveStats(s);
}
function updateCollectionBadge() {
  const count = loadCollection().length;
  const hdrEl = document.getElementById('hdr-card-count');
  if (hdrEl) hdrEl.textContent = count;
  const badge = document.getElementById('nav-badge');
  if (badge) {
    if (count > 0) { badge.textContent = count; badge.classList.remove('hidden'); }
    else             badge.classList.add('hidden');
  }
}


/* ─────────────────────────────────────────────────────────────────
   11. SCREEN NAVIGATION  (opacity fade with .active/.exiting)
   ───────────────────────────────────────────────────────────────── */
function navigateTo(screenId) {
  if (STATE.transitioning || STATE.currentScreen === screenId) return;
  STATE.transitioning = true;

  const leaving = document.getElementById(STATE.currentScreen);
  const arriving = document.getElementById(screenId);
  if (!arriving) { STATE.transitioning = false; return; }

  if (leaving) {
    leaving.classList.add('exiting');
    setTimeout(() => {
      leaving.classList.remove('active', 'exiting');
      arriving.classList.add('active');
      STATE.currentScreen = screenId;
      STATE.transitioning = false;
      // Scroll new screen to top
      arriving.scrollTop = 0;
    }, 300);
  } else {
    arriving.classList.add('active');
    STATE.currentScreen = screenId;
    STATE.transitioning = false;
  }
}

function showPhase(phaseId) {
  document.querySelectorAll('.open-phase').forEach(el => {
    el.classList.add('hidden');
  });
  const target = document.getElementById(phaseId);
  if (target) target.classList.remove('hidden');
}


/* ─────────────────────────────────────────────────────────────────
   12. PACK OPENING FLOW
   ───────────────────────────────────────────────────────────────── */
function startPackOpening() {
  if (!STATE.dataReady) {
    showToast('⏳ Still loading player data — one more second!');
    return;
  }
  const packType = STATE.selectedPack;
  const packTuples = buildPack(packType);
  STATE.currentPack = packTuples.map(t => generateCard(t));
  STATE.revealIndex = 0;

  // Update mega-pack labels
  const label = packType.charAt(0).toUpperCase() + packType.slice(1);
  const packTypeLabel = document.getElementById('pack-type-label');
  const megaPackName  = document.getElementById('mega-pack-name');
  const megaPack      = document.getElementById('mega-pack');
  if (packTypeLabel) packTypeLabel.textContent = label.toUpperCase() + ' PACK';
  if (megaPackName)  megaPackName.textContent  = label.toUpperCase();
  if (megaPack) {
    megaPack.dataset.rarity = packType;
    megaPack.classList.remove('tearing');
  }

  // Build pips
  const pipsContainer = document.getElementById('reveal-pips');
  if (pipsContainer) {
    pipsContainer.innerHTML = '';
    for (let i = 0; i < STATE.currentPack.length; i++) {
      const pip = document.createElement('span');
      pip.className   = 'pip';
      pip.dataset.idx = i;
      pipsContainer.appendChild(pip);
    }
  }

  navigateTo('screen-opening');
  showPhase('phase-pack');
}

function tearPack() {
  const megaPack = document.getElementById('mega-pack');
  if (!megaPack || megaPack.classList.contains('tearing')) return;
  haptic();
  megaPack.classList.add('tearing');

  // Screen shake
  screenShake();

  setTimeout(() => {
    showPhase('phase-reveal');
    beginFlipSequence();
  }, 680);
}

function beginFlipSequence() {
  const card = STATE.currentPack[STATE.revealIndex];
  if (!card) return;

  const total = STATE.currentPack.length;
  const counterEl = document.getElementById('reveal-counter');
  if (counterEl) counterEl.textContent = `Card ${STATE.revealIndex + 1} of ${total}`;

  // Update pips
  document.querySelectorAll('.pip').forEach((pip, i) => {
    pip.classList.toggle('done',   i < STATE.revealIndex);
    pip.classList.toggle('active', i === STATE.revealIndex);
  });

  // Reset flip card — show back
  const flipCard = document.getElementById('flip-card');
  const flipFront = document.getElementById('flip-front');
  if (!flipCard || !flipFront) return;

  flipCard.classList.remove('flipped');
  flipFront.innerHTML = '';

  // Inject card content into front face
  const cardEl = renderCard(card, { mini: false, animate: false });
  flipFront.appendChild(cardEl);

  // Flip to reveal after 600ms
  setTimeout(() => {
    flipCard.classList.add('flipped');

    // Trigger rarity effects AFTER flip starts
    setTimeout(() => {
      triggerRarityEffects(card.rarity);
    }, 200);
  }, 600);

  // Update next button label
  const isLast = STATE.revealIndex >= total - 1;
  const nextLabel = document.getElementById('reveal-next-label');
  if (nextLabel) nextLabel.textContent = isLast ? '🎉 See My Pack!' : 'Next Card →';
}

function advanceReveal() {
  STATE.revealIndex++;
  if (STATE.revealIndex >= STATE.currentPack.length) {
    showPackSummary();
  } else {
    // Reset and show next card
    const flipCard = document.getElementById('flip-card');
    if (flipCard) flipCard.classList.remove('flipped');
    setTimeout(() => beginFlipSequence(), 350);
  }
}

function showPackSummary() {
  showPhase('phase-summary');
  addCardsToCollection(STATE.currentPack);
  recordPackOpened();

  const legCount  = STATE.currentPack.filter(c => c.rarity === 'legendary').length;
  const epicCount = STATE.currentPack.filter(c => c.rarity === 'epic').length;

  let headline = '🎉 Pack Complete!';
  if (legCount > 0)      headline = '🏆 LEGENDARY PULL!';
  else if (epicCount > 0) headline = '✦ Epic Pack!';

  const headlineEl = document.getElementById('summary-headline');
  const subEl      = document.getElementById('summary-sub');
  if (headlineEl) headlineEl.textContent = headline;

  const subtitleParts = [];
  if (legCount > 0)  subtitleParts.push(`${legCount} Legendary${legCount > 1 ? 's' : ''}!`);
  if (epicCount > 0) subtitleParts.push(`${epicCount} Epic${epicCount > 1 ? 's' : ''}`);
  if (subEl) subEl.textContent = subtitleParts.length > 0 ? subtitleParts.join(' · ') : "Here's what you pulled!";

  if (legCount > 0) {
    launchConfetti(120, ['#f59e0b', '#fbbf24', '#fff', '#ff6b35', '#ef4444']);
  } else if (epicCount > 0) {
    launchConfetti(60, ['#a855f7', '#c084fc', '#d8b4fe', '#fff']);
  }

  const grid = document.getElementById('summary-cards');
  if (grid) {
    grid.innerHTML = '';
    const sorted = [...STATE.currentPack].sort((a, b) =>
      (RARITY_ORDER[a.rarity] || 3) - (RARITY_ORDER[b.rarity] || 3)
    );
    sorted.forEach(card => grid.appendChild(renderCard(card, { mini: true })));
  }
}

function triggerRarityEffects(rarity) {
  if (rarity === 'legendary') {
    spawnRarityOverlay('legendary', '★ LEGENDARY! ★');
    screenShake();
    haptic([40, 30, 80]);
    launchConfetti(90, ['#f59e0b', '#fbbf24', '#eab308', '#fde68a', '#fff', '#ff6b35']);
    spawnParticles(['#f59e0b', '#fbbf24', '#fff'], 20);
  } else if (rarity === 'epic') {
    spawnRarityOverlay('epic', '✦ EPIC!');
    haptic([30, 20, 40]);
    launchConfetti(40, ['#a855f7', '#c084fc', '#d8b4fe', '#fff']);
    spawnParticles(['#a855f7', '#c084fc'], 10);
  } else if (rarity === 'rare') {
    spawnRarityOverlay('rare', '◆ RARE!');
    haptic(30);
    launchConfetti(18, ['#3b82f6', '#60a5fa', '#93c5fd', '#fff']);
  }
}


/* ─────────────────────────────────────────────────────────────────
   13. SPECIAL EFFECTS
   ───────────────────────────────────────────────────────────────── */
function spawnRarityOverlay(rarity, text) {
  const overlay = document.getElementById('reveal-overlay');
  const textEl  = document.getElementById('overlay-text');
  if (!overlay || !textEl) return;

  // Remove existing rarity classes
  overlay.classList.remove('legendary-reveal', 'epic-reveal', 'rare-reveal', 'hidden');
  textEl.textContent = text;

  // Add the rarity class that drives the CSS animation
  if (rarity === 'legendary') overlay.classList.add('legendary-reveal');
  else if (rarity === 'epic') overlay.classList.add('epic-reveal');
  else if (rarity === 'rare') overlay.classList.add('rare-reveal');

  // Force reflow to restart CSS animation
  void overlay.offsetWidth;

  // Hide after animation completes (~1.4s)
  setTimeout(() => {
    overlay.classList.add('hidden');
    overlay.classList.remove('legendary-reveal', 'epic-reveal', 'rare-reveal');
  }, 1500);
}

function screenShake() {
  document.body.classList.remove('shake');
  // Force reflow
  void document.body.offsetWidth;
  document.body.classList.add('shake');
  setTimeout(() => document.body.classList.remove('shake'), 600);
}

function haptic(pattern = 40) {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(Array.isArray(pattern) ? pattern : [pattern]);
    }
  } catch (_) {}
}

function launchConfetti(count = 60, colors = ['#f59e0b', '#3b82f6', '#ef4444', '#22c55e', '#fff']) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height * 0.4 - 50,
      vx:     (Math.random() - 0.5) * 5,
      vy:     Math.random() * 3 + 2,
      rot:    Math.random() * Math.PI * 2,
      rotV:   (Math.random() - 0.5) * 0.2,
      w:      Math.random() * 10 + 5,
      h:      Math.random() * 5 + 3,
      color:  colors[Math.floor(Math.random() * colors.length)],
      alpha:  1,
      life:   Math.random() * 60 + 60,
      lifeMax: 0,
    });
    particles[particles.length - 1].lifeMax = particles[particles.length - 1].life;
  }

  let frame = 0;
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of particles) {
      if (p.life <= 0) continue;
      alive = true;
      p.x  += p.vx;
      p.y  += p.vy;
      p.vy += 0.12;
      p.rot += p.rotV;
      p.life--;
      p.alpha = p.life / p.lifeMax;

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive && frame < 200) {
      frame++;
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }
  requestAnimationFrame(animate);
}

function spawnParticles(colors = ['#f59e0b'], count = 12) {
  const flipScene = document.getElementById('flip-scene');
  if (!flipScene) return;
  const rect = flipScene.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top  + rect.height / 2;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position: fixed;
      left: ${cx}px;
      top:  ${cy}px;
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: 50%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(p);
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist  = 80 + Math.random() * 140;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 },
    ], { duration: 700 + Math.random() * 300, easing: 'cubic-bezier(0,.9,.57,1)', fill: 'forwards' })
      .onfinish = () => p.remove();
  }
}

/* Stadium canvas — animated starfield + floating particles */
function initStadiumCanvas() {
  const canvas = document.getElementById('stadium-canvas');
  if (!canvas) return;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const ctx = canvas.getContext('2d');
  const stars = [];
  const STAR_COUNT = 120;

  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height * 0.65,
      r:     Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.003 + 0.001,
      phase: Math.random() * Math.PI * 2,
    });
  }

  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.016;

    for (const s of stars) {
      const twinkle = Math.sin(t * s.speed * 60 + s.phase) * 0.3 + s.alpha;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0.05, twinkle)})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }
  draw();
}

/* Card ticker — scrolling player names at hero screen bottom */
function initCardTicker() {
  const ticker = document.getElementById('card-ticker');
  if (!ticker) return;

  const players = PLAYER_POOL.map(p => `⚾ ${p.name} · ${p.teamAbbr}`);
  // Duplicate for seamless scroll
  const inner = document.createElement('div');
  inner.className = 'ticker-inner';
  [...players, ...players].forEach(t => {
    const span = document.createElement('span');
    span.className = 'ticker-item';
    span.textContent = t;
    inner.appendChild(span);
  });
  ticker.innerHTML = '';
  ticker.appendChild(inner);
}


/* ─────────────────────────────────────────────────────────────────
   14. COLLECTION VIEW
   ───────────────────────────────────────────────────────────────── */
let collFilter = 'all';
let collSort   = 'newest';

function renderCollectionView() {
  let cards = loadCollection();
  const total = cards.length;

  const subEl = document.getElementById('coll-sub');
  if (subEl) subEl.textContent = `${total} card${total !== 1 ? 's' : ''}`;

  // Filter
  if (collFilter !== 'all') cards = cards.filter(c => c.rarity === collFilter);

  // Sort
  if (collSort === 'newest') cards.sort((a, b) => new Date(b.pulledAt) - new Date(a.pulledAt));
  else if (collSort === 'rarity') cards.sort((a, b) => (RARITY_ORDER[a.rarity] || 3) - (RARITY_ORDER[b.rarity] || 3));
  else if (collSort === 'team')   cards.sort((a, b) => (a.teamAbbr || '').localeCompare(b.teamAbbr || ''));
  else if (collSort === 'name')   cards.sort((a, b) => a.playerName.localeCompare(b.playerName));

  const grid  = document.getElementById('coll-grid');
  const empty = document.getElementById('coll-empty');
  if (!grid) return;

  if (cards.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  grid.innerHTML = '';
  cards.forEach(card => grid.appendChild(renderCard(card, { mini: true })));
}

function openCardModal(card) {
  const modal = document.getElementById('card-modal');
  const slot  = document.getElementById('modal-card-slot');
  if (!modal || !slot) return;
  slot.innerHTML = '';
  slot.appendChild(renderCard(card, { mini: false }));
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeCardModal() {
  const modal = document.getElementById('card-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.style.overflow = '';
}


/* ─────────────────────────────────────────────────────────────────
   15. STATS VIEW
   ───────────────────────────────────────────────────────────────── */
function renderPackStatsView() {
  const cards = loadCollection();
  const stats = loadStats();
  const total = cards.length;
  const packsOpened = stats.packsOpened || 0;

  const unique   = new Set(cards.map(c => c.playerId)).size;
  const legends  = cards.filter(c => c.rarity === 'legendary').length;
  const epics    = cards.filter(c => c.rarity === 'epic').length;
  const rares    = cards.filter(c => c.rarity === 'rare').length;
  const commons  = cards.filter(c => c.rarity === 'common').length;

  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setText('kpi-packs',   packsOpened);
  setText('kpi-cards',   total);
  setText('kpi-legends', legends);
  setText('kpi-unique',  unique);

  // Rarity bars
  const barsEl = document.getElementById('rarity-bars');
  if (barsEl && total > 0) {
    barsEl.innerHTML = '';
    const rarityCounts = [
      { label: '★ Legendary', count: legends, cls: 'legendary' },
      { label: '✦ Epic',      count: epics,   cls: 'epic' },
      { label: 'Rare',        count: rares,   cls: 'rare' },
      { label: 'Common',      count: commons, cls: 'common' },
    ];
    rarityCounts.forEach(({ label, count, cls }) => {
      const pct = total > 0 ? (count / total * 100).toFixed(1) : 0;
      const row = document.createElement('div');
      row.className = 'rbar-row';
      row.innerHTML = `
        <span class="rbar-label">${label}</span>
        <div class="rbar-track">
          <div class="rbar-fill ${cls}" style="width:0%"></div>
        </div>
        <span class="rbar-count">${count}</span>`;
      barsEl.appendChild(row);
      // Animate bar after paint
      requestAnimationFrame(() => {
        const fill = row.querySelector('.rbar-fill');
        if (fill) fill.style.width = pct + '%';
      });
    });
  }

  // Best pulls (top 6 by rarity)
  const bestGrid = document.getElementById('best-grid');
  const bestSec  = document.getElementById('best-pulls-section');
  if (bestGrid) {
    const sorted = [...cards].sort((a, b) =>
      (RARITY_ORDER[a.rarity] || 3) - (RARITY_ORDER[b.rarity] || 3)
    ).slice(0, 6);

    if (sorted.length > 0) {
      bestGrid.innerHTML = '';
      sorted.forEach(card => bestGrid.appendChild(renderCard(card, { mini: true })));
      if (bestSec) bestSec.classList.remove('hidden');
    } else {
      if (bestSec) bestSec.classList.add('hidden');
    }
  }
}


/* ─────────────────────────────────────────────────────────────────
   16. LOADING & TOAST
   ───────────────────────────────────────────────────────────────── */
function showLoading(on) {
  const el = document.getElementById('loading-veil');
  if (el) {
    if (on) el.classList.remove('hidden');
    else    el.classList.add('hidden');
  }
}

let toastTimer;
function showToast(msg, duration = 2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, duration);
}


/* ─────────────────────────────────────────────────────────────────
   17. SWIPE SUPPORT
   ───────────────────────────────────────────────────────────────── */
let touchStartX = 0, touchStartY = 0;

function initSwipe(el, onSwipeLeft, onTap) {
  if (!el) return;
  el.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  el.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx < 0 && onSwipeLeft) onSwipeLeft();
    } else if (Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      // Tap
      if (onTap) onTap();
    }
  }, { passive: true });
}


/* ─────────────────────────────────────────────────────────────────
   18. PACK TILE SELECTION
   ───────────────────────────────────────────────────────────────── */
function initPackTileSelection() {
  const tiles = document.querySelectorAll('.pack-tile');
  tiles.forEach(tile => {
    tile.addEventListener('click', () => {
      tiles.forEach(t => {
        t.classList.remove('selected');
        t.setAttribute('aria-checked', 'false');
      });
      tile.classList.add('selected');
      tile.setAttribute('aria-checked', 'true');
      STATE.selectedPack = tile.dataset.pack;
    });
  });
}


/* ─────────────────────────────────────────────────────────────────
   19. EVENT LISTENERS
   ───────────────────────────────────────────────────────────────── */
function initEventListeners() {

  // Hero — RIP IT button
  const ripBtn = document.getElementById('rip-btn');
  if (ripBtn) ripBtn.addEventListener('click', startPackOpening);

  // Hero — nav buttons
  const btnCollection = document.getElementById('btn-collection');
  if (btnCollection) btnCollection.addEventListener('click', () => {
    renderCollectionView();
    navigateTo('screen-collection');
  });

  const btnStats = document.getElementById('btn-stats');
  if (btnStats) btnStats.addEventListener('click', () => {
    renderPackStatsView();
    navigateTo('screen-stats');
  });

  // Pack opening — mega pack tap
  const megaPack = document.getElementById('mega-pack');
  if (megaPack) {
    megaPack.addEventListener('click', tearPack);
    initSwipe(megaPack, null, tearPack);
  }

  // Reveal — next card button
  const revealNextBtn = document.getElementById('reveal-next-btn');
  if (revealNextBtn) revealNextBtn.addEventListener('click', advanceReveal);

  // Reveal — swipe flip-scene
  const flipScene = document.getElementById('flip-scene');
  initSwipe(flipScene, advanceReveal, advanceReveal);

  // Summary — open another
  const btnOpenAnother = document.getElementById('btn-open-another');
  if (btnOpenAnother) btnOpenAnother.addEventListener('click', () => {
    navigateTo('screen-hero');
  });

  // Summary — go to collection
  const btnGotoCollection = document.getElementById('btn-goto-collection');
  if (btnGotoCollection) btnGotoCollection.addEventListener('click', () => {
    renderCollectionView();
    navigateTo('screen-collection');
  });

  // Collection — back
  const btnCollBack = document.getElementById('btn-coll-back');
  if (btnCollBack) btnCollBack.addEventListener('click', () => navigateTo('screen-hero'));

  // Collection — empty state open pack
  const btnEmptyOpen = document.getElementById('btn-empty-open');
  if (btnEmptyOpen) btnEmptyOpen.addEventListener('click', () => navigateTo('screen-hero'));

  // Collection — filter pills
  const filterPills = document.querySelectorAll('[data-filter]');
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      collFilter = pill.dataset.filter;
      renderCollectionView();
    });
  });

  // Collection — sort
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.addEventListener('change', () => {
    collSort = sortSelect.value;
    renderCollectionView();
  });

  // Stats — back
  const btnStatsBack = document.getElementById('btn-stats-back');
  if (btnStatsBack) btnStatsBack.addEventListener('click', () => navigateTo('screen-hero'));

  // Modal — close
  const modalClose = document.getElementById('modal-close');
  if (modalClose) modalClose.addEventListener('click', closeCardModal);

  const modal = document.getElementById('card-modal');
  if (modal) modal.addEventListener('click', e => {
    if (e.target === modal) closeCardModal();
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('card-modal');
      if (modal && !modal.classList.contains('hidden')) { closeCardModal(); return; }
      if (STATE.currentScreen !== 'screen-hero') navigateTo('screen-hero');
    }
    if (e.key === 'ArrowRight' && STATE.currentScreen === 'screen-opening') {
      const phaseReveal = document.getElementById('phase-reveal');
      if (phaseReveal && !phaseReveal.classList.contains('hidden')) advanceReveal();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (STATE.currentScreen === 'screen-opening') {
        const phasePack = document.getElementById('phase-pack');
        if (phasePack && !phasePack.classList.contains('hidden')) { e.preventDefault(); tearPack(); }
      }
    }
  });

  // Pack tile selection
  initPackTileSelection();
}


/* ─────────────────────────────────────────────────────────────────
   20. INIT
   ───────────────────────────────────────────────────────────────── */
function init() {
  initStadiumCanvas();
  initCardTicker();
  initEventListeners();
  updateCollectionBadge();

  // Kick off API load — non-blocking
  loadAllPlayerData().catch(err => {
    console.warn('Diamond Pulls: API load failed, using fallback data', err);
    // Mark ready with fallback data only
    if (!STATE.dataReady) {
      STATE.enrichedPlayers = PLAYER_POOL.map(seed => ({
        ...seed,
        image: headshotUrl(seed.id),
        stats: generateFallbackStats(seed),
      }));
      STATE.dataReady = true;
      showLoading(false);
      updateCollectionBadge();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
