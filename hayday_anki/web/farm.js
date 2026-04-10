/* =============================================================
   ADFarm — Hay Day Clone JavaScript
   SPRITES object is injected before this script by Python
   ============================================================= */

let farmData = {};
let _staticDefs = {};  // Cached static definitions (item_catalog, building_defs, etc.)
let currentPanel = null;
let currentShopCategory = 'upgrades';
let plantingPlotId = null;
let wheelSpinning = false;
let notificationsEnabled = true;
const _almostReadyNotified = new Set(); // Track which plots already showed "almost ready" notification

// Called once on page load — caches static definitions that never change
function initDefs(defs) {
  _staticDefs = defs || {};
  // Apply real Hay Day background image if available
  applyHayDayAssets();
}

function applyHayDayAssets() {
  // Inject SVG icons for missing sprites (truck, wheel, gear, gold star)
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
    // Gold star SVG — replaces the blue star.png for Hay Day gold aesthetic
    SPRITES['_gold_star'] = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cdefs%3E%3ClinearGradient id='sg' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ffe566'/%3E%3Cstop offset='50%25' stop-color='%23ffd700'/%3E%3Cstop offset='100%25' stop-color='%23c5a200'/%3E%3C/linearGradient%3E%3ClinearGradient id='sh' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23fff' stop-opacity='.5'/%3E%3Cstop offset='100%25' stop-color='%23fff' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M24 3l6.5 13.2L45 18.5l-10.2 9.9L37.2 43 24 36l-13.2 7 2.4-14.6L3 18.5l14.5-2.3z' fill='url(%23sg)' stroke='%23b8960e' stroke-width='1.5'/%3E%3Cpath d='M24 3l6.5 13.2L45 18.5l-10.2 9.9L37.2 43 24 36l-13.2 7 2.4-14.6L3 18.5l14.5-2.3z' fill='url(%23sh)'/%3E%3C/svg%3E";
  }
  // Background — keep CSS grass gradients (they match the zone card layout better
  // than the isometric Hay Day image which clashes with flat zone cards)
  // HUD star — use gold star SVG for Hay Day aesthetic (the PNG is blue which clashes)
  const goldStarSrc = S('_gold_star');
  const hudStarImg = document.getElementById('hud-star-img');
  if (goldStarSrc && hudStarImg) { hudStarImg.src = goldStarSrc; hudStarImg.style.display = ''; }
  // HUD XP bar — use CSS track (the xp_pbar_bg sprite has a blue star that
  // clashes with the gold star badge; the CSS track looks cleaner)
  // Coin display — use coin-box sprite as background if available
  const coinBoxSrc = S('hayday_coin-box');
  const hudCoins = document.getElementById('hud-coins');
  if (coinBoxSrc && hudCoins) {
    hudCoins.style.background = `url(${coinBoxSrc}) center/cover no-repeat`;
    hudCoins.style.border = 'none';
    hudCoins.style.minWidth = '84px';
    hudCoins.style.paddingLeft = '26px';
    hudCoins.style.color = '#fff';
  }
  // Coin icon from sprite
  const coinSrc = S('ui_coin');
  const coinEl = document.getElementById('coin-icon');
  if (coinSrc && coinEl) {
    coinEl.innerHTML = `<img src="${coinSrc}" width="16" height="16" style="vertical-align:middle">`;
  } else if (coinEl) {
    coinEl.innerHTML = '<span class="css-coin"></span>';
  }
  // Gem icon from sprite
  const gemSrc = S('ui_gem');
  const gemEl = document.getElementById('gem-icon');
  if (gemSrc && gemEl) {
    gemEl.innerHTML = `<img src="${gemSrc}" width="16" height="16" style="vertical-align:middle">`;
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
  const lvlBgSrc = S('hayday_new-level-bg');
  if (lvlBgSrc) {
    const lvlCard = document.querySelector('.levelup-card');
    if (lvlCard) {
      lvlCard.style.backgroundImage = `url(${lvlBgSrc})`;
      lvlCard.style.backgroundSize = 'cover';
      lvlCard.style.backgroundPosition = 'center';
    }
  }
  // Level up stars — use gold star for Hay Day feel
  const starSrc2 = S('_gold_star') || S('hayday_star');
  const starsEl = document.getElementById('levelup-stars');
  if (starsEl && starSrc2) {
    const starImg = `<img src="${starSrc2}" width="28" height="28" style="vertical-align:middle;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">`;
    starsEl.innerHTML = `${starImg} ${starImg} ${starImg}`;
  }
  // Toolbar icons — use sprites (with SVG fallbacks for missing ones)
  const toolbarIcons = {
    'icon-farm': {sprite: 'hayday_wheat-icon'},
    'icon-inventory': {sprite: 'hayday_silo'},
    'icon-orders': {sprite: '_icon_truck'},
    'icon-shop': {sprite: 'hayday_shop'},
    'icon-achievements': {sprite: '_gold_star'},
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
    'zone-title-fields': 'hayday_wheat-icon',
    'zone-title-workshop': 'hayday_barn',
    'zone-title-pasture': 'hayday_cow',
  };
  for (const [elId, sprKey] of Object.entries(zoneIcons)) {
    const src = S(sprKey);
    const el = document.getElementById(elId);
    if (src && el) {
      el.innerHTML = `<img src="${src}" width="18" height="18" style="vertical-align:middle;margin-right:4px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))"> ${el.textContent}`;
    }
  }
  // Wheel icon inside achievements panel
  const wheelPanelIcon = document.getElementById('icon-wheel-panel');
  const wheelSrc = S('_icon_wheel');
  if (wheelPanelIcon && wheelSrc) {
    wheelPanelIcon.innerHTML = `<img src="${wheelSrc}" width="22" height="22" style="object-fit:contain">`;
  }
  // Use Hay Day green gradient for overlay cards
  const detailsBg = S('hayday_details-bg');
  if (detailsBg) {
    document.querySelectorAll('.overlay-card').forEach(card => {
      if (!card.classList.contains('levelup-card') && !card.classList.contains('login-bonus-card')) {
        card.style.backgroundImage = `url(${detailsBg})`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center bottom';
      }
    });
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

// --- Sound Manager with Web Audio API synth sounds ---
const SoundMgr = {
  enabled: true,
  musicEnabled: false,
  volume: 0.5,
  _ctx: null,
  _getCtx() {
    if (!this._ctx) try { this._ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    return this._ctx;
  },
  play(id) {
    if (!this.enabled) return;
    // Try HTML audio element first
    const el = document.getElementById(`snd-${id}`);
    if (el && el.src) { el.volume = this.volume; el.currentTime = 0; el.play().catch(()=>{}); return; }
    // Fallback: synth sounds via Web Audio API
    this._synth(id);
  },
  // Synthesized game sounds - each action has a unique feel
  _synth(id) {
    const ctx = this._getCtx();
    if (!ctx) return;
    const vol = this.volume * 0.4;
    const t = ctx.currentTime;
    if (id === 'harvest') {
      // Satisfying pluck + ascending chime (like picking fruit)
      [523, 659, 784].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t + i * 0.08);
        g.gain.setValueAtTime(vol * 0.6, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.25);
        o.connect(g); g.connect(ctx.destination);
        o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.3);
      });
    } else if (id === 'plant') {
      // Soft earthy thud + sprout sound
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(140, t + 0.1);
      g.gain.setValueAtTime(vol * 0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.2);
      // Sprout chime
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'sine'; o2.frequency.setValueAtTime(880, t + 0.1);
      g2.gain.setValueAtTime(vol * 0.3, t + 0.1); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o2.connect(g2); g2.connect(ctx.destination); o2.start(t + 0.1); o2.stop(t + 0.35);
    } else if (id === 'coin') {
      // Classic coin ding
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(1318, t); o.frequency.setValueAtTime(1568, t + 0.07);
      g.gain.setValueAtTime(vol * 0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
    } else if (id === 'collect') {
      // Rewarding ascending arpeggio (collecting production)
      [440, 554, 659, 880].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(f, t + i * 0.06);
        g.gain.setValueAtTime(vol * 0.35, t + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(t + i * 0.06); o.stop(t + i * 0.06 + 0.25);
      });
    } else if (id === 'click') {
      // Subtle tap
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(800, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.04);
      g.gain.setValueAtTime(vol * 0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.08);
    } else if (id === 'levelup') {
      // Triumphant fanfare
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = i < 2 ? 'triangle' : 'sine';
        o.frequency.setValueAtTime(f, t + i * 0.12);
        g.gain.setValueAtTime(vol * 0.5, t + i * 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
        o.connect(g); g.connect(ctx.destination);
        o.start(t + i * 0.12); o.stop(t + i * 0.12 + 0.45);
      });
    } else if (id === 'error') {
      // Dull descending tone
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(300, t); o.frequency.exponentialRampToValueAtTime(150, t + 0.15);
      g.gain.setValueAtTime(vol * 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
    } else if (id === 'grow') {
      // Subtle magical growth sound
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(440, t); o.frequency.exponentialRampToValueAtTime(660, t + 0.15);
      g.gain.setValueAtTime(vol * 0.2, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.25);
    }
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
function S(key) {
  // For ALL crop sprites (stages AND portraits), prefer generated SVGs —
  // the PNG sprites are tiny 48x48 pixel art that looks blurry when scaled.
  // SVGs are proper vector art that renders cleanly at any size.
  const isCrop = key.startsWith('crops_');
  if (isCrop && typeof CROP_SVGS !== 'undefined' && CROP_SVGS[key]) return CROP_SVGS[key];
  // For everything else (buildings, UI, hayday assets), prefer real PNG sprites
  if (typeof SPRITES !== 'undefined' && SPRITES[key]) return SPRITES[key];
  // Fallback to generated SVG if no PNG
  if (typeof CROP_SVGS !== 'undefined' && CROP_SVGS[key]) return CROP_SVGS[key];
  return null;
}
function img(key, w, h, cls) {
  const src = S(key);
  if (!src) return '';
  return `<img src="${src}" width="${w||48}" height="${h||48}" class="${cls||''}" draggable="false">`;
}

// Crop IDs now match sprite filenames directly — no remapping needed
const CROP_SPRITE_MAP = {};
function cropImg(id, stage, w) { const s = CROP_SPRITE_MAP[id]||id; return img(`crops_${s}_${stage}`, w||44, w||44, 'plot-crop'); }
function cropPortrait(id, w) { const s = CROP_SPRITE_MAP[id]||id; return img(`crops_${s}_portrait`, w||28, w||28); }

// --- Inline SVG Item Icons (replace emojis) ---
const ITEM_ICONS = {
  // Materials
  bolt: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='28' rx='5' ry='1.5' fill='%23000' opacity='.08'/%3E%3Crect x='9' y='3' width='14' height='7' rx='2' fill='%23bbb' stroke='%23888' stroke-width='.5'/%3E%3Crect x='10' y='4' width='12' height='2' rx='1' fill='%23ddd' opacity='.5'/%3E%3Crect x='12.5' y='10' width='7' height='15' rx='1' fill='%23999' stroke='%23777' stroke-width='.4'/%3E%3Crect x='13' y='10' width='3' height='15' fill='%23bbb' opacity='.25'/%3E%3Cpath d='M12.5 14h7M12.5 17h7M12.5 20h7M12.5 23h7' stroke='%23777' stroke-width='.5' opacity='.5'/%3E%3Crect x='10' y='24' width='12' height='3' rx='1.5' fill='%23aaa' stroke='%23888' stroke-width='.4'/%3E%3C/svg%3E",
  plank: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='26' rx='12' ry='2' fill='%23000' opacity='.06'/%3E%3Crect x='2' y='10' width='28' height='12' rx='2' fill='%23c9884a' stroke='%238b5e3c' stroke-width='.6'/%3E%3Crect x='3' y='10' width='26' height='3' fill='%23daa06d' opacity='.4' rx='1'/%3E%3Cpath d='M11 10v12M21 10v12' stroke='%23a06a30' stroke-width='.5' opacity='.4'/%3E%3Ccircle cx='7' cy='16' r='1.5' fill='none' stroke='%238b5e3c' stroke-width='.5' opacity='.35'/%3E%3Ccircle cx='7' cy='16' r='.5' fill='%238b5e3c' opacity='.3'/%3E%3Ccircle cx='25' cy='16' r='1.5' fill='none' stroke='%238b5e3c' stroke-width='.5' opacity='.35'/%3E%3Ccircle cx='25' cy='16' r='.5' fill='%238b5e3c' opacity='.3'/%3E%3C/svg%3E",
  duct_tape: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='27' rx='8' ry='2' fill='%23000' opacity='.06'/%3E%3Ccircle cx='16' cy='15' r='12' fill='%23888' stroke='%23666' stroke-width='.5'/%3E%3Ccircle cx='16' cy='15' r='7' fill='%23999'/%3E%3Ccircle cx='16' cy='15' r='4' fill='%23aaa'/%3E%3Cellipse cx='13' cy='10' rx='5' ry='2' fill='%23bbb' opacity='.2' transform='rotate(-15 13 10)'/%3E%3Cpath d='M27 14 Q27 11 25 9' stroke='%23aaa' stroke-width='1.5' fill='none' opacity='.3'/%3E%3C/svg%3E",
  nail: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='3' ry='1' fill='%23000' opacity='.06'/%3E%3Ccircle cx='16' cy='6' r='5' fill='%23bbb' stroke='%23888' stroke-width='.5'/%3E%3Cellipse cx='14.5' cy='4.5' rx='2' ry='1' fill='%23ddd' opacity='.4'/%3E%3Crect x='14' y='11' width='4' height='16' rx='.8' fill='%23999' stroke='%23777' stroke-width='.3'/%3E%3Crect x='14.5' y='11' width='1.5' height='16' fill='%23bbb' opacity='.2'/%3E%3Cpath d='M14 27L16 31 18 27' fill='%23888'/%3E%3C/svg%3E",
  screw: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='3' ry='1' fill='%23000' opacity='.06'/%3E%3Ccircle cx='16' cy='6' r='6' fill='%23bbb' stroke='%23888' stroke-width='.5'/%3E%3Cellipse cx='14' cy='4' rx='2.5' ry='1.2' fill='%23ddd' opacity='.3'/%3E%3Cpath d='M12 6h8' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3Cpath d='M16 2v8' stroke='%23666' stroke-width='1.5' stroke-linecap='round'/%3E%3Crect x='14' y='12' width='4' height='15' rx='.8' fill='%23999' stroke='%23777' stroke-width='.3'/%3E%3Cpath d='M14 16h4M14 19h4M14 22h4M14 25h4' stroke='%23777' stroke-width='.6' opacity='.5'/%3E%3C/svg%3E",
  paint: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='28' rx='8' ry='2' fill='%23000' opacity='.08'/%3E%3Crect x='5' y='8' width='22' height='18' rx='2.5' fill='%23e53935' stroke='%23b71c1c' stroke-width='.5'/%3E%3Crect x='5' y='8' width='22' height='5' rx='2' fill='%23c62828'/%3E%3Crect x='6' y='9' width='9' height='2.5' rx='1' fill='%23ef9a9a' opacity='.3'/%3E%3Crect x='13' y='3' width='6' height='7' rx='1.5' fill='%23999' stroke='%23777' stroke-width='.3'/%3E%3Crect x='14' y='4' width='2' height='5' fill='%23bbb' opacity='.25'/%3E%3C/svg%3E",
  land_deed: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='5' y='4' width='22' height='24' rx='2' fill='%23f5e6c8'/%3E%3Crect x='5' y='4' width='22' height='24' rx='2' fill='none' stroke='%23c9a66b' stroke-width='1.5'/%3E%3Cline x1='9' y1='10' x2='23' y2='10' stroke='%23a08050' stroke-width='1'/%3E%3Cline x1='9' y1='14' x2='23' y2='14' stroke='%23a08050' stroke-width='1'/%3E%3Cline x1='9' y1='18' x2='18' y2='18' stroke='%23a08050' stroke-width='1'/%3E%3Ccircle cx='20' cy='22' r='3.5' fill='%23c9884a' stroke='%23a06a30' stroke-width='1'/%3E%3C/svg%3E",
  expansion_permit: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='6' width='24' height='20' rx='2' fill='%234caf50'/%3E%3Crect x='4' y='6' width='24' height='20' rx='2' fill='none' stroke='%232e7d32' stroke-width='1.5'/%3E%3Crect x='6' y='8' width='20' height='16' rx='1' fill='none' stroke='%23fff' stroke-width='.5' opacity='.3'/%3E%3Cpath d='M12 16h8M16 12v8' stroke='%23fff' stroke-width='2.5' stroke-linecap='round'/%3E%3C/svg%3E",
  // Pig SVG (missing from hayday/ PNGs — inline fallback for pasture labels)
  pig: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='26' rx='10' ry='2' fill='%23000' opacity='.06'/%3E%3Cellipse cx='16' cy='20' rx='11' ry='8' fill='%23f8bbd0'/%3E%3Cellipse cx='16' cy='19' rx='10' ry='7' fill='%23fce4ec'/%3E%3Ccircle cx='16' cy='13' r='7.5' fill='%23f8bbd0'/%3E%3Ccircle cx='16' cy='12.5' r='7' fill='%23fce4ec'/%3E%3Cpath d='M10 8 Q9 4 11.5 5.5' fill='%23f8bbd0' stroke='%23f48fb1' stroke-width='.4'/%3E%3Cpath d='M22 8 Q23 4 20.5 5.5' fill='%23f8bbd0' stroke='%23f48fb1' stroke-width='.4'/%3E%3Ccircle cx='13.5' cy='11' r='1.5' fill='%23333'/%3E%3Ccircle cx='13.8' cy='10.7' r='.4' fill='%23fff' opacity='.5'/%3E%3Ccircle cx='18.5' cy='11' r='1.5' fill='%23333'/%3E%3Ccircle cx='18.8' cy='10.7' r='.4' fill='%23fff' opacity='.5'/%3E%3Cellipse cx='16' cy='15' rx='4' ry='2.8' fill='%23f48fb1'/%3E%3Ccircle cx='14.5' cy='14.8' r='.7' fill='%23e91e63' opacity='.4'/%3E%3Ccircle cx='17.5' cy='14.8' r='.7' fill='%23e91e63' opacity='.4'/%3E%3Cellipse cx='13' cy='10' rx='2.5' ry='1.5' fill='%23fff' opacity='.2'/%3E%3Cpath d='M22 22 Q24 24 23 26' stroke='%23f48fb1' stroke-width='1.2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
  // Animal products
  milk: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='mb' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%23dce8f0'/%3E%3C/linearGradient%3E%3ClinearGradient id='ml' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e3f2fd'/%3E%3Cstop offset='1' stop-color='%23bbdefb'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M11 10h10l1.5 3v13a2.5 2.5 0 01-2.5 2.5h-8A2.5 2.5 0 019.5 26V13z' fill='url(%23mb)' stroke='%23b0bec5' stroke-width='.8'/%3E%3Cpath d='M11.5 7h9a1 1 0 011 1v3h-11V8a1 1 0 011-1z' fill='%23a1887f' stroke='%238d6e63' stroke-width='.6'/%3E%3Crect x='13' y='5' width='6' height='3' rx='1' fill='%238d6e63'/%3E%3Crect x='10.5' y='15' width='11' height='10' rx='1.5' fill='url(%23ml)' opacity='.55'/%3E%3Cpath d='M11 20 Q16 17 21 20' stroke='%23fff' stroke-width='1.2' fill='none' opacity='.7'/%3E%3Cpath d='M12 5.5h8' stroke='%23a1887f' stroke-width='.5'/%3E%3Cellipse cx='14' cy='13' rx='3' ry='1.5' fill='%23fff' opacity='.45'/%3E%3Crect x='12' y='18' width='8' height='1.5' rx='.5' fill='%2390caf9' opacity='.2'/%3E%3Cpath d='M18 8v2.5' stroke='%23795548' stroke-width='.4' opacity='.5'/%3E%3C/svg%3E",
  egg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3CradialGradient id='eg' cx='.4' cy='.35' r='.65'%3E%3Cstop offset='0' stop-color='%23fff8ef'/%3E%3Cstop offset='.5' stop-color='%23f5e0c0'/%3E%3Cstop offset='1' stop-color='%23d4b896'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='17' rx='9.5' ry='12' fill='url(%23eg)'/%3E%3Cellipse cx='16' cy='17' rx='9.5' ry='12' fill='none' stroke='%23c9a87c' stroke-width='.8'/%3E%3Cellipse cx='13' cy='12' rx='4.5' ry='3.5' fill='%23fff' opacity='.5' transform='rotate(-15 13 12)'/%3E%3Cellipse cx='12' cy='11' rx='2' ry='1.5' fill='%23fff' opacity='.6'/%3E%3Cellipse cx='19' cy='23' rx='5' ry='3' fill='%23c9a87c' opacity='.15'/%3E%3Cpath d='M9 24 Q16 28 23 24' stroke='%23b89870' stroke-width='.5' fill='none' opacity='.3'/%3E%3C/svg%3E",
  bacon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='bk' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e53935'/%3E%3Cstop offset='1' stop-color='%23b71c1c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3 9 Q7 5 11 9 Q15 13 19 9 Q23 5 27 9 L28 11 Q24 7 20 11 Q16 15 12 11 Q8 7 4 11Z' fill='url(%23bk)'/%3E%3Cpath d='M3 10.5 Q7 6.5 11 10.5 Q15 14.5 19 10.5 Q23 6.5 27 10.5 L28 12.5 Q24 8.5 20 12.5 Q16 16.5 12 12.5 Q8 8.5 4 12.5Z' fill='%23f8bbd0'/%3E%3Cpath d='M3 13 Q7 9 11 13 Q15 17 19 13 Q23 9 27 13 L28 15 Q24 11 20 15 Q16 19 12 15 Q8 11 4 15Z' fill='url(%23bk)'/%3E%3Cpath d='M3 14.5 Q7 10.5 11 14.5 Q15 18.5 19 14.5 Q23 10.5 27 14.5 L28 16.5 Q24 12.5 20 16.5 Q16 20.5 12 16.5 Q8 12.5 4 16.5Z' fill='%23f8bbd0'/%3E%3Cpath d='M3 17 Q7 13 11 17 Q15 21 19 17 Q23 13 27 17 L28 19 Q24 15 20 19 Q16 23 12 19 Q8 15 4 19Z' fill='url(%23bk)'/%3E%3Cpath d='M3 18.5 Q7 14.5 11 18.5 Q15 22.5 19 18.5 Q23 14.5 27 18.5 L28 20 Q24 16 20 20 Q16 24 12 20 Q8 16 4 20Z' fill='%23f8bbd0'/%3E%3Cpath d='M3 20 Q7 16 11 20 Q15 24 19 20 Q23 16 27 20 L28 22 Q24 18 20 22 Q16 26 12 22 Q8 18 4 22Z' fill='url(%23bk)'/%3E%3Cpath d='M5 10 Q9 7 13 11' stroke='%23fff' stroke-width='.6' fill='none' opacity='.35'/%3E%3Cpath d='M5 14 Q9 11 13 15' stroke='%23fff' stroke-width='.6' fill='none' opacity='.3'/%3E%3C/svg%3E",
  wool: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3CradialGradient id='wg' cx='.4' cy='.3' r='.7'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%23e8e0d4'/%3E%3C/radialGradient%3E%3C/defs%3E%3Ccircle cx='16' cy='16' r='12' fill='url(%23wg)'/%3E%3Ccircle cx='16' cy='16' r='12' fill='none' stroke='%23d5cbbe' stroke-width='.6'/%3E%3Ccircle cx='11' cy='11' r='4.5' fill='%23f5f0ea' stroke='%23e0d8cc' stroke-width='.4'/%3E%3Ccircle cx='20' cy='10' r='4' fill='%23f8f4ee' stroke='%23e0d8cc' stroke-width='.4'/%3E%3Ccircle cx='16' cy='17' r='4.5' fill='%23f0ebe3' stroke='%23e0d8cc' stroke-width='.4'/%3E%3Ccircle cx='10' cy='18' r='3.5' fill='%23ede6dc' stroke='%23ddd4c6' stroke-width='.4'/%3E%3Ccircle cx='22' cy='17' r='3.5' fill='%23ede6dc' stroke='%23ddd4c6' stroke-width='.4'/%3E%3Ccircle cx='16' cy='8' r='3' fill='%23faf7f2' stroke='%23e0d8cc' stroke-width='.3'/%3E%3Ccircle cx='16' cy='23' r='3' fill='%23e8e0d4' stroke='%23ddd4c6' stroke-width='.3'/%3E%3Cellipse cx='12' cy='10' rx='2' ry='1.2' fill='%23fff' opacity='.5'/%3E%3Cellipse cx='18' cy='8' rx='1.5' ry='1' fill='%23fff' opacity='.4'/%3E%3Cpath d='M13 25 Q14 28 16 28 Q18 28 18 26' stroke='%23e74c3c' stroke-width='1.2' fill='none'/%3E%3Ccircle cx='15' cy='28' r='1.5' fill='%23e74c3c'/%3E%3Ccircle cx='17.5' cy='27.5' r='1.2' fill='%23c62828'/%3E%3C/svg%3E",
  // Processed goods
  bread: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='bg' x1='0' y1='0' x2='.3' y2='1'%3E%3Cstop offset='0' stop-color='%23f0c888'/%3E%3Cstop offset='.5' stop-color='%23d4943c'/%3E%3Cstop offset='1' stop-color='%23b87020'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='22' rx='13' ry='5' fill='%23a06020' opacity='.3'/%3E%3Cpath d='M4 18 Q4 12 8 10 Q12 8 16 9 Q20 8 24 10 Q28 12 28 18 L27 22 Q24 24 16 24 Q8 24 5 22Z' fill='url(%23bg)'/%3E%3Cpath d='M4 18 Q4 12 8 10 Q12 8 16 9 Q20 8 24 10 Q28 12 28 18' fill='none' stroke='%23a06828' stroke-width='.6'/%3E%3Cpath d='M10 11 Q13 18 16 11' stroke='%23b07828' stroke-width='1' fill='none' opacity='.5'/%3E%3Cpath d='M16 11 Q19 18 22 11' stroke='%23b07828' stroke-width='1' fill='none' opacity='.5'/%3E%3Cpath d='M7 13 Q10 18 13 12' stroke='%23b07828' stroke-width='.8' fill='none' opacity='.4'/%3E%3Cpath d='M19 12 Q22 17 25 13' stroke='%23b07828' stroke-width='.8' fill='none' opacity='.4'/%3E%3Cellipse cx='12' cy='12' rx='5' ry='2.5' fill='%23f8d898' opacity='.45'/%3E%3Cellipse cx='9' cy='11' rx='2' ry='1' fill='%23fff' opacity='.25'/%3E%3Cpath d='M6 20 Q16 22 26 20' stroke='%23a06828' stroke-width='.5' fill='none' opacity='.3'/%3E%3C/svg%3E",
  butter: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='bu' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23fff176'/%3E%3Cstop offset='.5' stop-color='%23ffd54f'/%3E%3Cstop offset='1' stop-color='%23f9a825'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3 16 L6 26 H26 L29 16 H22 V13 H3Z' fill='%23f5f0e0' stroke='%23d5c8a8' stroke-width='.5'/%3E%3Cpath d='M3 16 L6 26 H14 V16Z' fill='%23ece5d0' stroke='%23d5c8a8' stroke-width='.3'/%3E%3Crect x='8' y='10' width='16' height='10' rx='1.5' fill='url(%23bu)' stroke='%23e6a800' stroke-width='.6'/%3E%3Crect x='8' y='10' width='16' height='5' rx='1.5' fill='%23ffe082' opacity='.5'/%3E%3Crect x='9.5' y='11' width='7' height='2.5' rx='.8' fill='%23fff' opacity='.35'/%3E%3Cpath d='M8 15h16' stroke='%23e6a800' stroke-width='.3' opacity='.4'/%3E%3Cpath d='M22 13v-3' stroke='%23f9a825' stroke-width='.3' opacity='.3'/%3E%3Crect x='8' y='18' width='4' height='1' rx='.3' fill='%23f9a825' opacity='.2'/%3E%3C/svg%3E",
  cheese: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='cg' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffe082'/%3E%3Cstop offset='1' stop-color='%23f9a825'/%3E%3C/linearGradient%3E%3ClinearGradient id='cs' x1='1' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23fff9c4'/%3E%3Cstop offset='1' stop-color='%23ffca28'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M3 26L16 5l14 21z' fill='url(%23cg)' stroke='%23e6a800' stroke-width='.8'/%3E%3Cpath d='M3 26L16 5v21z' fill='url(%23cs)'/%3E%3Cpath d='M3 26L16 5' stroke='%23f9a825' stroke-width='.8'/%3E%3Ccircle cx='10' cy='20' r='2.5' fill='%23e6a800' opacity='.45'/%3E%3Ccircle cx='10' cy='20' r='2.5' fill='none' stroke='%23d49a00' stroke-width='.3'/%3E%3Ccircle cx='18' cy='21' r='2' fill='%23d49a00' opacity='.35'/%3E%3Ccircle cx='18' cy='21' r='2' fill='none' stroke='%23c68a00' stroke-width='.3'/%3E%3Ccircle cx='14' cy='14' r='1.3' fill='%23e6a800' opacity='.4'/%3E%3Ccircle cx='22' cy='22' r='1.5' fill='%23d49a00' opacity='.3'/%3E%3Cpath d='M5 24L15 8' stroke='%23fff' stroke-width='.5' opacity='.2'/%3E%3Cellipse cx='9' cy='16' rx='3' ry='1.5' fill='%23fff' opacity='.15'/%3E%3C/svg%3E",
  sugar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='sg' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23ffffff'/%3E%3Cstop offset='1' stop-color='%23e8e0d0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M8 8h16v18a2 2 0 01-2 2H10a2 2 0 01-2-2z' fill='url(%23sg)' stroke='%23c8bfa8' stroke-width='.7'/%3E%3Cpath d='M8 8 L10 5 H22 L24 8Z' fill='%23f0e8d8' stroke='%23c8bfa8' stroke-width='.5'/%3E%3Cpath d='M12 5 Q16 3 20 5' stroke='%23d0c8b0' stroke-width='.5' fill='none'/%3E%3Ccircle cx='15' cy='4.5' r='.6' fill='%23fff'/%3E%3Ccircle cx='17' cy='4' r='.5' fill='%23f0e8d8'/%3E%3Ccircle cx='14' cy='3.8' r='.4' fill='%23fff'/%3E%3Crect x='11' y='14' width='10' height='8' rx='1' fill='none' stroke='%23d4c8a8' stroke-width='.5'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-size='7' font-weight='bold' fill='%23a08860'%3ES%3C/text%3E%3Crect x='9' y='9' width='8' height='2.5' rx='.8' fill='%23fff' opacity='.4'/%3E%3Cpath d='M8 12h16' stroke='%23d0c8b0' stroke-width='.3'/%3E%3C/svg%3E",
  cream: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='cr' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23fff8e1'/%3E%3Cstop offset='1' stop-color='%23f5e6c0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M9 14h14v11a3 3 0 01-3 3H12a3 3 0 01-3-3z' fill='url(%23cr)' stroke='%23d4b880' stroke-width='.7'/%3E%3Crect x='9' y='18' width='14' height='5' rx='1' fill='%23e91e63' opacity='.25'/%3E%3Crect x='11' y='19' width='10' height='3' rx='.5' fill='none' stroke='%23e91e63' stroke-width='.3' opacity='.4'/%3E%3Cpath d='M9 14h14' stroke='%23c8a868' stroke-width='.8'/%3E%3Ccircle cx='16' cy='10' r='5.5' fill='%23fff' stroke='%23f0e0c0' stroke-width='.5'/%3E%3Ccircle cx='12' cy='10' r='4' fill='%23fffde7'/%3E%3Ccircle cx='20' cy='10' r='4' fill='%23fffde7'/%3E%3Ccircle cx='16' cy='7' r='3.5' fill='%23fff'/%3E%3Ccircle cx='14' cy='8' r='2.5' fill='%23fff'/%3E%3Ccircle cx='18.5' cy='8.5' r='2' fill='%23fffde7'/%3E%3Cellipse cx='14' cy='7' rx='1.5' ry='1' fill='%23fff' opacity='.6'/%3E%3Cellipse cx='10' cy='15' rx='3' ry='1' fill='%23fff' opacity='.3'/%3E%3C/svg%3E",
  cookie: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3CradialGradient id='ck' cx='.4' cy='.35' r='.65'%3E%3Cstop offset='0' stop-color='%23e0a860'/%3E%3Cstop offset='.7' stop-color='%23c48838'/%3E%3Cstop offset='1' stop-color='%23a06820'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='24' rx='11' ry='2' fill='%23000' opacity='.1'/%3E%3Ccircle cx='16' cy='16' r='12' fill='url(%23ck)' stroke='%23906020' stroke-width='.7'/%3E%3Ccircle cx='11' cy='11' r='2.2' fill='%234e342e' stroke='%233e2723' stroke-width='.3'/%3E%3Cellipse cx='10.5' cy='10.3' rx='1' ry='.6' fill='%236d4c41' opacity='.6'/%3E%3Ccircle cx='19' cy='12' r='1.8' fill='%234e342e' stroke='%233e2723' stroke-width='.3'/%3E%3Cellipse cx='18.5' cy='11.4' rx='.8' ry='.5' fill='%236d4c41' opacity='.6'/%3E%3Ccircle cx='14' cy='19' r='2' fill='%234e342e' stroke='%233e2723' stroke-width='.3'/%3E%3Ccircle cx='21' cy='19' r='1.5' fill='%234e342e' stroke='%233e2723' stroke-width='.3'/%3E%3Ccircle cx='8' cy='16' r='1.3' fill='%234e342e' stroke='%233e2723' stroke-width='.3'/%3E%3Ccircle cx='17' cy='23' r='1.2' fill='%234e342e'/%3E%3Cellipse cx='12' cy='14' rx='4' ry='2' fill='%23e8b868' opacity='.3'/%3E%3Cellipse cx='10' cy='10' rx='2' ry='1' fill='%23fff' opacity='.15'/%3E%3Ccircle cx='5' cy='26' r='.8' fill='%23c48838' opacity='.5'/%3E%3Ccircle cx='7' cy='27' r='.6' fill='%23c48838' opacity='.4'/%3E%3C/svg%3E",
  cake: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='ca' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23fce4ec'/%3E%3Cstop offset='1' stop-color='%23f8bbd0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='28' rx='12' ry='2' fill='%23000' opacity='.1'/%3E%3Crect x='5' y='20' width='22' height='8' rx='2' fill='%23e8b068'/%3E%3Crect x='5' y='20' width='22' height='3' rx='1.5' fill='url(%23ca)'/%3E%3Cpath d='M5 23 Q8 24.5 16 24.5 Q24 24.5 27 23' stroke='%23f48fb1' stroke-width='.5' fill='none'/%3E%3Crect x='7' y='14' width='18' height='7' rx='1.5' fill='%23d4944c'/%3E%3Crect x='7' y='14' width='18' height='2.5' rx='1' fill='url(%23ca)'/%3E%3Cpath d='M7 16.5 Q12 18 16 17.5 Q20 17 25 16.5' stroke='%23f48fb1' stroke-width='.4' fill='none'/%3E%3Crect x='14.5' y='7' width='3' height='7.5' rx='.8' fill='%23ffe0b2'/%3E%3Cellipse cx='16' cy='6' rx='1.2' ry='2' fill='%23ff9800'/%3E%3Cellipse cx='16' cy='5' rx='.6' ry='1.5' fill='%23ffd54f' opacity='.8'/%3E%3Ccircle cx='16' cy='12' r='2.5' fill='%23e53935'/%3E%3Ccircle cx='16' cy='12' r='2.5' fill='none' stroke='%23c62828' stroke-width='.3'/%3E%3Cellipse cx='15.3' cy='11.2' rx='1' ry='.6' fill='%23fff' opacity='.35'/%3E%3Cpath d='M16 10 L16.5 9.5' stroke='%234caf50' stroke-width='.8'/%3E%3Cellipse cx='10' cy='15' rx='3' ry='1' fill='%23fff' opacity='.15'/%3E%3C/svg%3E",
  pizza: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3CradialGradient id='pz' cx='.5' cy='.5' r='.5'%3E%3Cstop offset='0' stop-color='%23ffe082'/%3E%3Cstop offset='.7' stop-color='%23ffca28'/%3E%3Cstop offset='1' stop-color='%23d4943c'/%3E%3C/radialGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='17' rx='13' ry='12' fill='url(%23pz)' stroke='%23c48830' stroke-width='.8'/%3E%3Cellipse cx='16' cy='17' rx='11' ry='10' fill='%23e53935' opacity='.25'/%3E%3Cellipse cx='16' cy='17' rx='11' ry='10' fill='none' stroke='%23ffca28' stroke-width='.5' opacity='.4'/%3E%3Ccircle cx='11' cy='14' r='2.5' fill='%23c62828' stroke='%23b71c1c' stroke-width='.3'/%3E%3Cellipse cx='10.5' cy='13.5' rx='1' ry='.7' fill='%23e57373' opacity='.4'/%3E%3Ccircle cx='20' cy='13' r='2.2' fill='%23c62828' stroke='%23b71c1c' stroke-width='.3'/%3E%3Ccircle cx='14' cy='21' r='2' fill='%23c62828' stroke='%23b71c1c' stroke-width='.3'/%3E%3Ccircle cx='21' cy='20' r='1.8' fill='%23c62828'/%3E%3Ccircle cx='17' cy='12' r='1.5' fill='%232e7d32' stroke='%231b5e20' stroke-width='.3'/%3E%3Ccircle cx='17' cy='12' r='.7' fill='%23c62828'/%3E%3Ccircle cx='10' cy='20' r='1.3' fill='%232e7d32' stroke='%231b5e20' stroke-width='.3'/%3E%3Ccircle cx='23' cy='17' r='1.2' fill='%232e7d32'/%3E%3Cpath d='M13 16 Q15 15 17 17' stroke='%23ffe082' stroke-width='.8' fill='none' opacity='.5'/%3E%3Cpath d='M19 18 Q21 16 22 18' stroke='%23ffe082' stroke-width='.6' fill='none' opacity='.4'/%3E%3Cellipse cx='13' cy='10' rx='3' ry='1.5' fill='%23fff' opacity='.12'/%3E%3C/svg%3E",
  burger: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='bn' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8a848'/%3E%3Cstop offset='1' stop-color='%23c08030'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='27' rx='11' ry='2' fill='%23000' opacity='.1'/%3E%3Cellipse cx='16' cy='26' rx='12' ry='3.5' fill='%23a06828' stroke='%23885818' stroke-width='.5'/%3E%3Cellipse cx='16' cy='25' rx='12' ry='3' fill='url(%23bn)'/%3E%3Crect x='4' y='21' width='24' height='3' fill='%23ffc107' opacity='.85'/%3E%3Cpath d='M4 21 Q8 20 12 21.5 Q16 22.5 20 21 Q24 20 28 21' stroke='%23f9a825' stroke-width='.5' fill='none'/%3E%3Crect x='3.5' y='18' width='25' height='3.5' rx='.5' fill='%236d4c41' stroke='%234e342e' stroke-width='.4'/%3E%3Crect x='4' y='15' width='24' height='3.5' fill='%23e53935'/%3E%3Ccircle cx='10' cy='16.5' r='.8' fill='%23c62828' opacity='.3'/%3E%3Ccircle cx='18' cy='16' r='.6' fill='%23c62828' opacity='.3'/%3E%3Cpath d='M3 15.5 Q6 13 10 15 Q14 17 18 14.5 Q22 13 28 15' fill='%234caf50' stroke='%232e7d32' stroke-width='.4'/%3E%3Cpath d='M4 14 Q8 16 12 14 Q16 12 20 14 Q24 16 28 14' fill='%234caf50' stroke='%232e7d32' stroke-width='.3'/%3E%3Cellipse cx='16' cy='10' rx='12.5' ry='5' fill='url(%23bn)' stroke='%23a06828' stroke-width='.5'/%3E%3Cellipse cx='16' cy='9' rx='12' ry='4.5' fill='%23d4943c'/%3E%3Cellipse cx='13' cy='8' rx='5' ry='2' fill='%23e8b060' opacity='.4'/%3E%3Cellipse cx='11' cy='7.5' rx='2.5' ry='1' fill='%23fff' opacity='.2'/%3E%3Ccircle cx='12' cy='8' r='.5' fill='%23f5e6c8' opacity='.6'/%3E%3Ccircle cx='16' cy='7.5' r='.5' fill='%23f5e6c8' opacity='.5'/%3E%3Ccircle cx='20' cy='8' r='.5' fill='%23f5e6c8' opacity='.4'/%3E%3C/svg%3E",
  pie: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='pi' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8b868'/%3E%3Cstop offset='1' stop-color='%23c08030'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='22' rx='13.5' ry='7' fill='%23a06828'/%3E%3Cellipse cx='16' cy='21' rx='13' ry='6.5' fill='%23c48838' stroke='%23a06828' stroke-width='.5'/%3E%3Cellipse cx='16' cy='19' rx='12' ry='5.5' fill='url(%23pi)'/%3E%3Cpath d='M5 19 Q10 16 16 19 Q22 22 27 19' stroke='%23c08030' stroke-width='.7' fill='none'/%3E%3Cpath d='M7 19 Q11 17 16 19 Q21 21 25 19' stroke='%23c08030' stroke-width='.6' fill='none'/%3E%3Cpath d='M4 19h24' stroke='%23c08030' stroke-width='.5'/%3E%3Cpath d='M9 19 V16 M13 19 V15 M17 19 V15 M21 19 V16' stroke='%23c08030' stroke-width='.6'/%3E%3Cellipse cx='12' cy='17' rx='4' ry='1.5' fill='%23f0c878' opacity='.35'/%3E%3Cpath d='M13 7 Q14 5 15 7 M15 7 Q16 5 17 7' stroke='%23ccc' stroke-width='.6' fill='none' opacity='.5'/%3E%3Cpath d='M14 9 Q15 7 16 9' stroke='%23ccc' stroke-width='.5' fill='none' opacity='.4'/%3E%3C/svg%3E",
  melon_pie: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='mp' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8b868'/%3E%3Cstop offset='1' stop-color='%23c08030'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='22' rx='13.5' ry='7' fill='%23a06828'/%3E%3Cellipse cx='16' cy='21' rx='13' ry='6.5' fill='%23c48838' stroke='%23a06828' stroke-width='.5'/%3E%3Cellipse cx='16' cy='19' rx='12' ry='5.5' fill='%2366bb6a'/%3E%3Cellipse cx='16' cy='19' rx='12' ry='5.5' fill='none' stroke='%23388e3c' stroke-width='.3'/%3E%3Cellipse cx='14' cy='18' rx='4' ry='2' fill='%2381c784' opacity='.4'/%3E%3Cpath d='M5 19 Q10 16 16 19 Q22 22 27 19' stroke='url(%23mp)' stroke-width='.8' fill='none'/%3E%3Cpath d='M7 19 Q11 17 16 19 Q21 21 25 19' stroke='url(%23mp)' stroke-width='.7' fill='none'/%3E%3Cpath d='M4 19h24' stroke='%23c08030' stroke-width='.5'/%3E%3Cpath d='M9 19 V16 M13 19 V15 M17 19 V15 M21 19 V16' stroke='%23c08030' stroke-width='.6'/%3E%3Cpath d='M13 7 Q14 5 15 7 M15 7 Q16 5 17 7' stroke='%23aaa' stroke-width='.6' fill='none' opacity='.4'/%3E%3Cpath d='M14 9 Q15 7 16 9' stroke='%23aaa' stroke-width='.5' fill='none' opacity='.35'/%3E%3C/svg%3E",
  jam: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='jm' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23ef5350'/%3E%3Cstop offset='.5' stop-color='%23c62828'/%3E%3Cstop offset='1' stop-color='%23b71c1c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M9 13h14v12a3 3 0 01-3 3H12a3 3 0 01-3-3z' fill='url(%23jm)' stroke='%23a01818' stroke-width='.5'/%3E%3Cpath d='M9 13h14v12a3 3 0 01-3 3H12a3 3 0 01-3-3z' fill='none' stroke='%23fff' stroke-width='.3' opacity='.1'/%3E%3Cellipse cx='14' cy='16' rx='3' ry='1.5' fill='%23ef9a9a' opacity='.35'/%3E%3Crect x='11' y='19' width='10' height='5' rx='1' fill='%23fff' opacity='.08'/%3E%3Crect x='12' y='20' width='8' height='3' rx='.5' fill='none' stroke='%23fff' stroke-width='.3' opacity='.2'/%3E%3Ctext x='16' y='22.5' text-anchor='middle' font-size='3' fill='%23fff' opacity='.5'%3EJAM%3C/text%3E%3Crect x='10' y='9' width='12' height='4.5' rx='1' fill='%23e0e0e0'/%3E%3Ccircle cx='16' cy='7' r='5' fill='none'/%3E%3Cpath d='M10 9 Q12 6 16 5.5 Q20 6 22 9' fill='%23e53935' stroke='%23c62828' stroke-width='.3'/%3E%3Cpath d='M10.5 9 Q12.5 7 16 6.5 Q19.5 7 21.5 9' fill='none' stroke='%23fff' stroke-width='.2' opacity='.3'/%3E%3Cpath d='M10 8 Q11 7 10 6 M22 8 Q21 7 22 6' stroke='%23a06828' stroke-width='.6' fill='none'/%3E%3Cellipse cx='13' cy='14' rx='1.5' ry='.8' fill='%23fff' opacity='.2'/%3E%3C/svg%3E",
  grape_jam: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='gj' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23ab47bc'/%3E%3Cstop offset='.5' stop-color='%237b1fa2'/%3E%3Cstop offset='1' stop-color='%234a148c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M9 13h14v12a3 3 0 01-3 3H12a3 3 0 01-3-3z' fill='url(%23gj)' stroke='%234a148c' stroke-width='.5'/%3E%3Cellipse cx='14' cy='16' rx='3' ry='1.5' fill='%23ce93d8' opacity='.3'/%3E%3Crect x='11' y='19' width='10' height='5' rx='1' fill='%23fff' opacity='.08'/%3E%3Crect x='12' y='20' width='8' height='3' rx='.5' fill='none' stroke='%23fff' stroke-width='.3' opacity='.2'/%3E%3Ctext x='16' y='22.5' text-anchor='middle' font-size='3' fill='%23fff' opacity='.5'%3EJAM%3C/text%3E%3Crect x='10' y='9' width='12' height='4.5' rx='1' fill='%23e0e0e0'/%3E%3Cpath d='M10 9 Q12 6 16 5.5 Q20 6 22 9' fill='%239c27b0' stroke='%237b1fa2' stroke-width='.3'/%3E%3Cpath d='M10.5 9 Q12.5 7 16 6.5 Q19.5 7 21.5 9' fill='none' stroke='%23fff' stroke-width='.2' opacity='.3'/%3E%3Cpath d='M10 8 Q11 7 10 6 M22 8 Q21 7 22 6' stroke='%23a06828' stroke-width='.6' fill='none'/%3E%3Cellipse cx='13' cy='14' rx='1.5' ry='.8' fill='%23fff' opacity='.2'/%3E%3C/svg%3E",
  juice: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='ju' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ffcc02'/%3E%3Cstop offset='.5' stop-color='%23ff9800'/%3E%3Cstop offset='1' stop-color='%23e65100'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M10 10h12v15a3 3 0 01-3 3h-6a3 3 0 01-3-3z' fill='%23e3f2fd' stroke='%23b0bec5' stroke-width='.5' opacity='.4'/%3E%3Cpath d='M10 14h12v11a3 3 0 01-3 3h-6a3 3 0 01-3-3z' fill='url(%23ju)' opacity='.85'/%3E%3Cpath d='M10 10h12v15a3 3 0 01-3 3h-6a3 3 0 01-3-3z' fill='none' stroke='%23b0bec5' stroke-width='.6'/%3E%3Cellipse cx='14' cy='16' rx='3' ry='1.5' fill='%23fff' opacity='.3'/%3E%3Ccircle cx='20' cy='18' r='.6' fill='%23fff' opacity='.4'/%3E%3Ccircle cx='19' cy='20' r='.4' fill='%23fff' opacity='.35'/%3E%3Ccircle cx='21' cy='16' r='.5' fill='%23fff' opacity='.3'/%3E%3Crect x='13' y='6' width='6' height='5' rx='1.5' fill='%23e0e0e0' stroke='%23bdbdbd' stroke-width='.4'/%3E%3Crect x='15' y='3' width='2' height='4' rx='.5' fill='%23bdbdbd'/%3E%3Cline x1='23' y1='8' x2='23' y2='18' stroke='%23e74c3c' stroke-width='1.2' stroke-linecap='round'/%3E%3Cline x1='23' y1='8' x2='26' y2='6' stroke='%23e74c3c' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E",
  lemonade: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='lm' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23fff9c4'/%3E%3Cstop offset='.5' stop-color='%23fff176'/%3E%3Cstop offset='1' stop-color='%23fdd835'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M9 10h14l-.5 15a3 3 0 01-3 3h-7a3 3 0 01-3-3z' fill='%23e3f2fd' stroke='%23b0bec5' stroke-width='.4' opacity='.4'/%3E%3Cpath d='M9 13h14l-.5 12a3 3 0 01-3 3h-7a3 3 0 01-3-3z' fill='url(%23lm)' opacity='.8'/%3E%3Cpath d='M9 10h14l-.5 15a3 3 0 01-3 3h-7a3 3 0 01-3-3z' fill='none' stroke='%23b0bec5' stroke-width='.6'/%3E%3Crect x='12' y='14' width='4' height='3.5' rx='.8' fill='%23e3f2fd' opacity='.5' transform='rotate(-5 14 15.5)'/%3E%3Crect x='16' y='15' width='3.5' height='3' rx='.8' fill='%23e3f2fd' opacity='.45' transform='rotate(5 17.5 16.5)'/%3E%3Ccircle cx='20' cy='16' r='3.5' fill='%23fdd835' stroke='%23f9a825' stroke-width='.4'/%3E%3Ccircle cx='20' cy='16' r='2.5' fill='%23fff9c4'/%3E%3Cpath d='M18 16h4M20 14v4' stroke='%23f9a825' stroke-width='.3'/%3E%3Cellipse cx='14' cy='13' rx='3' ry='1.2' fill='%23fff' opacity='.3'/%3E%3Ccircle cx='11' cy='18' r='.5' fill='%23fff' opacity='.4'/%3E%3Ccircle cx='18' cy='20' r='.4' fill='%23fff' opacity='.35'/%3E%3Cline x1='22' y1='8' x2='22' y2='19' stroke='%234caf50' stroke-width='1.2' stroke-linecap='round'/%3E%3Cline x1='22' y1='8' x2='25' y2='5' stroke='%234caf50' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E",
  // Truck & Boat icons for orders
  _icon_truck_color: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='2' y='10' width='18' height='12' rx='2' fill='%23d4a056'/%3E%3Crect x='3' y='10.5' width='16' height='3' rx='1' fill='%23e8c87a' opacity='.4'/%3E%3Cpath d='M20 14h6l4 4v4h-10z' fill='%238b5e3c'/%3E%3Cpath d='M20 14h6l4 4h-10z' fill='%23a0724a'/%3E%3Crect x='2' y='21' width='28' height='1.5' rx='.5' fill='%235a3520'/%3E%3Ccircle cx='8' cy='24' r='3' fill='%233a2510'/%3E%3Ccircle cx='8' cy='24' r='1.2' fill='%238b6914'/%3E%3Ccircle cx='25' cy='24' r='3' fill='%233a2510'/%3E%3Ccircle cx='25' cy='24' r='1.2' fill='%238b6914'/%3E%3C/svg%3E",
  // Decoration icons
  fence: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='14' ry='2' fill='%23000' opacity='.06'/%3E%3Crect x='3' y='9' width='4' height='19' rx='1' fill='%23c9884a' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='4' y='9' width='1.5' height='19' fill='%23daa06d' opacity='.3'/%3E%3Cpath d='M3 6l2-3 2 3' fill='%23daa06d' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='14' y='9' width='4' height='19' rx='1' fill='%23c9884a' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='15' y='9' width='1.5' height='19' fill='%23daa06d' opacity='.3'/%3E%3Cpath d='M14 6l2-3 2 3' fill='%23daa06d' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='25' y='9' width='4' height='19' rx='1' fill='%23c9884a' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='26' y='9' width='1.5' height='19' fill='%23daa06d' opacity='.3'/%3E%3Cpath d='M25 6l2-3 2 3' fill='%23daa06d' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='3' y='13' width='26' height='3' rx='.8' fill='%23daa06d' stroke='%23b08040' stroke-width='.3'/%3E%3Crect x='3' y='21' width='26' height='3' rx='.8' fill='%23daa06d' stroke='%23b08040' stroke-width='.3'/%3E%3Crect x='4' y='13.5' width='24' height='1' fill='%23e8c87a' opacity='.3'/%3E%3Crect x='4' y='21.5' width='24' height='1' fill='%23e8c87a' opacity='.3'/%3E%3C/svg%3E",
  flower_pot: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='30' rx='8' ry='1.5' fill='%23000' opacity='.08'/%3E%3Cpath d='M9 18h14l-2 12H11z' fill='%23c9884a' stroke='%23a06a30' stroke-width='.4'/%3E%3Cpath d='M10 18h12l-1 6H11z' fill='%23daa06d' opacity='.3'/%3E%3Crect x='7' y='16' width='18' height='3' rx='1.5' fill='%23daa06d' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='15' y='12' width='2' height='5' fill='%234caf50'/%3E%3Ccircle cx='12' cy='10' r='4' fill='%23e53935'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='%23ef5350'/%3E%3Ccircle cx='11' cy='8.5' r='1' fill='%23fff' opacity='.25'/%3E%3Ccircle cx='20' cy='10' r='3.5' fill='%23ff9800'/%3E%3Ccircle cx='20' cy='9' r='2' fill='%23ffb74d'/%3E%3Ccircle cx='16' cy='7' r='4' fill='%23ffc107'/%3E%3Ccircle cx='16' cy='6' r='2.5' fill='%23ffd54f'/%3E%3Ccircle cx='15' cy='5.5' r='1' fill='%23fff' opacity='.2'/%3E%3Ccircle cx='14' cy='13' r='1.8' fill='%234caf50'/%3E%3Ccircle cx='18' cy='13' r='1.5' fill='%2366bb6a'/%3E%3C/svg%3E",
  bench: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='12' ry='2' fill='%23000' opacity='.06'/%3E%3Crect x='3' y='7' width='2.5' height='7' rx='.5' fill='%23a06a30' stroke='%238b5e3c' stroke-width='.3'/%3E%3Crect x='27' y='7' width='2.5' height='7' rx='.5' fill='%23a06a30' stroke='%238b5e3c' stroke-width='.3'/%3E%3Crect x='3' y='10' width='26' height='3.5' rx='1' fill='%23daa06d' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='4' y='10.5' width='24' height='1' fill='%23e8c87a' opacity='.35'/%3E%3Crect x='3' y='14' width='26' height='4' rx='1' fill='%23c9884a' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='4' y='14.5' width='24' height='1.2' fill='%23daa06d' opacity='.3'/%3E%3Crect x='5' y='18' width='3' height='10' rx='1' fill='%23a06a30' stroke='%238b5e3c' stroke-width='.3'/%3E%3Crect x='24' y='18' width='3' height='10' rx='1' fill='%23a06a30' stroke='%238b5e3c' stroke-width='.3'/%3E%3C/svg%3E",
  hay_bale: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='26' rx='13' ry='3' fill='%23000' opacity='.06'/%3E%3Cellipse cx='16' cy='20' rx='13' ry='7' fill='%23c9884a'/%3E%3Cellipse cx='16' cy='16' rx='12' ry='6.5' fill='%23daa06d'/%3E%3Cellipse cx='16' cy='14' rx='11' ry='5.5' fill='%23e8b87a'/%3E%3Cpath d='M7 15h18M5 18h22M7 21h18' stroke='%23c9884a' stroke-width='.7' opacity='.5'/%3E%3Cellipse cx='13' cy='12' rx='5' ry='2' fill='%23f0c88a' opacity='.35'/%3E%3Cpath d='M10 10 Q16 8 22 10' stroke='%23a06a30' stroke-width='.8' fill='none' opacity='.3'/%3E%3C/svg%3E",
  mailbox: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='6' ry='1.5' fill='%23000' opacity='.06'/%3E%3Crect x='14' y='16' width='4' height='13' rx='.5' fill='%23888' stroke='%23666' stroke-width='.3'/%3E%3Crect x='15' y='16' width='1.5' height='13' fill='%23999' opacity='.3'/%3E%3Crect x='6' y='6' width='20' height='11' rx='5.5' fill='%232196f3' stroke='%231565c0' stroke-width='.5'/%3E%3Crect x='6' y='11' width='20' height='6' rx='2' fill='%231976d2'/%3E%3Crect x='7' y='7' width='10' height='3' rx='2' fill='%2364b5f6' opacity='.35'/%3E%3Crect x='24' y='7' width='4' height='2.5' rx='1' fill='%23e53935' stroke='%23c62828' stroke-width='.3'/%3E%3Ccircle cx='26' cy='8' r='.6' fill='%23fff' opacity='.3'/%3E%3C/svg%3E",
  lamp_post: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='5' ry='1.5' fill='%23000' opacity='.08'/%3E%3Crect x='14' y='12' width='4' height='16' rx='.8' fill='%23555' stroke='%23444' stroke-width='.3'/%3E%3Crect x='14.5' y='12' width='1.5' height='16' fill='%23666' opacity='.3'/%3E%3Crect x='12' y='27' width='8' height='2.5' rx='1' fill='%23555' stroke='%23444' stroke-width='.3'/%3E%3Ccircle cx='16' cy='7' r='7' fill='%23ffd700' opacity='.2'/%3E%3Ccircle cx='16' cy='7' r='5' fill='%23ffd700' opacity='.15'/%3E%3Cpath d='M10 10h12l-2-7H12z' fill='%23444' stroke='%23333' stroke-width='.3'/%3E%3Cpath d='M11 10h10l-1.5-5.5H12.5z' fill='%23555' opacity='.3'/%3E%3Ccircle cx='16' cy='6.5' r='3' fill='%23ffd700'/%3E%3Ccircle cx='16' cy='6.5' r='2' fill='%23ffeb3b' opacity='.6'/%3E%3Ccircle cx='15' cy='5.5' r='.8' fill='%23fff' opacity='.5'/%3E%3C/svg%3E",
  fountain: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='27' rx='14' ry='4' fill='%23999' stroke='%23777' stroke-width='.3'/%3E%3Cellipse cx='16' cy='25' rx='13' ry='3.5' fill='%23aaa'/%3E%3Cellipse cx='16' cy='23' rx='12' ry='3' fill='%2381d4fa' opacity='.6'/%3E%3Cellipse cx='13' cy='22' rx='4' ry='1.5' fill='%23fff' opacity='.2'/%3E%3Crect x='14' y='10' width='4' height='14' rx='1.2' fill='%23bbb' stroke='%23999' stroke-width='.3'/%3E%3Crect x='14.5' y='10' width='1.5' height='14' fill='%23ccc' opacity='.3'/%3E%3Cellipse cx='16' cy='18' rx='8' ry='2.5' fill='%23aaa' stroke='%23999' stroke-width='.3'/%3E%3Cpath d='M16 3 Q14 7 16 10 Q18 7 16 3' fill='%234fc3f7' opacity='.7'/%3E%3Cpath d='M13 6 Q14.5 9 16 10 Q17.5 9 19 6' stroke='%234fc3f7' stroke-width='1' fill='none' opacity='.5'/%3E%3Cpath d='M11 8 Q13 11 16 10 Q19 11 21 8' stroke='%2381d4fa' stroke-width='.6' fill='none' opacity='.3'/%3E%3Ccircle cx='16' cy='5' r='1' fill='%23fff' opacity='.4'/%3E%3C/svg%3E",
  tree_oak: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='8' ry='2' fill='%23000' opacity='.08'/%3E%3Crect x='13' y='19' width='6' height='10' rx='1.5' fill='%238b5e3c' stroke='%236d4c41' stroke-width='.3'/%3E%3Crect x='14' y='19' width='2' height='10' fill='%23a06a30' opacity='.3'/%3E%3Ccircle cx='16' cy='12' r='11' fill='%234caf50'/%3E%3Ccircle cx='12' cy='9' r='6' fill='%2366bb6a'/%3E%3Ccircle cx='21' cy='10' r='5.5' fill='%2357a84a'/%3E%3Ccircle cx='16' cy='5' r='5' fill='%2381c784'/%3E%3Ccircle cx='8' cy='14' r='4' fill='%234caf50'/%3E%3Ccircle cx='23' cy='14' r='4' fill='%234caf50'/%3E%3Ccircle cx='11' cy='7' r='2.5' fill='%23a5d6a7' opacity='.4'/%3E%3Ccircle cx='18' cy='4' r='2' fill='%23c8e6c9' opacity='.35'/%3E%3C/svg%3E",
  tree_pine: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='30' rx='6' ry='1.5' fill='%23000' opacity='.06'/%3E%3Crect x='14' y='23' width='4' height='7' rx='1' fill='%238b5e3c' stroke='%236d4c41' stroke-width='.3'/%3E%3Cpath d='M16 1L5 15h22z' fill='%231b5e20'/%3E%3Cpath d='M16 7L7 19h18z' fill='%232e7d32'/%3E%3Cpath d='M16 13L9 24h14z' fill='%234caf50'/%3E%3Cpath d='M16 1L11 9h10z' fill='%23388e3c' opacity='.5'/%3E%3Cpath d='M10 12 Q16 10 22 12' stroke='%23fff' stroke-width='.3' fill='none' opacity='.15'/%3E%3Ccircle cx='14' cy='18' r='.8' fill='%23fff' opacity='.15'/%3E%3Ccircle cx='18' cy='14' r='.6' fill='%23fff' opacity='.12'/%3E%3C/svg%3E",
  pond: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='19' rx='14' ry='10' fill='%23a5d6a7' opacity='.3'/%3E%3Cellipse cx='16' cy='18' rx='13.5' ry='9.5' fill='%234fc3f7' opacity='.5'/%3E%3Cellipse cx='16' cy='17' rx='12' ry='8' fill='%232196f3' opacity='.5'/%3E%3Cellipse cx='16' cy='16' rx='10' ry='6.5' fill='%231976d2' opacity='.3'/%3E%3Cellipse cx='12' cy='14' rx='4' ry='2' fill='%23fff' opacity='.2'/%3E%3Cellipse cx='18' cy='18' rx='3' ry='1.5' fill='%23fff' opacity='.1'/%3E%3Ccircle cx='8' cy='16' r='2.5' fill='%234caf50' opacity='.7'/%3E%3Ccircle cx='7' cy='14' r='1.5' fill='%2366bb6a' opacity='.6'/%3E%3Ccircle cx='22' cy='14' r='2' fill='%234caf50' opacity='.6'/%3E%3Ccircle cx='24' cy='16' r='1.5' fill='%2366bb6a' opacity='.5'/%3E%3Ccircle cx='20' cy='20' r='1' fill='%234caf50' opacity='.4'/%3E%3C/svg%3E",
  garden_gnome: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='5' ry='1.5' fill='%23000' opacity='.08'/%3E%3Cpath d='M16 1L9 12h14z' fill='%23e53935'/%3E%3Cpath d='M16 1L12 8h8z' fill='%23ef5350' opacity='.5'/%3E%3Ccircle cx='13' cy='5' r='.8' fill='%23fff' opacity='.3'/%3E%3Ccircle cx='16' cy='14' r='5' fill='%23fdd9b5' stroke='%23e0b898' stroke-width='.3'/%3E%3Cellipse cx='14.5' cy='12.5' rx='1.5' ry='1' fill='%23ffe0c0' opacity='.5'/%3E%3Ccircle cx='14' cy='13' r='1' fill='%23333'/%3E%3Ccircle cx='18' cy='13' r='1' fill='%23333'/%3E%3Ccircle cx='14.3' cy='12.7' r='.3' fill='%23fff' opacity='.6'/%3E%3Ccircle cx='18.3' cy='12.7' r='.3' fill='%23fff' opacity='.6'/%3E%3Cellipse cx='16' cy='15.5' rx='1.5' ry='.5' fill='%23e0a080' opacity='.4'/%3E%3Crect x='11' y='18' width='10' height='10' rx='2' fill='%231976d2' stroke='%231565c0' stroke-width='.3'/%3E%3Crect x='12' y='18' width='3' height='10' fill='%232196f3' opacity='.25'/%3E%3Cellipse cx='16' cy='22' rx='3' ry='4' fill='%23f5f5f5' opacity='.6'/%3E%3C/svg%3E",
  _icon_boat: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath d='M2 20 Q6 26 16 26 Q26 26 30 20z' fill='%238b5e3c'/%3E%3Cpath d='M4 20 Q8 24 16 24 Q24 24 28 20z' fill='%23d4a056'/%3E%3Crect x='12' y='8' width='8' height='12' rx='1' fill='%23c9884a'/%3E%3Crect x='15' y='4' width='2' height='16' fill='%235a3520'/%3E%3Cpath d='M17 6 L17 14 L24 14z' fill='%23f5f5f5' stroke='%23ddd' stroke-width='.5'/%3E%3Cpath d='M2 20h28' stroke='%234fc3f7' stroke-width='1.5' opacity='.4'/%3E%3C/svg%3E",
  bird_bath: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='bs' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23ccc'/%3E%3Cstop offset='1' stop-color='%23999'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='29' rx='7' ry='1.5' fill='%23000' opacity='.08'/%3E%3Crect x='12' y='25' width='8' height='3' rx='1.2' fill='url(%23bs)' stroke='%23888' stroke-width='.3'/%3E%3Crect x='14' y='14' width='4' height='12' rx='1' fill='url(%23bs)' stroke='%23888' stroke-width='.3'/%3E%3Crect x='14.5' y='14' width='1.5' height='12' fill='%23ddd' opacity='.25'/%3E%3Cellipse cx='16' cy='14' rx='11' ry='3.5' fill='%23bbb' stroke='%23999' stroke-width='.3'/%3E%3Cellipse cx='16' cy='13.5' rx='10' ry='3' fill='%23ccc'/%3E%3Cellipse cx='16' cy='13' rx='8.5' ry='2.2' fill='%2381d4fa' opacity='.5'/%3E%3Cellipse cx='14' cy='12.5' rx='3' ry='1' fill='%23fff' opacity='.2'/%3E%3Cellipse cx='16' cy='14' rx='10' ry='3' fill='none' stroke='%23aaa' stroke-width='.3'/%3E%3Cpath d='M20 9.5 Q21.5 8.5 22 9.5 Q22.5 10 22 10.5L21 11' fill='%23795548' stroke='%236d4c41' stroke-width='.3'/%3E%3Ccircle cx='21.8' cy='9.5' r='2' fill='%23ef5350'/%3E%3Ccircle cx='21.5' cy='9' r='1.2' fill='%23e57373' opacity='.5'/%3E%3Ccircle cx='21.2' cy='8.8' r='.4' fill='%23fff' opacity='.4'/%3E%3Ccircle cx='22.3' cy='9.2' r='.5' fill='%23333'/%3E%3Cpath d='M23.5 9.5l1.2-.3' stroke='%23ff9800' stroke-width='.8' stroke-linecap='round'/%3E%3Cpath d='M20.5 10.5l.5 1.5' stroke='%23795548' stroke-width='.6'/%3E%3C/svg%3E",
  swing: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='sw' x1='0' y1='0' x2='1' y2='0'%3E%3Cstop offset='0' stop-color='%23a06a30'/%3E%3Cstop offset='.5' stop-color='%238b5e3c'/%3E%3Cstop offset='1' stop-color='%236d4c41'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='29' rx='12' ry='1.5' fill='%23000' opacity='.08'/%3E%3Cpath d='M5 28L2 5' stroke='url(%23sw)' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M27 28L30 5' stroke='url(%23sw)' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M5 28L9 5' stroke='url(%23sw)' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M27 28L23 5' stroke='url(%23sw)' stroke-width='2.5' stroke-linecap='round'/%3E%3Crect x='2' y='4' width='28' height='2.5' rx='1' fill='%23a06a30' stroke='%238b5e3c' stroke-width='.3'/%3E%3Crect x='3' y='4.3' width='26' height='.8' fill='%23c9884a' opacity='.3'/%3E%3Cline x1='13' y1='6.5' x2='12' y2='20' stroke='%23a08060' stroke-width='1.2'/%3E%3Cline x1='19' y1='6.5' x2='20' y2='20' stroke='%23a08060' stroke-width='1.2'/%3E%3Cline x1='13' y1='6.5' x2='12' y2='20' stroke='%23c9a070' stroke-width='.5' opacity='.4'/%3E%3Cline x1='19' y1='6.5' x2='20' y2='20' stroke='%23c9a070' stroke-width='.5' opacity='.4'/%3E%3Crect x='10' y='20' width='12' height='2.5' rx='.8' fill='%23c9884a' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='11' y='20.3' width='10' height='.8' fill='%23daa06d' opacity='.3'/%3E%3C/svg%3E",
  statue_chicken: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='bz' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23d4a056'/%3E%3Cstop offset='.5' stop-color='%23b08040'/%3E%3Cstop offset='1' stop-color='%23997030'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='29' rx='7' ry='1.5' fill='%23000' opacity='.08'/%3E%3Crect x='10' y='25' width='12' height='4' rx='1.2' fill='%23999' stroke='%23777' stroke-width='.3'/%3E%3Crect x='11' y='25.5' width='4' height='3' fill='%23aaa' opacity='.3'/%3E%3Cellipse cx='16' cy='18' rx='6.5' ry='7.5' fill='url(%23bz)' stroke='%23997030' stroke-width='.4'/%3E%3Cellipse cx='14' cy='17' rx='3' ry='4' fill='%23d4a856' opacity='.3'/%3E%3Ccircle cx='15' cy='10' r='5.5' fill='url(%23bz)' stroke='%23997030' stroke-width='.3'/%3E%3Ccircle cx='14' cy='9' r='2.5' fill='%23d4a856' opacity='.25'/%3E%3Cpath d='M13 7h-3l2.5-3.5z' fill='%23c62828'/%3E%3Cpath d='M12 6.5h-1.5l1.5-2z' fill='%23e53935' opacity='.5'/%3E%3Ccircle cx='13.5' cy='9.5' r='1' fill='%23333'/%3E%3Ccircle cx='13.8' cy='9.2' r='.3' fill='%23fff' opacity='.4'/%3E%3Cpath d='M11 12l-2.5 1 2.5-.3z' fill='%23e8a020' stroke='%23c98a10' stroke-width='.2'/%3E%3Cpath d='M19 22l1 2.5M13 22l-1 2.5' stroke='%23c98a10' stroke-width='1.2' stroke-linecap='round'/%3E%3Cpath d='M18 14 Q22 16 20 20' stroke='%23b08040' stroke-width='.6' fill='none' opacity='.4'/%3E%3C/svg%3E",
  tree_cherry: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='8' ry='2' fill='%23000' opacity='.08'/%3E%3Cpath d='M14 20 Q12 22 13 28h6 Q20 22 18 20' fill='%238b5e3c' stroke='%236d4c41' stroke-width='.3'/%3E%3Cpath d='M15 20 Q13.5 23 14 28h2 Q17 23 16 20' fill='%23a06a30' opacity='.3'/%3E%3Cpath d='M13 22 Q10 20 8 22' stroke='%238b5e3c' stroke-width='1.2' fill='none'/%3E%3Ccircle cx='16' cy='12' r='11' fill='%23f06292'/%3E%3Ccircle cx='12' cy='8' r='6' fill='%23f48fb1'/%3E%3Ccircle cx='21' cy='10' r='5.5' fill='%23ec407a'/%3E%3Ccircle cx='16' cy='5' r='5' fill='%23f8bbd0'/%3E%3Ccircle cx='8' cy='14' r='4.5' fill='%23f06292'/%3E%3Ccircle cx='23' cy='14' r='4' fill='%23e91e63' opacity='.7'/%3E%3Ccircle cx='10' cy='6' r='2' fill='%23fce4ec' opacity='.5'/%3E%3Ccircle cx='18' cy='4' r='1.5' fill='%23fff' opacity='.3'/%3E%3Ccircle cx='13' cy='12' r='1.2' fill='%23fff' opacity='.25'/%3E%3Ccircle cx='20' cy='8' r='1' fill='%23fff' opacity='.2'/%3E%3Ccircle cx='9' cy='10' r='.8' fill='%23fce4ec' opacity='.4'/%3E%3Ccircle cx='22' cy='12' r='.8' fill='%23fce4ec' opacity='.3'/%3E%3C/svg%3E",
  arch_flowers: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='12' ry='1.5' fill='%23000' opacity='.08'/%3E%3Crect x='4' y='8' width='3.5' height='20' rx='.8' fill='%238b5e3c' stroke='%236d4c41' stroke-width='.3'/%3E%3Crect x='4.5' y='8' width='1.2' height='20' fill='%23a06a30' opacity='.3'/%3E%3Crect x='24.5' y='8' width='3.5' height='20' rx='.8' fill='%238b5e3c' stroke='%236d4c41' stroke-width='.3'/%3E%3Crect x='25' y='8' width='1.2' height='20' fill='%23a06a30' opacity='.3'/%3E%3Cpath d='M5.5 8 Q16 -1 26.5 8' stroke='%238b5e3c' stroke-width='3' fill='none'/%3E%3Cpath d='M5.5 8 Q16 0 26.5 8' stroke='%23a06a30' stroke-width='1' fill='none' opacity='.3'/%3E%3Ccircle cx='6' cy='11' r='2' fill='%234caf50'/%3E%3Ccircle cx='5' cy='15' r='1.8' fill='%2366bb6a'/%3E%3Ccircle cx='26' cy='11' r='2' fill='%234caf50'/%3E%3Ccircle cx='27' cy='15' r='1.8' fill='%2366bb6a'/%3E%3Ccircle cx='8' cy='5.5' r='2.8' fill='%23e53935'/%3E%3Ccircle cx='8' cy='4.8' r='1.5' fill='%23ef5350' opacity='.5'/%3E%3Ccircle cx='12' cy='3' r='2.5' fill='%23f06292'/%3E%3Ccircle cx='12' cy='2.5' r='1.2' fill='%23f48fb1' opacity='.5'/%3E%3Ccircle cx='16' cy='2' r='2.8' fill='%23e53935'/%3E%3Ccircle cx='16' cy='1.5' r='1.5' fill='%23ef5350' opacity='.4'/%3E%3Ccircle cx='20' cy='3' r='2.3' fill='%23ec407a'/%3E%3Ccircle cx='24' cy='5.5' r='2.5' fill='%23e91e63'/%3E%3Ccircle cx='24' cy='5' r='1.3' fill='%23f48fb1' opacity='.4'/%3E%3Ccircle cx='10' cy='4' r='1.2' fill='%234caf50' opacity='.7'/%3E%3Ccircle cx='22' cy='4' r='1' fill='%234caf50' opacity='.6'/%3E%3C/svg%3E",
  statue_cow: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='cb' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0' stop-color='%23d4a056'/%3E%3Cstop offset='.5' stop-color='%23b08040'/%3E%3Cstop offset='1' stop-color='%23907030'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='29' rx='8' ry='1.5' fill='%23000' opacity='.08'/%3E%3Crect x='9' y='25' width='14' height='4' rx='1.2' fill='%23999' stroke='%23777' stroke-width='.3'/%3E%3Crect x='10' y='25.5' width='5' height='3' fill='%23aaa' opacity='.3'/%3E%3Cellipse cx='16' cy='18' rx='8' ry='7.5' fill='url(%23cb)' stroke='%23907030' stroke-width='.4'/%3E%3Cellipse cx='13' cy='17' rx='4' ry='4' fill='%23d4a856' opacity='.2'/%3E%3Ccircle cx='15' cy='10' r='6' fill='url(%23cb)' stroke='%23907030' stroke-width='.3'/%3E%3Ccircle cx='13' cy='9' r='2.5' fill='%23d4a856' opacity='.2'/%3E%3Ccircle cx='9.5' cy='6.5' r='2.2' fill='url(%23cb)' stroke='%23907030' stroke-width='.3'/%3E%3Ccircle cx='20.5' cy='6.5' r='2.2' fill='url(%23cb)' stroke='%23907030' stroke-width='.3'/%3E%3Ccircle cx='13' cy='9.5' r='1' fill='%23333'/%3E%3Ccircle cx='13.3' cy='9.2' r='.3' fill='%23fff' opacity='.35'/%3E%3Ccircle cx='17' cy='9.5' r='1' fill='%23333'/%3E%3Ccircle cx='17.3' cy='9.2' r='.3' fill='%23fff' opacity='.35'/%3E%3Cellipse cx='15' cy='12.5' rx='3' ry='2' fill='%23c49050' opacity='.5'/%3E%3Ccircle cx='14' cy='12.5' r='.5' fill='%23907030' opacity='.5'/%3E%3Ccircle cx='16' cy='12.5' r='.5' fill='%23907030' opacity='.5'/%3E%3Cpath d='M12 22l-.5 3M20 22l.5 3' stroke='%23b08040' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E",
  windmill_deco: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='wm' x1='0' y1='0' x2='1' y2='0'%3E%3Cstop offset='0' stop-color='%23d4a060'/%3E%3Cstop offset='.5' stop-color='%23c9884a'/%3E%3Cstop offset='1' stop-color='%23a06a30'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='29' rx='7' ry='1.5' fill='%23000' opacity='.08'/%3E%3Cpath d='M12 28h8l2-18H10z' fill='url(%23wm)' stroke='%23a06a30' stroke-width='.4'/%3E%3Cpath d='M13 28h3l1-18H11z' fill='%23d4a060' opacity='.2'/%3E%3Cpath d='M11 18h10M11 22h9.5' stroke='%23a06a30' stroke-width='.3' opacity='.4'/%3E%3Crect x='13' y='23' width='5' height='5' rx='.5' fill='%2381d4fa' opacity='.4' stroke='%23a06a30' stroke-width='.3'/%3E%3Cpath d='M16 10L14 1 18 1z' fill='%23888' stroke='%23666' stroke-width='.3'/%3E%3Cpath d='M16 10L25 6 25 10z' fill='%23999' stroke='%23666' stroke-width='.3'/%3E%3Cpath d='M16 10L18 19 14 19z' fill='%23888' stroke='%23666' stroke-width='.3'/%3E%3Cpath d='M16 10L7 14 7 10z' fill='%23999' stroke='%23666' stroke-width='.3'/%3E%3Cpath d='M16 10L15 2 17 2z' fill='%23aaa' opacity='.3'/%3E%3Cpath d='M16 10L24 7 24 9z' fill='%23bbb' opacity='.25'/%3E%3Ccircle cx='16' cy='10' r='2' fill='%23777' stroke='%23555' stroke-width='.3'/%3E%3Ccircle cx='16' cy='10' r='1' fill='%23999'/%3E%3Ccircle cx='15.7' cy='9.7' r='.4' fill='%23bbb' opacity='.5'/%3E%3C/svg%3E",
  scarecrow: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='29' rx='4' ry='1' fill='%23000' opacity='.08'/%3E%3Crect x='15' y='12' width='2' height='16' rx='.3' fill='%238b5e3c' stroke='%236d4c41' stroke-width='.3'/%3E%3Crect x='7' y='14' width='18' height='2' rx='.8' fill='%238b5e3c' stroke='%236d4c41' stroke-width='.3'/%3E%3Ccircle cx='16' cy='8' r='5' fill='%23fdd9b5' stroke='%23e0b898' stroke-width='.3'/%3E%3Cellipse cx='14.5' cy='7' rx='2' ry='1.5' fill='%23ffe0c0' opacity='.3'/%3E%3Cpath d='M10 5h12l1-3.5H9z' fill='%23795548' stroke='%235d4037' stroke-width='.3'/%3E%3Cpath d='M10 5h12l.5-1.5H9.5z' fill='%238d6e63' opacity='.3'/%3E%3Crect x='8' y='4' width='16' height='2' rx='1' fill='%23a1887f' stroke='%23795548' stroke-width='.3'/%3E%3Crect x='9' y='4.3' width='14' height='.6' fill='%23bcaaa4' opacity='.3'/%3E%3Ccircle cx='14' cy='8' r='1' fill='%23333'/%3E%3Ccircle cx='14.3' cy='7.7' r='.3' fill='%23fff' opacity='.4'/%3E%3Ccircle cx='18' cy='8' r='1' fill='%23333'/%3E%3Ccircle cx='18.3' cy='7.7' r='.3' fill='%23fff' opacity='.4'/%3E%3Cpath d='M14 10.5 Q16 11.5 18 10.5' stroke='%23333' stroke-width='.7' fill='none'/%3E%3Crect x='12' y='16' width='8' height='8' rx='1' fill='%23d32f2f' stroke='%23b71c1c' stroke-width='.3'/%3E%3Cpath d='M12 18h8M12 20h8M12 22h8' stroke='%23388e3c' stroke-width='.5' opacity='.5'/%3E%3Cpath d='M14 16v8M18 16v8' stroke='%23388e3c' stroke-width='.5' opacity='.4'/%3E%3Cpath d='M7 16l-2.5 6' stroke='%23daa06d' stroke-width='1.8' stroke-linecap='round'/%3E%3Cpath d='M25 16l2.5 6' stroke='%23daa06d' stroke-width='1.8' stroke-linecap='round'/%3E%3Cpath d='M4 22l1 .5M5 21.5l-.5 1.5M4.5 22l1.5 0' stroke='%23e8c87a' stroke-width='.5' stroke-linecap='round'/%3E%3Cpath d='M27 22l1 .5M28 21.5l-.5 1.5' stroke='%23e8c87a' stroke-width='.5' stroke-linecap='round'/%3E%3C/svg%3E",
  picnic_table: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cdefs%3E%3ClinearGradient id='pt' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0' stop-color='%23e8c87a'/%3E%3Cstop offset='1' stop-color='%23c9884a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='16' cy='28' rx='14' ry='2' fill='%23000' opacity='.06'/%3E%3Crect x='3' y='13' width='26' height='3.5' rx='1' fill='url(%23pt)' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='4' y='13.3' width='24' height='1' fill='%23f0d090' opacity='.3'/%3E%3Crect x='8' y='8' width='16' height='2.5' rx='.8' fill='%23e74c3c' opacity='.6'/%3E%3Crect x='16' y='8' width='8' height='2.5' rx='.8' fill='%23fff' opacity='.2'/%3E%3Cpath d='M8 16.5L4 28' stroke='%23a06a30' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M24 16.5L28 28' stroke='%23a06a30' stroke-width='2.5' stroke-linecap='round'/%3E%3Cpath d='M8.5 16.5L4.5 28' stroke='%23c9884a' stroke-width='.8' opacity='.3'/%3E%3Cpath d='M24.5 16.5L28.5 28' stroke='%23c9884a' stroke-width='.8' opacity='.3'/%3E%3Crect x='5' y='11' width='22' height='2.5' rx='.8' fill='url(%23pt)' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='6' y='11.3' width='20' height='.7' fill='%23f0d090' opacity='.25'/%3E%3Crect x='5' y='17' width='22' height='2.5' rx='.8' fill='url(%23pt)' stroke='%23a06a30' stroke-width='.3'/%3E%3Crect x='6' y='17.3' width='20' height='.7' fill='%23f0d090' opacity='.25'/%3E%3C/svg%3E",
};

// --- Event Icons (SVG inline, replacing emoji) ---
const EVENT_ICONS = {
  event_weekend: "<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='%23ff9800'/%3E%3Cpath d='M10 4l1.5 3 3.5.5-2.5 2.5.6 3.5L10 12l-3.1 1.5.6-3.5L5 7.5l3.5-.5z' fill='%23fff'/%3E%3C/svg%3E\" width=\"14\" height=\"14\" style=\"vertical-align:middle\">",
  event_sunrise: "<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect x='0' y='12' width='20' height='8' fill='%234caf50' rx='1'/%3E%3Ccircle cx='10' cy='12' r='5' fill='%23ffd54f'/%3E%3Cpath d='M10 3v3M4.5 7l2 2M15.5 7l-2 2M2 12h3M15 12h3' stroke='%23ffb300' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\" width=\"14\" height=\"14\" style=\"vertical-align:middle\">",
  event_moon: "<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%231a237e'/%3E%3Cpath d='M12 3a7 7 0 100 14 7 7 0 01-6-7 7 7 0 016-7z' fill='%23ffd54f'/%3E%3Ccircle cx='14' cy='5' r='.8' fill='%23fff' opacity='.6'/%3E%3Ccircle cx='6' cy='7' r='.5' fill='%23fff' opacity='.4'/%3E%3Ccircle cx='16' cy='12' r='.6' fill='%23fff' opacity='.5'/%3E%3C/svg%3E\" width=\"14\" height=\"14\" style=\"vertical-align:middle\">",
  event_lunch: "<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='12' r='7' fill='%23fff' stroke='%23bbb' stroke-width='.5'/%3E%3Cellipse cx='10' cy='12' rx='5' ry='3' fill='%23ff7043' opacity='.7'/%3E%3Ccircle cx='8' cy='11' r='1.5' fill='%234caf50'/%3E%3Ccircle cx='12' cy='11' r='1' fill='%23ffd54f'/%3E%3Cpath d='M5 5v6M3 5h4' stroke='%23999' stroke-width='1' stroke-linecap='round'/%3E%3C/svg%3E\" width=\"14\" height=\"14\" style=\"vertical-align:middle\">",
  event_fire: "<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath d='M10 2c0 4-5 6-5 10a5.5 5.5 0 0011 0c0-4-3-4-3-7s-3-3-3-3z' fill='%23ff5722'/%3E%3Cpath d='M10 8c0 2-2.5 3-2.5 5a2.8 2.8 0 005.5 0c0-2-1.5-2-1.5-3.5S10 8 10 8z' fill='%23ffab00'/%3E%3Cpath d='M10 12c0 1-1 1.5-1 2.5a1.2 1.2 0 002.5 0c0-1-.5-.8-.5-1.5s-1-1-1-1z' fill='%23fff9c4'/%3E%3C/svg%3E\" width=\"14\" height=\"14\" style=\"vertical-align:middle\">",
  event_star: "<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='9' fill='%239c27b0'/%3E%3Cpath d='M10 3l2 4.5 5 .7-3.6 3.5.8 5L10 14.5 5.8 16.7l.8-5L3 8.2l5-.7z' fill='%23ffd700'/%3E%3C/svg%3E\" width=\"14\" height=\"14\" style=\"vertical-align:middle\">",
  event_sprout: "<img src=\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Crect x='2' y='14' width='16' height='5' rx='2' fill='%238d6e63'/%3E%3Cpath d='M10 14V8' stroke='%234caf50' stroke-width='2' stroke-linecap='round'/%3E%3Cpath d='M10 10c-3-1-4-4-4-4s3 1 4 4z' fill='%2366bb6a'/%3E%3Cpath d='M10 8c3-1 4-4 4-4s-3 1-4 4z' fill='%234caf50'/%3E%3C/svg%3E\" width=\"14\" height=\"14\" style=\"vertical-align:middle\">",
};

// Get item icon as <img> tag (SVG inline or sprite, no emoji fallback for key items)
function itemIcon(id, w) {
  w = w || 24;
  // Try hayday label sprite first (e.g. hayday_cow-lbl)
  const lblSrc = S(`hayday_${id}-lbl`);
  if (lblSrc) return `<img src="${lblSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try crop portrait (dedicated small icon for each crop)
  const cp = cropPortrait(id, w);
  if (cp) return cp;
  // Try mature crop sprite (stage 4 = ready) as icon — real game feel
  const cropReady = S(`crops_${id}_4`);
  if (cropReady) return `<img src="${cropReady}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try inline SVG icon (handcrafted per item)
  const svgSrc = ITEM_ICONS[id];
  if (svgSrc) return `<img src="${svgSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try building SVG
  const bldSrc = (typeof BUILDING_SVGS !== 'undefined') && BUILDING_SVGS[id];
  if (bldSrc) return `<img src="${bldSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try hayday sprite (e.g. hayday_scarecrow)
  const hdSrc = S(`hayday_${id}`);
  if (hdSrc) return `<img src="${hdSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try animal sprite
  const anSrc = S(`animals_${id}`);
  if (anSrc) return `<img src="${anSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Try building sprite
  const blSrc = S(`buildings_${id}`);
  if (blSrc) return `<img src="${blSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Fallback: generic placeholder icon
  return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='6' y='6' width='20' height='20' rx='4' fill='%23daa06d' opacity='.6'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-size='14' fill='%23fff'%3E%3F%3C/text%3E%3C/svg%3E" width="${w}" height="${w}" style="object-fit:contain">`;
}

// --- Inline SVG Building Icons (isometric Hay Day style, distinct per building) ---
const BUILDING_SVGS = {
  bakery: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='bkw' x1='0' y1='0' x2='1' y2='0'%3E%3Cstop offset='0%25' stop-color='%23e8c87a'/%3E%3Cstop offset='100%25' stop-color='%23c9a050'/%3E%3C/linearGradient%3E%3ClinearGradient id='bkr' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23d45050'/%3E%3Cstop offset='100%25' stop-color='%23a03030'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M12 60l38-22 38 22v26H12z' fill='url(%23bkw)'/%3E%3Cpath d='M50 38l38 22v26l-38-18z' fill='%23b8923e' opacity='.6'/%3E%3Crect x='13' y='61' width='36' height='25' fill='%23fff' opacity='.08'/%3E%3Cpath d='M8 60l42-26 42 26-42 14z' fill='url(%23bkr)'/%3E%3Cpath d='M50 34l42 26-42 14z' fill='%23922828' opacity='.5'/%3E%3Crect x='32' y='65' width='16' height='20' rx='2' fill='%236d4c41'/%3E%3Crect x='34' y='67' width='12' height='12' rx='1' fill='%23ffe082' opacity='.45'/%3E%3Crect x='17' y='66' width='10' height='8' rx='1' fill='%236d4c41'/%3E%3Crect x='18' y='67' width='8' height='6' rx='.5' fill='%23ffe082' opacity='.4'/%3E%3Crect x='53' y='66' width='10' height='8' rx='1' fill='%236d4c41'/%3E%3Crect x='54' y='67' width='8' height='6' rx='.5' fill='%23ffe082' opacity='.4'/%3E%3Crect x='46' y='30' width='8' height='14' rx='2' fill='%23999'/%3E%3Cellipse cx='50' cy='28' rx='4' ry='5' fill='%23ddd' opacity='.5'/%3E%3Cellipse cx='50' cy='25' rx='3' ry='4' fill='%23eee' opacity='.3'/%3E%3Cellipse cx='30' cy='58' rx='5' ry='2' fill='%23e8b87a'/%3E%3C/svg%3E",
  sugar_mill: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M15 58l35-20 35 20v28H15z' fill='%23f5ead6'/%3E%3Cpath d='M50 38l35 20v28l-35-16z' fill='%23baa888' opacity='.5'/%3E%3Cpath d='M11 58l39-24 39 24-39 12z' fill='%23c9884a'/%3E%3Cpath d='M50 34l39 24-39 12z' fill='%23a06a30' opacity='.5'/%3E%3Crect x='35' y='64' width='14' height='20' rx='2' fill='%238b5e3c'/%3E%3Crect x='37' y='66' width='10' height='12' rx='1' fill='%23ffe082' opacity='.35'/%3E%3Crect x='20' y='65' width='10' height='8' rx='1' fill='%238b5e3c'/%3E%3Ccircle cx='70' cy='42' r='14' fill='%23c9884a' stroke='%23a06a30' stroke-width='1.5'/%3E%3Cpath d='M70 28v28M56 42h28' stroke='%23e8c87a' stroke-width='3' stroke-linecap='round'/%3E%3Cpath d='M60 32l20 20M60 52l20-20' stroke='%23e8c87a' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='70' cy='42' r='4' fill='%23daa06d' stroke='%23a06a30' stroke-width='1'/%3E%3C/svg%3E",
  dairy: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='dr' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%2381d4fa'/%3E%3Cstop offset='100%25' stop-color='%230288d1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.1'/%3E%3Cpath d='M12 58l38-22 38 22v28H12z' fill='%23f8f8f8'/%3E%3Cpath d='M50 36l38 22v28l-38-16z' fill='%23ccc' opacity='.4'/%3E%3Cpath d='M8 58l42-26 42 26-42 14z' fill='url(%23dr)'/%3E%3Cpath d='M50 32l42 26-42 14z' fill='%230277bd' opacity='.4'/%3E%3Crect x='33' y='63' width='16' height='22' rx='2' fill='%238b5e3c'/%3E%3Crect x='35' y='65' width='12' height='13' rx='1' fill='%23ffe082' opacity='.4'/%3E%3Crect x='17' y='65' width='10' height='8' rx='1' fill='%23bbb'/%3E%3Crect x='18' y='66' width='8' height='6' rx='.5' fill='%23e3f2fd'/%3E%3Crect x='55' y='65' width='10' height='8' rx='1' fill='%23bbb'/%3E%3Crect x='56' y='66' width='8' height='6' rx='.5' fill='%23e3f2fd'/%3E%3Cpath d='M22 80v-3a3 3 0 016 0v3' fill='%23fff' opacity='.5' stroke='%23bbb' stroke-width='.5'/%3E%3Cpath d='M58 80v-3a3 3 0 016 0v3' fill='%23fff' opacity='.5' stroke='%23bbb' stroke-width='.5'/%3E%3C/svg%3E",
  bbq: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='bq' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ef5350'/%3E%3Cstop offset='100%25' stop-color='%23b71c1c'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M14 58l36-20 36 20v28H14z' fill='%23795548'/%3E%3Cpath d='M50 38l36 20v28l-36-16z' fill='%235d4037' opacity='.6'/%3E%3Cpath d='M10 58l40-24 40 24-40 14z' fill='url(%23bq)'/%3E%3Cpath d='M50 34l40 24-40 14z' fill='%23a01515' opacity='.45'/%3E%3Crect x='33' y='64' width='16' height='20' rx='2' fill='%235d4037'/%3E%3Crect x='35' y='66' width='12' height='12' rx='1' fill='%23ffe082' opacity='.3'/%3E%3Crect x='44' y='26' width='5' height='16' rx='2' fill='%23999'/%3E%3Crect x='53' y='24' width='5' height='18' rx='2' fill='%23999'/%3E%3Cellipse cx='47' cy='24' rx='5' ry='6' fill='%23bbb' opacity='.35'/%3E%3Cellipse cx='56' cy='22' rx='5' ry='7' fill='%23bbb' opacity='.3'/%3E%3Cellipse cx='30' cy='56' rx='6' ry='2' fill='%23555'/%3E%3Crect x='26' y='51' width='8' height='5' rx='.5' fill='%23666'/%3E%3C/svg%3E",
  pastry_shop: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='ps' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ffb74d'/%3E%3Cstop offset='100%25' stop-color='%23e68900'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M12 58l38-22 38 22v28H12z' fill='%23fff8e1'/%3E%3Cpath d='M50 36l38 22v28l-38-16z' fill='%23e8d8b0' opacity='.5'/%3E%3Cpath d='M8 58l42-26 42 26-42 14z' fill='url(%23ps)'/%3E%3Cpath d='M50 32l42 26-42 14z' fill='%23c07800' opacity='.4'/%3E%3Crect x='33' y='64' width='16' height='20' rx='2' fill='%238b5e3c'/%3E%3Crect x='35' y='66' width='12' height='13' rx='1' fill='%23ffe082' opacity='.4'/%3E%3Ccircle cx='26' cy='78' r='4' fill='%23ffc107'/%3E%3Ccircle cx='26' cy='77' r='3' fill='%23ffe082'/%3E%3Ccircle cx='26' cy='75' r='1.5' fill='%23e74c3c'/%3E%3Ccircle cx='60' cy='78' r='3.5' fill='%23efebe9'/%3E%3Ccircle cx='60' cy='77' r='2.5' fill='%23fce4ec'/%3E%3Crect x='46' y='28' width='8' height='14' rx='2' fill='%23999'/%3E%3Cellipse cx='50' cy='26' rx='4' ry='5' fill='%23ddd' opacity='.5'/%3E%3C/svg%3E",
  jam_maker: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='jm' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ce93d8'/%3E%3Cstop offset='100%25' stop-color='%237b1fa2'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M12 58l38-22 38 22v28H12z' fill='%23f3e5f5'/%3E%3Cpath d='M50 36l38 22v28l-38-16z' fill='%23d8c0dc' opacity='.5'/%3E%3Cpath d='M8 58l42-26 42 26-42 14z' fill='url(%23jm)'/%3E%3Cpath d='M50 32l42 26-42 14z' fill='%235a0f70' opacity='.35'/%3E%3Crect x='33' y='63' width='16' height='22' rx='2' fill='%238b5e3c'/%3E%3Crect x='35' y='65' width='12' height='14' rx='1' fill='%23ffe082' opacity='.35'/%3E%3Cpath d='M18 66h8v14a3 3 0 01-3 3h-2a3 3 0 01-3-3z' fill='%23e53935'/%3E%3Crect x='19' y='63' width='6' height='3' rx='1' fill='%23eee'/%3E%3Cpath d='M56 66h8v14a3 3 0 01-3 3h-2a3 3 0 01-3-3z' fill='%237b1fa2'/%3E%3Crect x='57' y='63' width='6' height='3' rx='1' fill='%23eee'/%3E%3C/svg%3E",
  pizzeria: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='pz' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ef5350'/%3E%3Cstop offset='100%25' stop-color='%23c62828'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M12 58l38-22 38 22v28H12z' fill='%23fff3e0'/%3E%3Cpath d='M50 36l38 22v28l-38-16z' fill='%23e8d5b0' opacity='.5'/%3E%3Cpath d='M8 58l42-26 42 26-42 14z' fill='url(%23pz)'/%3E%3Cpath d='M50 32l42 26-42 14z' fill='%23a01818' opacity='.4'/%3E%3Crect x='33' y='63' width='16' height='22' rx='2' fill='%238b5e3c'/%3E%3Crect x='35' y='65' width='12' height='14' rx='1' fill='%23ffe082' opacity='.4'/%3E%3Ccircle cx='40' cy='55' r='4' fill='%23ffc107'/%3E%3Ccircle cx='40' cy='55' r='3' fill='%23ffe082'/%3E%3Ccircle cx='38' cy='54' r='1' fill='%23e53935'/%3E%3Ccircle cx='42' cy='55.5' r='.8' fill='%234caf50'/%3E%3Crect x='46' y='28' width='8' height='14' rx='2' fill='%23999'/%3E%3Cellipse cx='50' cy='26' rx='4' ry='5' fill='%23ddd' opacity='.45'/%3E%3C/svg%3E",
  juice_press: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='jp' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23ffb74d'/%3E%3Cstop offset='100%25' stop-color='%23e68900'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M12 58l38-22 38 22v28H12z' fill='%23e8f5e9'/%3E%3Cpath d='M50 36l38 22v28l-38-16z' fill='%23c0d8b8' opacity='.5'/%3E%3Cpath d='M8 58l42-26 42 26-42 14z' fill='url(%23jp)'/%3E%3Cpath d='M50 32l42 26-42 14z' fill='%23c07800' opacity='.4'/%3E%3Crect x='33' y='63' width='16' height='22' rx='2' fill='%238b5e3c'/%3E%3Crect x='17' y='65' width='10' height='8' rx='1' fill='%232e7d32'/%3E%3Crect x='55' y='65' width='10' height='8' rx='1' fill='%232e7d32'/%3E%3Ccircle cx='25' cy='78' r='4' fill='%23ff9800'/%3E%3Ccircle cx='25' cy='77' r='3' fill='%23ffc107'/%3E%3Ccircle cx='60' cy='78' r='3.5' fill='%23fdd835'/%3E%3Ccircle cx='50' cy='44' r='7' fill='%23ff9800' stroke='%23e68900' stroke-width='.8'/%3E%3Ccircle cx='50' cy='44' r='5' fill='%23ffc107'/%3E%3Ccircle cx='48' cy='42' r='2' fill='%23fff' opacity='.3'/%3E%3C/svg%3E",
  pie_oven: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='po' x1='0' y1='0' x2='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%23a1887f'/%3E%3Cstop offset='100%25' stop-color='%235d4037'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cellipse cx='50' cy='92' rx='38' ry='6' fill='%23000' opacity='.12'/%3E%3Cpath d='M12 58l38-22 38 22v28H12z' fill='%23efebe9'/%3E%3Cpath d='M50 36l38 22v28l-38-16z' fill='%23d0c4b8' opacity='.5'/%3E%3Cpath d='M8 58l42-26 42 26-42 14z' fill='url(%23po)'/%3E%3Cpath d='M50 32l42 26-42 14z' fill='%233e2723' opacity='.35'/%3E%3Crect x='24' y='64' width='34' height='18' rx='4' fill='%23424242'/%3E%3Crect x='26' y='66' width='30' height='14' rx='3' fill='%23e65100' opacity='.6'/%3E%3Crect x='28' y='68' width='26' height='10' rx='2' fill='%23ff6d00' opacity='.3'/%3E%3Ccircle cx='34' cy='73' r='2.5' fill='%23ff9800' opacity='.5'/%3E%3Ccircle cx='42' cy='71' r='2' fill='%23ffab00' opacity='.5'/%3E%3Crect x='43' y='28' width='5' height='14' rx='2' fill='%23999'/%3E%3Crect x='53' y='26' width='5' height='16' rx='2' fill='%23999'/%3E%3Cellipse cx='46' cy='26' rx='5' ry='6' fill='%23bbb' opacity='.4'/%3E%3Cellipse cx='56' cy='24' rx='4.5' ry='6' fill='%23bbb' opacity='.3'/%3E%3C/svg%3E",
};

// Get building icon <img> tag (small, for menus/lists)
function buildingIcon(id, w) {
  w = w || 28;
  // Use unique SVGs for production buildings (each has a distinct design)
  if (BUILDING_SVGS[id]) return `<img src="${BUILDING_SVGS[id]}" width="${w}" height="${w}" style="object-fit:contain">`;
  // Fall back to real PNG for barn/silo/shop
  const sprSrc = S(HD_BUILDINGS[id]) || S(`buildings_${id}`);
  if (sprSrc) return `<img src="${sprSrc}" width="${w}" height="${w}" style="object-fit:contain">`;
  return '';
}

// Map buildings to their real Hay Day PNG sprites
const HD_BUILDINGS = {
  barn:'hayday_barn', silo:'hayday_silo', shop:'hayday_shop',
  chicken_coop:'hayday_chicken_coop', coop:'hayday_chicken_coop',
  sugar_mill:'hayday_mill-dark',
};
function buildingImg(id, w) {
  // Use unique SVGs for production buildings (each has its own design)
  if (BUILDING_SVGS[id]) {
    return `<img src="${BUILDING_SVGS[id]}" width="${w||100}" height="${w ? Math.round(w*0.83) : 83}" class="building-img" draggable="false">`;
  }
  // Only fall back to real PNG for barn/silo/shop (which have unique real sprites)
  const key = HD_BUILDINGS[id] || `buildings_${id}`;
  const sprSrc = S(key);
  if (sprSrc) return `<img src="${sprSrc}" width="${w||100}" height="${w ? Math.round(w*0.83) : 83}" class="building-img" draggable="false">`;
  return img(key, w||100, w ? Math.round(w*0.83) : 83, 'building-img');
}

function animalImg(id, w) {
  const src = S(`hayday_${id}`) || S(`animals_${id}`);
  // If no PNG sprite, try the handcrafted SVG from ITEM_ICONS (e.g. pig)
  if (!src && ITEM_ICONS[id]) return `<img src="${ITEM_ICONS[id]}" width="${w||50}" height="${w?Math.round(w*.85):42}" class="animal-img" draggable="false">`;
  if (!src) return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='6' y='6' width='20' height='20' rx='4' fill='%23daa06d' opacity='.6'/%3E%3Ctext x='16' y='21' text-anchor='middle' font-size='14' fill='%23fff'%3E%3F%3C/text%3E%3C/svg%3E" width="${w||50}" height="${w?Math.round(w*.85):42}" style="object-fit:contain">`;
  return `<img src="${src}" width="${w||50}" height="${w?Math.round(w*.85):42}" class="animal-img" draggable="false">`;
}
function animalLbl(id, w) {
  // Try hayday label sprite first, then high-quality SVG from ITEM_ICONS
  const lblSrc = S(`hayday_${id}-lbl`);
  if (lblSrc) return `<img src="${lblSrc}" width="${w||45}" height="${w||45}" class="animal-lbl">`;
  if (ITEM_ICONS[id]) return `<img src="${ITEM_ICONS[id]}" width="${w||45}" height="${w||45}" class="animal-lbl">`;
  return img(`hayday_${id}-lbl`, w||45, w||45, 'animal-lbl');
}

function fieldBg(state) {
  if (state === 'ready') return S('hayday_wheat-field') || S('tiles_grass') || S('hayday_field');
  if (state === 'growing' || state === 'planted') return S('hayday_alfalfa-field') || S('tiles_dirt_planted') || S('hayday_field');
  if (state === 'empty') return S('tiles_dirt') || S('hayday_field');
  return S('hayday_field') || S('tiles_grass');
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
  updateHUD(); renderFields(); renderWorkshop(); renderPastures(); updateLandBar(); updateSections(); checkStorageWarnings(); updateWeather(); updateWheelButton();
  // Animate plots that grew
  const newFields = farmData.fields || farmData.plots || [];
  let anyGrew = false, anyReady = false;
  if (Object.keys(oldGrowth).length > 0) {
    const allPlots = document.querySelectorAll('#fields-grid .plot');
    newFields.forEach((f, idx) => {
      const newKey = (f.growth_stage||0) + ':' + (f.reviews_done||0) + ':' + f.state;
      if (oldGrowth[f.id] && oldGrowth[f.id] !== newKey && f.state !== 'empty' && allPlots[idx]) {
        allPlots[idx].classList.add('plot-grew');
        setTimeout(() => allPlots[idx]?.classList.remove('plot-grew'), 800);
        anyGrew = true;
        // Check if this plot just became ready
        const oldState = oldGrowth[f.id].split(':')[2];
        if (f.state === 'ready' && oldState !== 'ready') anyReady = true;
      }
    });
    if (anyReady) {
      setTimeout(() => SoundMgr.play('harvest'), 400);
      // Pulse the farm tab to draw attention to ready crops
      const farmTab = document.getElementById('tab-farm');
      if (farmTab) { farmTab.classList.add('tab-pulse'); setTimeout(() => farmTab.classList.remove('tab-pulse'), 2000); }
    }
    else if (anyGrew) setTimeout(() => SoundMgr.play('grow'), 300);
    // Check if any crop is close to harvest (90%+ progress) — tease the player (once per crop)
    newFields.forEach((f, idx) => {
      if (f.state === 'growing' || f.state === 'planted') {
        const cropDef = (farmData.crop_defs||{})[f.crop]||{};
        const rps = cropDef.growth_reviews || 3;
        const totalN = rps * 4;
        const totalD = (f.growth_stage||0) * rps + (f.reviews_done||0);
        const pct = totalD / totalN;
        const wasClose = oldGrowth[f.id] ? (() => {
          const parts = oldGrowth[f.id].split(':');
          const oldStage = parseInt(parts[0]) || 0;
          const oldDone = parseInt(parts[1]) || 0;
          return (oldStage * rps + oldDone) / totalN;
        })() : 0;
        if (pct >= 0.9 && wasClose < 0.9 && !_almostReadyNotified.has(f.id)) {
          _almostReadyNotified.add(f.id);
          const cName = cropName(f.crop);
          setTimeout(() => showNotification(`${cropPortrait(f.crop,14)||''} ${cName} presque prêt !`, 'reward'), 600);
        }
      }
      // Clear tracking when plot becomes ready or empty (so re-planted crops can re-notify)
      if (f.state === 'ready' || f.state === 'empty') _almostReadyNotified.delete(f.id);
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

// --- Animated Counter ---
function animateCount(el, newVal, duration) {
  const formatted = formatNum(newVal);
  const old = parseInt(el.textContent.replace(/[^0-9]/g, ''), 10) || 0;
  if (old === newVal || isNaN(newVal)) { el.textContent = formatted; return; }
  const diff = newVal - old;
  if (Math.abs(diff) < 2 || duration <= 0) { el.textContent = formatted; return; }
  const steps = Math.min(Math.abs(diff), 15);
  const stepDur = Math.max(20, Math.floor((duration || 400) / steps));
  let current = old, step = 0;
  const inc = diff / steps;
  const timer = setInterval(() => {
    step++;
    current = step >= steps ? newVal : Math.round(old + inc * step);
    el.textContent = formatNum(current);
    if (step >= steps) clearInterval(timer);
  }, stepDur);
}
function hudBump(elId) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove('hud-bump');
  void el.offsetWidth;
  el.classList.add('hud-bump');
  setTimeout(() => el.classList.remove('hud-bump'), 500);
}
let _prevHud = { coins: 0, gems: 0, streak: 0, level: 0, xp_percent: 0 };

function updateHUD() {
  const d = farmData;
  const starSrc = S('_gold_star') || S('hayday_star');
  const starEl = document.getElementById('hud-star-img');
  if (starSrc && starEl && !starEl.src) starEl.src = starSrc;

  const newLevel = d.level || 1;
  document.getElementById('hud-level').querySelector('.level-num').textContent = newLevel;
  if (_prevHud.level > 0 && newLevel > _prevHud.level) {
    document.getElementById('hud-level').classList.add('level-bump');
    setTimeout(() => document.getElementById('hud-level')?.classList.remove('level-bump'), 600);
  }

  const xpPct = d.xp_percent || 0;
  document.getElementById('hud-xp-bar').style.width = xpPct + '%';
  document.getElementById('hud-xp-text').textContent = `${d.xp_progress||0}/${d.xp_needed||20}`;
  if (xpPct > (_prevHud.xp_percent || 0)) {
    const xpTrack = document.querySelector('.xp-bar-track');
    if (xpTrack) { xpTrack.classList.add('xp-bar-flash'); setTimeout(() => xpTrack.classList.remove('xp-bar-flash'), 700); }
  }

  const newCoins = d.coins || 0, newGems = d.gems || 0, newStreak = d.streak || 0;
  const coinEl = document.getElementById('coin-count');
  const gemEl = document.getElementById('gem-count');
  const streakCountEl = document.getElementById('streak-count');
  if (newCoins !== _prevHud.coins && _prevHud.coins > 0) { animateCount(coinEl, newCoins, 400); hudBump('hud-coins'); }
  else coinEl.textContent = formatNum(newCoins);
  if (newGems !== _prevHud.gems && _prevHud.gems > 0) { animateCount(gemEl, newGems, 300); hudBump('hud-gems'); }
  else gemEl.textContent = formatNum(newGems);
  if (newStreak !== _prevHud.streak && _prevHud.streak > 0) { streakCountEl.textContent = newStreak; hudBump('hud-streak'); }
  else streakCountEl.textContent = newStreak;
  const prevSessionReviews = _prevHud.sessionReviews || 0;
  _prevHud = { coins: newCoins, gems: newGems, streak: newStreak, level: newLevel, xp_percent: xpPct, sessionReviews: prevSessionReviews };

  // Session review counter — shows during active review sessions
  const sessionReviews = d.session_reviews || 0;
  const sessionEl = document.getElementById('hud-session-reviews');
  const sessionCountEl = document.getElementById('session-review-count');
  if (sessionEl && sessionCountEl) {
    if (sessionReviews > 0) {
      sessionCountEl.textContent = sessionReviews;
      sessionEl.style.display = '';
      // Visual intensity based on session length
      sessionEl.removeAttribute('data-count');
      if (sessionReviews >= 50) sessionEl.setAttribute('data-count', 'epic');
      else if (sessionReviews >= 20) sessionEl.setAttribute('data-count', 'high');
      if (sessionReviews > prevSessionReviews) {
        hudBump('hud-session-reviews');
        // Session milestones — celebrate to keep momentum (Hay Day dopamine loop)
        const milestones = [
          {n:5, msg:'5 cartes ! Bien parti !', sound:'grow', confetti:false, sparkle:false},
          {n:10, msg:'10 cartes ! Belle session !', sound:'collect', confetti:false, sparkle:false},
          {n:20, msg:'20 cartes ! En feu !', sound:'collect', confetti:false, sparkle:true},
          {n:30, msg:'30 cartes ! Impressionnant !', sound:'levelup', confetti:false, sparkle:true},
          {n:50, msg:'50 cartes ! Session légendaire !', sound:'levelup', confetti:true, sparkle:true},
          {n:75, msg:'75 cartes ! Tu es inarrêtable !', sound:'levelup', confetti:true, sparkle:true},
          {n:100, msg:'100 cartes !! Champion absolu !!', sound:'levelup', confetti:true, sparkle:true},
        ];
        const hit = milestones.find(m => sessionReviews >= m.n && prevSessionReviews < m.n);
        if (hit) {
          showNotification(hit.msg, 'reward');
          SoundMgr.play(hit.sound);
          if (hit.confetti) createConfetti();
          if (hit.sparkle) createSparkleRain();
        }
      }
    } else {
      sessionEl.style.display = 'none';
    }
  }
  _prevHud.sessionReviews = sessionReviews;

  // Streak bonus indicator — more dramatic as streak grows (Hay Day fire effect)
  const streakWrap = document.getElementById('hud-streak');
  const bonus = d.streak_bonus_pct || 0;
  const streak = d.streak || 0;
  streakWrap.title = bonus > 0 ? `Série de ${streak} jours ! +${bonus}% pièces et XP` : 'Révisez chaque jour pour construire votre série !';
  const streakBonusEl = document.getElementById('streak-bonus');
  if (streakBonusEl) {
    if (bonus > 0) {
      streakBonusEl.textContent = `+${bonus}%`;
      streakBonusEl.style.display = '';
    } else {
      streakBonusEl.style.display = 'none';
    }
  }
  // Intensify fire animation based on streak length
  const fireEl = document.getElementById('streak-fire-icon');
  if (fireEl) {
    fireEl.classList.remove('streak-hot', 'streak-blazing');
    if (streak >= 7) fireEl.classList.add('streak-blazing');
    else if (streak >= 3) fireEl.classList.add('streak-hot');
  }
  // Daily quests
  renderDailyQuests();

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
    banner.innerHTML = events.map(e => {
      const iconId = e.icon || '';
      const iconHtml = EVENT_ICONS[iconId] || EVENT_ICONS['event_star'] || '';
      const mult = [];
      if (e.coin_multiplier && e.coin_multiplier > 1) mult.push(`x${e.coin_multiplier} ${S('ui_coin') ? `<img src="${S('ui_coin')}" width="10" height="10">` : 'p.'}`);
      if (e.xp_multiplier && e.xp_multiplier > 1) mult.push(`x${e.xp_multiplier} XP`);
      const multStr = mult.length ? ` <span class="event-mult">${mult.join(' ')}</span>` : '';
      return `<span class="event-tag">${iconHtml} ${e.name}${multStr}</span>`;
    }).join('');
    banner.style.display = '';
  } else {
    banner.style.display = 'none';
  }
}

function renderDailyQuests() {
  const bar = document.getElementById('daily-quests-bar');
  const quests = farmData.daily_quests || [];
  const claimed = farmData.daily_quests_claimed || false;
  const allDone = farmData.all_quests_complete || false;

  if (!quests.length) { if (bar) bar.style.display = 'none'; return; }
  bar.style.display = '';

  const items = document.getElementById('quest-items');
  items.innerHTML = '';

  const QUEST_ICONS = {
    reviews: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='3' y='2' width='18' height='20' rx='2' fill='%234fc3f7'/%3E%3Crect x='6' y='5' width='12' height='14' rx='1' fill='%23fff'/%3E%3Cline x1='8' y1='8' x2='16' y2='8' stroke='%23bbb' stroke-width='1'/%3E%3Cline x1='8' y1='11' x2='16' y2='11' stroke='%23bbb' stroke-width='1'/%3E%3Cline x1='8' y1='14' x2='13' y2='14' stroke='%23bbb' stroke-width='1'/%3E%3C/svg%3E",
    farming: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='6' r='3' fill='%234caf50'/%3E%3Cellipse cx='9' cy='8' rx='3' ry='2' fill='%2366bb6a' transform='rotate(-25 9 8)'/%3E%3Cellipse cx='15' cy='8' rx='3' ry='2' fill='%2366bb6a' transform='rotate(25 15 8)'/%3E%3Crect x='11' y='9' width='2' height='10' rx='1' fill='%238b5e3c'/%3E%3C/svg%3E",
    collection: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Ccircle cx='12' cy='12' r='9' fill='%23ffd700'/%3E%3Ccircle cx='12' cy='12' r='6' fill='%23ffeb3b'/%3E%3Ctext x='12' y='16' text-anchor='middle' font-size='10' font-weight='bold' fill='%23c5a200'%3E$%3C/text%3E%3C/svg%3E",
    production: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='4' y='10' width='16' height='10' rx='2' fill='%23c9884a'/%3E%3Crect x='7' y='4' width='10' height='7' rx='1.5' fill='%23e0e0e0'/%3E%3Ccircle cx='10' cy='7' r='1.5' fill='%23bbb'/%3E%3C/svg%3E",
    orders: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect x='2' y='8' width='14' height='8' rx='1.5' fill='%23d4a056'/%3E%3Cpath d='M16 10h3l2 2v4h-5z' fill='%238b5e3c'/%3E%3Ccircle cx='6' cy='18' r='2' fill='%233a2510'/%3E%3Ccircle cx='18' cy='18' r='2' fill='%233a2510'/%3E%3C/svg%3E",
  };

  quests.forEach(q => {
    const done = q.progress >= q.target;
    const pct = Math.min(100, Math.round(q.progress / Math.max(1, q.target) * 100));
    const iconSrc = QUEST_ICONS[q.icon] || QUEST_ICONS.reviews;
    const el = document.createElement('div');
    el.className = `quest-item${done ? ' quest-done' : ''}`;
    el.innerHTML = `
      <img src="${iconSrc}" class="quest-icon" width="20" height="20">
      <div class="quest-info">
        <span class="quest-desc">${q.desc}</span>
        <div class="quest-progress-bar"><div class="quest-progress-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="quest-count">${q.progress}/${q.target}</span>
      ${done ? '<span class="quest-check">&#10003;</span>' : ''}
    `;
    items.appendChild(el);
  });

  // Claim button
  const claimBtn = document.getElementById('quest-claim-btn');
  if (allDone && !claimed) {
    claimBtn.style.display = '';
  } else {
    claimBtn.style.display = 'none';
  }

  // Show "claimed" state
  if (claimed) {
    bar.classList.add('quests-claimed');
  } else {
    bar.classList.remove('quests-claimed');
  }
}

function renderFields() {
  const grid = document.getElementById('fields-grid');
  grid.innerHTML = '';
  const fields = farmData.fields || farmData.plots || [];

  // Responsive grid columns based on field count
  grid.classList.remove('cols-4', 'cols-5');
  if (fields.length >= 15) grid.classList.add('cols-5');
  else if (fields.length >= 8) grid.classList.add('cols-4');

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
      // Calculate total planting cost
      let totalPlantCost = 0;
      emptyWithLastCrop.forEach(f => {
        const cDef = (farmData.crop_defs||{})[f.last_crop]||{};
        totalPlantCost += cDef.plant_cost||0;
      });
      const costStr = totalPlantCost > 0 ? ` (${totalPlantCost} p.)` : '';
      const canAffordAll = (farmData.coins||0) >= totalPlantCost;
      plantAllBtn.style.display = '';
      plantAllBtn.textContent = `Tout planter (${emptyWithLastCrop.length})${costStr}`;
      plantAllBtn.style.opacity = canAffordAll ? '1' : '.5';
    } else {
      plantAllBtn.style.display = 'none';
    }
  }

  if (fields.length === 0) {
    const wheatSrc = S('crops_wheat_portrait') || S('crops_wheat_4');
    const wheatIcon = wheatSrc ? `<img src="${wheatSrc}" width="28" height="28" style="vertical-align:middle;margin-right:4px">` : '';
    grid.innerHTML = `<div class="zone-empty-msg">${wheatIcon}Ajoute ton premier champ pour commencer !</div>`;
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
        const lcDef = (farmData.crop_defs||{})[field.last_crop]||{};
        const lcCost = lcDef.plant_cost||0;
        const costLabel = lcCost > 0 ? `<span class="plot-replant-cost">${lcCost} p.</span>` : '';
        el.innerHTML += `<div class="plot-replant">${cropPortrait(field.last_crop, 32) || '<span class="plot-plus">+</span>'}<span class="plot-replant-label">${lcName}</span>${costLabel}</div>`;
        el.onclick = () => { showPlantBurst(el, field.last_crop); pycmd(`farm:plant:${field.id}:${field.last_crop}`); SoundMgr.play('plant'); };
        // Long press / right-click for other crop choices
        el.oncontextmenu = (e) => { e.preventDefault(); showPlantDialog(field.id); };
      } else {
        const plusSrc = S('hayday_plus');
        const plusIcon = plusSrc ? `<img src="${plusSrc}" width="28" height="28" style="opacity:.6">` : '<span class="plot-plus">+</span>';
        el.innerHTML += `<div class="plot-empty-prompt">${plusIcon}<span class="plot-empty-label">Planter</span></div>`;
        el.onclick = () => showPlantDialog(field.id);
      }
    } else if (field.state === 'ready') {
      const readyCropName = cropName(field.crop);
      const wiltWarning = field._wilt_warning;
      const wiltLeft = field._wilt_remaining || 0;
      if (wiltWarning) {
        el.classList.add('plot-wilt-warning');
        el.title = `${readyCropName} — Récolte vite ! Fane dans ${wiltLeft} révisions`;
      } else {
        el.title = `${readyCropName} — Prêt à récolter !`;
      }
      // Hay Day style: big bouncing crop with golden sparkle, no text clutter
      const wiltBadge = wiltWarning ? `<span class="wilt-warning-badge">${wiltLeft}</span>` : '';
      el.innerHTML += `<div class="plot-crop plot-crop-bounce">${cropImg(field.crop, 4, 72)}</div>${wiltBadge}`;
      el.onclick = () => harvestPlot(field.id);
    } else if (field.state === 'wilted') {
      el.title = `${cropName(field.crop)} — Fané (cliquer pour nettoyer)`;
      el.innerHTML += `<div class="plot-crop" style="opacity:.4;filter:grayscale(.8)">${cropImg(field.crop, 0, 36)}</div><span class="plot-label">Fané</span>`;
      el.onclick = () => pycmd('farm:clear_wilted:' + field.id);
    } else {
      const stage = field.growth_stage||0, needed = field.reviews_needed||1, done = field.reviews_done||0;
      // Total progress across ALL 4 stages (not just current stage)
      const cropDef = (farmData.crop_defs||{})[field.crop]||{};
      const reviewsPerStage = cropDef.growth_reviews || needed;
      const totalNeeded = reviewsPerStage * 4;
      const totalDone = stage * reviewsPerStage + done;
      const pct = Math.min(100, (totalDone/totalNeeded)*100);
      const pctRound = Math.round(pct);
      const reviewsLeft = totalNeeded - totalDone;
      // Hay Day style: crop grows visually bigger through stages
      const cropSize = 32 + stage * 11; // 32px at seed → 65px at stage 3
      const cName = cropName(field.crop);
      const stageLabel = GROWTH_LABEL[Math.min(stage,4)];
      el.title = `${cName} — ${stageLabel}\n${pctRound}% · ${reviewsLeft} révisions restantes`;
      // Almost-ready visual hint (like Hay Day subtle glow when crop is close)
      if (pct >= 75) el.classList.add('plot-almost-ready');
      // Stage dots — Hay Day signature progress indicator (4 dots = 4 growth stages)
      let stageDots = '<div class="plot-stage-dots">';
      for (let s = 0; s < 4; s++) {
        const cls = s < stage ? 'filled' : s === stage ? 'current' : '';
        stageDots += `<span class="plot-stage-dot ${cls}"></span>`;
      }
      stageDots += '</div>';
      // Reviews remaining pill
      const revsPill = reviewsLeft <= 3
        ? `<span class="plot-revs-pill plot-revs-soon">${reviewsLeft}</span>`
        : `<span class="plot-revs-pill">${reviewsLeft}</span>`;
      el.innerHTML += `${stageDots}<div class="plot-crop">${cropImg(field.crop, stage, cropSize)}</div>${revsPill}<div class="plot-crop-name"><span>${cName}</span></div><div class="plot-progress"><div class="plot-progress-fill" style="width:${pct}%"></div></div>`;
      el.onclick = () => showCropDetail(field);
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

  // Always show workshop zone — show what's coming even if nothing unlocked yet
  // Count total ready products across all buildings for Collect All button
  let totalReady = 0;
  const readyBuildings = [];
  placed.forEach(b => {
    const bid = b.building_type;
    const queue = (farmData.production_queues||{})[bid]||[];
    const ready = queue.filter(q=>q.ready).length;
    if (ready > 0) { totalReady += ready; readyBuildings.push(bid); }
  });
  // Show/hide Collect All button in zone header
  let collectAllBtn = document.getElementById('collect-all-buildings-btn');
  if (!collectAllBtn) {
    collectAllBtn = document.createElement('button');
    collectAllBtn.id = 'collect-all-buildings-btn';
    collectAllBtn.className = 'zone-add-btn harvest-all-btn';
    const header = zone.querySelector('.zone-header');
    if (header) header.insertBefore(collectAllBtn, header.querySelector('.zone-add-btn'));
  }
  if (totalReady >= 2) {
    collectAllBtn.textContent = `Tout récupérer (${totalReady})`;
    collectAllBtn.style.display = '';
    collectAllBtn.onclick = () => collectAllBuildingsDirect();
  } else {
    collectAllBtn.style.display = 'none';
  }
  zone.style.display = '';

  if (placed.length === 0) {
    const barnSpr = S('hayday_barn');
    const barnIcon = barnSpr ? `<img src="${barnSpr}" width="28" height="28" style="vertical-align:middle;margin-right:4px;opacity:.6">` : '';
    const nextBld = ALL_BUILDINGS.find(b => (farmData.unlocked_buildings||[]).includes(b.id));
    const nextBldLocked = ALL_BUILDINGS.find(b => !(farmData.unlocked_buildings||[]).includes(b.id));
    const hint = nextBld ? ` Clique "+ Construire" !` : nextBldLocked ? ` Débloqué au niveau ${nextBldLocked.lvl} !` : '';
    grid.innerHTML = `<div class="zone-empty-msg">${barnIcon}Construis des bâtiments pour transformer tes récoltes en produits de valeur !${hint}</div>`;
    return;
  }

  placed.forEach(b => {
    const bid = b.building_type;
    const name = buildingName(bid);
    const el = document.createElement('div');
    el.className = 'building-tile';
    const queue = (farmData.production_queues||{})[bid]||[];
    const ready = queue.filter(q=>q.ready).length;
    const producing = queue.filter(q=>!q.ready).length;
    if (producing > 0) el.classList.add('producing');
    if (ready > 0) el.classList.add('has-ready');
    // Hay Day mechanic: tap building with ready products → instant collect with burst
    // Tap idle/producing building → open production dialog
    if (ready > 0) {
      el.onclick = () => collectBuildingDirect(bid, el);
    } else {
      el.onclick = () => pycmd('farm:building_detail:' + bid);
    }
    let statusHtml = '';
    if (ready > 0) {
      statusHtml = `<span class="building-badge">${ready}</span>`;
    } else if (producing > 0) {
      const q = queue.find(item=>!item.ready);
      const revDone = q ? (q.reviews_done||0) : 0;
      const revReq = q ? (q.reviews_required || (q.sessions_required||1)*10) : 10;
      const pct = Math.min(100, Math.round(revDone / Math.max(1, revReq) * 100));
      statusHtml = `<div class="building-prod-bar"><div class="building-prod-fill" style="width:${pct}%"></div></div>`;
    }
    // Show what the building is doing for better game comprehension
    let prodLabel = '';
    if (producing > 0 && !ready) {
      const q = queue.find(item=>!item.ready);
      if (q) {
        const revLeft = Math.max(0, (q.reviews_required || (q.sessions_required||1)*10) - (q.reviews_done||0));
        prodLabel = `<span class="building-prod-label-sm">${q.name||''} · ${revLeft} rev.</span>`;
      }
    } else if (ready > 0) {
      prodLabel = `<span class="building-prod-label-sm ready-label">Prêt !</span>`;
    } else if (queue.length === 0) {
      // Idle building — subtle hint to encourage production
      prodLabel = `<span class="building-prod-label-sm" style="opacity:.4">Tap pour produire</span>`;
      el.classList.add('building-idle');
    }
    el.innerHTML = `${buildingImg(bid,100)}<span class="building-name">${name}</span>${prodLabel}${statusHtml}`;
    grid.appendChild(el);
  });
}

function renderPastures() {
  const grid = document.getElementById('pasture-grid');
  grid.innerHTML = '';
  const pastures = farmData.pastures || [];
  const zone = document.getElementById('zone-pasture');

  // Always show pasture zone — show what's coming
  zone.style.display = '';

  if (pastures.length === 0) {
    const cowSpr = S('hayday_cow') || S('animals_cow');
    const cowIcon = cowSpr ? `<img src="${cowSpr}" width="28" height="28" style="vertical-align:middle;margin-right:4px;opacity:.6">` : '';
    const nextAnimal = ALL_ANIMALS.find(a => (farmData.unlocked_animals||[]).includes(a.id));
    const nextLocked = ALL_ANIMALS.find(a => !(farmData.unlocked_animals||[]).includes(a.id));
    const hint = nextAnimal ? ` Clique "+ Enclos" !` : nextLocked ? ` Premier animal au niveau ${nextLocked.lvl} !` : '';
    grid.innerHTML = `<div class="zone-empty-msg">${cowIcon}Adopte des animaux pour produire lait, œufs et laine !${hint}</div>`;
    return;
  }

  pastures.forEach(p => {
    const el = document.createElement('div');
    el.className = 'pasture-tile';
    el.style.animationDelay = `${Math.random()*2}s`;
    const lbl = S(`hayday_${p.animal_type}-lbl`);
    const name = animalName(p.animal_type) || (p.animal_type||'').replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const adef = (farmData.animal_defs||{})[p.animal_type]||{};
    const produceEvery = adef.produce_every_n_reviews || 10;
    const reviewsSince = p.reviews_since_last || 0;
    const progPct = Math.min(100, Math.round(reviewsSince / produceEvery * 100));
    const reviewsLeft = Math.max(0, produceEvery - reviewsSince);
    const productName = itemName(adef.product || '');
    const imgHtml = lbl ? `<img src="${lbl}" width="50" height="50">` : animalImg(p.animal_type,45);
    const prodLabelHtml = reviewsLeft <= 0
      ? `<span class="pasture-prod-label ready-label">${itemIcon(adef.product||'', 12)} Prêt !</span>`
      : `<span class="pasture-prod-label">${itemIcon(adef.product||'', 10)} ${reviewsLeft} rev.</span>`;
    el.innerHTML = `${imgHtml}<span class="pasture-count">x${p.count||1}</span><span class="pasture-name">${name}</span><div class="pasture-progress"><div class="pasture-progress-fill" style="width:${progPct}%"></div></div>${prodLabelHtml}`;
    el.onclick = () => showAnimalInfo(p.animal_type);
    grid.appendChild(el);
  });
}

function updateSections() {
  updateTabBadges();
  updateActionHints();
}

// Show contextual "what to do next" hints — key for engagement (Hay Day always tells you what to do)
let _nextAction = null; // {type, text, icon}
function updateActionHints() {
  const d = farmData;
  const fields = d.fields || [];
  const emptyFields = fields.filter(f => f.state === 'empty').length;
  const readyFields = fields.filter(f => f.state === 'ready').length;
  const wiltingFields = fields.filter(f => f._wilt_warning).length;
  const placed = d.placed_buildings || [];
  const unlBuildings = d.unlocked_buildings || [];
  const builtIds = Object.keys(d.buildings || {});
  const unbuildable = unlBuildings.filter(id => !builtIds.includes(id));
  const inv = d.inventory || {};

  // Determine the most urgent/relevant next action
  _nextAction = null;
  const bar = document.getElementById('next-action-bar');
  const iconEl = document.getElementById('next-action-icon');
  const textEl = document.getElementById('next-action-text');

  if (wiltingFields > 0) {
    // URGENT: crops about to wilt
    _nextAction = {type:'harvest', text:`${wiltingFields} culture${wiltingFields>1?'s':''} va${wiltingFields>1?'nt':''} faner ! Récolte vite !`};
  } else if (readyFields > 0) {
    // Ready to harvest — most satisfying action
    _nextAction = {type:'harvest', text:`${readyFields} culture${readyFields>1?'s':''} prête${readyFields>1?'s':''} à récolter !`};
  } else if (emptyFields > 0 && fields.length > 0) {
    // Empty fields to plant
    _nextAction = {type:'plant', text:`${emptyFields} parcelle${emptyFields>1?'s':''} vide${emptyFields>1?'s':''} — plante pour gagner plus !`};
  } else if (unbuildable.length > 0 && placed.length === 0) {
    // Can build first building
    const bdef = (d.building_defs||{})[unbuildable[0]]||{};
    _nextAction = {type:'build', text:`Construis ${bdef.name||'un bâtiment'} pour transformer tes récoltes !`};
  } else {
    // Check for fulfillable orders
    let fulfillable = 0;
    (d.active_orders||[]).forEach(order => {
      let canDo = true;
      Object.entries(order.items_needed||{}).forEach(([id,qty]) => { if ((inv[id]||0) < qty) canDo = false; });
      if (canDo) fulfillable++;
    });
    if (fulfillable > 0) {
      _nextAction = {type:'orders', text:`${fulfillable} commande${fulfillable>1?'s':''} prête${fulfillable>1?'s':''} à livrer !`};
    } else {
      // Check for ready production
      let readyProd = 0;
      Object.values(d.production_queues||{}).forEach(q => q.forEach(item => { if (item.ready) readyProd++; }));
      if (readyProd > 0) {
        _nextAction = {type:'collect', text:`${readyProd} produit${readyProd>1?'s':''} prêt${readyProd>1?'s':''} à récupérer !`};
      } else {
        // Check for idle buildings that could be producing
        let idleBuilding = null;
        placed.forEach(b => {
          const bid = b.building_type;
          const queue = (d.production_queues||{})[bid]||[];
          if (queue.length === 0) idleBuilding = bid;
        });
        if (idleBuilding && !_nextAction) {
          const bname = buildingName(idleBuilding);
          _nextAction = {type:'produce', text:`${bname} est vide ! Lance une production.`, buildingId: idleBuilding};
        }
      }
      if (!_nextAction && fields.length > 0 && emptyFields === 0 && readyFields === 0) {
        // All fields growing — encourage reviews
        const closestField = fields.filter(f => f.state === 'growing' || f.state === 'planted')
          .sort((a,b) => {
            const cda = (d.crop_defs||{})[a.crop]||{}, cdb = (d.crop_defs||{})[b.crop]||{};
            const leftA = (cda.growth_reviews||3)*4 - ((a.growth_stage||0)*(cda.growth_reviews||3)+(a.reviews_done||0));
            const leftB = (cdb.growth_reviews||3)*4 - ((b.growth_stage||0)*(cdb.growth_reviews||3)+(b.reviews_done||0));
            return leftA - leftB;
          })[0];
        if (closestField) {
          const cd = (d.crop_defs||{})[closestField.crop]||{};
          const left = (cd.growth_reviews||3)*4 - ((closestField.growth_stage||0)*(cd.growth_reviews||3)+(closestField.reviews_done||0));
          const cn = cropName(closestField.crop);
          _nextAction = {type:'review', text:`Révise pour faire pousser ! ${cn} prêt dans ${left} rev.`};
        }
      }
    }
  }

  if (_nextAction && bar && textEl) {
    const ICONS = {
      harvest: S('hayday_wheat-icon'),
      plant: S('hayday_plus') || S('hayday_wheat-icon'),
      build: S('hayday_barn'),
      produce: S('hayday_barn'),
      orders: S('_icon_truck'),
      collect: S('hayday_shop'),
      review: S('_gold_star'),
    };
    const iconSrc = ICONS[_nextAction.type];
    iconEl.innerHTML = iconSrc ? `<img src="${iconSrc}" width="16" height="16">` : '';
    textEl.textContent = _nextAction.text;
    // Farmer portrait in action bar
    const farmerEl = document.getElementById('next-action-farmer');
    if (farmerEl) {
      const farmerSrc = S('hayday_farmer-woman') || S('hayday_farmer-man');
      farmerEl.innerHTML = farmerSrc ? `<img src="${farmerSrc}">` : '';
      farmerEl.style.display = farmerSrc ? '' : 'none';
    }
    bar.style.display = '';
  } else if (bar) {
    bar.style.display = 'none';
  }

  // Pulse the "Tout récolter" button if there are ready fields
  const harvestBtn = document.getElementById('harvest-all-btn');
  if (harvestBtn && readyFields >= 2) {
    harvestBtn.classList.add('action-pulse');
  }

  // If all fields are empty and player has coins, pulse the plant-all button
  const plantBtn = document.getElementById('plant-all-btn');
  if (plantBtn && emptyFields >= 2 && !plantBtn.style.display?.includes('none')) {
    plantBtn.classList.add('action-pulse');
  }

  // If player has unlocked but un-built buildings, show subtle hint on workshop zone
  const workshopZone = document.getElementById('zone-workshop');
  if (workshopZone && unbuildable.length > 0 && placed.length === 0) {
    const buildBtn = workshopZone.querySelector('.zone-add-btn:not(.harvest-all-btn):not(.plant-all-btn)');
    if (buildBtn) buildBtn.classList.add('action-pulse');
  }
}

// Handle tap on the "next action" guidance bar
function handleNextAction() {
  if (!_nextAction) return;
  SoundMgr.play('click');
  switch(_nextAction.type) {
    case 'harvest':
      // Scroll to fields zone
      document.querySelector('.zone-fields')?.scrollIntoView({behavior:'smooth', block:'center'});
      break;
    case 'plant':
      document.querySelector('.zone-fields')?.scrollIntoView({behavior:'smooth', block:'center'});
      break;
    case 'build':
      showBuildMenu();
      break;
    case 'orders':
      showTab('orders');
      break;
    case 'collect':
      document.querySelector('.zone-workshop')?.scrollIntoView({behavior:'smooth', block:'center'});
      break;
    case 'produce':
      if (_nextAction.buildingId) pycmd('farm:building_detail:' + _nextAction.buildingId);
      else document.querySelector('.zone-workshop')?.scrollIntoView({behavior:'smooth', block:'center'});
      break;
    case 'review':
      // Nothing to navigate to — just dismiss
      break;
  }
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
  setBadge('tab-farm', 0);
  // Show wheel badge on achievements if free spin available
  const achBadgeCount = (document.getElementById('tab-achievements')?.querySelector('.tab-badge')?.textContent||0);
  if (d.can_spin_wheel) setBadge('tab-achievements', Math.max(parseInt(achBadgeCount)||0, 1));
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

// Mystery boxes removed — Wheel of Fortune covers surprise rewards

// Village/Decoration zone removed — focus on core gameplay (fields, workshop, pastures)

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
  expansion_permit: {desc: "Permis d'expansion. Ultra rare (~2% des drops). Nécessaire pour agrandir le terrain.", usage: 'Acheter du terrain (+5 unités)'},
  // Crops (descriptions auto-generated from crop_defs if available)
  wheat: {desc: 'Céréale de base. Pousse vite (3 rev./stade, 12 total). Ingrédient du pain et des cookies.', usage: 'Pain, Cookie'},
  corn: {desc: 'Céréale dorée. 4 rev./stade (16 total). Bonne culture de départ.', usage: 'Vendre'},
  turnip: {desc: 'Légume-racine. 5 rev./stade (20 total). Bon rendement.', usage: 'Vendre'},
  tomato: {desc: 'Fruit juteux, essentiel pour les pizzas ! 6 rev./stade (24 total).', usage: 'Pizza'},
  cucumber: {desc: 'Légume frais et croquant. 4 rev./stade (16 total). Bon rendement.', usage: 'Vendre'},
  potato: {desc: 'Tubercule nourrissant. 5 rev./stade (20 total).', usage: 'Vendre'},
  rice: {desc: 'Céréale précieuse. Transformé en sucre à la Sucrerie. 7 rev./stade (28 total).', usage: 'Sucre → Confiture/Limonade'},
  strawberry: {desc: 'Fruit délicat, ingrédient de la confiture ! 8 rev./stade (32 total).', usage: 'Confiture'},
  eggplant: {desc: 'Légume méditerranéen. Se vend bien. 6 rev./stade (24 total).', usage: 'Vendre'},
  lemon: {desc: 'Agrume acidulé, ingrédient de la limonade ! 8 rev./stade (32 total).', usage: 'Limonade'},
  orange: {desc: "Fruit juteux. Fait du jus et des tartes. 10 rev./stade (40 total).", usage: "Jus d'orange, Tarte"},
  sunflower: {desc: 'Fleur majestueuse. Se vend cher ! 9 rev./stade (36 total).', usage: 'Vendre'},
  pineapple: {desc: 'Fruit tropical. Pousse lentement mais vaut cher. 10 rev./stade (40 total).', usage: 'Vendre'},
  melon: {desc: 'Gros fruit juteux. 12 rev./stade (48 total). Ingrédient de la tarte au melon.', usage: 'Tarte au melon'},
  grapes: {desc: 'Raisin sucré. Fait de la confiture ! 11 rev./stade (44 total).', usage: 'Confiture de raisin'},
  coffee: {desc: 'Grain précieux, le plus cher des cultures ! 14 rev./stade (56 total).', usage: 'Vendre'},
  tulip: {desc: 'Fleur élégante. 7 rev./stade (28 total). Belle et rentable !', usage: 'Vendre'},
  rose: {desc: 'La reine des fleurs. 12 rev./stade (48 total). Se vend cher !', usage: 'Vendre'},
  avocado: {desc: 'Fruit tendance et nutritif. 13 rev./stade (52 total). Très rentable.', usage: 'Vendre'},
  cassava: {desc: 'Tubercule tropical robuste. 15 rev./stade (60 total). Bonne récolte !', usage: 'Vendre'},
  // Animal products
  milk: {desc: 'Produit par les vaches (1 par vache tous les 10 reviews). Transformable en beurre, fromage, crème.', usage: 'Vendre ou Beurre/Fromage/Crème'},
  egg: {desc: 'Pondu par les poules (1 par poule tous les 8 reviews). Ingrédient des cookies et gâteaux.', usage: 'Vendre ou Cookie/Gâteau'},
  bacon: {desc: 'Produit par les cochons (1 par cochon tous les 15 reviews). Ingrédient du burger.', usage: 'Vendre ou Burger'},
  wool: {desc: 'Tondue des moutons (1 par mouton tous les 20 reviews). Se vend cher.', usage: 'Vendre'},
  // Processed
  bread: {desc: 'Fabriqué à la Boulangerie (3 blé → 10 rev.). Base de nombreuses recettes.', usage: 'Vendre ou Burger/Pizza'},
  butter: {desc: 'Fabriqué à la Laiterie (2 lait → 10 rev.). Ingrédient du gâteau.', usage: 'Vendre ou Gâteau'},
  cheese: {desc: 'Fabriqué à la Laiterie (3 lait → 20 rev.). Ingrédient de la pizza.', usage: 'Vendre ou Pizza'},
  sugar: {desc: 'Fabriqué à la Sucrerie (3 riz → 10 rev.). Ingrédient confiture/limonade.', usage: 'Vendre ou Confiture/Limonade'},
  cookie: {desc: 'Fabriqué à la Boulangerie (2 blé + 1 œuf → 10 rev.).', usage: 'Vendre'},
  cake: {desc: 'Fabriqué à la Pâtisserie (1 pain + 1 beurre + 1 œuf → 20 rev.). Se vend très cher !', usage: 'Vendre (25 pièces)'},
  pizza: {desc: 'Fabriquée à la Pizzeria (1 pain + 2 tomates + 1 fromage → 20 rev.). Top prix !', usage: 'Vendre (30 pièces)'},
  burger: {desc: 'Fabriqué au BBQ (1 pain + 1 bacon → 20 rev.). Le plus cher !', usage: 'Vendre (35 pièces)'},
  jam: {desc: 'Fabriquée à la Confiturerie (3 fraises + 1 sucre → 10 rev.).', usage: 'Vendre (20 pièces)'},
  grape_jam: {desc: 'Fabriquée à la Confiturerie (3 raisins + 1 sucre → 10 rev.).', usage: 'Vendre (22 pièces)'},
  juice: {desc: "Fabriqué au Pressoir (3 oranges → 10 rev.).", usage: 'Vendre (16 pièces)'},
  lemonade: {desc: 'Fabriquée au Pressoir (3 citrons + 1 sucre → 10 rev.). Rafraîchissante !', usage: 'Vendre (18 pièces)'},
  pie: {desc: "Fabriquée à la Pâtisserie (2 blé + 2 oranges + 1 sucre → 20 rev.).", usage: 'Vendre (28 pièces)'},
  melon_pie: {desc: 'Fabriquée au Four à tartes (2 melons + 2 blé + 1 crème → 20 rev.). La plus chère !', usage: 'Vendre (35 pièces)'},
  cream: {desc: 'Fabriquée à la Laiterie (2 lait → 10 rev.). Ingrédient de la tarte au melon.', usage: 'Vendre ou Tarte au melon'},
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

function showCropDetail(field) {
  const cropDef = (farmData.crop_defs||{})[field.crop]||{};
  const reviewsPerStage = cropDef.growth_reviews || 3;
  const totalNeeded = reviewsPerStage * 4;
  const totalDone = (field.growth_stage||0) * reviewsPerStage + (field.reviews_done||0);
  const reviewsLeft = totalNeeded - totalDone;
  const pct = Math.min(100, Math.round(totalDone / totalNeeded * 100));
  const cName = cropName(field.crop);
  const stageLabel = GROWTH_LABEL[Math.min(field.growth_stage||0, 4)];
  const sellPrice = cropDef.sell_price || 2;
  const harvestMin = cropDef.harvest_min || 2;
  const harvestMax = cropDef.harvest_max || 4;

  const reqs = [
    {label: 'Progression', value: `${pct}% — ${stageLabel}`, met: pct >= 50},
    {label: 'Révisions restantes', value: `${reviewsLeft}`, met: reviewsLeft <= 5},
    {label: 'Récolte', value: `${harvestMin}-${harvestMax}x à ${sellPrice} p./u`, met: true},
  ];

  // Gem instant grow option
  const gemGrowCost = Math.max(1, Math.floor(reviewsLeft / 5));
  const canGemGrow = (farmData.gems||0) >= gemGrowCost && reviewsLeft > 0;
  const actionLabel = canGemGrow ? `Croissance instantanée (${gemGrowCost} gemmes)` : null;
  const actionCmd = canGemGrow ? `pycmd('farm:gem_instant_grow:${field.id}');hideOverlay()` : null;

  showInfo({
    icon: cropPortrait(field.crop, 48) || cropImg(field.crop, field.growth_stage||0, 48),
    title: cName,
    desc: `${stageLabel} — encore ${reviewsLeft} révisions avant la récolte.`,
    requirements: reqs,
    action_label: actionLabel,
    action_cmd: actionCmd,
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
      html += `<div class="recipe-card" onclick="pycmd('farm:building_detail:${b.id}');hideOverlay()">
        <div class="recipe-header"><span class="recipe-emoji">${buildingIcon(b.id)}</span>
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
      html += `<div class="recipe-card ${canBuy?'':'disabled'}" onclick="${canBuy?`pycmd('farm:build:${b.id}');hideOverlay()`:''}">
        <div class="recipe-header"><span class="recipe-emoji">${buildingIcon(b.id)}</span>
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
      html += `<div class="recipe-card disabled">
        <div class="recipe-header"><span class="recipe-emoji" style="filter:grayscale(1) opacity(.5)">${buildingIcon(b.id)}</span>
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
  const aSrc = S(`hayday_${animalType}-lbl`) || S(`hayday_${animalType}`);
  const aIcon = aSrc ? `<img src="${aSrc}" width="40" height="40" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">` : '';
  showInfo({
    icon: aIcon,
    title: def.name || animalType,
    desc: `Produit ${def.product||''} tous les ${def.produce_every_n_reviews||10} reviews.`,
    produces: [`${def.product||''} (${def.produce_every_n_reviews||10} reviews)`],
  });
}


// --- Weather System ---
let currentWeather = null;
function updateWeather() {
  const now = new Date();
  const hour = now.getHours();
  const min = now.getMinutes();
  let weather = 'day';
  if (hour >= 21 || hour < 6) weather = 'night';
  else if (hour >= 19) weather = 'sunset';
  else if (hour >= 6 && hour < 9) weather = 'dawn';
  // Rare rain (~1 day in 14, like real Hay Day — rain is a special event, not depressing)
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(),0,0))/(1000*60*60*24));
  if (dayOfYear % 14 === 7 && hour >= 10 && hour < 16) weather = 'rain';
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
function hidePanel() {
  currentPanel=null;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('tab-farm')?.classList.add('active');
  // Animate panels out
  const visiblePanels = document.querySelectorAll('.panel:not(.hidden)');
  if (visiblePanels.length === 0) return;
  visiblePanels.forEach(p => {
    p.classList.add('panel-closing');
    setTimeout(() => { p.classList.add('hidden'); p.classList.remove('panel-closing'); }, 300);
  });
}

function renderInventory() {
  const grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
  const inv = farmData.inventory||{}, cat = farmData.item_catalog||{};
  const barnSpr = S('hayday_barn');
  const siloSpr = S('hayday_silo');
  const barnIcon = barnSpr ? `<img src="${barnSpr}" width="14" height="14" style="vertical-align:middle;margin-right:2px">` : '';
  const siloIcon = siloSpr ? `<img src="${siloSpr}" width="14" height="14" style="vertical-align:middle;margin-right:2px">` : '';
  const barnUsed = farmData.barn_used||0, barnCap = farmData.barn_capacity||50;
  const siloUsed = farmData.silo_used||0, siloCap = farmData.silo_capacity||50;
  const barnPct = Math.min(100, Math.round(barnUsed/Math.max(1,barnCap)*100));
  const siloPct = Math.min(100, Math.round(siloUsed/Math.max(1,siloCap)*100));
  const barnColor = barnPct >= 90 ? '#e74c3c' : barnPct >= 70 ? '#ff9800' : '#4caf50';
  const siloColor = siloPct >= 90 ? '#e74c3c' : siloPct >= 70 ? '#ff9800' : '#4caf50';
  document.getElementById('barn-status').innerHTML = `${barnIcon}Grange ${barnUsed}/${barnCap} <span style="display:inline-block;width:40px;height:5px;background:rgba(0,0,0,.1);border-radius:3px;vertical-align:middle;margin-left:4px"><span style="display:block;width:${barnPct}%;height:100%;background:${barnColor};border-radius:3px"></span></span>`;
  document.getElementById('silo-status').innerHTML = `${siloIcon}Silo ${siloUsed}/${siloCap} <span style="display:inline-block;width:40px;height:5px;background:rgba(0,0,0,.1);border-radius:3px;vertical-align:middle;margin-left:4px"><span style="display:block;width:${siloPct}%;height:100%;background:${siloColor};border-radius:3px"></span></span>`;

  // Sort items by category: crops → animal products → processed → materials → decorations
  const CATEGORY_ORDER = {crop: 0, animal_product: 1, processed: 2, material: 3, decoration: 4};
  const CATEGORY_LABELS = {crop: 'Récoltes', animal_product: 'Produits animaux', processed: 'Produits transformés', material: 'Matériaux', decoration: 'Décorations'};
  const sortedItems = Object.entries(inv)
    .filter(([id, qty]) => qty > 0)
    .sort((a, b) => {
      const catA = (cat[a[0]]||{}).category||'material';
      const catB = (cat[b[0]]||{}).category||'material';
      const orderA = CATEGORY_ORDER[catA] ?? 5;
      const orderB = CATEGORY_ORDER[catB] ?? 5;
      if (orderA !== orderB) return orderA - orderB;
      return ((cat[b[0]]||{}).sell_price||0) - ((cat[a[0]]||{}).sell_price||0);
    });

  let lastCategory = null;
  sortedItems.forEach(([id, qty]) => {
    const it = cat[id]||{};
    const itemCat = it.category || 'material';

    // Insert section header when category changes
    if (itemCat !== lastCategory) {
      lastCategory = itemCat;
      const sep = document.createElement('div');
      sep.className = 'inv-section-header';
      sep.textContent = CATEGORY_LABELS[itemCat] || itemCat;
      grid.appendChild(sep);
    }

    const el = document.createElement('div'); el.className = 'item-cell';
    if ((it.sell_price||0) > 0 && qty > 0) {
      el.onclick = () => { SoundMgr.play('click'); showSellDialog(id, qty); };
    } else {
      el.onclick = () => showItemInfo(id);
    }
    const icon = itemIcon(id, 36);
    el.innerHTML = `${icon}<span class="item-name">${itemName(id)}</span><span class="item-qty">x${qty}</span>${(it.sell_price||0)>0?`<span class="item-price">${it.sell_price} p.</span>`:''}<span class="item-info-btn" onclick="event.stopPropagation();showItemInfo('${id}')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='none' stroke='%23a08060' stroke-width='1.5'/%3E%3Ctext x='8' y='11.5' text-anchor='middle' font-size='10' font-weight='bold' fill='%23a08060'%3Ei%3C/text%3E%3C/svg%3E" width="12" height="12"></span>`;
    grid.appendChild(el);
  });
  if (!sortedItems.length) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#999;font-size:12px">${LANG.review_to_earn}</div>`;
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
  header.innerHTML = '<strong>Camion</strong> = 2x le prix · <strong>Bateau</strong> = 3x le prix + gemmes bonus ! Remplis et livre.';
  list.appendChild(header);

  if (!orders.length) {
    list.innerHTML += `<div style="text-align:center;padding:20px;color:#999">Aucune commande pour le moment. Elles apparaissent après ta première session de révision !</div>`;
    return;
  }

  // Sort: fulfillable first, then by progress %
  const sortedOrders = orders.map((o,i)=>({...o,_idx:i})).sort((a,b)=>{
    const inv=farmData.inventory||{};
    const pA=Object.entries(a.items_needed||{}).reduce((s,[id,q])=>s+Math.min(1,(inv[id]||0)/q),0)/Math.max(1,Object.keys(a.items_needed||{}).length);
    const pB=Object.entries(b.items_needed||{}).reduce((s,[id,q])=>s+Math.min(1,(inv[id]||0)/q),0)/Math.max(1,Object.keys(b.items_needed||{}).length);
    return pB-pA;
  });
  sortedOrders.forEach(order => {
    const i = order._idx;
    const card = document.createElement('div'); card.className = 'order-card';
    const inv = farmData.inventory||{}; let canDo=true, items='', totalNeeded=0, totalHave=0;
    Object.entries(order.items_needed||{}).forEach(([id,qty]) => {
      const have=inv[id]||0;
      if(have<qty) canDo=false;
      const enough = have >= qty;
      totalNeeded += qty; totalHave += Math.min(have, qty);
      items+=`<div class="order-item ${enough?'fulfilled':''}">
        ${itemIcon(id,18)}
        <span style="font-weight:600">${itemName(id)}</span>
        <span style="margin-left:auto;font-weight:700;color:${enough?'#4caf50':'#e74c3c'}">${have}/${qty}</span>
      </div>`;
    });
    const pct = totalNeeded > 0 ? Math.round(totalHave / totalNeeded * 100) : 0;
    const almostDone = pct >= 70 && !canDo;
    card.innerHTML = `
      <div class="order-header">
        <span class="order-type"><img src="${order.type==='boat'?ITEM_ICONS._icon_boat:ITEM_ICONS._icon_truck_color}" width="28" height="28" style="vertical-align:middle"> ${order.type==='boat'?'Bateau':'Camion'}</span>
        <span class="order-reward"><span class="order-coin-reward">${S('ui_coin')?`<img src="${S('ui_coin')}" width="14" height="14" style="vertical-align:middle">`:'<span class="css-coin" style="width:12px;height:12px;display:inline-block;vertical-align:middle"></span>'} ${order.coin_reward}</span> <span class="order-xp-reward">+${order.xp_reward} XP</span>${order.type==='boat'?`<span class="order-gem-reward">${S('ui_gem')?`<img src="${S('ui_gem')}" width="12" height="14" style="vertical-align:middle">`:'<span class="css-gem" style="width:10px;height:12px;display:inline-block;vertical-align:middle"></span>'} Bonus</span>`:''}</span>
      </div>
      ${!canDo?`<div class="order-progress-wrap"><div class="order-prog-bar"><div class="order-prog-fill${almostDone?' almost':''}" style="width:${pct}%"></div></div><span class="order-prog-text">${pct}%</span></div>`:''}
      <div class="order-items">${items}</div>
      <button class="order-fulfill-btn${canDo?' order-btn-ready':''}" ${canDo?'':'disabled'} onclick="fulfillOrder(${i})">
        ${canDo?'\u2714 Livrer maintenant !':'Items manquants'}
      </button>
    `;
    if (canDo) card.style.borderColor = 'rgba(106,191,71,.4)';
    if (almostDone) card.style.borderColor = 'rgba(255,152,0,.35)';
    list.appendChild(card);
  });
}

function renderShop() {
  const grid = document.getElementById('shop-grid'); grid.innerHTML = '';
  const shopCats=['upgrades','animals','land'];
  document.querySelectorAll('.shop-tab').forEach((b,i)=>b.classList.toggle('active',shopCats[i]===currentShopCategory));
  if(currentShopCategory==='animals')renderShopAnimals(grid);
  else if(currentShopCategory==='upgrades')renderShopUpgrades(grid);else if(currentShopCategory==='land')renderShopLand(grid);
}
function showShopCategory(cat){currentShopCategory=cat;renderShop()}
// Decoration shop removed — focus on core gameplay
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
    icon: (()=>{const s=S(`hayday_${aid}-lbl`)||S(`hayday_${aid}`);return s?`<img src="${s}" width="40" height="40">`:itemIcon(aid, 40);})(),
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
      <span class="item-info-btn" onclick="event.stopPropagation();showAnimalShopInfo('${aid}')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='none' stroke='%23a08060' stroke-width='1.5'/%3E%3Ctext x='8' y='11.5' text-anchor='middle' font-size='10' font-weight='bold' fill='%23a08060'%3Ei%3C/text%3E%3C/svg%3E" width="12" height="12"></span>
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
      <span class="item-info-btn" onclick="event.stopPropagation();showUpgradeInfo('${u.id}')"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='none' stroke='%23a08060' stroke-width='1.5'/%3E%3Ctext x='8' y='11.5' text-anchor='middle' font-size='10' font-weight='bold' fill='%23a08060'%3Ei%3C/text%3E%3C/svg%3E" width="12" height="12"></span>
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

function showPlantDialog(plotId) {
  SoundMgr.play('click');
  plantingPlotId = plotId;
  const choices = document.getElementById('crop-choices');
  choices.innerHTML = '';

  // Count how many fields are currently growing each crop
  const growingCounts = {};
  (farmData.fields || []).forEach(f => {
    if (f.crop && f.state !== 'empty' && f.state !== 'wilted') {
      growingCounts[f.crop] = (growingCounts[f.crop] || 0) + 1;
    }
  });

  const coins = farmData.coins || 0;

  // Sort crops by efficiency (profit per review) — best deals first
  const sortedCrops = [...(farmData.unlocked_crops || [])].sort((a, b) => {
    const defA = (farmData.crop_defs || {})[a] || {};
    const defB = (farmData.crop_defs || {})[b] || {};
    const totalA = (defA.growth_reviews || 3) * 4;
    const totalB = (defB.growth_reviews || 3) * 4;
    const avgA = ((defA.harvest_min || 2) + (defA.harvest_max || 4)) / 2;
    const avgB = ((defB.harvest_min || 2) + (defB.harvest_max || 4)) / 2;
    const profitPerRevA = (avgA * (defA.sell_price || 2) - (defA.plant_cost || 0)) / totalA;
    const profitPerRevB = (avgB * (defB.sell_price || 2) - (defB.plant_cost || 0)) / totalB;
    return profitPerRevB - profitPerRevA;
  });

  sortedCrops.forEach(id => {
    const name = cropName(id);
    const def = (farmData.crop_defs || {})[id] || {};
    const gr = def.growth_reviews || 3;
    const totalReviews = gr * 4;
    const sellPrice = def.sell_price || 2;
    const harvestMin = def.harvest_min || 2;
    const harvestMax = def.harvest_max || 4;
    const xpPerHarvest = def.xp_per_harvest || 3;
    const plantCost = def.plant_cost || 0;
    const stock = (farmData.inventory || {})[id] || 0;
    const growing = growingCounts[id] || 0;
    const canAfford = coins >= plantCost;
    const avgYield = Math.round((harvestMin + harvestMax) / 2);
    const profit = avgYield * sellPrice - plantCost;

    const el = document.createElement('div');
    el.className = 'crop-choice';
    if (!canAfford) el.classList.add('crop-choice-locked');

    el.onclick = () => {
      if (!canAfford) {
        showNotification(`Pas assez de pièces (${plantCost} requis)`);
        return;
      }
      const plotIdx = (farmData.fields || []).findIndex(f => f.id === plotId);
      const plotEl = document.querySelectorAll('#fields-grid .plot')[plotIdx];
      showPlantBurst(plotEl, id);
      pycmd(`farm:plant:${plotId}:${id}`);
      hideOverlay();
      SoundMgr.play('plant');
    };

    // Cost badge
    const costHtml = plantCost > 0
      ? `<span class="crop-cost-badge">${S('ui_coin') ? `<img src="${S('ui_coin')}" width="10" height="10">` : ''} ${plantCost}</span>`
      : `<span class="crop-cost-badge free">Gratuit</span>`;

    // Stats badges
    const reviewsBadge = `<span class="crop-reviews-badge">${totalReviews} rev.</span>`;
    const priceBadge = `<span class="crop-price-badge">${S('ui_coin') ? `<img src="${S('ui_coin')}" width="9" height="9">` : ''} ${sellPrice}/u</span>`;

    // Info row (stock, growing, yield)
    let infoParts = [];
    if (stock > 0) infoParts.push(`${stock} en stock`);
    if (growing > 0) infoParts.push(`${growing} en culture`);
    const infoLine = infoParts.length > 0 ? `<span class="crop-extra-info">${infoParts.join(' · ')}</span>` : '';

    // Recipe usage: which recipes use this crop
    const usage = (_staticDefs.crop_usage || {})[id] || [];
    const usageLine = usage.length > 0
      ? `<span class="crop-usage-line">${usage.map(u => `<span class="crop-usage-tag">${u.recipe}</span>`).join('')}</span>`
      : `<span class="crop-usage-line"><span class="crop-usage-tag crop-usage-sell">Vendre</span></span>`;

    el.innerHTML = `
      <div class="crop-choice-icon">${cropPortrait(id, 52) || itemIcon(id, 52)}</div>
      <strong class="crop-choice-name">${name}</strong>
      ${costHtml}
      <div class="crop-choice-stats">
        ${reviewsBadge}
        ${priceBadge}
      </div>
      <div class="crop-yield-info">
        ${harvestMin}-${harvestMax}x · +${xpPerHarvest} XP · <span class="crop-profit">+${profit} net</span>
      </div>
      ${usageLine}
      ${infoLine}
    `;
    choices.appendChild(el);
  });
  document.getElementById('plant-overlay').classList.remove('hidden');
}

let _lastHarvestPos = null;
function harvestPlot(id){
  SoundMgr.play('harvest');
  // Find the plot element and create harvest burst from it
  const field = farmData.fields?.find(f => f.id === id);
  const allPlots = document.querySelectorAll('.plot');
  const idx = (farmData.fields||[]).findIndex(f => f.id === id);
  const plotEl = allPlots[idx];
  if (field && plotEl) {
    const rect = plotEl.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    _lastHarvestPos = {x: cx, y: cy};
    // Create harvest burst particles from actual plot position
    showHarvestBurst(cx, cy, field.crop);
    // Coin fly from plot to HUD (satisfying collection feel)
    showCoinBurst(cx, cy, 4);
    // Satisfying scale-down animation on the plot
    plotEl.style.transition = 'transform .2s ease-out, opacity .2s ease-out';
    plotEl.style.transform = 'scale(0.3)';
    plotEl.style.opacity = '0.3';
    // After harvest animation, add glow hint for quick replant
    setTimeout(() => {
      plotEl.style.transition = '';
      plotEl.style.transform = '';
      plotEl.style.opacity = '';
      plotEl.classList.add('plot-just-harvested');
      setTimeout(() => plotEl.classList.remove('plot-just-harvested'), 1500);
    }, 300);
  }
  pycmd(`farm:harvest:${id}`);
}
function showHarvestBurst(x, y, cropId) {
  const layer = document.getElementById('reward-layer');
  if (!layer) return;
  const portrait = cropPortrait(cropId, 22) || itemIcon(cropId, 20);
  // Main crop burst (8 particles fanning out)
  for (let i = 0; i < 8; i++) {
    const el = document.createElement('div');
    el.className = 'harvest-particle';
    el.innerHTML = portrait;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    const angle = (i / 8) * Math.PI * 2;
    const dist = 60 + Math.random() * 50;
    el.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
    el.style.setProperty('--dy', (Math.sin(angle) * dist - 40) + 'px');
    el.style.animationDelay = (i * 40) + 'ms';
    layer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
  }
  // Gold sparkles around the harvest
  for (let i = 0; i < 5; i++) {
    const sp = document.createElement('div');
    sp.className = 'harvest-sparkle';
    sp.style.left = x + 'px';
    sp.style.top = y + 'px';
    sp.style.setProperty('--dx', ((Math.random() - 0.5) * 80) + 'px');
    sp.style.setProperty('--dy', (-(Math.random() * 60 + 20)) + 'px');
    sp.style.animationDelay = (100 + i * 50) + 'ms';
    layer.appendChild(sp);
    setTimeout(() => { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 900);
  }
}
function showHarvestAllBurst(n, xp, coins) {
  const zone = document.querySelector('.zone-fields');
  let cx = window.innerWidth/2, cy = window.innerHeight/3;
  if (zone) { const r = zone.getBoundingClientRect(); cx = r.left + r.width/2; cy = r.top + r.height/2; }
  showCoinBurst(cx, cy, n);
  if (coins > 0) showFloatingReward('+' + coins, cx - 20, cy - 10);
  showFloatingReward('+' + xp + ' XP', cx + 20, cy + (coins > 0 ? 5 : -10));
}
function showPlantBurst(plotEl, cropId) {
  if (!plotEl) return;
  const layer = document.getElementById('reward-layer');
  if (!layer) return;
  const rect = plotEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  // Dirt puff particles (brown, rising outward)
  for (let i = 0; i < 6; i++) {
    const el = document.createElement('div');
    el.className = 'plant-particle';
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    const angle = (i / 6) * Math.PI * 2;
    const dist = 25 + Math.random() * 20;
    el.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
    el.style.setProperty('--dy', (Math.sin(angle) * dist - 15) + 'px');
    el.style.animationDelay = (i * 30) + 'ms';
    layer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 700);
  }
  // Seed falling into soil
  const portrait = cropPortrait(cropId, 18);
  if (portrait) {
    const seed = document.createElement('div');
    seed.className = 'plant-seed-drop';
    seed.innerHTML = portrait;
    seed.style.left = cx + 'px';
    seed.style.top = (cy - 20) + 'px';
    layer.appendChild(seed);
    setTimeout(() => { if (seed.parentNode) seed.remove(); }, 600);
  }
}
function plantAllEmpty(){SoundMgr.play('plant');pycmd('farm:plant_all_empty')}
function sellItem(id){
  SoundMgr.play('click');
  const qty = (farmData.inventory||{})[id]||0;
  if (qty <= 1) { pycmd(`farm:sell:${id}:1`); return; }
  showSellDialog(id, qty);
}
let _sellState = { id: '', qty: 0, maxQty: 0, price: 0 };

function showSellDialog(id, qty) {
  const cat = (farmData.item_catalog||{})[id]||{};
  const price = cat.sell_price || 0;
  if (price <= 0 || qty <= 0) return;
  const overlay = document.getElementById('sell-overlay');
  if (!overlay) return pycmd(`farm:sell:${id}:1`);

  _sellState = { id, qty: qty <= 5 ? qty : 1, maxQty: qty, price };

  document.getElementById('sell-item-name').innerHTML = `${itemIcon(id,32)} ${itemName(id)}`;
  document.getElementById('sell-item-stock').textContent = `Stock : ${qty}`;
  document.getElementById('sell-unit-price').textContent = `${price} p. / unit\u00e9`;

  const btns = document.getElementById('sell-buttons');
  btns.innerHTML = '';

  // Quick quantity buttons
  const quickDiv = document.createElement('div');
  quickDiv.className = 'sell-quick-btns';
  const quickAmts = [1];
  if (qty >= 5) quickAmts.push(5);
  if (qty >= 10) quickAmts.push(10);
  if (!quickAmts.includes(qty)) quickAmts.push(qty);
  quickAmts.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'sell-quick-btn' + (n === _sellState.qty ? ' active' : '');
    btn.textContent = n === qty ? `Tout (${n})` : `x${n}`;
    btn.onclick = () => { _sellState.qty = n; _updateSellPreview(); SoundMgr.play('click'); };
    quickDiv.appendChild(btn);
  });
  btns.appendChild(quickDiv);

  // +/- quantity selector
  const selectorDiv = document.createElement('div');
  selectorDiv.className = 'sell-qty-selector';
  selectorDiv.innerHTML = `
    <button class="sell-qty-btn" onclick="_sellAdjust(-1)">-</button>
    <span class="sell-qty-display" id="sell-qty-num">${_sellState.qty}</span>
    <button class="sell-qty-btn" onclick="_sellAdjust(1)">+</button>
  `;
  btns.appendChild(selectorDiv);

  // Total preview
  const previewDiv = document.createElement('div');
  previewDiv.className = 'sell-total-preview';
  const coinIconHtml = S('ui_coin') ? `<img src="${S('ui_coin')}" width="20" height="20">` : '<span class="css-coin" style="width:18px;height:18px"></span>';
  previewDiv.innerHTML = `<div class="sell-total-coins" id="sell-total-coins">${coinIconHtml} ${_sellState.qty * price}</div>`;
  btns.appendChild(previewDiv);

  // Confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'sell-confirm-btn';
  confirmBtn.id = 'sell-confirm-btn';
  confirmBtn.innerHTML = `Vendre ${_sellState.qty > 1 ? 'x' + _sellState.qty : ''} !`;
  confirmBtn.onclick = () => {
    pycmd(`farm:sell:${_sellState.id}:${_sellState.qty}`);
    hideOverlay();
    SoundMgr.play('coin');
    // Show coin burst from center
    const rect = confirmBtn.getBoundingClientRect();
    showCoinBurst(rect.left + rect.width / 2, rect.top, 6);
  };
  btns.appendChild(confirmBtn);

  overlay.classList.remove('hidden');
}

