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
const GROWTH_LABEL = ['Seed','Sprout','Growing','Bloom','Ready!'];
const EXPANSION_LEVELS = [
  {lvl:3,plots:2},{lvl:5,plots:2},{lvl:10,plots:2},{lvl:15,plots:2},{lvl:20,plots:2},
  {lvl:25,plots:2},{lvl:30,plots:2},{lvl:35,plots:2},{lvl:40,plots:2},{lvl:50,plots:2},
  {lvl:60,plots:1},{lvl:70,plots:1},{lvl:80,plots:1},{lvl:90,plots:1},{lvl:100,plots:1}
];

let _firstUpdate = true;
function updateFarm(data) {
  farmData = data;
  updateHUD(); renderPlots(); renderBuildings(); renderAnimals(); renderMysteryBoxes(); updateSections(); checkStorageWarnings();
  if (_firstUpdate) { _firstUpdate = false; checkTutorial(); }
  if (currentPanel) {
    if (currentPanel === 'inventory') renderInventory();
    if (currentPanel === 'buildings') renderBuildingsPanel();
    if (currentPanel === 'orders') renderOrders();
    if (currentPanel === 'shop') renderShop();
    if (currentPanel === 'achievements') renderAchievements();
    if (currentPanel === 'stats') renderStats();
  }
}

let _lastStorageWarning = 0;
function checkStorageWarnings() {
  const now = Date.now();
  if (now - _lastStorageWarning < 30000) return; // Max once per 30s
  const d = farmData;
  const barnPct = (d.barn_used||0) / Math.max(1, d.barn_capacity||50);
  const siloPct = (d.silo_used||0) / Math.max(1, d.silo_capacity||50);
  if (barnPct >= 1) { showNotification('\u{1F6A8} Barn is FULL! Upgrade or sell items.'); _lastStorageWarning = now; }
  else if (barnPct >= 0.9) { showNotification('\u{26A0}\u{FE0F} Barn is almost full! (' + d.barn_used + '/' + d.barn_capacity + ')'); _lastStorageWarning = now; }
  if (siloPct >= 1) { showNotification('\u{1F6A8} Silo is FULL! Upgrade or sell items.'); _lastStorageWarning = now; }
  else if (siloPct >= 0.9) { showNotification('\u{26A0}\u{FE0F} Silo is almost full! (' + d.silo_used + '/' + d.silo_capacity + ')'); _lastStorageWarning = now; }
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
      el.innerHTML += `<div class="plot-crop">${cropImg(plot.crop, 4, 40)}</div><span class="plot-label">Harvest!</span>`;
      el.onclick = () => harvestPlot(plot.id);
    } else if (plot.state === 'wilted') {
      el.innerHTML += `<div class="plot-crop" style="opacity:.4;filter:grayscale(.8)">${cropImg(plot.crop, 0, 32)}</div><span class="plot-label">Wilted</span>`;
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
  // Orders badge: count how many orders can be fulfilled
  let fulfillable = 0;
  (d.active_orders||[]).forEach(order => {
    let canDo = true;
    Object.entries(order.items_needed||{}).forEach(([id,qty]) => { if ((inv[id]||0) < qty) canDo = false; });
    if (canDo) fulfillable++;
  });
  setBadge('tab-orders', fulfillable);

  // Buildings badge: count ready productions
  let readyCount = 0;
  Object.values(d.production_queues||{}).forEach(queue => { queue.forEach(q => { if (q.ready) readyCount++; }); });
  setBadge('tab-buildings', readyCount);

  // Mystery boxes badge
  setBadge('tab-farm', (d.mystery_boxes||[]).length);

  // Wheel badge
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

function showTab(tab) {
  if (tab === currentPanel) { hidePanel(); return; }
  if (tab === 'farm') { hidePanel(); pycmd('farm:get_state'); return; }
  currentPanel = tab;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById(`tab-${tab}`)?.classList.add('active');
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
  const panel = document.getElementById(`panel-${tab}`);
  if (panel) { panel.classList.remove('hidden');
    if(tab==='inventory')renderInventory();if(tab==='buildings')renderBuildingsPanel();
    if(tab==='orders')renderOrders();if(tab==='shop')renderShop();if(tab==='achievements')renderAchievements();
    if(tab==='stats')renderStats();
  }
}
function hidePanel() { currentPanel=null; document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden')); document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active')); document.getElementById('tab-farm')?.classList.add('active'); }

