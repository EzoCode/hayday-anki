# ADFarm — Direction du projet

## Vision
Un vrai village farming game integre a Anki ou chaque review de carte fait progresser ta ferme.
L'objectif est de creer une boucle d'engagement comparable a Hay Day : planter → reviser → recolter → produire → vendre → agrandir.

## Problemes identifies (2026-04-05)
1. ~~La ferme ne se charge pas a l'ouverture (bug JS/bridge)~~ — CORRIGE
2. ~~Les cultures plantees apparaissent directement grandes (pas de progression visuelle stade 0→4)~~ — CORRIGE (growth_reviews etait divise par 4)
3. ~~Les parcelles sont ecrasees sur une ligne~~ — CORRIGE (grille 3 colonnes)
4. Les decorations sont des emojis moches (besoin de vrais sprites)
5. ~~Le menu "Construire" dit "aucun batiment" sans montrer ce qui existe a debloquer~~ — CORRIGE (montre built/available/locked)
6. ~~Zero motivation : on ne voit pas ce qu'on POURRAIT avoir~~ — CORRIGE (plant dialog montre reviews/stade, recolte, prix)
7. ~~L'inventaire/sac n'est pas clair ni coherent~~ — CORRIGE (item info system)
8. ~~Les streaks et ressources ne se conservent pas bien entre sessions~~ — CORRIGE (streak au debut de session, save atomique)
9. ~~Pas de fichier de suivi des decisions de design~~ — CORRIGE (ce fichier)

## Bugs critiques corriges (2026-04-05, session 2)
1. **Crop growth rate** : `growth_reviews` (par stade) etait divise par 4, rendant les cultures ~4x trop rapides
2. **Plots vs fields** : `add_plots()` ajoutait a l'ancien systeme `plots`, pas au nouveau `fields` — les parcelles de level-up n'apparaissaient jamais
3. **_buy_building** : n'ajoutait pas a `placed_buildings` — les batiments achetes via panel etaient invisibles sur la ferme
4. **_buy_animal** : n'ajoutait pas a `pastures` — les animaux achetes n'apparaissaient pas au paturage
5. **Double production advance** : les queues de production avancaient 2x par session (dans __init__.py ET farm_manager.py)
6. **Streak timing** : le streak etait mis a jour en fin de session, mais le bonus s'appliquait pendant — deplace au debut de session

## Principes de design
- **Montrer l'avenir** : toujours afficher les elements verrouilles avec leur niveau requis et benefices
- **Feedback constant** : chaque review doit montrer visuellement un progres (crop qui grandit, XP qui monte)
- **Clarte** : chaque element a une description, un cout, et une explication de son utilite
- **Persistance** : tout se sauvegarde correctement entre sessions (streak, inventaire, terrain)
- **Beaute** : utiliser de vrais sprites generes par Gemini, pas des emojis
- **Progression visible** : les crops doivent passer par 5 stades visuels distincts

## Historique des corrections (2026-04-05)
- [x] Fix: ferme se charge au lancement (bridge race condition)
- [x] Fix: crop growth stages visibles (stade 0 = graine)
- [x] Parcelles en grille 3 colonnes carrees (plus ecrasees)
- [x] Montrer TOUS les batiments/animaux dans les menus, avec prerequis et descriptions
- [x] 30+ descriptions d'items en francais (materiaux, crops, produits)
- [x] Systeme d'info (i) sur chaque item d'inventaire
- [x] Boutique animaux : niveaux requis, descriptions, produits
- [x] Boutique terrain : barre de progression, cout detaille
- [x] Boutique upgrades : materiaux avec compteurs (3/5 boulons)
- [x] Commandes : explication du systeme, items avec statut couleur
- [x] Overlay scrollable et fermable
- [x] Parcelles max 120px (pas de pixelisation en grande fenetre)

## Aussi corrige (session 2)
- [x] Fix: add_plots ajoute au bon systeme (fields)
- [x] Fix: buy_building/buy_animal ajoutent aux listes de rendu
- [x] Fix: production avance 1x par session (pas 2x)
- [x] Plant dialog montre reviews/stade, recolte, prix de vente, XP
- [x] Boutique animaux complete : niveaux, descriptions, produits, status couleur
- [x] Boutique upgrades : materiaux avec compteurs couleur (have/need)
- [x] Boutique terrain : barre progression, cout detaille, tips
- [x] Commandes : explication du systeme, items couleur
- [x] Boutique decos : categories (Basique/Premium/Nature/Special)