function _sellAdjust(delta) {
  const newQty = Math.max(1, Math.min(_sellState.maxQty, _sellState.qty + delta));
  if (newQty === _sellState.qty) return;
  _sellState.qty = newQty;
  _updateSellPreview();
  SoundMgr.play('click');
}

function _updateSellPreview() {
  const numEl = document.getElementById('sell-qty-num');
  const totalEl = document.getElementById('sell-total-coins');
  const btnEl = document.getElementById('sell-confirm-btn');
  if (numEl) numEl.textContent = _sellState.qty;
  if (totalEl) {
    const coinIconHtml = S('ui_coin') ? `<img src="${S('ui_coin')}" width="20" height="20">` : '<span class="css-coin" style="width:18px;height:18px"></span>';
    totalEl.innerHTML = `${coinIconHtml} ${_sellState.qty * _sellState.price}`;
  }
  if (btnEl) btnEl.innerHTML = `Vendre ${_sellState.qty > 1 ? 'x' + _sellState.qty : ''} !`;
  // Update quick buttons active state
  document.querySelectorAll('.sell-quick-btn').forEach(btn => {
    const match = btn.textContent.match(/\d+/);
    const n = match ? parseInt(match[0]) : 0;
    btn.classList.toggle('active', n === _sellState.qty);
  });
}
function fulfillOrder(i){
  SoundMgr.play('collect');
  // Find the order card and animate it (truck/boat driving away)
  const orderCards = document.querySelectorAll('.order-card');
  const orders = farmData.active_orders || [];
  const sortedIdxMap = orders.map((o, idx) => ({...o, _idx: idx}))
    .sort((a, b) => {
      const inv = farmData.inventory || {};
      const pA = Object.entries(a.items_needed||{}).reduce((s,[id,q])=>s+Math.min(1,(inv[id]||0)/q),0)/Math.max(1,Object.keys(a.items_needed||{}).length);
      const pB = Object.entries(b.items_needed||{}).reduce((s,[id,q])=>s+Math.min(1,(inv[id]||0)/q),0)/Math.max(1,Object.keys(b.items_needed||{}).length);
      return pB - pA;
    });
  const sortedPos = sortedIdxMap.findIndex(o => o._idx === i);
  // +1 to skip the explanation header div
  const targetCard = orderCards[sortedPos] || null;
  if (targetCard) {
    targetCard.classList.add('order-delivering');
    setTimeout(() => targetCard.classList.remove('order-delivering'), 1000);
  }
  pycmd(`farm:fulfill_order:${i}`);
}

