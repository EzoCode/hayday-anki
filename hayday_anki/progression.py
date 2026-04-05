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
        {"type": "crop", "id": "wheat", "name": "Blé", "emoji": "\U0001F33E"},
        {"type": "crop", "id": "corn", "name": "Maïs", "emoji": "\U0001F33D"},
    ],
    3: [
        {"type": "crop", "id": "carrot", "name": "Carotte", "emoji": "\U0001F955"},
        {"type": "plots", "count": 2, "id": "plots_3", "name": "+2 Parcelles"},
    ],
    5: [
        {"type": "building", "id": "bakery", "name": "Boulangerie", "emoji": "\U0001F3ED"},
        {"type": "plots", "count": 2, "id": "plots_5", "name": "+2 Parcelles"},
    ],
    7: [
        {"type": "feature", "id": "roadside_shop", "name": "Échoppe", "emoji": "\U0001F3EA"},
    ],
    10: [
        {"type": "crop", "id": "tomato", "name": "Tomate", "emoji": "\U0001F345"},
        {"type": "animal", "id": "cow", "name": "Vache", "emoji": "\U0001F404"},
        {"type": "plots", "count": 2, "id": "plots_10", "name": "+2 Parcelles"},
    ],
    12: [
        {"type": "crop", "id": "soybean", "name": "Soja", "emoji": "\U0001FAD8"},
    ],
    14: [
        {"type": "feature", "id": "merchant_tom", "name": "Marchand Tom", "emoji": "\U0001F9D4"},
    ],
    15: [
        {"type": "crop", "id": "potato", "name": "Patate", "emoji": "\U0001F954"},
        {"type": "building", "id": "sugar_mill", "name": "Sucrerie", "emoji": "\U0001F3ED"},
        {"type": "crop", "id": "sugarcane", "name": "Canne à sucre", "emoji": "\U0001F33F"},
        {"type": "plots", "count": 2, "id": "plots_15", "name": "+2 Parcelles"},
    ],
    17: [
        {"type": "feature", "id": "boat_dock", "name": "Quai", "emoji": "\u26F5"},
    ],
    18: [
        {"type": "feature", "id": "derby", "name": "Derby", "emoji": "\U0001F3C7"},
    ],
    20: [
        {"type": "crop", "id": "strawberry", "name": "Fraise", "emoji": "\U0001F353"},
        {"type": "animal", "id": "chicken", "name": "Poule", "emoji": "\U0001F414"},
        {"type": "plots", "count": 2, "id": "plots_20", "name": "+2 Parcelles"},
    ],
    24: [
        {"type": "feature", "id": "mine", "name": "Mine", "emoji": "\u26CF\uFE0F"},
    ],
    25: [
        {"type": "building", "id": "dairy", "name": "Laiterie", "emoji": "\U0001F95B"},
        {"type": "plots", "count": 2, "id": "plots_25", "name": "+2 Parcelles"},
    ],
    27: [
        {"type": "feature", "id": "fishing", "name": "Étang de pêche", "emoji": "\U0001F3A3"},
    ],
    30: [
        {"type": "crop", "id": "apple", "name": "Pomme", "emoji": "\U0001F34E"},
        {"type": "animal", "id": "pig", "name": "Cochon", "emoji": "\U0001F416"},
        {"type": "plots", "count": 2, "id": "plots_30", "name": "+2 Parcelles"},
    ],
    34: [
        {"type": "feature", "id": "town", "name": "Ville", "emoji": "\U0001F3D8\uFE0F"},
    ],
    35: [
        {"type": "building", "id": "bbq", "name": "Barbecue", "emoji": "\U0001F356"},
        {"type": "plots", "count": 2, "id": "plots_35", "name": "+2 Parcelles"},
    ],
    40: [
        {"type": "building", "id": "pastry_shop", "name": "Pâtisserie", "emoji": "\U0001F370"},
        {"type": "crop", "id": "pumpkin", "name": "Citrouille", "emoji": "\U0001F383"},
        {"type": "plots", "count": 2, "id": "plots_40", "name": "+2 Parcelles"},
    ],
    45: [
        {"type": "building", "id": "jam_maker", "name": "Confiturerie", "emoji": "\U0001F36F"},
    ],
    50: [
        {"type": "building", "id": "pizzeria", "name": "Pizzeria", "emoji": "\U0001F355"},
        {"type": "plots", "count": 2, "id": "plots_50", "name": "+2 Parcelles"},
    ],
    55: [
        {"type": "building", "id": "juice_press", "name": "Pressoir", "emoji": "\U0001F9C3"},
    ],
    60: [
        {"type": "animal", "id": "sheep", "name": "Mouton", "emoji": "\U0001F411"},
        {"type": "plots", "count": 1, "id": "plots_60", "name": "+1 Parcelle"},
    ],
    70: [
        {"type": "building", "id": "pie_oven", "name": "Four à tartes", "emoji": "\U0001F967"},
        {"type": "plots", "count": 1, "id": "plots_70", "name": "+1 Parcelle"},
    ],
    80: [
        {"type": "building", "id": "candy_machine", "name": "Machine à bonbons", "emoji": "\U0001F36C"},
        {"type": "plots", "count": 1, "id": "plots_80", "name": "+1 Parcelle"},
    ],
    90: [
        {"type": "building", "id": "pottery", "name": "Poterie", "emoji": "\U0001F3FA"},
        {"type": "plots", "count": 1, "id": "plots_90", "name": "+1 Parcelle"},
    ],
    100: [
        {"type": "feature", "id": "sanctuary", "name": "Sanctuaire", "emoji": "\U0001F3DE\uFE0F"},
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


# =============================================================================
# CROP DEFINITIONS
# =============================================================================

CROP_DEFINITIONS = {
    "wheat": {
        "name": "Blé",
        "emoji": "\U0001F33E",
        "unlock_level": 1,
        "growth_reviews": 3,    # Reviews per growth stage
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 2,
        "xp_per_harvest": 3,
    },
    "corn": {
        "name": "Maïs",
        "emoji": "\U0001F33D",
        "unlock_level": 1,
        "growth_reviews": 4,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 3,
        "xp_per_harvest": 4,
    },
    "carrot": {
        "name": "Carotte",
        "emoji": "\U0001F955",
        "unlock_level": 3,
        "growth_reviews": 5,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 4,
        "xp_per_harvest": 5,
    },
    "tomato": {
        "name": "Tomate",
        "emoji": "\U0001F345",
        "unlock_level": 10,
        "growth_reviews": 6,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 5,
        "xp_per_harvest": 6,
    },
    "potato": {
        "name": "Patate",
        "emoji": "\U0001F954",
        "unlock_level": 15,
        "growth_reviews": 5,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 4,
        "xp_per_harvest": 5,
    },
    "sugarcane": {
        "name": "Canne à sucre",
        "emoji": "\U0001F33F",
        "unlock_level": 15,
        "growth_reviews": 7,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 5,
        "xp_per_harvest": 6,
    },
    "soybean": {
        "name": "Soja",
        "emoji": "\U0001FAD8",
        "unlock_level": 12,
        "growth_reviews": 4,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 4,
        "xp_per_harvest": 4,
    },
    "strawberry": {
        "name": "Fraise",
        "emoji": "\U0001F353",
        "unlock_level": 20,
        "growth_reviews": 8,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 7,
        "xp_per_harvest": 8,
    },
    "apple": {
        "name": "Pomme",
        "emoji": "\U0001F34E",
        "unlock_level": 30,
        "growth_reviews": 10,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 6,
        "xp_per_harvest": 7,
    },
    "pumpkin": {
        "name": "Citrouille",
        "emoji": "\U0001F383",
        "unlock_level": 40,
        "growth_reviews": 12,
        "harvest_min": 1,
        "harvest_max": 3,
        "sell_price": 8,
        "xp_per_harvest": 10,
    },
}


# =============================================================================
# BUILDING DEFINITIONS
# =============================================================================

BUILDING_DEFINITIONS = {
    "bakery": {
        "name": "Boulangerie",
        "emoji": "\U0001F3ED",
        "unlock_level": 5,
        "cost_coins": 50,
        "max_queue": 3,
        "description": "Pain et cookies à partir de blé et d'œufs.",
    },
    "sugar_mill": {
        "name": "Sucrerie",
        "emoji": "\U0001F3ED",
        "unlock_level": 15,
        "cost_coins": 200,
        "max_queue": 2,
        "description": "Transforme la canne à sucre en sucre.",
    },
    "dairy": {
        "name": "Laiterie",
        "emoji": "\U0001F95B",
        "unlock_level": 25,
        "cost_coins": 500,
        "max_queue": 3,
        "description": "Beurre, fromage et crème à partir de lait.",
    },
    "bbq": {
        "name": "Barbecue",
        "emoji": "\U0001F356",
        "unlock_level": 35,
        "cost_coins": 1000,
        "max_queue": 2,
        "description": "Grille des burgers avec du pain et du bacon.",
    },
    "pastry_shop": {
        "name": "Pâtisserie",
        "emoji": "\U0001F370",
        "unlock_level": 40,
        "cost_coins": 2000,
        "max_queue": 3,
        "description": "Gâteaux, cookies et pâtisseries.",
    },
    "jam_maker": {
        "name": "Confiturerie",
        "emoji": "\U0001F36F",
        "unlock_level": 45,
        "cost_coins": 1500,
        "max_queue": 2,
        "description": "Confitures à partir de fruits et de sucre.",
    },
    "pizzeria": {
        "name": "Pizzeria",
        "emoji": "\U0001F355",
        "unlock_level": 50,
        "cost_coins": 5000,
        "max_queue": 3,
        "description": "Pizzas avec du pain, des tomates et du fromage.",
    },
    "juice_press": {
        "name": "Pressoir",
        "emoji": "\U0001F9C3",
        "unlock_level": 55,
        "cost_coins": 3000,
        "max_queue": 2,
        "description": "Jus frais à partir de fruits.",
    },
    "pie_oven": {
        "name": "Four à tartes",
        "emoji": "\U0001F967",
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
        "emoji": "\U0001F404",
        "unlock_level": 10,
        "cost_coins": 100,
        "product": "milk",
        "product_emoji": "\U0001F95B",
        "produce_every_n_reviews": 10,  # Produce 1 milk every 10 reviews
        "max_owned": 5,
    },
    "chicken": {
        "name": "Poule",
        "emoji": "\U0001F414",
        "unlock_level": 20,
        "cost_coins": 50,
        "product": "egg",
        "product_emoji": "\U0001F95A",
        "produce_every_n_reviews": 8,
        "max_owned": 8,
    },
    "pig": {
        "name": "Cochon",
        "emoji": "\U0001F416",
        "unlock_level": 30,
        "cost_coins": 200,
        "product": "bacon",
        "product_emoji": "\U0001F953",
        "produce_every_n_reviews": 15,
        "max_owned": 4,
    },
    "sheep": {
        "name": "Mouton",
        "emoji": "\U0001F411",
        "unlock_level": 60,
        "cost_coins": 500,
        "product": "wool",
        "product_emoji": "\U0001F9F6",
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
    "fence": {"name": "Clôture en bois", "emoji": "\U0001FAB5", "cost": 10, "category": "basic"},
    "flower_pot": {"name": "Pot de fleurs", "emoji": "\U0001FAB4", "cost": 25, "category": "basic"},
    "bench": {"name": "Banc", "emoji": "\U0001FA91", "cost": 50, "category": "basic"},
    "scarecrow": {"name": "Épouvantail", "emoji": "\U0001F383", "cost": 75, "category": "basic"},
    "hay_bale": {"name": "Botte de foin", "emoji": "\U0001F33E", "cost": 15, "category": "basic"},
    "mailbox": {"name": "Boite aux lettres", "emoji": "\U0001F4EA", "cost": 30, "category": "basic"},
    "lamp_post": {"name": "Lampadaire", "emoji": "\U0001F4A1", "cost": 40, "category": "basic"},
    "garden_gnome": {"name": "Nain de jardin", "emoji": "\U0001F9D4", "cost": 60, "category": "premium"},
    "bird_bath": {"name": "Bain d'oiseaux", "emoji": "\U0001F426", "cost": 80, "category": "premium"},
    "tree_oak": {"name": "Chene", "emoji": "\U0001F333", "cost": 100, "category": "nature"},
    "tree_pine": {"name": "Sapin", "emoji": "\U0001F332", "cost": 90, "category": "nature"},
    "picnic_table": {"name": "Table de pique-nique", "emoji": "\U0001F3D5\uFE0F", "cost": 120, "category": "premium"},
    "pond": {"name": "Mare", "emoji": "\U0001F4A7", "cost": 150, "category": "nature"},
    "swing": {"name": "Balancoire", "emoji": "\U0001F3A0", "cost": 180, "category": "premium"},
    "fountain": {"name": "Fontaine", "emoji": "\u26F2", "cost": 200, "category": "premium"},
    "statue_chicken": {"name": "Statue Poule", "emoji": "\U0001F414", "cost": 250, "category": "special"},
    "tree_cherry": {"name": "Cerisier en fleurs", "emoji": "\U0001F338", "cost": 300, "category": "special"},
    "arch_flowers": {"name": "Arche fleurie", "emoji": "\U0001F490", "cost": 350, "category": "special"},
    "statue_cow": {"name": "Vache doree", "emoji": "\U0001F404", "cost": 400, "category": "special"},
    "windmill_deco": {"name": "Moulin", "emoji": "\U0001F3E1", "cost": 500, "category": "special"},
}


# =============================================================================
# PLOT GROWTH STAGE DESCRIPTIONS
# =============================================================================

GROWTH_STAGES = {
    0: {"name": "Graine", "emoji": "\U0001F331", "description": "Vient d'être planté"},
    1: {"name": "Pousse", "emoji": "\U0001F33F", "description": "Commence à pousser"},
    2: {"name": "Croissance", "emoji": "\U0001F33E", "description": "Pousse bien"},
    3: {"name": "Floraison", "emoji": "\U0001F33C", "description": "Bientôt prêt"},
    4: {"name": "Prêt", "emoji": "\u2705", "description": "Prêt à récolter !"},
}

WILTED_STAGE = {"name": "Fané", "emoji": "\U0001F342", "description": "A besoin d'attention"}
