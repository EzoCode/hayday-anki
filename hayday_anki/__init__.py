"""
ADFarm — Hay Day-style farming game for Anki.
Every card review earns coins, XP, crops, and random drops.
"""

from aqt import mw, gui_hooks
from aqt.qt import QAction, QKeySequence

# Persistent references (prevent GC)
_farm_manager = None
_farm_view = None
_session_active = False
_achievement_manager = None


def _get_manager():
    global _farm_manager
    if _farm_manager is None:
        from .farm_manager import FarmManager
        _farm_manager = FarmManager()
    return _farm_manager


def _get_view():
    global _farm_view
    if _farm_view is None:
        from .ui_farm import FarmWebView
        _farm_view = FarmWebView(_get_manager())
    return _farm_view


# =============================================================================
# HOOKS
# =============================================================================

def on_profile_loaded():
    global _farm_manager, _farm_view, _session_active, _achievement_manager
    _farm_manager = None
    _farm_view = None
    _session_active = False
    _achievement_manager = None

    try:
        mgr = _get_manager()
        mgr.generate_orders()
        login_bonus = mgr.check_daily_login()
        mgr.save()
    except Exception as e:
        print(f"[ADFarm] Error during profile load: {e}")
        import traceback
        traceback.print_exc()
        return

    config = mw.addonManager.getConfig(__name__) or {}
    if config.get("show_farm_on_startup", True):
        from aqt.qt import QTimer

        def _show_farm_with_bonus():
            show_farm()
            if login_bonus:
                view = _get_view()
                if view.web:
                    import json
                    view._js(f"showDailyLoginBonus({json.dumps(login_bonus)})")

        QTimer.singleShot(1500, _show_farm_with_bonus)


def on_reviewer_did_answer(reviewer, card, ease):
    global _session_active

    try:
        mgr = _get_manager()

        if not _session_active:
            mgr.start_session()
            _session_active = True

        card_ivl = card.ivl if hasattr(card, "ivl") else 0
        card_factor = card.factor if hasattr(card, "factor") else 2500

        rewards = mgr.process_review(ease, card_ivl, card_factor)

        # Level up?
        level_up_notif = None
        for notif in rewards.get("notifications", []):
            if notif.get("type") == "level_up":
                level_up_notif = notif
                break

        _process_animals(mgr)
        _check_achievements(mgr)

        # Update farm view if open
        view = _get_view()
        if view.web:
            view.on_review(rewards)
            if level_up_notif:
                view.on_level_up(level_up_notif)
        else:
            # Toast notification
            from .ui_dialogs import NotificationToast
            coins = rewards.get("coins", 0)
            xp = rewards.get("xp", 0)
            if coins > 0 or xp > 0:
                NotificationToast.show(f"+{coins} pièces  +{xp} XP")
            if level_up_notif:
                from .ui_dialogs import LevelUpDialog
                dlg = LevelUpDialog(level_up_notif, mw)
                dlg.exec()

        if mgr.state.session_reviews % 10 == 0:
            mgr.save()
    except Exception as e:
        print(f"[ADFarm] Error processing review: {e}")
        import traceback
        traceback.print_exc()


def on_reviewer_will_end():
    global _session_active
    if not _session_active:
        return
    _session_active = False

    try:
        mgr = _get_manager()

        # Production queues are advanced inside end_session() via _process_production()
        summary = mgr.end_session()

        if summary.get("reviews", 0) > 0:
            view = _get_view()
            if view.web:
                view.on_session_end(summary)
            else:
                config = mw.addonManager.getConfig(__name__) or {}
                if config.get("show_session_summary", True):
                    from .ui_dialogs import SessionSummaryDialog
                    dlg = SessionSummaryDialog(summary, mw)
                    dlg.exec()
    except Exception as e:
        print(f"[ADFarm] Error ending session: {e}")
        import traceback
        traceback.print_exc()


def on_main_window_close():
    global _farm_manager, _farm_view, _session_active
    try:
        if _session_active:
            on_reviewer_will_end()
        if _farm_manager:
            _farm_manager.save()
        if _farm_view:
            _farm_view.close()
    except Exception as e:
        print(f"[ADFarm] Error during shutdown: {e}")
    finally:
        _farm_manager = None
        _farm_view = None


