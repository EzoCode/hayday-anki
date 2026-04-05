/* =============================================================
   ADFarm — Hay Day Clone JavaScript
   SPRITES object is injected before this script by Python
   ============================================================= */

let farmData = {};
let currentPanel = null;
let currentShopCategory = 'decorations';
let plantingPlotId = null;
let currentBoxIndex = null;
let wheelSpinning = false;
let notificationsEnabled = true;

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
};

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

function cropImg(id, stage, w) { return img(`crops_${id}_${stage}`, w||44, w||44, 'plot-crop'); }
function cropPortrait(id, w) { return img(`crops_${id}_portrait`, w||28, w||28); }

const HD_BUILDINGS = {
  bakery:'hayday_barn', barn:'hayday_barn', silo:'hayday_silo',
  shop:'hayday_shop', sugar_mill:'hayday_mill-dark', dairy:'hayday_silo',
  chicken_coop:'hayday_chicken_coop', bbq:'hayday_barn', pastry_shop:'hayday_shop',
  pizzeria:'hayday_shop', jam_maker:'hayday_barn', juice_press:'hayday_silo',
  pie_oven:'hayday_barn', windmill:'hayday_mill-dark', coop:'hayday_chicken_coop',
};
function buildingImg(id, w) {
  const key = HD_BUILDINGS[id] || `buildings_${id}`;
  return img(key, w||100, w ? Math.round(w*0.83) : 83, 'building-img');
}

function animalImg(id, w) {
  const src = S(`hayday_${id}`) || S(`animals_${id}`);
  if (!src) return `<span style="font-size:${w||40}px">${ANIMAL_EMOJI[id]||''}</span>`;
  return `<img src="${src}" width="${w||50}" height="${w?Math.round(w*.85):42}" class="animal-img" draggable="false">`;
}
function animalLbl(id, w) { return img(`hayday_${id}-lbl`, w||45, w||45, 'animal-lbl'); }

function fieldBg(state) {
  if (state === 'ready') return S('hayday_wheat-field') || S('hayday_field');
  if (state === 'growing' || state === 'planted') return S('hayday_alfalfa-field') || S('hayday_field');
  return S('hayday_field');
}
function lockImg(w) { return img('hayday_lock', w||24, w||24, 'lock-icon'); }

const CROP_EMOJI = { wheat:'\u{1F33E}',corn:'\u{1F33D}',carrot:'\u{1F955}',tomato:'\u{1F345}',potato:'\u{1F954}',sugarcane:'\u{1F33F}',soybean:'\u{1FAD8}',strawberry:'\u{1F353}',apple:'\u{1F34E}',pumpkin:'\u{1F383}' };
const ANIMAL_EMOJI = { cow:'\u{1F404}',chicken:'\u{1F414}',pig:'\u{1F416}',sheep:'\u{1F411}' };
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
  const icons = ['\u2728', '\u2B50', '\u{1F4AB}', '\u{1F31F}', '\u2726', '\u2605'];
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('div');
    s.className = 'sparkle-particle';
    s.style.left = Math.random() * 100 + '%';
    s.style.animationDelay = (Math.random() * 2) + 's';
    s.style.animationDuration = (1.5 + Math.random() * 2) + 's';
    s.style.color = colors[Math.floor(Math.random() * colors.length)];
    s.textContent = icons[Math.floor(Math.random() * icons.length)];
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
  farmData = data;
  updateHUD(); renderPlots(); renderBuildings(); renderAnimals(); renderDecorations(); renderMysteryBoxes(); updateSections(); checkStorageWarnings(); updateWeather();
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
  if (barnPct >= 1) { showNotification('\u{1F6A8} ' + LANG.barn_full); _lastStorageWarning = now; }
  else if (barnPct >= 0.9) { showNotification('\u{26A0}\u{FE0F} ' + LANG.barn_almost + ' (' + d.barn_used + '/' + d.barn_capacity + ')'); _lastStorageWarning = now; }
  if (siloPct >= 1) { showNotification('\u{1F6A8} ' + LANG.silo_full); _lastStorageWarning = now; }
  else if (siloPct >= 0.9) { showNotification('\u{26A0}\u{FE0F} ' + LANG.silo_almost + ' (' + d.silo_used + '/' + d.silo_capacity + ')'); _lastStorageWarning = now; }
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
  // Streak bonus indicator
  const streakEl = document.getElementById('hud-streak');
  const bonus = d.streak_bonus_pct || 0;
  streakEl.title = bonus > 0 ? `Streak bonus: +${bonus}%` : 'Review daily to build streak!';
  // Active events banner
  const banner = document.getElementById('event-banner');
  const events = d.active_events || [];
  if (events.length > 0) {
    banner.innerHTML = events.map(e => `<span class="event-tag">${e.emoji} ${e.name}</span>`).join('');
    banner.style.display = '';
  } else {
    banner.style.display = 'none';
  }
}

