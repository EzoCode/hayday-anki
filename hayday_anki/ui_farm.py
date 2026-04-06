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

    def __init__(self, parent=None, on_close=None):
        super().__init__(parent)
        self._on_close = on_close
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
        if self._on_close:
            self._on_close()
        super().closeEvent(evt)


class FarmWebView:
    """Farm visualization in a standalone window."""

    def __init__(self, farm_manager):
        self.manager = farm_manager
        self.web: Optional[AnkiWebView] = None
        self._window: Optional[FarmWindow] = None
        self._defs_sent: bool = False

    def show(self):
        """Show or raise the farm window."""
        if self._window is not None and self._window.isVisible():
            self._send_state()
            self._window.raise_()
            self._window.activateWindow()
            return
        self._create_window()

    def _on_window_closed(self):
        """Called when the farm window is closed by user."""
        self.web = None
        self._window = None
        self._defs_sent = False

    def _create_window(self):
        """Create standalone farm window."""
        self._window = FarmWindow(mw, on_close=self._on_window_closed)

        layout = QVBoxLayout(self._window)
        layout.setContentsMargins(0, 0, 0, 0)

        self.web = AnkiWebView(parent=self._window, title="ADFarm")
        layout.addWidget(self.web)

        # Set bridge BEFORE loading content (avoids race condition)
        self.web.set_bridge_command(self._on_bridge_cmd, self)

        # Load content (JS will call pycmd('farm:get_state') on DOMContentLoaded)
        self._load_page()

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
            # Skip large spritesheets and source files
            skip_names = {
                "Crop_Spritesheet.png", "farm_spritesheet.png",
                "chests_32x32.png", "cow_walk.png", "chicken_walk.png",
                "pig_walk.png", "sheep_walk.png", "coin_anim.png",
                "farmland.png", "plants.png",
            }
            if name in skip_names:
                continue

            # Skip dark variants only (keep backgrounds for UI)
            rel_path = png_file.relative_to(SPRITES_DIR).as_posix()
            skip_paths = {
                "hayday/scoreboard-bg.png",
                "hayday/barn-dark.png", "hayday/silo-dark.png",
                "hayday/shop-dark.png", "hayday/chicken_coop-dark.png",
                "hayday/pasture-dark.png", "hayday/field-dark.png",
                "hayday/wheat-field-dark.png", "hayday/alfalfa-field-dark.png",
            }
            if rel_path in skip_paths:
                continue

            # Skip old generated building sprites (replaced by hayday/)
            if png_file.parent.name == "buildings":
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

        try:
            if action == "get_state":
                self._send_state()

            elif action == "clear_wilted":
                plot_id = int(parts[2])
                if self.manager.clear_wilted(plot_id):
                    self._js("showNotification('Parcelle nettoyée !')")
                self._send_state()
                self.manager.save()

            elif action == "harvest":
                plot_id = int(parts[2])
                result = self.manager.harvest_plot(plot_id)
                if result:
                    self._js(f"showReward({json.dumps(result)})")
                    xp_val = result.get("xp", 0)
                    self._js(f"showFloatingReward('+{xp_val} XP', window.innerWidth/2, window.innerHeight/3)")
                    self._check_and_show_level_up()
                self._send_state()
                self.manager.save()

            elif action == "harvest_all":
                from .farm_manager import ITEM_CATALOG as _IC
                result = self.manager.harvest_all()
                if result["count"] > 0:
                    total_xp = result["xp"]
                    items_text = ", ".join(
                        f"{qty}x {_IC.get(iid, {}).get('name', iid)}"
                        for iid, qty in result["items"].items()
                    )
                    self._js(f"showFloatingReward('+{total_xp} XP', window.innerWidth/2, window.innerHeight/3)")
                    msg = f"{result['count']} récoltes : {items_text}"
                    self._js(f"showNotification({json.dumps(msg)}, 'reward')")
                    self._check_and_show_level_up()
                else:
                    self._js("showNotification('Aucune récolte prête !')")
                self._send_state()
                self.manager.save()

            elif action == "plant":
                plot_id = int(parts[2])
                crop_id = parts[3]
                if self.manager.plant_crop(plot_id, crop_id):
                    from . import progression
                    crop_def = progression.CROP_DEFINITIONS.get(crop_id, {})
                    crop_name = crop_def.get("name", crop_id)
                    total_reviews = crop_def.get("growth_reviews", 3) * 4
                    msg = f"{crop_name} planté(e) ! ({total_reviews} reviews pour mûrir)"
                    self._js(f"showNotification({json.dumps(msg)})")
                else:
                    self._js("showNotification('Impossible de planter ici !')")
                self._send_state()
                self.manager.save()

            elif action == "plant_all_empty":
                count = self.manager.plant_all_empty()
                if count > 0:
                    self._js(f"showNotification({json.dumps(f'{count} cultures plantées !')})")
                else:
                    self._js("showNotification('Aucune parcelle à replanter !')")
                self._send_state()
                self.manager.save()

            elif action == "sell":
                item_id = parts[2]
                qty = int(parts[3]) if len(parts) > 3 else 1
                coins = self.manager.sell_item(item_id, qty)
                if coins > 0:
                    self._js(f"showFloatingReward('+{coins} pièces', window.innerWidth/2, window.innerHeight/2)")
                    self._js(f"showNotification('Vendu pour {coins} pièces !')")
                self._send_state()
                self.manager.save()

            elif action == "buy_deco":
                deco_type = parts[2]
                import random
                x = random.randint(1, 8)
                y = random.randint(1, 8)
                if self.manager.buy_decoration(deco_type, x, y):
                    self._js("showNotification('Décoration placée !')")
                else:
                    self._js("showNotification('Pas assez de pièces !')")
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

            elif action == "open_box":
                box_index = int(parts[2])
                result = self.manager.open_mystery_box(box_index)
                if result:
                    self._js(f"showBoxResult({json.dumps(result)})")
                else:
                    self._js("showNotification('Impossible d\\'ouvrir !')")
                self._send_state()
                self.manager.save()

            elif action == "fulfill_order":
                order_index = int(parts[2])
                result = self.manager.fulfill_order(order_index)
                if result:
                    r_coins = result["coins"]
                    r_xp = result["xp"]
                    self._js(f"showFloatingReward('+{r_coins} pièces', window.innerWidth/2, window.innerHeight/3)")
                    self._js(f"showNotification('Commande livrée ! +{r_coins} pièces, +{r_xp} XP')")
                    self._check_and_show_level_up()
                else:
                    self._js("showNotification('Items manquants !')")
                self._send_state()
                self.manager.save()

            elif action == "collect":
                self._collect_building(parts[2])
                self._check_and_show_level_up()
                self._send_state()
                self.manager.save()

            elif action == "upgrade":
                target = parts[2]
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

            elif action == "building_detail":
                building_id = parts[2]
                self._send_building_detail(building_id)

            elif action == "start_production":
                building_id = parts[2]
                recipe_id = parts[3]
                self._start_production(building_id, recipe_id)
                self._send_state()
                self.manager.save()

            elif action == "add_field":
                cost = self.manager.get_field_cost()
                if self.manager.add_field():
                    msg = "Nouveau champ ajouté !"
                    if cost > 0:
                        msg = f"Nouveau champ ajouté ! (-{cost} pièces)"
                    self._js(f"showNotification('{msg}')")
                else:
                    used = self.manager.get_land_used()
                    total = self.manager.state.land_total
                    coins = self.manager.state.coins
                    if used >= total:
                        self._js(f"showNotification('Terrain plein ({used}/{total}) ! Achète du terrain.')")
                    else:
                        self._js(f"showNotification('Pas assez de pièces ({coins}/{cost}) !')")
                self._send_state()
                self.manager.save()

            elif action == "add_pasture":
                animal_type = parts[2] if len(parts) > 2 else ""
                if self.manager.add_pasture(animal_type):
                    from . import progression
                    adef = progression.ANIMAL_DEFINITIONS.get(animal_type, {})
                    aname = adef.get("name", animal_type)
                    self._js(f"showNotification({json.dumps(f'{aname} acheté(e) !')})")
                else:
                    reason = self.manager.get_pasture_fail_reason(animal_type)
                    self._js(f"showNotification({json.dumps(reason)})")
                self._send_state()
                self.manager.save()

            elif action == "build":
                building_id = parts[2] if len(parts) > 2 else ""
                if self.manager.build_building(building_id):
                    from . import progression
                    bdef = progression.BUILDING_DEFINITIONS.get(building_id, {})
                    bname = bdef.get("name", building_id)
                    self._js(f"showNotification({json.dumps(f'{bname} construit !')})")
                else:
                    reason = self.manager.get_build_fail_reason(building_id)
                    self._js(f"showNotification({json.dumps(reason)})")
                self._send_state()
                self.manager.save()

            elif action == "buy_land":
                if self.manager.buy_land():
                    total = self.manager.state.land_total
                    self._js(f"showNotification('Terrain agrandi ! Total: {total}')")
                else:
                    cost = 100 * (self.manager.state.land_total // 5)
                    deeds = self.manager.state.inventory.get("land_deed", 0)
                    self._js(f"showNotification('Besoin de {cost} pièces + Land Deed ({deeds}/1)')")
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
        """Push current farm state to JS.
        Static definitions are sent once via initDefs() and merged client-side."""
        if not hasattr(self, '_defs_sent') or not self._defs_sent:
            defs = self.manager.get_static_defs()
            self._js(f"initDefs({json.dumps(defs)})")
            self._defs_sent = True
        data = self.manager.get_farm_data()
        self._js(f"updateFarm({json.dumps(data)})")

    def _send_achievements(self):
        """Push achievements data to JS."""
        from . import achievements as ach_mod
        # Reuse single instance — AchievementManager is stateless lookup
        if not hasattr(self, '_ach_mgr'):
            self._ach_mgr = ach_mod.AchievementManager()
        state_dict = self.manager.state.to_dict()
        all_ach = self._ach_mgr.get_all_with_status(state_dict)
        self._js(f"updateAchievements({json.dumps(all_ach)})")

    # --- Shop helpers ---

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
                "recipe_id": item.get("recipe_id", ""),
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
            if item.get("storage_full"):
                self._js(f"showNotification({json.dumps(f'Silo plein ! {i_name} reste en attente.')})")
            else:
                i_xp = item["xp"]
                self._js(f"showNotification({json.dumps(f'{i_name} récupéré ! +{i_xp} XP')}, 'reward')")

    def _check_and_show_level_up(self):
        """Check if XP earned outside reviews triggered a level-up."""
        level_up = self.manager._check_level_up()
        if level_up:
            self.manager.save()
            if self.web:
                self._js(f"showLevelUp({json.dumps(level_up)})")

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
            self._defs_sent = False

    def refresh(self):
        """Refresh farm state in the UI."""
        if self.web:
            self._send_state()

    def on_review(self, rewards: dict):
        """Called after a card review — show reward animation."""
        if self.web:
            self._js(f"showReward({json.dumps(rewards)})")
            # Show any additional notifications (storage full, etc.)
            for notif in rewards.get("notifications", []):
                if notif.get("type") in ("storage_full",):
                    msg = notif.get("message", "")
                    self._js(f"showNotification({json.dumps(msg)})")
            self._send_state()

    def on_level_up(self, data: dict):
        """Show level up celebration."""
        if self.web:
            self._js(f"showLevelUp({json.dumps(data)})")

    def on_session_end(self, summary: dict):
        """Show session summary."""
        if self.web:
            self._js(f"showSessionSummary({json.dumps(summary)})")