## Bugs corriges (2026-04-05, session 3)
1. **Window close crash** : fermer la fenetre farm via X ne nettoyait pas la reference webview — les reviews suivantes crashaient en essayant d'executer du JS sur un webview detruit. Corrige avec callback on_close.
2. **Village decorations invisible** : renderVillage() cherchait dans item_catalog au lieu de deco_defs — la plupart des decorations (hay_bale, mailbox, lamp_post, etc.) n'affichaient ni emoji ni nom. Corrige pour utiliser deco_defs avec fallback.
3. **Achat animal bloque** : le JS bloquait l'achat d'un animal supplementaire (ex: 2e vache) en exigeant 2 terrains, alors que le backend Python sait que l'enclos existe deja. Corrige pour verifier si un enclos existe.
4. **AchievementManager duplique** : _send_achievements() creait un nouveau manager a chaque appel au lieu de reutiliser l'instance. Corrige avec cache sur l'instance.

## Bugs corriges (2026-04-05, session 4)
1. **showAnimalShopInfo crash** : la variable `animalType` etait indefinie (parametre nomme `aid`) — crash JS quand on clique sur l'info d'un animal dans la boutique. Corrige : `animalType` → `aid`.
2. **Croissance des cultures (BUG MAJEUR)** : `_advance_plots()` n'avancait qu'UN seul champ aleatoire par review. Avec 9 champs, le ble (12 reviews normalement) prenait ~108 reviews. Corrige : TOUS les champs actifs avancent a chaque review, comme dans Hay Day.
3. **Harvest overflow** : `max(1, get_silo_space())` quand silo plein renvoyait 1 au lieu de 0, tentant un ajout impossible. Corrige : utilise directement `get_silo_space()` avec verification > 0.
4. **unlocked_buildings type** : `Object.keys(farmData.unlocked_buildings||{})` traitait un tableau comme un objet. Corrige pour `(farmData.unlocked_buildings||[]).length`.

## Bugs corriges (2026-04-05, session 5 — fondations solides)
1. **from_dict mutait le dict d'entree** : `data.pop("_schema_version")` detruisait les donnees source. Corrige : utilise `data.get()` + skip dans la boucle.
2. **Migration plots→fields cassee** : `FarmState.__init__` creait 3 starter fields, bloquant la migration des anciens `plots`. Corrige : `from_dict` utilise `__new__` pour eviter les starter fields, puis les cree seulement si aucune donnee existante.
3. **Generations de commandes utilisait l'ancien dict `animals`** au lieu de `pastures` (source de verite). Corrige : parcourt `pastures` et `placed_buildings` directement.
4. **Quantite de commandes illimitee** : a haut niveau, les commandes pouvaient demander 30+ items. Corrige : cap a 10 max.
5. **4 achievements impossibles a debloquer** : `early_bird_count`, `night_owl_count`, `weekend_review_count` n'etaient jamais incrementes. `dedicated_hours` utilisait un compteur inexistant. Corrige : ajout des compteurs dans FarmState + increment dans process_review.
6. **Code mort `buy_building`** : handler Python jamais appele depuis JS. Supprime.
7. **Redundance `num_plots`** : override inutile dans `__init__.py`. Supprime.

## Ameliorations (session 5)
- **Performance** : definitions statiques (item_catalog, building_defs, crop_defs, animal_defs, deco_defs) envoyees 1 seule fois au chargement de la page via `initDefs()`, plus a chaque `updateFarm()`. Reduit la taille des mises a jour de ~60%.
- **Replanter tout** : bouton "Tout planter" qui replante automatiquement toutes les parcelles vides avec leur derniere culture. Cycle recolte→replante en 2 clics.
- **Champs vides invitants** : les parcelles vides sans derniere culture affichent "Planter" au lieu d'un simple "+".
- **Bonus de serie visible** : badge "+X%" affiche dans le HUD a cote du compteur de serie.
- **Crops pretes animees** : les cultures pretes a recolter rebondissent avec un label dore pour attirer l'attention.