function renderInventory() {
  const grid = document.getElementById('inventory-grid'); grid.innerHTML = '';
  const inv = farmData.inventory||{}, cat = farmData.item_catalog||{};
  document.getElementById('barn-status').textContent = `Barn: ${farmData.barn_used||0}/${farmData.barn_capacity||50}`;
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
  if (!Object.keys(inv).length) grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#999;font-size:12px">Review cards to earn items!</div>';
}

function renderBuildingsPanel() {
  const list = document.getElementById('buildings-list'); list.innerHTML = '';
  (farmData.unlocked_buildings||[]).forEach(bid => {
    const name = bid.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const owned = bid in (farmData.buildings||{}), queue = (farmData.production_queues||{})[bid]||[];
    const card = document.createElement('div'); card.className = 'building-card';
    let qHTML = '';
    if (owned) { qHTML = '<div class="building-queue">'; queue.forEach(q => { qHTML += `<div class="queue-slot ${q.ready?'ready':''}">${q.emoji||'?'}</div>`; }); for(let i=queue.length;i<3;i++) qHTML+='<div class="queue-slot">+</div>'; qHTML+='</div>'; }
    card.innerHTML = `<div class="building-card-icon">${buildingImg(bid,52)}</div><div class="building-card-info"><h3>${name}</h3><p>${owned?'Tap to produce':'Not built'}</p>${qHTML}</div>`;
    card.onclick = () => owned ? pycmd(`farm:building_detail:${bid}`) : pycmd(`farm:buy_building:${bid}`);
    list.appendChild(card);
  });
}

