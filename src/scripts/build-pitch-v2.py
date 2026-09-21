from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/evidencia/media/pitch-v2"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
NAVY, BLUE, PURPLE, GREEN = "#14213d", "#2841d8", "#7447e8", "#35a85b"
AMBER, RED, MUTED, BG, WHITE = "#f1b52b", "#e96a5a", "#60708e", "#f4f6fb", "#ffffff"

FONT_REG = "C:/Windows/Fonts/segoeui.ttf"
FONT_SEMI = "C:/Windows/Fonts/seguisb.ttf"
FONT_BOLD = "C:/Windows/Fonts/seguibl.ttf"

def font(size, bold=False, semi=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_SEMI if semi else FONT_REG, size)

def canvas(number, section):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((80, 58, 154, 132), 10, fill=BLUE)
    d.text((117, 95), "A", font=font(48, bold=True), fill=WHITE, anchor="mm")
    d.text((178, 94), "ArenaPay", font=font(43, bold=True), fill=NAVY, anchor="lm")
    d.text((1840, 94), "STELLAR ODYSSEY PERÚ · GAMING & PHYSICS", font=font(24, semi=True), fill=MUTED, anchor="rm")
    d.line((80, 160, 1840, 160), fill="#d8deec", width=2)
    d.text((80, 1020), f"{number:02d}  {section.upper()}", font=font(22, semi=True), fill=MUTED)
    d.text((1840, 1020), "Stellar Testnet · Soroban", font=font(22), fill=MUTED, anchor="ra")
    return im, d

def title(d, heading, sub=None):
    d.text((100, 215), heading, font=font(58, bold=True), fill=NAVY)
    if sub:
        d.text((102, 292), sub, font=font(29), fill=MUTED)