## Ameliorations (session 6 — gameplay polish)
- **itemIcon() ameliore** : utilise maintenant les vrais sprites de cultures (stage 4), animaux, et batiments du sprite atlas au lieu de fallback SVG generiques. Ajout de l'icone scarecrow manquante.
- **Grille de champs responsive** : 3 colonnes par defaut, 4 a 8+ champs, 5 a 15+ champs. La ferme s'adapte a la progression du joueur.
- **Feedback recolte differencie** : la recolte utilise un son different du level-up. Burst de particules ameliore (8 particules en cercle + sparkles dores).
- **Pourcentage de croissance visible** : chaque parcelle en croissance affiche un % dans le coin superieur droit.
- **Notification "culture prete"** : quand une culture devient prete a recolter pendant les revisions, une notification doree apparait.
- **Session summary ameliore** : affiche la precision, icone de pieces, animations pop-in echelonnees, confettis de celebration.
- **Commandes (ordres) ameliores** : les livraisons bateau donnent maintenant des gemmes en bonus. Confettis + coin burst a la livraison.
- **Reward visuel ameliore** : plus de particules proportionnelles aux pieces gagnees lors des revisions.

## Ameliorations (session 7 — UX polish et solidite)
- **Plant dialog redesign** : le dialog de plantation est maintenant une grille visuelle Hay Day (portraits 52px, badges reviews/prix, grid responsive) au lieu d'une liste verticale text-heavy. Selection plus rapide et plus satisfaisante.
- **Production dialog ameliore** : recipe cards avec meilleur espacement, bordures arrondies, shadows, items ingredients avec taille 16px et drop-shadow. Queue items prets avec animation pulse doree.
- **Sell dialog ameliore** : boutons de vente plus gros (14px border-radius), hover avec glow dore, total en grand. Item name avec icone.
- **Weather dawn** : ajout du soleil levant (radial gradient), atmosphere chaude, leger boost de brightness.
- **Weather sunset** : ajout du filtre sepia doux pour ambiance couchante.
- **Level up unlocks** : tags avec animation pop-in echelonnee et shadow.
- **Ready crops** : label "Recolter !" avec glow dore pulse et letter-spacing.
- **Session summary harvest count** : le compteur de recoltes de session fonctionne maintenant (ajout `session_harvests` au backend).
- **drawWheel null check** : protection contre crash si canvas pas encore rendu.
- **Duplicate CSS cleanup** : suppression des definitions .pq-* dupliquees.

## Ameliorations (session 8 — polish visuel et fondations solides)
- **Pig SVG inline** : ajout d'un SVG detaille pour le cochon dans ITEM_ICONS (manquait dans les sprites hayday/ — pas de pig-lbl.png). Le pig apparait maintenant correctement partout (inventaire, shop, pasture labels).
- **renderFarmer() dans updateFarm()** : le fermier se re-rend a chaque mise a jour de la ferme (avant, seulement au DOMContentLoaded). Le personnage est toujours visible.
- **fieldBg() fallback ameliore** : les parcelles vides utilisent maintenant `tiles_dirt` au lieu de `hayday_field`, les parcelles plantees utilisent `tiles_dirt_planted`. Meilleure differenciation visuelle des etats.
- **Building idle animation** : les batiments en production ont une animation "breathing" subtile (`.producing` class). La ferme parait vivante quand des choses se produisent.
- **Variable shadowed corrigee** : `const q = queue.find(q=>...)` → `queue.find(item=>...)` dans renderWorkshop.
- **CSS polish majeur** :
  - Ciel : nuages animes avec `cloudDrift`, couleurs plus riches
  - Farm-world : texture d'herbe multi-couches avec radial gradients, reflets subtils
  - Zone headers : ombres interieures type bois, meilleur relief
  - Parcelles vides : hover dore pour inviter a planter
  - Parcelles pretes : glow elargi (40px outer glow), bordure plus epaisse
  - Toolbar : tab active avec glow gradient + icone illuminee
  - Action buttons : effet shimmer au hover (pseudo-element glissant), meilleur feedback tactile
  - Overlay cards : reflet superieur, ombre interieure, bordure plus marquee
  - Level badge : glow elargi, background radial dore subtil
  - Notifications : max-width pour eviter debordement, centrage
  - Pastures : animation bobbing differenciee odd/even pour effet naturel
  - Items inventaire : hover avec outline dore, meilleur feedback tactile
  - Crop sprites : transitions sur transform et filter pour changements fluides

