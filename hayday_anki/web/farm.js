/* =============================================
   HAY DAY FARM — Main JavaScript (Sprite Edition)
   SPRITES object is injected before this script by Python
   ============================================= */

// --- State ---
let farmData = {};
let currentPanel = null;
let currentShopCategory = 'decorations';
let plantingPlotId = null;
let currentBoxIndex = null;
let wheelSpinning = false;

// --- Sprite Helper ---
// SPRITES is defined by Python (base64 atlas). Keys: "crops_wheat_0", "animals_cow", etc.

function sprite(key, size, fallbackEmoji) {
  size = size || 48;
  if (typeof SPRITES !== 'undefined' && SPRITES[key]) {
    return `<img src="${SPRITES[key]}" width="${size}" height="${size}" style="image-rendering:pixelated;" draggable="false">`;
  }
  return `<span style="font-size:${size-8}px">${fallbackEmoji || ''}</span>`;
}

function cropSprite(cropId, stage, size) {
  size = size || 48;
  const key = `crops_${cropId}_${stage}`;
  const fallback = CROP_EMOJI[cropId] || '\u{1F33E}';
  return sprite(key, size, fallback);
}

function cropPortrait(cropId, size) {
  size = size || 32;
  const key = `crops_${cropId}_portrait`;
  const fallback = CROP_EMOJI[cropId] || '\u{1F33E}';
  return sprite(key, size, fallback);
}

function buildingSprite(buildingId, size) {
  size = size || 80;
  const key = `buildings_${buildingId}`;
  const fallback = BUILDING_EMOJI[buildingId] || '\u{1F3ED}';
  return sprite(key, size, fallback);
}

function animalSprite(animalId, size) {
  size = size || 64;
  const key = `animals_${animalId}`;
  const fallback = ANIMAL_EMOJI[animalId] || '\u{1F43E}';
  return sprite(key, size, fallback);
}

function uiSprite(name, size) {
  size = size || 32;
  const key = `ui_${name}`;
  return sprite(key, size, '');
}

// --- Emoji fallbacks ---
const CROP_EMOJI = {
  wheat: '\u{1F33E}', corn: '\u{1F33D}', carrot: '\u{1F955}',
  tomato: '\u{1F345}', potato: '\u{1F954}', sugarcane: '\u{1F33F}',
  soybean: '\u{1FAD8}', strawberry: '\u{1F353}', apple: '\u{1F34E}',
  pumpkin: '\u{1F383}'
};
const GROWTH_LABEL = ['Seed', 'Sprout', 'Growing', 'Flowering', 'Ready!'];

const BUILDING_EMOJI = {
  bakery: '\u{1F3ED}', sugar_mill: '\u{1F3ED}', dairy: '\u{1F95B}',
  bbq: '\u{1F356}', pastry_shop: '\u{1F370}', jam_maker: '\u{1F36F}',
  pizzeria: '\u{1F355}', juice_press: '\u{1F9C3}', pie_oven: '\u{1F967}'
};
const ANIMAL_EMOJI = {
  cow: '\u{1F404}', chicken: '\u{1F414}', pig: '\u{1F416}', sheep: '\u{1F411}'
};

// --- Main Update ---
function updateFarm(data) {
  farmData = data;
  updateHUD();
  renderPlots();
  renderBuildings();
  renderAnimals();
  renderDecorations();
  renderMysteryBoxes();
  if (currentPanel === 'inventory') renderInventory();
  if (currentPanel === 'buildings') renderBuildingsPanel();
  if (currentPanel === 'orders') renderOrders();
  if (currentPanel === 'shop') renderShop();
  if (currentPanel === 'achievements') renderAchievements();
}