function spinWheel(){if(farmData.can_spin_wheel){SoundMgr.play('click');document.getElementById('wheel-overlay').classList.remove('hidden');drawWheel()}else showNotification(LANG.come_back)}

// Floating wheel button — visible when a free spin is available (Hay Day style: prominent bonus mechanic)
function updateWheelButton() {
  const btn = document.getElementById('wheel-float-btn');
  if (!btn) return;
  if (farmData.can_spin_wheel) {
    btn.style.display = 'flex';
    const iconEl = document.getElementById('wheel-float-icon');
    const wheelSrc = S('_icon_wheel');
    if (iconEl && wheelSrc) iconEl.innerHTML = `<img src="${wheelSrc}" width="32" height="32" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">`;
  } else {
    btn.style.display = 'none';
  }
}
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
function drawWheel(rot){rot=rot||0;const c=document.getElementById('wheel-canvas');if(!c)return;const ctx=c.getContext('2d'),cx=140,cy=140,r=130;const segs=[{l:'25 p.',c:'#f44336'},{l:'50 p.',c:'#e91e63'},{l:'100 p.',c:'#9c27b0'},{l:'1 gem',c:'#673ab7'},{l:'3 gem',c:'#3f51b5'},{l:'5 gem',c:'#2196f3'},{l:'3 mat.',c:'#009688'},{l:'3 mat.',c:'#4caf50'},{l:'Permis',c:'#ff9800'}];ctx.clearRect(0,0,280,280);const sa=2*Math.PI/segs.length;segs.forEach((s,i)=>{const a=rot+i*sa;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,a+sa);ctx.closePath();ctx.fillStyle=s.c;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(a+sa/2);ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(s.l,r*.65,4);ctx.restore()});ctx.beginPath();ctx.arc(cx,cy,16,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill()}

