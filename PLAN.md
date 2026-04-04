# Plan: Refonte visuelle — Qualite jeu mobile

## Contexte
L'addon ADFarm fonctionne avec de vrais sprites pixel art, mais l'UI est plate et laide : fond vert uni, layout basique, zero profondeur. L'utilisateur veut une qualite de vrai jeu mobile (Hay Day / Stardew Valley).

## Approche : Reecriture complete du CSS + ajustements HTML

### Fichiers a modifier
- **`web/farm.css`** — Reecriture complete (~600 lignes)
- **`web/farm.html`** — Ajout de divs wrapper pour les couches visuelles
- `web/farm.js` — Pas de changement (le systeme de sprites marche deja)
- `ui_farm.py` — Pas de changement

---

## 1. Background & Atmosphere
Remplacer le fond vert plat par un paysage ferme multicouche :
- Gradient de ciel en haut (#87ceeb -> #b0d4e8)
- Herbe texturee avec `repeating-linear-gradient` de 2 tons de vert
- Chemin de terre diagonal subtil
- Vignette overlay pour profondeur (`radial-gradient` transparent -> sombre)
- Wrapper `.farm-sky` au-dessus de `.farm-ground` dans farm.html

## 2. HUD Bar — Barre de jeu premium
- Texture bois : `linear-gradient(180deg, #d4a056, #8b5e3c, #6b3a1a)` avec inner highlights
- Badge niveau : cercle dore avec `box-shadow: 0 0 8px gold` + bordure double
- Barre XP : fond noir arrondi, remplissage vert avec reflet (pseudo-element `::after` blanc semi-transparent en haut)
- Devises dans des capsules pilule (fond semi-transparent, coins arrondis 16px)
- Streak : flamme animee (pulse CSS)
- 3 couches de shadow sur toute la barre

## 3. Grille de parcelles — Profondeur 3D
- Grille 3 colonnes centree (responsive selon la taille du dock)
- Chaque parcelle : terre brune avec gradient riche + `box-shadow` 3 couches :
  - `inset 1px 1px 0 rgba(255,255,255,0.25)` — highlight en haut
  - `inset -2px -2px 6px rgba(0,0,0,0.35)` — ombre interne en bas
  - `0 6px 12px rgba(0,0,0,0.3)` — ombre portee
- Parcelle vide : bordure dashed subtile, "+" tres discret
- Parcelle prete : glow dore pulsat + particules sparkle CSS
- Hover : `translateY(-3px)` + shadow renforcee
- Active : `scale(0.95)` pour feedback tactile
- Sprite crop avec `drop-shadow` pour "sortir" du sol

## 4. Batiments — Style carte de jeu
- Cadre avec bordure bois (gradient marron)
- Sprite centre sur ombre au sol (ellipse noire transparente sous le batiment)
- Badge "pret a collecter" : badge rouge avec pulse glow
- Nom en texte blanc avec text-shadow

## 5. Toolbar du bas — Tab bar mobile
- `backdrop-filter: blur(12px)` + fond semi-transparent
- Onglet actif : lueur coloree en dessous (pseudo-element `::after` orange)
- Icones avec `filter: drop-shadow`
- Transition 0.2s sur tous les etats

## 6. Panels — Feuille glissante premium
- Coins arrondis en haut (20px)
- Animation `bounceIn` avec `cubic-bezier(0.34, 1.56, 0.64, 1)` pour overshoot
- Fond parchment chaud (gradient beige/creme)
- Poignee de drag visuelle en haut (petite barre grise centree)
- Ombre portee en haut (`0 -4px 20px`)

## 7. Overlays — Modales premium
- Backdrop : `rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`
- Contenu : pop-in avec bounce (`scale 0.8 -> 1.05 -> 1`)
- Level up : fond violet + pluie de sparkles CSS (`@keyframes sparkle-fall`)
- Mystery box : tremblement 3D + burst open

## 8. Grille inventaire — Cartes polies
- Fond blanc avec gradient subtil
- Hover : lift (-2px) + shadow renforcee
- Quantite dans un badge pilule
- Prix en couleur or

## Verification
1. Reinstaller l'addon
2. Ouvrir ADFarm — verifier visuellement le nouveau style premium
3. Verifier que les sprites s'affichent toujours correctement
4. Tester tous les tabs, panels, overlays
5. Planter/recolter — verifier les animations
