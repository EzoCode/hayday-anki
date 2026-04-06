/* =============================================================
   ADFarm — Hay Day Clone JavaScript
   SPRITES object is injected before this script by Python
   ============================================================= */

let farmData = {};
let _staticDefs = {};  // Cached static definitions (item_catalog, building_defs, etc.)
let currentPanel = null;
let currentShopCategory = 'decorations';
let plantingPlotId = null;
let currentBoxIndex = null;
let wheelSpinning = false;
let notificationsEnabled = true;

// Called once on page load — caches static definitions that never change
function initDefs(defs) {
  _staticDefs = defs || {};
  // Apply real Hay Day background image if available
  applyHayDayAssets();
}

function applyHayDayAssets() {
  // Inject SVG icons for missing sprites (truck, wheel, gear)
  if (typeof SPRITES !== 'undefined') {
    if (!SPRITES['_icon_truck']) {
      SPRITES['_icon_truck'] = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='1' y='7' width='14' height='9' rx='1.5' fill='%23d4a056'/%3E%3Crect x='2' y='7.5' width='12' height='2' rx='.8' fill='%23e8c87a' opacity='.4'/%3E%3Cpath d='M15 10h4l3 3v3h-7z' fill='%238b5e3c'/%3E%3Cpath d='M15 10h4l3 3h-7z' fill='%23a0724a'/%3E%3Crect x='1' y='15.5' width='21' height='1' rx='.5' fill='%235a3520'/%3E%3Ccircle cx='5.5' cy='17.5' r='2.2' fill='%233a2510'/%3E%3Ccircle cx='5.5' cy='17.5' r='.8' fill='%238b6914'/%3E%3Ccircle cx='18.5' cy='17.5' r='2.2' fill='%233a2510'/%3E%3Ccircle cx='18.5' cy='17.5' r='.8' fill='%238b6914'/%3E%3C/svg%3E";
    }
    if (!SPRITES['_icon_wheel']) {
      SPRITES['_icon_wheel'] = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='10.5' fill='%238b5e3c'/%3E%3Ccircle cx='12' cy='12' r='9.5' fill='%23f4922a'/%3E%3Cpath d='M12 2.5v19M2.5 12h19' stroke='rgba(255,255,255,.45)' stroke-width='1'/%3E%3Cpath d='M5.3 5.3l13.4 13.4M18.7 5.3L5.3 18.7' stroke='rgba(255,255,255,.3)' stroke-width='1'/%3E%3Ccircle cx='12' cy='12' r='3' fill='%23ffd700' stroke='%23c5a200' stroke-width='.7'/%3E%3Ccircle cx='12' cy='12' r='1' fill='%23fff' opacity='.6'/%3E%3C/svg%3E";
    }
    if (!SPRITES['_icon_gear']) {
      SPRITES['_icon_gear'] = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='3.5' fill='none' stroke='%23d4a056' stroke-width='2'/%3E%3Cpath d='M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12' stroke='%23d4a056' stroke-width='2.2' stroke-linecap='round'/%3E%3C/svg%3E";
    }
  }
  // Background
  const bgSrc = S('hayday_background');
  if (bgSrc) {
    const world = document.getElementById('farm-world');
    if (world) world.style.backgroundImage = `url(${bgSrc})`;
  }
  // HUD XP bar background
  const xpBgSrc = S('hayday_xp_pbar_bg');
  if (xpBgSrc) {
    const xpEl = document.getElementById('xp-bar-bg-img');
    if (xpEl) { xpEl.src = xpBgSrc; xpEl.style.display = 'block'; }
  }
  // Coin icon from sprite
  const coinSrc = S('ui_coin');
  const coinEl = document.getElementById('coin-icon');
  if (coinSrc && coinEl) {
    coinEl.innerHTML = `<img src="${coinSrc}" width="16" height="16" style="vertical-align:middle;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))">`;
  } else if (coinEl) {
    coinEl.innerHTML = '<span class="css-coin"></span>';
  }
  // Gem icon from sprite
  const gemSrc = S('ui_gem');
  const gemEl = document.getElementById('gem-icon');
  if (gemSrc && gemEl) {
    gemEl.innerHTML = `<img src="${gemSrc}" width="15" height="15" style="vertical-align:middle;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))">`;
  } else if (gemEl) {
    gemEl.innerHTML = '<span class="css-gem"></span>';
  }
  // Streak fire — CSS fire icon
  const fireEl = document.getElementById('streak-fire-icon');
  if (fireEl) fireEl.innerHTML = '<span class="css-fire"></span>';
  // Settings gear — SVG icon
  const gearSrc = S('_icon_gear');
  const gearImg = document.getElementById('hud-settings-img');
  const gearFallback = document.getElementById('hud-settings-fallback');
  if (gearSrc && gearImg) {
    gearImg.src = gearSrc;
    gearImg.style.display = '';
    if (gearFallback) gearFallback.style.display = 'none';
  }
  // Level up overlay background
  const lvlBgSrc = S('hayday_new_level_bg');
  if (lvlBgSrc) {
    const lvlCard = document.querySelector('.levelup-card');
    if (lvlCard) {
      lvlCard.style.backgroundImage = `url(${lvlBgSrc})`;
      lvlCard.style.backgroundSize = 'cover';
      lvlCard.style.backgroundPosition = 'center';
    }
  }
  // Level up stars with real sprite
  const starSrc2 = S('hayday_star');
  const starsEl = document.getElementById('levelup-stars');
  if (starsEl && starSrc2) {
    const starImg = `<img src="${starSrc2}" width="28" height="28" style="vertical-align:middle;filter:drop-shadow(0 1px 3px rgba(0,0,0,.2))">`;
    starsEl.innerHTML = `${starImg} ${starImg} ${starImg}`;
  }
  // Toolbar icons — use sprites (with SVG fallbacks for missing ones)
  const toolbarIcons = {
    'icon-farm': {sprite: 'hayday_wheat_icon'},
    'icon-buildings': {sprite: 'hayday_barn'},
    'icon-inventory': {sprite: 'hayday_silo'},
    'icon-orders': {sprite: '_icon_truck'},
    'icon-shop': {sprite: 'hayday_shop'},
    'icon-achievements': {sprite: 'hayday_star'},
    'icon-wheel': {sprite: '_icon_wheel'},
  };
  for (const [elId, cfg] of Object.entries(toolbarIcons)) {
    const el = document.getElementById(elId);
    if (!el) continue;
    const src = S(cfg.sprite);
    if (src) {
      el.innerHTML = `<img src="${src}" width="24" height="24" style="object-fit:contain;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))">`;
    }
  }
  // Zone title icons using Hay Day sprites
  const zoneIcons = {
    'zone-title-fields': 'hayday_wheat_icon',
    'zone-title-workshop': 'hayday_barn',
    'zone-title-pasture': 'hayday_cow',
    'zone-title-village': 'hayday_scarecrow',
  };
  for (const [elId, sprKey] of Object.entries(zoneIcons)) {
    const src = S(sprKey);
    const el = document.getElementById(elId);
    if (src && el) {
      el.innerHTML = `<img src="${src}" width="18" height="18" style="vertical-align:middle;margin-right:4px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))"> ${el.textContent}`;
    }
  }
}

// --- Localization ---
const LANG = {
  farm: 'Ferme', build: 'Bâtir', bag: 'Sac', orders: 'Commandes',
  shop: 'Boutique', awards: 'Succès', wheel: 'Roue',
  harvest: 'Récolter !', wilted: 'Fané', planted: 'Planté',
  inventory: 'Inventaire', buildings: 'Bâtiments', settings: 'Réglages',
  plant_crop: 'Planter une culture', production: 'Production',
  session_complete: 'Session terminée !', level_up: 'Niveau supérieur !',
  daily_login: 'Bonus quotidien !', spin: 'Tourner !', collect: 'Récupérer !',
  continue_farming: 'Continuer !', deliver: 'Livrer !', missing_items: 'Items manquants',
  barn_full: 'Grange PLEINE ! Améliorez ou vendez.', silo_full: 'Silo PLEIN ! Améliorez ou vendez.',
  barn_almost: 'Grange presque pleine !', silo_almost: 'Silo presque plein !',
  no_orders: 'Pas encore de commandes.', review_to_earn: 'Révisez des cartes pour gagner des items !',
  fields: 'Champs', workshop: 'Atelier', pasture: 'Pâturage',
  decor: 'Déco', animals: 'Animaux', upgrade: 'Améliorer', land: 'Terrain',
  expand_farm: 'Agrandir la ferme', current: 'Actuel', deeds: 'Titres', permits: 'Permis',
  come_back: 'Revenez demain !', not_built: 'Non construit', tap_produce: 'Tapez pour produire',
  in_progress: 'En cours', recipes: 'Recettes', collect_all: 'Tout récupérer',
  cards: 'Cartes', coins_earned: 'Pièces gagnées', xp_earned: 'XP gagnés',
  streak_label: 'Série', done: 'Terminé !', plot_cleared: 'Parcelle nettoyée !',
  ready: 'Prêt !', sessions: 'sessions', session: 'session', won: 'Gagné',
  found: 'Trouvé', pieces: 'pièces', gemmes: 'gemmes', gems_label: 'gemmes',
  sell_all: 'Tout', need_label: 'Besoin', have_label: 'Possédé',
  review_to_grow: 'Révisez pour faire pousser', start: 'Commencer !',
  accuracy: 'Précision', total_reviews: 'Revisions totales',
  best_streak: 'Meilleure série', orders_done: 'Commandes livrées',
  harvests: 'Récoltes', items_sold: 'Items vendus', produced: 'Produits fabriqués',
  total_sessions_label: 'Sessions', coins_total: 'Pièces gagnées (total)',
  level_label: 'Niveau',
};