// Mystery box functions removed — Wheel of Fortune covers surprise rewards
function showBoxResult(r){} // no-op stub for backward compat with Python bridge

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

function showSessionSummary(d){
  SoundMgr.play('levelup');
  const coinIcon = S('ui_coin') ? `<img src="${S('ui_coin')}" width="20" height="20" style="vertical-align:middle">` : '<span class="css-coin" style="width:16px;height:16px;display:inline-block;vertical-align:middle"></span>';
  const accuracy = d.reviews > 0 ? Math.round((d.correct||0)/d.reviews*100) : 0;
  const reviews = d.reviews || 0;

  // Star rating based on session quality (Hay Day style)
  let stars = 1;
  if (reviews >= 10 && accuracy >= 60) stars = 2;
  if (reviews >= 20 && accuracy >= 75) stars = 3;
  const starSrc = S('_gold_star') || S('hayday_star');
  const starFull = starSrc
    ? `<img src="${starSrc}" width="28" height="28" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">`
    : '<span style="color:#ffd700;font-size:24px">&#9733;</span>';
  const starEmpty = starSrc
    ? `<img src="${starSrc}" width="28" height="28" style="filter:grayscale(1) opacity(.25)">`
    : '<span style="color:#ccc;font-size:24px">&#9733;</span>';
  const starsHtml = [1,2,3].map(i => i <= stars ? starFull : starEmpty).join(' ');
  const ratingLabels = ['', 'Bon d\u00e9but !', 'Belle session !', 'Session parfaite !'];

  document.getElementById('session-stats').innerHTML = `
    <div style="grid-column:1/-1;text-align:center;margin-bottom:4px">
      <div style="margin-bottom:4px">${starsHtml}</div>
      <div style="font-size:12px;font-weight:800;color:#8b6914;letter-spacing:.3px">${ratingLabels[stars]}</div>
    </div>
    <div class="session-stat"><div class="session-stat-value">${reviews}</div><div class="session-stat-label">${LANG.cards}</div></div>
    <div class="session-stat"><div class="session-stat-value">${coinIcon} ${formatNum(d.coins_earned||0)}</div><div class="session-stat-label">${LANG.coins_earned}</div></div>
    <div class="session-stat"><div class="session-stat-value">+${formatNum(d.xp_earned||0)}</div><div class="session-stat-label">${LANG.xp_earned}</div></div>
    <div class="session-stat"><div class="session-stat-value">${accuracy}%</div><div class="session-stat-label">${LANG.accuracy}</div></div>
    <div class="session-stat"><div class="session-stat-value"><span class="css-fire" style="display:inline-block;vertical-align:middle;margin-right:2px"></span>${d.streak||0}</div><div class="session-stat-label">${LANG.streak_label}</div></div>
    ${d.harvests_count>0?`<div class="session-stat"><div class="session-stat-value">${d.harvests_count}</div><div class="session-stat-label">${LANG.harvests}</div></div>`:''}
  `;
  let items='';
  Object.entries(d.items_earned||{}).forEach(([id,qty])=>{items+=`<span class="session-item-tag">${itemIcon(id,14)} ${itemName(id)} x${qty}</span>`});
  document.getElementById('session-items').innerHTML=items;
  document.getElementById('session-overlay').classList.remove('hidden');
  if (stars >= 2) createConfetti();
}

