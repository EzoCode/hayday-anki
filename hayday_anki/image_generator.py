"""
Image Generator — Generate farm sprites using Google Gemini API (Nano Banana 2).

Generates pixel art sprites for crops, buildings, animals, and decorations.
Caches generated sprites to avoid redundant API calls.
Falls back to emoji rendering if API is unavailable.
"""

import os
import base64
import json
import hashlib
from pathlib import Path
from typing import Optional, Dict

ADDON_DIR = Path(__file__).parent
CACHE_DIR = ADDON_DIR / "user_files" / "generated_sprites"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

API_KEY = "AIzaSyCClutDOmBvpvBqv8Yfrm4yEgRDAYFiU-k"
MODEL_NAME = "gemini-2.0-flash-exp"  # Fallback model with image generation


def _get_cache_path(prompt: str, size: str = "64x64") -> Path:
    """Get cache file path for a given prompt."""
    key = hashlib.md5(f"{prompt}_{size}".encode()).hexdigest()
    return CACHE_DIR / f"{key}.png"


def _is_cached(prompt: str, size: str = "64x64") -> bool:
    """Check if a sprite is already cached."""
    return _get_cache_path(prompt, size).exists()


def generate_sprite(
    item_name: str,
    item_type: str = "crop",
    stage: Optional[str] = None,
    size: str = "64x64",
    style: str = "pixel art"
) -> Optional[str]:
    """
    Generate a sprite image for a farm item.

    Args:
        item_name: Name of the item (e.g., "wheat", "bakery", "cow")
        item_type: Type of item ("crop", "building", "animal", "decoration")
        stage: Growth stage for crops ("seed", "sprout", "growing", "flowering", "ready")
        size: Image dimensions (e.g., "64x64", "128x128")
        style: Art style ("pixel art", "cartoon", "watercolor")

    Returns:
        Path to the generated PNG file, or None on failure.
    """
    # Build prompt
    prompt = _build_prompt(item_name, item_type, stage, size, style)

    # Check cache
    cache_path = _get_cache_path(prompt, size)
    if cache_path.exists():
        return str(cache_path)

    # Try to generate via API
    try:
        image_bytes = _call_gemini_api(prompt)
        if image_bytes:
            cache_path.write_bytes(image_bytes)
            return str(cache_path)
    except Exception as e:
        print(f"[HayDay] Image generation failed: {e}")

    return None


def _build_prompt(
    item_name: str,
    item_type: str,
    stage: Optional[str],
    size: str,
    style: str
) -> str:
    """Build the image generation prompt."""
    base = f"A cute {style} sprite of a {item_name}"

    if item_type == "crop":
        if stage == "seed":
            base = f"A cute {style} sprite of a small brown seed in soil, {item_name} seed"
        elif stage == "sprout":
            base = f"A cute {style} sprite of a tiny green sprout growing from soil, baby {item_name}"
        elif stage == "growing":
            base = f"A cute {style} sprite of a {item_name} plant growing in a farm field, half grown"
        elif stage == "flowering":
            base = f"A cute {style} sprite of a {item_name} plant with flowers, almost ready to harvest"
        elif stage == "ready":
            base = f"A cute {style} sprite of a ripe {item_name} ready to harvest, golden glow"
        elif stage == "wilted":
            base = f"A cute {style} sprite of a wilted {item_name} plant, brown and droopy"
        else:
            base = f"A cute {style} sprite of a {item_name} crop"

    elif item_type == "building":
        base = f"A cute {style} sprite of a farm {item_name} building, cozy and charming"

    elif item_type == "animal":
        base = f"A cute {style} sprite of a happy farm {item_name}, adorable and friendly"

    elif item_type == "decoration":
        base = f"A cute {style} sprite of a farm {item_name} decoration"

    return f"{base}, {size} pixels, farm game style, transparent background, top-down isometric view, bright colors, no text"


def _call_gemini_api(prompt: str) -> Optional[bytes]:
    """Call the Google Gemini API to generate an image."""
    try:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=API_KEY)

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            )
        )

        # Extract image from response
        if response and response.candidates:
            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data:
                    return base64.b64decode(part.inline_data.data)

    except ImportError:
        print("[HayDay] google-genai package not installed. Run: pip install google-genai")
    except Exception as e:
        print(f"[HayDay] Gemini API error: {e}")

    return None


def generate_all_crop_sprites(crop_name: str) -> Dict[str, Optional[str]]:
    """Generate all growth stage sprites for a crop."""
    stages = ["seed", "sprout", "growing", "flowering", "ready", "wilted"]
    result = {}
    for stage in stages:
        path = generate_sprite(crop_name, "crop", stage)
        result[stage] = path
    return result


def generate_building_sprite(building_name: str) -> Optional[str]:
    """Generate a sprite for a building."""
    return generate_sprite(building_name, "building")


def generate_animal_sprite(animal_name: str) -> Optional[str]:
    """Generate a sprite for an animal."""
    return generate_sprite(animal_name, "animal")


def get_sprite_or_emoji(
    item_name: str,
    item_type: str = "crop",
    stage: Optional[str] = None,
    emoji_fallback: str = ""
) -> Dict:
    """
    Try to get a cached sprite, return emoji fallback info if not available.

    Returns: {"type": "image"|"emoji", "value": path_or_emoji_str}
    """
    prompt = _build_prompt(item_name, item_type, stage, "64x64", "pixel art")
    cache_path = _get_cache_path(prompt, "64x64")

    if cache_path.exists():
        return {"type": "image", "value": str(cache_path)}

    return {"type": "emoji", "value": emoji_fallback}


def clear_cache():
    """Clear all cached sprites."""
    import shutil
    if CACHE_DIR.exists():
        shutil.rmtree(CACHE_DIR)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)


def get_cache_size() -> int:
    """Get total size of cached sprites in bytes."""
    total = 0
    for f in CACHE_DIR.glob("*.png"):
        total += f.stat().st_size
    return total
