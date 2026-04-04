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


def get_xp_for_level(level: int) -> int:
    """Get total XP required to reach a given level."""
    if level <= 1:
        return 0
    if level in _BASE_XP_TABLE:
        return _BASE_XP_TABLE[level]
    # After level 50: each level adds 11,000 more than previous
    base = _BASE_XP_TABLE[50]
    for lvl in range(51, level + 1):
        base += 11000 + (lvl - 50) * 500  # slight acceleration
    return base


def get_level_for_xp(xp: int) -> int:
    """Get the level for a given amount of XP."""
    level = 1
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
        {"type": "crop", "id": "wheat", "name": "Wheat", "emoji": "\U0001F33E"},
        {"type": "crop", "id": "corn", "name": "Corn", "emoji": "\U0001F33D"},
    ],
    3: [
        {"type": "crop", "id": "carrot", "name": "Carrot", "emoji": "\U0001F955"},
        {"type": "plots", "count": 2, "id": "plots_3", "name": "+2 Plots"},
    ],
    5: [
        {"type": "building", "id": "bakery", "name": "Bakery", "emoji": "\U0001F3ED"},
        {"type": "plots", "count": 2, "id": "plots_5", "name": "+2 Plots"},
    ],
    7: [
        {"type": "feature", "id": "roadside_shop", "name": "Roadside Shop", "emoji": "\U0001F3EA"},
    ],
    10: [
        {"type": "crop", "id": "tomato", "name": "Tomato", "emoji": "\U0001F345"},
        {"type": "animal", "id": "cow", "name": "Cow", "emoji": "\U0001F404"},
        {"type": "plots", "count": 2, "id": "plots_10", "name": "+2 Plots"},
    ],
    12: [
        {"type": "crop", "id": "soybean", "name": "Soybean", "emoji": "\U0001FAD8"},
    ],
    14: [
        {"type": "feature", "id": "merchant_tom", "name": "Merchant Tom", "emoji": "\U0001F9D4"},
    ],
    15: [
        {"type": "crop", "id": "potato", "name": "Potato", "emoji": "\U0001F954"},
        {"type": "building", "id": "sugar_mill", "name": "Sugar Mill", "emoji": "\U0001F3ED"},
        {"type": "crop", "id": "sugarcane", "name": "Sugarcane", "emoji": "\U0001F33F"},
        {"type": "plots", "count": 2, "id": "plots_15", "name": "+2 Plots"},
    ],
    17: [
        {"type": "feature", "id": "boat_dock", "name": "Boat Dock", "emoji": "\u26F5"},
    ],
    18: [
        {"type": "feature", "id": "derby", "name": "Derby", "emoji": "\U0001F3C7"},
    ],
    20: [
        {"type": "crop", "id": "strawberry", "name": "Strawberry", "emoji": "\U0001F353"},
        {"type": "animal", "id": "chicken", "name": "Chicken", "emoji": "\U0001F414"},
        {"type": "plots", "count": 2, "id": "plots_20", "name": "+2 Plots"},
    ],
    24: [
        {"type": "feature", "id": "mine", "name": "Mine", "emoji": "\u26CF\uFE0F"},
    ],
    25: [
        {"type": "building", "id": "dairy", "name": "Dairy", "emoji": "\U0001F95B"},
        {"type": "plots", "count": 2, "id": "plots_25", "name": "+2 Plots"},
    ],
    27: [
        {"type": "feature", "id": "fishing", "name": "Fishing Pond", "emoji": "\U0001F3A3"},
    ],
    30: [
        {"type": "crop", "id": "apple", "name": "Apple", "emoji": "\U0001F34E"},
        {"type": "animal", "id": "pig", "name": "Pig", "emoji": "\U0001F416"},
        {"type": "plots", "count": 2, "id": "plots_30", "name": "+2 Plots"},
    ],
    34: [
        {"type": "feature", "id": "town", "name": "Town", "emoji": "\U0001F3D8\uFE0F"},
    ],
    35: [
        {"type": "building", "id": "bbq", "name": "BBQ Grill", "emoji": "\U0001F356"},
        {"type": "plots", "count": 2, "id": "plots_35", "name": "+2 Plots"},
    ],
    40: [
        {"type": "building", "id": "pastry_shop", "name": "Pastry Shop", "emoji": "\U0001F370"},
        {"type": "crop", "id": "pumpkin", "name": "Pumpkin", "emoji": "\U0001F383"},
        {"type": "plots", "count": 2, "id": "plots_40", "name": "+2 Plots"},
    ],
    45: [
        {"type": "building", "id": "jam_maker", "name": "Jam Maker", "emoji": "\U0001F36F"},
    ],
    50: [
        {"type": "building", "id": "pizzeria", "name": "Pizzeria", "emoji": "\U0001F355"},
        {"type": "plots", "count": 2, "id": "plots_50", "name": "+2 Plots"},
    ],
    55: [
        {"type": "building", "id": "juice_press", "name": "Juice Press", "emoji": "\U0001F9C3"},
    ],
    60: [
        {"type": "animal", "id": "sheep", "name": "Sheep", "emoji": "\U0001F411"},
        {"type": "plots", "count": 1, "id": "plots_60", "name": "+1 Plot"},
    ],
    70: [
        {"type": "building", "id": "pie_oven", "name": "Pie Oven", "emoji": "\U0001F967"},
        {"type": "plots", "count": 1, "id": "plots_70", "name": "+1 Plot"},
    ],
    80: [
        {"type": "building", "id": "candy_machine", "name": "Candy Machine", "emoji": "\U0001F36C"},
        {"type": "plots", "count": 1, "id": "plots_80", "name": "+1 Plot"},
    ],
    90: [
        {"type": "building", "id": "pottery", "name": "Pottery Workshop", "emoji": "\U0001F3FA"},
        {"type": "plots", "count": 1, "id": "plots_90", "name": "+1 Plot"},
    ],
    100: [
        {"type": "feature", "id": "sanctuary", "name": "Sanctuary", "emoji": "\U0001F3DE\uFE0F"},
        {"type": "plots", "count": 1, "id": "plots_100", "name": "+1 Plot"},
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
        "name": "Wheat",
        "emoji": "\U0001F33E",
        "unlock_level": 1,
        "growth_reviews": 3,    # Reviews per growth stage
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 2,
        "xp_per_harvest": 3,
    },
    "corn": {
        "name": "Corn",
        "emoji": "\U0001F33D",
        "unlock_level": 1,
        "growth_reviews": 4,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 3,
        "xp_per_harvest": 4,
    },
    "carrot": {
        "name": "Carrot",
        "emoji": "\U0001F955",
        "unlock_level": 3,
        "growth_reviews": 5,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 4,
        "xp_per_harvest": 5,
    },
    "tomato": {
        "name": "Tomato",
        "emoji": "\U0001F345",
        "unlock_level": 10,
        "growth_reviews": 6,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 5,
        "xp_per_harvest": 6,
    },
    "potato": {
        "name": "Potato",
        "emoji": "\U0001F954",
        "unlock_level": 15,
        "growth_reviews": 5,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 4,
        "xp_per_harvest": 5,
    },
    "sugarcane": {
        "name": "Sugarcane",
        "emoji": "\U0001F33F",
        "unlock_level": 15,
        "growth_reviews": 7,
        "harvest_min": 2,
        "harvest_max": 4,
        "sell_price": 5,
        "xp_per_harvest": 6,
    },
    "soybean": {
        "name": "Soybean",
        "emoji": "\U0001FAD8",
        "unlock_level": 12,
        "growth_reviews": 4,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 4,
        "xp_per_harvest": 4,
    },
    "strawberry": {
        "name": "Strawberry",
        "emoji": "\U0001F353",
        "unlock_level": 20,
        "growth_reviews": 8,
        "harvest_min": 2,
        "harvest_max": 3,
        "sell_price": 7,
        "xp_per_harvest": 8,
    },
    "apple": {
        "name": "Apple",
        "emoji": "\U0001F34E",
        "unlock_level": 30,
        "growth_reviews": 10,
        "harvest_min": 3,
        "harvest_max": 5,
        "sell_price": 6,
        "xp_per_harvest": 7,
    },
    "pumpkin": {
        "name": "Pumpkin",
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
        "name": "Bakery",
        "emoji": "\U0001F3ED",
        "unlock_level": 5,
        "cost_coins": 50,
        "max_queue": 3,
        "description": "Bake bread and cookies from wheat and eggs.",
    },
    "sugar_mill": {
        "name": "Sugar Mill",
        "emoji": "\U0001F3ED",
        "unlock_level": 15,
        "cost_coins": 200,
        "max_queue": 2,
        "description": "Process sugarcane into sugar.",
    },
    "dairy": {
        "name": "Dairy",
        "emoji": "\U0001F95B",
        "unlock_level": 25,
        "cost_coins": 500,
        "max_queue": 3,
        "description": "Turn milk into butter, cheese, and cream.",
    },
    "bbq": {
        "name": "BBQ Grill",
        "emoji": "\U0001F356",
        "unlock_level": 35,
        "cost_coins": 1000,
        "max_queue": 2,
        "description": "Grill burgers from bread and bacon.",
    },
    "pastry_shop": {
        "name": "Pastry Shop",
        "emoji": "\U0001F370",
        "unlock_level": 40,
        "cost_coins": 2000,
        "max_queue": 3,
        "description": "Bake cakes, cookies, and pastries.",
    },
    "jam_maker": {
        "name": "Jam Maker",
        "emoji": "\U0001F36F",
        "unlock_level": 45,
        "cost_coins": 1500,
        "max_queue": 2,
        "description": "Make jams from fruits and sugar.",
    },
    "pizzeria": {
        "name": "Pizzeria",
        "emoji": "\U0001F355",
        "unlock_level": 50,
        "cost_coins": 5000,
        "max_queue": 3,
        "description": "Craft pizzas from bread, tomatoes, and cheese.",
    },
    "juice_press": {
        "name": "Juice Press",
        "emoji": "\U0001F9C3",
        "unlock_level": 55,
        "cost_coins": 3000,
        "max_queue": 2,
        "description": "Squeeze fresh juice from fruits.",
    },
    "pie_oven": {
        "name": "Pie Oven",
        "emoji": "\U0001F967",
        "unlock_level": 70,
        "cost_coins": 8000,
        "max_queue": 3,
        "description": "Bake delicious pies from fruits and pastry.",
    },
}