function hideOverlay(){document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));wheelSpinning=false}
function showNotification(msg,type){if(!notificationsEnabled&&type!=='reward')return;const area=document.getElementById('notification-area');if(!area)return;const el=document.createElement('div');el.className='notification';if(type==='reward')el.classList.add('reward-notif');el.innerHTML=msg;area.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},3000)}
function showFloatingReward(text,x,y){const layer=document.getElementById('reward-layer');if(!layer)return;const el=document.createElement('div');el.className='floating-reward';el.textContent=text;el.style.left=(x||window.innerWidth/2)+'px';el.style.top=(y||window.innerHeight/2)+'px';layer.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},1200)}
function showCoinBurst(x,y,n){
  const layer=document.getElementById('reward-layer');if(!layer)return;
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
function showReward(d){
  const coins = d.coins || 0;
  const xp = d.xp || 0;
  const hasItems = d.items && Object.keys(d.items).length > 0;
  // Determine reward tier: normal review = subtle HUD-only feedback,
  // good reward = small floating text, big reward = full burst
  const isSpecial = hasItems || coins >= 15;
  const isBig = coins >= 25;

  // Use last harvest position for harvest rewards (Hay Day style: rewards fly from crop)
  const harvestPos = _lastHarvestPos;
  _lastHarvestPos = null;

  if (coins > 0 || xp > 0) {
    if (harvestPos) {
      // Harvest reward: show from the plot position for satisfying feedback
      if (coins > 0) showFloatingReward(`+${coins}`, harvestPos.x - 15, harvestPos.y - 10);
      if (xp > 0) setTimeout(() => showFloatingReward(`+${xp} XP`, harvestPos.x + (coins > 0 ? 15 : 0), harvestPos.y + (coins > 0 ? 5 : -10)), coins > 0 ? 150 : 0);
    } else if (isBig) {
      // Big reward: full coin burst + floating text + sound (rare, exciting)
      const zone = document.querySelector('.zone-fields');
      let cx = window.innerWidth/2, cy = window.innerHeight/3;
      if (zone) { const r = zone.getBoundingClientRect(); cx = r.left + r.width/2; cy = Math.max(60, r.top + r.height/2); }
      showFloatingReward(`+${coins}`, cx, cy);
      showCoinBurst(cx, cy + 15, Math.min(8, Math.max(3, Math.floor(coins / 3))));
      SoundMgr.play('coin');
      if (xp > 0) setTimeout(() => showFloatingReward(`+${xp} XP`, cx + 30, cy + 15), 180);
    } else if (isSpecial) {
      // Special: small floating text near HUD, subtle sound
      const hudEl = document.getElementById('hud-coins');
      let cx = window.innerWidth / 2, cy = 60;
      if (hudEl) { const r = hudEl.getBoundingClientRect(); cx = r.left + r.width / 2; cy = r.bottom + 8; }
      showFloatingReward(`+${coins}`, cx, cy);
      SoundMgr.play('coin');
    }
    // Normal reviews: coin sparkle near HUD + subtle XP indicator — satisfying but not distracting
    else if (coins > 0) {
      const hudEl = document.getElementById('hud-coins');
      if (hudEl) {
        const r = hudEl.getBoundingClientRect();
        const layer = document.getElementById('reward-layer');
        // Small coin fly from center to HUD (subtle but satisfying like Hay Day)
        const coinSrc = S('ui_coin');
        const coinFly = document.createElement('div');
        coinFly.className = 'coin-fly-to-hud';
        if (coinSrc) coinFly.innerHTML = `<img src="${coinSrc}" width="14" height="14">`;
        else coinFly.innerHTML = '<span class="css-coin" style="width:12px;height:12px"></span>';
        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;
        coinFly.style.left = startX + 'px';
        coinFly.style.top = startY + 'px';
        coinFly.style.setProperty('--target-x', (r.left + r.width / 2 - startX) + 'px');
        coinFly.style.setProperty('--target-y', (r.top + r.height / 2 - startY) + 'px');
        layer.appendChild(coinFly);
        setTimeout(() => { if (coinFly.parentNode) coinFly.remove(); }, 700);
        // Coin sparkle with coin icon
        const sparkle = document.createElement('div');
        sparkle.className = 'review-sparkle';
        sparkle.style.left = (r.left + r.width / 2) + 'px';
        sparkle.style.top = (r.bottom + 4) + 'px';
        const coinIcon = coinSrc ? `<img src="${coinSrc}" width="12" height="12" style="vertical-align:middle;margin-right:1px">` : '';
        sparkle.innerHTML = `${coinIcon}+${coins}`;
        layer.appendChild(sparkle);
        setTimeout(() => { if (sparkle.parentNode) sparkle.remove(); }, 1000);
        // XP sparkle slightly delayed
        if (xp > 0) {
          setTimeout(() => {
            const xpSparkle = document.createElement('div');
            xpSparkle.className = 'review-sparkle review-sparkle-xp';
            xpSparkle.style.left = (r.left + r.width / 2 + 30) + 'px';
            xpSparkle.style.top = (r.bottom + 4) + 'px';
            xpSparkle.textContent = '+' + xp + ' XP';
            layer.appendChild(xpSparkle);
            setTimeout(() => { if (xpSparkle.parentNode) xpSparkle.remove(); }, 1000);
          }, 120);
        }
      }
    }
  }
  // Material/item drops: staggered notifications with item icons (these are rare ~15%, always exciting)
  if (hasItems) {
    let delay = isSpecial ? 350 : 200;
    let first = true;
    Object.entries(d.items).forEach(([id, qty]) => {
      const playSound = first; first = false;
      setTimeout(() => {
        showNotification(`${itemIcon(id, 14)} +${qty} ${itemName(id)}`, 'reward');
        if (playSound) SoundMgr.play('collect');
      }, delay);
      delay += 280;
    });
  }
}

// --- Hay Day-style building tap-to-collect ---
// Tap a building with ready products → instant collect with satisfying burst animation
function collectBuildingDirect(bid, el) {
  if (!el) return pycmd('farm:collect:' + bid);
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  SoundMgr.play('collect');

  // Products burst out of building (like items popping in Hay Day)
  const queue = (farmData.production_queues || {})[bid] || [];
  const readyItems = queue.filter(q => q.ready);
  readyItems.forEach((q, i) => {
    setTimeout(() => {
      const productId = q.recipe_id || '';
      showBuildingProductBurst(cx, cy, productId);
    }, i * 120);
  });

  // Coins fly to HUD from building position
  showCoinBurst(cx, cy, Math.min(8, readyItems.length * 3));

  // Satisfying bounce animation on the building tile
  el.classList.add('building-collect-bounce');
  setTimeout(() => el.classList.remove('building-collect-bounce'), 600);

  // Send collection to backend (quiet mode — JS handles visuals)
  pycmd('farm:collect_direct:' + bid);
}

// Products burst out of a building (items flying outward like Hay Day)
function showBuildingProductBurst(x, y, productId) {
  const layer = document.getElementById('reward-layer');
  if (!layer) return;
  const icon = itemIcon(productId, 22);
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'harvest-particle';
    el.innerHTML = icon;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    const angle = ((i / 3) * Math.PI - Math.PI / 2) + (Math.random() - 0.5) * 0.8;
    const dist = 50 + Math.random() * 40;
    el.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
    el.style.setProperty('--dy', (Math.sin(angle) * dist - 30) + 'px');
    el.style.animationDelay = (i * 60) + 'ms';
    layer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.remove(); }, 1000);
  }
}