// --- HUD ---
function updateHUD() {
  const d = farmData;
  document.getElementById('hud-level').querySelector('.level-num').textContent = d.level || 1;
  document.getElementById('hud-xp-bar').style.width = (d.xp_percent || 0) + '%';
  document.getElementById('hud-xp-text').textContent = `${d.xp_progress || 0} / ${d.xp_needed || 20} XP`;
  document.getElementById('streak-count').textContent = d.streak || 0;

  // Use coin/gem sprites in HUD
  const coinIcon = document.querySelector('#hud-coins .currency-icon');
  const gemIcon = document.querySelector('#hud-gems .currency-icon');
  if (typeof SPRITES !== 'undefined') {
    if (SPRITES.ui_coin) coinIcon.innerHTML = `<img src="${SPRITES.ui_coin}" width="20" height="20" style="image-rendering:pixelated;vertical-align:middle;">`;
    if (SPRITES.ui_gem) gemIcon.innerHTML = `<img src="${SPRITES.ui_gem}" width="20" height="20" style="image-rendering:pixelated;vertical-align:middle;">`;
  }
  document.getElementById('coin-count').textContent = formatNum(d.coins || 0);
  document.getElementById('gem-count').textContent = formatNum(d.gems || 0);
}

// --- Plots ---
function renderPlots() {
  const grid = document.getElementById('plots-grid');
  grid.innerHTML = '';
  (farmData.plots || []).forEach(plot => {
    const el = document.createElement('div');
    el.className = `plot plot-${plot.state}`;
    el.dataset.plotId = plot.id;

    if (plot.state === 'empty') {
      el.innerHTML = '<span class="plot-plus">+</span>';
      el.onclick = () => showPlantDialog(plot.id);
    } else if (plot.state === 'ready') {
      el.innerHTML = `
        <div class="plot-sprite">${cropSprite(plot.crop, 4, 48)}</div>
        <span class="plot-stage-label">Harvest!</span>
      `;
      el.onclick = () => harvestPlot(plot.id);
    } else if (plot.state === 'wilted') {
      el.innerHTML = `
        <div class="plot-sprite" style="opacity:0.5;filter:grayscale(0.8)">${cropSprite(plot.crop, 0, 48)}</div>
        <span class="plot-stage-label">Wilted</span>
      `;
    } else {
      const stage = plot.growth_stage || 0;
      const label = GROWTH_LABEL[Math.min(stage, 4)];
      const totalNeeded = plot.reviews_needed || 1;
      const done = plot.reviews_done || 0;
      const pct = Math.min(100, (done / totalNeeded) * 100);
      el.innerHTML = `
        <div class="plot-sprite">${cropSprite(plot.crop, stage, 48)}</div>
        <span class="plot-stage-label">${label}</span>
        <div class="plot-progress-bar"><div class="plot-progress-fill" style="width:${pct}%"></div></div>
      `;
    }
    grid.appendChild(el);
  });
}

// --- Buildings on Farm ---
function renderBuildings() {
  const area = document.getElementById('buildings-area');
  area.innerHTML = '';
  const owned = farmData.buildings || {};
  Object.keys(owned).forEach(bid => {
    const name = bid.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const el = document.createElement('div');
    el.className = 'building-tile';
    el.onclick = () => showBuildingDetail(bid);
    const queue = (farmData.production_queues || {})[bid] || [];
    const readyCount = queue.filter(q => q.ready).length;
    el.innerHTML = `
      ${buildingSprite(bid, 64)}
      <span class="building-name">${name}</span>
      ${readyCount > 0 ? `<span class="building-badge">${readyCount}</span>` : ''}
    `;
    area.appendChild(el);
  });
}

// --- Animals ---
function renderAnimals() {
  const area = document.getElementById('animals-area');
  area.innerHTML = '';
  const animals = farmData.animals || {};
  Object.entries(animals).forEach(([aid, info]) => {
    const count = info.count || 1;
    const el = document.createElement('div');
    el.className = 'animal-tile';
    el.style.animationDelay = `${Math.random() * 2}s`;
    el.innerHTML = `
      ${animalSprite(aid, 48)}
      <span class="animal-count">x${count}</span>
    `;
    area.appendChild(el);
  });
}

// --- Decorations ---
function renderDecorations() {
  const layer = document.getElementById('decorations-layer');
  layer.innerHTML = '';
  (farmData.decorations || []).forEach(deco => {
    const el = document.createElement('div');
    el.className = 'decoration-item';
    el.style.left = `${(deco.x || 0) * 10}%`;
    el.style.top = `${(deco.y || 0) * 10}%`;
    const catalog = farmData.item_catalog || {};
    const item = catalog[deco.type] || {};
    el.textContent = item.emoji || '\u{1FAB4}';
    layer.appendChild(el);
  });
}