// --- Name helpers (use French defs from Python) ---
function buildingName(id) { const d = (farmData.building_defs||{})[id]; return d ? d.name : id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
function animalName(id) { const d = (farmData.animal_defs||{})[id]; return d ? d.name : id; }
function cropName(id) { const d = (farmData.crop_defs||{})[id]; return d ? d.name : id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
function decoName(id) { const d = (farmData.deco_defs||{})[id]; return d ? d.name : id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }
function itemName(id) { const c = (farmData.item_catalog||{})[id]; return c ? c.name : id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

// Safe parseInt wrapper
function safeInt(val, fallback) { const n = parseInt(val, 10); return isNaN(n) ? (fallback||0) : n; }

// --- Sound Manager ---
const SoundMgr = {
  enabled: true,
  musicEnabled: false,
  volume: 0.5,
  play(id) {
    if (!this.enabled) return;
    const el = document.getElementById(`snd-${id}`);
    if (el && el.src) { el.volume = this.volume; el.currentTime = 0; el.play().catch(()=>{}); }
  },
  playMusic() {
    if (!this.musicEnabled) return;
    const el = document.getElementById('snd-ambient');
    if (el && el.src) { el.volume = this.volume * 0.3; el.play().catch(()=>{}); }
  },
  stopMusic() {
    const el = document.getElementById('snd-ambient');
    if (el) { el.pause(); el.currentTime = 0; }
  }
};

function toggleSound(on) { SoundMgr.enabled = on; }
function toggleMusic(on) { SoundMgr.musicEnabled = on; if (on) SoundMgr.playMusic(); else SoundMgr.stopMusic(); }
function toggleNotifs(on) { notificationsEnabled = on; }
function toggleSettings() { showTab('settings'); }

// --- Sprite Helpers ---
function S(key) { return (typeof SPRITES !== 'undefined' && SPRITES[key]) ? SPRITES[key] : null; }
function img(key, w, h, cls) {
  const src = S(key);
  if (!src) return '';
  return `<img src="${src}" width="${w||48}" height="${h||48}" class="${cls||''}" draggable="false">`;
}

const CROP_SPRITE_MAP = {
  wheat:'wheat', corn:'corn', carrot:'turnip', tomato:'tomato',
  potato:'potato', sugarcane:'rice', soybean:'cassava',
  strawberry:'strawberry', apple:'orange', pumpkin:'melon',
};
function cropImg(id, stage, w) { const s = CROP_SPRITE_MAP[id]||id; return img(`crops_${s}_${stage}`, w||44, w||44, 'plot-crop'); }
function cropPortrait(id, w) { const s = CROP_SPRITE_MAP[id]||id; return img(`crops_${s}_portrait`, w||28, w||28); }

// --- Inline SVG Item Icons (replace emojis) ---
const ITEM_ICONS = {
  // Materials
  bolt: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='10' y='4' width='12' height='6' rx='1' fill='%23b0b0b0'/%3E%3Crect x='13' y='10' width='6' height='14' rx='1' fill='%23808080'/%3E%3Crect x='11' y='24' width='10' height='3' rx='1' fill='%23b0b0b0'/%3E%3Crect x='11' y='5' width='10' height='2' rx='.5' fill='%23d0d0d0' opacity='.5'/%3E%3C/svg%3E",
  plank: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='3' y='10' width='26' height='12' rx='2' fill='%23c9884a'/%3E%3Crect x='3' y='10' width='26' height='3' rx='1' fill='%23daa06d' opacity='.5'/%3E%3Cline x1='10' y1='10' x2='10' y2='22' stroke='%23a06a30' stroke-width='.5'/%3E%3Cline x1='20' y1='10' x2='20' y2='22' stroke='%23a06a30' stroke-width='.5'/%3E%3Ccircle cx='7' cy='16' r='1.5' fill='%23a06a30' opacity='.4'/%3E%3Ccircle cx='25' cy='16' r='1.5' fill='%23a06a30' opacity='.4'/%3E%3C/svg%3E",
  duct_tape: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%23808080'/%3E%3Ccircle cx='16' cy='16' r='6' fill='%23a0a0a0'/%3E%3Ccircle cx='16' cy='16' r='3' fill='%23d0d0d0'/%3E%3Cellipse cx='16' cy='11' rx='8' ry='2' fill='%23c0c0c0' opacity='.3'/%3E%3C/svg%3E",
  nail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='7' r='4' fill='%23b0b0b0'/%3E%3Crect x='14.5' y='11' width='3' height='16' rx='.5' fill='%23909090'/%3E%3Cpath d='M14.5 27 L16 30 L17.5 27' fill='%23707070'/%3E%3Cellipse cx='16' cy='6' rx='2.5' ry='1.5' fill='%23d0d0d0' opacity='.4'/%3E%3C/svg%3E",
  screw: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='7' r='5' fill='%23b0b0b0'/%3E%3Cline x1='13' y1='7' x2='19' y2='7' stroke='%23707070' stroke-width='1.5'/%3E%3Cline x1='16' y1='4' x2='16' y2='10' stroke='%23707070' stroke-width='1.5'/%3E%3Crect x='14.5' y='12' width='3' height='14' rx='.5' fill='%23909090'/%3E%3Cpath d='M14.5 16h3M14.5 19h3M14.5 22h3M14.5 25h3' stroke='%23707070' stroke-width='.8'/%3E%3C/svg%3E",
  paint: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='6' y='6' width='20' height='18' rx='2' fill='%23e74c3c'/%3E%3Crect x='6' y='6' width='20' height='5' rx='2' fill='%23c0392b'/%3E%3Crect x='14' y='2' width='4' height='6' rx='1' fill='%23808080'/%3E%3Crect x='7' y='7' width='8' height='3' rx='1' fill='%23f4796b' opacity='.4'/%3E%3C/svg%3E",
  land_deed: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='5' y='4' width='22' height='24' rx='2' fill='%23f5e6c8'/%3E%3Crect x='5' y='4' width='22' height='24' rx='2' fill='none' stroke='%23c9a66b' stroke-width='1.5'/%3E%3Cline x1='9' y1='10' x2='23' y2='10' stroke='%23a08050' stroke-width='1'/%3E%3Cline x1='9' y1='14' x2='23' y2='14' stroke='%23a08050' stroke-width='1'/%3E%3Cline x1='9' y1='18' x2='18' y2='18' stroke='%23a08050' stroke-width='1'/%3E%3Ccircle cx='20' cy='22' r='3.5' fill='%23c9884a' stroke='%23a06a30' stroke-width='1'/%3E%3C/svg%3E",
  expansion_permit: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='6' width='24' height='20' rx='2' fill='%234caf50'/%3E%3Crect x='4' y='6' width='24' height='20' rx='2' fill='none' stroke='%232e7d32' stroke-width='1.5'/%3E%3Crect x='6' y='8' width='20' height='16' rx='1' fill='none' stroke='%23fff' stroke-width='.5' opacity='.3'/%3E%3Cpath d='M12 16h8M16 12v8' stroke='%23fff' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E",
  // Animal products
  milk: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M10 8h12l2 4v14a2 2 0 01-2 2H10a2 2 0 01-2-2V12z' fill='%23f5f5f5' stroke='%23ddd' stroke-width='1'/%3E%3Crect x='10' y='4' width='12' height='5' rx='1' fill='%23e0e0e0'/%3E%3Crect x='11' y='14' width='10' height='8' rx='1' fill='%234fc3f7' opacity='.3'/%3E%3Cpath d='M12 18 Q16 15 20 18' stroke='%23fff' stroke-width='1.5' fill='none' opacity='.6'/%3E%3C/svg%3E",
  egg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='18' rx='9' ry='11' fill='%23faf0dc'/%3E%3Cellipse cx='16' cy='18' rx='9' ry='11' fill='none' stroke='%23e8d5b0' stroke-width='1'/%3E%3Cellipse cx='14' cy='14' rx='4' ry='3' fill='%23fff' opacity='.4'/%3E%3C/svg%3E",
  bacon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M4 12 Q8 8 12 12 Q16 16 20 12 Q24 8 28 12 L28 20 Q24 24 20 20 Q16 16 12 20 Q8 24 4 20Z' fill='%23e74c3c'/%3E%3Cpath d='M4 14 Q8 10 12 14 Q16 18 20 14 Q24 10 28 14' stroke='%23f5a0a0' stroke-width='2' fill='none'/%3E%3Cpath d='M4 17 Q8 13 12 17 Q16 21 20 17 Q24 13 28 17' stroke='%23f5c0c0' stroke-width='1.5' fill='none'/%3E%3C/svg%3E",
  wool: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='11' fill='%23f5f0e8'/%3E%3Ccircle cx='12' cy='12' r='4' fill='%23ede5d8'/%3E%3Ccircle cx='20' cy='12' r='4' fill='%23ede5d8'/%3E%3Ccircle cx='16' cy='18' r='4' fill='%23ede5d8'/%3E%3Ccircle cx='11' cy='18' r='3' fill='%23e8ddd0'/%3E%3Ccircle cx='21' cy='18' r='3' fill='%23e8ddd0'/%3E%3Ccircle cx='14' cy='14' rx='2' ry='1.5' fill='%23fff' opacity='.3'/%3E%3C/svg%3E",
  // Processed goods
  bread: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='20' rx='13' ry='8' fill='%23c9884a'/%3E%3Cellipse cx='16' cy='18' rx='12' ry='7' fill='%23daa06d'/%3E%3Cellipse cx='16' cy='16' rx='11' ry='6' fill='%23e8b87a'/%3E%3Cpath d='M8 16 Q12 14 16 16 Q20 18 24 16' stroke='%23c9884a' stroke-width='.8' fill='none' opacity='.5'/%3E%3Cellipse cx='14' cy='14' rx='5' ry='2' fill='%23f0c88a' opacity='.4'/%3E%3C/svg%3E",
  butter: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='5' y='12' width='22' height='12' rx='3' fill='%23ffd54f'/%3E%3Crect x='5' y='12' width='22' height='6' rx='3' fill='%23ffe082'/%3E%3Crect x='7' y='13' width='8' height='3' rx='1' fill='%23fff' opacity='.3'/%3E%3C/svg%3E",
  cheese: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M4 24L16 6l12 18z' fill='%23ffc107'/%3E%3Cpath d='M4 24L16 6l12 18z' fill='none' stroke='%23e6a800' stroke-width='1'/%3E%3Ccircle cx='12' cy='18' r='2' fill='%23e6a800' opacity='.5'/%3E%3Ccircle cx='18' cy='20' r='1.5' fill='%23e6a800' opacity='.5'/%3E%3Ccircle cx='15' cy='14' r='1' fill='%23e6a800' opacity='.5'/%3E%3Cpath d='M6 22L16 8' stroke='%23ffe082' stroke-width='.5' opacity='.4'/%3E%3C/svg%3E",
  sugar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='6' y='8' width='20' height='18' rx='2' fill='%23f5f5f5'/%3E%3Crect x='6' y='8' width='20' height='18' rx='2' fill='none' stroke='%23e0e0e0' stroke-width='1'/%3E%3Ctext x='16' y='20' text-anchor='middle' font-size='8' font-weight='bold' fill='%23bbb'%3ES%3C/text%3E%3Crect x='8' y='9' width='8' height='3' rx='1' fill='%23fff' opacity='.3'/%3E%3C/svg%3E",
  cream: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='8' y='10' width='16' height='16' rx='3' fill='%23fff8e1'/%3E%3Crect x='8' y='10' width='16' height='16' rx='3' fill='none' stroke='%23ffe082' stroke-width='1'/%3E%3Ccircle cx='16' cy='8' r='5' fill='%23fff' stroke='%23ffe082' stroke-width='.5'/%3E%3Ccircle cx='13' cy='7' r='3' fill='%23fff'/%3E%3Ccircle cx='19' cy='7' r='3' fill='%23fff'/%3E%3C/svg%3E",
  cookie: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='12' fill='%23c9884a'/%3E%3Ccircle cx='16' cy='16' r='12' fill='none' stroke='%23a06a30' stroke-width='1'/%3E%3Ccircle cx='12' cy='12' r='2' fill='%235d4037'/%3E%3Ccircle cx='19' cy='14' r='1.5' fill='%235d4037'/%3E%3Ccircle cx='14' cy='19' r='1.8' fill='%235d4037'/%3E%3Ccircle cx='20' cy='20' r='1.3' fill='%235d4037'/%3E%3Ccircle cx='10' cy='15' rx='3' ry='2' fill='%23daa06d' opacity='.3'/%3E%3C/svg%3E",
  cake: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='5' y='16' width='22' height='12' rx='3' fill='%23e8b87a'/%3E%3Crect x='5' y='16' width='22' height='4' rx='2' fill='%23f5f5f5'/%3E%3Crect x='5' y='14' width='22' height='4' rx='2' fill='%23e74c3c'/%3E%3Crect x='14' y='6' width='4' height='9' rx='1' fill='%23ffe082'/%3E%3Ccircle cx='16' cy='5' r='2' fill='%23ff9800'/%3E%3Cellipse cx='16' cy='4' rx='1' ry='2' fill='%23ffc107' opacity='.6'/%3E%3C/svg%3E",
  pizza: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 4L4 28h24z' fill='%23ffc107'/%3E%3Cpath d='M16 4L4 28h24z' fill='none' stroke='%23e6a800' stroke-width='1'/%3E%3Cpath d='M16 8L6 26h20z' fill='%23e74c3c' opacity='.3'/%3E%3Ccircle cx='14' cy='16' r='2.5' fill='%23e74c3c'/%3E%3Ccircle cx='19' cy='20' r='2' fill='%23e74c3c'/%3E%3Ccircle cx='12' cy='22' r='1.5' fill='%234caf50'/%3E%3Ccircle cx='18' cy='14' r='1.5' fill='%234caf50'/%3E%3C/svg%3E",
  burger: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='10' rx='12' ry='5' fill='%23c9884a'/%3E%3Crect x='4' y='14' width='24' height='3' fill='%234caf50'/%3E%3Crect x='4' y='17' width='24' height='3' fill='%23e74c3c'/%3E%3Crect x='4' y='20' width='24' height='3' fill='%23ffc107'/%3E%3Cellipse cx='16' cy='25' rx='12' ry='4' fill='%23a06a30'/%3E%3Cellipse cx='14' cy='9' rx='5' ry='2' fill='%23daa06d' opacity='.4'/%3E%3C/svg%3E",
  pie: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='20' rx='13' ry='8' fill='%23c9884a'/%3E%3Cellipse cx='16' cy='18' rx='12' ry='7' fill='%23daa06d'/%3E%3Cpath d='M4 18h24' stroke='%23c9884a' stroke-width='1'/%3E%3Cpath d='M8 18 L16 12 L24 18' stroke='%23c9884a' stroke-width='1' fill='%23e8b87a'/%3E%3Cpath d='M12 18v-3M20 18v-3' stroke='%23c9884a' stroke-width='.8'/%3E%3C/svg%3E",
  pumpkin_pie: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='20' rx='13' ry='8' fill='%23c9884a'/%3E%3Cellipse cx='16' cy='18' rx='12' ry='7' fill='%23ff9800'/%3E%3Cpath d='M4 18h24' stroke='%23c9884a' stroke-width='1'/%3E%3Ccircle cx='16' cy='16' r='4' fill='%23fff' opacity='.3'/%3E%3Cpath d='M8 18 L16 12 L24 18' stroke='%23c9884a' stroke-width='1' fill='none'/%3E%3C/svg%3E",
  jam: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M9 12h14v14a3 3 0 01-3 3H12a3 3 0 01-3-3z' fill='%23e74c3c'/%3E%3Crect x='9' y='8' width='14' height='5' rx='1' fill='%23f5e6c8'/%3E%3Crect x='9' y='8' width='14' height='5' rx='1' fill='none' stroke='%23c9884a' stroke-width='.5'/%3E%3Crect x='10' y='14' width='5' height='3' rx='1' fill='%23f5a0a0' opacity='.4'/%3E%3C/svg%3E",
  juice: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M10 8h12l-1 18a2 2 0 01-2 2h-6a2 2 0 01-2-2z' fill='%23ff9800' opacity='.8'/%3E%3Cpath d='M10 8h12l-1 18a2 2 0 01-2 2h-6a2 2 0 01-2-2z' fill='none' stroke='%23e65100' stroke-width='.8'/%3E%3Crect x='12' y='4' width='8' height='5' rx='1' fill='%23e0e0e0'/%3E%3Cellipse cx='15' cy='12' rx='3' ry='2' fill='%23fff' opacity='.3'/%3E%3C/svg%3E",
  // Truck & Boat icons for orders
  _icon_truck_color: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='2' y='10' width='18' height='12' rx='2' fill='%23d4a056'/%3E%3Crect x='3' y='10.5' width='16' height='3' rx='1' fill='%23e8c87a' opacity='.4'/%3E%3Cpath d='M20 14h6l4 4v4h-10z' fill='%238b5e3c'/%3E%3Cpath d='M20 14h6l4 4h-10z' fill='%23a0724a'/%3E%3Crect x='2' y='21' width='28' height='1.5' rx='.5' fill='%235a3520'/%3E%3Ccircle cx='8' cy='24' r='3' fill='%233a2510'/%3E%3Ccircle cx='8' cy='24' r='1.2' fill='%238b6914'/%3E%3Ccircle cx='25' cy='24' r='3' fill='%233a2510'/%3E%3Ccircle cx='25' cy='24' r='1.2' fill='%238b6914'/%3E%3C/svg%3E",
  // Decoration icons
  fence: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='3' y='10' width='4' height='18' rx='1' fill='%23c9884a'/%3E%3Crect x='14' y='10' width='4' height='18' rx='1' fill='%23c9884a'/%3E%3Crect x='25' y='10' width='4' height='18' rx='1' fill='%23c9884a'/%3E%3Cpath d='M3 7l2-3 2 3M14 7l2-3 2 3M25 7l2-3 2 3' fill='%23c9884a'/%3E%3Crect x='3' y='14' width='26' height='3' rx='.5' fill='%23daa06d'/%3E%3Crect x='3' y='21' width='26' height='3' rx='.5' fill='%23daa06d'/%3E%3C/svg%3E",
  flower_pot: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M9 18h14l-2 12H11z' fill='%23c9884a'/%3E%3Crect x='7' y='16' width='18' height='3' rx='1' fill='%23daa06d'/%3E%3Ccircle cx='12' cy='10' r='4' fill='%23e74c3c'/%3E%3Ccircle cx='20' cy='10' r='4' fill='%23ff9800'/%3E%3Ccircle cx='16' cy='7' r='4' fill='%23ffc107'/%3E%3Ccircle cx='16' cy='14' r='1.5' fill='%234caf50'/%3E%3Crect x='15' y='12' width='2' height='5' fill='%234caf50'/%3E%3C/svg%3E",
  bench: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='3' y='14' width='26' height='4' rx='1' fill='%23c9884a'/%3E%3Crect x='3' y='10' width='26' height='3' rx='1' fill='%23daa06d'/%3E%3Crect x='5' y='18' width='3' height='10' rx='1' fill='%23a06a30'/%3E%3Crect x='24' y='18' width='3' height='10' rx='1' fill='%23a06a30'/%3E%3Crect x='3' y='7' width='2' height='7' fill='%23a06a30'/%3E%3Crect x='27' y='7' width='2' height='7' fill='%23a06a30'/%3E%3C/svg%3E",
  hay_bale: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='20' rx='13' ry='8' fill='%23daa06d'/%3E%3Cellipse cx='16' cy='16' rx='12' ry='7' fill='%23e8b87a'/%3E%3Cpath d='M8 16h16M6 19h20' stroke='%23c9884a' stroke-width='.8'/%3E%3Cellipse cx='14' cy='14' rx='5' ry='2' fill='%23f0c88a' opacity='.3'/%3E%3C/svg%3E",
  mailbox: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='14' y='14' width='3' height='14' fill='%23808080'/%3E%3Crect x='6' y='6' width='20' height='10' rx='5' fill='%234fc3f7'/%3E%3Crect x='6' y='10' width='20' height='6' rx='2' fill='%232196f3'/%3E%3Crect x='24' y='8' width='3' height='2' rx='1' fill='%23e74c3c'/%3E%3C/svg%3E",
  lamp_post: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='14' y='12' width='4' height='16' rx='1' fill='%23555'/%3E%3Ccircle cx='16' cy='8' r='6' fill='%23ffd700' opacity='.3'/%3E%3Cpath d='M10 10h12l-2-6H12z' fill='%23333'/%3E%3Ccircle cx='16' cy='7' r='3' fill='%23ffd700'/%3E%3Crect x='12' y='26' width='8' height='3' rx='1' fill='%23555'/%3E%3C/svg%3E",
  fountain: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='24' rx='13' ry='5' fill='%23808080'/%3E%3Cellipse cx='16' cy='22' rx='12' ry='4' fill='%234fc3f7' opacity='.5'/%3E%3Crect x='14' y='10' width='4' height='14' rx='1' fill='%23999'/%3E%3Cellipse cx='16' cy='18' rx='8' ry='3' fill='%23999'/%3E%3Cpath d='M16 4 Q14 8 16 10 Q18 8 16 4' fill='%234fc3f7' opacity='.6'/%3E%3Cpath d='M12 8 Q14 10 16 10 Q18 10 20 8' stroke='%234fc3f7' stroke-width='1' fill='none' opacity='.4'/%3E%3C/svg%3E",
  tree_oak: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='13' y='18' width='6' height='12' rx='1' fill='%238b5e3c'/%3E%3Ccircle cx='16' cy='12' r='10' fill='%234caf50'/%3E%3Ccircle cx='12' cy='9' r='6' fill='%2366bb6a'/%3E%3Ccircle cx='20' cy='10' r='5' fill='%2357a84a'/%3E%3Ccircle cx='16' cy='6' r='4' fill='%2381c784'/%3E%3C/svg%3E",
  tree_pine: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='14' y='22' width='4' height='8' rx='1' fill='%238b5e3c'/%3E%3Cpath d='M16 2L6 14h20z' fill='%232e7d32'/%3E%3Cpath d='M16 8L8 18h16z' fill='%234caf50'/%3E%3Cpath d='M16 14L10 22h12z' fill='%2366bb6a'/%3E%3C/svg%3E",
  pond: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='18' rx='14' ry='10' fill='%234fc3f7' opacity='.4'/%3E%3Cellipse cx='16' cy='17' rx='12' ry='8' fill='%232196f3' opacity='.5'/%3E%3Cellipse cx='13' cy='15' rx='4' ry='2' fill='%23fff' opacity='.2'/%3E%3Ccircle cx='20' cy='14' r='2' fill='%234caf50'/%3E%3Ccircle cx='22' cy='16' r='1.5' fill='%234caf50'/%3E%3C/svg%3E",
  garden_gnome: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 2L10 12h12z' fill='%23e74c3c'/%3E%3Ccircle cx='16' cy='14' r='5' fill='%23fdd9b5'/%3E%3Crect x='11' y='18' width='10' height='10' rx='2' fill='%232196f3'/%3E%3Ccircle cx='14' cy='13' r='1' fill='%23333'/%3E%3Ccircle cx='18' cy='13' r='1' fill='%23333'/%3E%3Cellipse cx='16' cy='16' rx='2' ry='3' fill='%23f5f5f5'/%3E%3C/svg%3E",
  _icon_boat: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M2 20 Q6 26 16 26 Q26 26 30 20z' fill='%238b5e3c'/%3E%3Cpath d='M4 20 Q8 24 16 24 Q24 24 28 20z' fill='%23d4a056'/%3E%3Crect x='12' y='8' width='8' height='12' rx='1' fill='%23c9884a'/%3E%3Crect x='15' y='4' width='2' height='16' fill='%235a3520'/%3E%3Cpath d='M17 6 L17 14 L24 14z' fill='%23f5f5f5' stroke='%23ddd' stroke-width='.5'/%3E%3Cpath d='M2 20h28' stroke='%234fc3f7' stroke-width='1.5' opacity='.4'/%3E%3C/svg%3E",
  bird_bath: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='14' y='14' width='4' height='12' rx='1' fill='%23999'/%3E%3Cellipse cx='16' cy='14' rx='10' ry='3' fill='%23bbb'/%3E%3Cellipse cx='16' cy='13' rx='8' ry='2' fill='%234fc3f7' opacity='.4'/%3E%3Crect x='12' y='24' width='8' height='3' rx='1' fill='%23999'/%3E%3Cpath d='M10 10 Q12 8 14 10' stroke='%23888' stroke-width='1.5' fill='none'/%3E%3C/svg%3E",
  swing: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='3' height='24' rx='1' fill='%238b5e3c'/%3E%3Crect x='25' y='4' width='3' height='24' rx='1' fill='%238b5e3c'/%3E%3Crect x='4' y='4' width='24' height='3' rx='1' fill='%23a06a30'/%3E%3Cline x1='12' y1='7' x2='12' y2='20' stroke='%23888' stroke-width='1.5'/%3E%3Cline x1='20' y1='7' x2='20' y2='20' stroke='%23888' stroke-width='1.5'/%3E%3Crect x='10' y='20' width='12' height='3' rx='1' fill='%23c9884a'/%3E%3C/svg%3E",
  statue_chicken: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='10' y='24' width='12' height='4' rx='1' fill='%23999'/%3E%3Cellipse cx='16' cy='18' rx='6' ry='7' fill='%23bbb'/%3E%3Ccircle cx='16' cy='10' r='5' fill='%23ccc'/%3E%3Cpath d='M14 9h-3l2-3z' fill='%23e74c3c'/%3E%3Ccircle cx='14' cy='9' r='1' fill='%23333'/%3E%3Cpath d='M12 12l-2 1 2 0' fill='%23ff9800'/%3E%3C/svg%3E",
  tree_cherry: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='14' y='18' width='4' height='12' rx='1' fill='%238b5e3c'/%3E%3Ccircle cx='16' cy='12' r='10' fill='%23f48fb1'/%3E%3Ccircle cx='12' cy='9' r='5' fill='%23f8bbd0'/%3E%3Ccircle cx='20' cy='10' r='5' fill='%23f06292'/%3E%3Ccircle cx='16' cy='6' r='4' fill='%23f8bbd0'/%3E%3Ccircle cx='10' cy='14' r='1' fill='%23fff' opacity='.5'/%3E%3Ccircle cx='18' cy='8' r='1' fill='%23fff' opacity='.5'/%3E%3C/svg%3E",
  arch_flowers: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='8' width='3' height='20' rx='1' fill='%238b5e3c'/%3E%3Crect x='25' y='8' width='3' height='20' rx='1' fill='%238b5e3c'/%3E%3Cpath d='M5 8 Q16 0 27 8' stroke='%238b5e3c' stroke-width='3' fill='none'/%3E%3Ccircle cx='8' cy='6' r='3' fill='%23e74c3c'/%3E%3Ccircle cx='16' cy='3' r='3' fill='%23ff9800'/%3E%3Ccircle cx='24' cy='6' r='3' fill='%23e91e63'/%3E%3Ccircle cx='12' cy='4' r='2' fill='%23ffc107'/%3E%3Ccircle cx='20' cy='4' r='2' fill='%23f44336'/%3E%3Ccircle cx='5' cy='12' r='2' fill='%234caf50'/%3E%3Ccircle cx='27' cy='12' r='2' fill='%234caf50'/%3E%3C/svg%3E",
  statue_cow: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='10' y='24' width='12' height='4' rx='1' fill='%23999'/%3E%3Cellipse cx='16' cy='18' rx='8' ry='7' fill='%23bbb'/%3E%3Ccircle cx='16' cy='10' r='6' fill='%23ccc'/%3E%3Ccircle cx='10' cy='7' r='2' fill='%23ccc'/%3E%3Ccircle cx='22' cy='7' r='2' fill='%23ccc'/%3E%3Ccircle cx='14' cy='10' r='1' fill='%23333'/%3E%3Ccircle cx='18' cy='10' r='1' fill='%23333'/%3E%3Cellipse cx='16' cy='13' rx='3' ry='2' fill='%23f8bbd0'/%3E%3C/svg%3E",
  windmill_deco: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M12 28h8l2-18H10z' fill='%23c9884a'/%3E%3Cpath d='M12 28h8l2-18H10z' fill='none' stroke='%23a06a30' stroke-width='.5'/%3E%3Ccircle cx='16' cy='12' r='3' fill='%23999'/%3E%3Cpath d='M16 12L16 2M16 12L26 8M16 12L26 16M16 12L16 22M16 12L6 16M16 12L6 8' stroke='%23888' stroke-width='2'/%3E%3Ccircle cx='16' cy='12' r='1.5' fill='%23666'/%3E%3C/svg%3E",
  picnic_table: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='3' y='14' width='26' height='3' rx='1' fill='%23c9884a'/%3E%3Crect x='6' y='10' width='20' height='3' rx='1' fill='%23daa06d'/%3E%3Cpath d='M8 17L4 28' stroke='%23a06a30' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M24 17L28 28' stroke='%23a06a30' stroke-width='3' stroke-linecap='round'/%3E%3Crect x='6' y='18' width='20' height='3' rx='1' fill='%23c9884a'/%3E%3C/svg%3E",
};

// Get item icon as <img> tag (SVG inline or sprite, no emoji fallback for key items)
function itemIcon(id, w) {
  w = w || 24;
  // Try hayday label sprite first
  const lblSrc = S(`hayday_${id}_lbl`);
  if (lblSrc) return `<img src="${lblSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try crop portrait
  const cp = cropPortrait(id, w);
  if (cp) return cp;
  // Try inline SVG icon
  const svgSrc = ITEM_ICONS[id];
  if (svgSrc) return `<img src="${svgSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try hayday sprite
  const hdSrc = S(`hayday_${id}`);
  if (hdSrc) return `<img src="${hdSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Fallback: generic placeholder icon
  const cat = (farmData.item_catalog||{})[id] || {};
  return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='6' y='6' width='20' height='20' rx='4' fill='%23daa06d' opacity='.6'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-size='14' fill='%23fff'%3E%3F%3C/text%3E%3C/svg%3E" width="${w}" height="${w}" style="object-fit:contain">`;
}

const HD_BUILDINGS = {
  bakery:'hayday_shop', barn:'hayday_barn', silo:'hayday_silo',
  shop:'hayday_shop', sugar_mill:'hayday_silo', dairy:'hayday_barn',
  chicken_coop:'hayday_chicken_coop', bbq:'hayday_shop', pastry_shop:'hayday_shop',
  pizzeria:'hayday_shop', jam_maker:'hayday_silo', juice_press:'hayday_silo',
  pie_oven:'hayday_barn', windmill:'hayday_mill_dark', coop:'hayday_chicken_coop',
};
function buildingImg(id, w) {
  const key = HD_BUILDINGS[id] || `buildings_${id}`;
  return img(key, w||100, w ? Math.round(w*0.83) : 83, 'building-img');
}

function animalImg(id, w) {
  const src = S(`hayday_${id}`) || S(`animals_${id}`);
  if (!src) return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='6' y='6' width='20' height='20' rx='4' fill='%23daa06d' opacity='.6'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-size='14' fill='%23fff'%3E%3F%3C/text%3E%3C/svg%3E" width="${w||50}" height="${w?Math.round(w*.85):42}" style="object-fit:contain">`;
  return `<img src="${src}" width="${w||50}" height="${w?Math.round(w*.85):42}" class="animal-img" draggable="false">`;
}
function animalLbl(id, w) { return img(`hayday_${id}_lbl`, w||45, w||45, 'animal-lbl'); }

function fieldBg(state) {
  if (state === 'ready') return S('hayday_wheat_field') || S('hayday_field');
  if (state === 'growing' || state === 'planted') return S('hayday_alfalfa_field') || S('hayday_field');
  return S('hayday_field');
}
function lockImg(w) { return img('hayday_lock', w||24, w||24, 'lock-icon'); }

// (CROP_EMOJI and ANIMAL_EMOJI removed — all rendering uses cropPortrait/itemIcon/animalImg)
// Centralized building/animal definitions (single source of truth)
const ALL_BUILDINGS = [
  {id:'bakery',lvl:5},{id:'sugar_mill',lvl:15},{id:'dairy',lvl:25},
  {id:'bbq',lvl:35},{id:'pastry_shop',lvl:40},{id:'jam_maker',lvl:45},
  {id:'pizzeria',lvl:50},{id:'juice_press',lvl:55},{id:'pie_oven',lvl:70},
];
const ALL_ANIMALS = [
  {id:'cow',lvl:10},{id:'chicken',lvl:20},{id:'pig',lvl:30},{id:'sheep',lvl:60},
];
const GROWTH_LABEL = ['Graine','Pousse','Croissance','Floraison','Prêt !'];
const EXPANSION_LEVELS = [
  {lvl:3,plots:2},{lvl:5,plots:2},{lvl:10,plots:2},{lvl:15,plots:2},{lvl:20,plots:2},
  {lvl:25,plots:2},{lvl:30,plots:2},{lvl:35,plots:2},{lvl:40,plots:2},{lvl:50,plots:2},
  {lvl:60,plots:1},{lvl:70,plots:1},{lvl:80,plots:1},{lvl:90,plots:1},{lvl:100,plots:1}
];

// --- Visual Effects ---
function createSparkleRain() {
  const layer = document.getElementById('sparkle-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const colors = ['#ffd700', '#ff6b6b', '#4fc3f7', '#ab47bc', '#66bb6a', '#ff8a65'];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle-particle';
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 2) + 's';
    s.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    const c = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 6;
    s.style.width = size + 'px';
    s.style.height = size + 'px';
    s.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    s.style.background = `radial-gradient(circle, #fff, ${c})`;
    s.style.boxShadow = `0 0 ${size}px ${c}`;
    layer.appendChild(s);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 4500);
}

function createConfetti() {
  const layer = document.getElementById('confetti-layer');
  if (!layer) return;
  layer.innerHTML = '';
  const colors = ['#f44336','#e91e63','#9c27b0','#2196f3','#4caf50','#ff9800','#ffd700'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetti-piece';
    c.style.left = (40 + Math.random() * 20) + '%';
    c.style.setProperty('--dx', ((Math.random() - 0.5) * 300) + 'px');
    c.style.setProperty('--dy', (-(100 + Math.random() * 200)) + 'px');
    c.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.animationDelay = (Math.random() * 0.3) + 's';
    layer.appendChild(c);
  }
  setTimeout(() => { layer.innerHTML = ''; }, 2500);
}

// --- Core State Update ---
function updateFarm(data) {
  // Track which plots grew for animation
  const oldFields = farmData.fields || farmData.plots || [];
  const oldGrowth = {};
  oldFields.forEach(f => { if (f.id != null) oldGrowth[f.id] = (f.growth_stage||0) + ':' + (f.reviews_done||0) + ':' + f.state; });
  // Merge cached static definitions into dynamic state for backward-compat access
  farmData = Object.assign({}, _staticDefs, data);
  updateHUD(); renderFields(); renderWorkshop(); renderPastures(); renderVillage(); updateLandBar(); renderMysteryBoxes(); updateSections(); checkStorageWarnings(); updateWeather();
  // Animate plots that grew
  const newFields = farmData.fields || farmData.plots || [];
  if (Object.keys(oldGrowth).length > 0) {
    const allPlots = document.querySelectorAll('#fields-grid .plot');
    newFields.forEach((f, idx) => {
      const newKey = (f.growth_stage||0) + ':' + (f.reviews_done||0) + ':' + f.state;
      if (oldGrowth[f.id] && oldGrowth[f.id] !== newKey && f.state !== 'empty' && allPlots[idx]) {
        allPlots[idx].classList.add('plot-grew');
        setTimeout(() => allPlots[idx]?.classList.remove('plot-grew'), 800);
      }
    });
  }
  if (currentPanel) {
    if (currentPanel === 'inventory') renderInventory();
    if (currentPanel === 'buildings') renderBuildingsPanel();
    if (currentPanel === 'orders') renderOrders();
    if (currentPanel === 'shop') renderShop();
    if (currentPanel === 'achievements') renderAchievements();
    if (currentPanel === 'settings') renderSettings();
  }
}

let _lastStorageWarning = 0;
function checkStorageWarnings() {
  const now = Date.now();
  if (now - _lastStorageWarning < 30000) return;
  const d = farmData;
  const barnPct = (d.barn_used||0) / Math.max(1, d.barn_capacity||50);
  const siloPct = (d.silo_used||0) / Math.max(1, d.silo_capacity||50);
  if (barnPct >= 1) { showNotification(LANG.barn_full); _lastStorageWarning = now; }
  else if (barnPct >= 0.9) { showNotification(LANG.barn_almost + ' (' + d.barn_used + '/' + d.barn_capacity + ')'); _lastStorageWarning = now; }
  if (siloPct >= 1) { showNotification(LANG.silo_full); _lastStorageWarning = now; }
  else if (siloPct >= 0.9) { showNotification(LANG.silo_almost + ' (' + d.silo_used + '/' + d.silo_capacity + ')'); _lastStorageWarning = now; }
}

function updateHUD() {
  const d = farmData;
  const starSrc = S('hayday_star');
  const starEl = document.getElementById('hud-star-img');
  if (starSrc && starEl) starEl.src = starSrc;
  document.getElementById('hud-level').querySelector('.level-num').textContent = d.level || 1;
  document.getElementById('hud-xp-bar').style.width = (d.xp_percent || 0) + '%';
  document.getElementById('hud-xp-text').textContent = `${d.xp_progress||0}/${d.xp_needed||20}`;
  document.getElementById('streak-count').textContent = d.streak || 0;
  document.getElementById('coin-count').textContent = formatNum(d.coins || 0);
  document.getElementById('gem-count').textContent = formatNum(d.gems || 0);
  // Streak bonus indicator — show percentage when active
  const streakEl = document.getElementById('hud-streak');
  const bonus = d.streak_bonus_pct || 0;
  streakEl.title = bonus > 0 ? `Streak bonus: +${bonus}% pièces et XP` : 'Révisez chaque jour pour construire votre série !';
  const streakBonusEl = document.getElementById('streak-bonus');
  if (streakBonusEl) {
    if (bonus > 0) {
      streakBonusEl.textContent = `+${bonus}%`;
      streakBonusEl.style.display = '';
    } else {
      streakBonusEl.style.display = 'none';
    }
  }
  // Next unlock preview
  const nextEl = document.getElementById('next-unlock-hint');
  if (nextEl && d.next_unlock) {
    const nu = d.next_unlock;
    const mainItem = nu.items.find(i => i.type !== 'plots') || nu.items[0];
    nextEl.innerHTML = `<span class="next-unlock-label">Niv.${nu.level}</span> ${itemIcon(mainItem.id||mainItem.type||'', 14)} ${mainItem.name}`;
    nextEl.style.display = '';
  } else if (nextEl) {
    nextEl.style.display = 'none';
  }
  // Active events banner
  const banner = document.getElementById('event-banner');
  const events = d.active_events || [];
  if (events.length > 0) {
    banner.innerHTML = events.map(e => `<span class="event-tag"><span class="event-icon"></span> ${e.name}</span>`).join('');
    banner.style.display = '';
  } else {
    banner.style.display = 'none';
  }
}

function renderFields() {
  const grid = document.getElementById('fields-grid');
  grid.innerHTML = '';
  const fields = farmData.fields || farmData.plots || [];

  document.getElementById('fields-count').textContent = fields.length;

  // Update field cost on button
  const fieldCost = farmData.field_cost || 0;
  const addBtn = document.getElementById('add-field-btn');
  if (addBtn) addBtn.textContent = fieldCost > 0 ? `+ Champ (${fieldCost})` : '+ Champ';

  // Show/hide harvest all button
  const readyCount = fields.filter(f => f.state === 'ready').length;
  const harvestAllBtn = document.getElementById('harvest-all-btn');
  if (harvestAllBtn) {
    if (readyCount >= 2) {
      harvestAllBtn.style.display = '';
      harvestAllBtn.textContent = `Tout récolter (${readyCount})`;
    } else {
      harvestAllBtn.style.display = 'none';
    }
  }

  // Show/hide plant-all-empty button (only if there are empty fields with last_crop)
  const emptyWithLastCrop = fields.filter(f => f.state === 'empty' && f.last_crop && (farmData.unlocked_crops||[]).includes(f.last_crop));
  const plantAllBtn = document.getElementById('plant-all-btn');
  if (plantAllBtn) {
    if (emptyWithLastCrop.length >= 2) {
      plantAllBtn.style.display = '';
      plantAllBtn.textContent = `Tout planter (${emptyWithLastCrop.length})`;
    } else {
      plantAllBtn.style.display = 'none';
    }
  }

  if (fields.length === 0) {
    grid.innerHTML = '<div class="zone-empty-msg">Aucun champ. Ajoute-en un !</div>';
    return;
  }

  fields.forEach(field => {
    const el = document.createElement('div');
    el.className = `plot plot-${field.state}`;

    const bg = fieldBg(field.state);
    if (bg) el.innerHTML = `<img src="${bg}" class="field-img">`;

    if (field.state === 'empty') {
      if (field.last_crop && (farmData.unlocked_crops||[]).includes(field.last_crop)) {
        const lcName = cropName(field.last_crop);
        el.innerHTML += `<div class="plot-replant">${cropPortrait(field.last_crop, 24) || '<span class="plot-plus">+</span>'}<span class="plot-replant-label">${lcName}</span></div>`;
        el.onclick = () => { pycmd(`farm:plant:${field.id}:${field.last_crop}`); SoundMgr.play('click'); };
        // Long press / right-click for other crop choices
        el.oncontextmenu = (e) => { e.preventDefault(); showPlantDialog(field.id); };
      } else {
        const plusSrc = S('hayday_plus');
        const plusIcon = plusSrc ? `<img src="${plusSrc}" width="24" height="24" style="opacity:.5">` : '<span class="plot-plus">+</span>';
        el.innerHTML += `<div class="plot-empty-prompt">${plusIcon}<span class="plot-empty-label">Planter</span></div>`;
        el.onclick = () => showPlantDialog(field.id);
      }
    } else if (field.state === 'ready') {
      const name = cropName(field.crop);
      el.innerHTML += `<div class="plot-crop plot-crop-bounce">${cropImg(field.crop, 4, 40)}</div><span class="plot-label plot-ready-label">${name} — Récolter !</span>`;
      el.onclick = () => harvestPlot(field.id);
    } else if (field.state === 'wilted') {
      el.innerHTML += `<div class="plot-crop" style="opacity:.4;filter:grayscale(.8)">${cropImg(field.crop, 0, 32)}</div><span class="plot-label">Fané</span>`;
      el.onclick = () => pycmd('farm:clear_wilted:' + field.id);
    } else {
      const stage = field.growth_stage||0, needed = field.reviews_needed||1, done = field.reviews_done||0;
      // Total progress across ALL 4 stages (not just current stage)
      const cropDef = (farmData.crop_defs||{})[field.crop]||{};
      const reviewsPerStage = cropDef.growth_reviews || needed;
      const totalNeeded = reviewsPerStage * 4;
      const totalDone = stage * reviewsPerStage + done;
      const pct = Math.min(100, (totalDone/totalNeeded)*100);
      const name = cropName(field.crop);
      el.innerHTML += `<div class="plot-crop">${cropImg(field.crop, stage, 36)}</div><span class="plot-label">${name} — ${GROWTH_LABEL[Math.min(stage,4)]}</span><div class="plot-progress"><div class="plot-progress-fill" style="width:${pct}%"></div></div>`;
    }
    grid.appendChild(el);
  });
}
function getLockedCount(level) { let c=0; for (const e of EXPANSION_LEVELS) { if (level<e.lvl) c+=e.plots; if (c>=6) return 6; } return Math.max(c,3); }
function getNextExpansionLevel(level) { for (const e of EXPANSION_LEVELS) { if (level<e.lvl) return e.lvl; } return null; }

function renderWorkshop() {
  const grid = document.getElementById('workshop-grid');
  grid.innerHTML = '';
  const placed = farmData.placed_buildings || [];
  const zone = document.getElementById('zone-workshop');

  if (placed.length === 0 && (farmData.unlocked_buildings||[]).length === 0) {
    zone.style.display = 'none';
    return;
  }
  zone.style.display = '';

  if (placed.length === 0) {
    grid.innerHTML = '<div class="zone-empty-msg">Construis ton premier bâtiment !</div>';
    return;
  }

  placed.forEach(b => {
    const bid = b.building_type;
    const name = buildingName(bid);
    const el = document.createElement('div');
    el.className = 'building-tile';
    el.onclick = () => pycmd('farm:building_detail:' + bid);
    const queue = (farmData.production_queues||{})[bid]||[];
    const ready = queue.filter(q=>q.ready).length;
    el.innerHTML = `${buildingImg(bid,100)}<span class="building-name">${name}</span>${ready>0?`<span class="building-badge">${ready}</span>`:''}`;
    grid.appendChild(el);
  });
}

function renderPastures() {
  const grid = document.getElementById('pasture-grid');
  grid.innerHTML = '';
  const pastures = farmData.pastures || [];
  const zone = document.getElementById('zone-pasture');

  if (pastures.length === 0 && (farmData.unlocked_animals||[]).length === 0) {
    zone.style.display = 'none';
    return;
  }
  zone.style.display = '';

  if (pastures.length === 0) {
    grid.innerHTML = '<div class="zone-empty-msg">Adopte ton premier animal !</div>';
    return;
  }

  pastures.forEach(p => {
    const el = document.createElement('div');
    el.className = 'pasture-tile';
    el.style.animationDelay = `${Math.random()*2}s`;
    const lbl = S(`hayday_${p.animal_type}_lbl`);
    const name = animalName(p.animal_type) || (p.animal_type||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const adef = (farmData.animal_defs||{})[p.animal_type]||{};
    const produceEvery = adef.produce_every_n_reviews || 10;
    const reviewsSince = p.reviews_since_last || 0;
    const progPct = Math.min(100, Math.round(reviewsSince / produceEvery * 100));
    const imgHtml = lbl ? `<img src="${lbl}" width="50" height="50">` : animalImg(p.animal_type,45);
    el.innerHTML = `${imgHtml}<span class="pasture-count">x${p.count||1}</span><span class="pasture-name">${name}</span><div class="pasture-progress"><div class="pasture-progress-fill" style="width:${progPct}%"></div></div><span class="pasture-prod-label">${itemIcon(adef.product||'', 10)} ${reviewsSince}/${produceEvery}</span>`;
    el.onclick = () => showAnimalInfo(p.animal_type);
    grid.appendChild(el);
  });
}

function updateSections() {
  updateTabBadges();
}

function updateTabBadges() {
  const d = farmData, inv = d.inventory||{};
  let fulfillable = 0;
  (d.active_orders||[]).forEach(order => {
    let canDo = true;
    Object.entries(order.items_needed||{}).forEach(([id,qty]) => { if ((inv[id]||0) < qty) canDo = false; });
    if (canDo) fulfillable++;
  });
  setBadge('tab-orders', fulfillable);
  let readyCount = 0;
  Object.values(d.production_queues||{}).forEach(queue => { queue.forEach(q => { if (q.ready) readyCount++; }); });
  setBadge('tab-buildings', readyCount);
  setBadge('tab-farm', (d.mystery_boxes||[]).length);
  setBadge('tab-wheel', d.can_spin_wheel ? 1 : 0);
}

function setBadge(tabId, count) {
  const tab = document.getElementById(tabId);
  if (!tab) return;
  let badge = tab.querySelector('.tab-badge');
  if (count > 0) {
    if (!badge) { badge = document.createElement('span'); badge.className = 'tab-badge'; tab.appendChild(badge); }
    badge.textContent = count;
  } else if (badge) {
    badge.remove();
  }
}

function renderMysteryBoxes() {
  const layer = document.getElementById('mystery-boxes-layer'); layer.innerHTML = '';
  (farmData.mystery_boxes||[]).forEach((box,i) => {
    const el = document.createElement('div'); el.className = 'mystery-box';
    const idx = box.size==='large'?2:box.size==='medium'?1:0;
    const src = S(`ui_chest_${idx}_closed`);
    if (src) el.innerHTML = `<img src="${src}" width="36" height="36">`; else { const fb=S('ui_chest_0_closed'); if(fb) el.innerHTML=`<img src="${fb}" width="36" height="36">`; else el.innerHTML='<div class="css-chest" style="width:30px;height:26px"></div>'; }
    el.onclick = () => showMysteryBox(i); layer.appendChild(el);
  });
}

// --- Village / Deco Zone Rendering ---
function renderVillage() {
  const grid = document.getElementById('deco-grid');
  grid.innerHTML = '';
  const decos = farmData.decorations || [];
  const zone = document.getElementById('zone-village');

  if (decos.length === 0) {
    zone.style.display = 'none';
    return;
  }
  zone.style.display = '';

  decos.forEach(deco => {
    const decoDef = (farmData.deco_defs||{})[deco.type] || {};
    const catFallback = (farmData.item_catalog||{})[deco.type] || {};
    const name = decoDef.name || catFallback.name || decoName(deco.type);
    const el = document.createElement('div');
    el.className = 'deco-tile';
    // Try to use Hay Day sprite, then SVG icon, then fallback
    const sprSrc = S(`hayday_${deco.type}`);
    const svgSrc = ITEM_ICONS[deco.type];
    if (sprSrc) {
      el.innerHTML = `<img src="${sprSrc}" width="44" height="44" style="object-fit:contain;filter:drop-shadow(1px 2px 3px rgba(0,0,0,.3))"><span class="deco-name">${name}</span>`;
    } else if (svgSrc) {
      el.innerHTML = `<img src="${svgSrc}" width="40" height="40" style="object-fit:contain;filter:drop-shadow(1px 2px 3px rgba(0,0,0,.2))"><span class="deco-name">${name}</span>`;
    } else {
      el.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='10' fill='%234caf50' opacity='.5'/%3E%3Cpath d='M16 8v8M12 12l4-4 4 4' stroke='%23fff' stroke-width='2' fill='none'/%3E%3C/svg%3E" width="32" height="32" style="object-fit:contain"><span class="deco-name">${name}</span>`;
    }
    grid.appendChild(el);
  });
}

// --- Land Bar ---
function updateLandBar() {
  const used = farmData.land_used || 0;
  const total = farmData.land_total || 20;
  const pct = Math.min(100, Math.round(used / Math.max(1, total) * 100));
  const statusEl = document.getElementById('land-status');
  statusEl.innerHTML = `<div style="display:flex;align-items:center;gap:6px"><span>Terrain ${used}/${total}</span><div class="land-progress-bar"><div class="land-progress-fill" style="width:${pct}%"></div></div></div>`;
}

// --- Info Overlay ---
function showInfo(data) {
  document.getElementById('info-icon').innerHTML = data.icon || '';
  document.getElementById('info-title').textContent = data.title || '';
  document.getElementById('info-desc').textContent = data.desc || '';

  const reqDiv = document.getElementById('info-requirements');
  reqDiv.innerHTML = '';
  if (data.requirements && data.requirements.length > 0) {
    let html = '<div class="req-section"><h4>Requis :</h4>';
    data.requirements.forEach(r => {
      const cls = r.met ? 'req-ok' : 'req-miss';
      html += `<div class="req-row"><span>${r.label}</span><span class="${cls}">${r.value}</span></div>`;
    });
    html += '</div>';
    reqDiv.innerHTML = html;
  }

  const prodDiv = document.getElementById('info-produces');
  prodDiv.innerHTML = '';
  if (data.produces && data.produces.length > 0) {
    let html = '<div class="req-section"><h4>Produit :</h4>';
    data.produces.forEach(p => { html += `<div class="produce-row">${p}</div>`; });
    html += '</div>';
    prodDiv.innerHTML = html;
  }

  const actDiv = document.getElementById('info-actions');
  actDiv.innerHTML = '';
  if (data.action_label && data.action_cmd) {
    actDiv.innerHTML = `<button class="action-btn" onclick="${data.action_cmd}">${data.action_label}</button>`;
  }

  document.getElementById('info-overlay').classList.remove('hidden');
}

// --- Item Info Database ---
const ITEM_INFO = {
  // Materials
  bolt: {desc: 'Sert à améliorer la Grange. Obtenu aléatoirement en révisant des cartes (~12% par review).', usage: 'Améliorer Grange (+25 stockage)'},
  plank: {desc: 'Sert à améliorer la Grange. Obtenu aléatoirement en révisant.', usage: 'Améliorer Grange (+25 stockage)'},
  duct_tape: {desc: 'Sert à améliorer la Grange. Matériau rare obtenu en révisant.', usage: 'Améliorer Grange (+25 stockage)'},
  nail: {desc: 'Sert à améliorer le Silo. Obtenu aléatoirement en révisant.', usage: 'Améliorer Silo (+25 stockage)'},
  screw: {desc: 'Sert à améliorer le Silo. Matériau peu commun.', usage: 'Améliorer Silo (+25 stockage)'},
  paint: {desc: 'Sert à améliorer le Silo. Matériau rare.', usage: 'Améliorer Silo (+25 stockage)'},
  land_deed: {desc: 'Acte de propriété. Nécessaire pour agrandir ton terrain. Très rare (~3% des drops matériaux).', usage: 'Acheter du terrain (+5 unités)'},
  expansion_permit: {desc: 'Permis d\'expansion. Ultra rare (~2% des drops). Nécessaire pour agrandir le terrain.', usage: 'Acheter du terrain (+5 unités)'},
  // Crops
  wheat: {desc: 'Céréale de base. Pousse vite (3 reviews/stade). Ingrédient du pain et des cookies.', usage: 'Vendre ou transformer en Pain/Cookie'},
  corn: {desc: 'Céréale dorée. Pousse en 4 reviews/stade.', usage: 'Vendre ou utiliser dans des recettes'},
  carrot: {desc: 'Légume-racine. Pousse en 5 reviews/stade.', usage: 'Vendre'},
  tomato: {desc: 'Fruit juteux. Essentiel pour les pizzas ! Pousse en 6 reviews/stade.', usage: 'Vendre ou Pizza'},
  potato: {desc: 'Tubercule nourrissant. Pousse en 5 reviews/stade.', usage: 'Vendre'},
  sugarcane: {desc: 'Transformée en sucre au Moulin. Pousse en 7 reviews/stade.', usage: 'Vendre ou Sucre → Confiture/Gâteau'},
  strawberry: {desc: 'Fruit délicat. Ingrédient de la confiture ! Pousse en 8 reviews/stade.', usage: 'Vendre ou Confiture'},
  apple: {desc: 'Fruit polyvalent. Fait du jus et des tartes. Pousse en 10 reviews/stade.', usage: 'Vendre ou Jus/Tarte'},
  pumpkin: {desc: 'Grosse cucurbitacée. Pousse lentement (12 reviews/stade) mais vaut cher.', usage: 'Vendre ou Tarte à la citrouille'},
  soybean: {desc: 'Légumineuse. Pousse en 4 reviews/stade.', usage: 'Vendre'},
  // Animal products
  milk: {desc: 'Produit par les vaches (1 par vache tous les 10 reviews). Transformable en beurre, fromage, crème.', usage: 'Vendre ou Beurre/Fromage/Crème'},
  egg: {desc: 'Pondu par les poules (1 par poule tous les 8 reviews). Ingrédient des cookies et gâteaux.', usage: 'Vendre ou Cookie/Gâteau'},
  bacon: {desc: 'Produit par les cochons (1 par cochon tous les 15 reviews). Ingrédient du burger.', usage: 'Vendre ou Burger'},
  wool: {desc: 'Tondue des moutons (1 par mouton tous les 20 reviews). Se vend cher.', usage: 'Vendre'},
  // Processed
  bread: {desc: 'Fabriqué à la Boulangerie (3 blé → 1 session). Base de nombreuses recettes.', usage: 'Vendre ou Burger/Pizza'},
  butter: {desc: 'Fabriqué à la Laiterie (2 lait → 1 session). Ingrédient du gâteau.', usage: 'Vendre ou Gâteau'},
  cheese: {desc: 'Fabriqué à la Laiterie (3 lait → 2 sessions). Ingrédient de la pizza.', usage: 'Vendre ou Pizza'},
  sugar: {desc: 'Fabriqué au Moulin (3 canne → 1 session). Ingrédient confiture/gâteau.', usage: 'Vendre ou Confiture/Gâteau'},
  cookie: {desc: 'Fabriqué à la Boulangerie (2 blé + 1 œuf → 1 session).', usage: 'Vendre'},
  cake: {desc: 'Fabriqué à la Pâtisserie (1 pain + 1 beurre + 1 œuf → 2 sessions). Se vend très cher !', usage: 'Vendre (25 pièces)'},
  pizza: {desc: 'Fabriquée à la Pizzeria (1 pain + 2 tomates + 1 fromage → 2 sessions). Top prix !', usage: 'Vendre (30 pièces)'},
  burger: {desc: 'Fabriqué au BBQ (1 pain + 1 bacon → 2 sessions). Le plus cher !', usage: 'Vendre (35 pièces)'},
  jam: {desc: 'Fabriquée à la Confiturerie (3 fraises + 1 sucre → 1 session).', usage: 'Vendre (20 pièces)'},
  juice: {desc: 'Fabriqué au Pressoir (3 pommes → 1 session).', usage: 'Vendre (16 pièces)'},
  pie: {desc: 'Fabriquée à la Pâtisserie (2 blé + 2 pommes + 1 sucre → 2 sessions).', usage: 'Vendre (28 pièces)'},
  pumpkin_pie: {desc: 'Fabriquée au Four à tartes (2 citrouilles + 2 blé + 1 crème → 2 sessions). La plus chère !', usage: 'Vendre (35 pièces)'},
  cream: {desc: 'Fabriquée à la Laiterie (2 lait → 1 session). Ingrédient de la tarte citrouille.', usage: 'Vendre ou Tarte citrouille'},
};

function showItemInfo(itemId) {
  const cat = (farmData.item_catalog||{})[itemId] || {};
  const info = ITEM_INFO[itemId] || {};
  const qty = (farmData.inventory||{})[itemId] || 0;

  const reqs = [];
  if (cat.sell_price > 0) {
    reqs.push({label: 'Prix de vente', value: `${cat.sell_price} pièces`, met: true});
  }
  if (info.usage) {
    reqs.push({label: 'Utilisation', value: info.usage, met: true});
  }
  reqs.push({label: 'En stock', value: `${qty}`, met: qty > 0});

  showInfo({
    icon: itemIcon(itemId, 40),
    title: cat.name || itemId,
    desc: info.desc || `${cat.category || 'Item'} — ${cat.name || itemId}`,
    requirements: reqs,
    action_label: (cat.sell_price > 0 && qty > 0) ? `Vendre tout (${qty} × ${cat.sell_price} = ${qty * cat.sell_price} pièces)` : null,
    action_cmd: (cat.sell_price > 0 && qty > 0) ? `pycmd('farm:sell:${itemId}:${qty}');hideOverlay()` : null,
  });
}

function showBuildMenu() {
  // Show ALL buildings — built, available, and locked with requirements
  const unlocked = farmData.unlocked_buildings || [];
  const built = Object.keys(farmData.buildings || {});
  const defs = farmData.building_defs || {};
  const level = farmData.level || 1;
  const coins = farmData.coins || 0;
  const landFree = (farmData.land_total||20) - (farmData.land_used||0);

  let html = '';

  // Built buildings
  const builtList = ALL_BUILDINGS.filter(b => built.includes(b.id));
  if (builtList.length > 0) {
    html += '<div class="req-section"><h4>Construits</h4>';
    builtList.forEach(b => {
      const def = defs[b.id]||{};
      const bSrc = S(HD_BUILDINGS[b.id]) || S(`buildings_${b.id}`);
      const bImg = bSrc ? `<img src="${bSrc}" width="28" height="28" style="object-fit:contain">` : '';
      html += `<div class="recipe-card" onclick="pycmd('farm:building_detail:${b.id}');hideOverlay()">
        <div class="recipe-header"><span class="recipe-emoji">${bImg}</span>
        <div class="recipe-info"><strong>${def.name||buildingName(b.id)}</strong><span class="recipe-time">Tap pour produire</span></div></div></div>`;
    });
    html += '</div>';
  }

  // Available to build
  const availList = ALL_BUILDINGS.filter(b => unlocked.includes(b.id) && !built.includes(b.id));
  if (availList.length > 0) {
    html += '<div class="req-section"><h4>Disponibles</h4>';
    availList.forEach(b => {
      const def = defs[b.id]||{};
      const cost = def.cost_coins||0;
      const canBuy = coins >= cost && landFree >= 2;
      const bSrc = S(HD_BUILDINGS[b.id]) || S(`buildings_${b.id}`);
      const bImg = bSrc ? `<img src="${bSrc}" width="28" height="28" style="object-fit:contain">` : '';
      html += `<div class="recipe-card ${canBuy?'':'disabled'}" onclick="${canBuy?`pycmd('farm:build:${b.id}');hideOverlay()`:''}">
        <div class="recipe-header"><span class="recipe-emoji">${bImg}</span>
        <div class="recipe-info"><strong>${def.name||buildingName(b.id)}</strong>
        <span class="recipe-time">${cost} p. + 2 terrain${canBuy?'':coins<cost?' (pas assez)':' (terrain plein)'}</span></div></div>
        <div class="recipe-ingredients"><span class="recipe-ingredient">${def.description||''}</span></div></div>`;
    });
    html += '</div>';
  }

  // Locked (not yet unlocked by level)
  const lockedList = ALL_BUILDINGS.filter(b => !unlocked.includes(b.id) && !built.includes(b.id));
  if (lockedList.length > 0) {
    html += '<div class="req-section"><h4>\u00C0 d\u00E9bloquer</h4>';
    lockedList.forEach(b => {
      const def = defs[b.id]||{};
      const cost = def.cost_coins||0;
      const bSrc = S(HD_BUILDINGS[b.id]) || S(`buildings_${b.id}`);
      const bImg = bSrc ? `<img src="${bSrc}" width="28" height="28" style="object-fit:contain;filter:grayscale(1) opacity(.5)">` : '';
      html += `<div class="recipe-card disabled">
        <div class="recipe-header"><span class="recipe-emoji">${bImg}</span>
        <div class="recipe-info"><strong>${def.name||buildingName(b.id)}</strong>
        <span class="recipe-time">Niveau ${b.lvl} requis (tu es ${level}) \u2022 ${cost} p.</span></div></div>
        <div class="recipe-ingredients"><span class="recipe-ingredient">${def.description||''}</span></div></div>`;
    });
    html += '</div>';
  }

  const buildInfoSrc = S('hayday_barn');
  const buildInfoIcon = buildInfoSrc ? `<img src="${buildInfoSrc}" width="40" height="40" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">` : '';
  showInfo({ icon: buildInfoIcon, title: 'B\u00E2timents', desc: 'Construis des b\u00E2timents pour transformer tes r\u00E9coltes en produits de valeur !' });
  document.getElementById('info-requirements').innerHTML = html;
}

function showAnimalMenu() {
  const unlocked = farmData.unlocked_animals || [];
  const level = farmData.level || 1;
  const coins = farmData.coins || 0;
  const landFree = (farmData.land_total||20) - (farmData.land_used||0);
  const defs = farmData.animal_defs || {};

  let html = '';

  // Owned
  const owned = (farmData.pastures||[]).map(p => p.animal_type);
  const ownedUnique = [...new Set(owned)];
  if (ownedUnique.length > 0) {
    html += '<div class="req-section"><h4>Tes animaux</h4>';
    ownedUnique.forEach(aid => {
      const def = defs[aid]||{};
      const count = (farmData.pastures||[]).filter(p=>p.animal_type===aid).reduce((s,p)=>s+(p.count||1),0);
      html += `<div class="recipe-card" onclick="showAnimalInfo('${aid}');hideOverlay()">
        <div class="recipe-header">${animalLbl(aid,28)||animalImg(aid,28)}
        <div class="recipe-info"><strong>${def.name||aid} x${count}</strong>
        <span class="recipe-time">Produit ${def.product||''} / ${def.produce_every_n_reviews||10} reviews</span></div></div></div>`;
    });
    html += '</div>';
  }

  // Available
  const availAnimals = ALL_ANIMALS.filter(a => unlocked.includes(a.id));
  if (availAnimals.length > 0) {
    html += '<div class="req-section"><h4>Disponibles</h4>';
    availAnimals.forEach(a => {
      const def = defs[a.id]||{};
      const cost = def.cost_coins||0;
      const hasPasture = (farmData.pastures||[]).some(p => p.animal_type === a.id);
      const needsLand = !hasPasture;
      const canBuy = coins >= cost && (!needsLand || landFree >= 2);
      const landNote = needsLand ? ' + 2 terrain' : '';
      html += `<div class="recipe-card ${canBuy?'':'disabled'}" onclick="${canBuy?`pycmd('farm:add_pasture:${a.id}');hideOverlay()`:''}">
        <div class="recipe-header">${animalLbl(a.id,28)||animalImg(a.id,28)}
        <div class="recipe-info"><strong>${def.name||a.id}</strong>
        <span class="recipe-time">${cost} p.${landNote} \u2022 ${def.product||''}</span></div></div></div>`;
    });
    html += '</div>';
  }

  // Locked
  const lockedAnimals = ALL_ANIMALS.filter(a => !unlocked.includes(a.id));
  if (lockedAnimals.length > 0) {
    html += '<div class="req-section"><h4>\u00C0 d\u00E9bloquer</h4>';
    lockedAnimals.forEach(a => {
      const def = defs[a.id]||{};
      const cost = def.cost_coins||0;
      html += `<div class="recipe-card disabled">
        <div class="recipe-header" style="filter:grayscale(1) opacity(.5)">${animalLbl(a.id,28)||animalImg(a.id,28)}
        <div class="recipe-info"><strong>${def.name||a.id}</strong>
        <span class="recipe-time">Niveau ${a.lvl} (tu es ${level}) \u2022 ${cost} p. \u2022 ${def.product||''}</span></div></div></div>`;
    });
    html += '</div>';
  }

  const animalInfoSrc = S('hayday_cow');
  const animalInfoIcon = animalInfoSrc ? `<img src="${animalInfoSrc}" width="40" height="40" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">` : '';
  showInfo({ icon: animalInfoIcon, title: 'Animaux', desc: 'Les animaux produisent des ressources pr\u00E9cieuses pendant que tu r\u00E9vises !' });
  document.getElementById('info-requirements').innerHTML = html;
}

function showAnimalInfo(animalType) {
  const defs = farmData.animal_defs || {};
  const def = defs[animalType] || {};
  const aSrc = S(`hayday_${animalType}_lbl`) || S(`hayday_${animalType}`);
  const aIcon = aSrc ? `<img src="${aSrc}" width="40" height="40" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">` : '';
  showInfo({
    icon: aIcon,
    title: def.name || animalType,
    desc: `Produit ${def.product||''} tous les ${def.produce_every_n_reviews||10} reviews.`,
    produces: [`${def.product||''} (${def.produce_every_n_reviews||10} reviews)`],
  });
}

// --- Decoration Rendering ---
// (DECO_EMOJI removed — all rendering uses ITEM_ICONS SVGs or hayday sprites)
// Decorations are rendered in the Village zone grid via renderVillage()

// --- Weather System ---
let currentWeather = null;
function updateWeather() {
  const now = new Date();
  const hour = now.getHours();
  let weather = 'day';
  if (hour >= 21 || hour < 6) weather = 'night';
  else if (hour >= 18) weather = 'sunset';
  else if (hour >= 6 && hour < 8) weather = 'dawn';
  // Random rain chance (seeded by day)
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(),0,0))/(1000*60*60*24));
  if (dayOfYear % 7 === 3 || dayOfYear % 7 === 5) weather = 'rain';
  if (weather === currentWeather) return;
  currentWeather = weather;
  const sky = document.querySelector('.farm-sky');
  const world = document.getElementById('farm-world');
  const atm = document.querySelector('.farm-atmosphere');
  // Remove existing weather classes
  document.body.classList.remove('weather-day','weather-night','weather-sunset','weather-dawn','weather-rain');
  document.body.classList.add('weather-' + weather);
  // Remove existing rain layer
  const oldRain = document.getElementById('rain-layer');
  if (oldRain) oldRain.remove();
  if (weather === 'rain') {
    const rainLayer = document.createElement('div'); rainLayer.id = 'rain-layer';
    for (let i = 0; i < 40; i++) {
      const drop = document.createElement('div'); drop.className = 'rain-drop';
      drop.style.left = Math.random()*100+'%'; drop.style.animationDelay = Math.random()*2+'s';
      drop.style.animationDuration = (0.5+Math.random()*0.5)+'s';
      rainLayer.appendChild(drop);
    }
    document.getElementById('farm-container').appendChild(rainLayer);
  }
}