function renderPlots() {
  const grid = document.getElementById('plots-grid'); grid.innerHTML = '';
  (farmData.plots || []).forEach(plot => {
    const el = document.createElement('div');
    el.className = `plot plot-${plot.state}`;
    const bg = fieldBg(plot.state);
    if (bg) el.innerHTML = `<img src="${bg}" class="field-img">`;
    if (plot.state === 'empty') {
      el.innerHTML += '<span class="plot-plus">+</span>';
      el.onclick = () => showPlantDialog(plot.id);
    } else if (plot.state === 'ready') {
      el.innerHTML += `<div class="plot-crop">${cropImg(plot.crop, 4, 40)}</div><span class="plot-label">${LANG.harvest}</span>`;
      el.onclick = () => harvestPlot(plot.id);
    } else if (plot.state === 'wilted') {
      el.innerHTML += `<div class="plot-crop" style="opacity:.4;filter:grayscale(.8)">${cropImg(plot.crop, 0, 32)}</div><span class="plot-label">\u{1F342} ${LANG.wilted}</span>`;
      el.onclick = () => { pycmd(`farm:clear_wilted:${plot.id}`); SoundMgr.play('click'); };
    } else {
      const stage = plot.growth_stage||0, needed = plot.reviews_needed||1, done = plot.reviews_done||0;
      const pct = Math.min(100, (done/needed)*100);
      el.innerHTML += `<div class="plot-crop">${cropImg(plot.crop, stage, 36)}</div><span class="plot-label">${GROWTH_LABEL[Math.min(stage,4)]}</span><div class="plot-progress"><div class="plot-progress-fill" style="width:${pct}%"></div></div>`;
    }
    grid.appendChild(el);
  });
  const level = farmData.level||1, locked = getLockedCount(level);
  for (let i = 0; i < locked; i++) {
    const el = document.createElement('div'); el.className = 'plot-locked';
    const next = getNextExpansionLevel(level);
    el.innerHTML = `${lockImg(24)}<span class="lock-label">${next?`Lvl ${next}`:'Max'}</span>`;
    el.onclick = () => { if (next && level >= next) pycmd('farm:expand:2'); else showNotification(`Reach level ${next||'?'} to expand!`); };
    grid.appendChild(el);
  }
}
function getLockedCount(level) { let c=0; for (const e of EXPANSION_LEVELS) { if (level<e.lvl) c+=e.plots; if (c>=6) return 6; } return Math.max(c,3); }
function getNextExpansionLevel(level) { for (const e of EXPANSION_LEVELS) { if (level<e.lvl) return e.lvl; } return null; }

function renderBuildings() {
  const area = document.getElementById('buildings-area'); area.innerHTML = '';
  Object.keys(farmData.buildings||{}).forEach(bid => {
    const name = bid.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const el = document.createElement('div'); el.className = 'building-tile';
    el.onclick = () => pycmd(`farm:building_detail:${bid}`);
    const queue = (farmData.production_queues||{})[bid]||[], ready = queue.filter(q=>q.ready).length;
    el.innerHTML = `${buildingImg(bid,110)}<span class="building-name">${name}</span>${ready>0?`<span class="building-badge">${ready}</span>`:''}`;
    area.appendChild(el);
  });
}