// --- Mystery Boxes ---
function renderMysteryBoxes() {
  const layer = document.getElementById('mystery-boxes-layer');
  layer.innerHTML = '';
  (farmData.mystery_boxes || []).forEach((box, i) => {
    const el = document.createElement('div');
    el.className = 'mystery-box';
    el.style.left = `${(box.x || 1) * 10}%`;
    el.style.top = `${(box.y || 1) * 12}%`;
    // Use chest sprites
    const chestIdx = box.size === 'large' ? 2 : box.size === 'medium' ? 1 : 0;
    const chestKey = `ui_chest_${chestIdx}_closed`;
    if (typeof SPRITES !== 'undefined' && SPRITES[chestKey]) {
      el.innerHTML = `<img src="${SPRITES[chestKey]}" width="40" height="40" style="image-rendering:pixelated;">`;
    } else {
      el.textContent = '\u{1F381}';
    }
    el.onclick = () => showMysteryBox(i);
    layer.appendChild(el);
  });
}

// --- Tab Navigation ---
function showTab(tab) {
  if (tab === currentPanel) { hidePanel(); return; }
  if (tab === 'farm') { hidePanel(); pycmd('farm:get_state'); return; }
  currentPanel = tab;
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  const tabBtn = document.getElementById(`tab-${tab}`);
  if (tabBtn) tabBtn.classList.add('active');
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  const panel = document.getElementById(`panel-${tab}`);
  if (panel) {
    panel.classList.remove('hidden');
    if (tab === 'inventory') renderInventory();
    if (tab === 'buildings') renderBuildingsPanel();
    if (tab === 'orders') renderOrders();
    if (tab === 'shop') renderShop();
    if (tab === 'achievements') renderAchievements();
  }
}

function hidePanel() {
  currentPanel = null;
  document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-farm').classList.add('active');
}

// --- Inventory ---
function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  const inv = farmData.inventory || {};
  const catalog = farmData.item_catalog || {};
  document.getElementById('barn-status').textContent = `Barn: ${farmData.barn_used || 0}/${farmData.barn_capacity || 50}`;
  document.getElementById('silo-status').textContent = `Silo: ${farmData.silo_used || 0}/${farmData.silo_capacity || 50}`;

  Object.entries(inv).forEach(([itemId, qty]) => {
    if (qty <= 0) return;
    const item = catalog[itemId] || {};
    const el = document.createElement('div');
    el.className = 'item-cell';
    el.onclick = () => { if ((item.sell_price || 0) > 0) sellItem(itemId); };

    // Try crop portrait sprite first, then emoji
    let iconHTML = cropPortrait(itemId, 32);
    if (!iconHTML.includes('img')) iconHTML = `<span class="item-emoji">${item.emoji || '\u{2753}'}</span>`;

    el.innerHTML = `
      ${iconHTML}
      <span class="item-name">${item.name || itemId}</span>
      <span class="item-qty">x${qty}</span>
      ${(item.sell_price || 0) > 0 ? `<span class="item-price">${uiSprite('coin',14)} ${item.sell_price}</span>` : ''}
    `;
    grid.appendChild(el);
  });

  if (Object.keys(inv).length === 0) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:#999;font-size:13px;">Review cards to earn items!</div>';
  }
}

