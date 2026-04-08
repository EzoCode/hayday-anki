"""
Production System — Buildings, recipes, and production chains.

Production advances with EVERY card review for smooth progress feedback.
A recipe with reviews_required=10 completes after 10 reviews.
A recipe with reviews_required=20 completes after 20 reviews.
Progress bars move every review — the core addictive loop.
"""

from typing import Dict, List, Optional, Tuple


# =============================================================================
# RECIPE DEFINITIONS
# =============================================================================
# reviews_required: how many card reviews until production completes
# Progress bar moves with EVERY review for satisfying feedback

RECIPES: Dict[str, List[Dict]] = {
    "bakery": [
        {
            "id": "bread",
            "name": "Pain",
            "ingredients": {"wheat": 3},
            "output": {"bread": 1},
            "reviews_required": 10,
            "xp": 5,
        },
        {
            "id": "cookie",
            "name": "Cookie",
            "ingredients": {"wheat": 2, "egg": 1},
            "output": {"cookie": 1},
            "reviews_required": 10,
            "xp": 8,
        },
    ],
    "sugar_mill": [
        {
            "id": "sugar",
            "name": "Sucre",
            "ingredients": {"rice": 3},
            "output": {"sugar": 1},
            "reviews_required": 10,
            "xp": 4,
        },
    ],
    "dairy": [
        {
            "id": "butter",
            "name": "Beurre",
            "ingredients": {"milk": 2},
            "output": {"butter": 1},
            "reviews_required": 10,
            "xp": 6,
        },
        {
            "id": "cheese",
            "name": "Fromage",
            "ingredients": {"milk": 3},
            "output": {"cheese": 1},
            "reviews_required": 20,
            "xp": 7,
        },
        {
            "id": "cream",
            "name": "Crème",
            "ingredients": {"milk": 2},
            "output": {"cream": 1},
            "reviews_required": 10,
            "xp": 6,
        },
    ],
    "bbq": [
        {
            "id": "burger",
            "name": "Burger",
            "ingredients": {"bread": 1, "bacon": 1},
            "output": {"burger": 1},
            "reviews_required": 20,
            "xp": 18,
        },
    ],
    "pastry_shop": [
        {
            "id": "cake",
            "name": "Gâteau",
            "ingredients": {"bread": 1, "butter": 1, "egg": 1},
            "output": {"cake": 1},
            "reviews_required": 20,
            "xp": 12,
        },
        {
            "id": "pie",
            "name": "Tarte à l'orange",
            "ingredients": {"wheat": 2, "orange": 2, "sugar": 1},
            "output": {"pie": 1},
            "reviews_required": 20,
            "xp": 14,
        },
    ],
    "jam_maker": [
        {
            "id": "jam",
            "name": "Confiture de fraises",
            "ingredients": {"strawberry": 3, "sugar": 1},
            "output": {"jam": 1},
            "reviews_required": 10,
            "xp": 10,
        },
        {
            "id": "grape_jam",
            "name": "Confiture de raisin",
            "ingredients": {"grapes": 3, "sugar": 1},
            "output": {"grape_jam": 1},
            "reviews_required": 10,
            "xp": 12,
        },
    ],
    "pizzeria": [
        {
            "id": "pizza",
            "name": "Pizza",
            "ingredients": {"bread": 1, "tomato": 2, "cheese": 1},
            "output": {"pizza": 1},
            "reviews_required": 20,
            "xp": 15,
        },
    ],
    "juice_press": [
        {
            "id": "juice",
            "name": "Jus d'orange",
            "ingredients": {"orange": 3},
            "output": {"juice": 1},
            "reviews_required": 10,
            "xp": 8,
        },
        {
            "id": "lemonade",
            "name": "Limonade",
            "ingredients": {"lemon": 3, "sugar": 1},
            "output": {"lemonade": 1},
            "reviews_required": 10,
            "xp": 10,
        },
    ],
    "pie_oven": [
        {
            "id": "melon_pie",
            "name": "Tarte au melon",
            "ingredients": {"melon": 2, "wheat": 2, "cream": 1},
            "output": {"melon_pie": 1},
            "reviews_required": 20,
            "xp": 18,
        },
    ],
}