function showTab(tab) {
  if (tab === currentPanel) { hidePanel(); return; }
  if (tab === 'farm') { hidePanel(); pycmd('farm:get_state'); return; }
  currentPanel = tab;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  const tabEl = document.getElementById(`tab-${tab}`);
  if (tabEl) tabEl.classList.add('active');
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
  const panel = document.getElementById(`panel-${tab}`);
  if (panel) { panel.classList.remove('hidden');
    if(tab==='inventory')renderInventory();if(tab==='buildings')renderBuildingsPanel();
    if(tab==='orders')renderOrders();if(tab==='shop')renderShop();
    if(tab==='achievements')renderAchievements();if(tab==='settings')renderSettings();
  }
  SoundMgr.play('click');
}
function hidePanel() { currentPanel=null; document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden')); document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active')); document.getElementById('tab-farm')?.classList.add('active'); }

function renderInventory() {
  const grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
  const inv = farmData.inventory||{}, cat = farmData.item_catalog||{};
  const barnSpr = S('hayday_barn');
  const siloSpr = S('hayday_silo');
  const barnIcon = barnSpr ? `<img src="${barnSpr}" width="14" height="14" style="vertical-align:middle;margin-right:2px">` : '';
  const siloIcon = siloSpr ? `<img src="${siloSpr}" width="14" height="14" style="vertical-align:middle;margin-right:2px">` : '';
  document.getElementById('barn-status').innerHTML = `${barnIcon}Grange: ${farmData.barn_used||0}/${farmData.barn_capacity||50}`;
  document.getElementById('silo-status').innerHTML = `${siloIcon}Silo: ${farmData.silo_used||0}/${farmData.silo_capacity||50}`;
  Object.entries(inv).forEach(([id,qty]) => {
    if (qty<=0) return; const it = cat[id]||{};
    const el = document.createElement('div'); el.className = 'item-cell';
    // Tap = show item info, info card has sell button
    // Click tile = sell if sellable, otherwise show info
    if ((it.sell_price||0) > 0 && qty > 0) {
      el.onclick = () => { SoundMgr.play('click'); showSellDialog(id, qty); };
    } else {
      el.onclick = () => showItemInfo(id);
    }
    const icon = itemIcon(id, 36);
    // Add info button
    el.innerHTML = `${icon}<span class="item-name">${itemName(id)}</span><span class="item-qty">x${qty}</span>${(it.sell_price||0)>0?`<span class="item-price">${it.sell_price} p.</span>`:''}<span class="item-info-btn" onclick="event.stopPropagation();showItemInfo('${id}')">ⓘ</span>`;
    grid.appendChild(el);
  });
  if (!Object.keys(inv).length) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#999;font-size:12px">${LANG.review_to_earn}</div>`;
}