// --- Buildings Panel ---
function renderBuildingsPanel() {
  const list = document.getElementById('buildings-list');
  list.innerHTML = '';
  const unlocked = farmData.unlocked_buildings || [];
  const owned = farmData.buildings || {};
  const queues = farmData.production_queues || {};
  unlocked.forEach(bid => {
    const name = bid.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const isOwned = bid in owned;
    const queue = queues[bid] || [];
    const card = document.createElement('div');
    card.className = 'building-card';
    let queueHTML = '';
    if (isOwned) {
      queueHTML = '<div class="building-queue">';
      queue.forEach(q => {
        const readyCls = q.ready ? 'ready' : '';
        const pct = Math.min(100, ((q.sessions_waited || 0) / Math.max(1, q.sessions_required || 1)) * 100);
        queueHTML += `<div class="queue-slot ${readyCls}">${q.emoji || '\u{2753}'}${!q.ready ? `<div class="queue-slot-progress"><div class="queue-slot-progress-fill" style="width:${pct}%"></div></div>` : ''}</div>`;
      });
      for (let i = queue.length; i < 3; i++) queueHTML += '<div class="queue-slot">+</div>';
      queueHTML += '</div>';
    }
    card.innerHTML = `
      <div class="building-card-icon">${buildingSprite(bid, 56)}</div>
      <div class="building-card-info">
        <h3>${name}</h3>
        <p>${isOwned ? 'Tap slot to produce' : 'Not built'}</p>
        ${queueHTML}
      </div>
    `;
    if (isOwned && queue.filter(q => q.ready).length > 0) {
      card.style.cursor = 'pointer';
      card.onclick = () => pycmd(`farm:collect:${bid}`);
    } else if (!isOwned) {
      card.style.cursor = 'pointer';
      card.onclick = () => pycmd(`farm:buy_building:${bid}`);
    }
    list.appendChild(card);
  });
}

// --- Orders ---
function renderOrders() {
  const list = document.getElementById('orders-list');
  list.innerHTML = '';
  const orders = farmData.active_orders || [];
  if (orders.length === 0) { list.innerHTML = '<div style="text-align:center;padding:20px;color:#999;">No orders yet.</div>'; return; }
  orders.forEach((order, i) => {
    const typeEmoji = order.type === 'boat' ? '\u26F5' : '\u{1F69A}';
    const card = document.createElement('div');
    card.className = 'order-card';
    const inv = farmData.inventory || {};
    let canFulfill = true;
    let itemsHTML = '';
    Object.entries(order.items_needed || {}).forEach(([itemId, qty]) => {
      const have = inv[itemId] || 0;
      const fulfilled = have >= qty;
      if (!fulfilled) canFulfill = false;
      const catalog = farmData.item_catalog || {};
      const item = catalog[itemId] || {};
      itemsHTML += `<div class="order-item ${fulfilled ? 'fulfilled' : ''}">${cropPortrait(itemId, 20)} ${item.name || itemId} ${have}/${qty}</div>`;
    });
    card.innerHTML = `
      <div class="order-header">
        <span class="order-type">${typeEmoji}</span>
        <span class="order-reward">${uiSprite('coin',16)} ${order.coin_reward} + ${order.xp_reward} XP</span>
      </div>
      <div class="order-items">${itemsHTML}</div>
      <button class="order-fulfill-btn" ${canFulfill ? '' : 'disabled'} onclick="fulfillOrder(${i})">${canFulfill ? 'Deliver!' : 'Missing items'}</button>
    `;
    list.appendChild(card);
  });
}

// --- Shop ---
function renderShop() {
  const grid = document.getElementById('shop-grid');
  grid.innerHTML = '';
  document.querySelectorAll('.shop-tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.toLowerCase().includes(currentShopCategory));
  });
  if (currentShopCategory === 'decorations') renderShopDecorations(grid);
  else if (currentShopCategory === 'animals') renderShopAnimals(grid);
  else if (currentShopCategory === 'upgrades') renderShopUpgrades(grid);
}

function showShopCategory(cat) {
  currentShopCategory = cat;
  renderShop();
}

function renderShopDecorations(grid) {
  const decos = [
    {id:'fence',name:'Fence',cost:10},{id:'flower_pot',name:'Flower Pot',cost:25},
    {id:'bench',name:'Bench',cost:50},{id:'scarecrow',name:'Scarecrow',cost:75},
    {id:'hay_bale',name:'Hay Bale',cost:15},{id:'mailbox',name:'Mailbox',cost:30},
    {id:'lamp_post',name:'Lamp Post',cost:40},{id:'garden_gnome',name:'Gnome',cost:60},
    {id:'tree_oak',name:'Oak Tree',cost:100},{id:'tree_pine',name:'Pine',cost:90},
    {id:'pond',name:'Pond',cost:150},{id:'fountain',name:'Fountain',cost:200},
    {id:'tree_cherry',name:'Cherry Tree',cost:300},{id:'windmill_deco',name:'Windmill',cost:500},
  ];
  decos.forEach(deco => {
    const canBuy = (farmData.coins || 0) >= deco.cost;
    const el = document.createElement('div');
    el.className = 'item-cell';
    el.style.opacity = canBuy ? '1' : '0.5';
    el.onclick = () => { if (canBuy) pycmd(`farm:buy_deco:${deco.id}`); };
    el.innerHTML = `<span class="item-name">${deco.name}</span><span class="item-price">${uiSprite('coin',14)} ${deco.cost}</span>`;
    grid.appendChild(el);
  });
}

