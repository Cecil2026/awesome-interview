#!/usr/bin/env python3
"""Generate the app-icon / splash source images for the Android build.

Produces an "Ai" lettermark on a blue->purple vertical gradient into ``assets/``:

    assets/icon.png             1024x1024  legacy/master icon (gradient + "Ai")
    assets/icon-foreground.png  1024x1024  adaptive foreground ("Ai", transparent,
                                           kept inside the center safe zone)
    assets/icon-background.png  1024x1024  adaptive background (gradient only)
    assets/splash.png           2732x2732  launch screen (gradient + "Ai")
    assets/splash-dark.png      2732x2732  dark launch screen

Then feed these to the official tool:

    npx @capacitor/assets generate --android

Regenerate the sources anytime by editing this file (colors/letters) and re-running:

    python tools/make_icon.py

Requires Pillow (already available in this environment).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = Path(__file__).resolve().parent.parent
ASSETS = REPO_ROOT / "assets"

TEXT = "Ai"
# Blue -> purple, top to bottom.
TOP = (37, 99, 235)      # #2563eb
BOTTOM = (124, 58, 237)  # #7c3aed
TOP_DARK = (30, 64, 175)      # #1e40af
BOTTOM_DARK = (76, 29, 149)   # #4c1d95
WHITE = (255, 255, 255)

FONT_CANDIDATES = [
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/Arial.ttf",
]


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for path in FONT_CANDIDATES:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def _gradient(size: int, top: tuple, bottom: tuple) -> Image.Image:
    """Fast vertical gradient: build a 1px-wide column, then stretch."""
    col = Image.new("RGB", (1, size))
    for y in range(size):
        t = y / (size - 1)
        col.putpixel((0, y), tuple(round(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return col.resize((size, size))


def _draw_centered_text(img: Image.Image, text: str, font_size: int, fill=WHITE) -> None:
    draw = ImageDraw.Draw(img)
    font = _load_font(font_size)
    l, t, r, b = draw.textbbox((0, 0), text, font=font)
    x = (img.width - (r - l)) / 2 - l
    y = (img.height - (b - t)) / 2 - t
    draw.text((x, y), text, font=font, fill=fill)


def main() -> None:
    ASSETS.mkdir(exist_ok=True)

    # Master / legacy icon: gradient + big lettermark.
    icon = _gradient(1024, TOP, BOTTOM)
    _draw_centered_text(icon, TEXT, 560)
    icon.save(ASSETS / "icon.png")

    # Adaptive background: gradient only.
    _gradient(1024, TOP, BOTTOM).save(ASSETS / "icon-background.png")

    # Adaptive foreground: transparent, letters kept smaller so launcher masking
    # (which crops ~1/3 off each edge) never clips them.
    fg = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    _draw_centered_text(fg, TEXT, 420)
    fg.save(ASSETS / "icon-foreground.png")

    # Splash screens: gradient + modest centered lettermark.
    light = _gradient(2732, TOP, BOTTOM)
    _draw_centered_text(light, TEXT, 700)
    light.save(ASSETS / "splash.png")

    dark = _gradient(2732, TOP_DARK, BOTTOM_DARK)
    _draw_centered_text(dark, TEXT, 700)
    dark.save(ASSETS / "splash-dark.png")

    for name in ("icon.png", "icon-foreground.png", "icon-background.png",
                 "splash.png", "splash-dark.png"):
        print(f"  wrote assets/{name}")
    print("\nDone. Next: npx @capacitor/assets generate --android")


if __name__ == "__main__":
    main()
