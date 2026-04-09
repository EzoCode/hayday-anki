"""
Progression System — XP, levels, unlock tables, crop/building/animal definitions.

Mirrors Hay Day's progression curve:
- Irregular XP requirements through level 50
- +11,000 XP per level after level 50
- Content unlocks through level 126
- Gem rewards scaling with level
- Intermediate thresholds within levels for micro-rewards
"""

from typing import Dict, List, Optional, Tuple

# =============================================================================
# XP TABLE
# =============================================================================

# Levels 1-50: hand-tuned irregular progression (like Hay Day)
# After 50: each level = previous + 11,000
_BASE_XP_TABLE = {
    1: 0,
    2: 20,
    3: 50,
    4: 100,
    5: 170,
    6: 260,
    7: 380,
    8: 530,
    9: 720,
    10: 950,
    11: 1230,
    12: 1560,
    13: 1950,
    14: 2400,
    15: 2920,
    16: 3510,
    17: 4180,
    18: 4930,
    19: 5770,
    20: 6700,
    21: 7730,
    22: 8870,
    23: 10120,
    24: 11490,
    25: 12990,
    26: 14620,
    27: 16400,
    28: 18330,
    29: 20430,
    30: 22700,
    31: 25150,
    32: 27800,
    33: 30650,
    34: 33720,
    35: 37020,
    36: 40560,
    37: 44360,
    38: 48420,
    39: 52770,
    40: 57420,
    41: 62400,
    42: 67720,
    43: 73400,
    44: 79460,
    45: 85920,
    46: 92800,
    47: 100120,
    48: 107900,
    49: 116160,
    50: 124920,
}


_xp_cache: dict = {}  # level -> cumulative XP


def get_xp_for_level(level: int) -> int:
    """Get total XP required to reach a given level (cached)."""
    if level <= 1:
        return 0
    if level in _xp_cache:
        return _xp_cache[level]
    if level in _BASE_XP_TABLE:
        _xp_cache[level] = _BASE_XP_TABLE[level]
        return _xp_cache[level]
    # After level 50: each level adds 11,000 more than previous
    base = get_xp_for_level(50)
    for lvl in range(51, level + 1):
        base += 11000 + (lvl - 50) * 500  # slight acceleration
        _xp_cache[lvl] = base
    return base


# Pre-built sorted list for binary search in get_level_for_xp
_level_thresholds: list = []  # [(xp, level), ...] sorted by xp


def _ensure_level_thresholds():
    """Build threshold list up to level 200 for fast lookup."""
    if _level_thresholds:
        return
    for lvl in range(1, 201):
        _level_thresholds.append((get_xp_for_level(lvl), lvl))


def get_level_for_xp(xp: int) -> int:
    """Get the level for a given amount of XP (binary search, then linear for extremes)."""
    _ensure_level_thresholds()
    # Binary search in pre-built thresholds (covers levels 1-200)
    lo, hi = 0, len(_level_thresholds) - 1
    level = 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if _level_thresholds[mid][0] <= xp:
            level = _level_thresholds[mid][1]
            lo = mid + 1
        else:
            hi = mid - 1
    # If beyond level 200, continue linearly from there
    if level >= 200:
        while get_xp_for_level(level + 1) <= xp:
            level += 1
            if level > 9999:
                break
    return level


# =============================================================================
# INTERMEDIATE THRESHOLDS (mini-milestones within each level)
# =============================================================================

def get_intermediate_thresholds(level: int) -> int:
    """Get number of intermediate reward thresholds within a level."""
    if level < 15:
        return 0
    if level < 25:
        return 1
    if level < 40:
        return 2
    if level < 60:
        return 3
    if level < 85:
        return 4
    return 5


def get_threshold_rewards(level: int, threshold_index: int) -> Dict:
    """Get reward for hitting an intermediate threshold."""
    import random
    rewards = [
        {"coins": 10 + level * 2},
        {"gems": 1},
        {"item": "bolt", "qty": 1},
        {"item": "plank", "qty": 1},
        {"coins": 5 + level},
    ]
    return rewards[threshold_index % len(rewards)]


# =============================================================================
# GEM REWARDS PER LEVEL
# =============================================================================