class ProductionManager:
    """Manages production queues and crafting logic."""

    def __init__(self, farm_state):
        """
        farm_state: reference to FarmState object for inventory access.
        """
        self.state = farm_state

    def get_available_recipes(self, building_id: str) -> List[Dict]:
        """Get recipes available for a building."""
        return RECIPES.get(building_id, [])

    def can_craft(self, building_id: str, recipe_id: str) -> Tuple[bool, str]:
        """
        Check if a recipe can be started.
        Returns (can_craft: bool, reason: str)
        """
        recipes = RECIPES.get(building_id)
        if not recipes:
            return False, "Bâtiment introuvable."

        recipe = None
        for r in recipes:
            if r["id"] == recipe_id:
                recipe = r
                break
        if not recipe:
            return False, "Recette introuvable."

        # Check queue capacity
        from . import progression
        building_def = progression.BUILDING_DEFINITIONS.get(building_id, {})
        max_queue = building_def.get("max_queue", 2)

        current_queue = self.state.production_queues.get(building_id, [])
        if len(current_queue) >= max_queue:
            return False, "File de production pleine !"

        # Check ingredients
        from .farm_manager import ITEM_CATALOG
        for item_id, qty in recipe["ingredients"].items():
            have = self.state.inventory.get(item_id, 0)
            if have < qty:
                item_info = ITEM_CATALOG.get(item_id, {})
                item_name = item_info.get("name", item_id.replace("_", " ").title())
                return False, f"Il faut {qty} {item_name} (tu en as {have})"

        return True, "OK"

    def start_production(self, building_id: str, recipe_id: str) -> Optional[Dict]:
        """
        Start producing a recipe. Consumes ingredients.
        Returns production info or None on failure.
        """
        can, reason = self.can_craft(building_id, recipe_id)
        if not can:
            return None

        recipes = RECIPES.get(building_id, [])
        recipe = next((r for r in recipes if r["id"] == recipe_id), None)
        if not recipe:
            return None

        # Consume ingredients
        for item_id, qty in recipe["ingredients"].items():
            self.state.remove_item(item_id, qty)

        # Add to production queue
        if building_id not in self.state.production_queues:
            self.state.production_queues[building_id] = []

        reviews_req = recipe.get("reviews_required", recipe.get("sessions_required", 1) * 10)

        production_item = {
            "recipe_id": recipe_id,
            "name": recipe["name"],
            "output": recipe["output"],
            "xp": recipe["xp"],
            "reviews_required": reviews_req,
            "reviews_done": 0,
            "ready": False,
        }

        self.state.production_queues[building_id].append(production_item)

        return {
            "building": building_id,
            "recipe": recipe_id,
            "name": recipe["name"],
            "reviews_required": reviews_req,
        }

    def collect_ready(self, building_id: str) -> List[Dict]:
        """
        Collect all ready products from a building's queue.
        Returns list of collected items.
        """
        queue = self.state.production_queues.get(building_id, [])
        collected = []

        remaining = []
        for item in queue:
            if item.get("ready", False):
                # Add output to inventory
                all_added = True
                for output_id, qty in item["output"].items():
                    if self.state.add_item(output_id, qty):
                        collected.append({
                            "item": output_id,
                            "qty": qty,
                            "name": item["name"],
                            "xp": item["xp"],
                            "storage_full": False,
                        })
                        self.state.xp += item["xp"]
                        self.state.session_xp_earned += item["xp"]
                        self.state.total_produced += 1
                    else:
                        # Storage full — keep in queue and notify
                        remaining.append(item)
                        collected.append({
                            "item": output_id,
                            "qty": 0,
                            "name": item["name"],
                            "xp": 0,
                            "storage_full": True,
                        })
                        all_added = False
            else:
                remaining.append(item)

        self.state.production_queues[building_id] = remaining
        return collected

    def get_all_queues_status(self) -> Dict[str, List[Dict]]:
        """Get status of all production queues for UI display."""
        result = {}
        for building_id, queue in self.state.production_queues.items():
            result[building_id] = []
            for item in queue:
                reviews_done = item.get("reviews_done", item.get("sessions_waited", 0) * 10)
                reviews_req = item.get("reviews_required", item.get("sessions_required", 1) * 10)
                result[building_id].append({
                    "recipe_id": item["recipe_id"],
                    "name": item["name"],
                    "ready": item.get("ready", False),
                    "reviews_done": reviews_done,
                    "reviews_required": reviews_req,
                    # Legacy fields for backward compat with JS
                    "sessions_waited": item.get("sessions_waited", reviews_done // 10),
                    "sessions_required": item.get("sessions_required", max(1, reviews_req // 10)),
                })
        return result
