"""
Farm Manager - Core farm state, economy, inventory, and persistence.
Handles coins, gems, items, storage, plots, and buildings.
"""

import json
import os
import random
import time
from pathlib import Path
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional, Any, Tuple


ADDON_DIR = Path(__file__).parent
DATA_DIR = ADDON_DIR / "user_files"
SAVE_FILE = DATA_DIR / "farm_save.json"

DATA_DIR.mkdir(exist_ok=True)

# Schema version — bump when FarmState structure changes
SAVE_SCHEMA_VERSION = 2


# --- Item Definitions ---

ITEM_CATALOG = {
    # Raw materials (from reviews)
    "wheat": {"name": "Blé", "emoji": "\U0001F33E", "category": "crop", "sell_price": 2, "xp": 1},
    "corn": {"name": "Maïs", "emoji": "\U0001F33D", "category": "crop", "sell_price": 3, "xp": 2},
    "carrot": {"name": "Carotte", "emoji": "\U0001F955", "category": "crop", "sell_price": 4, "xp": 2},
    "tomato": {"name": "Tomate", "emoji": "\U0001F345", "category": "crop", "sell_price": 5, "xp": 3},
    "potato": {"name": "Patate", "emoji": "\U0001F954", "category": "crop", "sell_price": 4, "xp": 2},
    "strawberry": {"name": "Fraise", "emoji": "\U0001F353", "category": "crop", "sell_price": 7, "xp": 4},
    "apple": {"name": "Pomme", "emoji": "\U0001F34E", "category": "crop", "sell_price": 6, "xp": 3},
    "sugarcane": {"name": "Canne à sucre", "emoji": "\U0001F33F", "category": "crop", "sell_price": 5, "xp": 3},
    "soybean": {"name": "Soja", "emoji": "\U0001FAD8", "category": "crop", "sell_price": 4, "xp": 2},
    "pumpkin": {"name": "Citrouille", "emoji": "\U0001F383", "category": "crop", "sell_price": 8, "xp": 5},

    # Animal products
    "milk": {"name": "Lait", "emoji": "\U0001F95B", "category": "animal_product", "sell_price": 8, "xp": 4},
    "egg": {"name": "Œuf", "emoji": "\U0001F95A", "category": "animal_product", "sell_price": 6, "xp": 3},
    "wool": {"name": "Laine", "emoji": "\U0001F9F6", "category": "animal_product", "sell_price": 10, "xp": 5},
    "bacon": {"name": "Bacon", "emoji": "\U0001F953", "category": "animal_product", "sell_price": 12, "xp": 6},

    # Processed goods
    "bread": {"name": "Pain", "emoji": "\U0001F35E", "category": "processed", "sell_price": 10, "xp": 5},
    "butter": {"name": "Beurre", "emoji": "\U0001F9C8", "category": "processed", "sell_price": 12, "xp": 6},
    "cheese": {"name": "Fromage", "emoji": "\U0001F9C0", "category": "processed", "sell_price": 15, "xp": 7},
    "cake": {"name": "Gâteau", "emoji": "\U0001F370", "category": "processed", "sell_price": 25, "xp": 12},
    "cookie": {"name": "Cookie", "emoji": "\U0001F36A", "category": "processed", "sell_price": 18, "xp": 8},
    "sugar": {"name": "Sucre", "emoji": "\U0001F36C", "category": "processed", "sell_price": 8, "xp": 4},
    "cream": {"name": "Crème", "emoji": "\U0001F95B", "category": "processed", "sell_price": 14, "xp": 6},
    "pizza": {"name": "Pizza", "emoji": "\U0001F355", "category": "processed", "sell_price": 30, "xp": 15},
    "burger": {"name": "Burger", "emoji": "\U0001F354", "category": "processed", "sell_price": 35, "xp": 18},
    "pie": {"name": "Tarte", "emoji": "\U0001F967", "category": "processed", "sell_price": 28, "xp": 14},
    "jam": {"name": "Confiture", "emoji": "\U0001F36F", "category": "processed", "sell_price": 20, "xp": 10},
    "juice": {"name": "Jus", "emoji": "\U0001F9C3", "category": "processed", "sell_price": 16, "xp": 8},

    # Upgrade materials (random drops)
    "bolt": {"name": "Boulon", "emoji": "\U0001F529", "category": "material", "sell_price": 0, "xp": 0},
    "plank": {"name": "Planche", "emoji": "\U0001FAB5", "category": "material", "sell_price": 0, "xp": 0},
    "duct_tape": {"name": "Ruban adhésif", "emoji": "\U0001FA79", "category": "material", "sell_price": 0, "xp": 0},
    "nail": {"name": "Clou", "emoji": "\U0001F4CC", "category": "material", "sell_price": 0, "xp": 0},
    "screw": {"name": "Vis", "emoji": "\U0001FA9B", "category": "material", "sell_price": 0, "xp": 0},
    "paint": {"name": "Peinture", "emoji": "\U0001F3A8", "category": "material", "sell_price": 0, "xp": 0},
    "land_deed": {"name": "Titre foncier", "emoji": "\U0001F4DC", "category": "material", "sell_price": 0, "xp": 0},
    "expansion_permit": {"name": "Permis d'expansion", "emoji": "\U0001F3D7\uFE0F", "category": "material", "sell_price": 0, "xp": 0},

    # Decorations
    "fence": {"name": "Clôture", "emoji": "\U0001FAB5", "category": "decoration", "sell_price": 5, "xp": 2},
    "flower_pot": {"name": "Pot de fleurs", "emoji": "\U0001FAB4", "category": "decoration", "sell_price": 10, "xp": 3},
    "bench": {"name": "Banc", "emoji": "\U0001FA91", "category": "decoration", "sell_price": 15, "xp": 5},
    "fountain": {"name": "Fontaine", "emoji": "\u26F2", "category": "decoration", "sell_price": 50, "xp": 15},
    "scarecrow": {"name": "Épouvantail", "emoji": "\U0001F383", "category": "decoration", "sell_price": 20, "xp": 7},
    "windmill_deco": {"name": "Moulin", "emoji": "\U0001F3E1", "category": "decoration", "sell_price": 100, "xp": 25},
}


# --- Random Drop Tables ---

MATERIAL_DROP_TABLE = [
    ("bolt", 0.25),
    ("plank", 0.25),
    ("duct_tape", 0.15),
    ("nail", 0.15),
    ("screw", 0.10),
    ("paint", 0.05),
    ("land_deed", 0.03),
    ("expansion_permit", 0.02),
]