function renderBuildingsPanel() {
  const list = document.getElementById('buildings-list'); list.innerHTML = '';
  const built = Object.keys(farmData.buildings||{});
  const unlocked = farmData.unlocked_buildings||[];
  const level = farmData.level||1;
  const coins = farmData.coins||0;
  const landFree = (farmData.land_total||20) - (farmData.land_used||0);

  ALL_BUILDINGS.forEach(b => {
    const bid = b.id;
    const name = buildingName(bid);
    const bdef = (farmData.building_defs||{})[bid]||{};
    const owned = built.includes(bid);
    const isUnlocked = unlocked.includes(bid);
    const queue = (farmData.production_queues||{})[bid]||[];
    const card = document.createElement('div'); card.className = 'building-card';

    let qHTML = '', subtitle = '', opacity = '1';
    if (owned) {
      qHTML = '<div class="building-queue">';
      queue.forEach(q => { qHTML += `<div class="queue-slot ${q.ready?'ready':''}">${itemIcon(q.recipe_id||'',20)}</div>`; });
      for(let i=queue.length;i<3;i++) qHTML+='<div class="queue-slot">+</div>';
      qHTML+='</div>';
      subtitle = LANG.tap_produce;
      card.onclick = () => pycmd(`farm:building_detail:${bid}`);
    } else if (isUnlocked) {
      const cost = bdef.cost||0;
      const canBuy = coins >= cost && landFree >= 2;
      subtitle = `${cost} pièces + 2 terrain`;
      if (!canBuy) opacity = '0.6';
      card.onclick = () => pycmd(`farm:build:${bid}`);
    } else {
      subtitle = `Niveau ${b.lvl} requis (tu es ${level})`;
      opacity = '0.35';
      card.style.filter = 'grayscale(0.6)';
    }

    card.style.opacity = opacity;
    card.innerHTML = `<div class="building-card-icon">${buildingImg(bid,52)}</div><div class="building-card-info"><h3>${name}</h3><p>${subtitle}</p>${qHTML}</div>`;
    list.appendChild(card);
  });
}

