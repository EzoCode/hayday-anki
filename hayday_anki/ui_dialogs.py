"""
UI Dialogs — Qt dialogs for session summary, wheel, shop, etc.

These are fallback/standalone dialogs used when the farm webview
is not open. The primary UI is the web-based farm view.
"""

import json
from typing import Dict, List, Optional

from aqt import mw
from aqt.qt import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QGridLayout, QFrame, QScrollArea, QWidget, Qt, QFont,
    QSizePolicy, QTimer
)


class SessionSummaryDialog(QDialog):
    """Dialog shown at the end of a review session."""

    def __init__(self, summary: Dict, parent=None):
        super().__init__(parent or mw)
        self.setWindowTitle("Session Complete!")
        self.setMinimumWidth(340)
        self.setModal(True)
        self._build_ui(summary)

    def _build_ui(self, s: Dict):
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        # Title
        title = QLabel("Session terminée !")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        font = QFont()
        font.setPointSize(18)
        font.setBold(True)
        title.setFont(font)
        layout.addWidget(title)

        # Stats grid
        stats = QGridLayout()
        stats.setSpacing(8)

        self._add_stat(stats, 0, 0, str(s.get("reviews", 0)), "Cards Reviewed")
        self._add_stat(stats, 0, 1, f"+{s.get('coins_earned', 0)}", "Coins Earned", "#f4a42a")
        self._add_stat(stats, 1, 0, f"+{s.get('xp_earned', 0)}", "XP Earned", "#66bb6a")
        self._add_stat(stats, 1, 1, str(s.get('streak', 0)), "Série", "#ff6600")

        layout.addLayout(stats)

        # Items earned
        items = s.get("items_earned", {})
        if items:
            items_label = QLabel("Items Earned:")
            items_label.setStyleSheet("font-weight: bold; margin-top: 8px;")
            layout.addWidget(items_label)

            items_text = ", ".join(
                f"{qty}x {item_id.replace('_', ' ').title()}"
                for item_id, qty in items.items()
            )
            items_val = QLabel(items_text)
            items_val.setWordWrap(True)
            items_val.setStyleSheet("color: #666; padding: 4px;")
            layout.addWidget(items_val)

        # Level info
        level_label = QLabel(f"Niveau {s.get('level', 1)} | {s.get('total_coins', 0)} pièces | {s.get('total_gems', 0)} gemmes")
        level_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        level_label.setStyleSheet("color: #888; font-size: 12px; margin-top: 8px;")
        layout.addWidget(level_label)

        # Continue button
        btn = QPushButton("Continuer !")
        btn.setStyleSheet("""
            QPushButton {
                background: #f4a42a; color: white; border: none;
                padding: 10px 24px; border-radius: 18px;
                font-size: 14px; font-weight: bold;
            }
            QPushButton:hover { background: #e8931a; }
        """)
        btn.clicked.connect(self.accept)
        layout.addWidget(btn, alignment=Qt.AlignmentFlag.AlignCenter)

    def _add_stat(self, grid, row, col, value, label, color="#333"):
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #f8f4ec;
                border: 1px solid #e0d5c0;
                border-radius: 10px;
                padding: 8px;
            }
        """)
        fl = QVBoxLayout(frame)
        fl.setSpacing(2)

        val = QLabel(value)
        val.setAlignment(Qt.AlignmentFlag.AlignCenter)
        val.setStyleSheet(f"font-size: 20px; font-weight: bold; color: {color};")
        fl.addWidget(val)

        lbl = QLabel(label)
        lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl.setStyleSheet("font-size: 10px; color: #888; font-weight: 600;")
        fl.addWidget(lbl)

        grid.addWidget(frame, row, col)


class LevelUpDialog(QDialog):
    """Dialog celebrating a level up."""

    def __init__(self, data: Dict, parent=None):
        super().__init__(parent or mw)
        self.setWindowTitle("Level Up!")
        self.setMinimumWidth(300)
        self.setModal(True)
        self._build_ui(data)

    def _build_ui(self, data: Dict):
        layout = QVBoxLayout(self)
        layout.setSpacing(10)

        self.setStyleSheet("""
            QDialog {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:1,
                    stop:0 #4a148c, stop:1 #7b1fa2);
            }
            QLabel { color: white; }
        """)

        # Stars
        stars = QLabel("\u2B50\u2728\u2B50\u2728\u2B50")
        stars.setAlignment(Qt.AlignmentFlag.AlignCenter)
        stars.setStyleSheet("font-size: 24px;")
        layout.addWidget(stars)

        # Title
        title = QLabel("Level Up!")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet("font-size: 24px; font-weight: bold;")
        layout.addWidget(title)

        # Level number
        level = QLabel(str(data.get("new_level", 1)))
        level.setAlignment(Qt.AlignmentFlag.AlignCenter)
        level.setStyleSheet("font-size: 48px; font-weight: 900; color: #ffd700;")
        layout.addWidget(level)

        # Gem reward
        gems = data.get("gem_reward", 0)
        if gems > 0:
            gem_label = QLabel(f"+{gems} gemmes")
            gem_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            gem_label.setStyleSheet("font-size: 16px; color: #4fc3f7;")
            layout.addWidget(gem_label)

        # Unlocks
        unlocks = data.get("unlocks", [])
        if unlocks:
            unlock_label = QLabel("Unlocked:")
            unlock_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
            unlock_label.setStyleSheet("font-size: 12px; margin-top: 8px;")
            layout.addWidget(unlock_label)

            for u in unlocks:
                name = u.get("name", "")
                ul = QLabel(name)
                ul.setAlignment(Qt.AlignmentFlag.AlignCenter)
                ul.setStyleSheet("font-size: 14px; font-weight: 600;")
                layout.addWidget(ul)

        # Continue button
        btn = QPushButton("Continue")
        btn.setStyleSheet("""
            QPushButton {
                background: #f4a42a; color: white; border: none;
                padding: 10px 24px; border-radius: 18px;
                font-size: 14px; font-weight: bold; margin-top: 12px;
            }
            QPushButton:hover { background: #e8931a; }
        """)
        btn.clicked.connect(self.accept)
        layout.addWidget(btn, alignment=Qt.AlignmentFlag.AlignCenter)


class NotificationToast:
    """Temporary notification shown in the main window."""

    @staticmethod
    def show(message: str, duration_ms: int = 3000):
        """Show a brief notification toast."""
        if not mw:
            return

        toast = QLabel(message, mw)
        toast.setStyleSheet("""
            QLabel {
                background: rgba(50, 35, 20, 0.9);
                color: #faf3e0;
                padding: 8px 18px;
                border-radius: 16px;
                font-size: 13px;
                font-weight: 600;
            }
        """)
        toast.setAlignment(Qt.AlignmentFlag.AlignCenter)
        toast.adjustSize()

        # Position at top center
        x = (mw.width() - toast.width()) // 2
        toast.move(x, 60)
        toast.show()
        toast.raise_()

        QTimer.singleShot(duration_ms, toast.deleteLater)