function renderShopAnimals(grid) {
  const animals = [
    {id:'cow',name:'Cow',cost:100,level:10},{id:'chicken',name:'Chicken',cost:50,level:20},
    {id:'pig',name:'Pig',cost:200,level:30},{id:'sheep',name:'Sheep',cost:500,level:60},
  ];
  const unlocked = farmData.unlocked_animals || [];
  animals.forEach(animal => {
    const isUnlocked = unlocked.includes(animal.id);
    const canBuy = isUnlocked && (farmData.coins || 0) >= animal.cost;
    const el = document.createElement('div');
    el.className = 'item-cell';
    el.style.opacity = canBuy ? '1' : '0.5';
    el.onclick = () => { if (canBuy) pycmd(`farm:buy_animal:${animal.id}`); };
    el.innerHTML = `${animalSprite(animal.id, 40)}<span class="item-name">${animal.name}</span><span class="item-price">${isUnlocked ? `${uiSprite('coin',14)} ${animal.cost}` : `Lvl ${animal.level}`}</span>`;
    grid.appendChild(el);
  });
}

function renderShopUpgrades(grid) {
  const d = farmData;
  [{id:'barn',name:'Upgrade Barn',desc:`Lv${d.barn_level||1} \u2192 ${(d.barn_level||1)+1}`,info:`Cap: ${d.barn_capacity||50}\u2192${(d.barn_capacity||50)+25}`},
   {id:'silo',name:'Upgrade Silo',desc:`Lv${d.silo_level||1} \u2192 ${(d.silo_level||1)+1}`,info:`Cap: ${d.silo_capacity||50}\u2192${(d.silo_capacity||50)+25}`}]
  .forEach(upg => {
    const el = document.createElement('div');
    el.className = 'item-cell';
    el.style.minHeight = '90px';
    el.onclick = () => pycmd(`farm:upgrade:${upg.id}`);
    el.innerHTML = `${buildingSprite(upg.id, 48)}<span class="item-name">${upg.name}</span><span class="item-price">${upg.desc}</span><span class="item-price" style="font-size:9px">${upg.info}</span>`;
    grid.appendChild(el);
  });
}

// --- Achievements ---
function renderAchievements() { pycmd('farm:get_achievements'); }

function updateAchievements(achievements) {
  const list = document.getElementById('achievements-list');
  list.innerHTML = '';
  (achievements || []).forEach(ach => {
    const card = document.createElement('div');
    card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
    const tierClass = `tier-${ach.tier}`;
    const pct = Math.min(100, ach.progress_pct || 0);
    card.innerHTML = `
      <span class="achievement-icon">${ach.icon || '\u{1F3C6}'}</span>
      <div class="achievement-info">
        <h4>${ach.name} <span class="achievement-tier ${tierClass}">${ach.tier}</span></h4>
        <p>${ach.description}</p>
        ${!ach.unlocked ? `<div class="achievement-progress"><div class="achievement-progress-fill" style="width:${pct}%"></div></div><p style="font-size:9px;color:#aaa;margin-top:2px">${ach.current}/${ach.target}</p>` : '<p style="font-size:9px;color:#4caf50;">Completed!</p>'}
      </div>
      ${ach.gems > 0 ? `<span class="achievement-gem-reward">${uiSprite('gem',16)} ${ach.gems}</span>` : ''}
    `;
    list.appendChild(card);
  });
}