function renderOrders() {
  const list = document.getElementById('orders-list'); list.innerHTML = '';
  const orders = farmData.active_orders||[];

  // Explanation header
  const header = document.createElement('div');
  header.style.cssText = 'padding:8px 12px;font-size:11px;color:#888;line-height:1.4';
  header.innerHTML = '<strong>Les commandes</strong> te rapportent <strong>2x le prix normal</strong> en pièces et XP. Remplis les items demandés et livre !';
  list.appendChild(header);

  if (!orders.length) {
    list.innerHTML += `<div style="text-align:center;padding:20px;color:#999">Aucune commande pour le moment. Elles apparaissent après ta première session de révision !</div>`;
    return;
  }

  orders.forEach((order,i) => {
    const card = document.createElement('div'); card.className = 'order-card';
    const inv = farmData.inventory||{}; let canDo=true, items='';
    Object.entries(order.items_needed||{}).forEach(([id,qty]) => {
      const have=inv[id]||0;
      if(have<qty) canDo=false;
      const enough = have >= qty;
      items+=`<div class="order-item ${enough?'fulfilled':''}">
        ${itemIcon(id,18)}
        <span style="font-weight:600">${itemName(id)}</span>
        <span style="margin-left:auto;font-weight:700;color:${enough?'#4caf50':'#e74c3c'}">${have}/${qty}</span>
      </div>`;
    });

    card.innerHTML = `
      <div class="order-header">
        <span class="order-type"><img src="${order.type==='boat'?ITEM_ICONS._icon_boat:ITEM_ICONS._icon_truck_color}" width="28" height="28" style="vertical-align:middle"> ${order.type==='boat'?'Bateau':'Camion'}</span>
        <span class="order-reward">${order.coin_reward} p. \u2022 +${order.xp_reward} XP</span>
      </div>
      <div class="order-items">${items}</div>
      <button class="order-fulfill-btn" ${canDo?'':'disabled'} onclick="fulfillOrder(${i})">
        ${canDo?'Livrer maintenant !':'Items manquants'}
      </button>
    `;
    list.appendChild(card);
  });
}