## Ameliorations (session 9 — visual uniqueness et bugs critiques)
- **CRITIQUE: Batiments tous identiques** : HD_BUILDINGS mappait TOUS les batiments de production (bakery, dairy, pizzeria, etc.) aux memes 3 sprites generiques (barn, silo, shop). Le joueur ne pouvait pas distinguer ses 9 batiments. Corrige : les BUILDING_SVGS uniques (SVG detaille pour chaque batiment) sont maintenant prioritaires. Seuls barn/silo/shop/chicken_coop utilisent les vrais PNG.
- **BUG: Production notification crash** : `_start_production` utilisait `f"showNotification('Production de {r_name} lancée !')"` sans escaper. Les recettes "Tarte à l'orange" et "Jus d'orange" (apostrophes) cassaient le JS. Corrige : utilise `json.dumps()`.
- **Bug similaire corrige** : `can_craft` raison non echappee dans `_start_production`.
- **Pig pasture display** : `animalLbl()` ne trouvait jamais `hayday_pig-lbl` (fichier inexistant). Ameliore : fallback vers le SVG de ITEM_ICONS (haute qualite), coherent avec les autres animaux.
- **animalImg() ameliore** : si aucun PNG sprite, utilise le SVG handcrafted de ITEM_ICONS au lieu d'un carre "?" generique.
- **Harvest sound** : `harvestPlot()` jouait un simple "click". Maintenant joue "levelup" pour un feedback plus satisfaisant.
- **Harvest All** : ajout de son "levelup" + coin burst visuel lors de la recolte groupee.
- **Plant dialog enrichi** : affiche maintenant le stock en silo et le nombre de champs en culture pour chaque crop. Le joueur voit immediatement ce qu'il fait pousser et ce qu'il a en stock.