// --- Plant Dialog ---
function showPlantDialog(plotId) {
  plantingPlotId = plotId;
  const choices = document.getElementById('crop-choices');
  choices.innerHTML = '';
  (farmData.unlocked_crops || []).forEach(cropId => {
    const name = cropId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const el = document.createElement('div');
    el.className = 'crop-choice';
    el.onclick = () => { pycmd(`farm:plant:${plotId}:${cropId}`); hideOverlay(); };
    el.innerHTML = `<div class="crop-choice-icon">${cropPortrait(cropId, 40)}</div><div class="crop-choice-info"><strong>${name}</strong><span>Review cards to grow</span></div>`;
    choices.appendChild(el);
  });
  document.getElementById('plant-overlay').classList.remove('hidden');
}

// --- Actions ---
function harvestPlot(plotId) { pycmd(`farm:harvest:${plotId}`); }
function sellItem(itemId) { pycmd(`farm:sell:${itemId}:1`); }
function fulfillOrder(i) { pycmd(`farm:fulfill_order:${i}`); }

// --- Wheel ---
function spinWheel() {
  if (farmData.can_spin_wheel) { document.getElementById('wheel-overlay').classList.remove('hidden'); drawWheel(); }
  else showNotification('Come back tomorrow!');
}
function doSpinWheel() {
  if (wheelSpinning) return;
  wheelSpinning = true;
  document.getElementById('wheel-spin-btn').disabled = true;
  document.getElementById('wheel-result').classList.add('hidden');
  pycmd('farm:spin_wheel');
}
function showWheelResult(result) {
  wheelSpinning = false;
  let angle = 0, speed = 0.4;
  (function spin() {
    angle += speed; speed *= 0.995;
    drawWheel(angle);
    if (speed > 0.002) requestAnimationFrame(spin);
    else { document.getElementById('wheel-result').textContent = `You won: ${result.name}!`; document.getElementById('wheel-result').classList.remove('hidden'); }
  })();
}
function drawWheel(rot) {
  rot = rot || 0;
  const c = document.getElementById('wheel-canvas'), ctx = c.getContext('2d'), cx=150, cy=150, r=140;
  const segs = [{l:'25',c:'#f44336'},{l:'50',c:'#e91e63'},{l:'100',c:'#9c27b0'},{l:'1\u{1F48E}',c:'#673ab7'},{l:'3\u{1F48E}',c:'#3f51b5'},{l:'5\u{1F48E}',c:'#2196f3'},{l:'3\u{1F529}',c:'#009688'},{l:'3\u{1FAB5}',c:'#4caf50'},{l:'\u{1F4DC}',c:'#ff9800'}];
  ctx.clearRect(0,0,300,300);
  const sa = 2*Math.PI/segs.length;
  segs.forEach((s,i) => {
    const a=rot+i*sa;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,a,a+sa);ctx.closePath();ctx.fillStyle=s.c;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(a+sa/2);ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.fillText(s.l,r*0.65,5);ctx.restore();
  });
  ctx.beginPath();ctx.arc(cx,cy,18,0,2*Math.PI);ctx.fillStyle='#fff';ctx.fill();
}

// --- Mystery Box ---
function showMysteryBox(i) {
  currentBoxIndex = i;
  document.getElementById('mystery-box-overlay').classList.remove('hidden');
  document.getElementById('mystery-box-result').classList.add('hidden');
  document.getElementById('open-box-btn').disabled = false;
  const icon = document.getElementById('box-icon');
  icon.className = 'box-icon';
  // Use chest sprite
  const box = (farmData.mystery_boxes || [])[i] || {};
  const chestIdx = box.size === 'large' ? 2 : box.size === 'medium' ? 1 : 0;
  const chestKey = `ui_chest_${chestIdx}_closed`;
  if (typeof SPRITES !== 'undefined' && SPRITES[chestKey]) {
    icon.innerHTML = `<img src="${SPRITES[chestKey]}" width="72" height="72" style="image-rendering:pixelated;">`;
  } else { icon.textContent = '\u{1F4E6}'; }
}
function doOpenBox() {
  if (currentBoxIndex === null) return;
  document.getElementById('box-icon').classList.add('shaking');
  document.getElementById('open-box-btn').disabled = true;
  pycmd(`farm:open_box:${currentBoxIndex}`);
}
function showBoxResult(result) {
  const icon = document.getElementById('box-icon');
  icon.classList.remove('shaking'); icon.classList.add('opened');
  setTimeout(() => {
    let text = 'You found: ';
    const r = result.reward || {};
    if (r.coins) text += `${r.coins} coins!`;
    else if (r.gems) text += `${r.gems} gems!`;
    else if (r.item) text += `${r.qty||1}x ${r.item}!`;
    document.getElementById('mystery-box-result').textContent = text;
    document.getElementById('mystery-box-result').classList.remove('hidden');
    currentBoxIndex = null;
  }, 600);
}