function renderShop() {
  const grid = document.getElementById('shop-grid'); grid.innerHTML = '';
  const shopCats=['decorations','animals','upgrades','land'];
  document.querySelectorAll('.shop-tab').forEach((b,i)=>b.classList.toggle('active',shopCats[i]===currentShopCategory));
  if(currentShopCategory==='decorations')renderShopDeco(grid);else if(currentShopCategory==='animals')renderShopAnimals(grid);
  else if(currentShopCategory==='upgrades')renderShopUpgrades(grid);else if(currentShopCategory==='land')renderShopLand(grid);
}
function showShopCategory(cat){currentShopCategory=cat;renderShop()}
function renderShopDeco(grid){
  const defs=farmData.deco_defs||{};
  const coins=farmData.coins||0;
  const DECOS=[
    {id:'hay_bale',cat:'Basique'},{id:'fence',cat:'Basique'},{id:'mailbox',cat:'Basique'},
    {id:'flower_pot',cat:'Basique'},{id:'lamp_post',cat:'Basique'},{id:'bench',cat:'Basique'},
    {id:'scarecrow',cat:'Basique'},{id:'garden_gnome',cat:'Premium'},
    {id:'bird_bath',cat:'Premium'},{id:'tree_oak',cat:'Nature'},{id:'tree_pine',cat:'Nature'},
    {id:'pond',cat:'Nature'},{id:'swing',cat:'Premium'},{id:'fountain',cat:'Premium'},
    {id:'statue_chicken',cat:'Spécial'},{id:'tree_cherry',cat:'Spécial'},
    {id:'arch_flowers',cat:'Spécial'},{id:'statue_cow',cat:'Spécial'},{id:'windmill_deco',cat:'Spécial'},
  ];
  let lastCat='';
  DECOS.forEach(item=>{
    if(item.cat!==lastCat){
      lastCat=item.cat;
      const sep=document.createElement('div');
      sep.style.cssText='grid-column:1/-1;font-size:10px;font-weight:800;color:#888;text-transform:uppercase;padding:6px 0 2px;letter-spacing:.5px';
      sep.textContent=item.cat;
      grid.appendChild(sep);
    }
    const d=defs[item.id]||{};
    const cost=d.cost||0;
    const ok=coins>=cost;
    const el=document.createElement('div');
    el.className='item-cell';
    el.style.opacity=ok?'1':'.45';
    el.onclick=()=>{if(ok){pycmd(`farm:buy_deco:${item.id}`);SoundMgr.play('click')}else showNotification(`Il faut ${cost} pièces (tu as ${coins}).`)};
    const decoSpr = S(`hayday_${item.id}`);
    const decoSvg = ITEM_ICONS[item.id];
    const decoIcon = decoSpr ? `<img src="${decoSpr}" width="32" height="32" style="object-fit:contain">` : decoSvg ? `<img src="${decoSvg}" width="30" height="30" style="object-fit:contain">` : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='10' fill='%234caf50' opacity='.5'/%3E%3Cpath d='M16 8v8M12 12l4-4 4 4' stroke='%23fff' stroke-width='2' fill='none'/%3E%3C/svg%3E" width="30" height="30" style="object-fit:contain">`;
    el.innerHTML=`${decoIcon}<span class="item-name">${d.name||decoName(item.id)}</span><span class="item-price">${cost} p.</span>`;
    grid.appendChild(el);
  });
}
const ANIMAL_INFO_DB = {
  cow: {lvl:10, desc:'Produit du lait tous les 10 reviews. Le lait fait du beurre, fromage, crème.', produces:'Lait \u2192 Beurre, Fromage, Cr\u00E8me'},
  chicken: {lvl:20, desc:'Pond des \u0153ufs tous les 8 reviews. Les \u0153ufs servent aux cookies et g\u00E2teaux.', produces:'\u0152uf \u2192 Cookie, G\u00E2teau'},
  pig: {lvl:30, desc:'Produit du bacon tous les 15 reviews. Le bacon fait des burgers (le plus cher !).', produces:'Bacon \u2192 Burger (35 pi\u00E8ces)'},
  sheep: {lvl:60, desc:'Tond de la laine tous les 20 reviews. La laine se vend tr\u00E8s cher.', produces:'Laine (10 pi\u00E8ces)'},
};

function showAnimalShopInfo(aid) {
  const def = (farmData.animal_defs||{})[aid]||{};
  const info = ANIMAL_INFO_DB[aid]||{};
  const level = farmData.level||1;
  const count = (farmData.animals||{})[aid]?.count||0;
  const maxN = def.max_owned||def.max||5;
  const cost = def.cost_coins||def.cost||100;
  const unlocked = (farmData.unlocked_animals||[]).includes(aid);
  const hasPasture = (farmData.pastures||[]).some(p => p.animal_type === aid);
  const needsLand = !hasPasture;
  const landFree = (farmData.land_total||20) - (farmData.land_used||0);
  const reqs = [
    {label: `Niveau ${info.lvl}`, value: level >= info.lvl ? `\u2713 (${level})` : `\u2717 (${level})`, met: level >= info.lvl},
    {label: `${cost} pi\u00E8ces`, value: (farmData.coins||0) >= cost ? '\u2713' : `\u2717 (${farmData.coins||0})`, met: (farmData.coins||0) >= cost},
    {label: 'Terrain', value: needsLand ? (landFree >= 2 ? `\u2713 (2 requis)` : `\u2717 (${landFree} libre)`) : '\u2713 (enclos existant)', met: !needsLand || landFree >= 2},
    {label: `Possédés`, value: `${count}/${maxN}`, met: count < maxN},
  ];
  showInfo({
    icon: (()=>{const s=S(`hayday_${aid}_lbl`)||S(`hayday_${aid}`);return s?`<img src="${s}" width="40" height="40">`:itemIcon(aid, 40);})(),
    title: def.name || aid,
    desc: info.desc || '',
    requirements: reqs,
    produces: [info.produces || ''],
    action_label: unlocked && count < maxN ? `Acheter (${cost} pi\u00E8ces)` : null,
    action_cmd: unlocked && count < maxN ? `pycmd('farm:add_pasture:${aid}');hideOverlay()` : null,
  });
}

function renderShopAnimals(grid){
  const adefs=farmData.animal_defs||{};
  const level=farmData.level||1;
  const coins=farmData.coins||0;

  ['cow','chicken','pig','sheep'].forEach(aid=>{
    const def=adefs[aid]||{};
    const info=ANIMAL_INFO_DB[aid]||{};
    const name=def.name||animalName(aid);
    const cost=def.cost_coins||def.cost||100;
    const unlocked=(farmData.unlocked_animals||[]).includes(aid);
    const count=(farmData.animals||{})[aid]?.count||0;
    const hasPasture=(farmData.pastures||[]).some(p=>p.animal_type===aid);
    const needsLand=!hasPasture;
    const landFree=(farmData.land_total||20)-(farmData.land_used||0);
    const canBuy=unlocked&&coins>=cost&&(!needsLand||landFree>=2);

    const el=document.createElement('div');
    el.className='item-cell';
    el.style.opacity=canBuy?'1':unlocked?'.7':'.4';
    el.onclick=()=>{if(canBuy){pycmd(`farm:add_pasture:${aid}`);SoundMgr.play('click')}else showAnimalShopInfo(aid)};

    el.innerHTML=`
      ${animalLbl(aid,36)||animalImg(aid,36)}
      <span class="item-name">${name}${count>0?' ('+count+')':''}</span>
      <span class="item-price">${unlocked?`${cost} p.`:`Niv.${info.lvl}`}</span>
      <span class="item-info-btn" onclick="event.stopPropagation();showAnimalShopInfo('${aid}')">ⓘ</span>
    `;
    grid.appendChild(el);
  });
}
function showUpgradeInfo(uid) {
  const d = farmData, inv = d.inventory||{};
  const defs = {
    barn: {name:'Grange',desc:'Stocke les mat\u00E9riaux (boulons, planches, etc). Plus de capacit\u00E9 = plus de mat\u00E9riaux gard\u00E9s.',
      level:d.barn_level||1, cap:d.barn_capacity||50, newCap:(d.barn_capacity||50)+25,
      mats:[{id:'bolt',e:'',n:(d.barn_level||1)+1},{id:'plank',e:'',n:(d.barn_level||1)+1},{id:'duct_tape',e:'',n:(d.barn_level||1)+1}]},
    silo: {name:'Silo',desc:'Stocke les r\u00E9coltes et produits transform\u00E9s. Plus de capacit\u00E9 = plus de production.',
      level:d.silo_level||1, cap:d.silo_capacity||50, newCap:(d.silo_capacity||50)+25,
      mats:[{id:'nail',e:'',n:(d.silo_level||1)+1},{id:'screw',e:'',n:(d.silo_level||1)+1},{id:'paint',e:'',n:(d.silo_level||1)+1}]},
  };
  const u = defs[uid]; if (!u) return;
  const reqs = u.mats.map(m => ({
    label: `${itemName(m.id)} x${m.n}`,
    value: `${inv[m.id]||0}/${m.n}`,
    met: (inv[m.id]||0) >= m.n,
  }));
  const canUp = u.mats.every(m => (inv[m.id]||0) >= m.n);
  const upgSrc = S(uid === 'barn' ? 'hayday_barn' : 'hayday_silo');
  const upgIcon = upgSrc ? `<img src="${upgSrc}" width="40" height="40">` : '';
  showInfo({
    icon: upgIcon, title: `${u.name} \u2014 Niv. ${u.level}`,
    desc: `${u.desc}\n\nCapacit\u00E9 actuelle : ${u.cap} \u2192 ${u.newCap} apr\u00E8s am\u00E9lioration.\n\nLes mat\u00E9riaux tombent al\u00E9atoirement (~12%) quand tu r\u00E9vises des cartes.`,
    requirements: reqs,
    action_label: canUp ? `Améliorer → Niv. ${u.level+1}` : null,
    action_cmd: canUp ? `pycmd('farm:upgrade:${uid}');hideOverlay()` : null,
  });
}

