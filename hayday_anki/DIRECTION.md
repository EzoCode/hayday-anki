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

## Prochaines etapes
- [ ] Generer des sprites de decorations avec Gemini (fontaine, arbre, banc, etc.)
- [ ] Ameliorer l'apparence des decorations dans la zone Village
- [ ] Sons : feedback audio sur les actions (recolte, achat, level up)
- [ ] Evenements saisonniers avec bonus temporaires
- [ ] Systeme de quetes quotidiennes/hebdomadaires