function renderAnimals() {
  const area = document.getElementById('animals-area'); area.innerHTML = '';
  Object.entries(farmData.animals||{}).forEach(([aid,info]) => {
    const count = info.count||1, el = document.createElement('div');
    el.className = 'animal-tile'; el.style.animationDelay = `${Math.random()*2}s`;
    const lbl = S(`hayday_${aid}-lbl`);
    if (lbl) el.innerHTML = `<img src="${lbl}" class="animal-lbl" width="50" height="50"><span class="animal-count">x${count}</span>`;
    else el.innerHTML = `${animalImg(aid,50)}<span class="animal-count">x${count}</span>`;
    area.appendChild(el);
  });
}

function updateSections() {
  document.getElementById('farm-buildings').style.display = Object.keys(farmData.buildings||{}).length ? '' : 'none';
  document.getElementById('farm-animals').style.display = Object.keys(farmData.animals||{}).length ? '' : 'none';
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
    el.style.left = `${(box.x||1)*10}%`; el.style.top = `${(box.y||1)*12}%`;
    const idx = box.size==='large'?2:box.size==='medium'?1:0;
    const src = S(`ui_chest_${idx}_closed`);
    if (src) el.innerHTML = `<img src="${src}" width="36" height="36">`; else el.textContent = '\u{1F381}';
    el.onclick = () => showMysteryBox(i); layer.appendChild(el);
  });
}

// --- Decoration Rendering ---
const DECO_EMOJI = {
  fence:'\u{1FAB5}',flower_pot:'\u{1FAB4}',bench:'\u{1FA91}',scarecrow:'\u{1F383}',
  hay_bale:'\u{1F33E}',mailbox:'\u{1F4EA}',lamp_post:'\u{1F4A1}',garden_gnome:'\u{1F9D4}',
  bird_bath:'\u{1F426}',tree_oak:'\u{1F333}',tree_pine:'\u{1F332}',picnic_table:'\u{1F3D5}\u{FE0F}',
  pond:'\u{1F4A7}',swing:'\u{1F3A0}',fountain:'\u26F2',statue_chicken:'\u{1F414}',
  tree_cherry:'\u{1F338}',arch_flowers:'\u{1F490}',statue_cow:'\u{1F404}',windmill_deco:'\u{1F3E1}'
};
function renderDecorations() {
  const layer = document.getElementById('decorations-layer'); layer.innerHTML = '';
  (farmData.decorations||[]).forEach(d => {
    const el = document.createElement('div'); el.className = 'decoration-item';
    const src = S(`hayday_scarecrow`);
    if (d.type === 'scarecrow' && src) el.innerHTML = `<img src="${src}" width="28" height="28">`;
    else el.textContent = DECO_EMOJI[d.type] || '\u{1F3E1}';
    el.style.left = `${(d.x||1)*10+2}%`; el.style.top = `${(d.y||1)*10+5}%`;
    el.style.animationDelay = `${Math.random()*2}s`;
    layer.appendChild(el);
  });
}

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
  document.getElementById('barn-status').textContent = `Grange: ${farmData.barn_used||0}/${farmData.barn_capacity||50}`;
  document.getElementById('silo-status').textContent = `Silo: ${farmData.silo_used||0}/${farmData.silo_capacity||50}`;
  Object.entries(inv).forEach(([id,qty]) => {
    if (qty<=0) return; const it = cat[id]||{};
    const el = document.createElement('div'); el.className = 'item-cell';
    el.onclick = () => { if((it.sell_price||0)>0) sellItem(id); };
    let icon = ''; const lbl = S(`hayday_${id}-lbl`);
    if (lbl) icon = `<img src="${lbl}" width="36" height="36">`;
    else { const p = cropPortrait(id,30); icon = p || `<span class="item-emoji">${it.emoji||'\u{2753}'}</span>`; }
    el.innerHTML = `${icon}<span class="item-name">${it.name||id}</span><span class="item-qty">x${qty}</span>${(it.sell_price||0)>0?`<span class="item-price">\u{1FA99} ${it.sell_price}</span>`:''}`;
    grid.appendChild(el);
  });
  if (!Object.keys(inv).length) grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:20px;color:#999;font-size:12px">${LANG.review_to_earn}</div>`;
}