function renderShopUpgrades(grid){
  const d=farmData, inv=d.inventory||{};

  [{id:'barn',name:'Grange',level:d.barn_level||1,cap:d.barn_capacity||50,newCap:(d.barn_capacity||50)+25,
    mats:[{id:'bolt',n:(d.barn_level||1)+1},{id:'plank',n:(d.barn_level||1)+1},{id:'duct_tape',n:(d.barn_level||1)+1}]},
   {id:'silo',name:'Silo',level:d.silo_level||1,cap:d.silo_capacity||50,newCap:(d.silo_capacity||50)+25,
    mats:[{id:'nail',n:(d.silo_level||1)+1},{id:'screw',n:(d.silo_level||1)+1},{id:'paint',n:(d.silo_level||1)+1}]}
  ].forEach(u=>{
    const canUp=u.mats.every(m=>(inv[m.id]||0)>=m.n);
    const el=document.createElement('div');
    el.className='item-cell';
    el.style.opacity=canUp?'1':'.55';
    el.onclick=()=>{if(canUp){pycmd(`farm:upgrade:${u.id}`);SoundMgr.play('click')}else showUpgradeInfo(u.id)};
    el.innerHTML=`
      ${buildingImg(u.id,40)}
      <span class="item-name">${u.name} Niv.${u.level}</span>
      <span class="item-price">${u.cap}→${u.newCap}</span>
      <span class="item-info-btn" onclick="event.stopPropagation();showUpgradeInfo('${u.id}')">ⓘ</span>
    `;
    grid.appendChild(el);
  });
}
function renderShopLand(grid){
  const d=farmData;
  const landTotal=d.land_total||20;
  const landUsed=d.land_used||0;
  const landFree=landTotal-landUsed;
  const coins=d.coins||0;
  const deeds=(d.inventory||{}).land_deed||0;
  const permits=(d.inventory||{}).expansion_permit||0;
  const cost=100*(landTotal/5|0);

  // Status card
  const status=document.createElement('div');
  status.className='item-cell';
  status.style.cssText='grid-column:1/-1;min-height:80px;text-align:left;padding:10px';
  const usedPct=Math.round(landUsed/Math.max(1,landTotal)*100);
  status.innerHTML=`
    <div style="font-weight:800;font-size:14px;margin-bottom:6px">Ton terrain</div>
    <div style="height:8px;background:rgba(0,0,0,.1);border-radius:4px;overflow:hidden;margin-bottom:6px">
      <div style="height:100%;width:${usedPct}%;background:linear-gradient(90deg,#4caf50,#81c784);border-radius:4px"></div>
    </div>
    <div style="font-size:11px;color:#666">
      <strong>${landUsed}/${landTotal}</strong> utilisé •
      Champ = 1 terrain • Bâtiment = 2 • Enclos = 2
    </div>
    <div style="font-size:10px;color:#888;margin-top:4px">
      Champs: ${(d.fields||[]).length} •
      Bâtiments: ${(d.placed_buildings||[]).length} •
      Enclos: ${(d.pastures||[]).length} •
      Libre: <strong>${landFree}</strong>
    </div>
  `;
  grid.appendChild(status);

  // Buy land button
  const canBuy=coins>=cost&&deeds>=1;
  const el=document.createElement('div');
  el.className='item-cell';
  el.style.cssText=`grid-column:1/-1;min-height:80px;text-align:left;padding:10px;opacity:${canBuy?'1':'.5'}`;
  el.onclick=()=>{
    if(canBuy){pycmd('farm:buy_land');SoundMgr.play('click')}
    else if(deeds<1) showNotification('Il te faut un Titre de propri\u00e9t\u00e9. Drop rare en r\u00e9visant !');
    else showNotification(`Il faut ${cost} pi\u00e8ces (tu as ${coins}).`);
  };
  el.innerHTML=`
    <div style="font-weight:800;font-size:13px;margin-bottom:4px">Agrandir le terrain (+5)</div>
    <div style="font-size:11px;color:#666;margin-bottom:6px">
      Plus de terrain = plus de champs, b\u00e2timents et enclos.
    </div>
    <div style="font-size:11px">
      <span style="font-weight:700">Co\u00fbt :</span>
      ${cost} pi\u00e8ces ${coins>=cost?'<span style="color:#4caf50">\u2713</span>':'<span style="color:#e74c3c">\u2717 ('+coins+')</span>'}
      \u2022 Titre x1 ${deeds>=1?'<span style="color:#4caf50">\u2713</span>':'<span style="color:#e74c3c">\u2717 ('+deeds+')</span>'}
    </div>
  `;
  grid.appendChild(el);

  // Info text
  const info=document.createElement('div');
  info.style.cssText='grid-column:1/-1;font-size:10px;color:#999;padding:4px 8px;line-height:1.4';
  info.innerHTML='Les <strong>Titres de propri\u00e9t\u00e9</strong> sont des drops rares (~3%) obtenus en r\u00e9visant des cartes. Continue \u00e0 r\u00e9viser pour en obtenir !';
  grid.appendChild(info);
}

function renderSettings() {
  const stats = document.getElementById('farm-stats');
  if (stats && farmData) {
    const d = farmData;
    const accuracy = d.total_reviews > 0 ? Math.round((d.total_correct||0) / d.total_reviews * 100) : 0;
    stats.innerHTML = `
      <div class="stats-grid">
        <div class="stat-row"><span>${LANG.level_label}</span><strong>${d.level||1}</strong></div>
        <div class="stat-row"><span>${LANG.total_reviews}</span><strong>${formatNum(d.lifetime_reviews||0)}</strong></div>
        <div class="stat-row"><span>${LANG.accuracy}</span><strong>${accuracy}%</strong></div>
        <div class="stat-row"><span>${LANG.best_streak}</span><strong>${d.best_streak||0} jours</strong></div>
        <div class="stat-row"><span>${LANG.coins_total}</span><strong>${formatNum(d.total_coins_earned||0)}</strong></div>
        <div class="stat-row"><span>${LANG.harvests}</span><strong>${d.total_harvests||0}</strong></div>
        <div class="stat-row"><span>${LANG.produced}</span><strong>${d.total_produced||0}</strong></div>
        <div class="stat-row"><span>${LANG.orders_done}</span><strong>${d.orders_completed||0}</strong></div>
        <div class="stat-row"><span>${LANG.items_sold}</span><strong>${d.total_items_sold||0}</strong></div>
        <div class="stat-row"><span>${LANG.total_sessions_label}</span><strong>${d.total_sessions||0}</strong></div>
      </div>`;
  }
}

function renderAchievements(){pycmd('farm:get_achievements')}
const ACH_CATEGORY_ICONS = {
  reviews: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='4' width='24' height='28' rx='3' fill='%234fc3f7'/%3E%3Crect x='7' y='7' width='18' height='22' rx='1' fill='%23fff'/%3E%3Cline x1='10' y1='12' x2='22' y2='12' stroke='%23bbb' stroke-width='1.5'/%3E%3Cline x1='10' y1='16' x2='22' y2='16' stroke='%23bbb' stroke-width='1.5'/%3E%3Cline x1='10' y1='20' x2='18' y2='20' stroke='%23bbb' stroke-width='1.5'/%3E%3Ccircle cx='20' cy='24' r='3' fill='%234caf50'/%3E%3Cpath d='M18.5 24l1 1 2-2' stroke='%23fff' stroke-width='1' fill='none'/%3E%3C/svg%3E",
  streak: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 2 Q20 10 20 14 Q20 20 16 22 Q12 20 12 14 Q12 10 16 2z' fill='%23ff6b00'/%3E%3Cpath d='M16 8 Q18 12 18 15 Q18 19 16 20 Q14 19 14 15 Q14 12 16 8z' fill='%23ffc107'/%3E%3Cpath d='M16 14 Q17 16 17 17.5 Q17 19 16 19.5 Q15 19 15 17.5 Q15 16 16 14z' fill='%23fff' opacity='.7'/%3E%3Cellipse cx='16' cy='27' rx='6' ry='3' fill='%23ff6b00' opacity='.2'/%3E%3C/svg%3E",
  farming: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M16 4 Q18 8 18 12' stroke='%234caf50' stroke-width='2' fill='none'/%3E%3Ccircle cx='16' cy='3' r='2' fill='%234caf50'/%3E%3Cellipse cx='16' cy='14' rx='2' ry='3' fill='%234caf50'/%3E%3Cellipse cx='12' cy='12' rx='3' ry='2' fill='%2366bb6a' transform='rotate(-30 12 12)'/%3E%3Cellipse cx='20' cy='12' rx='3' ry='2' fill='%2366bb6a' transform='rotate(30 20 12)'/%3E%3Crect x='15' y='14' width='2' height='12' fill='%238b5e3c'/%3E%3Cpath d='M10 28 Q16 22 22 28' fill='%235a3520'/%3E%3C/svg%3E",
  production: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='14' width='24' height='14' rx='3' fill='%23c9884a'/%3E%3Crect x='4' y='14' width='24' height='5' rx='2' fill='%23daa06d'/%3E%3Crect x='8' y='4' width='16' height='11' rx='2' fill='%23e0e0e0'/%3E%3Ccircle cx='13' cy='8' r='2' fill='%23bbb'/%3E%3Ccircle cx='19' cy='10' r='1.5' fill='%23bbb'/%3E%3Cpath d='M10 4 Q16 0 22 4' fill='%23bbb' opacity='.4'/%3E%3C/svg%3E",
  orders: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='2' y='10' width='18' height='12' rx='2' fill='%23d4a056'/%3E%3Cpath d='M20 14h6l4 4v4h-10z' fill='%238b5e3c'/%3E%3Ccircle cx='8' cy='24' r='3' fill='%233a2510'/%3E%3Ccircle cx='25' cy='24' r='3' fill='%233a2510'/%3E%3Ccircle cx='8' cy='24' r='1.2' fill='%238b6914'/%3E%3Ccircle cx='25' cy='24' r='1.2' fill='%238b6914'/%3E%3C/svg%3E",
  collection: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='8' width='24' height='20' rx='3' fill='%23c9884a'/%3E%3Crect x='4' y='8' width='24' height='6' rx='3' fill='%23daa06d'/%3E%3Crect x='4' y='8' width='24' height='20' rx='3' fill='none' stroke='%23a06a30' stroke-width='1'/%3E%3Crect x='13' y='5' width='6' height='8' rx='1' fill='%23ffd700' stroke='%23c5a200' stroke-width='.5'/%3E%3C/svg%3E",
  social: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='12' cy='12' r='5' fill='%234fc3f7'/%3E%3Ccircle cx='20' cy='12' r='5' fill='%23ff9800'/%3E%3Cellipse cx='12' cy='24' rx='6' ry='4' fill='%234fc3f7'/%3E%3Cellipse cx='20' cy='24' rx='6' ry='4' fill='%23ff9800'/%3E%3C/svg%3E",
  accuracy: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='13' fill='none' stroke='%23e74c3c' stroke-width='2'/%3E%3Ccircle cx='16' cy='16' r='9' fill='none' stroke='%23e74c3c' stroke-width='1.5'/%3E%3Ccircle cx='16' cy='16' r='5' fill='none' stroke='%23e74c3c' stroke-width='1'/%3E%3Ccircle cx='16' cy='16' r='2' fill='%23e74c3c'/%3E%3C/svg%3E",
};
const ACH_CAT_ALIASES = {streaks:'streak',collections:'collection',economy:'collection',luck:'collection',levels:'streak',upgrades:'production',diversity:'farming',time:'streak'};
function getAchCategoryIcon(cat) {
  const key = (cat||'').toLowerCase().replace(/[^a-z]/g,'');
  return ACH_CATEGORY_ICONS[ACH_CAT_ALIASES[key]||key] || ACH_CATEGORY_ICONS.reviews;
}
function updateAchievements(achs){const list=document.getElementById('achievements-list');list.innerHTML='';const gemSrc=S('ui_gem');(achs||[]).forEach(a=>{const card=document.createElement('div');card.className=`achievement-card ${a.unlocked?'unlocked':'locked'}`;const pct=Math.min(100,a.progress_pct||0);const achCatIcon=getAchCategoryIcon(a.category);card.innerHTML=`<span class="achievement-icon"><img src="${achCatIcon}" width="24" height="24" style="object-fit:contain"></span><div class="achievement-info"><h4>${a.name} <span class="achievement-tier tier-${a.tier}">${a.tier}</span></h4><p>${a.description}</p>${!a.unlocked?`<div class="achievement-progress"><div class="achievement-progress-fill" style="width:${pct}%"></div></div><p style="font-size:8px;color:#aaa;margin-top:2px">${a.current}/${a.target}</p>`:`<p style="font-size:8px;color:#4caf50">${LANG.done}</p>`}</div>${a.gems>0?`<span class="achievement-gem-reward">${gemSrc?`<img src="${gemSrc}" width="12" height="12" style="vertical-align:middle">`:''} ${a.gems}</span>`:''}`;list.appendChild(card)})}

function showPlantDialog(plotId){SoundMgr.play('click');plantingPlotId=plotId;const choices=document.getElementById('crop-choices');choices.innerHTML='';(farmData.unlocked_crops||[]).forEach(id=>{const name=cropName(id);const def=(farmData.crop_defs||{})[id]||{};const gr=def.growth_reviews||3;const totalReviews=gr*4;const harvestMin=def.harvest_min||2;const harvestMax=def.harvest_max||4;const sellPrice=def.sell_price||2;const xpH=def.xp_per_harvest||3;const el=document.createElement('div');el.className='crop-choice';el.onclick=()=>{pycmd(`farm:plant:${plotId}:${id}`);hideOverlay();SoundMgr.play('click')};el.innerHTML=`<div class="crop-choice-icon">${cropPortrait(id,36)||itemIcon(id,36)}</div><div class="crop-choice-info"><strong>${name}</strong><span class="crop-detail"><span class="crop-stat-icon reviews-icon"></span> ${gr} reviews/stade \u2022 ${totalReviews} total</span><span class="crop-detail"><span class="crop-stat-icon harvest-icon"></span> ${harvestMin}-${harvestMax} \u2022 <span class="crop-stat-icon coin-icon-sm"></span> ${sellPrice}/u \u2022 +${xpH} XP</span></div>`;choices.appendChild(el)});document.getElementById('plant-overlay').classList.remove('hidden')}

function harvestPlot(id){
  SoundMgr.play('levelup');
  // Find the plot element and create harvest burst from it
  const plots = document.querySelectorAll('.plot-ready');
  const field = farmData.fields?.find(f => f.id === id);
  if (field && plots.length > 0) {
    // Find the matching plot element
    const allPlots = document.querySelectorAll('.plot');
    const idx = (farmData.fields||[]).findIndex(f => f.id === id);
    const plotEl = allPlots[idx];
    if (plotEl) {
      const rect = plotEl.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      // Create harvest burst particles
      showHarvestBurst(cx, cy, field.crop);
    }
  }
  pycmd(`farm:harvest:${id}`);
}
function showHarvestBurst(x, y, cropId) {
  const layer = document.getElementById('reward-layer');
  const portrait = cropPortrait(cropId, 20);
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'harvest-particle';
    el.innerHTML = portrait || itemIcon(cropId, 18);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.setProperty('--dx', ((Math.random() - 0.5) * 120) + 'px');
    el.style.setProperty('--dy', (-(Math.random() * 80 + 30)) + 'px');
    el.style.animationDelay = (i * 60) + 'ms';
    layer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
  }
}
function plantAllEmpty(){SoundMgr.play('click');pycmd('farm:plant_all_empty')}
function sellItem(id){
  SoundMgr.play('click');
  const qty = (farmData.inventory||{})[id]||0;
  if (qty <= 1) { pycmd(`farm:sell:${id}:1`); return; }
  showSellDialog(id, qty);
}
function showSellDialog(id, qty) {
  const cat = (farmData.item_catalog||{})[id]||{};
  const name = cat.name || id;
  const price = cat.sell_price || 0;
  const overlay = document.getElementById('sell-overlay');
  if (!overlay) return pycmd(`farm:sell:${id}:1`);
  document.getElementById('sell-item-name').innerHTML = `${itemIcon(id,28)} ${itemName(id)}`;
  document.getElementById('sell-item-stock').textContent = `Stock : ${qty}`;
  document.getElementById('sell-unit-price').textContent = `${price} p. / unit\u00e9`;
  const btns = document.getElementById('sell-buttons');
  btns.innerHTML = '';
  const amounts = [1];
  if (qty >= 5) amounts.push(5);
  if (qty >= 10) amounts.push(10);
  amounts.push(qty);
  const seen = new Set();
  amounts.forEach(n => {
    if (seen.has(n)) return; seen.add(n);
    const label = n === qty ? `Tout (${n})` : `x${n}`;
    const total = n * price;
    const btn = document.createElement('button');
    btn.className = 'sell-amount-btn';
    btn.innerHTML = `<span>${label}</span><span class="sell-total">${total} p.</span>`;
    btn.onclick = () => { pycmd(`farm:sell:${id}:${n}`); hideOverlay(); SoundMgr.play('click'); };
    btns.appendChild(btn);
  });
  overlay.classList.remove('hidden');
}
function fulfillOrder(i){SoundMgr.play('click');pycmd(`farm:fulfill_order:${i}`)}

