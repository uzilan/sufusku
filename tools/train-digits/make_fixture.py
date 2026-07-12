"""Render a photo-like synthetic sudoku for the golden pipeline test."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# A valid puzzle, 0 = empty, row-major
PUZZLE = (
    "530070000"
    "600195000"
    "098000060"
    "800060003"
    "400803001"
    "700020006"
    "060000280"
    "000419005"
    "000080079"
)

CANVAS = 900
MARGIN = 90
GRID = CANVAS - 2 * MARGIN
CELL = GRID // 9
FONT_PATH = "/System/Library/Fonts/Helvetica.ttc"


def main():
    img = Image.new("L", (CANVAS, CANVAS), 250)
    draw = ImageDraw.Draw(img)
    for i in range(10):
        w = 5 if i % 3 == 0 else 2
        pos = MARGIN + i * CELL
        draw.line([(MARGIN, pos), (MARGIN + GRID, pos)], fill=20, width=w)
        draw.line([(pos, MARGIN), (pos, MARGIN + GRID)], fill=20, width=w)
    font = ImageFont.truetype(FONT_PATH, int(CELL * 0.6))
    for i, ch in enumerate(PUZZLE):
        if ch == "0":
            continue
        r, c = divmod(i, 9)
        cx = MARGIN + c * CELL + CELL // 2
        cy = MARGIN + r * CELL + CELL // 2
        bbox = draw.textbbox((0, 0), ch, font=font)
        draw.text(
            (cx - (bbox[2] - bbox[0]) / 2 - bbox[0], cy - (bbox[3] - bbox[1]) / 2 - bbox[1]),
            ch, font=font, fill=15,
        )
    img = img.rotate(2.0, fillcolor=250, resample=Image.BILINEAR)  # slight camera tilt
    arr = np.array(img, dtype=np.float32)
    arr += np.random.default_rng(7).normal(0, 4, arr.shape)  # sensor noise
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")
    img = img.resize((640, 640), Image.BILINEAR)
    img.save("../../tests/fixtures/synthetic-1.png")
    with open("../../tests/fixtures/synthetic-1.txt", "w") as f:
        f.write(PUZZLE + "\n")
    print("Wrote tests/fixtures/synthetic-1.png + .txt")


if __name__ == "__main__":
    main()