MYSTERY_BOX_REWARDS = {
    "small": {
        "cost_gems": 0,
        "rewards": [
            ({"coins": 10}, 0.30),
            ({"coins": 25}, 0.20),
            ({"item": "bolt", "qty": 2}, 0.15),
            ({"item": "plank", "qty": 2}, 0.15),
            ({"gems": 1}, 0.10),
            ({"item": "nail", "qty": 3}, 0.10),
        ],
    },
    "medium": {
        "cost_gems": 3,
        "rewards": [
            ({"coins": 50}, 0.25),
            ({"coins": 100}, 0.15),
            ({"item": "duct_tape", "qty": 3}, 0.15),
            ({"gems": 3}, 0.15),
            ({"item": "expansion_permit", "qty": 1}, 0.10),
            ({"coins": 200}, 0.10),
            ({"gems": 5}, 0.10),
        ],
    },
    "large": {
        "cost_gems": 10,
        "rewards": [
            ({"coins": 200}, 0.20),
            ({"coins": 500}, 0.15),
            ({"gems": 5}, 0.15),
            ({"gems": 10}, 0.10),
            ({"item": "land_deed", "qty": 2}, 0.15),
            ({"item": "expansion_permit", "qty": 2}, 0.10),
            ({"coins": 1000}, 0.05),
            ({"gems": 25}, 0.10),
        ],
    },
}


