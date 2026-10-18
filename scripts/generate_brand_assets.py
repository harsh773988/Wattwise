from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parent.parent
public_dir = root / "public"
logo = Image.open(public_dir / "logo.png").convert("RGBA")

sizes = [16, 32, 180, 192, 512]
for size in sizes:
    resized = logo.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(public_dir / f"favicon-{size}x{size}.png")

logo.resize((180, 180), Image.Resampling.LANCZOS).save(public_dir / "apple-touch-icon.png")
logo.resize((192, 192), Image.Resampling.LANCZOS).save(public_dir / "android-chrome-192x192.png")
logo.resize((512, 512), Image.Resampling.LANCZOS).save(public_dir / "android-chrome-512x512.png")

logo.copy().resize((64, 64), Image.Resampling.LANCZOS).save(public_dir / "favicon.ico", format="ICO")

manifest = {
    "name": "WattWise",
    "short_name": "WattWise",
    "description": "Upload electricity meter readings and get usage charts, spike alerts, cost in rupees, CO₂ footprint, savings tips and a what-if slider.",
    "theme_color": "#ffe17c",
    "background_color": "#fbfbf8",
    "display": "standalone",
    "icons": [
        {"src": "/android-chrome-192x192.png", "sizes": "192x192", "type": "image/png"},
        {"src": "/android-chrome-512x512.png", "sizes": "512x512", "type": "image/png"},
    ],
}
(public_dir / "site.webmanifest").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print("Brand assets generated.")
