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
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Literal, Annotated
from datetime import datetime, timezone

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


class TripInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    notes: str = ""
    origin: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    waypoints: List[str] = []
    mode: TravelMode = "driving"


class Trip(BaseDocument, TripInput):
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


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
    return {"message": "Pianificatore Viaggio API"}


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
    trip = Trip(**clean(data))
    res = await db.trips.insert_one(trip.to_mongo())
    trip.id = str(res.inserted_id)
    return serialize(trip)


@api_router.put("/trips/{trip_id}")
async def update_trip(trip_id: str, data: TripInput):
    oid = to_oid(trip_id)
    update = {**clean(data), "updated_at": now_iso()}
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
    copy = Trip(**{**src.model_dump(include=set(TripInput.model_fields)), "name": f"{src.name} (copia)"})
    res = await db.trips.insert_one(copy.to_mongo())
    copy.id = str(res.inserted_id)
    return serialize(copy)


@api_router.delete("/trips/{trip_id}")
async def delete_trip(trip_id: str):
    res = await db.trips.delete_one({"_id": to_oid(trip_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Viaggio non trovato")
    return {"ok": True}


app.include_router(api_router)

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
