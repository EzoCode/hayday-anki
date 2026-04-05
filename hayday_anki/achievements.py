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
    # --- JALONS DE REVISION ---
    {
        "id": "first_steps",
        "name": "Premiers pas",
        "desc": "Reviser {target} cartes",
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
        "name": "Chercheur de savoir",
        "desc": "Reviser {target} cartes au total",
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
        "name": "Maitre de la memoire",
        "desc": "Reviser {target} cartes au total",
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
        "name": "Erudit",
        "desc": "Completer {target} sessions de revision",
        "category": "reviews",
        "icon": "\U0001F393",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 100, "gems": 5},
            {"tier": "gold", "target": 500, "gems": 15},
        ],
    },

    # --- SERIES ---
    {
        "id": "on_fire",
        "name": "En feu",
        "desc": "Maintenir une serie de {target} jours",
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
        "name": "Inarretable",
        "desc": "Maintenir une serie de {target} jours",
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
        "name": "Volonte de fer",
        "desc": "Maintenir une serie de {target} jours",
        "category": "streaks",
        "icon": "\u2694\uFE0F",
        "tiers": [
            {"tier": "bronze", "target": 90, "gems": 10},
            {"tier": "silver", "target": 180, "gems": 25},
            {"tier": "gold", "target": 365, "gems": 100},
        ],
    },

    # --- PRECISION ---
    {
        "id": "sharp_mind",
        "name": "Esprit vif",
        "desc": "Atteindre {target}% de precision en session (20+ cartes)",
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
        "name": "Session parfaite",
        "desc": "100% de precision sur {target}+ cartes en une session",
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
        "name": "Apprenant constant",
        "desc": "Maintenir {target}%+ de retention globale",
        "category": "accuracy",
        "icon": "\U0001F4C8",
        "tiers": [
            {"tier": "bronze", "target": 80, "gems": 2},
            {"tier": "silver", "target": 90, "gems": 5},
            {"tier": "gold", "target": 95, "gems": 15},
        ],
    },

    # --- HORAIRES ---
    {
        "id": "early_bird",
        "name": "Leve-tot",
        "desc": "Reviser avant 7h {target} fois",
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
        "name": "Couche-tard",
        "desc": "Reviser apres 23h {target} fois",
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
        "name": "Guerrier du weekend",
        "desc": "Reviser pendant {target} weekends",
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
        "name": "Marathonien",
        "desc": "Etudier pendant {target}+ minutes en une session",
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
        "name": "Heures de devouement",
        "desc": "Passer {target} heures a etudier",
        "category": "time",
        "icon": "\u23F0",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 2},
            {"tier": "silver", "target": 50, "gems": 10},
            {"tier": "gold", "target": 500, "gems": 50},
        ],
    },

    # --- AGRICULTURE ---
    {
        "id": "first_harvest",
        "name": "Premiere recolte",
        "desc": "Recolter {target} cultures",
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
        "name": "Variete de cultures",
        "desc": "Cultiver {target} types differents",
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
        "name": "Ami des animaux",
        "desc": "Posseder {target} animaux",
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
        "name": "Main verte",
        "desc": "Avoir {target} parcelles actives",
        "category": "farming",
        "icon": "\U0001F44D",
        "tiers": [
            {"tier": "bronze", "target": 6, "gems": 1},
            {"tier": "silver", "target": 15, "gems": 5},
            {"tier": "gold", "target": 30, "gems": 15},
        ],
    },

    # --- COLLECTIONS ---
    {
        "id": "decorator",
        "name": "Decorateur",
        "desc": "Placer {target} decorations sur la ferme",
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
        "name": "Collectionneur de deco",
        "desc": "Posseder {target} types de decorations uniques",
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
        "name": "Chasseur de succes",
        "desc": "Debloquer {target} succes",
        "category": "collections",
        "icon": "\U0001F3C5",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 2},
            {"tier": "silver", "target": 30, "gems": 8},
            {"tier": "gold", "target": 75, "gems": 25},
        ],
    },

    # --- ECONOMIE ---
    {
        "id": "coin_collector",
        "name": "Collecteur de pieces",
        "desc": "Gagner {target} pieces au total",
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
        "name": "Grand depensier",
        "desc": "Depenser {target} pieces au total",
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
        "name": "Amasseur de gemmes",
        "desc": "Accumuler {target} gemmes",
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
        "name": "Marchand",
        "desc": "Vendre {target} articles",
        "category": "economy",
        "icon": "\U0001F4B5",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 100, "gems": 5},
            {"tier": "gold", "target": 1000, "gems": 15},
        ],
    },

    # --- COMMANDES ---
    {
        "id": "trucker",
        "name": "Camionneur",
        "desc": "Completer {target} commandes camion",
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
        "name": "Marin",
        "desc": "Completer {target} commandes bateau",
        "category": "orders",
        "icon": "\u26F5",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 50, "gems": 5},
            {"tier": "gold", "target": 250, "gems": 15},
        ],
    },

    # --- PRODUCTION ---
    {
        "id": "chef",
        "name": "Chef cuisinier",
        "desc": "Produire {target} produits transformes",
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
        "name": "Maitre boulanger",
        "desc": "Cuire {target} miches de pain",
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
        "desc": "Produire {target} fromages",
        "category": "production",
        "icon": "\U0001F9C0",
        "tiers": [
            {"tier": "bronze", "target": 5, "gems": 1},
            {"tier": "silver", "target": 30, "gems": 3},
            {"tier": "gold", "target": 100, "gems": 10},
        ],
    },

    # --- MYSTERE & CHANCE ---
    {
        "id": "treasure_hunter",
        "name": "Chasseur de tresor",
        "desc": "Ouvrir {target} boites mystere",
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
        "name": "Chanceux",
        "desc": "Tourner la roue {target} fois",
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
        "name": "Collecteur de materiaux",
        "desc": "Collecter {target} materiaux",
        "category": "luck",
        "icon": "\U0001F529",
        "tiers": [
            {"tier": "bronze", "target": 10, "gems": 1},
            {"tier": "silver", "target": 50, "gems": 3},
            {"tier": "gold", "target": 200, "gems": 10},
        ],
    },

    # --- NIVEAUX ---
    {
        "id": "rising_star",
        "name": "Etoile montante",
        "desc": "Atteindre le niveau {target}",
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
        "name": "Fermier veteran",
        "desc": "Atteindre le niveau {target}",
        "category": "levels",
        "icon": "\U0001F451",
        "tiers": [
            {"tier": "bronze", "target": 75, "gems": 5},
            {"tier": "silver", "target": 100, "gems": 15},
            {"tier": "gold", "target": 200, "gems": 50},
        ],
    },

    # --- AMELIORATIONS ---
    {
        "id": "barn_builder",
        "name": "Batisseur de grange",
        "desc": "Ameliorer la grange {target} fois",
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
        "name": "Maitre du silo",
        "desc": "Ameliorer le silo {target} fois",
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
        "name": "Baron foncier",
        "desc": "Agrandir la ferme a {target} parcelles",
        "category": "upgrades",
        "icon": "\U0001F30D",
        "tiers": [
            {"tier": "bronze", "target": 12, "gems": 2},
            {"tier": "silver", "target": 24, "gems": 8},
            {"tier": "gold", "target": 50, "gems": 25},
        ],
    },

    # --- DIVERSITE ---
    {
        "id": "polyglot",
        "name": "Polyglotte",
        "desc": "Reviser des cartes de {target} paquets differents en un jour",
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
            animals = state.get("animals", {})
            total_animals = sum(
                a.get("count", 0) if isinstance(a, dict) else 0
                for a in animals.values()
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
        elif ach_id == "animal_lover":
            animals = state.get("animals", {})
            current = sum(a.get("count", 0) if isinstance(a, dict) else 0 for a in animals.values())
        elif ach_id == "green_thumb":
            current = state.get("num_plots", 6)
        elif ach_id == "decorator":
            current = len(state.get("decorations", []))
        elif ach_id == "deco_collector":
            current = len(set(d.get("type") for d in state.get("decorations", [])))
        elif ach_id == "achievement_hunter":
            current = len(state.get("achievements", {}))
        elif ach_id == "coin_collector":
            current = state.get("total_coins_earned", 0)
        elif ach_id == "big_spender":
            current = state.get("total_coins_spent", 0)
        elif ach_id == "gem_hoarder":
            current = state.get("gems", 0)
        elif ach_id == "merchant":
            current = state.get("total_items_sold", 0)
        elif ach_id in ("trucker", "sailor"):
            current = state.get("orders_completed", 0)
        elif ach_id in ("chef", "baker", "cheese_maker"):
            current = state.get("total_produced", 0)
        elif ach_id == "treasure_hunter":
            current = state.get("mystery_boxes_opened", 0)
        elif ach_id == "lucky_spinner":
            current = state.get("wheel_spins", 0)
        elif ach_id == "material_collector":
            current = state.get("materials_collected", 0)
        elif ach["category"] == "levels":
            current = state.get("level", 1)
        elif ach_id == "barn_builder":
            current = max(0, state.get("barn_level", 1) - 1)
        elif ach_id == "silo_master":
            current = max(0, state.get("silo_level", 1) - 1)
        elif ach_id == "land_baron":
            current = state.get("num_plots", 6)
        else:
            current = 0

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
