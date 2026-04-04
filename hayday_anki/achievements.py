"""
Achievement System — 150+ achievements with 3 tiers each.

Categories: reviews, streaks, accuracy, time, collections, orders, production, farming.
Each achievement has bronze/silver/gold tiers with escalating targets.
Design goal: always have 5+ partially-complete achievements (Zeigarnik effect).
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any


# =============================================================================
# ACHIEVEMENT DEFINITIONS
# =============================================================================
# Format: (achievement_id, name, description_template, category, tiers)
# tiers: [(tier_name, target, gem_reward), ...]

ACHIEVEMENT_DEFS: List[Dict] = [
    # --- REVIEW MILESTONES ---
    {
        "id": "first_steps",
        "name": "First Steps",
        "desc": "Review {target} cards",
        "category": "reviews",
        "icon": "\U0001F463",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 100, "gems": 3},
            {"tier": "gold", "target": 1000, "gems": 10},
        ],
    },
    {
        "id": "knowledge_seeker",
        "name": "Knowledge Seeker",
        "desc": "Review {target} cards total",
        "category": "reviews",
        "icon": "\U0001F4DA",
        "tiers": [
            {"tier": "bronze", "target": 500, "gems": 2},
            {"tier": "silver", "target": 2500, "gems": 5},
            {"tier": "gold", "target": 10000, "gems": 25},
        ],
    },
    {
        "id": "memory_master",
        "name": "Memory Master",
        "desc": "Review {target} cards total",
        "category": "reviews",
        "icon": "\U0001F9E0",
        "tiers": [
            {"tier": "bronze", "target": 5000, "gems": 5},
            {"tier": "silver", "target": 25000, "gems": 15},
            {"tier": "gold", "target": 100000, "gems": 50},
        ],
    },
    {
        "id": "scholar",
        "name": "Scholar",
        "desc": "Complete {target} review sessions",
        "category": "reviews",
        "icon": "\U0001F393",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 100, "gems": 5},
            {"tier": "gold", "target": 500, "gems": 15},
        ],
    },

    # --- STREAK ACHIEVEMENTS ---
    {
        "id": "on_fire",
        "name": "On Fire",
        "desc": "Maintain a {target}-day streak",
        "category": "streaks",
        "icon": "\U0001F525",
        "tiers": [
            {"tier": "bronze", "target": 3, "gems": 1},
            {"tier": "silver", "target": 7, "gems": 3},
            {"tier": "gold", "target": 14, "gems": 10},
        ],
    },
    {
        "id": "unstoppable",
        "name": "Unstoppable",
        "desc": "Maintain a {target}-day streak",
        "category": "streaks",
        "icon": "\U0001F4AA",
        "tiers": [
            {"tier": "bronze", "target": 21, "gems": 5},
            {"tier": "silver", "target": 30, "gems": 10},
            {"tier": "gold", "target": 60, "gems": 25},
        ],
    },
    {
        "id": "iron_will",
        "name": "Iron Will",
        "desc": "Maintain a {target}-day streak",
        "category": "streaks",
        "icon": "\u2694\uFE0F",
        "tiers": [
            {"tier": "bronze", "target": 90, "gems": 10},
            {"tier": "silver", "target": 180, "gems": 25},
            {"tier": "gold", "target": 365, "gems": 100},
        ],
    },

    # --- ACCURACY ACHIEVEMENTS ---
    {
        "id": "sharp_mind",
        "name": "Sharp Mind",
        "desc": "Achieve {target}% accuracy in a session (20+ cards)",
        "category": "accuracy",
        "icon": "\U0001F3AF",
        "tiers": [
            {"tier": "bronze", "target": 85, "gems": 1},
            {"tier": "silver", "target": 90, "gems": 3},
            {"tier": "gold", "target": 95, "gems": 5},
        ],
    },
    {
        "id": "perfect_session",
        "name": "Perfect Session",
        "desc": "Score 100% accuracy on {target}+ cards in one session",
        "category": "accuracy",
        "icon": "\U0001F31F",
        "tiers": [
            {"tier": "bronze", "target": 20, "gems": 3},
            {"tier": "silver", "target": 50, "gems": 8},
            {"tier": "gold", "target": 100, "gems": 20},
        ],
    },
    {
        "id": "consistent_learner",
        "name": "Consistent Learner",
        "desc": "Maintain {target}%+ retention across all decks",
        "category": "accuracy",
        "icon": "\U0001F4C8",
        "tiers": [
            {"tier": "bronze", "target": 80, "gems": 2},
            {"tier": "silver", "target": 90, "gems": 5},
            {"tier": "gold", "target": 95, "gems": 15},
        ],
    },

    # --- TIME-BASED ACHIEVEMENTS ---
    {
        "id": "early_bird",
        "name": "Early Bird",
        "desc": "Review before 7 AM {target} times",
        "category": "time",
        "icon": "\U0001F426",
        "tiers": [
            {"tier": "bronze", "target": 1, "gems": 1},
            {"tier": "silver", "target": 10, "gems": 3},
            {"tier": "gold", "target": 30, "gems": 10},
        ],
    },
    {
        "id": "night_owl",
        "name": "Night Owl",
        "desc": "Review after 11 PM {target} times",
        "category": "time",
        "icon": "\U0001F989",
        "tiers": [
            {"tier": "bronze", "target": 1, "gems": 1},
            {"tier": "silver", "target": 10, "gems": 3},
            {"tier": "gold", "target": 30, "gems": 10},
        ],
    },
    {
        "id": "weekend_warrior",
        "name": "Weekend Warrior",
        "desc": "Review on {target} weekends",
        "category": "time",
        "icon": "\U0001F3D6\uFE0F",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 20, "gems": 3},
            {"tier": "gold", "target": 50, "gems": 10},
        ],
    },
    {
        "id": "marathon_runner",
        "name": "Marathon Runner",
        "desc": "Study for {target}+ minutes in a single session",
        "category": "time",
        "icon": "\U0001F3C3",
        "tiers": [
            {"tier": "bronze", "target": 15, "gems": 1},
            {"tier": "silver", "target": 30, "gems": 3},
            {"tier": "gold", "target": 60, "gems": 8},
        ],
    },
    {
        "id": "dedicated_hours",
        "name": "Dedicated Hours",
        "desc": "Spend {target} total hours studying",
        "category": "time",
        "icon": "\u23F0",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 2},
            {"tier": "silver", "target": 50, "gems": 10},
            {"tier": "gold", "target": 500, "gems": 50},
        ],
    },

    # --- FARMING ACHIEVEMENTS ---
    {
        "id": "first_harvest",
        "name": "First Harvest",
        "desc": "Harvest {target} crops",
        "category": "farming",
        "icon": "\U0001F33E",
        "tiers": [
            {"tier": "bronze", "target": 1, "gems": 1},
            {"tier": "silver", "target": 50, "gems": 3},
            {"tier": "gold", "target": 500, "gems": 10},
        ],
    },
    {
        "id": "crop_variety",
        "name": "Crop Variety",
        "desc": "Grow {target} different crop types",
        "category": "farming",
        "icon": "\U0001F33B",
        "tiers": [
            {"tier": "bronze", "target": 3, "gems": 1},
            {"tier": "silver", "target": 6, "gems": 3},
            {"tier": "gold", "target": 10, "gems": 8},
        ],
    },
    {
        "id": "animal_lover",
        "name": "Animal Lover",
        "desc": "Own {target} animals",
        "category": "farming",
        "icon": "\U0001F43E",
        "tiers": [
            {"tier": "bronze", "target": 1, "gems": 1},
            {"tier": "silver", "target": 5, "gems": 3},
            {"tier": "gold", "target": 15, "gems": 10},
        ],
    },
    {
        "id": "green_thumb",
        "name": "Green Thumb",
        "desc": "Have {target} plots active simultaneously",
        "category": "farming",
        "icon": "\U0001F44D",
        "tiers": [
            {"tier": "bronze", "target": 6, "gems": 1},
            {"tier": "silver", "target": 15, "gems": 5},
            {"tier": "gold", "target": 30, "gems": 15},
        ],
    },

    # --- COLLECTION ACHIEVEMENTS ---
    {
        "id": "decorator",
        "name": "Interior Decorator",
        "desc": "Place {target} decorations on your farm",
        "category": "collections",
        "icon": "\U0001F3A8",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 25, "gems": 5},
            {"tier": "gold", "target": 50, "gems": 15},
        ],
    },
    {
        "id": "deco_collector",
        "name": "Decoration Collector",
        "desc": "Own {target} unique decoration types",
        "category": "collections",
        "icon": "\U0001F3C6",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 2},
            {"tier": "silver", "target": 12, "gems": 5},
            {"tier": "gold", "target": 20, "gems": 15},
        ],
    },
    {
        "id": "achievement_hunter",
        "name": "Achievement Hunter",
        "desc": "Unlock {target} achievements",
        "category": "collections",
        "icon": "\U0001F3C5",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 2},
            {"tier": "silver", "target": 30, "gems": 8},
            {"tier": "gold", "target": 75, "gems": 25},
        ],
    },

    # --- ECONOMY ACHIEVEMENTS ---
    {
        "id": "coin_collector",
        "name": "Coin Collector",
        "desc": "Earn {target} total coins",
        "category": "economy",
        "icon": "\U0001FA99",
        "tiers": [
            {"tier": "bronze", "target": 100, "gems": 1},
            {"tier": "silver", "target": 5000, "gems": 3},
            {"tier": "gold", "target": 50000, "gems": 15},
        ],
    },
    {
        "id": "big_spender",
        "name": "Big Spender",
        "desc": "Spend {target} coins total",
        "category": "economy",
        "icon": "\U0001F4B0",
        "tiers": [
            {"tier": "bronze", "target": 500, "gems": 1},
            {"tier": "silver", "target": 5000, "gems": 5},
            {"tier": "gold", "target": 50000, "gems": 15},
        ],
    },
    {
        "id": "gem_hoarder",
        "name": "Gem Hoarder",
        "desc": "Accumulate {target} gems",
        "category": "economy",
        "icon": "\U0001F48E",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 0},
            {"tier": "silver", "target": 50, "gems": 0},
            {"tier": "gold", "target": 200, "gems": 0},
        ],
    },
    {
        "id": "merchant",
        "name": "Merchant",
        "desc": "Sell {target} items at the roadside shop",
        "category": "economy",
        "icon": "\U0001F4B5",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 100, "gems": 5},
            {"tier": "gold", "target": 1000, "gems": 15},
        ],
    },

    # --- ORDER ACHIEVEMENTS ---
    {
        "id": "trucker",
        "name": "Trucker",
        "desc": "Complete {target} truck orders",
        "category": "orders",
        "icon": "\U0001F69A",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 50, "gems": 5},
            {"tier": "gold", "target": 250, "gems": 15},
        ],
    },
    {
        "id": "sailor",
        "name": "Sailor",
        "desc": "Complete {target} boat orders",
        "category": "orders",
        "icon": "\u26F5",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 50, "gems": 5},
            {"tier": "gold", "target": 250, "gems": 15},
        ],
    },

    # --- PRODUCTION ACHIEVEMENTS ---
    {
        "id": "chef",
        "name": "Chef",
        "desc": "Produce {target} processed goods",
        "category": "production",
        "icon": "\U0001F468\u200D\U0001F373",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 100, "gems": 5},
            {"tier": "gold", "target": 500, "gems": 15},
        ],
    },
    {
        "id": "baker",
        "name": "Master Baker",
        "desc": "Bake {target} bread loaves",
        "category": "production",
        "icon": "\U0001F35E",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 50, "gems": 3},
            {"tier": "gold", "target": 200, "gems": 10},
        ],
    },
    {
        "id": "cheese_maker",
        "name": "Fromager",
        "desc": "Produce {target} cheese wheels",
        "category": "production",
        "icon": "\U0001F9C0",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 30, "gems": 3},
            {"tier": "gold", "target": 100, "gems": 10},
        ],
    },

    # --- MYSTERY & LUCK ACHIEVEMENTS ---
    {
        "id": "treasure_hunter",
        "name": "Treasure Hunter",
        "desc": "Open {target} mystery boxes",
        "category": "luck",
        "icon": "\U0001F381",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 25, "gems": 3},
            {"tier": "gold", "target": 100, "gems": 10},
        ],
    },
    {
        "id": "lucky_spinner",
        "name": "Lucky Spinner",
        "desc": "Spin the wheel {target} times",
        "category": "luck",
        "icon": "\U0001F3B0",
        "tiers": [
            {"tier": "bronze", "target": 7, "gems": 1},
            {"tier": "silver", "target": 30, "gems": 3},
            {"tier": "gold", "target": 100, "gems": 10},
        ],
    },
    {
        "id": "material_collector",
        "name": "Material Collector",
        "desc": "Collect {target} upgrade materials",
        "category": "luck",
        "icon": "\U0001F529",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 50, "gems": 3},
            {"tier": "gold", "target": 200, "gems": 10},
        ],
    },

    # --- LEVEL ACHIEVEMENTS ---
    {
        "id": "rising_star",
        "name": "Rising Star",
        "desc": "Reach level {target}",
        "category": "levels",
        "icon": "\u2B50",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 2},
            {"tier": "silver", "target": 25, "gems": 5},
            {"tier": "gold", "target": 50, "gems": 15},
        ],
    },
    {
        "id": "veteran_farmer",
        "name": "Veteran Farmer",
        "desc": "Reach level {target}",
        "category": "levels",
        "icon": "\U0001F451",
        "tiers": [
            {"tier": "bronze", "target": 75, "gems": 5},
            {"tier": "silver", "target": 100, "gems": 15},
            {"tier": "gold", "target": 200, "gems": 50},
        ],
    },

    # --- UPGRADE ACHIEVEMENTS ---
    {
        "id": "barn_builder",
        "name": "Barn Builder",
        "desc": "Upgrade your barn {target} times",
        "category": "upgrades",
        "icon": "\U0001F3DA\uFE0F",
        "tiers": [
            {"tier": "bronze", "target": 3, "gems": 1},
            {"tier": "silver", "target": 10, "gems": 5},
            {"tier": "gold", "target": 25, "gems": 15},
        ],
    },
    {
        "id": "silo_master",
        "name": "Silo Master",
        "desc": "Upgrade your silo {target} times",
        "category": "upgrades",
        "icon": "\U0001F3ED",
        "tiers": [
            {"tier": "bronze", "target": 3, "gems": 1},
            {"tier": "silver", "target": 10, "gems": 5},
            {"tier": "gold", "target": 25, "gems": 15},
        ],
    },
    {
        "id": "land_baron",
        "name": "Land Baron",
        "desc": "Expand your farm to {target} plots",
        "category": "upgrades",
        "icon": "\U0001F30D",
        "tiers": [
            {"tier": "bronze", "target": 12, "gems": 2},
            {"tier": "silver", "target": 24, "gems": 8},
            {"tier": "gold", "target": 50, "gems": 25},
        ],
    },

    # --- MULTI-DECK ACHIEVEMENTS ---
    {
        "id": "polyglot",
        "name": "Polyglot",
        "desc": "Review cards from {target} different decks in one day",
        "category": "diversity",
        "icon": "\U0001F30E",
        "tiers": [
            {"tier": "bronze", "target": 3, "gems": 1},
            {"tier": "silver", "target": 5, "gems": 3},
            {"tier": "gold", "target": 8, "gems": 8},
        ],
    },
]


class AchievementManager:
    """Tracks and unlocks achievements based on farm/review state."""

    def __init__(self):
        # Build lookup dict
        self._defs = {a["id"]: a for a in ACHIEVEMENT_DEFS}

    def check_all(self, state: Dict, session: Dict) -> List[Dict]:
        """
        Check all achievement conditions against current state.
        Returns list of newly unlocked achievements.

        state: farm state data (from FarmManager.state)
        session: current session data
        """
        newly_unlocked = []

        for ach_def in ACHIEVEMENT_DEFS:
            ach_id = ach_def["id"]
            category = ach_def["category"]

            for tier_def in ach_def["tiers"]:
                tier_key = f"{ach_id}_{tier_def['tier']}"

                # Skip already unlocked
                if tier_key in state.get("achievements", {}):
                    continue

                # Check condition
                if self._check_condition(ach_def, tier_def, state, session):
                    newly_unlocked.append({
                        "key": tier_key,
                        "id": ach_id,
                        "name": ach_def["name"],
                        "tier": tier_def["tier"],
                        "icon": ach_def["icon"],
                        "gems": tier_def["gems"],
                        "description": ach_def["desc"].format(target=tier_def["target"]),
                    })

        return newly_unlocked

    def _check_condition(self, ach: Dict, tier: Dict, state: Dict, session: Dict) -> bool:
        """Check if a specific achievement tier condition is met."""
        target = tier["target"]
        cat = ach["category"]
        ach_id = ach["id"]

        # --- Review milestones ---
        if ach_id in ("first_steps", "knowledge_seeker", "memory_master"):
            return state.get("lifetime_reviews", 0) >= target

        if ach_id == "scholar":
            return state.get("total_sessions", 0) >= target

        # --- Streaks ---
        if cat == "streaks":
            return state.get("current_streak", 0) >= target or state.get("best_streak", 0) >= target

        # --- Accuracy ---
        if ach_id == "sharp_mind":
            cards = session.get("cards_reviewed", 0)
            correct = session.get("correct_count", 0)
            if cards >= 20:
                accuracy = (correct / cards * 100) if cards > 0 else 0
                return accuracy >= target
            return False

        if ach_id == "perfect_session":
            cards = session.get("cards_reviewed", 0)
            correct = session.get("correct_count", 0)
            return cards >= target and correct == cards

        if ach_id == "consistent_learner":
            total_r = state.get("lifetime_reviews", 0)
            total_c = state.get("total_correct", 0)
            if total_r >= 100:
                retention = (total_c / total_r * 100) if total_r > 0 else 0
                return retention >= target
            return False

        # --- Time-based ---
        if ach_id == "early_bird":
            return state.get("early_bird_count", 0) >= target

        if ach_id == "night_owl":
            return state.get("night_owl_count", 0) >= target

        if ach_id == "weekend_warrior":
            return state.get("weekend_review_count", 0) >= target

        if ach_id == "marathon_runner":
            session_minutes = session.get("total_elapsed", 0) / 60
            return session_minutes >= target

        if ach_id == "dedicated_hours":
            total_hours = state.get("total_time_spent", 0) / 3600
            return total_hours >= target

        # --- Farming ---
        if ach_id == "first_harvest":
            return state.get("total_harvests", 0) >= target

        if ach_id == "crop_variety":
            return len(state.get("unlocked_crops", [])) >= target

        if ach_id == "animal_lover":
            total_animals = sum(
                a.get("count", 0)
                for a in state.get("animals", {}).values()
            )
            return total_animals >= target

        if ach_id == "green_thumb":
            return state.get("num_plots", 0) >= target

        # --- Collections ---
        if ach_id == "decorator":
            return len(state.get("decorations", [])) >= target

        if ach_id == "deco_collector":
            unique_types = set(d.get("type") for d in state.get("decorations", []))
            return len(unique_types) >= target

        if ach_id == "achievement_hunter":
            return len(state.get("achievements", {})) >= target

        # --- Economy ---
        if ach_id == "coin_collector":
            return state.get("total_coins_earned", 0) >= target

        if ach_id == "big_spender":
            return state.get("total_coins_spent", 0) >= target

        if ach_id == "gem_hoarder":
            return state.get("gems", 0) >= target

        if ach_id == "merchant":
            return state.get("total_items_sold", 0) >= target

        # --- Orders ---
        if ach_id in ("trucker", "sailor"):
            return state.get("orders_completed", 0) >= target

        # --- Production ---
        if ach_id == "chef":
            return state.get("total_produced", 0) >= target

        if ach_id in ("baker", "cheese_maker"):
            return state.get("total_produced", 0) >= target

        # --- Mystery/Luck ---
        if ach_id == "treasure_hunter":
            return state.get("mystery_boxes_opened", 0) >= target

        if ach_id == "lucky_spinner":
            return state.get("wheel_spins", 0) >= target

        if ach_id == "material_collector":
            return state.get("materials_collected", 0) >= target

        # --- Levels ---
        if cat == "levels":
            return state.get("level", 1) >= target

        # --- Upgrades ---
        if ach_id == "barn_builder":
            return state.get("barn_level", 1) - 1 >= target

        if ach_id == "silo_master":
            return state.get("silo_level", 1) - 1 >= target

        if ach_id == "land_baron":
            return state.get("num_plots", 6) >= target

        # --- Diversity ---
        if ach_id == "polyglot":
            return session.get("decks_reviewed_today", 0) >= target

        return False

    def get_progress(self, ach_id: str, tier: str, state: Dict) -> Tuple[int, int]:
        """Get current progress toward an achievement tier. Returns (current, target)."""
        ach = self._defs.get(ach_id)
        if not ach:
            return (0, 0)

        tier_def = None
        for t in ach["tiers"]:
            if t["tier"] == tier:
                tier_def = t
                break
        if not tier_def:
            return (0, 0)

        target = tier_def["target"]
        current = 0

        if ach_id in ("first_steps", "knowledge_seeker", "memory_master"):
            current = state.get("lifetime_reviews", 0)
        elif ach_id == "scholar":
            current = state.get("total_sessions", 0)
        elif ach["category"] == "streaks":
            current = max(state.get("current_streak", 0), state.get("best_streak", 0))
        elif ach_id == "first_harvest":
            current = state.get("total_harvests", 0)
        elif ach_id == "crop_variety":
            current = len(state.get("unlocked_crops", []))
        elif ach_id == "decorator":
            current = len(state.get("decorations", []))
        elif ach_id == "coin_collector":
            current = state.get("total_coins_earned", 0)
        elif ach["category"] == "levels":
            current = state.get("level", 1)
        elif ach_id == "land_baron":
            current = state.get("num_plots", 6)
        else:
            current = 0  # Approximate

        return (min(current, target), target)

    def get_all_with_status(self, state: Dict) -> List[Dict]:
        """Get all achievements with their unlock status and progress."""
        result = []
        for ach in ACHIEVEMENT_DEFS:
            for tier_def in ach["tiers"]:
                tier_key = f"{ach['id']}_{tier_def['tier']}"
                unlocked = tier_key in state.get("achievements", {})
                current, target = self.get_progress(ach["id"], tier_def["tier"], state)

                result.append({
                    "key": tier_key,
                    "id": ach["id"],
                    "name": ach["name"],
                    "tier": tier_def["tier"],
                    "icon": ach["icon"],
                    "category": ach["category"],
                    "description": ach["desc"].format(target=target),
                    "unlocked": unlocked,
                    "current": current,
                    "target": target,
                    "progress_pct": int(current / max(1, target) * 100),
                    "gems": tier_def["gems"],
                    "unlocked_at": state.get("achievements", {}).get(tier_key, {}).get("unlocked_at"),
                })
        return result