// Collect all buildings with staggered bursts from each building position
function collectAllBuildingsDirect() {
  const buildingTiles = document.querySelectorAll('.building-tile.has-ready');
  if (buildingTiles.length === 0) return;

  SoundMgr.play('collect');

  buildingTiles.forEach((tile, idx) => {
    const rect = tile.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTimeout(() => {
      showCoinBurst(cx, cy, 3);
      showBuildingProductBurst(cx, cy, '');
      tile.classList.add('building-collect-bounce');
      setTimeout(() => tile.classList.remove('building-collect-bounce'), 600);
    }, idx * 200);
  });

  if (buildingTiles.length >= 3) {
    setTimeout(() => createConfetti(), buildingTiles.length * 200);
  }

  // Send to backend (quiet mode)
  pycmd('farm:collect_all_direct');
}

function showBuildingDetail(bid){pycmd(`farm:building_detail:${bid}`)}
function updateBuildingDetail(data){if(data&&data.recipes)showProductionDialog(data);else if(currentPanel==='buildings')renderBuildingsPanel()}
function showProductionDialog(data) {
  const bldIcon = buildingIcon(data.building_id, 22);
  document.getElementById('production-title').innerHTML =
    `${bldIcon ? bldIcon + ' ' : ''}${data.building_name || 'Production'}`;

  const list = document.getElementById('production-recipes');
  list.innerHTML = '';

  // --- Production Queue ---
  const queue = data.queue || [];
  if (queue.length > 0) {
    const qd = document.createElement('div');
    qd.className = 'production-section';
    qd.innerHTML = `<h3>${LANG.in_progress}</h3>`;

    queue.forEach(q => {
      const reviewsDone = q.reviews_done || (q.sessions_waited || 0) * 10;
      const reviewsTotal = q.reviews_required || (q.sessions_required || 1) * 10;
      const pct = Math.min(100, reviewsDone / Math.max(1, reviewsTotal) * 100);

      const s = document.createElement('div');
      s.className = `production-queue-item ${q.ready ? 'ready' : ''}`;

      const checkSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ccircle cx='8' cy='8' r='7' fill='%234caf50'/%3E%3Cpath d='M4.5 8l2.5 2.5 4.5-5' stroke='%23fff' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

      const reviewsLeft = Math.max(0, reviewsTotal - reviewsDone);
      const gemCost = Math.max(1, Math.floor(reviewsLeft / 5));
      const progressHtml = !q.ready
        ? `<div class="pq-bar"><div class="pq-bar-fill" style="width:${pct}%"></div></div>`
        : `<span class="pq-ready-badge"><img src="${checkSvg}" width="18" height="18"></span>`;

      const gemIconHtml = S('ui_gem') ? `<img src="${S('ui_gem')}" width="12" height="12" style="vertical-align:middle">` : '<span class="css-gem" style="width:10px;height:12px"></span>';
      const gemBtnHtml = !q.ready && (farmData.gems||0) >= gemCost
        ? `<button class="gem-speed-btn" title="Terminer maintenant (${gemCost} gemmes)">${gemIconHtml} ${gemCost}</button>`
        : '';

      s.innerHTML = `
        <span class="pq-emoji">${itemIcon(q.recipe_id || '', 28)}</span>
        <div class="pq-info">
          <strong>${q.name}</strong>
          <span>${q.ready ? LANG.ready : reviewsLeft + ' révisions restantes'}</span>
        </div>
        ${progressHtml}
        ${gemBtnHtml}
      `;
      // Attach gem speed click handler
      const gemBtn = s.querySelector('.gem-speed-btn');
      if (gemBtn) {
        gemBtn.onclick = (e) => {
          e.stopPropagation();
          pycmd(`farm:gem_speed_production:${data.building_id}`);
          hideOverlay();
        };
      }
      qd.appendChild(s);
    });

    // Collect all button
    if (queue.some(q => q.ready)) {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.textContent = LANG.collect_all;
      btn.style.marginTop = '8px';
      btn.onclick = () => {
        pycmd(`farm:collect:${data.building_id}`);
        hideOverlay();
        SoundMgr.play('collect');
      };
      qd.appendChild(btn);
    }
    list.appendChild(qd);
  }

  // --- Recipes ---
  const rd = document.createElement('div');
  rd.className = 'production-section';
  rd.innerHTML = `<h3>${LANG.recipes}</h3>`;

  (data.recipes || []).forEach(r => {
    const c = document.createElement('div');
    c.className = `recipe-card ${r.can_craft ? '' : 'disabled'}`;

    // Ingredients list with guidance for missing items
    let ingHtml = '';
    Object.entries(r.ingredients || {}).forEach(([id, qty]) => {
      const have = (farmData.inventory || {})[id] || 0;
      const enough = have >= qty;
      let hintHtml = '';
      if (!enough) {
        const cat = ((farmData.item_catalog || {})[id] || {}).category || '';
        const isGrowing = (farmData.fields || []).some(f => f.crop === id && f.state !== 'empty');
        if (cat === 'crop' && isGrowing) {
          hintHtml = '<span class="ing-hint">en culture</span>';
        } else if (cat === 'crop') {
          hintHtml = '<span class="ing-hint">plante !</span>';
        } else if (cat === 'animal_product') {
          hintHtml = '<span class="ing-hint">animaux</span>';
        } else if (cat === 'processed') {
          hintHtml = '<span class="ing-hint">à produire</span>';
        }
      }
      ingHtml += `<span class="recipe-ingredient ${enough ? 'has' : 'need'}">
        ${itemIcon(id, 16)} ${itemName(id)} <b>${have}/${qty}</b>${hintHtml}
      </span>`;
    });

    const reviewsNeeded = (r.sessions_required || 1) * 10;
    const sellPrice = ((farmData.item_catalog || {})[r.id] || {}).sell_price || 0;
    const priceHtml = sellPrice > 0 ? `<span class="recipe-sell-price">${S('ui_coin') ? `<img src="${S('ui_coin')}" width="10" height="10">` : ''} ${sellPrice}</span>` : '';

    c.innerHTML = `
      <div class="recipe-header">
        <span class="recipe-emoji">${itemIcon(r.id, 32)}</span>
        <div class="recipe-info">
          <strong>${r.name}</strong>
          <span class="recipe-time">${reviewsNeeded} rev. · +${r.xp} XP ${priceHtml}</span>
        </div>
      </div>
      <div class="recipe-ingredients">${ingHtml}</div>
      ${r.reason && !r.can_craft ? `<span class="recipe-reason">${r.reason}</span>` : ''}
    `;

    if (r.can_craft) {
      c.onclick = () => {
        pycmd(`farm:start_production:${data.building_id}:${r.id}`);
        hideOverlay();
        SoundMgr.play('click');
      };
    }
    rd.appendChild(c);
  });

  list.appendChild(rd);
  document.getElementById('production-overlay').classList.remove('hidden');
}