def get_gem_reward_for_level(level: int) -> int:
    """Get gem reward for reaching a specific level."""
    # Milestone bonuses
    if level == 100:
        return 50
    if level == 200:
        return 100
    if level == 300:
        return 200
    if level == 500:
        return 400
    if level == 1000:
        return 1000

    # Regular rewards
    if level < 10:
        return 0
    if level < 37:
        return 1
    if level < 100:
        return 2
    if level < 500:
        return 5
    if level < 1000:
        return 10
    return 25


# =============================================================================
# UNLOCK TABLE
# =============================================================================

# Each entry: level -> list of unlocks
UNLOCK_TABLE: Dict[int, List[Dict]] = {
    1: [
        {"type": "crop", "id": "wheat", "name": "Blé"},
        {"type": "crop", "id": "corn", "name": "Maïs"},
    ],
    3: [
        {"type": "crop", "id": "turnip", "name": "Navet"},
        {"type": "plots", "count": 2, "id": "plots_3", "name": "+2 Parcelles"},
    ],
    5: [
        {"type": "building", "id": "bakery", "name": "Boulangerie"},
        {"type": "plots", "count": 2, "id": "plots_5", "name": "+2 Parcelles"},
    ],
    7: [
        {"type": "feature", "id": "roadside_shop", "name": "Échoppe"},
    ],
    10: [
        {"type": "crop", "id": "tomato", "name": "Tomate"},
        {"type": "animal", "id": "cow", "name": "Vache"},
        {"type": "plots", "count": 2, "id": "plots_10", "name": "+2 Parcelles"},
    ],
    12: [
        {"type": "crop", "id": "cucumber", "name": "Concombre"},
    ],
    15: [
        {"type": "crop", "id": "potato", "name": "Patate"},
        {"type": "building", "id": "sugar_mill", "name": "Sucrerie"},
        {"type": "crop", "id": "rice", "name": "Riz"},
        {"type": "plots", "count": 2, "id": "plots_15", "name": "+2 Parcelles"},
    ],
    17: [
        {"type": "feature", "id": "boat_dock", "name": "Quai"},
    ],
    20: [
        {"type": "crop", "id": "strawberry", "name": "Fraise"},
        {"type": "animal", "id": "chicken", "name": "Poule"},
        {"type": "plots", "count": 2, "id": "plots_20", "name": "+2 Parcelles"},
    ],
    22: [
        {"type": "crop", "id": "eggplant", "name": "Aubergine"},
    ],
    25: [
        {"type": "crop", "id": "lemon", "name": "Citron"},
        {"type": "building", "id": "dairy", "name": "Laiterie"},
        {"type": "plots", "count": 2, "id": "plots_25", "name": "+2 Parcelles"},
    ],
    28: [
        {"type": "crop", "id": "tulip", "name": "Tulipe"},
    ],
    30: [
        {"type": "crop", "id": "orange", "name": "Orange"},
        {"type": "animal", "id": "pig", "name": "Cochon"},
        {"type": "plots", "count": 2, "id": "plots_30", "name": "+2 Parcelles"},
    ],
    32: [
        {"type": "crop", "id": "sunflower", "name": "Tournesol"},
    ],
    35: [
        {"type": "crop", "id": "pineapple", "name": "Ananas"},
        {"type": "building", "id": "bbq", "name": "Barbecue"},
        {"type": "plots", "count": 2, "id": "plots_35", "name": "+2 Parcelles"},
    ],
    40: [
        {"type": "building", "id": "pastry_shop", "name": "Pâtisserie"},
        {"type": "crop", "id": "melon", "name": "Melon"},
        {"type": "plots", "count": 2, "id": "plots_40", "name": "+2 Parcelles"},
    ],
    45: [
        {"type": "crop", "id": "grapes", "name": "Raisin"},
        {"type": "building", "id": "jam_maker", "name": "Confiturerie"},
    ],
    48: [
        {"type": "crop", "id": "rose", "name": "Rose"},
    ],
    50: [
        {"type": "building", "id": "pizzeria", "name": "Pizzeria"},
        {"type": "plots", "count": 2, "id": "plots_50", "name": "+2 Parcelles"},
    ],
    55: [
        {"type": "crop", "id": "coffee", "name": "Café"},
        {"type": "building", "id": "juice_press", "name": "Pressoir"},
    ],
    60: [
        {"type": "animal", "id": "sheep", "name": "Mouton"},
        {"type": "plots", "count": 1, "id": "plots_60", "name": "+1 Parcelle"},
    ],
    65: [
        {"type": "crop", "id": "avocado", "name": "Avocat"},
    ],
    70: [
        {"type": "building", "id": "pie_oven", "name": "Four à tartes"},
        {"type": "plots", "count": 1, "id": "plots_70", "name": "+1 Parcelle"},
    ],
    75: [
        {"type": "crop", "id": "cassava", "name": "Manioc"},
    ],
    80: [
        {"type": "plots", "count": 1, "id": "plots_80", "name": "+1 Parcelle"},
    ],
    90: [
        {"type": "plots", "count": 1, "id": "plots_90", "name": "+1 Parcelle"},
    ],
    100: [
        {"type": "feature", "id": "sanctuary", "name": "Sanctuaire"},
        {"type": "plots", "count": 1, "id": "plots_100", "name": "+1 Parcelle"},
    ],
}


