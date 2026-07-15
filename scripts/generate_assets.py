from pathlib import Path
from random import Random

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
ASSETS.mkdir(exist_ok=True)


def font(size):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size=size)
        except OSError:
            continue
    return ImageFont.load_default()


FONT_SM = font(18)
FONT_MD = font(28)
FONT_LG = font(44)


def lerp(a, b, t):
    return int(a + (b - a) * t)


def gradient(size, top, bottom):
    width, height = size
    img = Image.new("RGB", size, top)
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(height - 1, 1)
        color = tuple(lerp(top[i], bottom[i], t) for i in range(3))
        draw.line([(0, y), (width, y)], fill=color)
    return img


def add_grain(img, seed=1, amount=22):
    rng = Random(seed)
    noise = Image.new("L", img.size, 0)
    pixels = noise.load()
    width, height = img.size
    for y in range(height):
        for x in range(width):
            pixels[x, y] = rng.randrange(amount)
    overlay = Image.new("RGB", img.size, (255, 255, 255))
    return Image.composite(overlay, img, noise.point(lambda v: min(v, 32)))


def draw_window(draw, xy, title, accent):
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=10, fill=(29, 29, 25), outline=(88, 84, 73), width=2)
    draw.rectangle((x1, y1, x2, y1 + 42), fill=(37, 37, 32))
    for i, c in enumerate([(184, 109, 100), (210, 169, 79), accent]):
        draw.ellipse((x1 + 18 + i * 24, y1 + 14, x1 + 30 + i * 24, y1 + 26), fill=c)
    draw.text((x1 + 96, y1 + 11), title, font=FONT_SM, fill=(214, 205, 184))


def save_noise():
    rng = Random(42)
    img = Image.new("L", (128, 128), 0)
    pixels = img.load()
    for y in range(128):
        for x in range(128):
            pixels[x, y] = rng.randrange(0, 255)
    img.save(ASSETS / "noise.png")
    img.convert("RGBA").save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32)])


def save_hero():
    img = gradient((960, 720), (18, 18, 15), (9, 10, 8))
    draw = ImageDraw.Draw(img, "RGBA")

    for x in range(0, 960, 48):
        draw.line((x, 0, x, 720), fill=(241, 234, 219, 12), width=1)
    for y in range(0, 720, 48):
        draw.line((0, y, 960, y), fill=(241, 234, 219, 10), width=1)

    draw.ellipse((620, -120, 1060, 300), fill=(153, 178, 127, 36))
    draw.ellipse((-130, 420, 280, 860), fill=(210, 169, 79, 22))

    for i, (x, y, w, h) in enumerate(
        [(90, 122, 250, 190), (380, 92, 300, 235), (650, 260, 220, 260), (160, 380, 260, 220)]
    ):
        draw_window(draw, (x, y, x + w, y + h), f"archive_{i + 1}.html", (153, 178, 127))
        for row in range(4):
            yy = y + 70 + row * 28
            draw.rounded_rectangle((x + 22, yy, x + w - 24, yy + 10), radius=5, fill=(241, 234, 219, 44))
        draw.rectangle((x + 22, y + h - 48, x + w - 24, y + h - 34), fill=(153, 178, 127, 72))

    for x, y, h in [(470, 430, 170), (540, 390, 210), (610, 455, 145), (690, 410, 190)]:
        draw.rounded_rectangle((x, y, x + 48, y + h), radius=22, fill=(38, 39, 34), outline=(194, 214, 155, 92), width=2)
        draw.line((x + 12, y + 48, x + 36, y + 48), fill=(194, 214, 155, 120), width=2)
        draw.line((x + 12, y + 66, x + 36, y + 66), fill=(241, 234, 219, 48), width=1)

    draw.text((72, 585), "CYBER MEMORY CEMETERY", font=FONT_LG, fill=(241, 234, 219, 232))
    draw.text((76, 642), "truth score / request id / permanent archive", font=FONT_SM, fill=(185, 174, 153, 220))

    img = img.filter(ImageFilter.UnsharpMask(radius=2, percent=140))
    add_grain(img, 4).save(ASSETS / "memory-cemetery.png")


def base_case(seed, top=(19, 19, 16), bottom=(10, 11, 9)):
    img = gradient((720, 540), top, bottom)
    draw = ImageDraw.Draw(img, "RGBA")
    rng = Random(seed)
    for _ in range(120):
        x = rng.randrange(0, 720)
        y = rng.randrange(0, 540)
        draw.point((x, y), fill=(241, 234, 219, rng.randrange(18, 80)))
    return img, draw, rng