# =============================================================================
# HELPERS
# =============================================================================

def _process_animals(mgr):
    """Process animal production using pastures list as source of truth."""
    from . import progression
    from .farm_manager import ITEM_CATALOG
    collected_products = []
    for pasture in mgr.state.pastures:
        animal_id = pasture.get("animal_type")
        animal_def = progression.ANIMAL_DEFINITIONS.get(animal_id)
        if not animal_def:
            continue
        count = pasture.get("count", 0)
        if count <= 0:
            continue
        reviews_since = pasture.get("reviews_since_last", 0) + 1
        pasture["reviews_since_last"] = reviews_since
        produce_every = animal_def.get("produce_every_n_reviews", 10)
        if reviews_since >= produce_every:
            product = animal_def.get("product")
            if product and mgr.state.add_item(product, count):
                pasture["reviews_since_last"] = 0
                item_info = ITEM_CATALOG.get(product, {})
                collected_products.append({
                    "product": product,
                    "name": item_info.get("name", product),
                    "emoji": item_info.get("emoji", ""),
                    "qty": count,
                })
    # Sync animals dict from pastures (keep dict in sync for backward compat)
    mgr.state.animals = {}
    for pasture in mgr.state.pastures:
        aid = pasture.get("animal_type")
        if aid:
            mgr.state.animals[aid] = {
                "count": pasture.get("count", 0),
                "reviews_since_last": pasture.get("reviews_since_last", 0),
            }
    # Show notifications for collected animal products
    if collected_products:
        view = _get_view()
        if view.web:
            import json
            for p in collected_products:
                msg = f"{p['emoji']} +{p['qty']} {p['name']}"
                view._js(f"showNotification({json.dumps(msg)}, 'reward')")


def _check_achievements(mgr):
    global _achievement_manager
    from . import achievements as ach_mod
    from datetime import datetime
    import json
    if _achievement_manager is None:
        _achievement_manager = ach_mod.AchievementManager()
    ach_mgr = _achievement_manager
    state_dict = mgr.state.to_dict()
    state_dict["num_plots"] = mgr.state.num_plots
    session_data = {
        "cards_reviewed": mgr.state.session_reviews,
        "correct_count": mgr.state.total_correct,
        "total_elapsed": 0,
    }
    newly_unlocked = ach_mgr.check_all(state_dict, session_data)
    for ach in newly_unlocked:
        mgr.state.achievements[ach["key"]] = {
            "unlocked_at": datetime.now().isoformat(),
        }
        gem_reward = ach.get("gems", 0)
        if gem_reward > 0:
            mgr.state.gems += gem_reward

        # Show achievement notification in UI
        view = _get_view()
        if view.web:
            ach_name = ach.get("name", "")
            ach_tier = ach.get("tier", "")
            tier_emoji = {"bronze": "\U0001F949", "silver": "\U0001F948", "gold": "\U0001F947"}.get(ach_tier, "\U0001F3C6")
            gem_text = f" +{gem_reward}\U0001F48E" if gem_reward > 0 else ""
            msg = f"{tier_emoji} {ach_name} ({ach_tier}){gem_text}"
            view._js(f"showNotification({json.dumps(msg)}, 'reward')")
            if ach_tier == "gold":
                view._js("createConfetti()")


# =============================================================================
# MENU
# =============================================================================

def show_farm():
    view = _get_view()
    view.show()


def _setup():
    action = QAction("ADFarm", mw)
    action.setShortcut(QKeySequence("Ctrl+Shift+F"))
    action.triggered.connect(show_farm)
    mw.form.menuTools.addAction(action)


# Register
gui_hooks.profile_did_open.append(on_profile_loaded)
gui_hooks.reviewer_did_answer_card.append(on_reviewer_did_answer)
gui_hooks.reviewer_will_end.append(on_reviewer_will_end)
gui_hooks.profile_will_close.append(on_main_window_close)

_setup()