// --- Level Up ---
function showLevelUp(data) {
  document.getElementById('levelup-level').textContent = data.new_level;
  let rewards = ''; if (data.gem_reward > 0) rewards = `${uiSprite('gem',20)} +${data.gem_reward} gems`;
  document.getElementById('levelup-rewards').innerHTML = rewards;
  let unlocks = ''; (data.unlocks || []).forEach(u => { unlocks += `<span class="unlock-tag">${u.emoji||''} ${u.name}</span>`; });
  document.getElementById('levelup-unlocks').innerHTML = unlocks;
  document.getElementById('levelup-overlay').classList.remove('hidden');
}
function hideLevelUp() { document.getElementById('levelup-overlay').classList.add('hidden'); }

// --- Session Summary ---
function showSessionSummary(data) {
  document.getElementById('session-stats').innerHTML = `
    <div class="session-stat"><div class="session-stat-value">${data.reviews||0}</div><div class="session-stat-label">Cards</div></div>
    <div class="session-stat"><div class="session-stat-value">${formatNum(data.coins_earned||0)}</div><div class="session-stat-label">Coins</div></div>
    <div class="session-stat"><div class="session-stat-value">${formatNum(data.xp_earned||0)}</div><div class="session-stat-label">XP</div></div>
    <div class="session-stat"><div class="session-stat-value">${data.streak||0}</div><div class="session-stat-label">Streak</div></div>
  `;
  let items = ''; Object.entries(data.items_earned || {}).forEach(([id, qty]) => {
    items += `<span class="session-item-tag">${cropPortrait(id, 16)} ${id} x${qty}</span>`;
  });
  document.getElementById('session-items').innerHTML = items;
  document.getElementById('session-overlay').classList.remove('hidden');
}

// --- Overlays ---
function hideOverlay() { document.querySelectorAll('.overlay').forEach(o => o.classList.add('hidden')); wheelSpinning = false; }

// --- Notifications ---
function showNotification(msg, type) {
  const area = document.getElementById('notification-area');
  const el = document.createElement('div');
  el.className = 'notification';
  if (type === 'reward') el.style.color = '#ffd700';
  el.textContent = msg;
  area.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 3000);
}

// --- Reward Animations ---
function showFloatingReward(text, x, y) {
  const layer = document.getElementById('reward-layer');
  const el = document.createElement('div');
  el.className = 'floating-reward';
  el.textContent = text;
  el.style.left = (x || window.innerWidth / 2) + 'px';
  el.style.top = (y || window.innerHeight / 2) + 'px';
  layer.appendChild(el);
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1200);
}

function showCoinBurst(x, y, count) {
  const layer = document.getElementById('reward-layer');
  for (let i = 0; i < (count || 5); i++) {
    const el = document.createElement('div');
    el.className = 'coin-particle';
    el.innerHTML = uiSprite('coin', 16) || '\u{1FA99}';
    el.style.left = (x || window.innerWidth / 2) + 'px';
    el.style.top = (y || window.innerHeight / 2) + 'px';
    el.style.setProperty('--dx', ((Math.random()-0.5)*80)+'px');
    el.style.setProperty('--dy', (-(Math.random()*60+20))+'px');
    el.style.animationDelay = (i * 50) + 'ms';
    layer.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
  }
}

function showReward(data) {
  if (data.coins) { showFloatingReward(`+${data.coins}`, window.innerWidth/2, window.innerHeight/2 - 20); showCoinBurst(window.innerWidth/2, window.innerHeight/2); }
  if (data.xp) showFloatingReward(`+${data.xp} XP`, window.innerWidth/2 + 40, window.innerHeight/2);
  if (data.items) { Object.entries(data.items).forEach(([id, qty]) => { const c = (farmData.item_catalog||{})[id]||{}; showNotification(`+${qty} ${c.name||id}`, 'reward'); }); }
  if (data.mystery_box) showNotification(`A ${data.mystery_box.size} mystery box appeared!`, 'reward');
}

