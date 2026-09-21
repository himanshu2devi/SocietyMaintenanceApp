from PIL import Image
from pathlib import Path

src = Path(r"C:\Z_Business\society-app\SocietyMaintenanceApp\frontend\public\images\societysimplify-logo.png")
out_dir = Path(r"C:\Z_Business\society-app\SocietyMaintenanceApp\frontend\public")
im = Image.open(src).convert("RGBA")
w, h = im.size

# Keep only the emblem (left mark), exclude wordmark letters.
icon_right = int(w * 0.255)
left = int(w * 0.015)
region = im.crop((left, 0, icon_right, h))
rw, rh = region.size

# Place emblem centered on a square black plate.
side = max(rw, rh)
square = Image.new("RGBA", (side, side), (0, 0, 0, 255))
ox = (side - rw) // 2
oy = (side - rh) // 2
square.paste(region, (ox, oy), region)

pad_ratio = 0.1
for size, name in [
    (32, "favicon-32.png"),
    (48, "favicon-48.png"),
    (180, "apple-touch-icon.png"),
    (192, "icon-192.png"),
    (512, "icon-512.png"),
]:
    pad = max(1, int(size * pad_ratio))
    inner = size - pad * 2
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    resized = square.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas.paste(resized, (pad, pad), resized)
    canvas.save(out_dir / name, optimize=True)
    print("wrote", name)

frames = []
for size in (16, 32, 48):
    pad = max(1, int(size * pad_ratio))
    inner = size - pad * 2
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 255))
    resized = square.resize((inner, inner), Image.Resampling.LANCZOS)
    canvas.paste(resized, (pad, pad), resized)
    frames.append(canvas)

frames[0].save(
    out_dir / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=frames[1:],
)
print("wrote favicon.ico")
