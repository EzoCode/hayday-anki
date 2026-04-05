# ADFarm — Direction du projet

## Vision
Un vrai village farming game integre a Anki ou chaque review de carte fait progresser ta ferme.
L'objectif est de creer une boucle d'engagement comparable a Hay Day : planter → reviser → recolter → produire → vendre → agrandir.

## Problemes identifies (2026-04-05)
1. La ferme ne se charge pas a l'ouverture (bug JS/bridge)
2. Les cultures plantees apparaissent directement grandes (pas de progression visuelle stade 0→4)
3. Les parcelles sont ecrasees sur une ligne (pas beau, pas de sentiment de village)
4. Les decorations sont des emojis moches (besoin de vrais sprites)
5. Le menu "Construire" dit "aucun batiment" sans montrer ce qui existe a debloquer
6. Zero motivation : on ne voit pas ce qu'on POURRAIT avoir, donc pas d'envie de progresser
7. L'inventaire/sac n'est pas clair ni coherent
8. Les streaks et ressources ne se conservent pas bien entre sessions
9. Pas de fichier de suivi des decisions de design

## Principes de design
- **Montrer l'avenir** : toujours afficher les elements verrouilles avec leur niveau requis et benefices
- **Feedback constant** : chaque review doit montrer visuellement un progres (crop qui grandit, XP qui monte)
- **Clarte** : chaque element a une description, un cout, et une explication de son utilite
- **Persistance** : tout se sauvegarde correctement entre sessions (streak, inventaire, terrain)
- **Beaute** : utiliser de vrais sprites generes par Gemini, pas des emojis
- **Progression visible** : les crops doivent passer par 5 stades visuels distincts

## Prochaines etapes
- [ ] Fix: ferme se charge au lancement
- [ ] Fix: crop growth stages visibles (stade 0 = graine, pas crop adulte)
- [ ] Parcelles en grille 2-3 colonnes dans la zone champs (pas une seule ligne)
- [ ] Generer des sprites de decorations avec Gemini (fontaine, arbre, banc, cloture, etc.)
- [ ] Montrer TOUS les batiments/animaux/crops dans les menus, meme verrouilles, avec prerequis
- [ ] Fix inventaire : affichage coherent des materiaux et items
- [ ] Fix persistance : sauvegardes fiables entre sessions
- [ ] Chaque unlock montre : nom, image, description, benefice, cout, niveau requis