function showBuildingDetail(bid) { pycmd(`farm:building_detail:${bid}`); }
function updateBuildingDetail(data) {
  if (data && data.recipes) {
    showProductionDialog(data);
  } else {
    if (currentPanel === 'buildings') renderBuildingsPanel();
  }
}

function showProductionDialog(data) {
  const title = document.getElementById('production-title');
  const list = document.getElementById('production-recipes');
  title.textContent = `🏭 ${data.building_name || 'Production'}`;
  list.innerHTML = '';

  // Show current queue
  const queue = data.queue || [];
  if (queue.length > 0) {
    const queueDiv = document.createElement('div');
    queueDiv.className = 'production-queue-section';
    queueDiv.innerHTML = '<h3>In Progress</h3>';
    queue.forEach(q => {
      const slot = document.createElement('div');
      slot.className = `production-queue-item ${q.ready ? 'ready' : ''}`;
      const pct = Math.min(100, ((q.sessions_waited || 0) / Math.max(1, q.sessions_required || 1)) * 100);
      slot.innerHTML = `
        <span class="pq-emoji">${q.emoji || '?'}</span>
        <div class="pq-info">
          <strong>${q.name}</strong>
          <span>${q.ready ? 'Ready to collect!' : `${q.sessions_waited}/${q.sessions_required} sessions`}</span>
        </div>
        ${!q.ready ? `<div class="pq-bar"><div class="pq-bar-fill" style="width:${pct}%"></div></div>` : '<span class="pq-ready-badge">✓</span>'}
      `;
      queueDiv.appendChild(slot);
    });
    if (queue.some(q => q.ready)) {
      const collectBtn = document.createElement('button');
      collectBtn.className = 'action-btn';
      collectBtn.textContent = 'Collect All';
      collectBtn.style.marginTop = '8px';
      collectBtn.onclick = () => { pycmd(`farm:collect:${data.building_id}`); hideOverlay(); };
      queueDiv.appendChild(collectBtn);
    }
    list.appendChild(queueDiv);
  }

  // Show available recipes
  const recipesDiv = document.createElement('div');
  recipesDiv.className = 'production-recipes-section';
  recipesDiv.innerHTML = '<h3>Recipes</h3>';
  (data.recipes || []).forEach(recipe => {
    const card = document.createElement('div');
    card.className = `recipe-card ${recipe.can_craft ? '' : 'disabled'}`;

    let ingredientsHTML = '';
    Object.entries(recipe.ingredients || {}).forEach(([itemId, qty]) => {
      const have = (farmData.inventory || {})[itemId] || 0;
      const enough = have >= qty;
      const name = itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      ingredientsHTML += `<span class="recipe-ingredient ${enough ? 'has' : 'need'}">${cropPortrait(itemId, 16)} ${name} ${have}/${qty}</span>`;
    });

    card.innerHTML = `
      <div class="recipe-header">
        <span class="recipe-emoji">${recipe.emoji || '?'}</span>
        <div class="recipe-info">
          <strong>${recipe.name}</strong>
          <span class="recipe-time">${recipe.sessions_required} session${recipe.sessions_required > 1 ? 's' : ''} | +${recipe.xp} XP</span>
        </div>
      </div>
      <div class="recipe-ingredients">${ingredientsHTML}</div>
    `;
    if (recipe.can_craft) {
      card.onclick = () => { pycmd(`farm:start_production:${data.building_id}:${recipe.id}`); hideOverlay(); };
    }
    recipesDiv.appendChild(card);
  });
  list.appendChild(recipesDiv);

  document.getElementById('production-overlay').classList.remove('hidden');
}

function formatNum(n) { return n >= 1000 ? (n/1000).toFixed(1) + 'k' : String(n); }

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tab-farm').classList.add('active');
  drawWheel();
  pycmd('farm:get_state');
});