function renderBuildingsPanel() {
  const list = document.getElementById('buildings-list'); list.innerHTML = '';
  (farmData.unlocked_buildings||[]).forEach(bid => {
    const name = bid.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const owned = bid in (farmData.buildings||{}), queue = (farmData.production_queues||{})[bid]||[];
    const card = document.createElement('div'); card.className = 'building-card';
    let qHTML = '';
    if (owned) { qHTML = '<div class="building-queue">'; queue.forEach(q => { qHTML += `<div class="queue-slot ${q.ready?'ready':''}">${q.emoji||'?'}</div>`; }); for(let i=queue.length;i<3;i++) qHTML+='<div class="queue-slot">+</div>'; qHTML+='</div>'; }
    card.innerHTML = `<div class="building-card-icon">${buildingImg(bid,52)}</div><div class="building-card-info"><h3>${name}</h3><p>${owned?LANG.tap_produce:LANG.not_built}</p>${qHTML}</div>`;
    card.onclick = () => owned ? pycmd(`farm:building_detail:${bid}`) : pycmd(`farm:buy_building:${bid}`);
    list.appendChild(card);
  });
}

function renderOrders() {
  const list = document.getElementById('orders-list'); list.innerHTML = '';
  const orders = farmData.active_orders||[];
  if (!orders.length) { list.innerHTML = `<div style="text-align:center;padding:20px;color:#999">${LANG.no_orders}</div>`; return; }
  orders.forEach((order,i) => {
    const card = document.createElement('div'); card.className = 'order-card';
    const inv = farmData.inventory||{}; let canDo=true, items='';
    Object.entries(order.items_needed||{}).forEach(([id,qty]) => { const have=inv[id]||0; if(have<qty) canDo=false; const it=(farmData.item_catalog||{})[id]||{}; items+=`<div class="order-item ${have>=qty?'fulfilled':''}">${cropPortrait(id,16)||''} ${it.name||id} ${have}/${qty}</div>`; });
    card.innerHTML = `<div class="order-header"><span class="order-type">${order.type==='boat'?'\u26F5':'\u{1F69A}'}</span><span class="order-reward">\u{1FA99} ${order.coin_reward} +${order.xp_reward}XP</span></div><div class="order-items">${items}</div><button class="order-fulfill-btn" ${canDo?'':'disabled'} onclick="fulfillOrder(${i})">${canDo?LANG.deliver:LANG.missing_items}</button>`;
    list.appendChild(card);
  });
}

