/* =============================================================
   ADFarm — High-Quality SVG Crop Sprites
   Generated programmatically for all 16 crops × 6 stages
   ============================================================= */

const CROP_SVGS = {};

// --- Crop Visual Definitions ---
const CROP_VISUALS = {
  wheat:      { fruit: '#daa520', fruitDk: '#b8860b', leaf: '#8fbc5e', stem: '#7a9e40', fruitShape: 'grain',   fruitY: -6, portrait: 'grain' },
  corn:       { fruit: '#f5d742', fruitDk: '#d4b82c', leaf: '#4a8c32', stem: '#5a9d3a', fruitShape: 'ear',     fruitY: -2, portrait: 'ear' },
  turnip:     { fruit: '#c77dba', fruitDk: '#9b59b6', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'root',    fruitY: 8,  portrait: 'root' },
  tomato:     { fruit: '#e74c3c', fruitDk: '#c0392b', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'round',   fruitY: 0,  portrait: 'round' },
  cucumber:   { fruit: '#27ae60', fruitDk: '#1e8449', leaf: '#6db844', stem: '#5da33a', fruitShape: 'long',    fruitY: 2,  portrait: 'long' },
  potato:     { fruit: '#c9944a', fruitDk: '#a0724a', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'tuber',   fruitY: 8,  portrait: 'tuber' },
  rice:       { fruit: '#daa520', fruitDk: '#b8860b', leaf: '#7aaf4a', stem: '#6a9f3a', fruitShape: 'droop',   fruitY: -4, portrait: 'grain' },
  strawberry: { fruit: '#e74c3c', fruitDk: '#c0392b', leaf: '#4a8c32', stem: '#3d7a28', fruitShape: 'berry',   fruitY: 4,  portrait: 'berry' },
  eggplant:   { fruit: '#6c3483', fruitDk: '#4a235a', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'oval',    fruitY: 2,  portrait: 'oval' },
  lemon:      { fruit: '#f1c40f', fruitDk: '#d4ac0d', leaf: '#4a8c32', stem: '#6b4226', fruitShape: 'citrus',  fruitY: -4, portrait: 'citrus' },
  orange:     { fruit: '#e67e22', fruitDk: '#d35400', leaf: '#4a8c32', stem: '#6b4226', fruitShape: 'citrus',  fruitY: -4, portrait: 'citrus' },
  sunflower:  { fruit: '#f1c40f', fruitDk: '#8b6914', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'flower',  fruitY: -10,portrait: 'flower' },
  pineapple:  { fruit: '#f5a623', fruitDk: '#d4881a', leaf: '#2d8c46', stem: '#3d7a28', fruitShape: 'pine',    fruitY: -2, portrait: 'pine' },
  melon:      { fruit: '#6aaf4c', fruitDk: '#3d8c2a', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'melon',   fruitY: 4,  portrait: 'melon' },
  grapes:     { fruit: '#8e44ad', fruitDk: '#6c3483', leaf: '#5da33a', stem: '#6b4226', fruitShape: 'cluster', fruitY: 0,  portrait: 'cluster' },
  coffee:     { fruit: '#c0392b', fruitDk: '#922b21', leaf: '#3d7a28', stem: '#6b4226', fruitShape: 'cherry',  fruitY: -2, portrait: 'cherry' },
  tulip:      { fruit: '#e91e63', fruitDk: '#c2185b', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'flower',  fruitY: -8, portrait: 'flower' },
  rose:       { fruit: '#e53935', fruitDk: '#b71c1c', leaf: '#388e3c', stem: '#2e7d32', fruitShape: 'flower',  fruitY: -8, portrait: 'flower' },
  avocado:    { fruit: '#558b2f', fruitDk: '#33691e', leaf: '#4a8c32', stem: '#5a9d3a', fruitShape: 'oval',    fruitY: 0,  portrait: 'oval' },
  cassava:    { fruit: '#a1887f', fruitDk: '#795548', leaf: '#5da33a', stem: '#4a8c32', fruitShape: 'tuber',   fruitY: 8,  portrait: 'tuber' },
};

