"""
Farm UI — QWebEngineView dockable panel using Anki's webview.

Reads farm.css, farm.js, farm.html from web/ directory,
inlines everything into stdHtml, and bridges Python<->JS via pycmd.
Sprites are converted to base64 data URIs for reliable rendering.
"""

import base64
import json
from pathlib import Path
from typing import Optional

from aqt import mw
from aqt.qt import (
    QDialog, QVBoxLayout, Qt, QSize, QScreen,
)
from aqt.webview import AnkiWebView


ADDON_DIR = Path(__file__).parent
WEB_DIR = ADDON_DIR / "web"
SPRITES_DIR = WEB_DIR / "sprites"
SOUNDS_DIR = ADDON_DIR / "sounds"


class FarmWindow(QDialog):
    """Standalone resizable farm window."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("ADFarm")
        self.setMinimumSize(QSize(420, 600))
        # Start at a good size
        self.resize(500, 750)
        # Allow maximize
        self.setWindowFlags(
            Qt.WindowType.Window
            | Qt.WindowType.WindowMinMaxButtonsHint
            | Qt.WindowType.WindowCloseButtonHint
        )

    def closeEvent(self, evt):
        super().closeEvent(evt)


class FarmWebView:
    """Farm visualization in a standalone window."""

    def __init__(self, farm_manager):
        self.manager = farm_manager
        self.web: Optional[AnkiWebView] = None
        self._window: Optional[FarmWindow] = None

    def show(self):
        """Show or raise the farm window."""
        if self._window is not None and self._window.isVisible():
            self._send_state()
            self._window.raise_()
            self._window.activateWindow()
            return
        self._create_window()

    def _create_window(self):
        """Create standalone farm window."""
        self._window = FarmWindow(mw)

        layout = QVBoxLayout(self._window)
        layout.setContentsMargins(0, 0, 0, 0)

        self.web = AnkiWebView(parent=self._window, title="ADFarm")
        layout.addWidget(self.web)

        # Load content
        self._load_page()

        # Set bridge
        self.web.set_bridge_command(self._on_bridge_cmd, self)

        self._window.show()

    def _load_page(self):
        """Read web files and inline everything into stdHtml."""
        css = (WEB_DIR / "farm.css").read_text(encoding="utf-8")
        js = (WEB_DIR / "farm.js").read_text(encoding="utf-8")
        body_html = (WEB_DIR / "farm.html").read_text(encoding="utf-8")

        # Build sprite atlas as base64 data URIs
        sprite_atlas_js = self._build_sprite_atlas()

        # Build sound data URIs for audio elements
        sound_setup_js = self._build_sound_setup()

        # Wrap CSS + body + sprite atlas + sounds + JS into one blob
        full_body = (
            f"<style>\n{css}\n</style>\n"
            f"{body_html}\n"
            f"<script>\n{sprite_atlas_js}\n{sound_setup_js}\n{js}\n</script>"
        )

        self.web.stdHtml(
            body=full_body,
            css=[],
            js=[],
            context=self,
            default_css=False,
        )

    def _build_sprite_atlas(self) -> str:
        """Convert all sprites to base64 and return as JS object."""
        atlas = {}
        if not SPRITES_DIR.exists():
            return "const SPRITES = {};"

        for png_file in SPRITES_DIR.rglob("*.png"):
            # Skip spritesheets and walk files (keep individual extracted sprites)
            name = png_file.name
            skip_names = {
                "Crop_Spritesheet.png", "farm_spritesheet.png",
                "chests_32x32.png", "cow_walk.png", "chicken_walk.png",
                "pig_walk.png", "sheep_walk.png", "coin_anim.png",
                "farmland.png", "plants.png",
                # HayDay — skip backgrounds, dark variants, dialogs
                "background.png", "shop-bg.png", "scoreboard-bg.png",
                "details-bg.png", "new-level-bg.png",
                "barn-dark.png", "silo-dark.png", "shop-dark.png",
                "chicken_coop-dark.png", "pasture-dark.png",
                "field-dark.png", "wheat-field-dark.png",
                "alfalfa-field-dark.png", "mill-dark.png",
                # Old generated sprites replaced by HayDay ones
                "barn.png", "silo.png", "windmill.png", "coop.png",
            }
            # Also skip files from buildings/ folder (replaced by hayday/)
            if png_file.parent.name == "buildings" and name in (
                "bakery.png", "dairy.png", "bbq.png", "sugar_mill.png",
            ):
                continue
            if name in skip_names:
                continue

            rel = png_file.relative_to(SPRITES_DIR).as_posix()
            key = rel.replace("/", "_").replace(".png", "")
            try:
                data = png_file.read_bytes()
                b64 = base64.b64encode(data).decode("ascii")
                atlas[key] = f"data:image/png;base64,{b64}"
            except Exception:
                pass

        # Build JS
        lines = ["const SPRITES = {"]
        for key, uri in sorted(atlas.items()):
            lines.append(f'  "{key}": "{uri}",')
        lines.append("};")
        return "\n".join(lines)

    def _build_sound_setup(self) -> str:
        """Encode sound files as base64 and set audio element sources."""
        if not SOUNDS_DIR.exists():
            return "// No sounds directory found"

        sound_map = {
            "ambient": "ambient.mp3",
            "click": "click.wav",
            "error": "error.wav",
            "levelup": "levelup.wav",
        }
        lines = ["// Sound setup"]
        for snd_id, filename in sound_map.items():
            filepath = SOUNDS_DIR / filename
            if filepath.exists():
                try:
                    data = filepath.read_bytes()
                    b64 = base64.b64encode(data).decode("ascii")
                    mime = "audio/mpeg" if filename.endswith(".mp3") else "audio/wav"
                    lines.append(
                        f'document.getElementById("snd-{snd_id}").src = "data:{mime};base64,{b64}";'
                    )
                except Exception:
                    pass
        return "\n".join(lines)

    def _on_bridge_cmd(self, cmd: str) -> Optional[str]:
        """Handle pycmd('farm:...') calls from JavaScript."""
        if not cmd.startswith("farm:"):
            return None

        parts = cmd.split(":")
        action = parts[1] if len(parts) > 1 else ""
        nparts = len(parts)

        # Helper to safely read parts with bounds check
        def p(index, default=""):
            return parts[index] if index < nparts else default

        try:
            if action == "get_state":
                self._send_state()

            elif action == "clear_wilted" and nparts > 2:
                plot_id = int(p(2))
                if self.manager.clear_wilted(plot_id):
                    self._js("showNotification('Parcelle nettoyée !')")
                self._send_state()
                self.manager.save()

            elif action == "harvest" and nparts > 2:
                plot_id = int(p(2))
                result = self.manager.harvest_plot(plot_id)
                if result:
                    self._js(f"showReward({json.dumps(result)})")
                    xp_val = result.get("xp", 0)
                    self._js(f"showFloatingReward('+{xp_val} XP', window.innerWidth/2, window.innerHeight/3)")
                else:
                    # Storage full — tell the user
                    self._js("showNotification('Silo plein ! Vendez ou améliorez votre silo.')")
                self._send_state()
                self.manager.save()

            elif action == "plant" and nparts > 3:
                plot_id = int(p(2))
                crop_id = p(3)
                self.manager.plant_crop(plot_id, crop_id)
                self._send_state()
                self.manager.save()

            elif action == "sell" and nparts > 2:
                item_id = p(2)
                qty = int(p(3, "1"))
                coins = self.manager.sell_item(item_id, qty)
                if coins > 0:
                    self._js(f"showFloatingReward('+{coins} pièces', window.innerWidth/2, window.innerHeight/2)")
                    self._js(f"showNotification('Vendu pour {coins} pièces !')")
                self._send_state()
                self.manager.save()

            elif action == "buy_deco" and nparts > 2:
                deco_type = p(2)
                import random
                x = random.randint(1, 8)
                y = random.randint(1, 8)
                if self.manager.buy_decoration(deco_type, x, y):
                    self._js("showNotification('Décoration placée !')")
                else:
                    self._js("showNotification('Pas assez de pièces !')")
                self._send_state()
                self.manager.save()

            elif action == "buy_animal" and nparts > 2:
                self._buy_animal(p(2))
                self._send_state()
                self.manager.save()

            elif action == "buy_building" and nparts > 2:
                self._buy_building(p(2))
                self._send_state()
                self.manager.save()

            elif action == "spin_wheel":
                result = self.manager.spin_wheel()
                if result:
                    self._js(f"showWheelResult({json.dumps(result)})")
                else:
                    self._js("showNotification('Déjà tourné aujourd\\'hui !')")
                self._send_state()
                self.manager.save()

            elif action == "open_box" and nparts > 2:
                box_index = int(p(2))
                result = self.manager.open_mystery_box(box_index)
                if result:
                    self._js(f"showBoxResult({json.dumps(result)})")
                else:
                    self._js("showNotification('Impossible d\\'ouvrir !')")
                self._send_state()
                self.manager.save()

            elif action == "fulfill_order" and nparts > 2:
                order_index = int(p(2))
                result = self.manager.fulfill_order(order_index)
                if result:
                    r_coins = result["coins"]
                    r_xp = result["xp"]
                    self._js(f"showFloatingReward('+{r_coins} pièces', window.innerWidth/2, window.innerHeight/3)")
                    self._js(f"showNotification('Commande livrée ! +{r_coins} pièces, +{r_xp} XP')")
                else:
                    self._js("showNotification('Items manquants !')")
                self._send_state()
                self.manager.save()

            elif action == "collect" and nparts > 2:
                self._collect_building(p(2))
                self._send_state()
                self.manager.save()

            elif action == "upgrade" and nparts > 2:
                target = p(2)
                if target == "barn":
                    result = self.manager.upgrade_barn()
                    if result:
                        lvl = result["new_level"]
                        self._js(f"showNotification('Grange améliorée au niveau {lvl} !')")
                    else:
                        self._js("showNotification('Matériaux insuffisants !')")
                elif target == "silo":
                    result = self.manager.upgrade_silo()
                    if result:
                        lvl = result["new_level"]
                        self._js(f"showNotification('Silo amélioré au niveau {lvl} !')")
                    else:
                        self._js("showNotification('Matériaux insuffisants !')")
                self._send_state()
                self.manager.save()

            elif action == "building_detail" and nparts > 2:
                building_id = p(2)
                self._send_building_detail(building_id)

            elif action == "start_production" and nparts > 3:
                building_id = p(2)
                recipe_id = p(3)
                self._start_production(building_id, recipe_id)
                self._send_state()
                self.manager.save()

            elif action == "expand":
                count = int(p(2, "2"))
                self._expand_farm(count)
                self._send_state()
                self.manager.save()

            elif action == "get_achievements":
                self._send_achievements()

        except Exception as e:
            print(f"[ADFarm] Bridge error: {e}")
            import traceback
            traceback.print_exc()

        return None

    # --- Data senders ---

    def _send_state(self):
        """Push current farm state to JS."""
        data = self.manager.get_farm_data()
        self._js(f"updateFarm({json.dumps(data)})")

    def _send_achievements(self):
        """Push achievements data to JS."""
        from . import achievements as ach_mod
        mgr = ach_mod.AchievementManager()
        state_dict = self.manager.state.to_dict()
        all_ach = mgr.get_all_with_status(state_dict)
        self._js(f"updateAchievements({json.dumps(all_ach)})")

    # --- Shop helpers ---

    def _buy_animal(self, animal_id: str):
        from . import progression
        animal_def = progression.ANIMAL_DEFINITIONS.get(animal_id)
        if not animal_def:
            self._js("showNotification('Animal inconnu !')")
            return
        if animal_id not in self.manager.state.unlocked_animals:
            self._js("showNotification('Animal pas encore débloqué !')")
            return
        cost = animal_def.get("cost_coins", 100)
        if self.manager.state.coins < cost:
            self._js("showNotification('Pas assez de pièces !')")
            return
        max_owned = animal_def.get("max_owned", 5)
        current = self.manager.state.animals.get(animal_id, {}).get("count", 0)
        if current >= max_owned:
            aname = animal_def["name"]
            self._js(f"showNotification('Maximum de {aname} atteint !')")
            return
        self.manager.state.coins -= cost
        self.manager.state.total_coins_spent += cost
        if animal_id not in self.manager.state.animals:
            self.manager.state.animals[animal_id] = {"count": 0, "reviews_since_last": 0}
        self.manager.state.animals[animal_id]["count"] = current + 1
        aname = animal_def["name"]
        self._js(f"showNotification('{aname} acheté(e) !')")

    def _buy_building(self, building_id: str):
        from . import progression
        building_def = progression.BUILDING_DEFINITIONS.get(building_id)
        if not building_def:
            self._js("showNotification('Bâtiment inconnu !')")
            return
        if building_id in self.manager.state.buildings:
            self._js("showNotification('Déjà construit !')")
            return
        cost = building_def.get("cost_coins", 100)
        if self.manager.state.coins < cost:
            self._js("showNotification('Pas assez de pièces !')")
            return
        self.manager.state.coins -= cost
        self.manager.state.total_coins_spent += cost
        self.manager.state.buildings[building_id] = {"level": 1}
        bname = building_def["name"]
        self._js(f"showNotification('{bname} construit !')")

    def _send_building_detail(self, building_id: str):
        """Send building detail with recipes to JS for production dialog."""
        from . import production, progression
        prod_mgr = production.ProductionManager(self.manager.state)
        building_def = progression.BUILDING_DEFINITIONS.get(building_id, {})
        recipes = prod_mgr.get_available_recipes(building_id)

        recipe_data = []
        for recipe in recipes:
            can, reason = prod_mgr.can_craft(building_id, recipe["id"])
            recipe_data.append({
                "id": recipe["id"],
                "name": recipe["name"],
                "emoji": recipe["emoji"],
                "ingredients": recipe["ingredients"],
                "xp": recipe["xp"],
                "sessions_required": recipe["sessions_required"],
                "can_craft": can,
                "reason": reason,
            })

        queue = self.manager.state.production_queues.get(building_id, [])
        queue_data = [
            {
                "name": item.get("name", ""),
                "emoji": item.get("emoji", ""),
                "ready": item.get("ready", False),
                "sessions_waited": item.get("sessions_waited", 0),
                "sessions_required": item.get("sessions_required", 1),
            }
            for item in queue
        ]

        data = {
            "building_id": building_id,
            "building_name": building_def.get("name", building_id),
            "recipes": recipe_data,
            "queue": queue_data,
        }
        self._js(f"updateBuildingDetail({json.dumps(data)})")

    def _expand_farm(self, count: int):
        """Expand farm by adding plots (costs coins + materials)."""
        cost_coins = 50 * self.manager.state.num_plots
        cost_deed = 1
        cost_permit = 1

        if self.manager.state.coins < cost_coins:
            self._js(f"showNotification('Il faut {cost_coins} pièces pour agrandir !')")
            return
        if self.manager.state.inventory.get("land_deed", 0) < cost_deed:
            self._js("showNotification('Titre de propriété requis !')")
            return
        if self.manager.state.inventory.get("expansion_permit", 0) < cost_permit:
            self._js("showNotification('Permis d\\'expansion requis !')")
            return

        self.manager.state.coins -= cost_coins
        self.manager.state.total_coins_spent += cost_coins
        self.manager.state.remove_item("land_deed", cost_deed)
        self.manager.state.remove_item("expansion_permit", cost_permit)
        self.manager.state.add_plots(count)
        new_total = self.manager.state.num_plots
        self._js(f"showNotification('Ferme agrandie ! {new_total} parcelles !')")

    def _start_production(self, building_id: str, recipe_id: str):
        """Start production of a recipe in a building."""
        from . import production
        prod_mgr = production.ProductionManager(self.manager.state)
        result = prod_mgr.start_production(building_id, recipe_id)
        if result:
            r_name = result["name"]
            self._js(f"showNotification('Production de {r_name} lancée !')")
        else:
            can, reason = prod_mgr.can_craft(building_id, recipe_id)
            self._js(f"showNotification('{reason}')")

    def _collect_building(self, building_id: str):
        from . import production
        prod_mgr = production.ProductionManager(self.manager.state)
        collected = prod_mgr.collect_ready(building_id)
        for item in collected:
            i_emoji = item["emoji"]
            i_name = item["name"]
            i_xp = item["xp"]
            self.manager.state.total_produced += 1
            self._js(f"showNotification('{i_emoji} {i_name} récupéré ! +{i_xp} XP')")

    # --- JS execution ---

    def _js(self, code: str):
        """Execute JavaScript in the farm webview."""
        if self.web:
            self.web.eval(code)

    # --- Lifecycle ---

    def close(self):
        """Programmatic close."""
        if self._window:
            self._window.close()
            self._window = None
            self.web = None

    def refresh(self):
        """Refresh farm state in the UI."""
        if self.web:
            self._send_state()

    def on_review(self, rewards: dict):
        """Called after a card review — show reward animation."""
        if self.web:
            self._js(f"showReward({json.dumps(rewards)})")
            self._send_state()

    def on_level_up(self, data: dict):
        """Show level up celebration."""
        if self.web:
            self._js(f"showLevelUp({json.dumps(data)})")

    def on_session_end(self, summary: dict):
        """Show session summary."""
        if self.web:
            self._js(f"showSessionSummary({json.dumps(summary)})")