function renderOrders() {
  const list = document.getElementById('orders-list'); list.innerHTML = '';
  const orders = farmData.active_orders||[];
  if (!orders.length) { list.innerHTML = '<div style="text-align:center;padding:20px;color:#999">No orders yet.</div>'; return; }
  orders.forEach((order,i) => {
    const card = document.createElement('div'); card.className = 'order-card';
    const inv = farmData.inventory||{}; let canDo=true, items='';
    Object.entries(order.items_needed||{}).forEach(([id,qty]) => { const have=inv[id]||0; if(have<qty) canDo=false; const it=(farmData.item_catalog||{})[id]||{}; items+=`<div class="order-item ${have>=qty?'fulfilled':''}">${cropPortrait(id,16)||''} ${it.name||id} ${have}/${qty}</div>`; });
    card.innerHTML = `<div class="order-header"><span class="order-type">${order.type==='boat'?'\u26F5':'\u{1F69A}'}</span><span class="order-reward">\u{1FA99} ${order.coin_reward} +${order.xp_reward}XP</span></div><div class="order-items">${items}</div><button class="order-fulfill-btn" ${canDo?'':'disabled'} onclick="fulfillOrder(${i})">${canDo?'Deliver!':'Missing items'}</button>`;
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
function renderShopDeco(grid){[{id:'fence',n:'Fence',c:10},{id:'flower_pot',n:'Flower Pot',c:25},{id:'bench',n:'Bench',c:50},{id:'scarecrow',n:'Scarecrow',c:75},{id:'hay_bale',n:'Hay Bale',c:15},{id:'tree_oak',n:'Oak',c:100},{id:'pond',n:'Pond',c:150},{id:'fountain',n:'Fountain',c:200},{id:'windmill_deco',n:'Windmill',c:500}].forEach(d=>{const ok=(farmData.coins||0)>=d.c;const el=document.createElement('div');el.className='item-cell';el.style.opacity=ok?'1':'.45';el.onclick=()=>{if(ok)pycmd(`farm:buy_deco:${d.id}`)};el.innerHTML=`<span class="item-name">${d.n}</span><span class="item-price">\u{1FA99} ${d.c}</span>`;grid.appendChild(el)})}
function renderShopAnimals(grid){[{id:'cow',n:'Cow',c:100,l:10},{id:'chicken',n:'Chicken',c:50,l:20},{id:'pig',n:'Pig',c:200,l:30},{id:'sheep',n:'Sheep',c:500,l:60}].forEach(a=>{const unlocked=(farmData.unlocked_animals||[]).includes(a.id);const ok=unlocked&&(farmData.coins||0)>=a.c;const el=document.createElement('div');el.className='item-cell';el.style.opacity=ok?'1':'.45';el.onclick=()=>{if(ok)pycmd(`farm:buy_animal:${a.id}`)};el.innerHTML=`${animalLbl(a.id,36)||animalImg(a.id,36)}<span class="item-name">${a.n}</span><span class="item-price">${unlocked?`\u{1FA99} ${a.c}`:`Lvl ${a.l}`}</span>`;grid.appendChild(el)})}
function renderShopUpgrades(grid){
  const d=farmData, inv=d.inventory||{};
  const upgrades=[
    {id:'barn',n:'Barn',lvl:d.barn_level||1,cap:d.barn_capacity||50,
     cost:{bolt:(d.barn_level||1)+1,plank:(d.barn_level||1)+1,duct_tape:(d.barn_level||1)+1}},
    {id:'silo',n:'Silo',lvl:d.silo_level||1,cap:d.silo_capacity||50,
     cost:{nail:(d.silo_level||1)+1,screw:(d.silo_level||1)+1,paint:(d.silo_level||1)+1}}
  ];
  upgrades.forEach(u=>{
    const el=document.createElement('div');el.className='item-cell';el.style.minHeight='90px';
    let canUpgrade=true, costHTML='';
    Object.entries(u.cost).forEach(([id,qty])=>{
      const have=inv[id]||0;
      const ok=have>=qty;
      if(!ok) canUpgrade=false;
      const name=id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
      costHTML+=`<span style="font-size:9px;padding:1px 4px;border-radius:3px;background:${ok?'rgba(76,175,80,.15)':'rgba(244,67,54,.12)'};color:${ok?'#2e7d32':'#c62828'}">${name} ${have}/${qty}</span> `;
    });
    el.style.opacity=canUpgrade?'1':'.6';
    el.onclick=()=>{if(canUpgrade)pycmd(`farm:upgrade:${u.id}`);else showNotification('Need more materials!')};
    el.innerHTML=`${buildingImg(u.id,44)}<span class="item-name">${u.n} Lv${u.lvl}\u2192${u.lvl+1}</span><span class="item-price">${u.cap}\u2192${u.cap+25} slots</span><div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center;margin-top:3px">${costHTML}</div>`;
    grid.appendChild(el);
  });
}
function renderShopLand(grid){const np=farmData.num_plots||6,cost=50*np,deeds=(farmData.inventory||{}).land_deed||0,permits=(farmData.inventory||{}).expansion_permit||0;const el=document.createElement('div');el.className='item-cell';el.style.minHeight='90px';el.style.gridColumn='1/-1';const ok=(farmData.coins||0)>=cost&&deeds>=1&&permits>=1;el.style.opacity=ok?'1':'.5';el.onclick=()=>{if(ok)pycmd('farm:expand:2');else showNotification(`Need ${cost} coins + Land Deed + Expansion Permit`)};el.innerHTML=`${lockImg(32)}<span class="item-name">Expand Farm (+2 plots)</span><span class="item-price">\u{1FA99} ${cost} + \u{1F4DC}x1 + \u{1F3D7}\u{FE0F}x1</span><span class="item-price" style="font-size:8px">Current: ${np} plots | Deeds: ${deeds} | Permits: ${permits}</span>`;grid.appendChild(el)}

function renderAchievements(){pycmd('farm:get_achievements')}
function updateAchievements(achs){const list=document.getElementById('achievements-list');list.innerHTML='';(achs||[]).forEach(a=>{const card=document.createElement('div');card.className=`achievement-card ${a.unlocked?'unlocked':'locked'}`;const pct=Math.min(100,a.progress_pct||0);card.innerHTML=`<span class="achievement-icon">${a.icon||'\u{1F3C6}'}</span><div class="achievement-info"><h4>${a.name} <span class="achievement-tier tier-${a.tier}">${a.tier}</span></h4><p>${a.description}</p>${!a.unlocked?`<div class="achievement-progress"><div class="achievement-progress-fill" style="width:${pct}%"></div></div><p style="font-size:8px;color:#aaa;margin-top:2px">${a.current}/${a.target}</p>`:'<p style="font-size:8px;color:#4caf50">Done!</p>'}</div>${a.gems>0?`<span class="achievement-gem-reward">\u{1F48E} ${a.gems}</span>`:''}`;list.appendChild(card)})}

function showPlantDialog(plotId){
  plantingPlotId=plotId;
  const choices=document.getElementById('crop-choices');choices.innerHTML='';
  const cat=farmData.item_catalog||{};
  (farmData.unlocked_crops||[]).forEach(id=>{
    const name=id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const it=cat[id]||{};
    const sellPrice=it.sell_price||0;
    const xpReward=it.xp||0;
    const el=document.createElement('div');el.className='crop-choice';
    el.onclick=()=>{pycmd(`farm:plant:${plotId}:${id}`);hideOverlay()};
    el.innerHTML=`<div class="crop-choice-icon">${cropPortrait(id,36)||`<span style="font-size:28px">${CROP_EMOJI[id]||'\u{1F331}'}</span>`}</div><div class="crop-choice-info"><strong>${name}</strong><span>~12 reviews to harvest · Yields 2-4</span><span style="color:var(--gold-d)">\u{1FA99} ${sellPrice}/ea · +${xpReward} XP/ea</span></div>`;
    choices.appendChild(el);
  });
  document.getElementById('plant-overlay').classList.remove('hidden');
}

function harvestPlot(id){pycmd(`farm:harvest:${id}`)}

let _sellItemId = null;
let _sellItemQty = 0;
function sellItem(id){
  _sellItemId = id;
  const inv = farmData.inventory||{};
  const cat = farmData.item_catalog||{};
  const it = cat[id]||{};
  _sellItemQty = inv[id]||0;
  if (_sellItemQty <= 0) return;
  const price = it.sell_price||0;
  const info = document.getElementById('sell-item-info');
  const portrait = cropPortrait(id, 40);
  const lbl = S(`hayday_${id}-lbl`);
  let icon = '';
  if (lbl) icon = `<img src="${lbl}" width="40" height="40">`;
  else if (portrait) icon = portrait;
  else icon = `<span class="sell-icon">${it.emoji||'?'}</span>`;
  info.innerHTML = `${icon}<span class="sell-name">${it.name||id}</span><span class="sell-detail">You have x${_sellItemQty} · ${price} coins each</span>`;
  document.querySelector('.sell-half-btn').style.display = _sellItemQty >= 2 ? '' : 'none';
  document.querySelector('.sell-all-btn').style.display = _sellItemQty >= 2 ? '' : 'none';
  document.getElementById('sell-overlay').classList.remove('hidden');
}
function doSell(qty){pycmd(`farm:sell:${_sellItemId}:${qty}`);hideOverlay()}
function doSellHalf(){doSell(Math.ceil(_sellItemQty/2))}
function doSellAll(){doSell(_sellItemQty)}

function fulfillOrder(i){pycmd(`farm:fulfill_order:${i}`)}

function spinWheel(){if(farmData.can_spin_wheel){document.getElementById('wheel-overlay').classList.remove('hidden');drawWheel()}else showNotification('Come back tomorrow!')}
function doSpinWheel(){if(wheelSpinning)return;wheelSpinning=true;document.getElementById('wheel-spin-btn').disabled=true;document.getElementById('wheel-result').classList.add('hidden');pycmd('farm:spin_wheel')}
function showWheelResult(r){
  wheelSpinning=false;
  const segs=9, segAngle=2*Math.PI/segs;
  // Target angle: pointer is at top (3*PI/2), land on middle of winning segment
  const targetSeg = r.index||0;
  const targetAngle = (2*Math.PI) - (targetSeg * segAngle + segAngle/2);
  // Add several full rotations for drama
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
      document.getElementById('wheel-result').textContent=`You won: ${r.name}!`;
      document.getElementById('wheel-result').classList.remove('hidden');
      document.getElementById('wheel-spin-btn').disabled=true;
    }
  })(performance.now());
}
function drawWheel(rot){rot=rot||0;const c=document.getElementById('wheel-canvas'),ctx=c.getContext('2d'),cx=140,cy=140,r=130;const segs=[{l:'25\u{1FA99}',c:'#f44336'},{l:'50\u{1FA99}',c:'#e91e63'},{l:'100\u{1FA99}',c:'#9c27b0'},{l:'1\u{1F48E}',c:'#673ab7'},{l:'3\u{1F48E}',c:'#3f51b5'},{l:'5\u{1F48E}',c:'#2196f3'},{l:'3\u{1F529}',c:'#009688'},{l:'3\u{1FAB5}',c:'#4caf50'},{l:'\u{1F4DC}',c:'#ff9800'}];ctx.clearRect(0,0,280,280);const sa=2*Math.PI/segs.length;segs.forEach((s,i)=>{const a=rot+i*sa;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,a+sa);ctx.closePath();ctx.fillStyle=s.c;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.save();ctx.translate(cx,cy);ctx.rotate(a+sa/2);ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(s.l,r*.65,4);ctx.restore()});ctx.beginPath();ctx.arc(cx,cy,16,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill()}