function renderShop() {
  const grid = document.getElementById('shop-grid'); grid.innerHTML = '';
  document.querySelectorAll('.shop-tab').forEach(b=>b.classList.toggle('active',b.textContent.toLowerCase().includes(currentShopCategory.substring(0,4))));
  if(currentShopCategory==='decorations')renderShopDeco(grid);else if(currentShopCategory==='animals')renderShopAnimals(grid);
  else if(currentShopCategory==='upgrades')renderShopUpgrades(grid);else if(currentShopCategory==='land')renderShopLand(grid);
}
function showShopCategory(cat){currentShopCategory=cat;renderShop()}
function renderShopDeco(grid){[{id:'fence',n:'Cloture',c:10},{id:'flower_pot',n:'Pot de fleurs',c:25},{id:'bench',n:'Banc',c:50},{id:'scarecrow',n:'Epouvantail',c:75},{id:'hay_bale',n:'Botte de foin',c:15},{id:'tree_oak',n:'Chene',c:100},{id:'pond',n:'Mare',c:150},{id:'fountain',n:'Fontaine',c:200},{id:'windmill_deco',n:'Moulin',c:500}].forEach(d=>{const ok=(farmData.coins||0)>=d.c;const el=document.createElement('div');el.className='item-cell';el.style.opacity=ok?'1':'.45';el.onclick=()=>{if(ok){pycmd(`farm:buy_deco:${d.id}`);SoundMgr.play('click')}};el.innerHTML=`<span class="item-emoji">${DECO_EMOJI[d.id]||''}</span><span class="item-name">${d.n}</span><span class="item-price">\u{1FA99} ${d.c}</span>`;grid.appendChild(el)})}
function renderShopAnimals(grid){[{id:'cow',n:'Vache',c:100,l:10},{id:'chicken',n:'Poule',c:50,l:20},{id:'pig',n:'Cochon',c:200,l:30},{id:'sheep',n:'Mouton',c:500,l:60}].forEach(a=>{const unlocked=(farmData.unlocked_animals||[]).includes(a.id);const ok=unlocked&&(farmData.coins||0)>=a.c;const el=document.createElement('div');el.className='item-cell';el.style.opacity=ok?'1':'.45';el.onclick=()=>{if(ok){pycmd(`farm:buy_animal:${a.id}`);SoundMgr.play('click')}};el.innerHTML=`${animalLbl(a.id,36)||animalImg(a.id,36)}<span class="item-name">${a.n}</span><span class="item-price">${unlocked?`\u{1FA99} ${a.c}`:`Lvl ${a.l}`}</span>`;grid.appendChild(el)})}
function renderShopUpgrades(grid){const d=farmData;[{id:'barn',n:'Grange',desc:`Nv${d.barn_level||1}\u2192${(d.barn_level||1)+1}`,info:`${d.barn_capacity||50}\u2192${(d.barn_capacity||50)+25}`},{id:'silo',n:'Silo',desc:`Nv${d.silo_level||1}\u2192${(d.silo_level||1)+1}`,info:`${d.silo_capacity||50}\u2192${(d.silo_capacity||50)+25}`}].forEach(u=>{const el=document.createElement('div');el.className='item-cell';el.style.minHeight='80px';el.onclick=()=>{pycmd(`farm:upgrade:${u.id}`);SoundMgr.play('click')};el.innerHTML=`${buildingImg(u.id,44)}<span class="item-name">${u.n}</span><span class="item-price">${u.desc}</span><span class="item-price" style="font-size:8px">${u.info}</span>`;grid.appendChild(el)})}
function renderShopLand(grid){const np=farmData.num_plots||6,cost=50*np,deeds=(farmData.inventory||{}).land_deed||0,permits=(farmData.inventory||{}).expansion_permit||0;const el=document.createElement('div');el.className='item-cell';el.style.minHeight='90px';el.style.gridColumn='1/-1';const ok=(farmData.coins||0)>=cost&&deeds>=1&&permits>=1;el.style.opacity=ok?'1':'.5';el.onclick=()=>{if(ok){pycmd('farm:expand:2');SoundMgr.play('click')}else showNotification(`${cost} pièces + Titre + Permis requis`)};el.innerHTML=`${lockImg(32)}<span class="item-name">${LANG.expand_farm} (+2)</span><span class="item-price">\u{1FA99} ${cost} + \u{1F4DC}x1 + \u{1F3D7}\u{FE0F}x1</span><span class="item-price" style="font-size:8px">${LANG.current}: ${np} | ${LANG.deeds}: ${deeds} | ${LANG.permits}: ${permits}</span>`;grid.appendChild(el)}

function renderSettings() {
  const stats = document.getElementById('farm-stats');
  if (stats && farmData) {
    const d = farmData;
    stats.innerHTML = `Niveau ${d.level||1} \u2022 ${formatNum(d.total_reviews||0)} revisions \u2022 ${formatNum(d.lifetime_reviews||0)} total \u2022 Meilleure serie : ${d.best_streak||0} jours \u2022 Commandes : ${d.orders_completed||0}`;
  }
}