def box(d, xy, label, color=WHITE, outline="#c8d1e5", text=NAVY, radius=24, size=30):
    d.rounded_rectangle(xy, radius, fill=color, outline=outline, width=3)
    x1, y1, x2, y2 = xy
    d.multiline_text(((x1+x2)//2, (y1+y2)//2), label, font=font(size, semi=True), fill=text, anchor="mm", align="center", spacing=8)

def arrow(d, a, b, color=MUTED, width=8):
    d.line((*a, *b), fill=color, width=width)
    x, y = b
    d.polygon([(x, y), (x-22, y-13), (x-22, y+13)], fill=color)

def save(im, name):
    im.save(OUT / name, quality=95)

# 01 — problema
im, d = canvas(1, "El problema")
title(d, "Una competición. Dos actos de confianza.", "El organizador declara el resultado y controla el pago")
box(d, (110, 410, 500, 690), "PARTIDA\n¿Quién ganó?", color="#eef2ff", outline=BLUE, size=38)
box(d, (765, 390, 1155, 710), "ORGANIZADOR\n\nresultado\n+\npago", color="#fff7df", outline=AMBER, size=34)
box(d, (1420, 410, 1810, 690), "PREMIO\n¿Se pagará?", color="#fff0ee", outline=RED, size=38)
arrow(d, (500, 550), (765, 550), RED)
arrow(d, (1155, 550), (1420, 550), RED)
d.rounded_rectangle((385, 805, 1535, 910), 25, fill=NAVY)
d.text((960, 857), "El jugador debe creer en una sola autoridad", font=font(38, semi=True), fill=WHITE, anchor="mm")
save(im, "01-problema.png")

# 02 — propuesta
im, d = canvas(2, "La propuesta")
title(d, "ArenaPay separa juego, evidencia y pago", "Cada capa tiene una responsabilidad comprobable")
xs = [(100, 410, 590, 735), (715, 410, 1205, 735), (1330, 410, 1820, 735)]
labels = [
    ("1", "JUEGO", "Motor determinista\nfuera de cadena", BLUE),
    ("2", "EVIDENCIA", "Replay + hash\nreproducible", PURPLE),
    ("3", "LIQUIDACIÓN", "Escrow y premio\nen Soroban", GREEN),
]
for xy, (n, h, body, c) in zip(xs, labels):
    d.rounded_rectangle(xy, 34, fill=WHITE, outline=c, width=5)
    d.ellipse((xy[0]+35, xy[1]+35, xy[0]+100, xy[1]+100), fill=c)
    d.text((xy[0]+68, xy[1]+68), n, font=font(31, bold=True), fill=WHITE, anchor="mm")
    d.text(((xy[0]+xy[2])//2, xy[1]+150), h, font=font(35, bold=True), fill=c, anchor="mm")
    d.multiline_text(((xy[0]+xy[2])//2, xy[1]+235), body, font=font(31), fill=NAVY, anchor="mm", align="center", spacing=12)
arrow(d, (590, 572), (715, 572), MUTED)
arrow(d, (1205, 572), (1330, 572), MUTED)
d.text((960, 850), "El resultado se demuestra antes de cobrarse.", font=font(44, bold=True), fill=NAVY, anchor="mm")
save(im, "02-propuesta.png")

# 03 — arquitectura
im, d = canvas(3, "Arquitectura")
title(d, "Rápido fuera de cadena. Incontestable en Soroban.", "La cadena conserva compromisos económicos, hash y firma")
box(d, (90, 430, 380, 690), "WALLETS\nFreighter\nA + B", color="#eef2ff", outline=BLUE, size=30)
box(d, (485, 390, 805, 730), "MOTOR\n\nmovimientos\nganador\nhash final", color="#f4efff", outline=PURPLE, size=29)
box(d, (910, 390, 1230, 730), "REPLAY\n\nsemilla\ninputs\nestado final", color="#eef9f0", outline=GREEN, size=29)
box(d, (1335, 390, 1655, 730), "ÁRBITRO\n\nfirma la\nresolución", color="#fff7df", outline=AMBER, size=30)
arrow(d, (380, 560), (485, 560), BLUE)
arrow(d, (805, 560), (910, 560), PURPLE)
arrow(d, (1230, 560), (1335, 560), GREEN)
d.rounded_rectangle((600, 825, 1320, 940), 28, fill=NAVY)
d.text((960, 882), "SOROBAN  ·  ESCROW  ·  PAGO", font=font(38, bold=True), fill=WHITE, anchor="mm")
d.line((250, 690, 250, 882, 600, 882), fill=BLUE, width=7)
d.line((1495, 730, 1495, 882, 1320, 882), fill=AMBER, width=7)
save(im, "03-arquitectura.png")

# 04 — motores
im, d = canvas(4, "Motores versionados")
title(d, "El juego es un componente intercambiable", "GameEngine selecciona reglas y verificador por versión inmutable")
box(d, (120, 400, 660, 780), "REGISTRO\nDE MOTORES\n\ninitialState\nrun\nbuildReplay\nverifyReplay", color=NAVY, outline=NAVY, text=WHITE, size=31)
engines = [
    ((900, 375, 1750, 515), "resource-arena/1.0.0", "histórico · verificable", MUTED),
    ((900, 555, 1750, 695), "resource-arena/2.0.0", "vigente · Atlas y Nova", BLUE),
    ((900, 735, 1750, 875), "hex/1.0.0  ·  connect-four/1.0.0", "siguientes motores", PURPLE),
]
for xy, name, note, c in engines:
    d.rounded_rectangle(xy, 28, fill=WHITE, outline=c, width=4)
    d.text((xy[0]+35, (xy[1]+xy[3])//2-20), name, font=font(31, bold=True), fill=c, anchor="lm")
    d.text((xy[0]+35, (xy[1]+xy[3])//2+32), note, font=font(25), fill=MUTED, anchor="lm")
    arrow(d, (660, (xy[1]+xy[3])//2), (900, (xy[1]+xy[3])//2), c, 6)
d.text((960, 945), "Mismo motor en Node y navegador · replays históricos intactos", font=font(30, semi=True), fill=NAVY, anchor="mm")
save(im, "04-motores.png")

# 05 — evidencia
im, d = canvas(5, "Evidencia ejecutada")
title(d, "El MVP ya liquidó una partida en Stellar Testnet", "La afirmación está respaldada por replay, recibos y transacciones")
metrics = [
    ("60", "ticks reproducibles", BLUE),
    ("120", "movimientos registrados", PURPLE),
    ("2 XLM", "premio de prueba", GREEN),
    ("100 %", "hash coincidente", AMBER),
]
for i, (value, label, c) in enumerate(metrics):
    x = 100 + i*450
    d.rounded_rectangle((x, 410, x+390, 650), 30, fill=WHITE, outline=c, width=4)
    d.text((x+195, 500), value, font=font(57, bold=True), fill=c, anchor="mm")
    d.text((x+195, 585), label, font=font(25, semi=True), fill=NAVY, anchor="mm")
d.rounded_rectangle((160, 760, 1760, 900), 28, fill="#eaf7ee", outline=GREEN, width=3)
d.text((960, 810), "Contrato  CDHPEY…R4RID", font=font(34, bold=True), fill=NAVY, anchor="mm")
d.text((960, 862), "Replay JSON · hash final · liquidación pública · evidencia archivada", font=font(27), fill=MUTED, anchor="mm")
save(im, "05-evidencia.png")

# 06 — juegos
im, d = canvas(6, "Plataforma reutilizable")
title(d, "La arena es la demostración, no el límite", "Dos participantes + un ganador reutilizan el escrow actual")
games = [
    ("HEX", "encaje excelente", BLUE),
    ("CONNECT FOUR", "encaje excelente", PURPLE),
    ("DAMAS", "muy buen encaje", GREEN),
    ("AJEDREZ", "resolver tablas y reloj", AMBER),
    ("AGENTES", "SDK + sandbox", BLUE),
]
for i, (name, note, c) in enumerate(games):
    row, col = divmod(i, 3)
    x, y = 100 + col*590, 390 + row*250
    d.rounded_rectangle((x, y, x+520, y+190), 30, fill=WHITE, outline=c, width=4)
    d.text((x+35, y+65), name, font=font(34, bold=True), fill=c, anchor="lm")
    d.text((x+35, y+125), note, font=font(25), fill=MUTED, anchor="lm")
d.rounded_rectangle((1280, 640, 1800, 830), 30, fill="#fff0ee", outline=RED, width=4)
d.text((1540, 700), "PÓKER", font=font(34, bold=True), fill=RED, anchor="mm")
d.multiline_text((1540, 770), "privacidad + azar +\nvarios participantes", font=font(23), fill=NAVY, anchor="mm", align="center")
d.text((960, 930), "Cada juego aporta reglas, replay, verificador y tablero.", font=font(34, semi=True), fill=NAVY, anchor="mm")
save(im, "06-juegos.png")

# 07 — roadmap
im, d = canvas(7, "Hoja de ruta")
title(d, "Del MVP a una plataforma de competiciones", "Hitos verificables antes de pensar en Mainnet")
steps = [
    ("01", "PARTIDAS\nCOMPARTIBLES", "dos dispositivos", BLUE),
    ("02", "SEGUNDO\nMOTOR", "Hex o Connect Four", PURPLE),
    ("03", "SDK +\nSANDBOX", "agentes de terceros", GREEN),
    ("04", "JUGADORES\nHUMANOS", "salas y turnos", AMBER),
    ("05", "PRODUCCIÓN", "auditoría y operación", NAVY),
]
for i, (n, name, note, c) in enumerate(steps):
    x = 70 + i*370
    d.ellipse((x+120, 375, x+210, 465), fill=c)
    d.text((x+165, 420), n, font=font(30, bold=True), fill=WHITE, anchor="mm")
    if i < 4: arrow(d, (x+220, 420), (x+360, 420), MUTED, 5)
    d.rounded_rectangle((x, 510, x+330, 790), 28, fill=WHITE, outline=c, width=4)
    d.multiline_text((x+165, 610), name, font=font(30, bold=True), fill=c, anchor="mm", align="center", spacing=6)
    d.multiline_text((x+165, 720), note, font=font(23), fill=MUTED, anchor="mm", align="center")
d.text((960, 905), "Financiación ligada a entregables, adopción y seguridad", font=font(38, bold=True), fill=NAVY, anchor="mm")
save(im, "07-roadmap.png")

# 08 — cierre
im, d = canvas(8, "Cierre")
d.rounded_rectangle((120, 245, 300, 425), 28, fill=BLUE)
d.text((210, 335), "A", font=font(112, bold=True), fill=WHITE, anchor="mm")
d.text((360, 295), "ArenaPay", font=font(78, bold=True), fill=NAVY)
d.text((362, 405), "Del juego al premio verificable.", font=font(44), fill=BLUE)
d.text((120, 565), "La arena demuestra el MVP.", font=font(45, semi=True), fill=NAVY)
d.text((120, 635), "La arquitectura permite construir la plataforma.", font=font(45, bold=True), fill=NAVY)
links = ["arenapay.vercel.app", "github.com/hvaler/ArenaPay", "Demo y evidencia pública"]
for i, link in enumerate(links):
    y = 770 + i*58
    d.ellipse((125, y+10, 145, y+30), fill=[BLUE, PURPLE, GREEN][i])
    d.text((170, y+20), link, font=font(27), fill=MUTED, anchor="lm")
save(im, "08-cierre.png")

# Contact sheet for quick review
thumbs = []
for path in [OUT / f"{i:02d}-{name}.png" for i, name in enumerate([
    "", "problema", "propuesta", "arquitectura", "motores", "evidencia", "juegos", "roadmap", "cierre"
]) if i]:
    t = Image.open(path).resize((480, 270))
    thumbs.append(t)
sheet = Image.new("RGB", (960, 1080), "#dfe4ef")
for i, t in enumerate(thumbs):
    sheet.paste(t, ((i % 2) * 480, (i // 2) * 270))
sheet.save(OUT / "00-storyboard.png", quality=95)

# YouTube thumbnail without internal production labels.
thumb = Image.new("RGB", (W, H), BG)
td = ImageDraw.Draw(thumb)
td.rounded_rectangle((100, 90, 270, 260), 28, fill=BLUE)
td.text((185, 175), "A", font=font(104, bold=True), fill=WHITE, anchor="mm")
td.text((330, 135), "ArenaPay", font=font(76, bold=True), fill=NAVY)
td.text((335, 235), "Competiciones verificables sobre Stellar", font=font(38), fill=BLUE)
td.text((105, 410), "Del juego al premio", font=font(74, bold=True), fill=NAVY)
td.text((105, 510), "verificable.", font=font(74, bold=True), fill=NAVY)
chips = [("MOTOR", BLUE), ("REPLAY", PURPLE), ("SOROBAN", GREEN)]
for i, (label, color) in enumerate(chips):
    x = 110 + i * 410
    td.rounded_rectangle((x, 690, x + 350, 795), 30, fill=color)
    td.text((x + 175, 742), label, font=font(32, bold=True), fill=WHITE, anchor="mm")
td.rounded_rectangle((1390, 365, 1770, 825), 42, fill=NAVY)
td.text((1580, 475), "JUEGO", font=font(36, bold=True), fill="#7da2ff", anchor="mm")
td.text((1580, 585), "↓", font=font(48, bold=True), fill=WHITE, anchor="mm")
td.text((1580, 680), "EVIDENCIA", font=font(36, bold=True), fill="#b99cff", anchor="mm")
td.text((1580, 790), "↓  PAGO", font=font(36, bold=True), fill="#75dc94", anchor="mm")
thumb.save(OUT / "arenapay-arquitectura-thumbnail.png", quality=95)
print(f"Generated {len(thumbs)} slides in {OUT}")