def get_unlocks_for_level(level: int) -> List[Dict]:
    """Get all unlocks for a specific level."""
    return UNLOCK_TABLE.get(level, [])


def get_all_unlocks_up_to(level: int) -> List[Dict]:
    """Get all unlocks from level 1 to the given level."""
    unlocks = []
    for lvl in sorted(UNLOCK_TABLE.keys()):
        if lvl <= level:
            unlocks.extend(UNLOCK_TABLE[lvl])
    return unlocks


def get_next_unlocks(current_level: int) -> Optional[Dict]:
    """Get the next unlock milestone and its contents. Returns None if no more unlocks."""
    for lvl in sorted(UNLOCK_TABLE.keys()):
        if lvl > current_level:
            # Filter out plots-only levels — find one with a meaningful unlock
            unlocks = UNLOCK_TABLE[lvl]
            meaningful = [u for u in unlocks if u["type"] in ("crop", "building", "animal", "feature")]
            if meaningful:
                return {"level": lvl, "unlocks": unlocks}
    return None


# =============================================================================
# CROP DEFINITIONS
# =============================================================================

CROP_DEFINITIONS = {
    "wheat": {
        "name": "Blé",
        "unlock_level": 1,
        "growth_reviews": 3,    # Reviews per growth stage (x4 stages = 12 total)
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 2,
        "xp_per_harvest": 3,
        "plant_cost": 0,        # Starter crop — free to plant
    },
    "corn": {
        "name": "Maïs",
        "unlock_level": 1,
        "growth_reviews": 4,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 3,
        "xp_per_harvest": 4,
        "plant_cost": 1,
    },
    "turnip": {
        "name": "Navet",
        "unlock_level": 3,
        "growth_reviews": 5,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 4,
        "xp_per_harvest": 5,
        "plant_cost": 2,
    },
    "tomato": {
        "name": "Tomate",
        "unlock_level": 10,
        "growth_reviews": 6,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 5,
        "xp_per_harvest": 6,
        "plant_cost": 3,
    },
    "cucumber": {
        "name": "Concombre",
        "unlock_level": 12,
        "growth_reviews": 4,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 4,
        "xp_per_harvest": 4,
        "plant_cost": 2,
    },
    "potato": {
        "name": "Patate",
        "unlock_level": 15,
        "growth_reviews": 5,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 4,
        "xp_per_harvest": 5,
        "plant_cost": 2,
    },
    "rice": {
        "name": "Riz",
        "unlock_level": 15,
        "growth_reviews": 7,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 5,
        "xp_per_harvest": 6,
        "plant_cost": 3,
    },
    "strawberry": {
        "name": "Fraise",
        "unlock_level": 20,
        "growth_reviews": 8,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 7,
        "xp_per_harvest": 8,
        "plant_cost": 4,
    },
    "eggplant": {
        "name": "Aubergine",
        "unlock_level": 22,
        "growth_reviews": 6,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 5,
        "xp_per_harvest": 6,
        "plant_cost": 3,
    },
    "lemon": {
        "name": "Citron",
        "unlock_level": 25,
        "growth_reviews": 8,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 6,
        "xp_per_harvest": 7,
        "plant_cost": 4,
    },
    "orange": {
        "name": "Orange",
        "unlock_level": 30,
        "growth_reviews": 10,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 6,
        "xp_per_harvest": 7,
        "plant_cost": 4,
    },
    "sunflower": {
        "name": "Tournesol",
        "unlock_level": 32,
        "growth_reviews": 9,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 8,
        "xp_per_harvest": 9,
        "plant_cost": 5,
    },
    "pineapple": {
        "name": "Ananas",
        "unlock_level": 35,
        "growth_reviews": 10,
        "harvest_min": 1,
        "harvest_max": 3,
        "sell_price": 9,
        "xp_per_harvest": 10,
        "plant_cost": 5,
    },
    "melon": {
        "name": "Melon",
        "unlock_level": 40,
        "growth_reviews": 12,
        "harvest_min": 1,
        "harvest_max": 3,
        "sell_price": 8,
        "xp_per_harvest": 10,
        "plant_cost": 5,
    },
    "grapes": {
        "name": "Raisin",
        "unlock_level": 45,
        "growth_reviews": 11,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 9,
        "xp_per_harvest": 11,
        "plant_cost": 6,
    },
    "coffee": {
        "name": "Café",
        "unlock_level": 55,
        "growth_reviews": 14,
        "harvest_min": 1,
        "harvest_max": 3,
        "sell_price": 12,
        "xp_per_harvest": 14,
        "plant_cost": 8,
    },
    "tulip": {
        "name": "Tulipe",
        "unlock_level": 28,
        "growth_reviews": 7,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 7,
        "xp_per_harvest": 7,
        "plant_cost": 4,
    },
    "rose": {
        "name": "Rose",
        "unlock_level": 48,
        "growth_reviews": 12,
        "harvest_min": 1,
        "harvest_max": 3,
        "sell_price": 11,
        "xp_per_harvest": 12,
        "plant_cost": 7,
    },
    "avocado": {
        "name": "Avocat",
        "unlock_level": 65,
        "growth_reviews": 13,
        "harvest_min": 1,
        "harvest_max": 2,
        "sell_price": 14,
        "xp_per_harvest": 15,
        "plant_cost": 9,
    },
    "cassava": {
        "name": "Manioc",
        "unlock_level": 75,
        "growth_reviews": 15,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 13,
        "xp_per_harvest": 16,
        "plant_cost": 10,
    },
}