def save_xiami():
    img, draw, _ = base_case(11, (24, 22, 18), (12, 13, 10))
    draw.ellipse((70, 80, 370, 380), fill=(153, 178, 127, 44), outline=(194, 214, 155, 110), width=3)
    draw.ellipse((155, 165, 285, 295), fill=(14, 15, 12), outline=(241, 234, 219, 70), width=2)
    for i in range(16):
        x = 420 + i * 13
        top = 270 - (i % 5) * 28
        draw.rounded_rectangle((x, top, x + 7, 330), radius=3, fill=(210, 169, 79, 120))
    draw.text((70, 420), "XIAMI MUSIC", font=FONT_LG, fill=(241, 234, 219, 232))
    draw.text((74, 474), "playlists / reviews / indie memory", font=FONT_SM, fill=(185, 174, 153, 230))
    add_grain(img, 12).save(ASSETS / "case-xiami.png")


def save_renren():
    img, draw, _ = base_case(22, (20, 23, 24), (10, 12, 12))
    for row in range(2):
        for col in range(3):
            x = 70 + col * 150
            y = 78 + row * 132
            draw.rounded_rectangle((x, y, x + 118, y + 92), radius=8, fill=(241, 234, 219, 30), outline=(153, 178, 127, 70))
            draw.rectangle((x + 12, y + 56, x + 106, y + 66), fill=(241, 234, 219, 42))
            draw.rectangle((x + 12, y + 72, x + 86, y + 80), fill=(241, 234, 219, 32))
    draw.line((515, 100, 630, 248), fill=(194, 214, 155, 120), width=4)
    draw.line((630, 100, 515, 248), fill=(194, 214, 155, 120), width=4)
    draw.text((70, 398), "RENREN / XIAONEI", font=FONT_LG, fill=(241, 234, 219, 232))
    draw.text((74, 454), "albums / diaries / campus graph", font=FONT_SM, fill=(185, 174, 153, 230))
    add_grain(img, 23).save(ASSETS / "case-renren.png")


def save_blog():
    img, draw, _ = base_case(33, (24, 23, 20), (11, 11, 9))
    for i in range(5):
        x = 108 + i * 62
        y = 80 + i * 26
        draw.rounded_rectangle((x, y, x + 330, y + 230), radius=8, fill=(241, 234, 219, 38), outline=(185, 174, 153, 70))
        for row in range(7):
            draw.rectangle((x + 28, y + 34 + row * 24, x + 292, y + 42 + row * 24), fill=(241, 234, 219, 38))
    draw.text((70, 406), "NETEASE BLOG", font=FONT_LG, fill=(241, 234, 219, 232))
    draw.text((74, 462), "long posts / diaries / personal pages", font=FONT_SM, fill=(185, 174, 153, 230))
    add_grain(img, 34).save(ASSETS / "case-netease-blog.png")


def save_tianya():
    img, draw, _ = base_case(44, (21, 20, 18), (9, 10, 8))
    for i in range(8):
        y = 70 + i * 42
        width = 440 + (i % 3) * 38
        draw.rounded_rectangle((76, y, 76 + width, y + 26), radius=5, fill=(241, 234, 219, 28), outline=(153, 178, 127, 50))
        draw.rectangle((96, y + 9, 96 + width - 80, y + 15), fill=(194, 214, 155, 65))
    draw.arc((500, 86, 650, 236), start=200, end=520, fill=(210, 169, 79, 160), width=5)
    draw.text((70, 408), "TIANYA FORUM", font=FONT_LG, fill=(241, 234, 219, 232))
    draw.text((74, 464), "long threads / public square / folk archive", font=FONT_SM, fill=(185, 174, 153, 230))
    add_grain(img, 45).save(ASSETS / "case-tianya.png")


def save_mop():
    img, draw, _ = base_case(55, (23, 22, 20), (9, 10, 9))
    for x in range(80, 610, 54):
        for y in range(70, 320, 48):
            color = (153, 178, 127, 72) if (x + y) % 3 == 0 else (210, 169, 79, 54)
            draw.rectangle((x, y, x + 34, y + 26), fill=color, outline=(241, 234, 219, 34))
    draw.rounded_rectangle((472, 90, 620, 268), radius=18, fill=(17, 17, 15), outline=(184, 109, 100, 130), width=3)
    draw.text((70, 404), "MOP FORUM", font=FONT_LG, fill=(241, 234, 219, 232))
    draw.text((74, 460), "bbs culture / memes / early web noise", font=FONT_SM, fill=(185, 174, 153, 230))
    add_grain(img, 56).save(ASSETS / "case-mop.png")


def main():
    save_noise()
    save_hero()
    save_xiami()
    save_renren()
    save_blog()
    save_tianya()
    save_mop()


if __name__ == "__main__":
    main()
