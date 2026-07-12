"""Train a tiny printed-digit CNN on synthetic font renders; export to TF.js.

Normalization contract (must match src/scan/classify.ts prepareDigit):
input = (255 - gray) / 255, 28x28, ink ~1.0, paper ~0.0.
"""
import glob
import random
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

DIGIT_SIZE = 28
RENDER_SIZE = 64
SAMPLES_PER_FONT_PER_DIGIT = 60
MAX_FONTS = 60
VAL_ACCURACY_GATE = 0.99

FONT_DIRS = [
    "/System/Library/Fonts/**/*.ttf",
    "/System/Library/Fonts/**/*.ttc",
    "/System/Library/Fonts/**/*.otf",
    "/Library/Fonts/**/*.ttf",
    "/Library/Fonts/**/*.otf",
]


def usable_fonts():
    paths = sorted({p for pattern in FONT_DIRS for p in glob.glob(pattern, recursive=True)})
    fonts = []
    for path in paths:
        try:
            font = ImageFont.truetype(path, 44)
            img = Image.new("L", (RENDER_SIZE, RENDER_SIZE), 255)
            ImageDraw.Draw(img).text((10, 5), "5", font=font, fill=0)
            arr = np.array(img)
            ink = (arr < 128).sum()
            if not (40 < ink < 1200):  # skip symbol/blank fonts
                continue
            # Fonts lacking real digit glyphs fall back to an identical
            # "tofu" box for every character; a real digit font's ink count
            # varies across digits (e.g. "1" vs "8"). Reject fonts whose
            # ink count is constant across sample digits.
            inks = set()
            for digit in ("1", "5", "8"):
                sample = Image.new("L", (RENDER_SIZE, RENDER_SIZE), 255)
                ImageDraw.Draw(sample).text((10, 5), digit, font=font, fill=0)
                inks.add(int((np.array(sample) < 128).sum()))
            if len(inks) < 2:
                continue
            fonts.append(path)
        except OSError:
            continue
        if len(fonts) >= MAX_FONTS:
            break
    return fonts


def render_sample(font_path, digit, rng):
    font = ImageFont.truetype(font_path, rng.randint(36, 52))
    img = Image.new("L", (RENDER_SIZE, RENDER_SIZE), 255)
    draw = ImageDraw.Draw(img)
    bbox = draw.textbbox((0, 0), str(digit), font=font)
    x = (RENDER_SIZE - (bbox[2] - bbox[0])) // 2 - bbox[0] + rng.randint(-3, 3)
    y = (RENDER_SIZE - (bbox[3] - bbox[1])) // 2 - bbox[1] + rng.randint(-3, 3)
    draw.text((x, y), str(digit), font=font, fill=rng.randint(0, 60))
    img = img.rotate(rng.uniform(-8, 8), fillcolor=255, resample=Image.BILINEAR)
    if rng.random() < 0.5:
        img = img.filter(ImageFilter.GaussianBlur(rng.uniform(0.3, 1.0)))
    img = img.resize((DIGIT_SIZE, DIGIT_SIZE), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32)
    arr += rng.uniform(-15, 25)  # brightness jitter
    arr += np.random.normal(0, rng.uniform(2, 8), arr.shape)  # sensor noise
    arr = np.clip(arr, 0, 255)
    return (255.0 - arr) / 255.0


def build_dataset(fonts):
    rng = random.Random(42)
    np.random.seed(42)
    xs, ys = [], []
    for font_path in fonts:
        for digit in range(1, 10):
            for _ in range(SAMPLES_PER_FONT_PER_DIGIT):
                xs.append(render_sample(font_path, digit, rng))
                ys.append(digit - 1)
    x = np.stack(xs)[..., np.newaxis]
    y = np.array(ys)
    idx = np.random.permutation(len(x))
    return x[idx], y[idx]


def main():
    import tensorflow as tf
    import tensorflowjs as tfjs

    fonts = usable_fonts()
    print(f"Using {len(fonts)} fonts")
    if len(fonts) < 20:
        sys.exit("Too few usable fonts found — pass more font dirs")

    x, y = build_dataset(fonts)
    split = int(len(x) * 0.9)
    x_train, y_train, x_val, y_val = x[:split], y[:split], x[split:], y[split:]
    print(f"Train {len(x_train)}, val {len(x_val)}")

    model = tf.keras.Sequential([
        tf.keras.layers.Input(shape=(DIGIT_SIZE, DIGIT_SIZE, 1)),
        tf.keras.layers.Conv2D(16, 3, activation="relu"),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Conv2D(32, 3, activation="relu"),
        tf.keras.layers.MaxPooling2D(),
        tf.keras.layers.Flatten(),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dropout(0.25),
        tf.keras.layers.Dense(9, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    model.fit(x_train, y_train, validation_data=(x_val, y_val), epochs=10, batch_size=128)

    _, val_acc = model.evaluate(x_val, y_val, verbose=0)
    print(f"Validation accuracy: {val_acc:.4f}")
    if val_acc < VAL_ACCURACY_GATE:
        sys.exit(f"Accuracy gate failed: {val_acc:.4f} < {VAL_ACCURACY_GATE}")

    tfjs.converters.save_keras_model(model, "../../public/models/digits")
    print("Exported to public/models/digits/")


if __name__ == "__main__":
    main()