function _svgUri(svg) {
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

// Shared SVG element builders
function _soil(w) {
  return `<ellipse cx="${w/2}" cy="${w-6}" rx="${w*0.38}" ry="5" fill="#8b6914" opacity=".5"/>
  <ellipse cx="${w/2}" cy="${w-8}" rx="${w*0.35}" ry="4" fill="#a07a3a"/>`;
}

function _stem(cx, bottom, top, color, width) {
  return `<line x1="${cx}" y1="${bottom}" x2="${cx}" y2="${top}" stroke="${color}" stroke-width="${width||2.5}" stroke-linecap="round"/>`;
}

function _leaf(cx, cy, size, angle, color) {
  const rad = angle * Math.PI / 180;
  const dx = Math.cos(rad) * size;
  const dy = Math.sin(rad) * size;
  return `<path d="M${cx},${cy} Q${cx+dx*0.6},${cy+dy-size*0.5} ${cx+dx},${cy+dy}" stroke="${color}" stroke-width="1.5" fill="none"/>
  <ellipse cx="${cx+dx*0.7}" cy="${cy+dy*0.7-1}" rx="${size*0.35}" ry="${size*0.18}" fill="${color}" transform="rotate(${angle},${cx+dx*0.7},${cy+dy*0.7-1})"/>`;
}

// --- Stage Generators ---
function makeStage0(v) {
  // Seed: dirt mound with tiny dot
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    ${_soil(64)}
    <ellipse cx="32" cy="52" rx="14" ry="6" fill="#a07a3a"/>
    <ellipse cx="32" cy="50" rx="12" ry="5" fill="#b8944a"/>
    <circle cx="32" cy="48" r="2.5" fill="#5a9d3a" opacity=".7"/>
    <circle cx="32" cy="47.5" r="1" fill="#8fce6a" opacity=".5"/>
  </svg>`;
}

function makeStage1(v) {
  // Sprout: small stem + 2 tiny leaves
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    ${_soil(64)}
    <ellipse cx="32" cy="52" rx="12" ry="5" fill="#a07a3a"/>
    ${_stem(32, 52, 38, v.stem, 2)}
    <path d="M32,42 Q26,38 22,40" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="24" cy="39" rx="5" ry="2.5" fill="${v.leaf}" transform="rotate(-15,24,39)"/>
    <path d="M32,44 Q38,40 42,42" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="40" cy="41" rx="5" ry="2.5" fill="${v.leaf}" transform="rotate(15,40,41)"/>
    <circle cx="32" cy="38" r="1.5" fill="#8fce6a"/>
  </svg>`;
}

function makeStage2(v) {
  // Growing: medium plant with multiple leaves
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    ${_soil(64)}
    <ellipse cx="32" cy="52" rx="10" ry="4" fill="#a07a3a"/>
    ${_stem(32, 52, 26, v.stem, 2.5)}
    <path d="M32,46 Q22,42 18,45" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="21" cy="43" rx="7" ry="3" fill="${v.leaf}" transform="rotate(-20,21,43)"/>
    <path d="M32,46 Q42,42 46,45" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="43" cy="43" rx="7" ry="3" fill="${v.leaf}" transform="rotate(20,43,43)"/>
    <path d="M32,38 Q24,34 20,36" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="23" cy="35" rx="6" ry="2.5" fill="${v.leaf}" opacity=".9" transform="rotate(-25,23,35)"/>
    <path d="M32,38 Q40,34 44,36" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="41" cy="35" rx="6" ry="2.5" fill="${v.leaf}" opacity=".9" transform="rotate(25,41,35)"/>
    <path d="M32,30 Q28,26 25,28" stroke="${v.leaf}" stroke-width="1.5" fill="none"/>
    <ellipse cx="27" cy="27" rx="5" ry="2" fill="${v.leaf}" opacity=".8" transform="rotate(-20,27,27)"/>
    <path d="M32,30 Q36,26 39,28" stroke="${v.leaf}" stroke-width="1.5" fill="none"/>
    <ellipse cx="37" cy="27" rx="5" ry="2" fill="${v.leaf}" opacity=".8" transform="rotate(20,37,27)"/>
  </svg>`;
}

function makeStage3(v) {
  // Flowering: full plant with fruit-color buds
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    ${_soil(64)}
    <ellipse cx="32" cy="52" rx="10" ry="4" fill="#a07a3a"/>
    ${_stem(32, 52, 20, v.stem, 3)}
    <path d="M32,48 Q20,44 16,47" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="19" cy="45" rx="8" ry="3.2" fill="${v.leaf}" transform="rotate(-18,19,45)"/>
    <path d="M32,48 Q44,44 48,47" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="45" cy="45" rx="8" ry="3.2" fill="${v.leaf}" transform="rotate(18,45,45)"/>
    <path d="M32,40 Q22,36 18,38" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="21" cy="37" rx="7" ry="3" fill="${v.leaf}" transform="rotate(-22,21,37)"/>
    <path d="M32,40 Q42,36 46,38" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="43" cy="37" rx="7" ry="3" fill="${v.leaf}" transform="rotate(22,43,37)"/>
    <path d="M32,32 Q26,28 22,30" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="25" cy="29" rx="6" ry="2.5" fill="${v.leaf}" opacity=".9" transform="rotate(-18,25,29)"/>
    <path d="M32,32 Q38,28 42,30" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="39" cy="29" rx="6" ry="2.5" fill="${v.leaf}" opacity=".9" transform="rotate(18,39,29)"/>
    <!-- buds -->
    <circle cx="20" cy="36" r="3" fill="${v.fruit}" opacity=".5"/>
    <circle cx="44" cy="36" r="3" fill="${v.fruit}" opacity=".5"/>
    <circle cx="32" cy="22" r="3.5" fill="${v.fruit}" opacity=".6"/>
  </svg>`;
}

// --- Fruit shape renderers (stage 4 and portrait) ---
function _fruitSvg(v, cx, cy, size) {
  const f = v.fruit, fd = v.fruitDk;
  switch(v.fruitShape) {
    case 'grain': // wheat/rice
      return `<ellipse cx="${cx-4}" cy="${cy}" rx="2.5" ry="6" fill="${f}" transform="rotate(-10,${cx-4},${cy})"/>
        <ellipse cx="${cx}" cy="${cy-2}" rx="2.5" ry="6.5" fill="${f}"/>
        <ellipse cx="${cx+4}" cy="${cy}" rx="2.5" ry="6" fill="${f}" transform="rotate(10,${cx+4},${cy})"/>
        <ellipse cx="${cx-4}" cy="${cy-2}" rx="1.5" ry="5" fill="${fd}" opacity=".3"/>
        <ellipse cx="${cx}" cy="${cy-4}" rx="1.5" ry="5" fill="${fd}" opacity=".3"/>
        <ellipse cx="${cx+4}" cy="${cy-2}" rx="1.5" ry="5" fill="${fd}" opacity=".3"/>`;
    case 'ear': // corn
      return `<rect x="${cx-5}" y="${cy-8}" width="10" height="18" rx="5" fill="${f}"/>
        <rect x="${cx-4}" y="${cy-7}" width="8" height="16" rx="4" fill="${fd}" opacity=".2"/>
        <path d="M${cx-4},${cy-10} Q${cx},${cy-16} ${cx+4},${cy-10}" fill="#8fbc5e" opacity=".7"/>
        <path d="M${cx-3},${cy-9} Q${cx},${cy-14} ${cx+3},${cy-9}" fill="#a0cc6e" opacity=".5"/>`;
    case 'root': // turnip
      return `<ellipse cx="${cx}" cy="${cy+2}" rx="8" ry="10" fill="${f}"/>
        <ellipse cx="${cx}" cy="${cy}" rx="7" ry="8" fill="#e8d0e4" opacity=".4"/>
        <path d="M${cx},${cy+12} L${cx},${cy+18}" stroke="${fd}" stroke-width="1.5"/>
        <ellipse cx="${cx-1}" cy="${cy-6}" rx="4" ry="1.5" fill="#5da33a"/>
        <ellipse cx="${cx+2}" cy="${cy-7}" rx="3" ry="1.2" fill="#4a8c32"/>`;
    case 'round': // tomato
      return `<circle cx="${cx}" cy="${cy}" r="${size||8}" fill="${f}"/>
        <circle cx="${cx}" cy="${cy}" r="${(size||8)*0.85}" fill="${fd}" opacity=".15"/>
        <circle cx="${cx-2}" cy="${cy-2}" r="${(size||8)*0.3}" fill="#fff" opacity=".25"/>
        <path d="M${cx-3},${cy-8} Q${cx},${cy-11} ${cx+3},${cy-8}" fill="#4a8c32" stroke="#3d7a28" stroke-width=".5"/>`;
    case 'long': // cucumber
      return `<rect x="${cx-4}" y="${cy-7}" width="8" height="16" rx="4" fill="${f}"/>
        <rect x="${cx-3}" y="${cy-6}" width="6" height="14" rx="3" fill="${fd}" opacity=".15"/>
        <circle cx="${cx-1}" cy="${cy-4}" r="1" fill="#fff" opacity=".2"/>
        <ellipse cx="${cx}" cy="${cy-7}" rx="2" ry="1" fill="#4a8c32" opacity=".6"/>`;
    case 'tuber': // potato
      return `<ellipse cx="${cx-4}" cy="${cy+2}" rx="6" ry="5" fill="${f}" transform="rotate(-10,${cx-4},${cy+2})"/>
        <ellipse cx="${cx+5}" cy="${cy+4}" rx="5.5" ry="4.5" fill="${f}" transform="rotate(8,${cx+5},${cy+4})"/>
        <ellipse cx="${cx-3}" cy="${cy}" rx="2" ry="1.5" fill="${fd}" opacity=".2"/>
        <circle cx="${cx-6}" cy="${cy+1}" r=".8" fill="${fd}" opacity=".4"/>
        <circle cx="${cx+3}" cy="${cy+3}" r=".8" fill="${fd}" opacity=".4"/>
        <circle cx="${cx+7}" cy="${cy+2}" r=".8" fill="${fd}" opacity=".4"/>`;
    case 'droop': // rice drooping heads
      return `<path d="M${cx-6},${cy-4} Q${cx-8},${cy+4} ${cx-10},${cy+6}" stroke="${f}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M${cx},${cy-6} Q${cx},${cy+2} ${cx-2},${cy+6}" stroke="${f}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M${cx+6},${cy-4} Q${cx+8},${cy+4} ${cx+10},${cy+6}" stroke="${f}" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="${cx-10}" cy="${cy+6}" r="2" fill="${f}"/>
        <circle cx="${cx-2}" cy="${cy+6}" r="2.2" fill="${f}"/>
        <circle cx="${cx+10}" cy="${cy+6}" r="2" fill="${f}"/>`;
    case 'berry': // strawberry
      return `<path d="M${cx},${cy-6} Q${cx-7},${cy-2} ${cx-5},${cy+5} Q${cx},${cy+8} ${cx+5},${cy+5} Q${cx+7},${cy-2} ${cx},${cy-6} Z" fill="${f}"/>
        <path d="M${cx},${cy-6} Q${cx-5},${cy-1} ${cx-3},${cy+4}" fill="${fd}" opacity=".15"/>
        <circle cx="${cx-2}" cy="${cy}" r=".7" fill="#f5d742" opacity=".6"/>
        <circle cx="${cx+1}" cy="${cy+2}" r=".7" fill="#f5d742" opacity=".6"/>
        <circle cx="${cx-1}" cy="${cy-3}" r=".7" fill="#f5d742" opacity=".6"/>
        <circle cx="${cx+3}" cy="${cy-1}" r=".7" fill="#f5d742" opacity=".6"/>
        <path d="M${cx-3},${cy-6} Q${cx},${cy-9} ${cx+3},${cy-6}" fill="#4a8c32"/>`;
    case 'oval': // eggplant
      return `<ellipse cx="${cx}" cy="${cy}" rx="6" ry="10" fill="${f}"/>
        <ellipse cx="${cx-1}" cy="${cy-2}" rx="4" ry="8" fill="#7d3c98" opacity=".3"/>
        <ellipse cx="${cx-2}" cy="${cy-4}" rx="1.5" ry="3" fill="#fff" opacity=".12"/>
        <path d="M${cx-2},${cy-10} Q${cx},${cy-13} ${cx+2},${cy-10}" fill="#4a8c32"/>
        <circle cx="${cx}" cy="${cy-10}" r="1.5" fill="#5da33a"/>`;
    case 'citrus': // lemon/orange
      return `<circle cx="${cx}" cy="${cy}" r="8" fill="${f}"/>
        <circle cx="${cx}" cy="${cy}" r="7" fill="${fd}" opacity=".12"/>
        <circle cx="${cx-2}" cy="${cy-2}" r="2.5" fill="#fff" opacity=".2"/>
        <circle cx="${cx}" cy="${cy-8}" r="1.5" fill="#4a8c32"/>
        <path d="M${cx},${cy-8} Q${cx-4},${cy-12} ${cx-3},${cy-9}" stroke="#4a8c32" stroke-width="1" fill="none"/>`;
    case 'flower': // sunflower
      const petals = 10;
      let p = '';
      for(let i=0; i<petals; i++) {
        const a = (i/petals) * 360;
        p += `<ellipse cx="${cx}" cy="${cy-10}" rx="3" ry="7" fill="${f}" transform="rotate(${a},${cx},${cy})" opacity=".9"/>`;
      }
      return `${p}<circle cx="${cx}" cy="${cy}" r="6" fill="#8b6914"/>
        <circle cx="${cx}" cy="${cy}" r="5" fill="#6b4912"/>
        <circle cx="${cx-1}" cy="${cy-1}" r="1.5" fill="#a07a3a" opacity=".4"/>`;
    case 'pine': // pineapple
      return `<rect x="${cx-6}" y="${cy-4}" width="12" height="16" rx="4" fill="${f}"/>
        <rect x="${cx-5}" y="${cy-3}" width="10" height="14" rx="3.5" fill="${fd}" opacity=".15"/>
        <path d="M${cx-1},${cy-2} L${cx+3},${cy+1} L${cx-1},${cy+4} L${cx+3},${cy+7}" stroke="${fd}" stroke-width=".6" fill="none" opacity=".4"/>
        <path d="M${cx-5},${cy-8} Q${cx-8},${cy-16} ${cx-4},${cy-14}" fill="#2d8c46" stroke="#1a6b32" stroke-width=".5"/>
        <path d="M${cx},${cy-8} Q${cx},${cy-18} ${cx+1},${cy-15}" fill="#3da856" stroke="#2d8c46" stroke-width=".5"/>
        <path d="M${cx+4},${cy-8} Q${cx+8},${cy-16} ${cx+4},${cy-14}" fill="#2d8c46" stroke="#1a6b32" stroke-width=".5"/>`;
    case 'melon': // watermelon style
      return `<ellipse cx="${cx}" cy="${cy+2}" rx="10" ry="8" fill="${f}"/>
        <ellipse cx="${cx}" cy="${cy+2}" rx="9" ry="7" fill="#88c760" opacity=".3"/>
        <path d="M${cx-10},${cy+2} Q${cx-8},${cy-3} ${cx-4},${cy-5} Q${cx},${cy-6} ${cx+4},${cy-5} Q${cx+8},${cy-3} ${cx+10},${cy+2}" fill="none" stroke="#3d7a28" stroke-width="1" opacity=".4"/>
        <ellipse cx="${cx-2}" cy="${cy}" rx="2" ry="1.5" fill="#fff" opacity=".15"/>`;
    case 'cluster': // grapes
      const grapes = [[-4,-4],[-1,-6],[2,-4],[-5,0],[-2,-1],[1,0],[4,-1],[-3,4],[0,3],[3,4]];
      return grapes.map(([dx,dy]) => `<circle cx="${cx+dx}" cy="${cy+dy}" r="3" fill="${f}"/><circle cx="${cx+dx-.5}" cy="${cy+dy-.8}" r="1" fill="#fff" opacity=".15"/>`).join('') +
        `<path d="M${cx},${cy-8} Q${cx-3},${cy-12} ${cx-2},${cy-10}" stroke="#6b4226" stroke-width="1" fill="none"/>`;
    case 'cherry': // coffee cherries
      return `<circle cx="${cx-4}" cy="${cy}" r="3.5" fill="${f}"/>
        <circle cx="${cx+4}" cy="${cy}" r="3.5" fill="${f}"/>
        <circle cx="${cx}" cy="${cy-4}" r="3.5" fill="${f}"/>
        <circle cx="${cx-4}" cy="${cy-1}" r="1" fill="#fff" opacity=".2"/>
        <circle cx="${cx+4}" cy="${cy-1}" r="1" fill="#fff" opacity=".2"/>
        <circle cx="${cx}" cy="${cy-5}" r="1" fill="#fff" opacity=".2"/>
        <path d="M${cx-4},${cy-3} Q${cx-2},${cy-8} ${cx},${cy-7} Q${cx+2},${cy-8} ${cx+4},${cy-3}" stroke="#6b4226" stroke-width="1" fill="none"/>`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="7" fill="${f}"/>`;
  }
}

function makeStage4(v) {
  // Ready: full mature plant with vibrant fruits
  const fy = 28 + (v.fruitY || 0);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    ${_soil(64)}
    <ellipse cx="32" cy="52" rx="10" ry="4" fill="#a07a3a"/>
    ${_stem(32, 52, 18, v.stem, 3)}
    <!-- leaves -->
    <path d="M32,48 Q18,44 14,47" stroke="${v.leaf}" stroke-width="2.2" fill="none"/>
    <ellipse cx="17" cy="45" rx="8" ry="3.5" fill="${v.leaf}" transform="rotate(-18,17,45)"/>
    <path d="M32,48 Q46,44 50,47" stroke="${v.leaf}" stroke-width="2.2" fill="none"/>
    <ellipse cx="47" cy="45" rx="8" ry="3.5" fill="${v.leaf}" transform="rotate(18,47,45)"/>
    <path d="M32,40 Q20,35 16,38" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="19" cy="37" rx="7" ry="3" fill="${v.leaf}" transform="rotate(-22,19,37)"/>
    <path d="M32,40 Q44,35 48,38" stroke="${v.leaf}" stroke-width="2" fill="none"/>
    <ellipse cx="45" cy="37" rx="7" ry="3" fill="${v.leaf}" transform="rotate(22,45,37)"/>
    <path d="M32,32 Q24,28 20,30" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="23" cy="29" rx="6" ry="2.5" fill="${v.leaf}" opacity=".9" transform="rotate(-20,23,29)"/>
    <path d="M32,32 Q40,28 44,30" stroke="${v.leaf}" stroke-width="1.8" fill="none"/>
    <ellipse cx="41" cy="29" rx="6" ry="2.5" fill="${v.leaf}" opacity=".9" transform="rotate(20,41,29)"/>
    <!-- fruits -->
    ${_fruitSvg(v, 32, fy, 8)}
  </svg>`;
}

function makePortrait(v) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    ${_fruitSvg(v, 16, 16, 6)}
  </svg>`;
}

// --- Generate all sprites ---
const stageGenerators = [makeStage0, makeStage1, makeStage2, makeStage3, makeStage4];

Object.keys(CROP_VISUALS).forEach(cropId => {
  const v = CROP_VISUALS[cropId];
  for (let stage = 0; stage <= 4; stage++) {
    CROP_SVGS[`crops_${cropId}_${stage}`] = _svgUri(stageGenerators[stage](v));
  }
  CROP_SVGS[`crops_${cropId}_portrait`] = _svgUri(makePortrait(v));
});