class FarmState:
    """Complete farm state that can be serialized/deserialized."""

    def __init__(self):
        self.coins: int = 50  # Starting coins
        self.gems: int = 5  # Starting gems
        self.xp: int = 0
        self.level: int = 1
        self.total_reviews: int = 0
        self.total_correct: int = 0
        self.lifetime_reviews: int = 0

        # Inventory: item_id -> quantity
        self.inventory: Dict[str, int] = {}

        # Storage
        self.barn_capacity: int = 50
        self.barn_level: int = 1
        self.silo_capacity: int = 50
        self.silo_level: int = 1

        # Farm grid (plots)
        self.plots: List[Dict] = []
        self.num_plots: int = 6  # Starting plots
        self._init_plots()

        # Buildings owned: building_id -> {level, queue, ...}
        self.buildings: Dict[str, Dict] = {}

        # Animals owned: animal_id -> {count, last_collected, ...}
        self.animals: Dict[str, Dict] = {}

        # Decorations placed: list of {id, type, x, y}
        self.decorations: List[Dict] = []

        # Unlocked content
        self.unlocked_crops: List[str] = ["wheat", "corn"]
        self.unlocked_buildings: List[str] = []
        self.unlocked_animals: List[str] = []

        # Streaks
        self.current_streak: int = 0
        self.best_streak: int = 0
        self.last_review_date: Optional[str] = None

        # Daily
        self.last_wheel_spin: Optional[str] = None
        self.daily_mystery_boxes_opened: int = 0
        self.last_mystery_box_date: Optional[str] = None

        # Timestamps
        self.created_at: str = datetime.now().isoformat()
        self.last_session: Optional[str] = None

        # Pending mystery boxes on farm
        self.mystery_boxes: List[Dict] = []

        # Session tracking
        self.session_coins_earned: int = 0
        self.session_xp_earned: int = 0
        self.session_items_earned: Dict[str, int] = {}
        self.session_reviews: int = 0

        # Production queues: building_id -> [{"recipe_id", "started_session", "ready": bool}]
        self.production_queues: Dict[str, List[Dict]] = {}

        # Achievements: achievement_id -> {unlocked_at, ...}
        self.achievements: Dict[str, Dict] = {}

        # Daily login
        self.last_login_date: Optional[str] = None
        self.login_streak: int = 0

        # Events
        self.active_events: List[Dict] = []

        # Orders (truck/boat)
        self.active_orders: List[Dict] = []
        self.orders_completed: int = 0

        # Land system (new)
        self.land_total: int = 20      # Total land units available
        self.fields: List[Dict] = []   # Crop fields [{id, crop, state, growth_stage, reviews_needed, reviews_done, planted_at}]
        self.placed_buildings: List[Dict] = []  # [{id, building_type}]
        self.pastures: List[Dict] = []  # [{id, animal_type, count, reviews_since_last}]

        # Lifetime tracking counters (for achievements)
        self.total_harvests: int = 0
        self.total_coins_earned: int = 0
        self.total_coins_spent: int = 0
        self.total_items_sold: int = 0
        self.total_produced: int = 0
        self.mystery_boxes_opened: int = 0
        self.wheel_spins: int = 0
        self.materials_collected: int = 0
        self.total_sessions: int = 0

    def _init_plots(self):
        """Initialize farm plots."""
        self.plots = []
        for i in range(self.num_plots):
            self.plots.append({
                "id": i,
                "state": "empty",  # empty, planted, growing, ready, wilted
                "crop": None,
                "planted_at": None,
                "growth_stage": 0,  # 0-4 (seed, sprout, growing, flowering, ready)
                "reviews_needed": 0,  # Reviews needed to advance stage
                "reviews_done": 0,
            })

    def add_plots(self, count: int):
        """Add new plots to the farm."""
        start_id = len(self.plots)
        for i in range(count):
            self.plots.append({
                "id": start_id + i,
                "state": "empty",
                "crop": None,
                "planted_at": None,
                "growth_stage": 0,
                "reviews_needed": 0,
                "reviews_done": 0,
            })
        self.num_plots = len(self.plots)

    def get_inventory_count(self) -> int:
        """Get total items in inventory."""
        return sum(self.inventory.values())

    def get_barn_space(self) -> int:
        """Get remaining barn space."""
        material_count = sum(
            qty for item_id, qty in self.inventory.items()
            if ITEM_CATALOG.get(item_id, {}).get("category") == "material"
        )
        return self.barn_capacity - material_count

    def get_silo_space(self) -> int:
        """Get remaining silo space."""
        crop_count = sum(
            qty for item_id, qty in self.inventory.items()
            if ITEM_CATALOG.get(item_id, {}).get("category") in ("crop", "animal_product", "processed")
        )
        return self.silo_capacity - crop_count

    def add_item(self, item_id: str, quantity: int = 1) -> bool:
        """Add item to inventory. Returns False if no space."""
        cat = ITEM_CATALOG.get(item_id, {}).get("category", "")
        if cat == "material":
            if self.get_barn_space() < quantity:
                return False
        elif cat in ("crop", "animal_product", "processed"):
            if self.get_silo_space() < quantity:
                return False

        self.inventory[item_id] = self.inventory.get(item_id, 0) + quantity
        return True

    def remove_item(self, item_id: str, quantity: int = 1) -> bool:
        """Remove item from inventory. Returns False if insufficient."""
        current = self.inventory.get(item_id, 0)
        if current < quantity:
            return False
        self.inventory[item_id] = current - quantity
        if self.inventory[item_id] <= 0:
            del self.inventory[item_id]
        return True

    def to_dict(self) -> Dict:
        """Serialize state to dict."""
        return {
            "_schema_version": SAVE_SCHEMA_VERSION,
            "coins": self.coins,
            "gems": self.gems,
            "xp": self.xp,
            "level": self.level,
            "total_reviews": self.total_reviews,
            "total_correct": self.total_correct,
            "lifetime_reviews": self.lifetime_reviews,
            "inventory": self.inventory,
            "barn_capacity": self.barn_capacity,
            "barn_level": self.barn_level,
            "silo_capacity": self.silo_capacity,
            "silo_level": self.silo_level,
            "plots": self.plots,
            "num_plots": self.num_plots,
            "buildings": self.buildings,
            "animals": self.animals,
            "decorations": self.decorations,
            "unlocked_crops": self.unlocked_crops,
            "unlocked_buildings": self.unlocked_buildings,
            "unlocked_animals": self.unlocked_animals,
            "current_streak": self.current_streak,
            "best_streak": self.best_streak,
            "last_review_date": self.last_review_date,
            "last_wheel_spin": self.last_wheel_spin,
            "daily_mystery_boxes_opened": self.daily_mystery_boxes_opened,
            "last_mystery_box_date": self.last_mystery_box_date,
            "last_login_date": self.last_login_date,
            "login_streak": self.login_streak,
            "created_at": self.created_at,
            "last_session": self.last_session,
            "mystery_boxes": self.mystery_boxes,
            "production_queues": self.production_queues,
            "achievements": self.achievements,
            "active_events": self.active_events,
            "active_orders": self.active_orders,
            "orders_completed": self.orders_completed,
            "land_total": self.land_total,
            "fields": self.fields,
            "placed_buildings": self.placed_buildings,
            "pastures": self.pastures,
            "total_harvests": self.total_harvests,
            "total_coins_earned": self.total_coins_earned,
            "total_coins_spent": self.total_coins_spent,
            "total_items_sold": self.total_items_sold,
            "total_produced": self.total_produced,
            "mystery_boxes_opened": self.mystery_boxes_opened,
            "wheel_spins": self.wheel_spins,
            "materials_collected": self.materials_collected,
            "total_sessions": self.total_sessions,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "FarmState":
        """Deserialize state from dict with schema migration."""
        state = cls()
        saved_version = data.pop("_schema_version", 1)

        for key, value in data.items():
            if hasattr(state, key):
                setattr(state, key, value)

        # --- Schema migrations ---
        if saved_version < 2:
            # v2: added total_harvests, total_coins_earned, total_items_sold,
            #     total_produced, mystery_boxes_opened, wheel_spins,
            #     materials_collected tracking counters
            for attr, default in [
                ("total_harvests", 0), ("total_coins_earned", 0),
                ("total_items_sold", 0), ("total_produced", 0),
                ("mystery_boxes_opened", 0), ("wheel_spins", 0),
                ("materials_collected", 0), ("total_coins_spent", 0),
                ("total_sessions", 0),
            ]:
                if not hasattr(state, attr) or not isinstance(getattr(state, attr, None), int):
                    setattr(state, attr, default)

        # Migrate old plots to fields if needed
        if not state.fields and state.plots:
            for i, plot in enumerate(state.plots):
                if plot.get("state") != "empty":
                    state.fields.append({
                        "id": i,
                        "crop": plot.get("crop"),
                        "state": plot.get("state", "empty"),
                        "growth_stage": plot.get("growth_stage", 0),
                        "reviews_needed": plot.get("reviews_needed", 0),
                        "reviews_done": plot.get("reviews_done", 0),
                        "planted_at": plot.get("planted_at"),
                    })
            # Add some empty fields too
            if not state.fields:
                for i in range(3):
                    state.fields.append({"id": i, "crop": None, "state": "empty", "growth_stage": 0, "reviews_needed": 0, "reviews_done": 0, "planted_at": None})
        # Migrate old buildings dict to placed_buildings
        if not state.placed_buildings and state.buildings:
            for bid, bdata in state.buildings.items():
                state.placed_buildings.append({"id": len(state.placed_buildings), "building_type": bid})
        # Migrate old animals dict to pastures
        if not state.pastures and state.animals:
            for aid, adata in state.animals.items():
                if adata.get("count", 0) > 0:
                    state.pastures.append({"id": len(state.pastures), "animal_type": aid, "count": adata["count"], "reviews_since_last": adata.get("reviews_since_last", 0)})

        return state


class FarmManager:
    """Main farm manager handling all game logic."""

    def __init__(self):
        self.state = FarmState()
        self.load()
        self._pending_notifications: List[Dict] = []

    # --- Persistence ---

    def save(self):
        """Save farm state to disk with atomic write and backup."""
        try:
            DATA_DIR.mkdir(exist_ok=True)
            data = self.state.to_dict()
            json_str = json.dumps(data, indent=2)

            # Atomic write: write to temp file first, then rename
            tmp_file = SAVE_FILE.with_suffix(".tmp")
            with open(tmp_file, "w", encoding="utf-8") as f:
                f.write(json_str)

            # Keep one backup of previous save
            if SAVE_FILE.exists():
                backup_file = SAVE_FILE.with_suffix(".json.bak")
                try:
                    import shutil
                    shutil.copy2(SAVE_FILE, backup_file)
                except Exception:
                    pass

            # Atomic rename
            tmp_file.replace(SAVE_FILE)
        except Exception as e:
            print(f"[ADFarm] Error saving farm: {e}")

    def load(self):
        """Load farm state from disk, with backup fallback and validation."""
        for path in [SAVE_FILE, SAVE_FILE.with_suffix(".json.bak")]:
            try:
                if path.exists():
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if not isinstance(data, dict):
                        raise ValueError("Save file is not a valid dict")
                    self.state = FarmState.from_dict(data)
                    self._validate_state()
                    if path != SAVE_FILE:
                        print("[ADFarm] Recovered from backup save")
                    return
            except (json.JSONDecodeError, ValueError, Exception) as e:
                print(f"[ADFarm] Error loading {path.name}: {e}")
                continue
        print("[ADFarm] No valid save found, starting fresh")
        self.state = FarmState()

    def _validate_state(self):
        """Fix any corrupted or inconsistent state values."""
        s = self.state
        # Ensure non-negative currencies
        s.coins = max(0, int(s.coins) if isinstance(s.coins, (int, float)) else 0)
        s.gems = max(0, int(s.gems) if isinstance(s.gems, (int, float)) else 0)
        s.xp = max(0, int(s.xp) if isinstance(s.xp, (int, float)) else 0)
        s.level = max(1, int(s.level) if isinstance(s.level, (int, float)) else 1)

        # Ensure inventory values are positive integers
        if not isinstance(s.inventory, dict):
            s.inventory = {}
        s.inventory = {
            k: max(0, int(v)) for k, v in s.inventory.items()
            if isinstance(k, str) and isinstance(v, (int, float)) and v > 0
        }

        # Ensure plots list integrity
        if not isinstance(s.plots, list):
            s.plots = []
            s._init_plots()
        s.num_plots = len(s.plots)

        # Ensure storage levels are valid
        s.barn_level = max(1, int(s.barn_level) if isinstance(s.barn_level, (int, float)) else 1)
        s.silo_level = max(1, int(s.silo_level) if isinstance(s.silo_level, (int, float)) else 1)
        s.barn_capacity = max(50, int(s.barn_capacity) if isinstance(s.barn_capacity, (int, float)) else 50)
        s.silo_capacity = max(50, int(s.silo_capacity) if isinstance(s.silo_capacity, (int, float)) else 50)

        # Cap mystery boxes to prevent UI flooding
        if isinstance(s.mystery_boxes, list) and len(s.mystery_boxes) > 20:
            s.mystery_boxes = s.mystery_boxes[:20]

    # --- Review Processing ---

    def process_review(self, ease: int, card_ivl: int, card_factor: int) -> Dict:
        """
        Process a single card review. Returns rewards earned.
        ease: 1=Again, 2=Hard, 3=Good, 4=Easy
        card_ivl: card interval in days
        card_factor: card ease factor (2500 = 250%)
        """
        rewards = {
            "coins": 0,
            "xp": 0,
            "items": {},
            "mystery_box": None,
            "notifications": [],
        }

        # Base rewards by ease — reward correct SRS behavior
        # Again(1)=minimal, Hard(2)=less, Good(3)=standard, Easy(4)=mastery bonus
        coin_map = {1: 1, 2: 2, 3: 3, 4: 4}
        xp_map = {1: 1, 2: 3, 3: 5, 4: 6}

        base_coins = coin_map.get(ease, 2)
        base_xp = xp_map.get(ease, 3)

        # Difficulty bonus: harder cards (low factor) give more
        if card_factor > 0:
            difficulty_mult = max(1.0, (3000 - card_factor) / 1000)
        else:
            difficulty_mult = 1.0

        # Interval bonus: mature cards give slightly more
        maturity_bonus = min(card_ivl / 30, 2.0) if card_ivl > 0 else 0

        coins = int(base_coins * difficulty_mult + maturity_bonus)
        xp = int(base_xp * difficulty_mult + maturity_bonus)

        # Streak bonus: +5% per streak day, up to +50%
        streak_mult = 1.0 + min(self.state.current_streak * 0.05, 0.50)

        # Apply event multipliers
        coin_mult, xp_mult = self._get_event_multipliers()
        coins = int(coins * coin_mult * streak_mult)
        xp = int(xp * xp_mult * streak_mult)

        rewards["coins"] = coins
        rewards["xp"] = xp

        self.state.coins += coins
        self.state.xp += xp
        self.state.total_reviews += 1
        self.state.lifetime_reviews += 1
        self.state.total_coins_earned += coins
        self.state.session_coins_earned += coins
        self.state.session_xp_earned += xp
        self.state.session_reviews += 1

        if ease > 1:
            self.state.total_correct += 1

        # Determine crop drop based on level
        crop_drop = self._roll_crop_drop()
        if crop_drop:
            item_id, qty = crop_drop
            if self.state.add_item(item_id, qty):
                rewards["items"][item_id] = qty
                self.state.session_items_earned[item_id] = \
                    self.state.session_items_earned.get(item_id, 0) + qty

        # Random material drop (variable ratio reinforcement)
        if random.random() < 0.12:  # ~12% chance per review
            mat_id = self._roll_material_drop()
            if mat_id and self.state.add_item(mat_id, 1):
                rewards["items"][mat_id] = rewards["items"].get(mat_id, 0) + 1
                self.state.session_items_earned[mat_id] = \
                    self.state.session_items_earned.get(mat_id, 0) + 1
                self.state.materials_collected += 1

        # Mystery box chance (~1 in 20 reviews)
        if random.random() < 0.05:
            box_size = random.choices(
                ["small", "medium", "large"],
                weights=[0.6, 0.3, 0.1]
            )[0]
            box = {
                "size": box_size,
                "x": random.randint(1, 8),
                "y": random.randint(1, 6),
                "created_at": datetime.now().isoformat(),
            }
            self.state.mystery_boxes.append(box)
            rewards["mystery_box"] = box
            box_size_fr = {"small": "petite", "medium": "moyenne", "large": "grande"}.get(box_size, box_size)
            rewards["notifications"].append({
                "type": "mystery_box",
                "message": f"Une {box_size_fr} boîte mystère est apparue !",
            })

        # Advance crop growth on plots
        self._advance_plots()

        # Check level up
        level_up = self._check_level_up()
        if level_up:
            rewards["notifications"].append(level_up)

        self._pending_notifications.extend(rewards["notifications"])

        return rewards

    def _roll_crop_drop(self) -> Optional[Tuple[str, int]]:
        """Roll for a crop drop based on unlocked crops."""
        if random.random() < 0.35:  # 35% chance to get a crop
            available = self.state.unlocked_crops
            if available:
                crop = random.choice(available)
                return (crop, 1)
        return None

    def _roll_material_drop(self) -> Optional[str]:
        """Roll for a material drop from the drop table."""
        roll = random.random()
        cumulative = 0
        for item_id, weight in MATERIAL_DROP_TABLE:
            cumulative += weight
            if roll < cumulative:
                return item_id
        return "bolt"  # fallback

    def _advance_plots(self):
        """Advance ONE random growing field per review. Ready crops wilt after too long."""
        from . import progression

        # Pick one random active field to advance
        active = [f for f in self.state.fields if f["state"] in ("planted", "growing")]
        if active:
            field = random.choice(active)
            field["reviews_done"] += 1
            if field["reviews_done"] >= field["reviews_needed"]:
                field["growth_stage"] += 1
                field["reviews_done"] = 0
                if field["growth_stage"] >= 4:
                    field["state"] = "ready"
                    field["_ready_since"] = self.state.total_reviews
                else:
                    field["state"] = "growing"
                    # Keep reviews_needed consistent from crop definition
                    crop_def = progression.CROP_DEFINITIONS.get(field.get("crop", ""), {})
                    field["reviews_needed"] = max(1, crop_def.get("growth_reviews", 3) // 4)

        # Wilt check on all ready fields
        for field in self.state.fields:
            if field["state"] == "ready":
                ready_since = field.get("_ready_since", 0)
                if ready_since > 0 and self.state.total_reviews - ready_since > 50:
                    field["state"] = "wilted"

    def _get_event_multipliers(self) -> Tuple[float, float]:
        """Get active event multipliers for coins and XP (capped at 5x)."""
        coin_mult = 1.0
        xp_mult = 1.0
        now = datetime.now()
        for event in self.state.active_events:
            try:
                end = datetime.fromisoformat(event.get("ends_at", ""))
                if now < end:
                    coin_mult *= event.get("coin_multiplier", 1.0)
                    xp_mult *= event.get("xp_multiplier", 1.0)
            except (ValueError, TypeError):
                pass
        # Cap multipliers to prevent exponential stacking
        return min(coin_mult, 5.0), min(xp_mult, 5.0)

    def _check_level_up(self) -> Optional[Dict]:
        """Check if player leveled up and process unlocks."""
        from . import progression
        new_level = progression.get_level_for_xp(self.state.xp)
        if new_level > self.state.level:
            old_level = self.state.level
            self.state.level = new_level

            # Process unlocks for each level gained
            all_unlocks = []
            gem_reward = 0
            for lvl in range(old_level + 1, new_level + 1):
                unlocks = progression.get_unlocks_for_level(lvl)
                all_unlocks.extend(unlocks)
                gem_reward += progression.get_gem_reward_for_level(lvl)

                # Apply unlocks
                for unlock in unlocks:
                    if unlock["type"] == "crop":
                        if unlock["id"] not in self.state.unlocked_crops:
                            self.state.unlocked_crops.append(unlock["id"])
                    elif unlock["type"] == "building":
                        if unlock["id"] not in self.state.unlocked_buildings:
                            self.state.unlocked_buildings.append(unlock["id"])
                    elif unlock["type"] == "animal":
                        if unlock["id"] not in self.state.unlocked_animals:
                            self.state.unlocked_animals.append(unlock["id"])
                    elif unlock["type"] == "plots":
                        self.state.add_plots(unlock.get("count", 2))

            self.state.gems += gem_reward

            return {
                "type": "level_up",
                "old_level": old_level,
                "new_level": new_level,
                "gem_reward": gem_reward,
                "unlocks": all_unlocks,
                "message": f"Niveau supérieur ! Vous êtes niveau {new_level} !",
            }
        return None

    # --- Farm Actions ---

    def clear_wilted(self, plot_id: int) -> bool:
        """Clear a wilted plot so it can be replanted."""
        if plot_id >= len(self.state.plots):
            return False
        plot = self.state.plots[plot_id]
        if plot["state"] != "wilted":
            return False
        plot["state"] = "empty"
        plot["crop"] = None
        plot["planted_at"] = None
        plot["growth_stage"] = 0
        plot["reviews_needed"] = 0
        plot["reviews_done"] = 0
        plot.pop("_ready_since", None)
        return True

    def plant_crop(self, plot_id: int, crop_id: str) -> bool:
        """Plant a crop on a field (identified by ID)."""
        # Look up field by ID in the new fields list
        field = next((f for f in self.state.fields if f["id"] == plot_id), None)
        if field is None:
            return False
        if field["state"] != "empty":
            return False
        if crop_id not in self.state.unlocked_crops:
            return False

        from . import progression
        crop_def = progression.CROP_DEFINITIONS.get(crop_id, {})
        reviews_per_stage = max(1, crop_def.get("growth_reviews", 3) // 4)

        field["state"] = "planted"
        field["crop"] = crop_id
        field["planted_at"] = datetime.now().isoformat()
        field["growth_stage"] = 0
        field["reviews_needed"] = reviews_per_stage
        field["reviews_done"] = 0
        return True

    def add_field(self) -> bool:
        """Add a new empty field. Costs 1 land unit."""
        if self.get_land_used() >= self.state.land_total:
            return False
        field_id = max([f["id"] for f in self.state.fields], default=-1) + 1
        self.state.fields.append({
            "id": field_id,
            "crop": None,
            "state": "empty",
            "growth_stage": 0,
            "reviews_needed": 0,
            "reviews_done": 0,
            "planted_at": None,
        })
        return True

    def add_pasture(self, animal_type: str) -> bool:
        """Add a new animal pasture. Costs 2 land + animal purchase price."""
        if self.get_land_used() + 2 > self.state.land_total:
            return False
        from . import progression
        animal_def = progression.ANIMAL_DEFINITIONS.get(animal_type)
        if not animal_def:
            return False
        if animal_type not in self.state.unlocked_animals:
            return False
        cost = animal_def.get("cost_coins", 100)
        if self.state.coins < cost:
            return False
        self.state.coins -= cost
        pasture_id = max([p["id"] for p in self.state.pastures], default=-1) + 1
        self.state.pastures.append({
            "id": pasture_id,
            "animal_type": animal_type,
            "count": 1,
            "reviews_since_last": 0,
        })
        # Keep old animals dict in sync
        if animal_type not in self.state.animals:
            self.state.animals[animal_type] = {"count": 0, "reviews_since_last": 0}
        self.state.animals[animal_type]["count"] += 1
        return True

    def build_building(self, building_id: str) -> bool:
        """Build a building. Costs 2 land + building price."""
        if self.get_land_used() + 2 > self.state.land_total:
            return False
        from . import progression
        building_def = progression.BUILDING_DEFINITIONS.get(building_id)
        if not building_def:
            return False
        if building_id not in self.state.unlocked_buildings:
            return False
        # Check if already built
        if building_id in self.state.buildings:
            return False
        cost = building_def.get("cost_coins", 100)
        if self.state.coins < cost:
            return False
        self.state.coins -= cost
        self.state.buildings[building_id] = {"level": 1}
        place_id = max([b["id"] for b in self.state.placed_buildings], default=-1) + 1
        self.state.placed_buildings.append({"id": place_id, "building_type": building_id})
        return True

    def buy_land(self, amount: int = 5) -> bool:
        """Buy more land. Costs coins + land_deed."""
        cost_coins = 100 * (self.state.land_total // 5)
        if self.state.coins < cost_coins:
            return False
        deed_count = self.state.inventory.get("land_deed", 0)
        if deed_count < 1:
            return False
        self.state.coins -= cost_coins
        self.state.remove_item("land_deed", 1)
        self.state.land_total += amount
        return True

    def get_land_used(self) -> int:
        """Calculate total land units used."""
        fields = len(self.state.fields)
        buildings = len(self.state.placed_buildings) * 2
        pastures = len(self.state.pastures) * 2
        return fields + buildings + pastures

    def harvest_plot(self, plot_id: int) -> Optional[Dict]:
        """Harvest a ready crop from a field (identified by ID). Returns harvested items."""
        # Look up field by ID in the new fields list
        field = next((f for f in self.state.fields if f["id"] == plot_id), None)
        if field is None:
            return None
        if field["state"] != "ready":
            return None

        crop_id = field["crop"]
        from . import progression
        crop_def = progression.CROP_DEFINITIONS.get(crop_id, {})

        # Harvest quantity from crop definitions
        qty = random.randint(crop_def.get("harvest_min", 2), crop_def.get("harvest_max", 4))
        xp_gain = crop_def.get("xp_per_harvest", 3)

        harvested = {}
        if self.state.add_item(crop_id, qty):
            harvested[crop_id] = qty
        else:
            # Storage full — harvest anyway, overflow to give partial reward
            overflow_qty = max(1, self.state.get_silo_space())
            if overflow_qty > 0 and self.state.add_item(crop_id, overflow_qty):
                harvested[crop_id] = overflow_qty
                qty = overflow_qty
            else:
                return None

        self.state.xp += xp_gain
        self.state.total_harvests += 1

        # Reset field
        field["state"] = "empty"
        field["crop"] = None
        field["planted_at"] = None
        field["growth_stage"] = 0
        field["reviews_needed"] = 0
        field["reviews_done"] = 0

        return {"items": harvested, "xp": xp_gain}

    def sell_item(self, item_id: str, quantity: int = 1) -> int:
        """Sell items for coins. Returns coins earned."""
        item = ITEM_CATALOG.get(item_id)
        if not item or item.get("sell_price", 0) <= 0:
            return 0

        actual = min(quantity, self.state.inventory.get(item_id, 0))
        if actual <= 0:
            return 0

        self.state.remove_item(item_id, actual)
        coins = item["sell_price"] * actual
        self.state.coins += coins
        self.state.total_coins_earned += coins
        self.state.total_items_sold += actual
        return coins

    def buy_decoration(self, deco_type: str, x: int, y: int) -> bool:
        """Buy and place a decoration."""
        from . import progression
        cost = progression.DECORATION_COSTS.get(deco_type, 0)
        if cost > self.state.coins:
            return False

        self.state.coins -= cost
        self.state.total_coins_spent += cost
        self.state.decorations.append({
            "id": len(self.state.decorations),
            "type": deco_type,
            "x": x,
            "y": y,
        })
        return True

    def upgrade_barn(self) -> Optional[Dict]:
        """Attempt barn upgrade. Returns cost info or None if can't afford."""
        level = self.state.barn_level
        cost = {
            "bolt": level + 1,
            "plank": level + 1,
            "duct_tape": level + 1,
        }

        # Check materials
        for item_id, qty in cost.items():
            if self.state.inventory.get(item_id, 0) < qty:
                return None

        # Consume materials
        for item_id, qty in cost.items():
            self.state.remove_item(item_id, qty)

        self.state.barn_level += 1
        self.state.barn_capacity += 25
        return {"new_level": self.state.barn_level, "new_capacity": self.state.barn_capacity}

    def upgrade_silo(self) -> Optional[Dict]:
        """Attempt silo upgrade."""
        level = self.state.silo_level
        cost = {
            "nail": level + 1,
            "screw": level + 1,
            "paint": level + 1,
        }

        for item_id, qty in cost.items():
            if self.state.inventory.get(item_id, 0) < qty:
                return None

        for item_id, qty in cost.items():
            self.state.remove_item(item_id, qty)

        self.state.silo_level += 1
        self.state.silo_capacity += 25
        return {"new_level": self.state.silo_level, "new_capacity": self.state.silo_capacity}

    # --- Mystery Boxes ---

    def open_mystery_box(self, box_index: int) -> Optional[Dict]:
        """Open a mystery box. Returns rewards."""
        if box_index >= len(self.state.mystery_boxes):
            return None

        box = self.state.mystery_boxes[box_index]
        box_def = MYSTERY_BOX_REWARDS.get(box["size"], MYSTERY_BOX_REWARDS["small"])

        # Check gem cost
        if box_def["cost_gems"] > self.state.gems:
            # Free open check (2 per day)
            today = date.today().isoformat()
            if self.state.last_mystery_box_date != today:
                self.state.daily_mystery_boxes_opened = 0
                self.state.last_mystery_box_date = today
            if self.state.daily_mystery_boxes_opened >= 2 and box_def["cost_gems"] > 0:
                return None
            self.state.daily_mystery_boxes_opened += 1
        else:
            if box_def["cost_gems"] > 0:
                self.state.gems -= box_def["cost_gems"]

        # Roll reward
        rewards_table = box_def["rewards"]
        roll = random.random()
        cumulative = 0
        reward = rewards_table[0][0]  # fallback
        for rwd, weight in rewards_table:
            cumulative += weight
            if roll < cumulative:
                reward = rwd
                break

        # Apply reward
        result = {"reward": reward, "box_size": box["size"]}
        if "coins" in reward:
            self.state.coins += reward["coins"]
        if "gems" in reward:
            self.state.gems += reward["gems"]
        if "item" in reward:
            self.state.add_item(reward["item"], reward.get("qty", 1))

        # Remove box
        self.state.mystery_boxes.pop(box_index)
        self.state.mystery_boxes_opened += 1
        return result

    # --- Streak Management ---

    def update_streak(self):
        """Update daily streak."""
        today = date.today().isoformat()
        last = self.state.last_review_date

        if last == today:
            return

        if last is None:
            self.state.current_streak = 1
        else:
            try:
                last_date = date.fromisoformat(last)
                diff = (date.today() - last_date).days
                if diff == 1:
                    self.state.current_streak += 1
                elif diff > 1:
                    self.state.current_streak = 1
            except ValueError:
                self.state.current_streak = 1

        if self.state.current_streak > self.state.best_streak:
            self.state.best_streak = self.state.current_streak

        self.state.last_review_date = today

    # --- Orders (Truck/Boat) ---

    def generate_orders(self):
        """Generate new delivery orders if needed."""
        if len(self.state.active_orders) >= 3:
            return

        # Build pool of orderable items based on unlocked content
        order_items = list(self.state.unlocked_crops)

        # Add animal products if player owns any animals
        animal_products = {
            "cow": "milk", "chicken": "egg", "pig": "bacon", "sheep": "wool"
        }
        for animal_id, product in animal_products.items():
            if self.state.animals.get(animal_id, {}).get("count", 0) > 0:
                order_items.append(product)

        # Add processed goods from owned buildings
        from . import production
        for building_id in self.state.buildings:
            for recipe in production.RECIPES.get(building_id, []):
                for output_id in recipe["output"]:
                    if output_id not in order_items:
                        order_items.append(output_id)

        while len(self.state.active_orders) < 3 and order_items:
            items_needed = {}
            num_items = random.randint(1, min(3, self.state.level // 5 + 1))
            for _ in range(num_items):
                item = random.choice(order_items)
                qty = random.randint(1, max(1, self.state.level // 3))
                items_needed[item] = items_needed.get(item, 0) + qty

            # Boat orders are harder but more rewarding
            order_type = random.choice(["truck", "boat"])
            reward_mult = 3 if order_type == "boat" else 2

            coin_reward = sum(
                ITEM_CATALOG.get(i, {}).get("sell_price", 5) * q * reward_mult
                for i, q in items_needed.items()
            )
            xp_reward = sum(
                ITEM_CATALOG.get(i, {}).get("xp", 2) * q * reward_mult
                for i, q in items_needed.items()
            )

            self.state.active_orders.append({
                "id": len(self.state.active_orders) + self.state.orders_completed,
                "items_needed": items_needed,
                "coin_reward": coin_reward,
                "xp_reward": xp_reward,
                "type": order_type,
            })

    def fulfill_order(self, order_index: int) -> Optional[Dict]:
        """Fulfill a delivery order. Returns rewards or None."""
        if order_index >= len(self.state.active_orders):
            return None

        order = self.state.active_orders[order_index]

        # Check if we have all items
        for item_id, qty in order["items_needed"].items():
            if self.state.inventory.get(item_id, 0) < qty:
                return None

        # Consume items
        for item_id, qty in order["items_needed"].items():
            self.state.remove_item(item_id, qty)

        # Give rewards
        self.state.coins += order["coin_reward"]
        self.state.xp += order["xp_reward"]
        self.state.total_coins_earned += order["coin_reward"]
        self.state.orders_completed += 1

        result = {
            "coins": order["coin_reward"],
            "xp": order["xp_reward"],
            "order_type": order["type"],
        }

        # Remove order and generate new one
        self.state.active_orders.pop(order_index)
        self.generate_orders()

        return result

    # --- Wheel of Fortune ---

    def can_spin_wheel(self) -> bool:
        """Check if daily wheel spin is available."""
        today = date.today().isoformat()
        return self.state.last_wheel_spin != today

    def spin_wheel(self) -> Optional[Dict]:
        """Spin the daily wheel of fortune."""
        if not self.can_spin_wheel():
            return None

        self.state.last_wheel_spin = date.today().isoformat()
        self.state.wheel_spins += 1

        prizes = [
            ({"coins": 25}, "25 pièces", 0.20),
            ({"coins": 50}, "50 pièces", 0.15),
            ({"coins": 100}, "100 pièces", 0.10),
            ({"gems": 1}, "1 gemme", 0.15),
            ({"gems": 3}, "3 gemmes", 0.10),
            ({"gems": 5}, "5 gemmes", 0.05),
            ({"item": "bolt", "qty": 3}, "3 boulons", 0.10),
            ({"item": "plank", "qty": 3}, "3 planches", 0.10),
            ({"item": "expansion_permit", "qty": 1}, "Permis d'expansion", 0.05),
        ]

        roll = random.random()
        cumulative = 0
        chosen = prizes[0]
        for prize, name, weight in prizes:
            cumulative += weight
            if roll < cumulative:
                chosen = (prize, name, weight)
                break

        prize_data, prize_name, _ = chosen

        # Apply prize
        if "coins" in prize_data:
            self.state.coins += prize_data["coins"]
        if "gems" in prize_data:
            self.state.gems += prize_data["gems"]
        if "item" in prize_data:
            self.state.add_item(prize_data["item"], prize_data.get("qty", 1))

        # Return index so JS can land on correct segment
        prize_index = next(
            (i for i, (p, n, w) in enumerate(prizes) if n == prize_name), 0
        )
        return {"prize": prize_data, "name": prize_name, "index": prize_index}

    # --- Auto Events ---

    def check_events(self):
        """Generate automatic events (weekend bonus, time-of-day, milestones)."""
        now = datetime.now()

        # Clean expired events
        self.state.active_events = [
            e for e in self.state.active_events
            if datetime.fromisoformat(e.get("ends_at", now.isoformat())) > now
        ]

        active_ids = {e.get("id") for e in self.state.active_events}

        # Weekend bonus: Saturday & Sunday
        if now.weekday() >= 5:  # Saturday=5, Sunday=6
            if "weekend_bonus" not in active_ids:
                days_until_monday = 7 - now.weekday()
                end = now.replace(hour=23, minute=59, second=59) + timedelta(days=days_until_monday - 1)
                self.state.active_events.append({
                    "id": "weekend_bonus",
                    "name": "Bonus Weekend !",
                    "emoji": "\U0001F389",
                    "coin_multiplier": 1.5,
                    "xp_multiplier": 2.0,
                    "ends_at": end.isoformat(),
                })

        # Early Bird: studying before 9 AM
        if now.hour < 9 and "early_bird" not in active_ids:
            end = now.replace(hour=9, minute=0, second=0).isoformat()
            self.state.active_events.append({
                "id": "early_bird",
                "name": "Lève-tôt !",
                "emoji": "\U0001F305",
                "coin_multiplier": 1.3,
                "xp_multiplier": 1.5,
                "ends_at": end,
            })

        # Night Owl: studying after 10 PM
        if now.hour >= 22 and "night_owl" not in active_ids:
            end = (now.replace(hour=23, minute=59, second=59)).isoformat()
            self.state.active_events.append({
                "id": "night_owl",
                "name": "Couche-tard !",
                "emoji": "\U0001F989",
                "coin_multiplier": 1.3,
                "xp_multiplier": 1.5,
                "ends_at": end,
            })

        # Lunch Rush: studying 12-14h
        if 12 <= now.hour < 14 and "lunch_rush" not in active_ids:
            end = now.replace(hour=14, minute=0, second=0).isoformat()
            self.state.active_events.append({
                "id": "lunch_rush",
                "name": "Pause déjeuner !",
                "emoji": "\U0001F35C",
                "coin_multiplier": 1.2,
                "xp_multiplier": 1.3,
                "ends_at": end,
            })

        # Streak milestone event: every 7-day streak
        if self.state.current_streak >= 7 and self.state.current_streak % 7 == 0:
            evt_id = f"streak_milestone_{self.state.current_streak}"
            if evt_id not in active_ids:
                end = (now + timedelta(hours=24)).isoformat()
                self.state.active_events.append({
                    "id": evt_id,
                    "name": f"Série de {self.state.current_streak} jours !",
                    "emoji": "\U0001F525",
                    "coin_multiplier": 2.0,
                    "xp_multiplier": 2.0,
                    "ends_at": end,
                })

        # Level milestone events: every 10 levels
        if self.state.level >= 10 and self.state.level % 10 == 0:
            evt_id = f"level_milestone_{self.state.level}"
            if evt_id not in active_ids:
                end = (now + timedelta(hours=12)).isoformat()
                self.state.active_events.append({
                    "id": evt_id,
                    "name": f"Niveau {self.state.level} !",
                    "emoji": "\U0001F38A",
                    "coin_multiplier": 1.5,
                    "xp_multiplier": 1.5,
                    "ends_at": end,
                })

        # First session of the day bonus
        today_str = date.today().isoformat()
        if self.state.last_session:
            try:
                last_date = datetime.fromisoformat(self.state.last_session).date().isoformat()
                if last_date != today_str and "first_session" not in active_ids:
                    end = (now + timedelta(minutes=30)).isoformat()
                    self.state.active_events.append({
                        "id": "first_session",
                        "name": "Nouveau départ !",
                        "emoji": "\U0001F331",
                        "coin_multiplier": 1.25,
                        "xp_multiplier": 1.25,
                        "ends_at": end,
                    })
            except (ValueError, TypeError):
                pass

    # --- Daily Login Bonus ---

    def check_daily_login(self) -> Optional[Dict]:
        """Check and grant daily login bonus. Returns bonus info or None."""
        today = date.today().isoformat()
        if self.state.last_login_date == today:
            return None

        # Update login streak
        if self.state.last_login_date:
            try:
                last = date.fromisoformat(self.state.last_login_date)
                if (date.today() - last).days == 1:
                    self.state.login_streak += 1
                elif (date.today() - last).days > 1:
                    self.state.login_streak = 1
            except ValueError:
                self.state.login_streak = 1
        else:
            self.state.login_streak = 1

        self.state.last_login_date = today

        # Escalating daily rewards based on login streak
        day = min(self.state.login_streak, 7)
        daily_rewards = {
            1: {"coins": 20, "desc": "20 pièces"},
            2: {"coins": 30, "desc": "30 pièces"},
            3: {"coins": 40, "gems": 1, "desc": "40 pièces + 1 gemme"},
            4: {"coins": 50, "gems": 1, "desc": "50 pièces + 1 gemme"},
            5: {"coins": 75, "gems": 2, "desc": "75 pièces + 2 gemmes"},
            6: {"coins": 100, "gems": 3, "desc": "100 pièces + 3 gemmes"},
            7: {"coins": 150, "gems": 5, "desc": "150 pièces + 5 gemmes"},
        }

        reward = daily_rewards[day]
        self.state.coins += reward.get("coins", 0)
        self.state.gems += reward.get("gems", 0)

        return {
            "day": self.state.login_streak,
            "reward": reward,
            "message": f"Bonus jour {self.state.login_streak} : {reward['desc']} !",
        }

    # --- Session Management ---

    def start_session(self):
        """Start a new review session."""
        self.state.session_coins_earned = 0
        self.state.session_xp_earned = 0
        self.state.session_items_earned = {}
        self.state.session_reviews = 0
        self._pending_notifications = []
        self.check_events()

    def end_session(self) -> Dict:
        """End session and return summary."""
        self.state.total_sessions += 1
        self.update_streak()
        self.generate_orders()

        # Process production queues
        self._process_production()

        summary = {
            "reviews": self.state.session_reviews,
            "coins_earned": self.state.session_coins_earned,
            "xp_earned": self.state.session_xp_earned,
            "items_earned": dict(self.state.session_items_earned),
            "level": self.state.level,
            "total_coins": self.state.coins,
            "total_gems": self.state.gems,
            "streak": self.state.current_streak,
            "notifications": list(self._pending_notifications),
        }

        self.state.last_session = datetime.now().isoformat()
        self.save()
        return summary

    def _process_production(self):
        """Process production queues - advance items that waited a session."""
        for building_id, queue in self.state.production_queues.items():
            for item in queue:
                if not item.get("ready", False):
                    sessions_waited = item.get("sessions_waited", 0) + 1
                    item["sessions_waited"] = sessions_waited
                    if sessions_waited >= item.get("sessions_required", 1):
                        item["ready"] = True

    # --- Data for UI ---

    _item_catalog_cache = None

    def get_farm_data(self) -> Dict:
        """Get complete farm data for UI rendering."""
        from . import progression

        xp_for_current = progression.get_xp_for_level(self.state.level)
        xp_for_next = progression.get_xp_for_level(self.state.level + 1)
        xp_progress = self.state.xp - xp_for_current
        xp_needed = xp_for_next - xp_for_current

        # Cache item catalog (it never changes at runtime)
        if FarmManager._item_catalog_cache is None:
            FarmManager._item_catalog_cache = {k: v for k, v in ITEM_CATALOG.items()}

        # Build definitions dicts for JS (French names, costs, etc.)
        building_defs = {
            bid: {"name": bdef.get("name", bid), "emoji": bdef.get("emoji", ""), "cost": bdef.get("cost_coins", 0), "desc": bdef.get("description", "")}
            for bid, bdef in progression.BUILDING_DEFINITIONS.items()
        }
        animal_defs = {
            aid: {"name": adef.get("name", aid), "emoji": adef.get("emoji", ""), "cost": adef.get("cost_coins", 0), "product": adef.get("product", ""), "max": adef.get("max_owned", 5)}
            for aid, adef in progression.ANIMAL_DEFINITIONS.items()
        }
        crop_defs = {
            cid: {"name": cdef.get("name", cid), "emoji": cdef.get("emoji", "")}
            for cid, cdef in progression.CROP_DEFINITIONS.items()
        }
        deco_defs = {
            did: {"name": ddef.get("name", did), "emoji": ddef.get("emoji", ""), "cost": ddef.get("cost", 0)}
            for did, ddef in progression.DECORATION_CATALOG.items()
        }

        return {
            "level": self.state.level,
            "xp": self.state.xp,
            "xp_progress": xp_progress,
            "xp_needed": xp_needed,
            "xp_percent": min(100, int(xp_progress / max(1, xp_needed) * 100)),
            "coins": self.state.coins,
            "gems": self.state.gems,
            "streak": self.state.current_streak,
            "best_streak": self.state.best_streak,
            "plots": self.state.plots,
            "num_plots": self.state.num_plots,
            "fields": self.state.fields,
            "placed_buildings": self.state.placed_buildings,
            "pastures": self.state.pastures,
            "land_total": self.state.land_total,
            "land_used": self.get_land_used(),
            "land_available": self.state.land_total - self.get_land_used(),
            "buildings": self.state.buildings,
            "animals": self.state.animals,
            "decorations": self.state.decorations,
            "inventory": self.state.inventory,
            "barn_capacity": self.state.barn_capacity,
            "barn_level": self.state.barn_level,
            "barn_used": self.state.barn_capacity - self.state.get_barn_space(),
            "silo_capacity": self.state.silo_capacity,
            "silo_level": self.state.silo_level,
            "silo_used": self.state.silo_capacity - self.state.get_silo_space(),
            "unlocked_crops": self.state.unlocked_crops,
            "unlocked_buildings": self.state.unlocked_buildings,
            "unlocked_animals": self.state.unlocked_animals,
            "mystery_boxes": self.state.mystery_boxes,
            "active_orders": self.state.active_orders,
            "orders_completed": self.state.orders_completed,
            "production_queues": self.state.production_queues,
            "total_reviews": self.state.total_reviews,
            "lifetime_reviews": self.state.lifetime_reviews,
            "can_spin_wheel": self.can_spin_wheel(),
            "item_catalog": FarmManager._item_catalog_cache,
            "achievements": self.state.achievements,
            "session_reviews": self.state.session_reviews,
            "session_coins": self.state.session_coins_earned,
            "session_xp": self.state.session_xp_earned,
            "streak_bonus_pct": min(self.state.current_streak * 5, 50),
            "active_events": [
                {"name": e.get("name", ""), "emoji": e.get("emoji", "")}
                for e in self.state.active_events
                if datetime.fromisoformat(e.get("ends_at", "2000-01-01")) > datetime.now()
            ],
            "building_defs": building_defs,
            "animal_defs": animal_defs,
            "crop_defs": crop_defs,
            "deco_defs": deco_defs,
            "total_harvests": self.state.total_harvests,
            "total_coins_earned": self.state.total_coins_earned,
            "total_items_sold": self.state.total_items_sold,
            "total_produced": self.state.total_produced,
            "total_sessions": self.state.total_sessions,
            "total_correct": self.state.total_correct,
        }

    def get_notifications(self) -> List[Dict]:
        """Get and clear pending notifications."""
        notifs = list(self._pending_notifications)
        self._pending_notifications.clear()
        return notifs
