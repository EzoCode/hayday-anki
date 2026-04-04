# MEGA-BRIEFING : Projet Anki Himalaya

Copie-colle ce briefing en entier au début d'une nouvelle conversation pour que l'agent reprenne exactement là où on en était.

---

## 1. QUI EST L'UTILISATEUR

- **Nom** : Himalaya
- **Email** : girardhimalaya@gmail.com
- **GitHub** : EzoCode
- **Langue** : Français (toutes les cartes Anki en français, conversations en français)
- **Profil** : Autodidacte passionné, utilise Anki intensivement pour mémoriser des livres entiers. Veut la meilleure qualité possible, pas de compromis. Exigeant sur la densité et la justesse du contenu.

### Préférences strictes
- **JAMAIS de em dash** (tiret cadratin) nulle part
- Quand tu écris un mail, **toujours proposer des objets**
- Cartes denses et riches (15-25 lignes de back), jamais courtes/légères
- Fronts de cartes = purs déclencheurs de situation réelle, ZÉRO indice sur la réponse
- Qualité maximale demandée explicitement : "fait la meilleure qualité possible"

---

## 2. ENVIRONNEMENT TECHNIQUE

### Anki Desktop (Mac)
- AnkiConnect installé (addon 2055492159) sur `localhost:8765`
- Le sandbox ne peut PAS accéder à localhost directement
- Il faut passer par **Chrome MCP javascript_tool** : naviguer vers `http://localhost:8765` puis faire des `fetch()` en JS
- Toujours commencer par `tabs_context_mcp` pour obtenir un tabId valide
- Si AnkiConnect ne répond pas : vérifier qu'Anki Desktop tourne, sinon demander à l'utilisateur de le relancer

### Chrome MCP
- Utilisé pour piloter AnkiConnect via fetch() dans le navigateur
- Attention : le tabId change quand on relance le navigateur ou quand l'onglet est fermé
- Batch max : 2 cartes par appel `addNotes` (limite de taille du javascript_tool)
- Pour pousser beaucoup de cartes : générer les données en Python, puis pousser par batch de 2 via JS

