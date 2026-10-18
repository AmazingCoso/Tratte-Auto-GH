from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from bson.errors import InvalidId
import os
import re
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator, field_validator
from typing import List, Optional, Literal, Annotated
from datetime import datetime, timezone, date
from routing import router as route_router, compute_legs, write_xlsx, fmt_duration, RouteInput
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]
TravelMode = Literal["driving", "walking", "bicycling", "transit"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    @classmethod
    def from_mongo(cls, doc: dict):
        return cls.model_validate(doc)

    def to_mongo(self) -> dict:
        data = self.model_dump(by_alias=True, exclude={"id"})
        if self.id:
            data["_id"] = ObjectId(self.id)
        return data


def today_iso() -> str:
    return datetime.now(timezone.utc).date().isoformat()


class TripDates(BaseModel):
    date: str = Field(default_factory=today_iso)
    leg_dates: List[str] = []

    @field_validator("date")
    @classmethod
    def valid_date(cls, v: str) -> str:
        date.fromisoformat(v)
        return v

    @field_validator("leg_dates")
    @classmethod
    def valid_leg_dates(cls, v: List[str]) -> List[str]:
        for d in v:
            if d:
                date.fromisoformat(d)
        return v


class TripInput(TripDates):
    name: str = Field(min_length=1, max_length=120)
    notes: str = ""
    origin: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    waypoints: List[str] = []
    mode: TravelMode = "driving"


class Trip(BaseDocument, TripInput):
    legs: Optional[list] = None
    total_km: Optional[float] = None
    total_min: Optional[float] = None
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


async def legs_for(d: dict) -> dict:
    try:
        r = await compute_legs(RouteInput(**{k: d[k] for k in ("origin", "destination", "waypoints", "mode")}))
        return {"legs": r["legs"], "total_km": r["total_km"], "total_min": r["total_min"]}
    except (HTTPException, httpx.HTTPError, ValueError):
        return {"legs": None, "total_km": None, "total_min": None}


def serialize(trip: Trip) -> dict:
    data = trip.model_dump(by_alias=False)
    return data


def to_oid(trip_id: str) -> ObjectId:
    try:
        return ObjectId(trip_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Viaggio non trovato")


def clean(data: TripInput) -> dict:
    d = data.model_dump()
    d["waypoints"] = [w.strip() for w in d["waypoints"] if w.strip()]
    return d


@api_router.get("/")
async def root():
    return {"message": "Tratte Auto API"}


@api_router.get("/trips")
async def list_trips(q: Optional[str] = None):
    query = {}
    if q:
        rx = {"$regex": re.escape(q), "$options": "i"}
        query = {"$or": [{"name": rx}, {"notes": rx}, {"origin": rx}, {"destination": rx}, {"waypoints": rx}]}
    docs = await db.trips.find(query).sort("updated_at", -1).to_list(500)
    return [serialize(Trip.from_mongo(d)) for d in docs]


@api_router.get("/trips/{trip_id}")
async def get_trip(trip_id: str):
    doc = await db.trips.find_one({"_id": to_oid(trip_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Viaggio non trovato")
    return serialize(Trip.from_mongo(doc))


@api_router.post("/trips")
async def create_trip(data: TripInput):
    d = clean(data)
    trip = Trip(**d, **(await legs_for(d)))
    res = await db.trips.insert_one(trip.to_mongo())
    trip.id = str(res.inserted_id)
    return serialize(trip)


@api_router.put("/trips/{trip_id}")
async def update_trip(trip_id: str, data: TripInput):
    oid = to_oid(trip_id)
    d = clean(data)
    update = {**d, **(await legs_for(d)), "updated_at": now_iso()}
    res = await db.trips.update_one({"_id": oid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Viaggio non trovato")
    doc = await db.trips.find_one({"_id": oid})
    return serialize(Trip.from_mongo(doc))


@api_router.post("/trips/{trip_id}/duplicate")
async def duplicate_trip(trip_id: str):
    doc = await db.trips.find_one({"_id": to_oid(trip_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Viaggio non trovato")
    src = Trip.from_mongo(doc)
    copy = Trip(**{**src.model_dump(exclude={"id", "created_at", "updated_at"}), "name": f"{src.name} (copia)"})
    res = await db.trips.insert_one(copy.to_mongo())
    copy.id = str(res.inserted_id)
    return serialize(copy)


@api_router.patch("/trips/{trip_id}/dates")
async def update_trip_dates(trip_id: str, data: TripDates):
    oid = to_oid(trip_id)
    res = await db.trips.update_one({"_id": oid}, {"$set": {**data.model_dump(exclude_unset=True), "updated_at": now_iso()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Viaggio non trovato")
    return serialize(Trip.from_mongo(await db.trips.find_one({"_id": oid})))


@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str):
    res = await db.trips.delete_one({"_id": to_oid(trip_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Viaggio non trovato")
    return {"ok": True}


class PlaceInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=80)
    address: str = Field(min_length=1, max_length=300)


class Place(BaseDocument, PlaceInput):
    created_at: str = Field(default_factory=now_iso)


@api_router.get("/places")
async def list_places():
    docs = await db.places.find().sort("name", 1).collation({"locale": "it"}).to_list(1000)
    return [Place.from_mongo(d).model_dump() for d in docs]


@api_router.post("/places")
async def create_place(data: PlaceInput):
    place = Place(name=data.name.strip(), address=data.address.strip())
    res = await db.places.insert_one(place.to_mongo())
    place.id = str(res.inserted_id)
    return place.model_dump()


@api_router.put("/places/{place_id}")
async def update_place(place_id: str, data: PlaceInput):
    oid = to_oid(place_id)
    res = await db.places.update_one({"_id": oid}, {"$set": {"name": data.name.strip(), "address": data.address.strip()}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Luogo non trovato")
    return Place.from_mongo(await db.places.find_one({"_id": oid})).model_dump()


@api_router.delete("/places/{place_id}")
async def delete_place(place_id: str):
    res = await db.places.delete_one({"_id": to_oid(place_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Luogo non trovato")
    return {"ok": True}



async def monthly_rows(month: str) -> list:
    if not re.fullmatch(r"\d{4}-\d{2}", month):
        raise HTTPException(status_code=422, detail="Mese non valido (AAAA-MM)")
    docs = await db.trips.find({"legs": {"$ne": None}}).to_list(2000)
    rows = []
    for doc in docs:
        t = Trip.from_mongo(doc)
        for i, leg in enumerate(t.legs or []):
            d = (t.leg_dates[i] if i < len(t.leg_dates) else "") or t.date
            if d.startswith(month):
                rows.append({"date": d, "trip": t.name, "trip_id": t.id, **leg})
    rows.sort(key=lambda r: (r["date"], r["trip"], r["index"]))
    return rows


@api_router.get("/reports/monthly")
async def monthly_report(month: str):
    rows = await monthly_rows(month)
    return {
        "month": month,
        "trips": len({r["trip_id"] for r in rows}),
        "legs": len(rows),
        "total_km": round(sum(r["distance_km"] for r in rows), 2),
        "total_min": round(sum(r["duration_min"] for r in rows), 1),
    }


@api_router.get("/reports/monthly/excel")
async def monthly_report_excel(month: str):
    rows = await monthly_rows(month)
    days: dict = {}
    for r in rows:
        days.setdefault(r["date"], []).append(r)
    data = []
    for d, legs in days.items():
        stops = []
        for leg in legs:
            for s in (leg["from"], leg["to"]):
                if not stops or stops[-1] != s:
                    stops.append(s)
        trips = ", ".join(dict.fromkeys(leg["trip"] for leg in legs))
        data.append([date.fromisoformat(d), trips, " → ".join(stops), round(sum(leg["distance_km"] for leg in legs), 2)])
    headers = ["Data", "Viaggio", "Percorso", "Distanza (km)"]
    return write_xlsx(f"Report km mensile {month}", f"{len(data)} giorni", headers, data, 0, f"report_km_{month}.xlsx")


app.include_router(api_router)
app.include_router(route_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