# =============================================================================
# ANIMAL DEFINITIONS
# =============================================================================

ANIMAL_DEFINITIONS = {
    "cow": {
        "name": "Cow",
        "emoji": "\U0001F404",
        "unlock_level": 10,
        "cost_coins": 100,
        "product": "milk",
        "product_emoji": "\U0001F95B",
        "produce_every_n_reviews": 10,  # Produce 1 milk every 10 reviews
        "max_owned": 5,
    },
    "chicken": {
        "name": "Chicken",
        "emoji": "\U0001F414",
        "unlock_level": 20,
        "cost_coins": 50,
        "product": "egg",
        "product_emoji": "\U0001F95A",
        "produce_every_n_reviews": 8,
        "max_owned": 8,
    },
    "pig": {
        "name": "Pig",
        "emoji": "\U0001F416",
        "unlock_level": 30,
        "cost_coins": 200,
        "product": "bacon",
        "product_emoji": "\U0001F953",
        "produce_every_n_reviews": 15,
        "max_owned": 4,
    },
    "sheep": {
        "name": "Sheep",
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
    "fence": {"name": "Wooden Fence", "emoji": "\U0001FAB5", "cost": 10, "category": "basic"},
    "flower_pot": {"name": "Flower Pot", "emoji": "\U0001FAB4", "cost": 25, "category": "basic"},
    "bench": {"name": "Bench", "emoji": "\U0001FA91", "cost": 50, "category": "basic"},
    "scarecrow": {"name": "Scarecrow", "emoji": "\U0001F383", "cost": 75, "category": "basic"},
    "hay_bale": {"name": "Hay Bale", "emoji": "\U0001F33E", "cost": 15, "category": "basic"},
    "mailbox": {"name": "Mailbox", "emoji": "\U0001F4EA", "cost": 30, "category": "basic"},
    "lamp_post": {"name": "Lamp Post", "emoji": "\U0001F4A1", "cost": 40, "category": "basic"},
    "garden_gnome": {"name": "Garden Gnome", "emoji": "\U0001F9D4", "cost": 60, "category": "premium"},
    "bird_bath": {"name": "Bird Bath", "emoji": "\U0001F426", "cost": 80, "category": "premium"},
    "tree_oak": {"name": "Oak Tree", "emoji": "\U0001F333", "cost": 100, "category": "nature"},
    "tree_pine": {"name": "Pine Tree", "emoji": "\U0001F332", "cost": 90, "category": "nature"},
    "picnic_table": {"name": "Picnic Table", "emoji": "\U0001F3D5\uFE0F", "cost": 120, "category": "premium"},
    "pond": {"name": "Pond", "emoji": "\U0001F4A7", "cost": 150, "category": "nature"},
    "swing": {"name": "Swing", "emoji": "\U0001F3A0", "cost": 180, "category": "premium"},
    "fountain": {"name": "Fountain", "emoji": "\u26F2", "cost": 200, "category": "premium"},
    "statue_chicken": {"name": "Chicken Statue", "emoji": "\U0001F414", "cost": 250, "category": "special"},
    "tree_cherry": {"name": "Cherry Blossom", "emoji": "\U0001F338", "cost": 300, "category": "special"},
    "arch_flowers": {"name": "Flower Arch", "emoji": "\U0001F490", "cost": 350, "category": "special"},
    "statue_cow": {"name": "Golden Cow", "emoji": "\U0001F404", "cost": 400, "category": "special"},
    "windmill_deco": {"name": "Windmill", "emoji": "\U0001F3E1", "cost": 500, "category": "special"},
}


# =============================================================================
# PLOT GROWTH STAGE DESCRIPTIONS
# =============================================================================

GROWTH_STAGES = {
    0: {"name": "Seed", "emoji": "\U0001F331", "description": "Just planted"},
    1: {"name": "Sprout", "emoji": "\U0001F33F", "description": "Starting to grow"},
    2: {"name": "Growing", "emoji": "\U0001F33E", "description": "Growing well"},
    3: {"name": "Flowering", "emoji": "\U0001F33C", "description": "Almost ready"},
    4: {"name": "Ready", "emoji": "\u2705", "description": "Ready to harvest!"},
}

WILTED_STAGE = {"name": "Wilted", "emoji": "\U0001F342", "description": "Needs attention"}