### GitHub
- Repo privé : `EzoCode/anki-addons-custom`
- Contient actuellement : `.gitignore` seulement (les fichiers des addons n'ont pas encore été push)
- Le repo est initialisé dans `~/Library/Application Support/Anki2/addons21/`
- Commande pour push les addons (déjà copiée dans le presse-papier de l'utilisateur, peut ne pas avoir été exécutée) :
  ```
  cd ~/Library/Application\ Support/Anki2/addons21 && git add anki_motivation/ sticky_card_template/ && git commit -m "Add addon files: anki_motivation + sticky_card_template" && git push
  ```

### Terminal Mac
- Restriction de sécurité : tier "click" seulement (pas de saisie clavier)
- Pour exécuter des commandes sur le Mac de l'utilisateur : utiliser `write_clipboard` puis demander à l'utilisateur de coller dans Terminal

---

## 3. PROJETS ANKI COMPLÉTÉS

### Personal MBA (TERMINÉ)
- **Livre** : The Personal MBA de Josh Kaufman
- **Deck** : `Daily 🎯::Sage 🏛️::📕 Personal MBA`
- **285 cartes** poussées avec succès dans Anki
- **Note type** : "Basic" (l'utilisateur a dit qu'il les changerait lui-même)
- **Fichiers** : `pmba_ch1_cards.json` à `pmba_ch11_cards.json`, `pmba_listings.json`, `pmba_listings_v2.json`
- Ce projet est FINI, ne pas y toucher

---

## 4. PROJET EN COURS : Principes de Dalio

### Source
- **Livre** : "Principles" de Ray Dalio
- **Texte extrait** : `/sessions/adoring-sweet-lamport/dalio_full.txt` (11 312 lignes, ~690K caractères, 374 pages)
- Couvre l'intégralité : Life Principles (Part II) + Work Principles (Part III)

### Structure du livre
#### Life Principles (5 chapitres, 40 sous-principes)
1. **Ch.1** : Embrace Reality and Deal with It (10 sous-principes : 1.1-1.10, avec nombreux sous-sous-points comme 1.3a, 1.3b, 1.4a-d, 1.5a-e, 1.6a-c, 1.7a-b, 1.10a-h)
2. **Ch.2** : Use the 5-Step Process (7 sous-principes)
3. **Ch.3** : Be Radically Open-Minded (6 sous-principes)
4. **Ch.4** : Understand That People Are Wired Very Differently (5 sous-principes)
5. **Ch.5** : Learn How to Make Decisions Effectively (12 sous-principes)

#### Work Principles (16 chapitres, 99 sous-principes)
- Ch.1-16 couvrant culture, management, décisions, recrutement, etc.
- **Total** : 139 sous-principes à couvrir

### Ce qui existe dans Anki

#### Note type "Dalio Principles" (CRÉÉ, STYLISÉ)
- CSS complet appliqué : rouge sombre + noir
- Light mode : `--accent: #8B0000`, fond `#faf8f6` (warm cream)
- Night mode : `--accent: #cd3c3c`, fond `#0a0a0a`
- Font : Inter / SF Pro Display
- Tags : pills rouge sombre
- Templates Front/Back avec système "prettify-flashcard" (deck path, tags as pills, accent line, divider)
- Le CSS complet est dans `/sessions/adoring-sweet-lamport/dalio_style.css`

#### Deck
- Nom : `Daily 🎯::Sage 🏛️::📕 Principes Dalio`
- Créé dans Anki

#### Cartes existantes (PROBLÈME)
- **~10 cartes du Ch.1 ont été poussées dans Anki**
- **MAIS L'UTILISATEUR A REJETÉ LA QUALITÉ DES FRONTS**
- Les fronts étaient trop longs, rigides, donnaient trop d'indices
- L'utilisateur a dit que c'était nul comparé aux cartes Personal MBA
- **ACTION REQUISE : Supprimer TOUTES les cartes existantes du deck Dalio et RECOMMENCER le Ch.1 depuis zéro**

### Spécifications du deck Dalio

#### Tags
```
src::principes-dalio type::{type} ch::{XX-slug} skill::{skill}
```
- **Types** : `principe`, `liste`, `mecanisme`, `application`, `synthese`
- **Skills** : `vie`, `travail`, `management`, `decision`, `culture`
- **Chapitres** : `ch::01-embrasser-la-realite`, `ch::02-processus-en-5-etapes`, etc.

#### Types de cartes à produire par principe
1. **Cartes individuelles** (type::principe) : une par sous-sous-point (ex: 1.3a, 1.3b)
2. **Cartes mécanisme** (type::mecanisme) : comment/pourquoi ça fonctionne
3. **Cartes application** (type::application) : mise en pratique concrète
4. **Cartes synthèse/holistic** (type::synthese) : carte LONGUE couvrant TOUS les sous-points d'un principe d'un coup (ex: une carte pour tout 1.3, une pour tout 1.4)
5. **Méga-synthèse** : une carte par chapitre entier
6. **Cartes listing** (type::liste) : inventaire par sous-catégories thématiques nommées (PAS "Partie 1/3" mais des noms de groupes logiques)

#### Densité des backs
- 15-25 lignes minimum avec contenu RÉEL du livre
- Exemples concrets de Dalio, mécanismes expliqués en détail
- Chaque back doit contenir : concept (FR + EN), explication dense, exemple du livre, punchline, real-life trigger, Bloom level, chaîne, note logique
- L'utilisateur a rejeté les cartes courtes ("ça va pas du tout")

#### RÈGLE CRITIQUE : Les fronts
**C'est LE point qui a posé problème et qui a mené au restart.**

Les fronts doivent être :
- Des DÉCLENCHEURS de situation réelle (pas des questions d'examen)
- **ZÉRO indice** sur la réponse (pas de synonyme, pas de paraphrase du concept)
- Décrivent un **PROBLÈME ou une SITUATION**, jamais la solution
- **Test** : si tu peux deviner la réponse en lisant le front, c'est raté, réécris-le
- Courts et percutants, pas des pavés
- Format : emoji + ref chapitre + situation + question

**Mauvais exemples de fronts (ce qui a été rejeté) :**
- Front trop long de 10 lignes décrivant tout le contexte
- Front qui nomme presque le concept
- Front qui paraphrase la définition
- Front qui contient des synonymes de la réponse

**Bons fronts (style Personal MBA qui fonctionnait) :**
- Situation concrète de la vie réelle
- Question ouverte qui force le rappel actif
- Aucun mot-clé de la réponse

#### Format technique d'une note
```json
{
  "deckName": "Daily 🎯::Sage 🏛️::📕 Principes Dalio",
  "modelName": "Dalio Principles",
  "fields": {"Front": "...", "Back": "..."},
  "tags": ["src::principes-dalio", "type::principe", "ch::01-embrasser-la-realite", "skill::vie"]
}
```

### Fichiers existants du projet Dalio
- `/sessions/adoring-sweet-lamport/dalio_full.txt` : texte intégral du livre (NE PAS RÉGÉNÉRER)
- `/sessions/adoring-sweet-lamport/dalio_style.css` : CSS du note type (DÉJÀ APPLIQUÉ)
- `/sessions/adoring-sweet-lamport/gen_dalio_ch1.py` : script génération Ch.1 (FRONTS À REFAIRE)
- `/sessions/adoring-sweet-lamport/dalio_ch1_cards.json` : 37 cartes Ch.1 (FRONTS À REFAIRE)
- `/sessions/adoring-sweet-lamport/dalio_ch1_sample5.json` : échantillon initial rejeté
- `/sessions/adoring-sweet-lamport/dalio_ch1_v2_sample5.json` : 2e version

---

## 5. MÉTHODOLOGIE DE GÉNÉRATION DE CARTES

### Skill anki-agent
Le skill `anki-agent` est installé. **TOUJOURS lire** les fichiers de référence avant de générer :
- `references/card-methodology.md` : règles de formulation des cartes
- `references/sticky-images.md` : pour les descriptions d'images
- `references/csv-format.md` : pour l'export CSV

### Règles clés de la méthodologie
1. **80% Basic / 20% Cloze** (cloze UNIQUEMENT pour séquences, groupes fermés, tables)
2. **1 carte = 1 concept = 1 histoire**
3. **JAMAIS** le nom du concept dans la question
4. Formulation active : pourquoi/comment, pas juste quoi
5. Difficulté désirable : pas d'indices évidents
6. Chaque carte a : punchline, real-life trigger, Bloom level, chaîne, notes/logique
7. **Montrer 5 cartes sample** pour validation AVANT de générer le reste
8. Max 20 cartes à la fois sans checkpoint

### Workflow recommandé
1. Lire le chapitre dans `dalio_full.txt`
2. Mapper tous les sous-principes et sous-sous-points
3. Générer les cartes en Python (script de génération)
4. Exporter en JSON
5. Montrer 5 samples à l'utilisateur
6. Si validé, pousser via Chrome MCP javascript_tool par batch de 2
7. Vérifier le count avec `findNotes`

### Commandes AnkiConnect clés
```javascript
// Créer le deck
{"action": "createDeck", "version": 6, "params": {"deck": "Daily 🎯::Sage 🏛️::📕 Principes Dalio"}}

// Ajouter des cartes (batch de 2 max)
{"action": "addNotes", "version": 6, "params": {"notes": [...]}}

// Chercher les cartes existantes
{"action": "findNotes", "version": 6, "params": {"query": "deck:\"Daily 🎯::Sage 🏛️::📕 Principes Dalio\""}}

// Supprimer des cartes
{"action": "deleteNotes", "version": 6, "params": {"notes": [noteId1, noteId2, ...]}}

// Mettre à jour le CSS
{"action": "updateModelStyling", "version": 6, "params": {"model": {"name": "Dalio Principles", "css": "..."}}}
```

---

## 6. ADDONS ANKI CUSTOM

### anki_motivation
- Système de gamification : streaks, achievements (11), session stats, dashboard
- Popup motivationnel après chaque session
- Menu : Tools > Motivation Dashboard
- Fichiers : `__init__.py` (627 lignes), `config.json`, `manifest.json`, `config.md`, `README.md`

### sticky_card_template
- Template de carte avec 12 champs spécialisés (Front, Back, Image, Audio, Bloom, Chain, Punchline, Trigger, etc.)
- 2 types de cartes : Basic + Cloze
- Support dark mode, responsive mobile
- CSS avec gradients, couleurs vivantes
- Fichiers : `__init__.py`, `manifest.json`, `front_template.html`, `back_template.html`, `styling.css`, `README.md`

### Synchronisation GitHub
- Repo : `github.com/EzoCode/anki-addons-custom` (privé)
- Status : repo créé avec `.gitignore`, mais les fichiers des addons n'ont PAS encore été push
- Le git est initialisé dans `~/Library/Application Support/Anki2/addons21/`
- L'utilisateur doit encore exécuter la commande de push

---

## 7. ERREURS À NE PAS RÉPÉTER

### Fronts trop longs et indice-laden
Le problème #1 de la session précédente. Les fronts du Ch.1 de Dalio étaient des pavés de 8-10 lignes qui paraphrasaient le concept. L'utilisateur les a rejetés catégoriquement. **Toujours tester : si tu peux deviner la réponse en lisant le front, réécris-le.**

### Cartes trop courtes
Les premiers samples avaient 4-5 lignes de back. L'utilisateur a dit "ça va pas du tout". Il veut des backs de 15-25 lignes avec le vrai contenu du livre, pas des résumés légers.

### Chrome MCP tab ID périmé
Le tabId change quand Anki/le navigateur redémarre. Toujours appeler `tabs_context_mcp` en début de session pour obtenir le bon tabId.

### AnkiConnect timeout
Si `fetch('http://localhost:8765')` échoue : Anki Desktop n'est probablement pas ouvert. Demander à l'utilisateur de le relancer.

### JSON escaping dans javascript_tool
Quand on passe du JSON pré-sérialisé dans le body du fetch, les quotes conflictuent. Utiliser `JSON.stringify()` sur des objets JS, pas des strings pré-sérialisées.

### f-strings Python avec accolades JS
Les f-strings Python avec du code JS qui utilise {} provoquent des erreurs de syntaxe. Utiliser la concaténation de strings ou `.format()` à la place.

### Listing cards avec "Partie X/Y"
L'utilisateur veut des sous-catégories thématiques NOMMÉES, pas des labels génériques.

### Fichiers HTML servis depuis le sandbox
Le sandbox tourne sur une machine différente du navigateur Chrome de l'utilisateur. `localhost:8888` depuis le sandbox n'est PAS accessible depuis Chrome. Toujours passer par Chrome MCP javascript_tool pour communiquer avec AnkiConnect.

---

## 8. PLAN D'ACTION POUR CETTE CONVERSATION

### Priorité immédiate
1. Supprimer les ~10 cartes existantes du deck Dalio dans Anki
2. Relire le texte du Ch.1 dans `dalio_full.txt` (lignes 1-800 environ)
3. Relire `references/card-methodology.md` du skill anki-agent
4. Régénérer le Ch.1 avec des fronts de qualité (courts, situation réelle, zéro indice)
5. Montrer 5 cartes sample pour validation

### Ensuite
6. Pousser le Ch.1 validé
7. Continuer Ch.2 à Ch.5 (Life Principles)
8. Puis Ch.1-16 (Work Principles)
9. Cartes listing thématiques par chapitre
10. Vérification finale du deck complet

---

## 9. RAPPELS IMPORTANTS

- L'utilisateur dit souvent "c'est bon" ou "ok" pour valider, et "ça va pas" ou "c'est nul" pour rejeter
- Il préfère qu'on agisse directement plutôt que de demander confirmation
- Il est technique (développeur, GitHub, Anki power user)
- Ne pas hésiter à lire les fichiers source du livre pour extraire le vrai contenu de Dalio
- La qualité des cartes est NON NÉGOCIABLE : c'est le coeur du projet
- Toujours utiliser le skill anki-agent et ses références avant de générer