function renderAchievements(){pycmd('farm:get_achievements')}
function updateAchievements(achs){const list=document.getElementById('achievements-list');list.innerHTML='';(achs||[]).forEach(a=>{const card=document.createElement('div');card.className=`achievement-card ${a.unlocked?'unlocked':'locked'}`;const pct=Math.min(100,a.progress_pct||0);card.innerHTML=`<span class="achievement-icon">${a.icon||'\u{1F3C6}'}</span><div class="achievement-info"><h4>${a.name} <span class="achievement-tier tier-${a.tier}">${a.tier}</span></h4><p>${a.description}</p>${!a.unlocked?`<div class="achievement-progress"><div class="achievement-progress-fill" style="width:${pct}%"></div></div><p style="font-size:8px;color:#aaa;margin-top:2px">${a.current}/${a.target}</p>`:`<p style="font-size:8px;color:#4caf50">${LANG.done}</p>`}</div>${a.gems>0?`<span class="achievement-gem-reward">\u{1F48E} ${a.gems}</span>`:''}`;list.appendChild(card)})}

function showPlantDialog(plotId){SoundMgr.play('click');plantingPlotId=plotId;const choices=document.getElementById('crop-choices');choices.innerHTML='';(farmData.unlocked_crops||[]).forEach(id=>{const name=id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());const el=document.createElement('div');el.className='crop-choice';el.onclick=()=>{pycmd(`farm:plant:${plotId}:${id}`);hideOverlay();SoundMgr.play('click')};el.innerHTML=`<div class="crop-choice-icon">${cropPortrait(id,36)||`<span style="font-size:28px">${CROP_EMOJI[id]||'\u{1F331}'}</span>`}</div><div class="crop-choice-info"><strong>${name}</strong><span>Révisez pour faire pousser</span></div>`;choices.appendChild(el)});document.getElementById('plant-overlay').classList.remove('hidden')}

function harvestPlot(id){SoundMgr.play('click');pycmd(`farm:harvest:${id}`)}
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
  document.getElementById('sell-item-name').textContent = `${cat.emoji||''} ${name}`;
  document.getElementById('sell-item-stock').textContent = `Stock: ${qty}`;
  document.getElementById('sell-unit-price').textContent = `${price} /u`;
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
    btn.innerHTML = `<span>${label}</span><span class="sell-total">\u{1FA99} ${total}</span>`;
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
      document.getElementById('wheel-result').textContent=`Gagne : ${r.name} !`;
      document.getElementById('wheel-result').classList.remove('hidden');
      document.getElementById('wheel-spin-btn').disabled=true;
      SoundMgr.play('levelup');
      if (r.prize && (r.prize.gems >= 3 || r.prize.coins >= 100)) createConfetti();
    }
  })(performance.now());
}
function drawWheel(rot){rot=rot||0;const c=document.getElementById('wheel-canvas'),ctx=c.getContext('2d'),cx=140,cy=140,r=130;const segs=[{l:'25\u{1FA99}',c:'#f44336'},{l:'50\u{1FA99}',c:'#e91e63'},{l:'100\u{1FA99}',c:'#9c27b0'},{l:'1\u{1F48E}',c:'#673ab7'},{l:'3\u{1F48E}',c:'#3f51b5'},{l:'5\u{1F48E}',c:'#2196f3'},{l:'3\u{1F529}',c:'#009688'},{l:'3\u{1FAB5}',c:'#4caf50'},{l:'\u{1F4DC}',c:'#ff9800'}];ctx.clearRect(0,0,280,280);const sa=2*Math.PI/segs.length;segs.forEach((s,i)=>{const a=rot+i*sa;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,a+sa);ctx.closePath();ctx.fillStyle=s.c;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(a+sa/2);ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(s.l,r*.65,4);ctx.restore()});ctx.beginPath();ctx.arc(cx,cy,16,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill()}

