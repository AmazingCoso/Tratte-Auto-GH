"""Backend tests for Pianificatore Viaggio - /api/trips CRUD."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://trattative-team-3.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    yield s
    # Cleanup TEST_ prefixed trips
    try:
        r = s.get(f"{API}/trips", params={"q": "TEST_"})
        for t in r.json():
            if t.get("name", "").startswith("TEST_"):
                s.delete(f"{API}/trips/{t['id']}")
    except Exception:
        pass


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# ---------- Validation ----------
def test_create_missing_name_422(session):
    r = session.post(f"{API}/trips", json={"origin": "A", "destination": "B"})
    assert r.status_code == 422


def test_create_missing_origin_422(session):
    r = session.post(f"{API}/trips", json={"name": "TEST_x", "destination": "B"})
    assert r.status_code == 422


def test_create_missing_destination_422(session):
    r = session.post(f"{API}/trips", json={"name": "TEST_x", "origin": "A"})
    assert r.status_code == 422


# ---------- Create ----------
def test_create_trip_strips_blank_waypoints_and_persists(session):
    payload = {
        "name": "TEST_Milano Roma",
        "notes": "TEST_promemoria",
        "origin": "Milano",
        "destination": "Roma",
        "waypoints": ["Bologna", "  ", "", "Firenze"],
        "mode": "driving",
    }
    r = session.post(f"{API}/trips", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["name"] == "TEST_Milano Roma"
    assert data["origin"] == "Milano"
    assert data["destination"] == "Roma"
    assert data["waypoints"] == ["Bologna", "Firenze"]
    assert data["mode"] == "driving"
    assert "id" in data and data["id"]
    assert "_id" not in data

    # GET persistence check
    g = session.get(f"{API}/trips/{data['id']}")
    assert g.status_code == 200
    assert g.json()["waypoints"] == ["Bologna", "Firenze"]


# ---------- List + search ----------
def test_list_and_search(session):
    # Seed a couple
    t1 = session.post(f"{API}/trips", json={"name": "TEST_Alpha", "origin": "Torino", "destination": "Genova", "notes": "mare", "waypoints": ["Asti"], "mode": "driving"}).json()
    t2 = session.post(f"{API}/trips", json={"name": "TEST_Beta", "origin": "Napoli", "destination": "Bari", "mode": "transit"}).json()

    r = session.get(f"{API}/trips")
    assert r.status_code == 200
    ids = [t["id"] for t in r.json()]
    assert t1["id"] in ids and t2["id"] in ids

    # case-insensitive search by name
    r = session.get(f"{API}/trips", params={"q": "test_alpha"})
    assert any(t["id"] == t1["id"] for t in r.json())

    # search by origin
    r = session.get(f"{API}/trips", params={"q": "napoli"})
    assert any(t["id"] == t2["id"] for t in r.json())

    # search by waypoint
    r = session.get(f"{API}/trips", params={"q": "ASTI"})
    assert any(t["id"] == t1["id"] for t in r.json())

    # search by notes
    r = session.get(f"{API}/trips", params={"q": "mare"})
    assert any(t["id"] == t1["id"] for t in r.json())


# ---------- Update ----------
def test_update_trip(session):
    created = session.post(f"{API}/trips", json={"name": "TEST_Upd", "origin": "A", "destination": "B", "mode": "driving"}).json()
    tid = created["id"]
    up = session.put(f"{API}/trips/{tid}", json={"name": "TEST_Upd2", "origin": "A2", "destination": "B2", "mode": "walking", "waypoints": ["C"]})
    assert up.status_code == 200
    assert up.json()["name"] == "TEST_Upd2"
    assert up.json()["mode"] == "walking"
    g = session.get(f"{API}/trips/{tid}").json()
    assert g["origin"] == "A2" and g["waypoints"] == ["C"]


# ---------- Duplicate ----------
def test_duplicate_trip(session):
    created = session.post(f"{API}/trips", json={"name": "TEST_Dup", "origin": "X", "destination": "Y", "mode": "driving"}).json()
    r = session.post(f"{API}/trips/{created['id']}/duplicate")
    assert r.status_code == 200
    dup = r.json()
    assert dup["name"] == "TEST_Dup (copia)"
    assert dup["id"] != created["id"]
    assert dup["origin"] == "X" and dup["destination"] == "Y"


# ---------- Delete ----------
def test_delete_trip(session):
    created = session.post(f"{API}/trips", json={"name": "TEST_Del", "origin": "A", "destination": "B"}).json()
    r = session.delete(f"{API}/trips/{created['id']}")
    assert r.status_code == 200
    g = session.get(f"{API}/trips/{created['id']}")
    assert g.status_code == 404


# ---------- 404 ----------
def test_get_invalid_id_404(session):
    assert session.get(f"{API}/trips/not-an-oid").status_code == 404


def test_get_missing_id_404(session):
    assert session.get(f"{API}/trips/507f1f77bcf86cd799439011").status_code == 404


def test_update_missing_id_404(session):
    r = session.put(f"{API}/trips/507f1f77bcf86cd799439011", json={"name": "TEST_x", "origin": "A", "destination": "B"})
    assert r.status_code == 404


def test_delete_missing_id_404(session):
    assert session.delete(f"{API}/trips/507f1f77bcf86cd799439011").status_code == 404


def test_duplicate_missing_id_404(session):
    assert session.post(f"{API}/trips/507f1f77bcf86cd799439011/duplicate").status_code == 404