function spinWheel(){if(farmData.can_spin_wheel){SoundMgr.play('click');document.getElementById('wheel-overlay').classList.remove('hidden');drawWheel()}else showNotification(LANG.come_back)}
function doSpinWheel(){if(wheelSpinning)return;wheelSpinning=true;SoundMgr.play('click');document.getElementById('wheel-spin-btn').disabled=true;document.getElementById('wheel-result').classList.add('hidden');pycmd('farm:spin_wheel')}
function showWheelResult(r){
  wheelSpinning=false;
  const segs=9, segAngle=2*Math.PI/segs;
  const targetSeg = r.index||0;
  const targetAngle = (2*Math.PI) - (targetSeg * segAngle + segAngle/2);
  const totalRotation = targetAngle + Math.PI*2*6 + Math.random()*Math.PI*2;
  let elapsed=0, duration=4000, startTime=null;
  function easeOutCubic(t){return 1-Math.pow(1-t,3)}
  (function spin(ts){
    if(!startTime)startTime=ts;
    elapsed=ts-startTime;
    const progress=Math.min(elapsed/duration,1);
    const angle=totalRotation*easeOutCubic(progress);
    drawWheel(angle);
    if(progress<1){requestAnimationFrame(spin)}
    else{
      document.getElementById('wheel-result').textContent=`${LANG.won} : ${r.name} !`;
      document.getElementById('wheel-result').classList.remove('hidden');
      document.getElementById('wheel-spin-btn').disabled=true;
      SoundMgr.play('levelup');
      if (r.prize && (r.prize.gems >= 3 || r.prize.coins >= 100)) createConfetti();
    }
  })(performance.now());
}
function drawWheel(rot){rot=rot||0;const c=document.getElementById('wheel-canvas'),ctx=c.getContext('2d'),cx=140,cy=140,r=130;const segs=[{l:'25 p.',c:'#f44336'},{l:'50 p.',c:'#e91e63'},{l:'100 p.',c:'#9c27b0'},{l:'1 gem',c:'#673ab7'},{l:'3 gem',c:'#3f51b5'},{l:'5 gem',c:'#2196f3'},{l:'3 mat.',c:'#009688'},{l:'3 mat.',c:'#4caf50'},{l:'Titre',c:'#ff9800'}];ctx.clearRect(0,0,280,280);const sa=2*Math.PI/segs.length;segs.forEach((s,i)=>{const a=rot+i*sa;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,a+sa);ctx.closePath();ctx.fillStyle=s.c;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(a+sa/2);ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(s.l,r*.65,4);ctx.restore()});ctx.beginPath();ctx.arc(cx,cy,16,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill()}

function showMysteryBox(i){SoundMgr.play('click');currentBoxIndex=i;document.getElementById('mystery-box-overlay').classList.remove('hidden');document.getElementById('mystery-box-result').classList.add('hidden');document.getElementById('open-box-btn').disabled=false;const icon=document.getElementById('box-icon');icon.className='box-icon';const box=(farmData.mystery_boxes||[])[i]||{};const idx=box.size==='large'?2:box.size==='medium'?1:0;const src=S(`ui_chest_${idx}_closed`);if(src)icon.innerHTML=`<img src="${src}" width="64" height="64" style="image-rendering:pixelated">`;else{const fallbackSrc=S('ui_chest_0_closed');if(fallbackSrc)icon.innerHTML=`<img src="${fallbackSrc}" width="64" height="64" style="image-rendering:pixelated">`;else icon.innerHTML='<div class="css-chest"></div>'}}
function doOpenBox(){if(currentBoxIndex===null)return;SoundMgr.play('click');document.getElementById('box-icon').classList.add('shaking');document.getElementById('open-box-btn').disabled=true;pycmd(`farm:open_box:${currentBoxIndex}`)}
function showBoxResult(r){const icon=document.getElementById('box-icon');icon.classList.remove('shaking');icon.classList.add('opened');setTimeout(()=>{let t=`${LANG.found} : `;const rw=r.reward||{};if(rw.coins)t+=`${rw.coins} ${LANG.pieces} !`;else if(rw.gems)t+=`${rw.gems} ${LANG.gemmes} !`;else if(rw.item)t+=`${rw.qty||1}x ${itemName(rw.item)} !`;document.getElementById('mystery-box-result').textContent=t;document.getElementById('mystery-box-result').classList.remove('hidden');currentBoxIndex=null;SoundMgr.play('levelup');if((rw.gems||0)>=5||(rw.coins||0)>=200)createConfetti()},600)}

function showLevelUp(d){
  SoundMgr.play('levelup');
  document.getElementById('levelup-level').textContent=d.new_level;
  let rw='';if(d.gem_reward>0)rw=`+${d.gem_reward} ${LANG.gemmes}`;
  document.getElementById('levelup-rewards').innerHTML=rw;
  let ul='';(d.unlocks||[]).forEach(u=>{ul+=`<span class="unlock-tag">${itemIcon(u.id||u.type||'', 16)} ${u.name}</span>`});
  document.getElementById('levelup-unlocks').innerHTML=ul;
  document.getElementById('levelup-overlay').classList.remove('hidden');
  createSparkleRain();
  createConfetti();
}
function hideLevelUp(){document.getElementById('levelup-overlay').classList.add('hidden')}

function showDailyLoginBonus(d){
  SoundMgr.play('levelup');
  const day=d.day||1, reward=d.reward||{};
  const el=document.getElementById('login-bonus-overlay');
  document.getElementById('login-day').textContent=day;
  let dots='';
  for(let i=1;i<=7;i++){dots+=`<span class="login-day-dot ${i<=day?'claimed':''} ${i===day?'today':''}">${i}</span>`}
  document.getElementById('login-days-row').innerHTML=dots;
  let rw='';
  if(reward.coins){const cSrc=S('ui_coin');rw+=`<span class="login-reward-item">${cSrc?`<img src="${cSrc}" width="18" height="18" style="vertical-align:middle">`:''} +${reward.coins}</span>`;}
  if(reward.gems){const gSrc=S('ui_gem');rw+=`<span class="login-reward-item">${gSrc?`<img src="${gSrc}" width="18" height="18" style="vertical-align:middle">`:''} +${reward.gems}</span>`;}
  document.getElementById('login-reward-detail').innerHTML=rw;
  el.classList.remove('hidden');
}
function hideLoginBonus(){document.getElementById('login-bonus-overlay').classList.add('hidden')}

function showSessionSummary(d){SoundMgr.play('click');document.getElementById('session-stats').innerHTML=`<div class="session-stat"><div class="session-stat-value">${d.reviews||0}</div><div class="session-stat-label">${LANG.cards}</div></div><div class="session-stat"><div class="session-stat-value">${formatNum(d.coins_earned||0)}</div><div class="session-stat-label">${LANG.coins_earned}</div></div><div class="session-stat"><div class="session-stat-value">${formatNum(d.xp_earned||0)}</div><div class="session-stat-label">${LANG.xp_earned}</div></div><div class="session-stat"><div class="session-stat-value"><span class="css-fire" style="display:inline-block;vertical-align:middle;margin-right:2px"></span>${d.streak||0}</div><div class="session-stat-label">${LANG.streak_label}</div></div>`;let items='';Object.entries(d.items_earned||{}).forEach(([id,qty])=>{items+=`<span class="session-item-tag">${itemIcon(id,14)} ${itemName(id)} x${qty}</span>`});document.getElementById('session-items').innerHTML=items;document.getElementById('session-overlay').classList.remove('hidden')}

function hideOverlay(){document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));wheelSpinning=false}
function showNotification(msg,type){if(!notificationsEnabled&&type!=='reward')return;const area=document.getElementById('notification-area');const el=document.createElement('div');el.className='notification';if(type==='reward')el.classList.add('reward-notif');el.textContent=msg;area.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},3000)}
function showFloatingReward(text,x,y){const layer=document.getElementById('reward-layer');const el=document.createElement('div');el.className='floating-reward';el.textContent=text;el.style.left=(x||window.innerWidth/2)+'px';el.style.top=(y||window.innerHeight/2)+'px';layer.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},1200)}
function showCoinBurst(x,y,n){
  const layer=document.getElementById('reward-layer');
  const coinSrc=S('ui_coin');
  for(let i=0;i<(n||5);i++){
    const el=document.createElement('div');
    el.className='coin-particle';
    if(coinSrc)el.innerHTML=`<img src="${coinSrc}" width="16" height="16">`;
    else el.innerHTML='<span class="css-coin" style="width:12px;height:12px"></span>';
    el.style.left=(x||window.innerWidth/2)+'px';
    el.style.top=(y||window.innerHeight/2)+'px';
    el.style.setProperty('--dx',((Math.random()-.5)*80)+'px');
    el.style.setProperty('--dy',(-(Math.random()*60+20))+'px');
    el.style.animationDelay=(i*50)+'ms';
    layer.appendChild(el);
    setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},1000);
  }
  // Fly a coin to HUD (satisfying collection feel)
  const hudCoins=document.getElementById('hud-coins');
  if(hudCoins&&(n||5)>0){
    const coinFly=document.createElement('div');
    coinFly.className='coin-fly-to-hud';
    if(coinSrc)coinFly.innerHTML=`<img src="${coinSrc}" width="20" height="20">`;
    else coinFly.innerHTML='<span class="css-coin" style="width:16px;height:16px"></span>';
    coinFly.style.left=(x||window.innerWidth/2)+'px';
    coinFly.style.top=(y||window.innerHeight/2)+'px';
    const rect=hudCoins.getBoundingClientRect();
    coinFly.style.setProperty('--target-x',(rect.left+rect.width/2-(x||window.innerWidth/2))+'px');
    coinFly.style.setProperty('--target-y',(rect.top+rect.height/2-(y||window.innerHeight/2))+'px');
    layer.appendChild(coinFly);
    setTimeout(()=>{hudCoins.style.transform='scale(1.2)';setTimeout(()=>{hudCoins.style.transform='';},200)},500);
    setTimeout(()=>{if(coinFly.parentNode)coinFly.parentNode.removeChild(coinFly)},700);
  }
}
function showReward(d){SoundMgr.play('click');if(d.coins){showFloatingReward(`+${d.coins}`,window.innerWidth/2,window.innerHeight/2-20);showCoinBurst(window.innerWidth/2,window.innerHeight/2)}if(d.xp)showFloatingReward(`+${d.xp} XP`,window.innerWidth/2+40,window.innerHeight/2);if(d.items)Object.entries(d.items).forEach(([id,qty])=>{showNotification(`+${qty} ${itemName(id)}`,'reward')});if(d.mystery_box){const sz={small:'petite',medium:'moyenne',large:'grande'}[d.mystery_box.size]||d.mystery_box.size;showNotification(`Une ${sz} boîte mystère est apparue !`,'reward')}}

function showBuildingDetail(bid){pycmd(`farm:building_detail:${bid}`)}
function updateBuildingDetail(data){if(data&&data.recipes)showProductionDialog(data);else if(currentPanel==='buildings')renderBuildingsPanel()}
function showProductionDialog(data){
  const bldSrc = S(HD_BUILDINGS[data.building_id] || `buildings_${data.building_id}`);
  const bldIcon = bldSrc ? `<img src="${bldSrc}" width="22" height="22" style="vertical-align:middle;margin-right:4px">` : '';
  document.getElementById('production-title').innerHTML = `${bldIcon}${data.building_name||'Production'}`;
  const list=document.getElementById('production-recipes');list.innerHTML='';
  const queue=data.queue||[];
  if(queue.length>0){const qd=document.createElement('div');qd.innerHTML=`<h3>${LANG.in_progress}</h3>`;queue.forEach(q=>{const pct=Math.min(100,((q.sessions_waited||0)/Math.max(1,q.sessions_required||1))*100);const s=document.createElement('div');s.className=`production-queue-item ${q.ready?'ready':''}`;s.innerHTML=`<span class="pq-emoji">${itemIcon(q.recipe_id||'',24)}</span><div class="pq-info"><strong>${q.name}</strong><span>${q.ready?LANG.ready:q.sessions_waited+'/'+q.sessions_required+' '+((q.sessions_required||1)>1?LANG.sessions:LANG.session)}</span></div>${!q.ready?`<div class="pq-bar"><div class="pq-bar-fill" style="width:${pct}%"></div></div>`:'<span class="pq-ready-badge">\u2713</span>'}`;qd.appendChild(s)});if(queue.some(q=>q.ready)){const btn=document.createElement('button');btn.className='action-btn';btn.textContent=LANG.collect_all;btn.style.marginTop='6px';btn.onclick=()=>{pycmd(`farm:collect:${data.building_id}`);hideOverlay();SoundMgr.play('click')};qd.appendChild(btn)}list.appendChild(qd)}
  const rd=document.createElement('div');rd.innerHTML=`<h3>${LANG.recipes}</h3>`;
  (data.recipes||[]).forEach(r=>{const c=document.createElement('div');c.className=`recipe-card ${r.can_craft?'':'disabled'}`;let ing='';Object.entries(r.ingredients||{}).forEach(([id,qty])=>{const have=(farmData.inventory||{})[id]||0;ing+=`<span class="recipe-ingredient ${have>=qty?'has':'need'}">${itemIcon(id,14)} ${itemName(id)} ${have}/${qty}</span>`});c.innerHTML=`<div class="recipe-header"><span class="recipe-emoji">${itemIcon(r.id,28)}</span><div class="recipe-info"><strong>${r.name}</strong><span class="recipe-time">${r.sessions_required} ${r.sessions_required>1?LANG.sessions:LANG.session} | +${r.xp} XP</span></div></div><div class="recipe-ingredients">${ing}</div>${r.reason&&!r.can_craft?`<span style="font-size:8px;color:#c62828">${r.reason}</span>`:''}`;if(r.can_craft)c.onclick=()=>{pycmd(`farm:start_production:${data.building_id}:${r.id}`);hideOverlay();SoundMgr.play('click')};rd.appendChild(c)});
  list.appendChild(rd);document.getElementById('production-overlay').classList.remove('hidden');
}

function formatNum(n){if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=10000)return Math.round(n/1000)+'k';if(n>=1000)return(n/1000).toFixed(1)+'k';return String(n)}
// --- Farmer Character ---
function renderFarmer() {
  const el = document.getElementById('farmer-character');
  if (!el) return;
  const src = S('hayday_farmer_woman') || S('hayday_farmer_man');
  if (src) el.innerHTML = `<img src="${src}" width="40" height="48" class="farmer-sprite">`;
  else el.innerHTML = '';
}

// --- Tutorial ---
let tutorialStep = 0;
const TUTORIAL_STEPS = 4;
function showTutorial() {
  tutorialStep = 0;
  const dots = document.getElementById('tutorial-dots');
  dots.innerHTML = '';
  for (let i = 0; i < TUTORIAL_STEPS; i++) {
    const d = document.createElement('span');
    d.className = 'tutorial-dot' + (i === 0 ? ' active' : '');
    dots.appendChild(d);
  }
  const farmer = document.getElementById('tutorial-farmer');
  const src = S('hayday_farmer_man') || S('hayday_farmer_woman');
  if (src) farmer.innerHTML = `<img src="${src}" width="56" height="64">`;
  document.getElementById('tutorial-overlay').classList.remove('hidden');
  updateTutorialStep();
}
function nextTutorialStep() {
  tutorialStep++;
  if (tutorialStep >= TUTORIAL_STEPS) {
    document.getElementById('tutorial-overlay').classList.add('hidden');
    localStorage.setItem('adfarm_tutorial_done', '1');
    return;
  }
  updateTutorialStep();
}
function updateTutorialStep() {
  document.querySelectorAll('.tutorial-step').forEach(s => s.classList.toggle('active', parseInt(s.dataset.step) === tutorialStep));
  document.querySelectorAll('.tutorial-dot').forEach((d, i) => d.classList.toggle('active', i === tutorialStep));
  document.getElementById('tutorial-btn').textContent = tutorialStep === TUTORIAL_STEPS - 1 ? 'Commencer !' : 'Suivant';
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tab-farm').classList.add('active');
  drawWheel();
  renderFarmer();
  pycmd('farm:get_state');
  SoundMgr.playMusic();
  // Show tutorial on first visit
  if (!localStorage.getItem('adfarm_tutorial_done')) {
    setTimeout(showTutorial, 800);
  }
});