function showMysteryBox(i){SoundMgr.play('click');currentBoxIndex=i;document.getElementById('mystery-box-overlay').classList.remove('hidden');document.getElementById('mystery-box-result').classList.add('hidden');document.getElementById('open-box-btn').disabled=false;const icon=document.getElementById('box-icon');icon.className='box-icon';const box=(farmData.mystery_boxes||[])[i]||{};const idx=box.size==='large'?2:box.size==='medium'?1:0;const src=S(`ui_chest_${idx}_closed`);if(src)icon.innerHTML=`<img src="${src}" width="64" height="64" style="image-rendering:pixelated">`;else icon.textContent='\u{1F4E6}'}
function doOpenBox(){if(currentBoxIndex===null)return;SoundMgr.play('click');document.getElementById('box-icon').classList.add('shaking');document.getElementById('open-box-btn').disabled=true;pycmd(`farm:open_box:${currentBoxIndex}`)}
function showBoxResult(r){const icon=document.getElementById('box-icon');icon.classList.remove('shaking');icon.classList.add('opened');setTimeout(()=>{let t='Trouve : ';const rw=r.reward||{};if(rw.coins)t+=`${rw.coins} pieces !`;else if(rw.gems)t+=`${rw.gems} gemmes !`;else if(rw.item){const cat=(farmData.item_catalog||{})[rw.item]||{};t+=`${rw.qty||1}x ${cat.name||rw.item} !`;};document.getElementById('mystery-box-result').textContent=t;document.getElementById('mystery-box-result').classList.remove('hidden');currentBoxIndex=null;SoundMgr.play('levelup');if((rw.gems||0)>=5||(rw.coins||0)>=200)createConfetti()},600)}

function showLevelUp(d){
  SoundMgr.play('levelup');
  document.getElementById('levelup-level').textContent=d.new_level;
  let rw='';if(d.gem_reward>0)rw=`\u{1F48E} +${d.gem_reward} gems`;
  document.getElementById('levelup-rewards').innerHTML=rw;
  let ul='';(d.unlocks||[]).forEach(u=>{ul+=`<span class="unlock-tag">${u.emoji||''} ${u.name}</span>`});
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
  if(reward.coins)rw+=`<span class="login-reward-item">\u{1FA99} +${reward.coins}</span>`;
  if(reward.gems)rw+=`<span class="login-reward-item">\u{1F48E} +${reward.gems}</span>`;
  document.getElementById('login-reward-detail').innerHTML=rw;
  el.classList.remove('hidden');
}
function hideLoginBonus(){document.getElementById('login-bonus-overlay').classList.add('hidden')}

function showSessionSummary(d){SoundMgr.play('click');document.getElementById('session-stats').innerHTML=`<div class="session-stat"><div class="session-stat-value">${d.reviews||0}</div><div class="session-stat-label">${LANG.cards}</div></div><div class="session-stat"><div class="session-stat-value">${formatNum(d.coins_earned||0)}</div><div class="session-stat-label">${LANG.coins_earned}</div></div><div class="session-stat"><div class="session-stat-value">${formatNum(d.xp_earned||0)}</div><div class="session-stat-label">${LANG.xp_earned}</div></div><div class="session-stat"><div class="session-stat-value">\u{1F525}${d.streak||0}</div><div class="session-stat-label">${LANG.streak_label}</div></div>`;let items='';Object.entries(d.items_earned||{}).forEach(([id,qty])=>{items+=`<span class="session-item-tag">${id} x${qty}</span>`});document.getElementById('session-items').innerHTML=items;document.getElementById('session-overlay').classList.remove('hidden')}