function showMysteryBox(i){currentBoxIndex=i;document.getElementById('mystery-box-overlay').classList.remove('hidden');document.getElementById('mystery-box-result').classList.add('hidden');document.getElementById('open-box-btn').disabled=false;const icon=document.getElementById('box-icon');icon.className='box-icon';const box=(farmData.mystery_boxes||[])[i]||{};const idx=box.size==='large'?2:box.size==='medium'?1:0;const src=S(`ui_chest_${idx}_closed`);if(src)icon.innerHTML=`<img src="${src}" width="64" height="64" style="image-rendering:pixelated">`;else icon.textContent='\u{1F4E6}'}
function doOpenBox(){if(currentBoxIndex===null)return;document.getElementById('box-icon').classList.add('shaking');document.getElementById('open-box-btn').disabled=true;pycmd(`farm:open_box:${currentBoxIndex}`)}
function showBoxResult(r){const icon=document.getElementById('box-icon');icon.classList.remove('shaking');icon.classList.add('opened');setTimeout(()=>{let t='You found: ';const rw=r.reward||{};if(rw.coins)t+=`${rw.coins} coins!`;else if(rw.gems)t+=`${rw.gems} gems!`;else if(rw.item)t+=`${rw.qty||1}x ${rw.item}!`;document.getElementById('mystery-box-result').textContent=t;document.getElementById('mystery-box-result').classList.remove('hidden');currentBoxIndex=null},600)}

