#!/usr/bin/env python3
"""
Procesa el corpus de frases de Guillermo Moreno y genera:
- src/data/frases.json  → array de frases limpias
- src/data/topics.json  → top topics con conteos
- src/data/stats.json   → estadísticas del corpus

Uso (desde la raíz del proyecto):  python scripts/process_corpus.py
"""
import json
import re
from pathlib import Path
from collections import Counter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "upload" / "frases_moreno.txt"
OUT_DIR = ROOT / "src" / "data"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── 1. Leer y partir por líneas ─────────────────────────────────────────────
raw = SRC.read_text(encoding="utf-8", errors="ignore")

# Separar por saltos de línea y por marcadores "//"
chunks = []
for line in raw.split("\n"):
    # splitter por "//" si la línea los contiene
    parts = re.split(r"^\s*//\s*", line)
    for p in parts:
        chunks.append(p)

# ── 2. Limpieza ────────────────────────────────────────────────────────────
def clean(t: str) -> str:
    t = t.strip()
    # Quitar comillas tipográficas exteriores
    t = re.sub(r'^["\'«“""]+', "", t)
    t = re.sub(r'["\'»”""]+$', "", t)
    t = t.strip()
    # Colapsar whitespaces múltiples
    t = re.sub(r"\s+", " ", t)
    # Normalizar minúsculas/ortografía común preservando estilo original
    return t

frases = []
seen = set()
for c in chunks:
    f = clean(c)
    if len(f) < 25:
        continue
    # Detección de basura: líneas que son comentarios del transcriptor
    if re.match(r"^\s*\[", f):
        continue
    if f.lower().startswith("(gm con"):
        continue
    # Dedupe básico
    key = re.sub(r"[^a-záéíóúñ0-9]", "", f.lower())[:120]
    if key in seen:
        continue
    seen.add(key)
    frases.append(f)

# ── 3. Top topics (bigramas + keywords temáticas) ─────────────────────────
KEYWORDS_TEMATICAS = [
    "peronismo", "perón", "peron", "evita", "doctrina", "doctrinaria",
    "kicillof", "cristina", "kirchner", "macri", "alberto", "alberto fernandez",
    "milei", "trump", "putin", "papa", "braden", "moreno",
    "decada ganada", "decada perdida", "produccion y trabajo", "especulacion y renta",
    "escuela austriaca", "socialdemocracia", "socialdemocrata", "neoliberal", "neoliberalismo",
    "progresismo", "progresista", "globalizacion", "nacionalismo", "nacionalista",
    "industria", "reindustrializacion", "trabajo", "obrero", "trabajadores",
    "empresario", "empresarios", "sector privado", "sector publico", "estado",
    "pampa humeda", "sociedad rural", "terreniente", "oligarca", "oligarquia",
    "energia", "petroleo", "ypf", "gasoil", "gasoil", "electricidad", "tarifa",
    "alimentos", "comida", "carne", "leche", "pan",
    "deuda", "fmi", "fondo monetario", "endeudamiento", "dolar", "dolares",
    "devaluacion", "devaluar", "tasa de interes", "rentabilidad",
    "costos", "precio", "precios", "inflacion", "subsidio", "subsidios",
    "retenciones", "aranceles", "comercio", "importacion", "exportacion",
    "china", "chinos", "ee.uu", "estados unidos", "europa", "rusia",
    "ucrania", "zelensky", "brics", "malvinas", "patagonia", "antartida",
    "plan de gobierno", "renta universal", "plan social", "planes",
    "movimiento obrero", "cgt", "sindicato", "sindical",
    "partido justicialista", "pj", "movimiento peronista", "frente de todos",
    "justicialismo", "justicialista",
    "comunidad organizada", "bien comun", "justicia social", "amor", "pueblo",
    "patria", "pueblos", "libertad", "libre albedrio",
    "dios", "jesucristo", "creacion", "fe", "evangelio",
    "alyson", "stiglitz", "galuccio", "guzman", "prat-gay", "caputo",
    "larreta", "bullrich", "massa", "melconian",
    "alfonsin", "de la rua", "menem", "duhalde",
    "acuerdo de precios", "administracion de comercio", "controles de precio",
    "cepo", "bimonetaria", "emision",
    "sectores populares", "jubilados", "jubilacion",
    "agenda 2030", "post moderno", "postmodernismo", "subjetivismo",
    "conicet", "universidad", "universidades",
    "malvinas", "defensa", "fuerzas armadas", "ejercito",
    "chacarita", "paco", "nordelta", "seguridad",
    "teoria objetiva del valor", "teoria subjetiva del valor",
    "modo de produccion", "modo de circulacion", "modo de distribucion",
    "capital", "capital y trabajo", "armonia", "lucha de clases",
]

text_lower = " " + raw.lower() + " "
topics_count = Counter()
for kw in KEYWORDS_TEMATICAS:
    # Contar ocurrencias como palabra/segmento
    pat = re.escape(kw)
    n = len(re.findall(r"\b" + pat + r"\b", text_lower))
    if n == 0:
        # intentar sin word boundaries (para frases compuestas)
        n = text_lower.count(kw)
    if n > 0:
        topics_count[kw] = n

# Top 50 topics
top_topics = [
    {"topic": t, "count": c}
    for t, c in topics_count.most_common(60)
]

# ── 4. Stats ───────────────────────────────────────────────────────────────
stats = {
    "total_frases": len(frases),
    "longitud_promedio": round(sum(len(f) for f in frases) / max(1, len(frases)), 1),
    "longitud_maxima": max(len(f) for f in frases) if frases else 0,
    "longitud_minima": min(len(f) for f in frases) if frases else 0,
    "palabras_totales": sum(len(f.split()) for f in frases),
    "caracteres_totales": sum(len(f) for f in frases),
    "topics_detectados": len(topics_count),
}

# ── 5. Escribir outputs ────────────────────────────────────────────────────
(OUT_DIR / "frases.json").write_text(
    json.dumps(frases, ensure_ascii=False, indent=0), encoding="utf-8"
)
(OUT_DIR / "topics.json").write_text(
    json.dumps(top_topics, ensure_ascii=False, indent=2), encoding="utf-8"
)
(OUT_DIR / "stats.json").write_text(
    json.dumps(stats, ensure_ascii=False, indent=2), encoding="utf-8"
)

print(f"OK: {len(frases)} frases procesadas")
print(f"     {len(top_topics)} topics detectados")
print(f"     {stats['palabras_totales']} palabras totales")
print(f"     Outputs en {OUT_DIR}")
