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

        # Load SVG crop sprites (high-quality replacements)
        crop_sprites_js = ""
        crop_sprites_file = WEB_DIR / "crop_sprites.js"
        if crop_sprites_file.exists():
            crop_sprites_js = crop_sprites_file.read_text(encoding="utf-8")

        # Build sound data URIs for audio elements
        sound_setup_js = self._build_sound_setup()

        # Build embedded @font-face CSS for game font
        font_css = self._build_font_css()

        # Wrap CSS + body + sprite atlas + crop SVGs + sounds + JS into one blob
        full_body = (
            f"<style>\n{font_css}\n{css}\n</style>\n"
            f"{body_html}\n"
            f"<script>\n{sprite_atlas_js}\n{crop_sprites_js}\n{sound_setup_js}\n{js}\n</script>"
        )

        self.web.stdHtml(
            body=full_body,
            css=[],
            js=[],
            context=self,
            default_css=False,
        )

    def _build_font_css(self) -> str:
        """Embed game font (Nunito) as base64 @font-face rules."""
        fonts_dir = WEB_DIR / "fonts"
        if not fonts_dir.exists():
            return ""
        rules = []
        font_files = [
            ("nunito-bold.woff2", 700),
            ("nunito-extrabold.woff2", 800),
        ]
        for filename, weight in font_files:
            filepath = fonts_dir / filename
            if filepath.exists():
                try:
                    data = filepath.read_bytes()
                    b64 = base64.b64encode(data).decode("ascii")
                    rules.append(
                        f"@font-face {{\n"
                        f"  font-family: 'Nunito';\n"
                        f"  font-weight: {weight};\n"
                        f"  font-style: normal;\n"
                        f"  font-display: swap;\n"
                        f"  src: url('data:font/woff2;base64,{b64}') format('woff2');\n"
                        f"}}"
                    )
                except Exception:
                    pass
        return "\n".join(rules)

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

            # Keep building PNGs (high-quality 80x80 isometric sprites)
            # Keep crop PNGs as fallback (48x48 pixel art)

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
                    # Show harvest quantity notification with crop icon
                    from .farm_manager import ITEM_CATALOG as _IC
                    harvest_coins = result.get("coins", 0)
                    for item_id, qty in result.get("items", {}).items():
                        item_name = _IC.get(item_id, {}).get("name", item_id)
                        xp = result.get("xp", 0)
                        coins_str = f" · +{harvest_coins} p." if harvest_coins > 0 else ""
                        msg = f"+{qty} {item_name} · +{xp} XP{coins_str}"
                        self._js(f"showNotification(itemIcon({json.dumps(item_id)}, 14) + ' ' + {json.dumps(msg)}, 'reward')")
                    self._check_and_show_level_up()
                else:
                    self._js("showNotification('Silo plein ! Vendez ou améliorez.', 'error')")
                self._send_state()
                self.manager.save()

            elif action == "harvest_all":
                from .farm_manager import ITEM_CATALOG as _IC
                result = self.manager.harvest_all()
                if result["count"] > 0:
                    total_xp = result["xp"]
                    total_coins = result.get("coins", 0)
                    items_text = ", ".join(
                        f"{qty}x {_IC.get(iid, {}).get('name', iid)}"
                        for iid, qty in result["items"].items()
                    )
                    count = result["count"]
                    burst = min(10, count * 2)
                    self._js("SoundMgr.play('harvest')")
                    self._js(f"showHarvestAllBurst({burst}, {total_xp}, {total_coins})")
                    coins_text = f" +{total_coins} pièces," if total_coins > 0 else ""
                    msg = f"{count} récoltes :{coins_text} {items_text}"
                    self._js(f"showNotification({json.dumps(msg)}, 'reward')")
                    if count >= 3:
                        self._js("createConfetti()")
                    self._check_and_show_level_up()
                else:
                    self._js("showNotification('Aucune récolte prête !')")
                self._send_state()
                self.manager.save()

            elif action == "plant":
                plot_id = int(parts[2])
                crop_id = parts[3]
                from . import progression
                crop_def = progression.CROP_DEFINITIONS.get(crop_id, {})
                plant_cost = crop_def.get("plant_cost", 0)
                if self.manager.plant_crop(plot_id, crop_id):
                    crop_name = crop_def.get("name", crop_id)
                    total_reviews = crop_def.get("growth_reviews", 3) * 4
                    cost_str = f" (-{plant_cost} p.)" if plant_cost > 0 else ""
                    msg = f"{crop_name} planté(e) !{cost_str} ({total_reviews} rev.)"
                    self._js("SoundMgr.play('plant')")
                    self._js(f"showNotification({json.dumps(msg)})")
                else:
                    if self.manager.state.coins < plant_cost:
                        crop_name = crop_def.get("name", crop_id)
                        msg = f"Pas assez de pièces pour {crop_name} ({plant_cost} p. requis)"
                        self._js(f"showNotification({json.dumps(msg)})")
                    else:
                        self._js("showNotification('Impossible de planter ici !')")
                self._send_state()
                self.manager.save()

            elif action == "plant_all_empty":
                result = self.manager.plant_all_empty()
                planted = result["planted"]
                skipped = result["skipped"]
                if planted > 0:
                    msg = f"{planted} cultures plantées !"
                    if skipped > 0:
                        msg += f" ({skipped} non plantées — pièces insuffisantes)"
                    self._js(f"showNotification({json.dumps(msg)})")
                elif skipped > 0:
                    self._js("showNotification('Pas assez de pièces pour planter !')")
                else:
                    self._js("showNotification('Aucune parcelle à replanter !')")
                self._send_state()
                self.manager.save()

            elif action == "sell":
                item_id = parts[2]
                qty = int(parts[3]) if len(parts) > 3 else 1
                coins = self.manager.sell_item(item_id, qty)
                if coins > 0:
                    # JS side already handles sound + coin burst from button position
                    self._js(f"showFloatingReward('+{coins} pièces', window.innerWidth/2, window.innerHeight/3)")
                    self._js(f"showNotification({json.dumps(f'+{coins} pièces')}, 'reward')")
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
                    msg = "Déjà tourné aujourd'hui !"
                    self._js(f"showNotification({json.dumps(msg)})")
                self._send_state()
                self.manager.save()

            elif action == "open_box":
                box_index = int(parts[2])
                result = self.manager.open_mystery_box(box_index)
                if result:
                    self._js(f"showBoxResult({json.dumps(result)})")
                else:
                    msg = "Impossible d'ouvrir !"
                    self._js(f"showNotification({json.dumps(msg)})")
                self._send_state()
                self.manager.save()

            elif action == "fulfill_order":
                order_index = int(parts[2])
                result = self.manager.fulfill_order(order_index)
                if result:
                    r_coins = result["coins"]
                    r_xp = result["xp"]
                    r_gems = result.get("gems", 0)
                    self._js(f"showCoinBurst(window.innerWidth/2, window.innerHeight/3, 8)")
                    self._js(f"showFloatingReward('+{r_coins} pièces', window.innerWidth/2, window.innerHeight/3)")
                    gem_text = f" +{r_gems} gemmes" if r_gems > 0 else ""
                    self._js(f"showNotification({json.dumps(f'Commande livrée ! +{r_coins} pièces, +{r_xp} XP{gem_text}')}, 'reward')")
                    self._js("createConfetti()")
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

            elif action == "collect_direct":
                # Collect with JS-side visuals (burst from building position)
                building_id = parts[2]
                self._collect_building_quiet(building_id)
                self._check_and_show_level_up()
                self._send_state()
                # Auto-open production dialog after collecting (Hay Day flow)
                from aqt.qt import QTimer
                QTimer.singleShot(500, lambda bid=building_id: self._send_building_detail(bid))
                self.manager.save()

            elif action == "collect_all_buildings":
                from . import production
                total_collected = []
                total_xp = 0
                for building_id, queue in list(self.manager.state.production_queues.items()):
                    if any(item.get("ready") for item in queue):
                        prod_mgr = production.ProductionManager(self.manager.state)
                        collected = prod_mgr.collect_ready(building_id)
                        for item in collected:
                            if not item.get("storage_full"):
                                total_collected.append(item["name"])
                                total_xp += item.get("xp", 0)
                if total_collected:
                    names_str = ", ".join(total_collected)
                    self._js(f"showCoinBurst(window.innerWidth/2, window.innerHeight/3, {min(10, len(total_collected) * 3)})")
                    self._js(f"showFloatingReward('+{total_xp} XP', window.innerWidth/2, window.innerHeight/3)")
                    self._js(f"showNotification({json.dumps(f'{names_str} récupéré(s) !')}, 'reward')")
                    self.manager.advance_quest("produce", len(total_collected))
                    if len(total_collected) >= 3:
                        self._js("createConfetti()")
                self._check_and_show_level_up()
                self._send_state()
                self.manager.save()

            elif action == "collect_all_direct":
                # Collect all with JS-side visuals (bursts from building positions)
                from . import production
                total_collected = []
                total_xp = 0
                for building_id, queue in list(self.manager.state.production_queues.items()):
                    if any(item.get("ready") for item in queue):
                        prod_mgr = production.ProductionManager(self.manager.state)
                        collected = prod_mgr.collect_ready(building_id)
                        for item in collected:
                            if not item.get("storage_full"):
                                total_collected.append(item["name"])
                                total_xp += item.get("xp", 0)
                            else:
                                i_name = item["name"]
                                self._js(f"showNotification({json.dumps(f'Silo plein ! {i_name} en attente.')})")
                if total_collected:
                    names_str = ", ".join(total_collected)
                    self._js(f"showNotification({json.dumps(f'{names_str} récupéré(s) ! +{total_xp} XP')}, 'reward')")
                    self.manager.advance_quest("produce", len(total_collected))
                self._check_and_show_level_up()
                self._send_state()
                self.manager.save()

            elif action == "upgrade":
                target = parts[2]
                if target == "barn":
                    result = self.manager.upgrade_barn()
                    if result:
                        lvl = result["new_level"]
                        cap = result.get("new_capacity", 0)
                        self._js(f"showNotification({json.dumps(f'Grange améliorée ! Niveau {lvl} ({cap} places)')}, 'reward')")
                        self._js("SoundMgr.play('levelup')")
                        self._js("createConfetti()")
                    else:
                        self._js("showNotification('Matériaux insuffisants !')")
                        self._js("SoundMgr.play('error')")
                elif target == "silo":
                    result = self.manager.upgrade_silo()
                    if result:
                        lvl = result["new_level"]
                        cap = result.get("new_capacity", 0)
                        self._js(f"showNotification({json.dumps(f'Silo amélioré ! Niveau {lvl} ({cap} places)')}, 'reward')")
                        self._js("SoundMgr.play('levelup')")
                        self._js("createConfetti()")
                    else:
                        self._js("showNotification('Matériaux insuffisants !')")
                        self._js("SoundMgr.play('error')")
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
                    msg = f"Nouveau champ ajouté !" + (f" (-{cost} pièces)" if cost > 0 else "")
                    self._js(f"showNotification({json.dumps(msg)}, 'reward')")
                    self._js("SoundMgr.play('collect')")
                    self._js("createConfetti()")
                else:
                    used = self.manager.get_land_used()
                    total = self.manager.state.land_total
                    coins = self.manager.state.coins
                    if used >= total:
                        self._js(f"showNotification({json.dumps(f'Terrain plein ({used}/{total}) ! Achète du terrain.')})")
                    else:
                        self._js(f"showNotification({json.dumps(f'Pas assez de pièces ({coins}/{cost}) !')})")
                    self._js("SoundMgr.play('error')")
                self._send_state()
                self.manager.save()

            elif action == "add_pasture":
                animal_type = parts[2] if len(parts) > 2 else ""
                if self.manager.add_pasture(animal_type):
                    from . import progression
                    adef = progression.ANIMAL_DEFINITIONS.get(animal_type, {})
                    aname = adef.get("name", animal_type)
                    self._js(f"showNotification({json.dumps(f'{aname} acheté(e) !')}, 'reward')")
                    self._js("SoundMgr.play('levelup')")
                    self._js("createConfetti()")
                else:
                    reason = self.manager.get_pasture_fail_reason(animal_type)
                    self._js(f"showNotification({json.dumps(reason)})")
                    self._js("SoundMgr.play('error')")
                self._send_state()
                self.manager.save()

            elif action == "build":
                building_id = parts[2] if len(parts) > 2 else ""
                if self.manager.build_building(building_id):
                    from . import progression
                    bdef = progression.BUILDING_DEFINITIONS.get(building_id, {})
                    bname = bdef.get("name", building_id)
                    self._js(f"showNotification({json.dumps(f'{bname} construit !')}, 'reward')")
                    self._js("SoundMgr.play('levelup')")
                    self._js("createConfetti()")
                else:
                    reason = self.manager.get_build_fail_reason(building_id)
                    self._js(f"showNotification({json.dumps(reason)})")
                    self._js("SoundMgr.play('error')")
                self._send_state()
                self.manager.save()

            elif action == "buy_land":
                if self.manager.buy_land():
                    total = self.manager.state.land_total
                    self._js(f"showNotification({json.dumps(f'Terrain agrandi ! Total: {total}')}, 'reward')")
                    self._js("SoundMgr.play('collect')")
                    self._js("createConfetti()")
                else:
                    cost = 100 * (self.manager.state.land_total // 5)
                    deeds = self.manager.state.inventory.get("land_deed", 0)
                    self._js(f"showNotification({json.dumps(f'Besoin de {cost} pièces + Titre foncier ({deeds}/1)')})")
                    self._js("SoundMgr.play('error')")
                self._send_state()
                self.manager.save()

            elif action == "get_achievements":
                self._send_achievements()

            elif action == "claim_quests":
                reward = self.manager.claim_quest_reward()
                if reward:
                    self._js("SoundMgr.play('levelup')")
                    self._js("createConfetti()")
                    coins = reward["coins"]
                    gems = reward["gems"]
                    xp = reward["xp"]
                    self._js(f"showCoinBurst(window.innerWidth/2, window.innerHeight/3, 8)")
                    self._js(f"showNotification({json.dumps(f'Quêtes terminées ! +{coins} pièces, +{gems} gemmes, +{xp} XP')}, 'reward')")
                    self._check_and_show_level_up()
                self._send_state()
                self.manager.save()

            elif action == "gem_speed_production":
                building_id = parts[2] if len(parts) > 2 else ""
                result = self.manager.gem_speed_production(building_id)
                if result:
                    cost = result["gem_cost"]
                    name = result["name"]
                    self._js(f"showNotification({json.dumps(f'{name} terminé ! (-{cost} gemmes)')}, 'reward')")
                    self._js("SoundMgr.play('collect')")
                else:
                    self._js("showNotification('Pas assez de gemmes !', 'error')")
                    self._js("SoundMgr.play('error')")
                self._send_state()
                self.manager.save()

            elif action == "gem_instant_grow":
                plot_id = int(parts[2]) if len(parts) > 2 else -1
                result = self.manager.gem_instant_grow(plot_id)
                if result:
                    cost = result["gem_cost"]
                    crop_name = result["crop_name"]
                    self._js(f"showNotification({json.dumps(f'{crop_name} prêt ! (-{cost} gemmes)')}, 'reward')")
                    self._js("SoundMgr.play('harvest')")
                else:
                    self._js("showNotification('Pas assez de gemmes !', 'error')")
                    self._js("SoundMgr.play('error')")
                self._send_state()
                self.manager.save()

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
                "recipe_id": item.get("recipe_id", ""),
                "ready": item.get("ready", False),
                "reviews_done": item.get("reviews_done",
                                         item.get("sessions_waited", 0) * 10),
                "reviews_required": item.get("reviews_required",
                                             item.get("sessions_required", 1) * 10),
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
            msg = f"Production de {r_name} lancée !"
            self._js(f"showNotification({json.dumps(msg)})")
            self._js("SoundMgr.play('plant')")
        else:
            can, reason = prod_mgr.can_craft(building_id, recipe_id)
            self._js(f"showNotification({json.dumps(reason)})")
            self._js("SoundMgr.play('error')")

    def _collect_building(self, building_id: str):
        from . import production
        prod_mgr = production.ProductionManager(self.manager.state)
        collected = prod_mgr.collect_ready(building_id)
        total_xp = 0
        collected_names = []
        for item in collected:
            i_name = item["name"]
            if item.get("storage_full"):
                self._js(f"showNotification({json.dumps(f'Silo plein ! {i_name} reste en attente.')})")
            else:
                i_xp = item.get("xp", 0)
                total_xp += i_xp
                collected_names.append(i_name)
        if collected_names:
            names_str = ", ".join(collected_names)
            self._js("SoundMgr.play('collect')")
            self._js(f"showCoinBurst(window.innerWidth/2, window.innerHeight/3, {min(8, len(collected_names) * 3)})")
            self._js(f"showFloatingReward('+{total_xp} XP', window.innerWidth/2, window.innerHeight/3)")
            self._js(f"showNotification({json.dumps(f'{names_str} récupéré(s) !')}, 'reward')")
            self.manager.advance_quest("produce", len(collected_names))

    def _collect_building_quiet(self, building_id: str):
        """Collect ready products — JS handles visual effects (burst from building pos)."""
        from . import production
        prod_mgr = production.ProductionManager(self.manager.state)
        collected = prod_mgr.collect_ready(building_id)
        total_xp = 0
        collected_names = []
        for item in collected:
            i_name = item["name"]
            if item.get("storage_full"):
                self._js(f"showNotification({json.dumps(f'Silo plein ! {i_name} reste en attente.')})")
            else:
                i_xp = item.get("xp", 0)
                total_xp += i_xp
                collected_names.append(i_name)
        if collected_names:
            names_str = ", ".join(collected_names)
            self._js(f"showNotification({json.dumps(f'{names_str} récupéré(s) ! +{total_xp} XP')}, 'reward')")
            self.manager.advance_quest("produce", len(collected_names))

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
            # Show additional notifications (storage full, crop ready, etc.)
            for notif in rewards.get("notifications", []):
                ntype = notif.get("type", "")
                msg = notif.get("message", "")
                if ntype == "storage_full":
                    self._js(f"showNotification({json.dumps(msg)})")
                elif ntype == "crop_ready":
                    self._js(f"showNotification({json.dumps(msg)}, 'reward')")
                elif ntype == "wilt_warning":
                    self._js(f"showNotification({json.dumps(msg)}, 'reward')")
                    self._js("SoundMgr.play('error')")
                elif ntype == "production_ready":
                    recipe_id = notif.get("recipe_id", "")
                    self._js(f"showNotification(itemIcon({json.dumps(recipe_id)}, 14) + ' ' + {json.dumps(msg)}, 'reward')")
                    self._js("SoundMgr.play('collect')")
            self._send_state()

    def on_level_up(self, data: dict):
        """Show level up celebration."""
        if self.web:
            self._js(f"showLevelUp({json.dumps(data)})")

    def on_session_end(self, summary: dict):
        """Show session summary."""
        if self.web:
            self._js(f"showSessionSummary({json.dumps(summary)})")