function showLevelUp(d){document.getElementById('levelup-level').textContent=d.new_level;let rw='';if(d.gem_reward>0)rw=`\u{1F48E} +${d.gem_reward} gems`;document.getElementById('levelup-rewards').innerHTML=rw;let ul='';(d.unlocks||[]).forEach(u=>{ul+=`<span class="unlock-tag">${u.emoji||''} ${u.name}</span>`});document.getElementById('levelup-unlocks').innerHTML=ul;document.getElementById('levelup-overlay').classList.remove('hidden')}
function hideLevelUp(){document.getElementById('levelup-overlay').classList.add('hidden')}

function showDailyLoginBonus(d){
  const day=d.day||1, reward=d.reward||{};
  const el=document.getElementById('login-bonus-overlay');
  document.getElementById('login-day').textContent=day;
  // Build day indicators (7 days)
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

function showSessionSummary(d){
  document.getElementById('session-stats').innerHTML=`<div class="session-stat"><div class="session-stat-value">${d.reviews||0}</div><div class="session-stat-label">Cards Reviewed</div></div><div class="session-stat"><div class="session-stat-value">${formatNum(d.coins_earned||0)}</div><div class="session-stat-label">Coins Earned</div></div><div class="session-stat"><div class="session-stat-value">${formatNum(d.xp_earned||0)}</div><div class="session-stat-label">XP Earned</div></div><div class="session-stat"><div class="session-stat-value">\u{1F525}${d.streak||0}</div><div class="session-stat-label">Day Streak</div></div>`;
  let items='';
  const cat=farmData.item_catalog||{};
  Object.entries(d.items_earned||{}).forEach(([id,qty])=>{
    const it=cat[id]||{};
    const name=it.name||id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
    const emoji=it.emoji||'';
    items+=`<span class="session-item-tag">${emoji} ${name} x${qty}</span>`;
  });
  document.getElementById('session-items').innerHTML=items;
  document.getElementById('session-overlay').classList.remove('hidden');
}

function hideOverlay(){document.querySelectorAll('.overlay').forEach(o=>o.classList.add('hidden'));wheelSpinning=false}
function showNotification(msg,type){const area=document.getElementById('notification-area');const el=document.createElement('div');el.className='notification';if(type==='reward')el.style.color='#ffd700';el.textContent=msg;area.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},3000)}
function showFloatingReward(text,x,y){const layer=document.getElementById('reward-layer');const el=document.createElement('div');el.className='floating-reward';el.textContent=text;el.style.left=(x||window.innerWidth/2)+'px';el.style.top=(y||window.innerHeight/2)+'px';layer.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},1200)}
function showCoinBurst(x,y,n){const layer=document.getElementById('reward-layer');for(let i=0;i<(n||5);i++){const el=document.createElement('div');el.className='coin-particle';el.textContent='\u{1FA99}';el.style.left=(x||window.innerWidth/2)+'px';el.style.top=(y||window.innerHeight/2)+'px';el.style.setProperty('--dx',((Math.random()-.5)*80)+'px');el.style.setProperty('--dy',(-(Math.random()*60+20))+'px');el.style.animationDelay=(i*50)+'ms';layer.appendChild(el);setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el)},1000)}}
function showReward(d){if(d.coins){showFloatingReward(`+${d.coins}`,window.innerWidth/2,window.innerHeight/2-20);showCoinBurst(window.innerWidth/2,window.innerHeight/2)}if(d.xp)showFloatingReward(`+${d.xp} XP`,window.innerWidth/2+40,window.innerHeight/2);if(d.items)Object.entries(d.items).forEach(([id,qty])=>{const c=(farmData.item_catalog||{})[id]||{};showNotification(`+${qty} ${c.name||id}`,'reward')});if(d.mystery_box)showNotification(`A ${d.mystery_box.size} mystery box appeared!`,'reward')}

