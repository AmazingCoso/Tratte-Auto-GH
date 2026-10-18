import asyncio
import io
import re
from datetime import date as Date
from typing import List, Literal, Optional

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/route")

UA = {"User-Agent": "RutaPianificatoreViaggio/1.0"}
PROFILES = {"driving": "routed-car", "walking": "routed-foot", "bicycling": "routed-bike", "transit": "routed-car"}
COORD_RX = re.compile(r"^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$")
MODE_LABELS = {"driving": "Auto", "walking": "A piedi", "bicycling": "In bici", "transit": "Mezzi pubblici (stima su strada)"}
_geo_cache: dict = {}
_geo_lock = asyncio.Lock()


class RouteInput(BaseModel):
    origin: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    waypoints: List[str] = []
    mode: Literal["driving", "walking", "bicycling", "transit"] = "driving"


class ExcelInput(RouteInput):
    date: Date
    name: Optional[str] = None


async def geocode(client: httpx.AsyncClient, query: str):
    m = COORD_RX.match(query)
    if m:
        return float(m.group(1)), float(m.group(2))
    key = query.strip().lower()
    if key in _geo_cache:
        return _geo_cache[key]
    async with _geo_lock:  # Nominatim policy: max 1 req/s
        r = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1, "accept-language": "it"},
        )
        await asyncio.sleep(1)
    data = r.json() if r.status_code == 200 else []
    if not data:
        raise HTTPException(status_code=422, detail=f"Indirizzo non trovato: {query}")
    _geo_cache[key] = (float(data[0]["lat"]), float(data[0]["lon"]))
    return _geo_cache[key]


async def compute_legs(data: RouteInput) -> dict:
    stops = [data.origin.strip(), *[w.strip() for w in data.waypoints if w.strip()], data.destination.strip()]
    async with httpx.AsyncClient(headers=UA, timeout=20) as client:
        coords = [await geocode(client, s) for s in stops]
        path = ";".join(f"{lon},{lat}" for lat, lon in coords)
        r = await client.get(
            f"https://routing.openstreetmap.de/{PROFILES[data.mode]}/route/v1/driving/{path}",
            params={"overview": "false"},
        )
    body = r.json() if r.status_code == 200 else {}
    if body.get("code") != "Ok":
        raise HTTPException(status_code=422, detail="Impossibile calcolare il percorso tra queste località")
    legs = [
        {
            "index": i + 1,
            "from": stops[i],
            "to": stops[i + 1],
            "distance_km": round(leg["distance"] / 1000, 2),
            "duration_min": round(leg["duration"] / 60, 1),
        }
        for i, leg in enumerate(body["routes"][0]["legs"])
    ]
    return {
        "legs": legs,
        "total_km": round(sum(l["distance_km"] for l in legs), 2),
        "total_min": round(sum(l["duration_min"] for l in legs), 1),
        "mode": data.mode,
    }


def fmt_duration(minutes: float) -> str:
    h, m = divmod(int(round(minutes)), 60)
    return f"{h} h {m:02d} min" if h else f"{m} min"


@router.post("/legs")
async def route_legs(data: RouteInput):
    return await compute_legs(data)


@router.post("/excel")
async def route_excel(data: ExcelInput):
    result = await compute_legs(data)
    wb = Workbook()
    ws = wb.active
    ws.title = "Tratte"
    bold = Font(bold=True)
    head_fill = PatternFill("solid", fgColor="0F172A")
    thin = Side(style="thin", color="E2E8F0")

    ws["A1"] = data.name or "Viaggio"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = f"Mezzo: {MODE_LABELS[data.mode]}"

    headers = ["N°", "Data", "Partenza", "Arrivo", "Distanza (km)", "Durata (min)", "Durata"]
    ws.append([])
    ws.append(headers)
    for cell in ws[4]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = head_fill
        cell.alignment = Alignment(horizontal="center")

    for leg in result["legs"]:
        ws.append([leg["index"], data.date, leg["from"], leg["to"], leg["distance_km"], leg["duration_min"], fmt_duration(leg["duration_min"])])

    last = ws.max_row
    ws.append(["", "", "", "TOTALE", f"=SUM(E5:E{last})", f"=SUM(F5:F{last})", fmt_duration(result["total_min"])])
    for cell in ws[ws.max_row]:
        cell.font = bold
        cell.fill = PatternFill("solid", fgColor="F1F5F9")

    for row in ws.iter_rows(min_row=4, max_row=ws.max_row):
        for cell in row:
            cell.border = Border(top=thin, bottom=thin, left=thin, right=thin)
        row[1].number_format = "DD/MM/YYYY"
        row[4].number_format = "0.00"
        row[5].number_format = "0.0"

    for col, width in zip("ABCDEFG", [6, 12, 36, 36, 15, 14, 14]):
        ws.column_dimensions[col].width = width

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"tratte_{data.date.isoformat()}.xlsx"
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
