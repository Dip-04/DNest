"""Generate DNest favicon and PWA raster assets from the approved vector geometry."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
ICONS.mkdir(parents=True, exist_ok=True)


def render(size: int, maskable: bool = False) -> Image.Image:
    scale = 4
    canvas = size * scale
    image = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    def box(values: tuple[float, float, float, float]) -> tuple[int, int, int, int]:
        return tuple(round(value / 512 * canvas) for value in values)  # type: ignore[return-value]

    if maskable:
        draw.rectangle((0, 0, canvas - 1, canvas - 1), fill="#7d3f4b")
    else:
        radius = round(116 / 512 * canvas)
        draw.rounded_rectangle((0, 0, canvas - 1, canvas - 1), radius=radius, fill="#7d3f4b")
    draw.ellipse(box((304, 8, 500, 204)), fill=(169, 95, 105, 107))

    # The D is built from a vertical stem and concentric ellipses for a strong tiny silhouette.
    draw.rectangle(box((148, 108, 248, 404)), fill="#fff8f2")
    draw.ellipse(box((142, 108, 400, 404)), fill="#fff8f2")
    draw.rectangle(box((148, 108, 270, 404)), fill="#fff8f2")
    draw.ellipse(box((226, 178, 322, 334)), fill="#7d3f4b")
    draw.rectangle(box((226, 178, 274, 334)), fill="#7d3f4b")

    rose = "#e5b9bf"
    width = max(1, round(16 / 512 * canvas))
    draw.arc(box((128, 278, 384, 389)), 18, 162, fill=rose, width=width)
    draw.arc(box((146, 315, 366, 406)), 18, 162, fill=rose, width=width)
    draw.arc(box((174, 348, 338, 418)), 18, 162, fill=rose, width=width)
    return image.resize((size, size), Image.Resampling.LANCZOS)


assets = {
    ICONS / "icon-16x16.png": (16, False),
    ICONS / "icon-32x32.png": (32, False),
    ICONS / "icon-48x48.png": (48, False),
    PUBLIC / "apple-touch-icon.png": (180, True),
    ICONS / "android-chrome-192x192.png": (192, False),
    ICONS / "android-chrome-512x512.png": (512, False),
    ICONS / "maskable-icon-192x192.png": (192, True),
    ICONS / "maskable-icon-512x512.png": (512, True),
}

for path, (size, maskable) in assets.items():
    render(size, maskable).save(path, "PNG", optimize=True)

render(512).save(PUBLIC / "favicon.ico", format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])

for path in [*assets, PUBLIC / "favicon.ico"]:
    with Image.open(path) as image:
        print(f"{path.relative_to(ROOT)}: {image.size[0]}x{image.size[1]} {image.format}")