function hideOverlay(){document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));wheelSpinning=false}
function showNotification(msg,type){if(!notificationsEnabled&&type!=='reward')return;const area=document.getElementById('notification-area');const el=document.createElement('div');el.className='notification';if(type==='reward')el.style.color='#ffd700';el.textContent=msg;area.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},3000)}
function showFloatingReward(text,x,y){const layer=document.getElementById('reward-layer');const el=document.createElement('div');el.className='floating-reward';el.textContent=text;el.style.left=(x||window.innerWidth/2)+'px';el.style.top=(y||window.innerHeight/2)+'px';layer.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},1200)}
function showCoinBurst(x,y,n){const layer=document.getElementById('reward-layer');for(let i=0;i<(n||5);i++){const el=document.createElement('div');el.className='coin-particle';el.textContent='\u{1FA99}';el.style.left=(x||window.innerWidth/2)+'px';el.style.top=(y||window.innerHeight/2)+'px';el.style.setProperty('--dx',((Math.random()-.5)*80)+'px');el.style.setProperty('--dy',(-(Math.random()*60+20))+'px');el.style.animationDelay=(i*50)+'ms';layer.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},1000)}}
function showReward(d){SoundMgr.play('click');if(d.coins){showFloatingReward(`+${d.coins}`,window.innerWidth/2,window.innerHeight/2-20);showCoinBurst(window.innerWidth/2,window.innerHeight/2)}if(d.xp)showFloatingReward(`+${d.xp} XP`,window.innerWidth/2+40,window.innerHeight/2);if(d.items)Object.entries(d.items).forEach(([id,qty])=>{const c=(farmData.item_catalog||{})[id]||{};showNotification(`+${qty} ${c.name||id}`,'reward')});if(d.mystery_box){const sz={small:'petite',medium:'moyenne',large:'grande'}[d.mystery_box.size]||d.mystery_box.size;showNotification(`Une ${sz} boite mystere est apparue !`,'reward')}}

function showBuildingDetail(bid){pycmd(`farm:building_detail:${bid}`)}
function updateBuildingDetail(data){if(data&&data.recipes)showProductionDialog(data);else if(currentPanel==='buildings')renderBuildingsPanel()}
function showProductionDialog(data){
  document.getElementById('production-title').textContent=`\u{1F3ED} ${data.building_name||'Production'}`;
  const list=document.getElementById('production-recipes');list.innerHTML='';
  const queue=data.queue||[];
  if(queue.length>0){const qd=document.createElement('div');qd.innerHTML=`<h3>${LANG.in_progress}</h3>`;queue.forEach(q=>{const pct=Math.min(100,((q.sessions_waited||0)/Math.max(1,q.sessions_required||1))*100);const s=document.createElement('div');s.className=`production-queue-item ${q.ready?'ready':''}`;s.innerHTML=`<span class="pq-emoji">${q.emoji||'?'}</span><div class="pq-info"><strong>${q.name}</strong><span>${q.ready?'Ready!':q.sessions_waited+'/'+q.sessions_required+' sessions'}</span></div>${!q.ready?`<div class="pq-bar"><div class="pq-bar-fill" style="width:${pct}%"></div></div>`:'<span class="pq-ready-badge">\u2713</span>'}`;qd.appendChild(s)});if(queue.some(q=>q.ready)){const btn=document.createElement('button');btn.className='action-btn';btn.textContent=LANG.collect_all;btn.style.marginTop='6px';btn.onclick=()=>{pycmd(`farm:collect:${data.building_id}`);hideOverlay();SoundMgr.play('click')};qd.appendChild(btn)}list.appendChild(qd)}
  const rd=document.createElement('div');rd.innerHTML=`<h3>${LANG.recipes}</h3>`;
  (data.recipes||[]).forEach(r=>{const c=document.createElement('div');c.className=`recipe-card ${r.can_craft?'':'disabled'}`;let ing='';Object.entries(r.ingredients||{}).forEach(([id,qty])=>{const have=(farmData.inventory||{})[id]||0;const n=id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());ing+=`<span class="recipe-ingredient ${have>=qty?'has':'need'}">${cropPortrait(id,14)||''} ${n} ${have}/${qty}</span>`});c.innerHTML=`<div class="recipe-header"><span class="recipe-emoji">${r.emoji||'?'}</span><div class="recipe-info"><strong>${r.name}</strong><span class="recipe-time">${r.sessions_required} session${r.sessions_required>1?'s':''} | +${r.xp} XP</span></div></div><div class="recipe-ingredients">${ing}</div>`;if(r.can_craft)c.onclick=()=>{pycmd(`farm:start_production:${data.building_id}:${r.id}`);hideOverlay();SoundMgr.play('click')};rd.appendChild(c)});
  list.appendChild(rd);document.getElementById('production-overlay').classList.remove('hidden');
}

function formatNum(n){return n>=1000?(n/1000).toFixed(1)+'k':String(n)}
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