function formatNum(n){if(n>=1000000)return(n/1000000).toFixed(1)+'M';if(n>=10000)return Math.round(n/1000)+'k';if(n>=1000)return(n/1000).toFixed(1)+'k';return String(n)}

// --- Ambient Particles (floating seeds, pollen, leaves for Hay Day atmosphere) ---
let _ambientInterval = null;
function startAmbientParticles() {
  if (_ambientInterval) return;
  const container = document.getElementById('farm-world');
  if (!container) return;
  function spawnParticle() {
    // Don't spawn if farm tab isn't active or too many particles
    if (currentPanel) return;
    const existing = container.querySelectorAll('.ambient-particle');
    if (existing.length >= 8) return;
    const types = ['ambient-seed', 'ambient-pollen', 'ambient-leaf'];
    const weights = [3, 4, 2]; // pollen most common
    let r = Math.random() * 9;
    let typeIdx = 0;
    for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { typeIdx = i; break; } }
    const p = document.createElement('div');
    p.className = `ambient-particle ${types[typeIdx]}`;
    p.style.left = (10 + Math.random() * 80) + '%';
    p.style.top = (10 + Math.random() * 60) + '%';
    p.style.animationDuration = (8 + Math.random() * 12) + 's';
    p.style.animationDelay = (Math.random() * 3) + 's';
    p.style.opacity = 0.15 + Math.random() * 0.25;
    container.appendChild(p);
    // Remove after animation completes
    const dur = parseFloat(p.style.animationDuration) * 1000 + parseFloat(p.style.animationDelay) * 1000;
    setTimeout(() => { if (p.parentNode) p.remove(); }, dur + 1000);
  }
  // Spawn a few immediately
  for (let i = 0; i < 4; i++) setTimeout(spawnParticle, i * 800);
  // Then every few seconds
  _ambientInterval = setInterval(spawnParticle, 3000 + Math.random() * 2000);
}

// --- Farmer Character ---
function renderFarmer() {
  const el = document.getElementById('farmer-character');
  if (!el) return;
  const src = S('hayday_farmer-woman') || S('hayday_farmer-man');
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
  const src = S('hayday_farmer-man') || S('hayday_farmer-woman');
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

// (startAmbientParticles defined above — spawns particles dynamically)

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tab-farm').classList.add('active');
  drawWheel();
  pycmd('farm:get_state');
  SoundMgr.playMusic();
  startAmbientParticles();
  // Show tutorial on first visit
  if (!localStorage.getItem('adfarm_tutorial_done')) {
    setTimeout(showTutorial, 800);
  }
});