function showBuildingDetail(bid){pycmd(`farm:building_detail:${bid}`)}
function updateBuildingDetail(data){if(data&&data.recipes)showProductionDialog(data);else if(currentPanel==='buildings')renderBuildingsPanel()}
function showProductionDialog(data){
  document.getElementById('production-title').textContent=`\u{1F3ED} ${data.building_name||'Production'}`;
  const list=document.getElementById('production-recipes');list.innerHTML='';
  const queue=data.queue||[];
  if(queue.length>0){const qd=document.createElement('div');qd.innerHTML='<h3>In Progress</h3>';queue.forEach(q=>{const pct=Math.min(100,((q.sessions_waited||0)/Math.max(1,q.sessions_required||1))*100);const s=document.createElement('div');s.className=`production-queue-item ${q.ready?'ready':''}`;s.innerHTML=`<span class="pq-emoji">${q.emoji||'?'}</span><div class="pq-info"><strong>${q.name}</strong><span>${q.ready?'Ready!':q.sessions_waited+'/'+q.sessions_required+' sessions'}</span></div>${!q.ready?`<div class="pq-bar"><div class="pq-bar-fill" style="width:${pct}%"></div></div>`:'<span class="pq-ready-badge">\u2713</span>'}`;qd.appendChild(s)});if(queue.some(q=>q.ready)){const btn=document.createElement('button');btn.className='action-btn';btn.textContent='Collect All';btn.style.marginTop='6px';btn.onclick=()=>{pycmd(`farm:collect:${data.building_id}`);hideOverlay()};qd.appendChild(btn)}list.appendChild(qd)}
  const rd=document.createElement('div');rd.innerHTML='<h3>Recipes</h3>';
  (data.recipes||[]).forEach(r=>{const c=document.createElement('div');c.className=`recipe-card ${r.can_craft?'':'disabled'}`;let ing='';Object.entries(r.ingredients||{}).forEach(([id,qty])=>{const have=(farmData.inventory||{})[id]||0;const n=id.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());ing+=`<span class="recipe-ingredient ${have>=qty?'has':'need'}">${cropPortrait(id,14)||''} ${n} ${have}/${qty}</span>`});c.innerHTML=`<div class="recipe-header"><span class="recipe-emoji">${r.emoji||'?'}</span><div class="recipe-info"><strong>${r.name}</strong><span class="recipe-time">${r.sessions_required} session${r.sessions_required>1?'s':''} | +${r.xp} XP</span></div></div><div class="recipe-ingredients">${ing}</div>`;if(r.can_craft)c.onclick=()=>{pycmd(`farm:start_production:${data.building_id}:${r.id}`);hideOverlay()};rd.appendChild(c)});
  list.appendChild(rd);document.getElementById('production-overlay').classList.remove('hidden');
}