## Ameliorations (session 10 — game feel et audio)
- **Web Audio API synth sounds** : 8 sons distincts synthetises (harvest, plant, coin, collect, grow, click, levelup, error). Chaque action a un son unique et satisfaisant sans avoir besoin de fichiers audio externes. Les fichiers WAV/MP3 restent prioritaires quand ils existent.
- **Son de harvest distinct** : les recoltes jouent un arpege ascendant satisfaisant (C-E-G), different du level-up.
- **Son de plantation** : bruit terreux + chime de pousse quand on plante.
- **Son de piece** : ding classique de piece quand on gagne/vend.
- **Son de collecte** : arpege ascendant (A-C#-E-A) pour les productions et drops.
- **Son de croissance** : note magique subtile quand les cultures avancent pendant les revisions.
- **Son de culture prete** : le son harvest joue automatiquement quand une culture arrive a maturite (avec delai pour pas superposer le son de piece).
- **Vent sur les cultures** : animation CSS `cropWind` fait osciller les cultures en croissance comme dans un vrai champ. Transform-origin au bas pour un mouvement naturel.
- **Particules ambiantes** : graines, pollen dore, et feuilles flottent au-dessus de la ferme. 8 particules avec durees et delais aleatoires pour un effet organique.
- **Nuages ameliores** : deux nuages avec gradients radiaux et animations distinctes, plus realistes (parallaxe implicite).
- **Ready crops hover ameliore** : les parcelles pretes a recolter grossissent plus au hover (+8% au lieu de +4%), glow blanc renforce.
- **Empty plot hover ameliore** : les parcelles vides ont un glow vert subtil au hover pour inviter a planter.
- **Building has-ready glow** : les batiments avec des produits prets ont un glow dore pulse, attirant l'attention du joueur.
- **Badge batiment vert** : le badge de produit pret est maintenant vert (couleur positive) au lieu de rouge.
- **Feedback croissance renforce** : l'animation `.plot-grew` est plus visible (scale 1.08, brightness 1.4, glow plus large). Le joueur VOIT ses cultures pousser a chaque revision.
- **Floating reward ameliore** : animation plus dynamique avec apparition en scale (0.5->1.3->1.1->0.7), plus lisible.
- **Notifications premium** : backdrop-filter blur pour un look plus integre.
- **Deco tiles ameliores** : effet de lumiere (pseudo-element radial-gradient), hover plus prononce, image scale au hover.
- **Planted plots** : pseudo-element de lumiere subtile sur les parcelles en croissance.

## Ameliorations (session 11 — gameplay clarity et polish)
- **Farmer character visible** : le personnage fermier etait `position:absolute;bottom:8px` dans le `#farm-world` scrollable — invisible sauf si on scrollait tout en bas. Change en `position:fixed;bottom:68px` (au-dessus de la toolbar), toujours visible.
- **Growing plots simplifies** : les parcelles en croissance avaient 6 elements visuels (nom, label stade, %, reviews restantes, barre, sprite) sur ~100px carres — illisible. Reduit a 3 : sprite crop (avec animation vent), nom (bottom), progress bar + % (top-right avec pill sombre). Le reste disponible au hover via tooltip natif.
- **Ready plots clarifies** : les parcelles pretes avaient le nom de la culture ET le badge "Recolter !" empiles l'un sur l'autre. Simplifie : seulement le sprite rebondissant + badge dore "Recolter !". Le nom est dans le tooltip.
- **Tooltips natifs** : chaque parcelle en croissance, prete ou fanee a maintenant un tooltip (`title=`) montrant le nom, stade, % et reviews restantes. Info disponible sans encombrer l'affichage.
- **Replant hover ameliore** : les parcelles vides avec derniere culture ont un hover plus prononce (scale 1.08, crop preview scale 1.15). Plus invitant.
- **Building name lisibility** : les noms de batiments sur la ferme ont maintenant un fond sombre (`background:rgba(0,0,0,.2)`) et border-radius pour se detacher du fond.
- **Order cards gem bonus** : les commandes bateau affichent maintenant un badge "Bonus" avec icone gemme. L'explication corrigee : "Camion = 2x, Bateau = 3x + gemmes".
- **Pasture labels** : taille augmentee de 7px a 8px, couleur plus lisible.
- **Progress bar** : epaisseur augmentee de 4px a 5px, z-index corrige pour etre toujours au-dessus.
- **Plot labels** : refactored avec fond semi-transparent et centrage precise (`transform:translateX(-50%)`).
- **Plot percentage** : fond sombre pill (`background:rgba(0,0,0,.25)`) pour lisibilite sur n'importe quel fond, taille 10px.

## Ameliorations (session 12 — fondations visuelles et UX cleanup)
- **Sprite priority fix** : `S()` prefere maintenant les PNG pour portraits/UI/batiments mais garde les SVG vectoriels pour les stades de croissance des cultures (les PNG de stades font ~12px, trop petits pour affichage 58px). Les portraits PNG Hay Day sont utilises dans le plant dialog et l'inventaire avec `image-rendering: pixelated`.
- **Toolbar simplifie** : 5 boutons au lieu de 7 (retire Batir et Roue). La roue est accessible depuis le panel Succes. Les batiments sont accessibles via les tuiles de l'atelier sur la ferme + bouton "+ Construire". Plus d'espace par bouton, labels plus lisibles (9px), active state avec fond subtil.
- **Farmer character retire** : le personnage fixe en bas a droite prenait de la place sans valeur gameplay. Retire du DOM et du CSS.
- **Crops display nettoye** : les parcelles en croissance n'affichent plus le nom ni le pourcentage en overlay — juste le sprite (plus gros: 44-58px) et la barre de progression au sol. Info complete dans le tooltip natif. Les parcelles pretes montrent le sprite a 64px.
- **Hay Day assets integres** : `coin-box.png` utilise comme fond du compteur de pieces dans le HUD. `details-bg.png` (gradient vert Hay Day) utilise comme fond des overlay cards. `xp_pbar_bg.png` et `star.png` deja utilises pour le HUD XP.
- **CSS cleanup** : code mort du farmer character supprime, toolbar plus spacieux avec padding ameliore, crop images avec meilleur centrage flex.

## Ameliorations (session 13 — gameplay solide et quetes quotidiennes)
- **Parcelles en croissance simplifiees** : suppression du label de stade ("Pousse", "Croissance") et du compteur de reviews restantes qui encombraient les parcelles de ~100px. Desormais : sprite de culture (plus grand: 48-62px) + 4 points de stade (dots) au-dessus + barre de progression en bas. L'info detaillee reste dans le tooltip natif. Resultat : affichage propre comme dans Hay Day.
- **Parcelles pretes nettoyees** : suppression du label texte "Recolter !". Seul le sprite de culture (72px) avec animation bounce + glow dore + sparkle communique l'etat. Plus besoin de texte — le visuel parle de lui-meme comme dans le vrai jeu.
- **Animation bounce amelioree** : rebond plus naturel avec 3 rebonds degressifs (18% -> 10% -> 5%) au lieu d'un seul rebond.
- **Systeme de quetes quotidiennes** : 3 quetes generees chaque jour, adaptees au niveau du joueur :
  - Toujours une quete "Reviser X cartes" (le coeur du jeu)
  - 2 quetes parmi : recolter, gagner des pieces, planter, produire, livrer, vendre
  - Les cibles scalent avec le niveau (ex: niveau 1 = 10 cartes, niveau 30 = 30 cartes)
  - Barre de progression par quete avec animation fluide
  - Recompense a la completion des 3 : pieces + gemmes + XP (scaling avec le niveau)
  - Les quetes se renouvellent automatiquement chaque jour
  - Persistance complete dans la sauvegarde avec migration backward-compatible
- **Tracking de progression des quetes** : chaque action du jeu (revision, recolte, plantation, vente, production, livraison) avance automatiquement les quetes correspondantes.
- **UI des quetes** : barre de quetes integree sous le HUD avec design bois Hay Day, icones SVG par type, barres de progression orange->vert, bouton de reclamation avec animation pulse.

## Bugs corriges et ameliorations (session 14 — fondations gameplay solides)
1. **BUG CRITIQUE: Notification spam animaux** : quand le silo etait plein, les animaux retentaient la production a chaque review et envoyaient une notification a chaque fois. Corrige : le compteur est fige a `produce_every` (retente 1x par review), et la notification ne s'affiche qu'une seule fois par episode silo-plein (`_silo_full_notified` flag).
2. **BUG CRITIQUE: Variable non initialisee** : `notifs` etait utilisee dans le wilt warning avant d'etre initialisee (`notifs = []` etait apres la boucle de wilt). Corrige : initialisation deplacee avant la boucle.
3. **Avertissement de fanage** : les cultures pretes fanaient silencieusement apres 50 reviews sans avertissement. Ajout d'un etat visuel "wilt warning" a partir de 35 reviews (70% du seuil). Badge orange pulse avec compte a rebours, animation shake sur la culture, notification sonore unique. Le joueur a le temps de reagir.
4. **Tout recuperer (batiments)** : bouton "Tout recuperer" dans la zone Atelier quand 2+ batiments ont des produits prets. Action batch unique `collect_all_buildings` au lieu de multiples clics individuels. Confettis si 3+ items collectes.
5. **Vente amelioree** : la notification de vente utilise maintenant le style "reward" (dore) au lieu du style neutre.
6. **Nettoyage des champs** : `harvest_plot` et `clear_wilted` nettoient maintenant tous les champs temporaires (`_wilt_warning`, `_wilt_warned`, `_wilt_remaining`).

## Ameliorations (session 15 — polish gameplay et fondations)
1. **BUG: Events sans multipliers** : `get_farm_data()` n'envoyait que le `name` des events actifs, pas `coin_multiplier`/`xp_multiplier`. La banniere events ne pouvait jamais afficher les bonus. Corrige : envoie aussi `icon`, `coin_multiplier`, `xp_multiplier`.
2. **Crop portrait dans notification** : quand une culture devient prete pendant les revisions, la notification inclut maintenant le portrait de la culture (PNG Hay Day) au lieu de texte seul. Plus satisfaisant visuellement.
3. **Golden burst quand culture prete** : ajout d'une animation `plot-just-ready` spectaculaire (scale 0.7→1.2→1 avec glow dore) + coin burst quand une culture termine sa croissance pendant les revisions. Le joueur VOIT et RESSENT le moment ou sa culture est prete.
4. **XP bar shimmer** : quand la barre XP depasse 85%, elle pulse avec un gradient dore (animation `xpAlmostLevel`). Cree l'urgence de continuer a reviser pour level-up — mecanique dopamine cle de Hay Day.
5. **Fix: Collect All button selector** : le selecteur `querySelector('.zone-add-btn')` dans `renderWorkshop` pouvait matcher le bouton lui-meme. Corrige avec `:not(#collect-all-buildings-btn)`.
6. **Son collect_all_buildings** : ajout de `SoundMgr.play('collect')` cote Python quand la collecte batch reussit.
7. **Audit complet de coherence** : verification de bout en bout du game loop (review→earn→grow→harvest→produce→sell→orders→quests). Tous les `advance_quest()` sont en place pour les 7 types de quetes. Tous les bridge commands (`pycmd`) sont geres avec error handling. Les 20 crops ont leurs 5 stades PNG + portrait. Les 9 batiments ont des SVGs uniques. Les 4 animaux ont labels/sprites.

## Prochaines etapes
- [ ] Evenements saisonniers avec bonus temporaires
- [ ] Systeme d'etoiles par quete (bronze/argent/or selon la performance)
- [ ] Ameliorer le tutoriel avec guidage contextuel etape par etape