# =============================================================================
# BUILDING DEFINITIONS
# =============================================================================

BUILDING_DEFINITIONS = {
    "bakery": {
        "name": "Boulangerie",
        "unlock_level": 5,
        "cost_coins": 50,
        "max_queue": 3,
        "description": "Pain et cookies à partir de blé et d'œufs.",
    },
    "sugar_mill": {
        "name": "Sucrerie",
        "unlock_level": 15,
        "cost_coins": 200,
        "max_queue": 2,
        "description": "Transforme le riz en sucre.",
    },
    "dairy": {
        "name": "Laiterie",
        "unlock_level": 25,
        "cost_coins": 500,
        "max_queue": 3,
        "description": "Beurre, fromage et crème à partir de lait.",
    },
    "bbq": {
        "name": "Barbecue",
        "unlock_level": 35,
        "cost_coins": 1000,
        "max_queue": 2,
        "description": "Grille des burgers avec du pain et du bacon.",
    },
    "pastry_shop": {
        "name": "Pâtisserie",
        "unlock_level": 40,
        "cost_coins": 2000,
        "max_queue": 3,
        "description": "Gâteaux, cookies et pâtisseries.",
    },
    "jam_maker": {
        "name": "Confiturerie",
        "unlock_level": 45,
        "cost_coins": 1500,
        "max_queue": 2,
        "description": "Confitures à partir de fruits et de sucre.",
    },
    "pizzeria": {
        "name": "Pizzeria",
        "unlock_level": 50,
        "cost_coins": 5000,
        "max_queue": 3,
        "description": "Pizzas avec du pain, des tomates et du fromage.",
    },
    "juice_press": {
        "name": "Pressoir",
        "unlock_level": 55,
        "cost_coins": 3000,
        "max_queue": 3,
        "description": "Jus frais à partir de fruits.",
    },
    "pie_oven": {
        "name": "Four à tartes",
        "unlock_level": 70,
        "cost_coins": 8000,
        "max_queue": 3,
        "description": "Tartes délicieuses aux fruits.",
    },
}