function formatNum(n){return n>=1000?(n/1000).toFixed(1)+'k':String(n)}

// --- Stats Panel ---
function renderStats() {
  const d = farmData, g = document.getElementById('stats-grid');
  if (!g) return;
  const hours = Math.floor((d.total_time_spent||0)/3600);
  const mins = Math.floor(((d.total_time_spent||0)%3600)/60);
  g.innerHTML = `
    <div class="stats-section-title">Progression</div>
    <div class="stat-card"><span class="stat-icon">\u2B50</span><div class="stat-value">${d.level||1}</div><div class="stat-label">Level</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F525}</span><div class="stat-value">${d.best_streak||0}</div><div class="stat-label">Best Streak</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1FA99}</span><div class="stat-value">${formatNum(d.coins||0)}</div><div class="stat-label">Coins</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F48E}</span><div class="stat-value">${d.gems||0}</div><div class="stat-label">Gems</div></div>
    <div class="stats-section-title">Reviews</div>
    <div class="stat-card"><span class="stat-icon">\u{1F4DA}</span><div class="stat-value">${formatNum(d.lifetime_reviews||0)}</div><div class="stat-label">Total Reviews</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F393}</span><div class="stat-value">${d.total_sessions||0}</div><div class="stat-label">Sessions</div></div>
    <div class="stat-card wide"><span class="stat-icon">\u23F0</span><div class="stat-value">${hours}h ${mins}m</div><div class="stat-label">Time Studied</div></div>
    <div class="stats-section-title">Economy</div>
    <div class="stat-card"><span class="stat-icon">\u{1FA99}</span><div class="stat-value">${formatNum(d.total_coins_earned||0)}</div><div class="stat-label">Coins Earned</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F4B0}</span><div class="stat-value">${formatNum(d.total_coins_spent||0)}</div><div class="stat-label">Coins Spent</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F33E}</span><div class="stat-value">${d.total_harvests||0}</div><div class="stat-label">Harvests</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F69A}</span><div class="stat-value">${d.orders_completed||0}</div><div class="stat-label">Orders Done</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F3ED}</span><div class="stat-value">${d.total_produced||0}</div><div class="stat-label">Goods Made</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F381}</span><div class="stat-value">${d.mystery_boxes_opened||0}</div><div class="stat-label">Boxes Opened</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F3B0}</span><div class="stat-value">${d.wheel_spins||0}</div><div class="stat-label">Wheel Spins</div></div>
    <div class="stat-card"><span class="stat-icon">\u{1F529}</span><div class="stat-value">${d.materials_collected||0}</div><div class="stat-label">Materials</div></div>
  `;
}

