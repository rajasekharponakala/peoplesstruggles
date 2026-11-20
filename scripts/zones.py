"""Georeferencing + tracing of the 1948 movement map printed on p. 2 of the book.

Pixel coordinates refer to public/maps/movement-map.jpg (1298 × 1063).
CONTROL: towns identified on the scan → their real coordinates; an affine fit
maps every traced pixel to lat/lon (residuals ≈ 0.05°). Zones are hand-traced
and approximate — they show what the book's map shows, not surveyed lines.
"""

CONTROL = [
    ("Hyderabad", 330, 668, 17.385, 78.486), ("Warangal", 620, 495, 17.968, 79.594),
    ("Khammam", 750, 665, 17.247, 80.151), ("Karimnagar", 497, 390, 18.438, 79.128),
    ("Nizamabad", 250, 300, 18.672, 78.094), ("Adilabad", 355, 75, 19.664, 78.532),
    ("Eluru", 960, 780, 16.711, 81.095), ("Guntur", 800, 905, 16.306, 80.436),
    ("Nalgonda", 480, 712, 17.057, 79.267),
]

STRONG = [(440, 500), (470, 470), (520, 460), (560, 470), (600, 478), (640, 480), (660, 500), (700, 540), (740, 560),
          (790, 590), (820, 630), (830, 690), (815, 740), (790, 770), (800, 800), (835, 815), (830, 832), (800, 832),
          (760, 805), (720, 795), (690, 805), (670, 840), (640, 852), (600, 862), (560, 880), (520, 885), (495, 860),
          (470, 822), (445, 792), (410, 772), (380, 752), (365, 700), (370, 640), (385, 590), (410, 540)]
KARIMNAGAR = [(370, 330), (420, 310), (470, 300), (495, 322), (490, 370), (460, 400), (410, 415), (375, 400), (362, 365)]
EXPANSION = [(290, 180), (360, 165), (430, 160), (500, 165), (560, 175), (620, 200), (655, 230), (670, 270), (690, 300),
             (720, 330), (760, 360), (800, 400), (840, 440), (880, 490), (920, 560), (960, 600), (1010, 615), (1050, 628),
             (1030, 650), (980, 660), (930, 690), (900, 720), (860, 760), (845, 800), (830, 832), (780, 822), (720, 832),
             (680, 860), (640, 872), (600, 882), (560, 900), (500, 912), (470, 932), (440, 972), (400, 995), (340, 1010),
             (285, 1005), (265, 980), (280, 930), (300, 880), (310, 820), (305, 760), (300, 712), (250, 702), (190, 706),
             (120, 700), (105, 670), (120, 630), (180, 602), (250, 582), (280, 540), (275, 480), (265, 420), (260, 330),
             (265, 260), (275, 210)]

ZONES = [
    ("expansion", "Expansion of guerrilla movement after 1948", "expansion", [EXPANSION]),
    ("strong", "Original strong base of the movement", "strong", [STRONG]),
    ("strong-karimnagar", "Strong base — Sircilla / Karimnagar", "strong", [KARIMNAGAR]),
]

ARROWS = [
    ("East into the Godavari forests", [(740, 610), (820, 580), (905, 545)]),
    ("North-east to Mulugu & the Godavari", [(660, 470), (720, 400), (790, 330)]),
    ("North to Karimnagar", [(560, 460), (540, 380), (530, 300)]),
    ("North to Adilabad", [(470, 300), (440, 240), (420, 180)]),
    ("West to Hyderabad & Vikarabad", [(380, 650), (300, 640), (190, 650)]),
    ("South to Amarabad & the Nallamala", [(480, 830), (450, 900), (400, 965)]),
]