# =============================================================================
# ANIMAL DEFINITIONS
# =============================================================================

ANIMAL_DEFINITIONS = {
    "cow": {
        "name": "Vache",
        "unlock_level": 10,
        "cost_coins": 100,
        "product": "milk",
        "produce_every_n_reviews": 10,  # Produce 1 milk every 10 reviews
        "max_owned": 5,
    },
    "chicken": {
        "name": "Poule",
        "unlock_level": 20,
        "cost_coins": 50,
        "product": "egg",
        "produce_every_n_reviews": 8,
        "max_owned": 8,
    },
    "pig": {
        "name": "Cochon",
        "unlock_level": 30,
        "cost_coins": 200,
        "product": "bacon",
        "produce_every_n_reviews": 15,
        "max_owned": 4,
    },
    "sheep": {
        "name": "Mouton",
        "unlock_level": 60,
        "cost_coins": 500,
        "product": "wool",
        "produce_every_n_reviews": 20,
        "max_owned": 3,
    },
}


# =============================================================================
# DECORATION DEFINITIONS & COSTS
# =============================================================================

DECORATION_COSTS = {
    "fence": 10,
    "flower_pot": 25,
    "bench": 50,
    "scarecrow": 75,
    "fountain": 200,
    "windmill_deco": 500,
    "pond": 150,
    "lamp_post": 40,
    "hay_bale": 15,
    "garden_gnome": 60,
    "bird_bath": 80,
    "picnic_table": 120,
    "tree_oak": 100,
    "tree_pine": 90,
    "tree_cherry": 300,
    "statue_chicken": 250,
    "statue_cow": 400,
    "arch_flowers": 350,
    "swing": 180,
    "mailbox": 30,
}

DECORATION_CATALOG = {
    "fence": {"name": "Clôture en bois", "cost": 10, "category": "basic"},
    "flower_pot": {"name": "Pot de fleurs", "cost": 25, "category": "basic"},
    "bench": {"name": "Banc", "cost": 50, "category": "basic"},
    "scarecrow": {"name": "Épouvantail", "cost": 75, "category": "basic"},
    "hay_bale": {"name": "Botte de foin", "cost": 15, "category": "basic"},
    "mailbox": {"name": "Boite aux lettres", "cost": 30, "category": "basic"},
    "lamp_post": {"name": "Lampadaire", "cost": 40, "category": "basic"},
    "garden_gnome": {"name": "Nain de jardin", "cost": 60, "category": "premium"},
    "bird_bath": {"name": "Bain d'oiseaux", "cost": 80, "category": "premium"},
    "tree_oak": {"name": "Chene", "cost": 100, "category": "nature"},
    "tree_pine": {"name": "Sapin", "cost": 90, "category": "nature"},
    "picnic_table": {"name": "Table de pique-nique", "cost": 120, "category": "premium"},
    "pond": {"name": "Mare", "cost": 150, "category": "nature"},
    "swing": {"name": "Balancoire", "cost": 180, "category": "premium"},
    "fountain": {"name": "Fontaine", "cost": 200, "category": "premium"},
    "statue_chicken": {"name": "Statue Poule", "cost": 250, "category": "special"},
    "tree_cherry": {"name": "Cerisier en fleurs", "cost": 300, "category": "special"},
    "arch_flowers": {"name": "Arche fleurie", "cost": 350, "category": "special"},
    "statue_cow": {"name": "Vache doree", "cost": 400, "category": "special"},
    "windmill_deco": {"name": "Moulin", "cost": 500, "category": "special"},
}


# =============================================================================
# PLOT GROWTH STAGE DESCRIPTIONS
# =============================================================================

GROWTH_STAGES = {
    0: {"name": "Graine", "description": "Vient d'être planté"},
    1: {"name": "Pousse", "description": "Commence à pousser"},
    2: {"name": "Croissance", "description": "Pousse bien"},
    3: {"name": "Floraison", "description": "Bientôt prêt"},
    4: {"name": "Prêt", "description": "Prêt à récolter !"},
}

WILTED_STAGE = {"name": "Fané", "description": "A besoin d'attention"}