// --- Particle System ---
let _particleInterval = null;
function startParticles() {
  if (_particleInterval) return;
  const layer = document.getElementById('particles-layer');
  if (!layer) return;
  _particleInterval = setInterval(() => {
    if (layer.children.length > 15) return; // limit particles
    const types = ['leaf', 'sparkle', 'petal'];
    const type = types[Math.floor(Math.random() * types.length)];
    const el = document.createElement('div');
    el.className = `particle particle-${type}`;
    el.style.left = Math.random() * 100 + '%';
    const dur = 6 + Math.random() * 8;
    el.style.animationDuration = dur + 's';
    el.style.animationDelay = Math.random() * 2 + 's';
    layer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, (dur + 3) * 1000);
  }, 2000);
}

// --- Weather System ---
let _weatherInterval = null;
let _currentWeather = 'clear';
function setWeather(type) {
  _currentWeather = type;
  if (_weatherInterval) { clearInterval(_weatherInterval); _weatherInterval = null; }
  const layer = document.getElementById('particles-layer');
  // Clear existing weather particles
  layer.querySelectorAll('.rain-drop,.snow-flake').forEach(e => e.remove());

  if (type === 'rain') {
    _weatherInterval = setInterval(() => {
      if (layer.querySelectorAll('.rain-drop').length > 40) return;
      const drop = document.createElement('div');
      drop.className = 'rain-drop';
      drop.style.left = Math.random() * 100 + '%';
      drop.style.height = (15 + Math.random() * 20) + 'px';
      drop.style.animation = `rainFall ${0.5 + Math.random() * 0.5}s linear forwards`;
      layer.appendChild(drop);
      setTimeout(() => { if (drop.parentNode) drop.remove(); }, 1200);
    }, 50);
  } else if (type === 'snow') {
    _weatherInterval = setInterval(() => {
      if (layer.querySelectorAll('.snow-flake').length > 30) return;
      const flake = document.createElement('div');
      flake.className = 'snow-flake';
      flake.style.left = Math.random() * 100 + '%';
      flake.style.width = flake.style.height = (3 + Math.random() * 4) + 'px';
      flake.style.animation = `snowFall ${3 + Math.random() * 4}s linear forwards`;
      layer.appendChild(flake);
      setTimeout(() => { if (flake.parentNode) flake.remove(); }, 8000);
    }, 200);
  }
  // Update sky color based on weather
  const sky = document.getElementById('sky-layer');
  if (sky) {
    if (type === 'rain') {
      document.body.style.background = 'linear-gradient(180deg,#6b7b8d 0%,#8a9bab 30%,#a0adb8 50%,#5a8a3a 50%,#4a7a32 60%,#3d6c28 100%)';
      sky.querySelector('.sun-rays').style.opacity = '0';
    } else if (type === 'snow') {
      document.body.style.background = 'linear-gradient(180deg,#8899aa 0%,#b0bfcc 30%,#cdd8e0 50%,#e8eee8 50%,#d0ddd0 60%,#b8ccb8 100%)';
      sky.querySelector('.sun-rays').style.opacity = '0.3';
    } else {
      document.body.style.background = '';
      sky.querySelector('.sun-rays').style.opacity = '';
    }
  }
}

// --- Tutorial ---
function checkTutorial() {
  if (!farmData.lifetime_reviews && !farmData.total_reviews) {
    document.getElementById('tutorial-overlay').classList.remove('hidden');
  }
}
function dismissTutorial() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('tab-farm').classList.add('active');
  drawWheel();
  startParticles();
  // Random weather chance (10% rain, 5% snow, 85% clear)
  const r = Math.random();
  if (r < 0.10) setWeather('rain');
  else if (r < 0.15) setWeather('snow');
  pycmd('farm:get_state');
});
